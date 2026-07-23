const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// 获取案例列表（游客可访问）
router.get('/', optionalAuth, caseController.getCaseList);

// 获取案例模板（在 /:id 之前定义）
router.get('/template', authenticateToken, caseController.getCaseTemplate);

// 获取案例详情（游客可访问）
router.get('/:id', optionalAuth, caseController.getCaseDetail);

// 提取关键词
router.post('/extract-keywords', authenticateToken, caseController.extractKeywords);

// 创建案例（需要认证）
router.post('/', authenticateToken, caseController.createCase);

// AI评估案例（需要管理员权限）
router.post(
    '/:id/evaluate',
    authenticateToken,
    requireRole(['admin']),
    caseController.evaluateCase
);

// 人工审核案例（需要管理员权限）
router.post(
    '/:id/review',
    authenticateToken,
    requireRole(['admin']),
    caseController.reviewCase
);

// 开始互动式案例学习
router.post('/:id/interactive', authenticateToken, caseController.startInteractiveCase);

// 提交互动答案
router.post('/:id/submit-answer', authenticateToken, caseController.submitInteractiveAnswer);

module.exports = router;
