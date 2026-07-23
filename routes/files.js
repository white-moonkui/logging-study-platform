const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const FileController = require('../controllers/fileController');

// 文件上传
router.post(
    '/upload',
    authenticateToken,
    FileController.getUploadMiddleware(),
    FileController.upload
);

// 流式播放（视频）
router.get('/:id/stream', authenticateToken, FileController.stream);

// 获取预览信息
router.get('/:id/preview', authenticateToken, FileController.preview);

// 下载文件
router.get('/:id/download', authenticateToken, FileController.download);

// 删除文件
router.delete('/:id', authenticateToken, FileController.delete);

module.exports = router;
