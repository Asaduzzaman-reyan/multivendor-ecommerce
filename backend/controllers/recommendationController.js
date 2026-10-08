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
  WHERE p.status = 'approved' AND p.stock > 0
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

function getRecommendations(req, res, next) {
  try {
    const database = getDatabase();
    const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 8));
    const activities = database.prepare(`
      SELECT p.category_id AS categoryId, p.brand_id AS brandId,
        a.activity_type AS activityType, COUNT(*) AS activityCount
      FROM user_activity a
      LEFT JOIN products p ON p.id = a.product_id
      WHERE a.user_id = ? AND a.created_at >= datetime('now', '-90 days')
      GROUP BY p.category_id, p.brand_id, a.activity_type
    `).all(req.user.id);
    const categoryScores = new Map();
    const brandScores = new Map();
    const weights = { search: 1, view: 2, cart: 4, purchase: 6 };
    activities.forEach((activity) => {
      const score = (weights[activity.activityType] || 1) * Number(activity.activityCount);
      if (activity.categoryId) categoryScores.set(activity.categoryId, (categoryScores.get(activity.categoryId) || 0) + score);
      if (activity.brandId) brandScores.set(activity.brandId, (brandScores.get(activity.brandId) || 0) + score);
    });

    const rows = database.prepare(`
      ${productSelect}
      ORDER BY
        CASE WHEN p.category_id IN (SELECT category_id FROM user_activity ua
          JOIN products up ON up.id = ua.product_id WHERE ua.user_id = ?) THEN 1 ELSE 0 END DESC,
        CASE WHEN p.brand_id IN (SELECT brand_id FROM user_activity ua
          JOIN products up ON up.id = ua.product_id WHERE ua.user_id = ? AND up.brand_id IS NOT NULL) THEN 1 ELSE 0 END DESC,
        p.sales_count DESC, averageRating DESC, p.created_at DESC
      LIMIT ?
    `).all(req.user.id, req.user.id, limit);

    const recommendations = rows.map((row) => {
      const categoryScore = categoryScores.get(row.categoryId) || 0;
      const brandScore = brandScores.get(row.brandId) || 0;
      return {
        ...mapProduct(row),
        recommendationScore: categoryScore * 2 + brandScore + Number(row.salesCount) * 0.1 + Number(row.averageRating),
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json({
      recommendations,
      basedOnActivity: activities.length > 0,
      activityCount: activities.reduce((total, activity) => total + Number(activity.activityCount), 0),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getRecommendations };
