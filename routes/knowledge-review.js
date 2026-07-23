/**
 * 知识库审核管理API路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const KnowledgeReview = require('../models/KnowledgeReview');
const Knowledge = require('../models/Knowledge');
const Case = require('../models/Case');
const { authenticateToken, requireRole } = require('../middleware/auth');
const AIService = require('../utils/aiService');

// 配置文件上传
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/reviews');
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    },
});

// 审核工作流服务
class ReviewWorkflowService {
    // 获取待审核列表
    static async getPendingList(filters = {}) {
        const { status, page = 1, limit = 10, priority } = filters;

        const query = {};
        if (status) {query.status = status;}
        if (priority) {query.priority = priority;}

        const items = await KnowledgeReview.find(query)
            .populate('submittedBy', 'username name role')
            .sort({ priority: -1, createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await KnowledgeReview.countDocuments(query);

        return { items, total, page, limit };
    }

    // 获取仪表盘统计
    static async getDashboardStats() {
        const stats = await KnowledgeReview.getReviewStats(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 最近30天
            new Date()
        );

        // 额外统计
        const urgentCount = await KnowledgeReview.countDocuments({
            status: 'pending_review',
            priority: 'urgent',
        });

        const todaySubmissions = await KnowledgeReview.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
        });

        return {
            ...stats,
            urgentCount,
            todaySubmissions,
        };
    }

    // 提交审核
    static async submitForReview(data, userId, files = []) {
        const attachments = files.map(f => ({
            filename: f.originalname,
            filePath: f.path,
            fileType: f.mimetype,
            fileSize: f.size,
        }));

        const reviewItem = new KnowledgeReview({
            ...data,
            submittedBy: userId,
            attachments,
            status: 'pending_review',
        });

        await reviewItem.submitForReview();

        return reviewItem;
    }

    // 启动AI初审
    static async startAIReview(reviewId) {
        const reviewItem = await KnowledgeReview.findById(reviewId);
        if (!reviewItem) {throw new Error('审核项不存在');}

        await reviewItem.startAIReview();

        // 异步执行AI评估
        this.runAIReviewAsync(reviewId);

        return reviewItem;
    }

    // 异步执行AI评估
    static async runAIReviewAsync(reviewId) {
        try {
            const reviewItem = await KnowledgeReview.findById(reviewId);
            if (!reviewItem) {return;}

            // 调用AI评估
            const evaluation = await AIService.evaluateCaseInnovation({
                title: reviewItem.title,
                description: reviewItem.description,
                content: reviewItem.content,
            });

            // 转换为评分格式
            const scores = {
                relevance: evaluation.relevanceScore || 70,
                accuracy: evaluation.technicalAccuracy || 70,
                completeness: evaluation.completenessScore || 70,
                innovation: evaluation.innovationScore || 70,
                overall:
                    (evaluation.relevanceScore +
                        evaluation.technicalAccuracy +
                        evaluation.completenessScore +
                        evaluation.innovationScore) /
                    4,
            };

            const suggestions = evaluation.recommendations || [];
            const issues = [];

            if (scores.overall < 60) {issues.push('综合评分低于标准');}
            if (scores.relevance < 50) {issues.push('相关性评分较低');}
            if (reviewItem.content.length < 100) {issues.push('内容过于简短');}

            await reviewItem.completeAIReview(scores, suggestions, issues, 'local-ai');
        } catch (error) {
            console.error('AI审核失败:', error);
            const reviewItem = await KnowledgeReview.findById(reviewId);
            if (reviewItem) {
                reviewItem.aiReview = {
                    issues: [`AI审核失败: ${  error.message}`],
                    reviewAt: new Date(),
                };
                reviewItem.status = 'pending_review';
                await reviewItem.save();
            }
        }
    }

    // 人工审核
    static async submitHumanReview(reviewId, reviewerId, decision) {
        const reviewItem = await KnowledgeReview.findById(reviewId);
        if (!reviewItem) {throw new Error('审核项不存在');}

        await reviewItem.submitHumanReview(
            reviewerId,
            decision.approved,
            decision.comments,
            decision.revisionRequired,
            decision.revisionComments
        );

        // 如果批准，转移到目标集合
        if (decision.approved && reviewItem.targetCollection) {
            await this.publishToTargetCollection(reviewItem);
        }

        return reviewItem;
    }

    // 发布到目标集合
    static async publishToTargetCollection(reviewItem) {
        const data = {
            title: reviewItem.title,
            description: reviewItem.description,
            content: reviewItem.content,
            category: reviewItem.category,
            keywords: reviewItem.keywords,
            tags: reviewItem.tags,
            attachments: reviewItem.attachments,
            createdBy: reviewItem.submittedBy,
            isPublished: true,
        };

        let targetModel;
        switch (reviewItem.targetCollection) {
            case 'Knowledge':
                targetModel = Knowledge;
                break;
            case 'Case':
                targetModel = Case;
                // 案例需要额外的字段
                data.problemStatement = reviewItem.description;
                data.analysisProcess = reviewItem.content;
                data.solution = reviewItem.content.substring(0, 500);
                data.keywords = reviewItem.keywords;
                break;
            default:
                targetModel = Knowledge;
        }

        const targetDoc = new targetModel(data);
        await targetDoc.save();

        reviewItem.targetId = targetDoc._id;
        await reviewItem.save();

        return targetDoc;
    }
}

/**
 * @route GET /api/knowledge-review/dashboard
 * @desc 获取审核仪表盘统计
 */
router.get(
    '/dashboard',
    authenticateToken,
    requireRole(['admin']),
    async (req, res) => {
        try {
            const stats = await ReviewWorkflowService.getDashboardStats();
            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

/**
 * @route GET /api/knowledge-review/pending
 * @desc 获取待审核列表
 */
router.get(
    '/pending',
    authenticateToken,
    requireRole(['admin']),
    async (req, res) => {
        try {
            const { status = 'pending_review', page = 1, limit = 10, priority } = req.query;

            const result = await ReviewWorkflowService.getPendingList({
                status,
                page: parseInt(page),
                limit: parseInt(limit),
                priority,
            });

            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

/**
 * @route GET /api/knowledge-review/:id
 * @desc 获取审核详情
 */
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const reviewItem = await KnowledgeReview.findById(req.params.id)
            .populate('submittedBy', 'username name role')
            .populate('humanReview.reviewer', 'username name');

        if (!reviewItem) {
            return res.status(404).json({ success: false, error: '审核项不存在' });
        }

        res.json({ success: true, item: reviewItem });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route POST /api/knowledge-review/submit
 * @desc 提交知识内容进行审核
 */
router.post('/submit', authenticateToken, upload.array('files', 5), async (req, res) => {
    try {
        const { title, description, category, content, keywords, tags, targetCollection } =
            req.body;

        if (!title || !category || !content) {
            return res.status(400).json({
                success: false,
                error: '标题、分类和内容为必填项',
            });
        }

        const reviewItem = await ReviewWorkflowService.submitForReview(
            {
                title,
                description: description || '',
                category,
                content,
                keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
                tags: tags ? tags.split(',').map(t => t.trim()) : [],
                targetCollection: targetCollection || 'Knowledge',
            },
            req.userId,
            req.files
        );

        res.status(201).json({
            success: true,
            message: '提交成功，等待审核',
            item: reviewItem,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route POST /api/knowledge-review/:id/ai-review
 * @desc 启动AI初审
 */
router.post(
    '/:id/ai-review',
    authenticateToken,
    requireRole(['admin']),
    async (req, res) => {
        try {
            const reviewItem = await ReviewWorkflowService.startAIReview(req.params.id);

            res.json({
                success: true,
                message: 'AI初审已启动',
                status: reviewItem.status,
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

/**
 * @route POST /api/knowledge-review/:id/human-review
 * @desc 人工终审
 */
router.post(
    '/:id/human-review',
    authenticateToken,
    requireRole(['admin']),
    async (req, res) => {
        try {
            const { approved, comments, revisionRequired, revisionComments } = req.body;

            const reviewItem = await ReviewWorkflowService.submitHumanReview(
                req.params.id,
                req.userId,
                { approved, comments, revisionRequired, revisionComments }
            );

            res.json({
                success: true,
                message: approved ? '审核通过' : revisionRequired ? '已退回修改' : '已拒绝',
                status: reviewItem.status,
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

/**
 * @route DELETE /api/knowledge-review/:id
 * @desc 删除审核项（仅限创建者或管理员）
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const reviewItem = await KnowledgeReview.findById(req.params.id);

        if (!reviewItem) {
            return res.status(404).json({ success: false, error: '审核项不存在' });
        }

        // 检查权限
        const isOwner = reviewItem.submittedBy.toString() === req.userId;
        const isAdmin = req.userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, error: '无权删除此审核项' });
        }

        // 检查状态
        if (['approved', 'human_reviewing'].includes(reviewItem.status)) {
            return res.status(400).json({ success: false, error: '该状态不允许删除' });
        }

        await KnowledgeReview.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
