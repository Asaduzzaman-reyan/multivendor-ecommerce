const express = require('express');

const {
  getHome,
  getTrendingProducts,
  getNewArrivals,
  getBestSellingProducts,
  getTopBrands,
} = require('../controllers/homeController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getHome);
router.get('/personalized', authenticate, getHome);
router.get('/trending', getTrendingProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellingProducts);
router.get('/top-brands', getTopBrands);

module.exports = router;
