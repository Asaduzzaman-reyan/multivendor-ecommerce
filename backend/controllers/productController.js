const { getDatabase } = require('../config/database');

const sortColumns = {
  newest: 'p.created_at DESC',
  price_asc: 'COALESCE(p.discount_price, p.price) ASC, p.id DESC',
  price_desc: 'COALESCE(p.discount_price, p.price) DESC, p.id DESC',
  popularity: 'p.sales_count DESC, p.views DESC, p.created_at DESC',
  rating: 'average_rating DESC, review_count DESC, p.created_at DESC',
};

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    fail(`${field} must be a non-negative integer`);
  }
  return number;
}

function productPayload(body) {
  const name = text(body.name);
  const description = text(body.description);
  const categoryId = Number(body.categoryId);
  const brandId = body.brandId === undefined || body.brandId === null || body.brandId === ''
    ? null
    : Number(body.brandId);
  const price = Number(body.price);
  const discountPrice = body.discountPrice === undefined || body.discountPrice === null || body.discountPrice === ''
    ? null
    : Number(body.discountPrice);
  const stock = Number(body.stock);
  const image = text(body.image) || null;

  if (!name || name.length > 200) fail('Product name is required and must be 200 characters or fewer');
  if (!Number.isInteger(categoryId) || categoryId < 1) fail('A valid category is required');
  if (brandId !== null && (!Number.isInteger(brandId) || brandId < 1)) fail('Brand must be a valid id');
  if (!Number.isFinite(price) || price < 0) fail('Price must be a non-negative number');
  if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price)) {
    fail('Discount price must be between zero and the original price');
  }
  if (!Number.isInteger(stock) || stock < 0) fail('Stock must be a non-negative integer');

  return { name, description, categoryId, brandId, price, discountPrice, stock, image };
}

function ensureReferences(payload) {
  const database = getDatabase();
  if (!database.prepare('SELECT id FROM categories WHERE id = ?').get(payload.categoryId)) {
    fail('Category not found', 404);
  }
  if (payload.brandId !== null && !database.prepare('SELECT id FROM brands WHERE id = ?').get(payload.brandId)) {
    fail('Brand not found', 404);
  }
}

const productSelect = `
  SELECT p.id, p.name, p.description, p.price, p.discount_price AS discountPrice,
    p.stock, p.image, p.status, p.views, p.sales_count AS salesCount,
    p.created_at AS createdAt, p.updated_at AS updatedAt,
    v.id AS vendorId, v.store_name AS storeName,
    c.id AS categoryId, c.name AS categoryName,
    b.id AS brandId, b.name AS brandName,
    COALESCE(AVG(r.rating), 0) AS averageRating,
    COUNT(r.id) AS reviewCount
  FROM products p
  JOIN vendors v ON v.id = p.vendor_id
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN reviews r ON r.product_id = p.id
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
    updatedAt: row.updatedAt,
    vendor: { id: Number(row.vendorId), storeName: row.storeName },
    category: { id: Number(row.categoryId), name: row.categoryName },
    brand: row.brandId ? { id: Number(row.brandId), name: row.brandName } : null,
    averageRating: Number(Number(row.averageRating).toFixed(2)),
    reviewCount: Number(row.reviewCount),
  };
}

function listProducts(req, res, next) {
  try {
    const database = getDatabase();
    const conditions = ['p.status = ?', 'v.status = ?'];
    const params = ['approved', 'approved'];
    const query = text(req.query.q);
    if (query && req.user) {
      database.prepare(`
        INSERT INTO user_activity (user_id, activity_type, search_term)
        VALUES (?, 'search', ?)
      `).run(req.user.id, query);
    }
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const brandId = req.query.brandId ? Number(req.query.brandId) : null;

    if (query) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
      const pattern = `%${query}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    if (categoryId !== null) {
      if (!Number.isInteger(categoryId) || categoryId < 1) fail('categoryId must be a valid integer');
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (brandId !== null) {
      if (!Number.isInteger(brandId) || brandId < 1) fail('brandId must be a valid integer');
      conditions.push('p.brand_id = ?');
      params.push(brandId);
    }
    if (req.query.minPrice !== undefined) {
      const minPrice = Number(req.query.minPrice);
      if (!Number.isFinite(minPrice) || minPrice < 0) fail('minPrice must be a non-negative number');
      conditions.push('COALESCE(p.discount_price, p.price) >= ?');
      params.push(minPrice);
    }
    if (req.query.maxPrice !== undefined) {
      const maxPrice = Number(req.query.maxPrice);
      if (!Number.isFinite(maxPrice) || maxPrice < 0) fail('maxPrice must be a non-negative number');
      conditions.push('COALESCE(p.discount_price, p.price) <= ?');
      params.push(maxPrice);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const where = conditions.join(' AND ');
    const order = sortColumns[req.query.sort] || sortColumns.newest;
    const count = database.prepare(`
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p JOIN vendors v ON v.id = p.vendor_id
      LEFT JOIN brands b ON b.id = p.brand_id
      JOIN categories c ON c.id = p.category_id
      WHERE ${where}
    `).get(...params).total;
    const rows = database.prepare(`
      ${productSelect}
      WHERE ${where}
      GROUP BY p.id
      ORDER BY ${order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      products: rows.map(mapProduct),
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
    });
  } catch (error) {
    next(error);
  }
}

function getProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) fail('A valid product id is required');
    const database = getDatabase();
    const row = database.prepare(`
      ${productSelect}
      WHERE p.id = ? AND p.status = 'approved' AND v.status = 'approved'
      GROUP BY p.id
    `).get(id);
    if (!row) fail('Product not found', 404);
    database.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(id);
    if (req.user) {
      database.prepare(`
        INSERT INTO user_activity (user_id, product_id, activity_type)
        VALUES (?, ?, 'view')
      `).run(req.user.id, id);
    }
    const images = database.prepare(
      'SELECT id, image_url AS imageUrl FROM product_images WHERE product_id = ? ORDER BY id ASC',
    ).all(id).map((image) => ({ id: Number(image.id), imageUrl: image.imageUrl }));
    const related = database.prepare(`
      ${productSelect}
      WHERE p.id != ? AND p.status = 'approved' AND v.status = 'approved'
        AND (p.category_id = ? OR (p.brand_id IS NOT NULL AND p.brand_id = ?))
      GROUP BY p.id
      ORDER BY (p.category_id = ?) DESC, (p.brand_id = ?) DESC, p.sales_count DESC
      LIMIT 8
    `).all(id, row.categoryId, row.brandId || -1, row.categoryId, row.brandId || -1)
      .map(mapProduct);
    res.json({ product: mapProduct(row), images, relatedProducts: related });
  } catch (error) {
    next(error);
  }
}

function vendorIdForUser(userId) {
  const vendor = getDatabase().prepare('SELECT id FROM vendors WHERE user_id = ?').get(userId);
  if (!vendor) fail('Vendor profile not found', 404);
  return Number(vendor.id);
}

function createProduct(req, res, next) {
  try {
    const payload = productPayload(req.body);
    ensureReferences(payload);
    const vendorId = vendorIdForUser(req.user.id);
    const result = getDatabase().prepare(`
      INSERT INTO products
        (vendor_id, category_id, brand_id, name, description, price, discount_price, stock, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(vendorId, payload.categoryId, payload.brandId, payload.name, payload.description,
      payload.price, payload.discountPrice, payload.stock, payload.image);
    res.status(201).json({ message: 'Product submitted for approval', productId: Number(result.lastInsertRowid) });
  } catch (error) {
    next(error);
  }
}

function listVendorProducts(req, res, next) {
  try {
    const vendorId = vendorIdForUser(req.user.id);
    const rows = getDatabase().prepare(`
      ${productSelect}
      WHERE p.vendor_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all(vendorId);
    res.json({ products: rows.map(mapProduct) });
  } catch (error) {
    next(error);
  }
}

function updateVendorProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) fail('A valid product id is required');
    const payload = productPayload(req.body);
    ensureReferences(payload);
    const vendorId = vendorIdForUser(req.user.id);
    const result = getDatabase().prepare(`
      UPDATE products SET category_id = ?, brand_id = ?, name = ?, description = ?,
        price = ?, discount_price = ?, stock = ?, image = ?, status = 'pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND vendor_id = ?
    `).run(payload.categoryId, payload.brandId, payload.name, payload.description,
      payload.price, payload.discountPrice, payload.stock, payload.image, id, vendorId);
    if (!result.changes) fail('Product not found', 404);
    res.json({ message: 'Product updated and submitted for approval' });
  } catch (error) {
    next(error);
  }
}

function deleteVendorProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) fail('A valid product id is required');
    const vendorId = vendorIdForUser(req.user.id);
    const result = getDatabase().prepare('DELETE FROM products WHERE id = ? AND vendor_id = ?').run(id, vendorId);
    if (!result.changes) fail('Product not found', 404);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

function listAllProducts(req, res, next) {
  try {
    const rows = getDatabase().prepare(`
      ${productSelect}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    res.json({ products: rows.map(mapProduct) });
  } catch (error) {
    next(error);
  }
}

function updateProductStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const status = text(req.body.status);
    if (!Number.isInteger(id) || id < 1) fail('A valid product id is required');
    if (!['approved', 'rejected', 'pending'].includes(status)) fail('Invalid product status');
    const result = getDatabase().prepare('UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, id);
    if (!result.changes) fail('Product not found', 404);
    res.json({ message: `Product ${status}`, status });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  listVendorProducts,
  updateVendorProduct,
  deleteVendorProduct,
  listAllProducts,
  updateProductStatus,
};
