const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// 获取考试列表（游客可查看）
router.get('/', optionalAuth, examController.getExamList);

// 获取考试详情（游客可查看）
router.get('/:id', optionalAuth, examController.getExamDetail);

// 开始考试（仅学员）
router.post('/:id/start', authenticateToken, requireRole(['student']), examController.startExam);

// 提交考试（仅学员）
router.post('/:id/submit', authenticateToken, requireRole(['student']), examController.submitExam);

// 获取考试结果
router.get('/result/:id', authenticateToken, examController.getExamResult);

// 获取用户考试历史
router.get('/history/user', authenticateToken, examController.getUserExamHistory);

// 创建考试（管理员权限）
router.post(
    '/',
    authenticateToken,
    requireRole(['admin']),
    examController.createExam
);

// 智能生成考试（管理员权限）
router.post(
    '/generate',
    authenticateToken,
    requireRole(['admin']),
    examController.generateExam
);

module.exports = router;
