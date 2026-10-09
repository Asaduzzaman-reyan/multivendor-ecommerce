const express = require('express');

const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/orders', authenticate, orderController.placeOrder);
router.get('/orders', authenticate, orderController.listOrders);
router.get('/orders/:id', authenticate, orderController.getOrder);
router.put('/orders/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;
