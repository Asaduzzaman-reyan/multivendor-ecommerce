const { getDatabase } = require('../config/database');
const { getCartForCheckout, validateCheckout } = require('./checkoutController');

const mobilePattern = /^(?:01\d{9}|\+8801\d{9})$/;
const transactionPattern = /^[A-Za-z0-9-]{6,40}$/;

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function validatePayment(body, paymentMethod) {
  const mobileNumber = typeof body.mobileNumber === 'string' ? body.mobileNumber.trim() : '';
  const transactionId = typeof body.transactionId === 'string' ? body.transactionId.trim() : '';
  if (paymentMethod === 'cash_on_delivery') {
    if (mobileNumber || transactionId) fail('Cash on Delivery does not accept payment details');
    return { status: 'pending', reference: `COD-${Date.now()}` };
  }
  if (!mobilePattern.test(mobileNumber)) fail('Enter a valid Bangladesh mobile number for online payment');
  if (!transactionPattern.test(transactionId)) fail('Transaction ID must be 6 to 40 letters, numbers, or hyphens');
  return { status: 'paid', reference: transactionId };
}

function placeOrder(req, res, next) {
  try {
    const checkout = validateCheckout(req.body, req.user);
    const payment = validatePayment(req.body, checkout.paymentMethod);
    const database = getDatabase();
    const cart = getCartForCheckout(req.user.id);
    const finalAmount = cart.subtotal + checkout.deliveryCharge;
    database.exec('BEGIN');
    try {
      const orderResult = database.prepare(`
        INSERT INTO orders
          (user_id, total_amount, delivery_charge, final_amount, delivery_location,
           payment_method, payment_status, shipping_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, cart.subtotal, checkout.deliveryCharge, finalAmount,
        checkout.deliveryLocation, checkout.paymentMethod, payment.status, checkout.shippingAddress);
      const orderId = Number(orderResult.lastInsertRowid);
      const insertItem = database.prepare(`
        INSERT INTO order_items (order_id, product_id, vendor_id, quantity, price, subtotal)
        SELECT ?, p.id, p.vendor_id, ?, COALESCE(p.discount_price, p.price),
          ? * COALESCE(p.discount_price, p.price)
        FROM products p
        WHERE p.id = ? AND p.stock >= ? AND p.status = 'approved'
      `);
      for (const item of cart.items) {
        const result = insertItem.run(orderId, item.quantity, item.quantity, item.productId, item.quantity);
        if (!result.changes) fail(`${item.name} is no longer available in the requested quantity`, 409);
        const stockResult = database.prepare(`
          UPDATE products SET stock = stock - ?, sales_count = sales_count + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND stock >= ?
        `).run(item.quantity, item.quantity, item.productId, item.quantity);
        if (!stockResult.changes) fail(`${item.name} is no longer available in the requested quantity`, 409);
        database.prepare(`
          INSERT INTO user_activity (user_id, product_id, activity_type) VALUES (?, ?, 'purchase')
        `).run(req.user.id, item.productId);
      }
      const cartRow = database.prepare('SELECT id FROM carts WHERE user_id = ?').get(req.user.id);
      database.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cartRow.id);
      database.exec('COMMIT');
      return res.status(201).json({
        order: {
          id: orderId,
          totalAmount: cart.subtotal,
          deliveryCharge: checkout.deliveryCharge,
          finalAmount,
          paymentStatus: payment.status,
          paymentReference: payment.reference,
          orderStatus: 'pending',
        },
      });
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

function listOrders(req, res, next) {
  try {
    const orders = getDatabase().prepare(`
      SELECT id, total_amount AS totalAmount, delivery_charge AS deliveryCharge,
        final_amount AS finalAmount, delivery_location AS deliveryLocation,
        payment_method AS paymentMethod, payment_status AS paymentStatus,
        order_status AS orderStatus, shipping_address AS shippingAddress, created_at AS createdAt
      FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC
    `).all(req.user.id);
    res.json({ orders: orders.map((order) => ({ ...order, id: Number(order.id) })) });
  } catch (error) {
    next(error);
  }
}

function getOrder(req, res, next) {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId < 1) fail('A valid order id is required');
    const database = getDatabase();
    const order = database.prepare(`
      SELECT id, total_amount AS totalAmount, delivery_charge AS deliveryCharge,
        final_amount AS finalAmount, delivery_location AS deliveryLocation,
        payment_method AS paymentMethod, payment_status AS paymentStatus,
        order_status AS orderStatus, shipping_address AS shippingAddress, created_at AS createdAt
      FROM orders WHERE id = ? AND user_id = ?
    `).get(orderId, req.user.id);
    if (!order) fail('Order not found', 404);
    const items = database.prepare(`
      SELECT oi.product_id AS productId, oi.vendor_id AS vendorId, oi.quantity,
        oi.price, oi.subtotal, p.name, v.store_name AS storeName
      FROM order_items oi JOIN products p ON p.id = oi.product_id
      JOIN vendors v ON v.id = oi.vendor_id WHERE oi.order_id = ?
    `).all(orderId);
    res.json({ order: { ...order, id: Number(order.id), items } });
  } catch (error) {
    next(error);
  }
}

function cancelOrder(req, res, next) {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId < 1) fail('A valid order id is required');
    const database = getDatabase();
    const order = database.prepare(`
      SELECT id, order_status AS orderStatus
      FROM orders WHERE id = ? AND user_id = ?
    `).get(orderId, req.user.id);
    if (!order) fail('Order not found', 404);
    if (order.orderStatus !== 'pending') {
      fail('Only pending orders can be cancelled by the buyer', 409);
    }

    const items = database.prepare(`
      SELECT product_id AS productId, quantity
      FROM order_items WHERE order_id = ?
    `).all(orderId);
    database.exec('BEGIN');
    try {
      for (const item of items) {
        const restored = database.prepare(`
          UPDATE products
          SET stock = stock + ?, sales_count = MAX(0, sales_count - ?),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(item.quantity, item.quantity, item.productId);
        if (!restored.changes) fail('Unable to restore cancelled order inventory', 409);
      }
      database.prepare('UPDATE orders SET order_status = ? WHERE id = ?')
        .run('cancelled', orderId);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
    res.json({ orderId, orderStatus: 'cancelled' });
  } catch (error) {
    next(error);
  }
}

module.exports = { placeOrder, listOrders, getOrder, cancelOrder };
