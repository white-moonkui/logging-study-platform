const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/KnowledgeController');
const vectorSearchController = require('../controllers/vectorSearchController');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// 获取知识列表（游客可访问）
router.get('/', optionalAuth, (req, res) => knowledgeController.getKnowledgeList(req, res));

// 获取知识详情（游客可访问）
router.get('/:id', optionalAuth, (req, res) => knowledgeController.getKnowledgeDetail(req, res));

// 搜索知识内容（游客可访问）
router.get('/search', optionalAuth, (req, res) => knowledgeController.searchKnowledge(req, res));

// 获取推荐知识（需要认证）
router.get('/recommended', authenticateToken, (req, res) => knowledgeController.getRecommendedKnowledge(req, res));

// 向量搜索（需要认证）
router.post('/vector-search', authenticateToken, (req, res) => vectorSearchController.vectorSearch(req, res));

// 获取向量化状态（需要认证）
router.get('/:id/vector-status', authenticateToken, (req, res) => vectorSearchController.getVectorStatus(req, res));

// 手动触发向量化（需要认证）
router.post('/:id/vectorize', authenticateToken, (req, res) => vectorSearchController.triggerVectorization(req, res));

// 创建知识内容（管理员）
router.post('/', authenticateToken, requireRole(['admin']), (req, res) => knowledgeController.createKnowledge(req, res));

// 更新知识内容（管理员）
router.put('/:id', authenticateToken, requireRole(['admin']), (req, res) => knowledgeController.updateKnowledge(req, res));

// 删除知识内容（管理员）
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => knowledgeController.deleteKnowledge(req, res));

// 智能生成题目（需要认证）
router.post('/:id/generate-quiz', authenticateToken, (req, res) => knowledgeController.generateQuiz(req, res));

module.exports = router;
