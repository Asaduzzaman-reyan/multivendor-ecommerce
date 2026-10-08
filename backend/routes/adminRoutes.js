const express = require('express');

const adminController = require('../controllers/adminController');
const catalogController = require('../controllers/catalogController');
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
const adminOnly = [authenticate, requireRole('admin')];

router.get('/admin/statistics', ...adminOnly, adminController.statistics);
router.get('/admin/users', ...adminOnly, adminController.listUsers);
router.put('/admin/users/:id/status', ...adminOnly, adminController.updateUserStatus);
router.delete('/admin/users/:id', ...adminOnly, adminController.deleteUser);
router.get('/admin/vendors', ...adminOnly, adminController.listVendors);
router.put('/admin/vendors/:id/status', ...adminOnly, adminController.updateVendorStatus);
router.get('/admin/products', ...adminOnly, productController.listAllProducts);
router.put('/admin/products/:id/status', ...adminOnly, productController.updateProductStatus);
router.get('/admin/orders', ...adminOnly, adminController.listOrders);
router.put('/admin/orders/:id/status', ...adminOnly, adminController.updateOrderStatus);
router.get('/admin/categories', ...adminOnly, catalogController.list('categories'));
router.post('/admin/categories', ...adminOnly, catalogController.create('categories'));
router.put('/admin/categories/:id', ...adminOnly, catalogController.update('categories'));
router.delete('/admin/categories/:id', ...adminOnly, catalogController.remove('categories'));
router.get('/admin/brands', ...adminOnly, catalogController.list('brands'));
router.post('/admin/brands', ...adminOnly, catalogController.create('brands'));
router.put('/admin/brands/:id', ...adminOnly, catalogController.update('brands'));
router.delete('/admin/brands/:id', ...adminOnly, catalogController.remove('brands'));

module.exports = router;
