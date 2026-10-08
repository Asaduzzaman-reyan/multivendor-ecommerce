const express = require('express');

const { getRecommendations } = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/recommendations', authenticate, getRecommendations);

module.exports = router;
