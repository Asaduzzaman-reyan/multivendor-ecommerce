const { getCartForCheckout, validateCheckout } = require('./checkoutController');

const mobilePattern = /^(?:01\d{9}|\+8801\d{9})$/;
const transactionPattern = /^[A-Za-z0-9-]{6,40}$/;

function fail(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function simulatePayment(req, res, next) {
  try {
    const checkout = validateCheckout(req.body, req.user);
    const mobileNumber = typeof req.body.mobileNumber === 'string'
      ? req.body.mobileNumber.trim()
      : '';
    const transactionId = typeof req.body.transactionId === 'string'
      ? req.body.transactionId.trim()
      : '';

    if (checkout.paymentMethod === 'cash_on_delivery') {
      if (mobileNumber || transactionId) {
        fail('Cash on Delivery does not accept mobile or transaction details');
      }
    } else {
      if (!mobilePattern.test(mobileNumber)) {
        fail('Enter a valid Bangladesh mobile number for online payment');
      }
      if (!transactionPattern.test(transactionId)) {
        fail('Transaction ID must be 6 to 40 letters, numbers, or hyphens');
      }
    }

    const cart = getCartForCheckout(req.user.id);
    const amount = cart.subtotal + checkout.deliveryCharge;
    const paymentStatus = checkout.paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid';
    const paymentReference = checkout.paymentMethod === 'cash_on_delivery'
      ? `COD-${Date.now()}`
      : transactionId;

    res.json({
      payment: {
        status: paymentStatus,
        method: checkout.paymentMethod,
        reference: paymentReference,
        amount,
        simulated: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { simulatePayment };
