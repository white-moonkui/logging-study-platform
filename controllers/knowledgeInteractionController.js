const KnowledgeFavorite = require('../models/KnowledgeFavorite');
const KnowledgeComment = require('../models/KnowledgeComment');
const Knowledge = require('../models/Knowledge');

class KnowledgeInteractionController {
    /**
     * 收藏知识
     */
    async favorite(req, res) {
        try {
            const { knowledgeId } = req.body;
            const userId = req.userId;

            // 检查知识是否存在
            const knowledge = await Knowledge.findById(knowledgeId);
            if (!knowledge) {
                return res.status(404).json({ message: '知识内容不存在' });
            }

            // 检查是否已收藏
            const existing = await KnowledgeFavorite.findOne({ userId, knowledgeId });
            if (existing) {
                return res.status(400).json({ message: '已经收藏过此知识' });
            }

            const favorite = new KnowledgeFavorite({
                userId,
                knowledgeId,
                folder: req.body.folder || '默认收藏夹',
                note: req.body.note || '',
            });

            await favorite.save();

            res.status(201).json({ message: '收藏成功', favorite });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ message: '已经收藏过此知识' });
            }
            res.status(500).json({ message: '收藏失败', error: error.message });
        }
    }

    /**
     * 取消收藏
     */
    async unfavorite(req, res) {
        try {
            const { knowledgeId } = req.params;
            const userId = req.userId;

            const result = await KnowledgeFavorite.findOneAndDelete({ userId, knowledgeId });

            if (!result) {
                return res.status(404).json({ message: '收藏记录不存在' });
            }

            res.json({ message: '取消收藏成功' });
        } catch (error) {
            res.status(500).json({ message: '取消收藏失败', error: error.message });
        }
    }

    /**
     * 获取用户收藏列表
     */
    async getFavorites(req, res) {
        try {
            const userId = req.userId;
            const { page = 1, limit = 10, folder } = req.query;

            const filter = { userId };
            if (folder) {filter.folder = folder;}

            const favorites = await KnowledgeFavorite.find(filter)
                .populate({
                    path: 'knowledgeId',
                    select: 'title category subcategory viewCount readingTime createdAt',
                    populate: { path: 'createdBy', select: 'username' },
                })
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await KnowledgeFavorite.countDocuments(filter);

            // 按文件夹分组
            const folders = await KnowledgeFavorite.distinct('folder', { userId });

            res.json({
                favorites,
                folders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({ message: '获取收藏列表失败', error: error.message });
        }
    }

    /**
     * 添加评论
     */
    async addComment(req, res) {
        try {
            const { knowledgeId } = req.params;
            const userId = req.userId;
            const { content, rating, parentCommentId } = req.body;

            // 检查知识是否存在
            const knowledge = await Knowledge.findById(knowledgeId);
            if (!knowledge) {
                return res.status(404).json({ message: '知识内容不存在' });
            }

            // 验证父评论
            if (parentCommentId) {
                const parent = await KnowledgeComment.findById(parentCommentId);
                if (!parent) {
                    return res.status(404).json({ message: '父评论不存在' });
                }
            }

            const comment = new KnowledgeComment({
                knowledgeId,
                userId,
                content,
                rating,
                parentCommentId: parentCommentId || null,
            });

            await comment.save();

            // 更新知识的评分统计（可选）
            if (rating) {
                await this.updateKnowledgeRating(knowledgeId);
            }

            res.status(201).json({ message: '评论成功', comment });
        } catch (error) {
            res.status(500).json({ message: '评论失败', error: error.message });
        }
    }

    /**
     * 获取知识评论列表
     */
    async getComments(req, res) {
        try {
            const { knowledgeId } = req.params;
            const { page = 1, limit = 10, sort = 'recent' } = req.query;

            const filter = { knowledgeId, isHidden: false, parentCommentId: null };

            let sortOption = { createdAt: -1 };
            if (sort === 'helpful') {
                sortOption = { helpfulCount: -1 };
            }

            const comments = await KnowledgeComment.find(filter)
                .populate('userId', 'username avatar')
                .sort(sortOption)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            // 获取回复
            const commentIds = comments.map(c => c._id);
            const replies = await KnowledgeComment.find({
                parentCommentId: { $in: commentIds },
                isHidden: false,
            })
                .populate('userId', 'username avatar')
                .sort({ createdAt: 1 });

            // 组装评论和回复
            const commentsWithReplies = comments.map(comment => ({
                ...comment.toObject(),
                replies: replies.filter(
                    r => r.parentCommentId.toString() === comment._id.toString()
                ),
            }));

            const total = await KnowledgeComment.countDocuments(filter);

            res.json({
                comments: commentsWithReplies,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({ message: '获取评论失败', error: error.message });
        }
    }

    /**
     * 标记评论有用
     */
    async helpfulComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.userId;

            const comment = await KnowledgeComment.findById(commentId);
            if (!comment) {
                return res.status(404).json({ message: '评论不存在' });
            }

            // 检查是否已标记
            if (comment.helpfulUsers.includes(userId)) {
                // 取消标记
                comment.helpfulUsers = comment.helpfulUsers.filter(id => id.toString() !== userId);
                comment.helpfulCount = Math.max(0, comment.helpfulCount - 1);
            } else {
                // 添加标记
                comment.helpfulUsers.push(userId);
                comment.helpfulCount += 1;
            }

            await comment.save();

            res.json({ message: '操作成功', helpfulCount: comment.helpfulCount });
        } catch (error) {
            res.status(500).json({ message: '操作失败', error: error.message });
        }
    }

    /**
     * 删除评论
     */
    async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.userId;
            const userRole = req.userRole;

            const comment = await KnowledgeComment.findById(commentId);
            if (!comment) {
                return res.status(404).json({ message: '评论不存在' });
            }

            // 检查权限
            if (comment.userId.toString() !== userId && userRole !== 'admin') {
                return res.status(403).json({ message: '没有权限删除此评论' });
            }

            // 软删除
            comment.isHidden = true;
            await comment.save();

            // 同时隐藏回复
            await KnowledgeComment.updateMany({ parentCommentId: commentId }, { isHidden: true });

            res.json({ message: '删除成功' });
        } catch (error) {
            res.status(500).json({ message: '删除失败', error: error.message });
        }
    }

    /**
     * 获取知识统计信息
     */
    async getStatistics(req, res) {
        try {
            const { knowledgeId } = req.params;

            const knowledge = await Knowledge.findById(knowledgeId);
            if (!knowledge) {
                return res.status(404).json({ message: '知识内容不存在' });
            }

            const [favoriteCount, commentCount, avgRating] = await Promise.all([
                KnowledgeFavorite.countDocuments({ knowledgeId }),
                KnowledgeComment.countDocuments({ knowledgeId, isHidden: false }),
                KnowledgeComment.aggregate([
                    { $match: { knowledgeId: knowledge._id, rating: { $exists: true } } },
                    { $group: { _id: null, avg: { $avg: '$rating' } } },
                ]),
            ]);

            res.json({
                viewCount: knowledge.viewCount,
                favoriteCount,
                commentCount,
                averageRating: avgRating[0]?.avg?.toFixed(1) || null,
            });
        } catch (error) {
            res.status(500).json({ message: '获取统计信息失败', error: error.message });
        }
    }

    /**
     * 更新知识评分统计
     */
    async updateKnowledgeRating(knowledgeId) {
        try {
            const result = await KnowledgeComment.aggregate([
                { $match: { knowledgeId: knowledge._id, rating: { $exists: true } } },
                { $group: { _id: '$knowledgeId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
            ]);

            if (result.length > 0) {
                await Knowledge.findByIdAndUpdate(knowledgeId, {
                    averageRating: result[0].avg,
                    ratingCount: result[0].count,
                });
            }
        } catch (error) {
            console.error('更新评分失败:', error);
        }
    }
}

module.exports = new KnowledgeInteractionController();
