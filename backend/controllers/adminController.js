const { getDatabase } = require('../config/database');
const { isValidOrderTransition } = require('../utils/orderStatus');

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function statistics(_req, res, next) {
  try {
    const database = getDatabase();
    const row = database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM vendors) AS vendors,
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE payment_status IN ('paid', 'pending')) AS revenue,
        (SELECT COUNT(*) FROM vendors WHERE status = 'pending') AS pendingVendors,
        (SELECT COUNT(*) FROM products WHERE status = 'pending') AS pendingProducts
    `).get();
    res.json({
      statistics: {
        users: Number(row.users),
        vendors: Number(row.vendors),
        products: Number(row.products),
        orders: Number(row.orders),
        revenue: Number(row.revenue),
        pendingVendors: Number(row.pendingVendors),
        pendingProducts: Number(row.pendingProducts),
      },
    });
  } catch (error) {
    next(error);
  }
}

function listUsers(_req, res, next) {
  try {
    const users = getDatabase().prepare(`
      SELECT id, name, phone, email, address, role, is_active AS isActive, created_at AS createdAt
      FROM users ORDER BY created_at DESC
    `).all().map((user) => ({ ...user, id: Number(user.id), isActive: Boolean(user.isActive) }));
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

function updateUserStatus(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const isActive = req.body.isActive === true || req.body.isActive === 1;
    if (!Number.isInteger(userId) || userId < 1) fail('A valid user id is required');
    if (userId === req.user.id) fail('You cannot disable your own admin account', 409);
    const result = getDatabase().prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, userId);
    if (!result.changes) fail('User not found', 404);
    res.json({ userId, isActive });
  } catch (error) {
    next(error);
  }
}

function deleteUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId < 1) fail('A valid user id is required');
    if (userId === req.user.id) fail('You cannot delete your own admin account', 409);
    const result = getDatabase().prepare('DELETE FROM users WHERE id = ?').run(userId);
    if (!result.changes) fail('User not found', 404);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      error.statusCode = 409;
      error.message = 'This user has related records and cannot be deleted';
    }
    next(error);
  }
}

function listVendors(_req, res, next) {
  try {
    const vendors = getDatabase().prepare(`
      SELECT v.id, v.user_id AS userId, v.store_name AS storeName,
        v.store_description AS storeDescription, v.status, v.created_at AS createdAt,
        u.name, u.email, u.phone
      FROM vendors v JOIN users u ON u.id = v.user_id ORDER BY v.created_at DESC
    `).all().map((vendor) => ({ ...vendor, id: Number(vendor.id), userId: Number(vendor.userId) }));
    res.json({ vendors });
  } catch (error) {
    next(error);
  }
}

function updateVendorStatus(req, res, next) {
  try {
    const vendorId = Number(req.params.id);
    const status = typeof req.body.status === 'string' ? req.body.status : '';
    if (!Number.isInteger(vendorId) || vendorId < 1) fail('A valid vendor id is required');
    if (!['approved', 'rejected', 'pending'].includes(status)) fail('Invalid vendor status');
    const result = getDatabase().prepare('UPDATE vendors SET status = ? WHERE id = ?').run(status, vendorId);
    if (!result.changes) fail('Vendor not found', 404);
    res.json({ vendorId, status });
  } catch (error) {
    next(error);
  }
}

function listOrders(_req, res, next) {
  try {
    const orders = getDatabase().prepare(`
      SELECT o.id, o.user_id AS userId, u.name AS buyerName, u.email AS buyerEmail,
        o.total_amount AS totalAmount, o.delivery_charge AS deliveryCharge,
        o.final_amount AS finalAmount, o.payment_method AS paymentMethod,
        o.payment_status AS paymentStatus, o.order_status AS orderStatus,
        o.shipping_address AS shippingAddress, o.created_at AS createdAt
      FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC
    `).all().map((order) => ({ ...order, id: Number(order.id), userId: Number(order.userId) }));
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

function updateOrderStatus(req, res, next) {
  try {
    const orderId = Number(req.params.id);
    const status = typeof req.body.status === 'string' ? req.body.status : '';
    if (!Number.isInteger(orderId) || orderId < 1) fail('A valid order id is required');
    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      fail('Invalid order status');
    }
    const database = getDatabase();
    const order = database.prepare('SELECT order_status AS orderStatus FROM orders WHERE id = ?').get(orderId);
    if (!order) fail('Order not found', 404);
    if (!isValidOrderTransition(order.orderStatus, status)) {
      fail(`Order cannot move from ${order.orderStatus} to ${status}`, 409);
    }
    const result = database.prepare('UPDATE orders SET order_status = ? WHERE id = ?').run(status, orderId);
    if (!result.changes) fail('Order status was not changed', 409);
    res.json({ orderId, orderStatus: status });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  statistics,
  listUsers,
  updateUserStatus,
  deleteUser,
  listVendors,
  updateVendorStatus,
  listOrders,
  updateOrderStatus,
};
