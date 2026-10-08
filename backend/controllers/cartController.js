const { getDatabase } = require('../config/database');

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) fail(`${field} must be a positive integer`);
  return number;
}

function getCart(userId) {
  const database = getDatabase();
  let cart = database.prepare('SELECT id FROM carts WHERE user_id = ?').get(userId);
  if (!cart) {
    const result = database.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
    cart = { id: Number(result.lastInsertRowid) };
  }

  const items = database.prepare(`
    SELECT ci.id, ci.product_id AS productId, ci.quantity, ci.price,
      p.name, p.image, p.stock, p.discount_price AS discountPrice,
      v.store_name AS storeName, v.id AS vendorId,
      (ci.quantity * ci.price) AS subtotal
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN vendors v ON v.id = p.vendor_id
    WHERE ci.cart_id = ?
    ORDER BY ci.id DESC
  `).all(cart.id).map((item) => ({
    id: Number(item.id),
    productId: Number(item.productId),
    name: item.name,
    image: item.image,
    vendor: { id: Number(item.vendorId), storeName: item.storeName },
    quantity: Number(item.quantity),
    price: Number(item.price),
    discountPrice: item.discountPrice === null ? null : Number(item.discountPrice),
    stock: Number(item.stock),
    subtotal: Number(item.subtotal),
  }));

  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
  return { id: Number(cart.id), items, subtotal, itemCount: items.reduce((total, item) => total + item.quantity, 0) };
}

function listCart(req, res, next) {
  try {
    res.json({ cart: getCart(req.user.id) });
  } catch (error) {
    next(error);
  }
}

function addItem(req, res, next) {
  try {
    const productId = positiveInteger(req.body.productId, 'productId');
    const quantity = positiveInteger(req.body.quantity || 1, 'quantity');
    const database = getDatabase();
    const product = database.prepare(`
      SELECT p.id, p.price, p.discount_price AS discountPrice, p.stock
      FROM products p JOIN vendors v ON v.id = p.vendor_id
      WHERE p.id = ? AND p.status = 'approved' AND v.status = 'approved'
    `).get(productId);
    if (!product) fail('Product not found', 404);

    const cart = database.prepare('SELECT id FROM carts WHERE user_id = ?').get(req.user.id)
      || { id: Number(database.prepare('INSERT INTO carts (user_id) VALUES (?)').run(req.user.id).lastInsertRowid) };
    const existing = database.prepare('SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?')
      .get(cart.id, productId);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) fail(`Only ${product.stock} item(s) are available`, 409);
    const price = product.discountPrice ?? product.price;

    if (existing) {
      database.prepare('UPDATE cart_items SET quantity = ?, price = ? WHERE cart_id = ? AND product_id = ?')
        .run(nextQuantity, price, cart.id, productId);
    } else {
      database.prepare('INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)')
        .run(cart.id, productId, quantity, price);
    }
    database.prepare(`
      INSERT INTO user_activity (user_id, product_id, activity_type) VALUES (?, ?, 'cart')
    `).run(req.user.id, productId);
    res.status(201).json({ cart: getCart(req.user.id) });
  } catch (error) {
    next(error);
  }
}

function updateItem(req, res, next) {
  try {
    const itemId = positiveInteger(req.params.id, 'cart item id');
    const quantity = positiveInteger(req.body.quantity, 'quantity');
    const database = getDatabase();
    const item = database.prepare(`
      SELECT ci.product_id AS productId, p.stock
      FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
      JOIN products p ON p.id = ci.product_id
      WHERE ci.id = ? AND c.user_id = ?
    `).get(itemId, req.user.id);
    if (!item) fail('Cart item not found', 404);
    if (quantity > item.stock) fail(`Only ${item.stock} item(s) are available`, 409);
    database.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, itemId);
    res.json({ cart: getCart(req.user.id) });
  } catch (error) {
    next(error);
  }
}

function removeItem(req, res, next) {
  try {
    const itemId = positiveInteger(req.params.id, 'cart item id');
    const result = getDatabase().prepare(`
      DELETE FROM cart_items
      WHERE id = ? AND cart_id IN (SELECT id FROM carts WHERE user_id = ?)
    `).run(itemId, req.user.id);
    if (!result.changes) fail('Cart item not found', 404);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listCart, addItem, updateItem, removeItem };
