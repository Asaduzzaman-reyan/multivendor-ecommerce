const express = require('express');

const { simulatePayment } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/payments/simulate', authenticate, simulatePayment);

module.exports = router;
