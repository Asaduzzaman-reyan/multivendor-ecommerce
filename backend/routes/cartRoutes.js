const express = require('express');

const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/cart', authenticate, cartController.listCart);
router.post('/cart', authenticate, cartController.addItem);
router.put('/cart/:id', authenticate, cartController.updateItem);
router.delete('/cart/:id', authenticate, cartController.removeItem);

module.exports = router;
