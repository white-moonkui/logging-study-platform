/**
 * 文档路由
 */

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取文档列表
router.get('/', authenticateToken, documentController.getDocumentList);

// 搜索文档
router.get('/search', authenticateToken, documentController.searchDocuments);

// 获取文档详情
router.get('/:id', authenticateToken, documentController.getDocumentDetail);

// 获取文档内容
router.get('/:id/content', authenticateToken, documentController.getDocumentContent);

// 上传文档（需要 multipart 支持）
router.post(
    '/upload',
    authenticateToken,
    requireRole(['admin']),
    documentController.uploadDocument
);

// 创建文档记录
router.post(
    '/',
    authenticateToken,
    requireRole(['admin']),
    documentController.createDocument
);

// 解析文档
router.post(
    '/:id/parse',
    authenticateToken,
    requireRole(['admin']),
    documentController.parseDocument
);

// 索引文档
router.post(
    '/:id/index',
    authenticateToken,
    requireRole(['admin']),
    documentController.indexDocument
);

// 更新文档
router.put(
    '/:id',
    authenticateToken,
    requireRole(['admin']),
    documentController.updateDocument
);

// 删除文档（软删除）
router.delete('/:id', authenticateToken, documentController.deleteDocument);

module.exports = router;
