const express = require('express');

const catalogController = require('../controllers/catalogController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

function registerResource(resourceName) {
  router.get(`/${resourceName}`, catalogController.list(resourceName));
  router.post(
    `/${resourceName}`,
    authenticate,
    requireRole('admin'),
    catalogController.create(resourceName),
  );
  router.put(
    `/${resourceName}/:id`,
    authenticate,
    requireRole('admin'),
    catalogController.update(resourceName),
  );
  router.delete(
    `/${resourceName}/:id`,
    authenticate,
    requireRole('admin'),
    catalogController.remove(resourceName),
  );
}

registerResource('categories');
registerResource('brands');

module.exports = router;
