const { getDatabase } = require('../config/database');

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function getWishlist(userId) {
  const database = getDatabase();
  return database.prepare(`
    SELECT w.id, w.product_id AS productId, w.created_at AS createdAt,
      p.name, p.description, p.price, p.discount_price AS discountPrice,
      p.stock, p.image, p.views, p.sales_count AS salesCount,
      v.id AS vendorId, v.store_name AS storeName,
      c.id AS categoryId, c.name AS categoryName,
      b.id AS brandId, b.name AS brandName,
      COALESCE(AVG(r.rating), 0) AS averageRating, COUNT(r.id) AS reviewCount
    FROM wishlist w
    JOIN products p ON p.id = w.product_id AND p.status = 'approved'
    JOIN vendors v ON v.id = p.vendor_id AND v.status = 'approved'
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN reviews r ON r.product_id = p.id
    WHERE w.user_id = ?
    GROUP BY w.id
    ORDER BY w.created_at DESC, w.id DESC
  `).all(userId).map((item) => ({
    id: Number(item.id),
    productId: Number(item.productId),
    name: item.name,
    description: item.description,
    price: Number(item.price),
    discountPrice: item.discountPrice === null ? null : Number(item.discountPrice),
    stock: Number(item.stock),
    image: item.image,
    views: Number(item.views),
    salesCount: Number(item.salesCount),
    createdAt: item.createdAt,
    vendor: { id: Number(item.vendorId), storeName: item.storeName },
    category: { id: Number(item.categoryId), name: item.categoryName },
    brand: item.brandId ? { id: Number(item.brandId), name: item.brandName } : null,
    averageRating: Number(Number(item.averageRating).toFixed(2)),
    reviewCount: Number(item.reviewCount),
  }));
}

function listWishlist(req, res, next) {
  try {
    const items = getWishlist(req.user.id);
    res.json({ items, count: items.length });
  } catch (error) {
    next(error);
  }
}

function addWishlistItem(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) fail('Product id must be a positive integer');
    const database = getDatabase();
    const product = database.prepare(`
      SELECT p.id FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE p.id = ? AND p.status = 'approved' AND v.status = 'approved'
    `).get(productId);
    if (!product) fail('Product not found', 404);
    database.prepare('INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)')
      .run(req.user.id, productId);
    res.status(201).json({ items: getWishlist(req.user.id) });
  } catch (error) {
    next(error);
  }
}

function removeWishlistItem(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) fail('Product id must be a positive integer');
    const result = getDatabase().prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?')
      .run(req.user.id, productId);
    if (!result.changes) fail('Wishlist item not found', 404);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listWishlist, addWishlistItem, removeWishlistItem };
