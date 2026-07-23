const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const knowledgeInteractionController = require('../controllers/knowledgeInteractionController');

// 收藏相关
router.post('/favorites', authenticateToken, knowledgeInteractionController.favorite);
router.delete(
    '/favorites/:knowledgeId',
    authenticateToken,
    knowledgeInteractionController.unfavorite
);
router.get('/favorites', authenticateToken, knowledgeInteractionController.getFavorites);

// 评论相关
router.post('/:knowledgeId/comments', authenticateToken, knowledgeInteractionController.addComment);
router.get('/:knowledgeId/comments', knowledgeInteractionController.getComments);
router.post(
    '/comments/:commentId/helpful',
    authenticateToken,
    knowledgeInteractionController.helpfulComment
);
router.delete(
    '/comments/:commentId',
    authenticateToken,
    knowledgeInteractionController.deleteComment
);

// 统计相关
router.get('/:knowledgeId/statistics', knowledgeInteractionController.getStatistics);

module.exports = router;
