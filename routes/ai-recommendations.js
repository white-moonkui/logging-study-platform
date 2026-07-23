const express = require('express');
const router = express.Router();
const aiRecommendationController = require('../controllers/aiRecommendationController');
const { authenticateToken } = require('../middleware/auth');

// 获取AI学习建议
router.get('/recommendations', authenticateToken, aiRecommendationController.getRecommendations);

// 记录学习活动
router.post('/activity', authenticateToken, aiRecommendationController.recordActivity);

// 获取学习进度统计
router.get('/progress-stats', authenticateToken, aiRecommendationController.getProgressStats);

module.exports = router;
