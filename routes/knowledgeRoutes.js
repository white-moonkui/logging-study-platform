const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/KnowledgeController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取知识点详情（含文件）
router.get('/:id', knowledgeController.getDetails);

// 创建知识点
router.post('/', requireRole(['admin']), knowledgeController.create);

router.put('/:id', requireRole(['admin']), knowledgeController.update);

router.delete('/:id', requireRole(['admin']), knowledgeController.delete);

module.exports = router;
