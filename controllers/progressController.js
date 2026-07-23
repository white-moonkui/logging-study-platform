const LearningProgress = require('../models/LearningProgress');

/**
 * 更新学习进度
 * POST /api/progress/update
 */
exports.updateProgress = async (req, res) => {
    try {
        const { knowledgeId, fileId, progress, position, completed } = req.body;
        const userId = req.userId;

        if (!knowledgeId || !fileId) {
            return res.status(400).json({ message: '知识ID和文件ID不能为空' });
        }

        let progressRecord = await LearningProgress.findOne({ userId, knowledgeId });

        if (!progressRecord) {
            progressRecord = new LearningProgress({ userId, knowledgeId, fileProgress: [] });
        }

        const fileIndex = progressRecord.fileProgress.findIndex(f => f.fileId.toString() === fileId);

        const fileProg = {
            fileId,
            progress: progress || 0,
            lastPosition: position || 0,
            status: completed ? 'completed' : (progress || 0) > 0 ? 'in-progress' : 'not-started',
            completedAt: completed ? new Date() : undefined,
        };

        if (fileIndex >= 0) {
            Object.assign(progressRecord.fileProgress[fileIndex], fileProg);
        } else {
            progressRecord.fileProgress.push(fileProg);
        }

        progressRecord.calculateOverallProgress();
        progressRecord.lastAccessedAt = new Date();
        await progressRecord.save();

        res.json({
            message: '进度更新成功',
            data: {
                overallProgress: progressRecord.overallProgress,
                overallStatus: progressRecord.overallStatus,
                fileProgress: progressRecord.fileProgress,
            },
        });
    } catch (error) {
        console.error('更新进度失败:', error);
        res.status(500).json({ message: '更新进度失败', error: error.message });
    }
};

/**
 * 获取学习进度
 * GET /api/progress/:knowledgeId
 */
exports.getProgress = async (req, res) => {
    try {
        const { knowledgeId } = req.params;
        const userId = req.userId;

        const progressRecord = await LearningProgress.findOne({ userId, knowledgeId });

        if (!progressRecord) {
            return res.json({
                message: '暂无学习记录',
                data: {
                    overallProgress: 0,
                    overallStatus: 'not-started',
                    fileProgress: [],
                },
            });
        }

        res.json({
            message: '获取进度成功',
            data: {
                overallProgress: progressRecord.overallProgress,
                overallStatus: progressRecord.overallStatus,
                fileProgress: progressRecord.fileProgress,
                notes: progressRecord.notes || [],
                lastAccessedAt: progressRecord.lastAccessedAt,
            },
        });
    } catch (error) {
        console.error('获取进度失败:', error);
        res.status(500).json({ message: '获取进度失败', error: error.message });
    }
};

/**
 * 获取指定文件的学习进度
 * GET /api/progress/:knowledgeId/:fileId
 */
exports.getFileProgress = async (req, res) => {
    try {
        const { knowledgeId, fileId } = req.params;
        const userId = req.userId;

        const progressRecord = await LearningProgress.findOne({ userId, knowledgeId });

        if (!progressRecord) {
            return res.json({
                message: '暂无学习记录',
                progress: 0,
                lastPosition: 0,
                status: 'not-started',
            });
        }

        const fileProg = progressRecord.fileProgress.find(f => f.fileId.toString() === fileId);

        if (!fileProg) {
            return res.json({
                message: '暂无文件学习记录',
                progress: 0,
                lastPosition: 0,
                status: 'not-started',
            });
        }

        res.json({
            message: '获取文件进度成功',
            progress: fileProg.progress,
            lastPosition: fileProg.lastPosition,
            status: fileProg.status,
        });
    } catch (error) {
        console.error('获取文件进度失败:', error);
        res.status(500).json({ message: '获取文件进度失败', error: error.message });
    }
};

/**
 * 添加笔记
 * POST /api/progress/:knowledgeId/notes
 */
exports.addNote = async (req, res) => {
    try {
        const { knowledgeId } = req.params;
        const { fileId, timestamp, content } = req.body;
        const userId = req.userId;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: '笔记内容不能为空' });
        }

        let progressRecord = await LearningProgress.findOne({ userId, knowledgeId });

        if (!progressRecord) {
            progressRecord = new LearningProgress({ userId, knowledgeId, fileProgress: [], notes: [] });
        }

        const note = { fileId, timestamp: timestamp || null, content: content.trim(), createdAt: new Date() };

        progressRecord.notes.push(note);
        await progressRecord.save();

        res.json({
            message: '笔记添加成功',
            data: {
                noteId: progressRecord.notes[progressRecord.notes.length - 1]._id,
                note,
            },
        });
    } catch (error) {
        console.error('添加笔记失败:', error);
        res.status(500).json({ message: '添加笔记失败', error: error.message });
    }
};

/**
 * 更新笔记
 * PUT /api/progress/:knowledgeId/notes/:noteId
 */
exports.updateNote = async (req, res) => {
    try {
        const { knowledgeId, noteId } = req.params;
        const { content } = req.body;
        const userId = req.userId;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: '笔记内容不能为空' });
        }

        const progressRecord = await LearningProgress.findOne({ userId, knowledgeId });

        if (!progressRecord) {
            return res.status(404).json({ message: '学习记录不存在' });
        }

        const note = progressRecord.notes.id(noteId);
        if (!note) {
            return res.status(404).json({ message: '笔记不存在' });
        }

        note.content = content.trim();
        note.updatedAt = new Date();
        await progressRecord.save();

        res.json({
            message: '笔记更新成功',
            data: { note },
        });
    } catch (error) {
        console.error('更新笔记失败:', error);
        res.status(500).json({ message: '更新笔记失败', error: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { knowledgeId, noteId } = req.params;
        const userId = req.userId;

        const progressRecord = await LearningProgress.findOne({ userId, knowledgeId });

        if (!progressRecord) {
            return res.status(404).json({ message: '学习记录不存在' });
        }

        const noteIndex = progressRecord.notes.findIndex(n => n._id.toString() === noteId);

        if (noteIndex === -1) {
            return res.status(404).json({ message: '笔记不存在' });
        }

        progressRecord.notes.splice(noteIndex, 1);
        await progressRecord.save();

        res.json({ message: '笔记删除成功' });
    } catch (error) {
        console.error('删除笔记失败:', error);
        res.status(500).json({ message: '删除笔记失败', error: error.message });
    }
};

/**
 * 获取笔记列表
 * GET /api/progress/:knowledgeId/notes
 */
exports.getNotes = async (req, res) => {
    try {
        const { knowledgeId } = req.params;
        const { fileId } = req.query;
        const userId = req.userId;

        const progressRecord = await LearningProgress.findOne({ userId, knowledgeId });

        if (!progressRecord || !progressRecord.notes) {
            return res.json({ message: '暂无笔记', notes: [] });
        }

        let notes = progressRecord.notes;
        if (fileId) {
            notes = notes.filter(n => n.fileId?.toString() === fileId);
        }
        notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ message: '获取笔记成功', notes });
    } catch (error) {
        console.error('获取笔记失败:', error);
        res.status(500).json({ message: '获取笔记失败', error: error.message });
    }
};

/**
 * 获取用户学习统计
 * GET /api/progress/stats/overview
 */
exports.getStats = async (req, res) => {
    try {
        const userId = req.userId;
        const ObjectId = require('mongoose').Types.ObjectId;

        const [stats, timeStats] = await Promise.all([
            LearningProgress.aggregate([
                { $match: { userId: new ObjectId(userId) } },
                {
                    $group: {
                        _id: null,
                        totalKnowledge: { $sum: 1 },
                        completedKnowledge: { $sum: { $cond: [{ $eq: ['$overallStatus', 'completed'] }, 1, 0] } },
                        avgProgress: { $avg: '$overallProgress' },
                        totalNotes: { $sum: { $size: '$notes' } },
                    },
                },
            ]),
            LearningProgress.aggregate([
                { $match: { userId: new ObjectId(userId) } },
                { $unwind: '$fileProgress' },
                { $group: { _id: null, totalTimeSpent: { $sum: '$fileProgress.timeSpent' } } },
            ]),
        ]);

        const s = stats[0] || { totalKnowledge: 0, completedKnowledge: 0, avgProgress: 0, totalNotes: 0 };
        const totalTimeSpent = timeStats[0]?.totalTimeSpent || 0;

        res.json({
            message: '获取统计成功',
            data: {
                totalKnowledge: s.totalKnowledge,
                completedKnowledge: s.completedKnowledge,
                completionRate: s.totalKnowledge > 0 ? Math.round((s.completedKnowledge / s.totalKnowledge) * 100) : 0,
                averageProgress: Math.round(s.avgProgress || 0),
                totalTimeSpent,
                totalNotes: s.totalNotes,
            },
        });
    } catch (error) {
        console.error('获取统计失败:', error);
        res.status(500).json({ message: '获取统计失败', error: error.message });
    }
};

/**
 * 获取最近学习记录
 * GET /api/progress/recent
 */
exports.getRecentProgress = async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;

        const recentProgress = await LearningProgress.find({ userId })
            .sort({ lastAccessedAt: -1 })
            .limit(limit)
            .populate('knowledgeId', 'title category coverImage')
            .select('knowledgeId overallProgress overallStatus lastAccessedAt');

        res.json({
            message: '获取最近学习记录成功',
            data: recentProgress,
        });
    } catch (error) {
        console.error('获取最近学习记录失败:', error);
        res.status(500).json({ message: '获取最近学习记录失败', error: error.message });
    }
};

/**
 * 管理员：获取所有用户的学习统计
 * GET /api/progress/admin/stats
 */
exports.getAllStats = async (req, res) => {
    try {
        const stats = await LearningProgress.aggregate([
            { $group: { _id: '$userId', totalKnowledge: { $sum: 1 }, completedKnowledge: { $sum: { $cond: [{ $eq: ['$overallStatus', 'completed'] }, 1, 0] } }, avgProgress: { $avg: '$overallProgress' } } },
            { $group: { _id: null, totalUsers: { $sum: 1 }, activeUsers: { $sum: { $cond: [{ $gt: ['$totalKnowledge', 0] }, 1, 0] } }, avgCompletionRate: { $avg: '$avgProgress' } } },
        ]);

        const result = stats[0] || { totalUsers: 0, activeUsers: 0, avgCompletionRate: 0 };

        res.json({
            message: '获取统计成功',
            data: {
                totalUsers: result.totalUsers,
                activeUsers: result.activeUsers,
                avgCompletionRate: Math.round(result.avgCompletionRate || 0),
            },
        });
    } catch (error) {
        console.error('获取统计失败:', error);
        res.status(500).json({ message: '获取统计失败', error: error.message });
    }
};

/**
 * 心跳上报（每30s）
 * POST /api/progress/:knowledgeId/heartbeat
 */
exports.heartbeat = async (req, res) => {
    try {
        const { knowledgeId } = req.params;
        const { fileId } = req.body;
        const userId = req.userId;

        const record = await LearningProgress.getOrCreate(userId, knowledgeId);
        if (fileId) {
            await LearningProgress.updateOne(
                { userId, knowledgeId, 'fileProgress.fileId': fileId },
                { $inc: { 'fileProgress.$.timeSpent': 30 }, $set: { lastAccessedAt: new Date() } }
            );
        } else {
            await LearningProgress.updateOne(
                { userId, knowledgeId },
                { $set: { lastAccessedAt: new Date() } }
            );
        }

        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: '心跳上报失败', error: error.message });
    }
};
