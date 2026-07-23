const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// GET 路由 — 游客可访问，有 token 则解析
router.get('/tree', optionalAuth, categoryController.getTree);
router.get('/', optionalAuth, categoryController.getAll);
router.get('/stats', optionalAuth, categoryController.getStats);

// 写操作 — 需要认证 + 角色
router.post('/', authenticateToken, requireRole(['admin']), categoryController.create);
router.put('/:id', authenticateToken, requireRole(['admin']), categoryController.update);
router.delete('/:id', authenticateToken, requireRole(['admin']), categoryController.delete);

module.exports = router;
