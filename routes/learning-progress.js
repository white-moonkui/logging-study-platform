const express = require('express');
const router = express.Router();
const controller = require('../controllers/learningProgressController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// 获取当前用户的学习进度列表
router.get('/', controller.getProgress);

// 获取学习统计
router.get('/statistics', controller.getStatistics);

// 获取收藏列表
router.get('/bookmarks', controller.getBookmarks);

// 管理员查看指定学员的学习进度
router.get('/admin/:userId', requireRole(['admin']), controller.adminGetStudentProgress);

// 获取指定学习进度详情
router.get('/:id', controller.getProgressById);

// 开始学习某个知识
router.post('/knowledge/:knowledgeId', controller.startLearning);

// 更新文件进度
router.put('/:id/file', controller.updateFileProgress);

// 添加笔记
router.post('/:id/note', controller.addNote);

// 切换收藏状态
router.post('/:id/bookmark', controller.toggleBookmark);

// 删除学习进度
router.delete('/:id', controller.deleteProgress);

module.exports = router;
