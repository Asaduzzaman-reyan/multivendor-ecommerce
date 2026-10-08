const { getDatabase } = require('../config/database');

const deliveryCharges = {
  inside_dhaka: 80,
  outside_dhaka: 150,
};

const paymentMethods = new Set(['bkash', 'nagad', 'cash_on_delivery']);

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function getCartForCheckout(userId) {
  const database = getDatabase();
  const cart = database.prepare('SELECT id FROM carts WHERE user_id = ?').get(userId);
  if (!cart) fail('Your cart is empty', 400);

  const items = database.prepare(`
    SELECT ci.product_id AS productId, ci.quantity,
      COALESCE(p.discount_price, p.price) AS price, p.stock, p.name,
      p.vendor_id AS vendorId, v.store_name AS storeName
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN vendors v ON v.id = p.vendor_id
    WHERE ci.cart_id = ? AND p.status = 'approved' AND v.status = 'approved'
  `).all(cart.id);

  if (!items.length) fail('Your cart is empty', 400);

  const normalizedItems = items.map((item) => {
    if (item.quantity > item.stock) {
      fail(`${item.name} does not have enough stock`, 409);
    }
    return {
      productId: Number(item.productId),
      name: item.name,
      vendor: { id: Number(item.vendorId), storeName: item.storeName },
      quantity: Number(item.quantity),
      price: Number(item.price),
      subtotal: Number(item.price) * Number(item.quantity),
    };
  });

  return {
    items: normalizedItems,
    subtotal: normalizedItems.reduce((total, item) => total + item.subtotal, 0),
  };
}

function validateCheckout(body, user) {
  const deliveryLocation = typeof body.deliveryLocation === 'string' ? body.deliveryLocation : '';
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : '';
  const shippingAddress = typeof body.shippingAddress === 'string'
    ? body.shippingAddress.trim()
    : '';

  if (!Object.prototype.hasOwnProperty.call(deliveryCharges, deliveryLocation)) {
    fail('Delivery location must be inside_dhaka or outside_dhaka');
  }
  if (!paymentMethods.has(paymentMethod)) fail('Invalid payment method');
  if (!shippingAddress) fail('Shipping address is required');
  if (shippingAddress.length > 500) fail('Shipping address must be 500 characters or fewer');

  return {
    customer: {
      name: user.name,
      phone: user.phone,
      email: user.email,
    },
    deliveryLocation,
    deliveryCharge: deliveryCharges[deliveryLocation],
    paymentMethod,
    shippingAddress,
  };
}

function getCheckout(req, res, next) {
  try {
    res.json({
      checkout: {
        cart: getCartForCheckout(req.user.id),
        customer: {
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
          address: req.user.address,
        },
        deliveryOptions: [
          { value: 'inside_dhaka', label: 'Inside Dhaka', charge: 80 },
          { value: 'outside_dhaka', label: 'Outside Dhaka', charge: 150 },
        ],
        paymentMethods: [
          { value: 'bkash', label: 'bKash', type: 'online' },
          { value: 'nagad', label: 'Nagad', type: 'online' },
          { value: 'cash_on_delivery', label: 'Cash on Delivery', type: 'offline' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
}

function previewCheckout(req, res, next) {
  try {
    const checkout = validateCheckout(req.body, req.user);
    const cart = getCartForCheckout(req.user.id);
    const finalAmount = cart.subtotal + checkout.deliveryCharge;
    res.json({
      preview: {
        ...checkout,
        cart,
        totalAmount: cart.subtotal,
        finalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCheckout,
  previewCheckout,
  getCartForCheckout,
  validateCheckout,
};
