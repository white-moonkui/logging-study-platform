/**
 * 报告路由
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取报告列表（用户只能查看自己的，管理员可查看所有）
router.get('/', authenticateToken, reportController.getReportList);

// 培训效果评估（趋势数据）— 必须在 /:id 之前注册
router.get('/training-effect', authenticateToken, reportController.getTrainingEffect);

// 获取报告详情
router.get('/:id', authenticateToken, reportController.getReportDetail);

// 生成培训报告
router.post('/generate/training', authenticateToken, reportController.generateTrainingReport);

// 生成考核报告
router.post('/generate/assessment', authenticateToken, reportController.generateAssessmentReport);

// 生成综合报告
router.post(
    '/generate/comprehensive',
    authenticateToken,
    reportController.generateComprehensiveReport
);

// 删除报告
router.delete('/:id', authenticateToken, reportController.deleteReport);

// 导出培训报告 PDF
router.get('/:id/export/training', authenticateToken, reportController.exportTrainingReportPDF);

// 导出考核报告 PDF
router.get('/:id/export/assessment', authenticateToken, reportController.exportAssessmentReportPDF);

module.exports = router;
