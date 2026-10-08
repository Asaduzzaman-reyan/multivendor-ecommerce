const express = require('express');

const vendorController = require('../controllers/vendorController');
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireApprovedVendor } = require('../middleware/roleMiddleware');

const router = express.Router();
const vendorOnly = [authenticate, requireApprovedVendor];

router.get('/vendor/profile', ...vendorOnly, vendorController.getProfile);
router.put('/vendor/profile', ...vendorOnly, vendorController.updateProfile);
router.get('/vendor/orders', ...vendorOnly, vendorController.listOrders);
router.put('/vendor/orders/:id/status', ...vendorOnly, vendorController.updateOrderStatus);
router.get('/vendor/statistics', ...vendorOnly, vendorController.getStatistics);
router.get('/vendor/products', ...vendorOnly, productController.listVendorProducts);
router.post('/vendor/products', ...vendorOnly, productController.createProduct);
router.put('/vendor/products/:id', ...vendorOnly, productController.updateVendorProduct);
router.delete('/vendor/products/:id', ...vendorOnly, productController.deleteVendorProduct);

module.exports = router;
