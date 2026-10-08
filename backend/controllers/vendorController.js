const { getDatabase } = require('../config/database');
const { isValidOrderTransition } = require('../utils/orderStatus');

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function getVendor(userId) {
  const vendor = getDatabase().prepare(`
    SELECT v.id, v.user_id AS userId, v.store_name AS storeName,
      v.store_description AS storeDescription, v.logo, v.status, v.created_at AS createdAt,
      u.name, u.phone, u.email, u.address
    FROM vendors v JOIN users u ON u.id = v.user_id WHERE v.user_id = ?
  `).get(userId);
  if (!vendor) fail('Vendor profile not found', 404);
  return vendor;
}

function getProfile(req, res, next) {
  try {
    res.json({ vendor: getVendor(req.user.id) });
  } catch (error) {
    next(error);
  }
}

function updateProfile(req, res, next) {
  try {
    const storeName = typeof req.body.storeName === 'string' ? req.body.storeName.trim() : '';
    const storeDescription = typeof req.body.storeDescription === 'string'
      ? req.body.storeDescription.trim()
      : '';
    const logo = typeof req.body.logo === 'string' ? req.body.logo.trim() : '';
    if (!storeName || storeName.length > 120) fail('Store name is required and must be 120 characters or fewer');
    if (storeDescription.length > 1000) fail('Store description must be 1000 characters or fewer');
    const database = getDatabase();
    const duplicate = database.prepare('SELECT id FROM vendors WHERE store_name = ? AND user_id != ?')
      .get(storeName, req.user.id);
    if (duplicate) fail('A store with this name already exists', 409);
    database.prepare(`
      UPDATE vendors SET store_name = ?, store_description = ?, logo = ? WHERE user_id = ?
    `).run(storeName, storeDescription, logo || null, req.user.id);
    res.json({ vendor: getVendor(req.user.id) });
  } catch (error) {
    next(error);
  }
}

function listOrders(req, res, next) {
  try {
    const vendor = getVendor(req.user.id);
    const orders = getDatabase().prepare(`
      SELECT DISTINCT o.id, o.user_id AS userId, o.order_status AS orderStatus,
        o.payment_status AS paymentStatus, o.shipping_address AS shippingAddress,
        o.created_at AS createdAt
      FROM orders o JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.vendor_id = ? ORDER BY o.created_at DESC, o.id DESC
    `).all(vendor.id);
    const items = getDatabase().prepare(`
      SELECT oi.order_id AS orderId, oi.product_id AS productId, oi.quantity,
        oi.price, oi.subtotal, p.name
      FROM order_items oi JOIN products p ON p.id = oi.product_id
      WHERE oi.vendor_id = ? ORDER BY oi.order_id DESC
    `).all(vendor.id);
    res.json({
      orders: orders.map((order) => ({
        ...order,
        id: Number(order.id),
        items: items.filter((item) => Number(item.orderId) === Number(order.id)),
      })),
    });
  } catch (error) {
    next(error);
  }
}

function updateOrderStatus(req, res, next) {
  try {
    const orderId = Number(req.params.id);
    const status = typeof req.body.status === 'string' ? req.body.status : '';
    if (!Number.isInteger(orderId) || orderId < 1) fail('A valid order id is required');
    if (!['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      fail('Invalid vendor order status');
    }
    const vendor = getVendor(req.user.id);
    const database = getDatabase();
    const exists = database.prepare('SELECT id FROM order_items WHERE order_id = ? AND vendor_id = ?')
      .get(orderId, vendor.id);
    if (!exists) fail('Order not found for this vendor', 404);
    const order = database.prepare('SELECT order_status AS orderStatus FROM orders WHERE id = ?').get(orderId);
    if (!order || !isValidOrderTransition(order.orderStatus, status)) {
      fail(`Order cannot move from ${order?.orderStatus || 'unknown'} to ${status}`, 409);
    }
    database.prepare('UPDATE orders SET order_status = ? WHERE id = ?').run(status, orderId);
    res.json({ orderId, orderStatus: status });
  } catch (error) {
    next(error);
  }
}

function getStatistics(req, res, next) {
  try {
    const vendor = getVendor(req.user.id);
    const database = getDatabase();
    const stats = database.prepare(`
      SELECT
        COUNT(DISTINCT p.id) AS productCount,
        COALESCE(SUM(oi.quantity), 0) AS unitsSold,
        COALESCE(SUM(oi.subtotal), 0) AS grossSales,
        COUNT(DISTINCT oi.order_id) AS orderCount
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id AND oi.vendor_id = ?
      WHERE p.vendor_id = ?
    `).get(vendor.id, vendor.id);
    res.json({
      statistics: {
        productCount: Number(stats.productCount),
        unitsSold: Number(stats.unitsSold),
        grossSales: Number(stats.grossSales),
        orderCount: Number(stats.orderCount),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  listOrders,
  updateOrderStatus,
  getStatistics,
};
