const LearningProgress = require('../models/LearningProgress');
const Knowledge = require('../models/Knowledge');
const mongoose = require('mongoose');

class LearningProgressController {
    // 获取当前用户的所有学习进度
    getProgress = async (req, res) => {
        try {
            const { status, knowledgeId } = req.query;
            const filter = { userId: this.toObjectId(req.userId) };

            if (status) {filter.overallStatus = status;}
            if (knowledgeId) {filter.knowledgeId = knowledgeId;}

            const progress = await LearningProgress.find(filter)
                .populate('knowledgeId', 'title category difficulty')
                .sort({ lastAccessedAt: -1 });

            res.json({ items: progress, total: progress.length });
        } catch (error) {
            res.status(500).json({ message: '获取学习进度失败', error: error.message });
        }
    };

    getProgressById = async (req, res) => {
        try {
            const progress = await LearningProgress.findById(req.params.id);

            if (!progress) {
                return res.status(404).json({ message: '学习进度不存在' });
            }

            // 验证权限
            if (progress.userId.toString() !== req.userId) {
                return res.status(403).json({ message: '无权访问此学习进度' });
            }

            res.json({ progress });
        } catch (error) {
            res.status(500).json({ message: '获取学习进度失败', error: error.message });
        }
    };

    // 获取学习统计
    getStatistics = async (req, res) => {
        try {
            console.log('[getStatistics] Starting, req.userId:', req.userId);
            const userId = this.toObjectId(req.userId);
            console.log('[getStatistics] userId:', userId, 'type:', typeof userId);

            // 按知识统计
            const progressList = await LearningProgress.find({ userId });

            // 按分类统计
            const byCategory = {};
            progressList.forEach(progress => {
                const knowledge = progress.knowledgeId;
                const category = knowledge.category || '未分类';

                if (!byCategory[category]) {
                    byCategory[category] = {
                        avgProgress: 0,
                        completedCount: 0,
                        totalCount: 0,
                    };
                }

                byCategory[category].totalCount++;
                byCategory[category].avgProgress += progress.overallProgress;
                if (progress.overallStatus === 'completed') {
                    byCategory[category].completedCount++;
                }
            });

            // 计算平均值
            Object.keys(byCategory).forEach(category => {
                byCategory[category].avgProgress = Math.round(
                    byCategory[category].avgProgress / byCategory[category].totalCount
                );
            });

            // 总体统计
            const overall = {
                totalProgress: 0,
                totalKnowledge: progressList.length,
                completedKnowledge: 0,
                inProgressKnowledge: 0,
            };

            progressList.forEach(progress => {
                overall.totalProgress += progress.overallProgress;
                if (progress.overallStatus === 'completed') {
                    overall.completedKnowledge++;
                } else if (progress.overallStatus === 'in-progress') {
                    overall.inProgressKnowledge++;
                }
            });

            overall.totalProgress =
                overall.totalKnowledge > 0
                    ? Math.round(overall.totalProgress / overall.totalKnowledge)
                    : 0;

            res.json({
                byCategory,
                overall,
            });
        } catch (error) {
            console.error('[getStatistics] Error:', error);
            res.status(500).json({ message: '获取学习统计失败', error: error.message });
        }
    };

    // 开始学习某个知识 - 创建学习进度记录
    startLearning = async (req, res) => {
        try {
            const { knowledgeId } = req.params;
            const { body } = req;

            // 验证知识是否存在
            const knowledge = await Knowledge.findById(knowledgeId);
            if (!knowledge) {
                return res.status(404).json({ message: '知识内容不存在' });
            }

            // 检查是否已有学习进度
            let progress = await LearningProgress.findOne({
                userId: this.toObjectId(req.userId),
                knowledgeId,
            });

            if (progress) {
                // 更新最后访问时间
                progress.lastAccessedAt = new Date();
                await progress.save();
                return res.json({
                    message: '继续学习',
                    progress,
                    isNew: false,
                });
            }

            // 创建新的学习进度
            progress = await LearningProgress.create({
                userId: this.toObjectId(req.userId),
                knowledgeId,
                overallStatus: 'in-progress',
                overallProgress: 0,
                startedAt: new Date(),
                lastAccessedAt: new Date(),
            });

            // populate 不再需要，因为这是 create 返回的 plain object
            // 需要额外查询才能获得完整信息
            const knowledgeInfo = await Knowledge.findById(knowledgeId).select(
                'title category difficulty'
            );

            res.status(201).json({
                message: '开始学习',
                progress: {
                    ...progress._doc,
                    knowledge: knowledgeInfo,
                },
                isNew: true,
            });
        } catch (error) {
            console.error('[startLearning] Error:', error);
            res.status(500).json({ message: '开始学习失败', error: error.message });
        }
    };

    // 更新文件阅读进度
    updateFileProgress = async (req, res) => {
        try {
            const { id } = req.params;
            const { fileId, progress: progressValue, lastPosition, timeSpent } = req.body;

            const progress = await LearningProgress.findById(id);

            if (!progress) {
                return res.status(404).json({ message: '学习进度不存在' });
            }

            // 验证权限
            if (progress.userId.toString() !== req.userId) {
                return res.status(403).json({ message: '无权修改此学习进度' });
            }

            // 更新文件进度
            await progress.updateFileProgress(fileId, progressValue, lastPosition);

            // 更新学习时间
            if (timeSpent) {
                // 找到对应的文件进度并更新时间
                const fileProg = progress.fileProgress.find(fp => fp.fileId.toString() === fileId);
                if (fileProg) {
                    fileProg.timeSpent = (fileProg.timeSpent || 0) + timeSpent;
                    await progress.save();
                }
            }

            // populate 不再需要，因为已经 save 过了
            await progress.populate('knowledgeId', 'title');

            res.json({
                message: '进度更新成功',
                progress,
            });
        } catch (error) {
            console.error('[updateFileProgress] Error:', error);
            res.status(500).json({ message: '更新进度失败', error: error.message });
        }
    };

    // 添加笔记
    addNote = async (req, res) => {
        try {
            const { id } = req.params;
            const { fileId, timestamp, content } = req.body;

            const progress = await LearningProgress.findById(id);

            if (!progress) {
                return res.status(404).json({ message: '学习进度不存在' });
            }

            // 验证权限
            if (progress.userId.toString() !== req.userId) {
                return res.status(403).json({ message: '无权修改此学习进度' });
            }

            await progress.addNote(fileId, timestamp, content);

            res.json({
                message: '笔记添加成功',
                notes: progress.notes,
            });
        } catch (error) {
            console.error('[addNote] Error:', error);
            res.status(500).json({ message: '添加笔记失败', error: error.message });
        }
    };

    // 切换收藏状态
    toggleBookmark = async (req, res) => {
        try {
            const { id } = req.params;

            const progress = await LearningProgress.findById(id);

            if (!progress) {
                return res.status(404).json({ message: '学习进度不存在' });
            }

            // 验证权限
            if (progress.userId.toString() !== req.userId) {
                return res.status(403).json({ message: '无权修改此学习进度' });
            }

            progress.isBookmarked = !progress.isBookmarked;
            progress.bookmarkedAt = progress.isBookmarked ? new Date() : null;
            await progress.save();

            res.json({
                message: progress.isBookmarked ? '已收藏' : '已取消收藏',
                isBookmarked: progress.isBookmarked,
            });
        } catch (error) {
            console.error('[toggleBookmark] Error:', error);
            res.status(500).json({ message: '操作失败', error: error.message });
        }
    };

    // 获取收藏列表
    getBookmarks = async (req, res) => {
        try {
            const progress = await LearningProgress.find({
                userId: this.toObjectId(req.userId),
                isBookmarked: true,
            }).populate('knowledgeId', 'title category difficulty');

            res.json({ items: progress, total: progress.length });
        } catch (error) {
            console.error('[getBookmarks] Error:', error);
            res.status(500).json({ message: '获取收藏列表失败', error: error.message });
        }
    };

    // 管理员查看指定学员的学习进度
    adminGetStudentProgress = async (req, res) => {
        try {
            const { userId } = req.params;
            const { status } = req.query;
            const filter = { userId: this.toObjectId(userId) };
            if (status) { filter.overallStatus = status; }

            const progress = await LearningProgress.find(filter)
                .populate('knowledgeId', 'title category difficulty')
                .sort({ lastAccessedAt: -1 });

            res.json({ items: progress, total: progress.length });
        } catch (error) {
            console.error('[adminGetStudentProgress] Error:', error);
            res.status(500).json({ message: '获取学员学习进度失败', error: error.message });
        }
    };

    // 删除学习进度
    deleteProgress = async (req, res) => {
        try {
            const progress = await LearningProgress.findById(req.params.id);

            if (!progress) {
                return res.status(404).json({ message: '学习进度不存在' });
            }

            // 验证权限
            if (progress.userId.toString() !== req.userId) {
                return res.status(403).json({ message: '无权删除此学习进度' });
            }

            await LearningProgress.findByIdAndDelete(req.params.id);

            res.json({ message: '删除成功' });
        } catch (error) {
            console.error('[deleteProgress] Error:', error);
            res.status(500).json({ message: '删除失败', error: error.message });
        }
    };

    // Helper: Convert userId to ObjectId
    toObjectId = userId => {
        try {
            console.log('[toObjectId] Input:', userId, 'type:', typeof userId);
            if (mongoose.Types.ObjectId.isValid(userId)) {
                console.log('[toObjectId] Calling new mongoose.Types.ObjectId with:', userId);
                const objId = new mongoose.Types.ObjectId(userId);
                console.log('[toObjectId] Result:', objId, 'type:', typeof objId);
                return objId;
            }
            // If it's already an ObjectId, return it as is
            if (userId instanceof mongoose.Types.ObjectId) {
                console.log('[toObjectId] Already ObjectId:', userId);
                return userId;
            }
            console.log('[toObjectId] Invalid format');
            throw new Error('Invalid userId format');
        } catch (error) {
            console.error('[toObjectId] Error:', error);
            throw new Error(`Invalid userId format: ${userId}`);
        }
    };
}

module.exports = new LearningProgressController();
