const express = require('express');
const router = express.Router();
const controller = require('../controllers/trainingCycleController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 管理员查看指定学员的培训周期历史
router.get('/admin/:userId/history', authenticateToken, requireRole(['admin']), controller.adminGetStudentHistory);

// 学员专用：培训周期管理（仅学员可操作）
router.use(authenticateToken);

router.post('/start', requireRole(['student']), controller.startCycle);
router.get('/current', requireRole(['student']), controller.getCurrent);
router.get('/history', requireRole(['student']), controller.getHistory);
router.get('/:id', requireRole(['student']), controller.getDetail);
router.post('/:id/evaluate', requireRole(['student']), controller.evaluate);
router.post('/:id/remediate', requireRole(['student']), controller.remediate);
router.post('/:id/retest', requireRole(['student']), controller.completeRetest);
router.put('/:id/knowledge/:knowledgeId/complete', requireRole(['student']), controller.completeKnowledgeItem);

module.exports = router;
