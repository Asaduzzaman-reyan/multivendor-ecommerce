const express = require('express');

const productController = require('../controllers/productController');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/products', optionalAuthenticate, productController.listProducts);
router.get('/products/:id', optionalAuthenticate, productController.getProduct);

router.get('/admin/products', authenticate, requireRole('admin'), productController.listAllProducts);
router.put('/admin/products/:id/status', authenticate, requireRole('admin'), productController.updateProductStatus);

module.exports = router;
