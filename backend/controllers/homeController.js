const { getDatabase } = require('../config/database');

const productSelect = `
  SELECT p.id, p.name, p.description, p.price, p.discount_price AS discountPrice,
    p.stock, p.image, p.status, p.views, p.sales_count AS salesCount,
    p.created_at AS createdAt, v.id AS vendorId, v.store_name AS storeName,
    c.id AS categoryId, c.name AS categoryName, b.id AS brandId, b.name AS brandName,
    COALESCE(AVG(r.rating), 0) AS averageRating, COUNT(r.id) AS reviewCount
  FROM products p
  JOIN vendors v ON v.id = p.vendor_id AND v.status = 'approved'
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN reviews r ON r.product_id = p.id
  WHERE p.status = 'approved'
  GROUP BY p.id
`;

function mapProduct(row) {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    price: Number(row.price),
    discountPrice: row.discountPrice === null ? null : Number(row.discountPrice),
    stock: Number(row.stock),
    image: row.image,
    status: row.status,
    views: Number(row.views),
    salesCount: Number(row.salesCount),
    createdAt: row.createdAt,
    vendor: { id: Number(row.vendorId), storeName: row.storeName },
    category: { id: Number(row.categoryId), name: row.categoryName },
    brand: row.brandId ? { id: Number(row.brandId), name: row.brandName } : null,
    averageRating: Number(Number(row.averageRating).toFixed(2)),
    reviewCount: Number(row.reviewCount),
  };
}

function getProducts(database, order, limit = 8) {
  return database.prepare(`${productSelect} ORDER BY ${order} LIMIT ?`).all(limit).map(mapProduct);
}

function parseLimit(value, fallback = 8, maximum = 50) {
  const limit = Number.parseInt(value, 10);
  if (!Number.isInteger(limit) || limit < 1) return fallback;
  return Math.min(limit, maximum);
}

function getTrendingProducts(req, res, next) {
  try {
    const database = getDatabase();
    const limit = parseLimit(req.query.limit);
    const products = getProducts(
      database,
      `(p.views * 0.5) + (p.sales_count * 3) + (averageRating * 2)
        + CASE WHEN p.created_at >= datetime('now', '-30 days') THEN 10 ELSE 0 END DESC,
       p.sales_count DESC, averageRating DESC, p.created_at DESC`,
      limit,
    );
    res.json({ algorithm: 'views-sales-rating-recency', products });
  } catch (error) {
    next(error);
  }
}

function getNewArrivals(req, res, next) {
  try {
    const database = getDatabase();
    const limit = parseLimit(req.query.limit);
    const products = database.prepare(`
      ${productSelect}
      AND p.created_at >= datetime('now', '-30 days')
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ?
    `).all(limit).map(mapProduct);
    res.json({ algorithm: 'created-within-30-days', products });
  } catch (error) {
    next(error);
  }
}

function getBestSellingProducts(req, res, next) {
  try {
    const database = getDatabase();
    const limit = parseLimit(req.query.limit);
    const products = getProducts(
      database,
      'p.sales_count DESC, p.views DESC, averageRating DESC, p.created_at DESC',
      limit,
    );
    res.json({ algorithm: 'sales-count', products });
  } catch (error) {
    next(error);
  }
}

function getTopBrands(req, res, next) {
  try {
    const database = getDatabase();
    const limit = parseLimit(req.query.limit, 10);
    const brands = database.prepare(`
      SELECT b.id, b.name, b.logo, b.description,
        COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.sales_count ELSE 0 END), 0) AS salesCount,
        COALESCE(AVG(CASE WHEN p.status = 'approved' THEN r.rating END), 0) AS averageRating,
        COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) AS productCount
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id
      LEFT JOIN reviews r ON r.product_id = p.id
      GROUP BY b.id
      ORDER BY salesCount DESC, averageRating DESC, productCount DESC, b.name COLLATE NOCASE ASC
      LIMIT ?
    `).all(limit).map((brand) => ({
      ...brand,
      id: Number(brand.id),
      salesCount: Number(brand.salesCount),
      averageRating: Number(Number(brand.averageRating).toFixed(2)),
      productCount: Number(brand.productCount),
    }));
    res.json({ algorithm: 'sales-rating-product-count', brands });
  } catch (error) {
    next(error);
  }
}

function getHome(req, res, next) {
  try {
    const database = getDatabase();
    const categories = database.prepare(`
      SELECT id, name, description, image, created_at AS createdAt
      FROM categories ORDER BY name COLLATE NOCASE ASC
    `).all();
    const topBrands = database.prepare(`
      SELECT b.id, b.name, b.logo, b.description, COALESCE(SUM(p.sales_count), 0) AS salesCount
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id AND p.status = 'approved'
      GROUP BY b.id
      ORDER BY salesCount DESC, b.name COLLATE NOCASE ASC
      LIMIT 10
    `).all();

    const response = {
      categories,
      topBrands,
      trendingProducts: getProducts(database, 'p.views DESC, p.sales_count DESC, p.created_at DESC'),
      newArrivals: getProducts(database, 'p.created_at DESC'),
      bestSellingProducts: getProducts(database, 'p.sales_count DESC, p.views DESC, p.created_at DESC'),
      recommendedProducts: getProducts(database, 'p.sales_count DESC, averageRating DESC, p.created_at DESC'),
    };

    if (req.user) {
      const activity = database.prepare(`
        SELECT DISTINCT p.category_id AS categoryId
        FROM user_activity a
        JOIN products p ON p.id = a.product_id
        WHERE a.user_id = ? AND p.status = 'approved'
        ORDER BY a.created_at DESC LIMIT 5
      `).all(req.user.id);
      const categoryIds = activity.map((item) => item.categoryId);
      if (categoryIds.length) {
        const placeholders = categoryIds.map(() => '?').join(', ');
        response.recommendedProducts = database.prepare(`
          ${productSelect}
          AND p.category_id IN (${placeholders})
          ORDER BY p.sales_count DESC, averageRating DESC, p.created_at DESC
          LIMIT 8
        `).all(...categoryIds).map(mapProduct);
      }
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHome,
  getTrendingProducts,
  getNewArrivals,
  getBestSellingProducts,
  getTopBrands,
};
