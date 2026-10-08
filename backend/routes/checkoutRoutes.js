const express = require('express');

const checkoutController = require('../controllers/checkoutController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/checkout', authenticate, checkoutController.getCheckout);
router.post('/checkout/preview', authenticate, checkoutController.previewCheckout);

module.exports = router;
