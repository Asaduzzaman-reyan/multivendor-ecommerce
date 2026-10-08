const express = require('express');

const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
const protectedRoute = [authenticate];

router.get('/wishlist', ...protectedRoute, wishlistController.listWishlist);
router.post('/wishlist/:productId', ...protectedRoute, wishlistController.addWishlistItem);
router.delete('/wishlist/:productId', ...protectedRoute, wishlistController.removeWishlistItem);

module.exports = router;
