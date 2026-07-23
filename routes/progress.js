const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 所有进度路由都需要认证
router.use(authenticateToken);

/**
 * @route   POST /api/progress/update
 * @desc    更新学习进度
 * @access  Private
 */
router.post('/update', progressController.updateProgress);

/**
 * @route   GET /api/progress/:knowledgeId
 * @desc    获取指定知识点的学习进度
 * @access  Private
 */
router.get('/:knowledgeId', progressController.getProgress);

/**
 * @route   GET /api/progress/:knowledgeId/:fileId
 * @desc    获取指定文件的学习进度
 * @access  Private
 */
router.get('/:knowledgeId/:fileId', progressController.getFileProgress);

/**
 * @route   POST /api/progress/:knowledgeId/notes
 * @desc    添加笔记
 * @access  Private
 */
router.post('/:knowledgeId/notes', progressController.addNote);

/**
 * @route   PUT /api/progress/:knowledgeId/notes/:noteId
 * @desc    更新笔记
 * @access  Private
 */
router.put('/:knowledgeId/notes/:noteId', progressController.updateNote);

/**
 * @route   DELETE /api/progress/:knowledgeId/notes/:noteId
 * @desc    删除笔记
 * @access  Private
 */
router.delete('/:knowledgeId/notes/:noteId', progressController.deleteNote);

/**
 * @route   GET /api/progress/:knowledgeId/notes
 * @desc    获取笔记列表
 * @access  Private
 */
router.get('/:knowledgeId/notes', progressController.getNotes);

/**
 * @route   GET /api/progress/stats/overview
 * @desc    获取用户学习统计
 * @access  Private
 */
router.get('/stats/overview', progressController.getStats);

/**
 * @route   GET /api/progress/recent/list
 * @desc    获取最近学习记录
 * @access  Private
 */
router.get('/recent/list', progressController.getRecentProgress);

/**
 * @route   POST /api/progress/:knowledgeId/heartbeat
 * @desc    学习时长心跳上报（每30s）
 * @access  Private
 */
router.post('/:knowledgeId/heartbeat', progressController.heartbeat);

/**
 * @route   GET /api/progress/admin/stats
 * @desc    获取所有用户的学习统计（管理员）
 * @access  Private/Admin+Instructor
 */
router.get('/admin/stats', requireRole(['admin']), progressController.getAllStats);

module.exports = router;
