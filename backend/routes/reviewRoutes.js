const express = require('express');

const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/products/:productId/reviews', reviewController.listReviews);
router.post('/products/:productId/reviews', authenticate, reviewController.createReview);

module.exports = router;
