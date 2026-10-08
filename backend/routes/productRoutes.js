const express = require('express');

const productController = require('../controllers/productController');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');
const { requireApprovedVendor, requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/products', optionalAuthenticate, productController.listProducts);
router.get('/products/:id', optionalAuthenticate, productController.getProduct);

router.get('/vendor/products', authenticate, requireApprovedVendor, productController.listVendorProducts);
router.post('/vendor/products', authenticate, requireApprovedVendor, productController.createProduct);
router.put('/vendor/products/:id', authenticate, requireApprovedVendor, productController.updateVendorProduct);
router.delete('/vendor/products/:id', authenticate, requireApprovedVendor, productController.deleteVendorProduct);

router.get('/admin/products', authenticate, requireRole('admin'), productController.listAllProducts);
router.put('/admin/products/:id/status', authenticate, requireRole('admin'), productController.updateProductStatus);

module.exports = router;
