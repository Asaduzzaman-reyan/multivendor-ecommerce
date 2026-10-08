const { getDatabase } = require('../config/database');

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function getProductId(value) {
  const productId = Number(value);
  if (!Number.isInteger(productId) || productId < 1) fail('A valid product id is required');
  return productId;
}

function listReviews(req, res, next) {
  try {
    const productId = getProductId(req.params.productId);
    const database = getDatabase();
    const product = database.prepare('SELECT id FROM products WHERE id = ? AND status = ?').get(productId, 'approved');
    if (!product) fail('Product not found', 404);

    const reviews = database.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at AS createdAt,
        u.id AS userId, u.name AS userName
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC, r.id DESC
    `).all(productId).map((review) => ({
      id: Number(review.id),
      rating: Number(review.rating),
      comment: review.comment,
      createdAt: review.createdAt,
      user: { id: Number(review.userId), name: review.userName },
    }));

    const distribution = database.prepare(`
      SELECT rating, COUNT(*) AS count FROM reviews
      WHERE product_id = ? GROUP BY rating
    `).all(productId).reduce((result, row) => {
      result[row.rating] = Number(row.count);
      return result;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    res.json({ reviews, distribution });
  } catch (error) {
    next(error);
  }
}

function createReview(req, res, next) {
  try {
    const productId = getProductId(req.params.productId);
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    const orderId = Number(req.body.orderId);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      fail('Rating must be an integer between 1 and 5');
    }
    if (!Number.isInteger(orderId) || orderId < 1) fail('A valid order id is required');
    if (comment.length > 2000) fail('Comment must be 2000 characters or fewer');

    const database = getDatabase();
    const purchase = database.prepare(`
      SELECT oi.product_id
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.order_id = ? AND oi.product_id = ? AND o.user_id = ?
        AND o.order_status = 'delivered'
    `).get(orderId, productId, req.user.id);

    if (!purchase) {
      fail('You can review a product only after your delivered order', 403);
    }

    const duplicate = database.prepare(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?',
    ).get(req.user.id, productId, orderId);
    if (duplicate) fail('You have already reviewed this product for this order', 409);

    const result = database.prepare(`
      INSERT INTO reviews (user_id, product_id, order_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, productId, orderId, rating, comment);

    res.status(201).json({
      review: { id: Number(result.lastInsertRowid), rating, comment, orderId, productId },
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      error.statusCode = 409;
      error.message = 'You have already reviewed this product for this order';
    }
    next(error);
  }
}

module.exports = { listReviews, createReview };
