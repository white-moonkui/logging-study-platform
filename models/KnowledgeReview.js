/**
 * 知识库审核模型
 * 管理待审核、审核中、已通过、已拒绝的知识内容
 */

const dbAdapter = require('../utils/dbAdapter');

// 延迟导入 mongoose，仅在需要时加载
let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

const knowledgeReviewSchema = new (getMongoose().Schema)(
    {
        // 基本信息
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        category: {
            type: String,
            required: true,
            enum: ['basic', 'instrument', 'operation', 'standard', 'cross', 'case', 'solution'],
            index: true,
        },

        // 内容
        content: {
            type: String,
            required: true,
        },
        sourceType: {
            type: String,
            enum: ['manual_upload', 'ai_generated', 'imported'],
            default: 'manual_upload',
        },

        // 附件
        attachments: [
            {
                filename: String,
                filePath: String,
                fileType: String,
                fileSize: Number,
            },
        ],

        // 关键词和标签
        keywords: [String],
        tags: [String],

        // 上传者
        submittedBy: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // 审核状态
        status: {
            type: String,
            enum: [
                'pending_review',
                'ai_reviewing',
                'ai_approved',
                'ai_rejected',
                'human_reviewing',
                'approved',
                'rejected',
            ],
            default: 'pending_review',
            index: true,
        },

        // AI初审结果
        aiReview: {
            scores: {
                relevance: { type: Number, min: 0, max: 100, default: 0 }, // 相关性
                accuracy: { type: Number, min: 0, max: 100, default: 0 }, // 准确性
                completeness: { type: Number, min: 0, max: 100, default: 0 }, // 完整性
                innovation: { type: Number, min: 0, max: 100, default: 0 }, // 创新性
                overall: { type: Number, min: 0, max: 100, default: 0 }, // 综合评分
            },
            suggestions: [String],
            issues: [String],
            reviewAt: Date,
            modelUsed: String,
            feedback: String,
        },

        // AI评估阈值配置
        aiThreshold: {
            minOverall: { type: Number, default: 60 }, // 综合评分最低标准
            minRelevance: { type: Number, default: 50 }, // 相关性最低标准
            maxIssues: { type: Number, default: 3 }, // 最大允许问题数
        },

        // 人工审核结果
        humanReview: {
            reviewer: { type: getMongoose().Schema.Types.ObjectId, ref: 'User' },
            reviewedAt: Date,
            approved: Boolean,
            comments: String,
            revisionRequired: Boolean,
            revisionComments: String,
        },

        // 终审通过后的目标集合
        targetCollection: {
            type: String,
            enum: ['Knowledge', 'Case', 'Solution'],
            default: 'Knowledge',
        },
        targetId: {
            type: getMongoose().Schema.Types.ObjectId,
            refPath: 'targetCollection',
        },

        // 优先级
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal',
        },

        // 截止日期
        deadline: {
            type: Date,
        },

        // 流程历史
        workflowHistory: [
            {
                fromStatus: String,
                toStatus: String,
                actionBy: { type: getMongoose().Schema.Types.ObjectId, ref: 'User' },
                actionAt: { type: Date, default: Date.now },
                comments: String,
            },
        ],

        // 通知设置
        notifyOnComplete: {
            type: Boolean,
            default: true,
        },
        notifyTo: [
            {
                type: getMongoose().Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// 索引
knowledgeReviewSchema.index({ status: 1, priority: -1, createdAt: -1 });
knowledgeReviewSchema.index({ submittedBy: 1, status: 1 });
knowledgeReviewSchema.index({ 'aiReview.scores.overall': -1 });

// 静态方法
knowledgeReviewSchema.statics.findPendingReview = function (filters = {}) {
    return this.find({
        ...filters,
        status: 'pending_review',
    }).sort({ priority: -1, createdAt: 1 });
};

knowledgeReviewSchema.statics.findAIPending = function () {
    return this.find({
        status: 'pending_review',
        sourceType: { $ne: 'ai_generated' }, // AI生成的内容不需要AI初审
    }).sort({ createdAt: 1 });
};

knowledgeReviewSchema.statics.findHumanPending = function () {
    return this.find({
        status: 'ai_approved',
    }).sort({ 'aiReview.scores.overall': -1 });
};

knowledgeReviewSchema.statics.findBySubmitter = function (userId) {
    return this.find({ submittedBy: userId }).sort({ createdAt: -1 });
};

// 实例方法
knowledgeReviewSchema.methods.submitForReview = async function () {
    this.status = 'pending_review';
    this.workflowHistory.push({
        fromStatus: 'draft',
        toStatus: 'pending_review',
        comments: '提交审核',
    });
    return this.save();
};

knowledgeReviewSchema.methods.startAIReview = async function () {
    this.status = 'ai_reviewing';
    this.workflowHistory.push({
        fromStatus: 'pending_review',
        toStatus: 'ai_reviewing',
        comments: '开始AI初审',
    });
    return this.save();
};

knowledgeReviewSchema.methods.completeAIReview = async function (
    scores,
    suggestions,
    issues,
    modelUsed
) {
    this.aiReview = {
        scores,
        suggestions,
        issues,
        reviewAt: new Date(),
        modelUsed,
    };

    // 根据AI评估结果决定状态
    const { minOverall, minRelevance, maxIssues } = this.aiThreshold;

    if (
        scores.overall >= minOverall &&
        scores.relevance >= minRelevance &&
        issues.length <= maxIssues
    ) {
        this.status = 'ai_approved';
        this.workflowHistory.push({
            fromStatus: 'ai_reviewing',
            toStatus: 'ai_approved',
            comments: `AI初审通过，综合评分: ${scores.overall}`,
        });
    } else {
        this.status = 'ai_rejected';
        this.workflowHistory.push({
            fromStatus: 'ai_reviewing',
            toStatus: 'ai_rejected',
            comments: `AI初审未通过，综合评分: ${scores.overall}`,
        });
    }

    return this.save();
};

knowledgeReviewSchema.methods.submitHumanReview = async function (
    reviewerId,
    approved,
    comments,
    revisionRequired = false,
    revisionComments = ''
) {
    this.humanReview = {
        reviewer: reviewerId,
        reviewedAt: new Date(),
        approved,
        comments,
        revisionRequired,
        revisionComments,
    };

    if (approved) {
        this.status = 'approved';
        this.workflowHistory.push({
            fromStatus: 'human_reviewing',
            toStatus: 'approved',
            actionBy: reviewerId,
            comments: '人工终审通过',
        });
    } else {
        if (revisionRequired) {
            this.status = 'pending_review';
            this.workflowHistory.push({
                fromStatus: 'human_reviewing',
                toStatus: 'pending_review',
                actionBy: reviewerId,
                comments: `需要修改: ${revisionComments}`,
            });
        } else {
            this.status = 'rejected';
            this.workflowHistory.push({
                fromStatus: 'human_reviewing',
                toStatus: 'rejected',
                actionBy: reviewerId,
                comments: `拒绝原因: ${comments}`,
            });
        }
    }

    return this.save();
};

// 计算审核统计
knowledgeReviewSchema.statics.getReviewStats = async function (startDate, endDate) {
    const stats = await this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const result = {
        total: 0,
        pending_review: 0,
        ai_reviewing: 0,
        ai_approved: 0,
        ai_rejected: 0,
        human_reviewing: 0,
        approved: 0,
        rejected: 0,
    };

    stats.forEach(s => {
        result[s._id] = s.count;
        result.total += s.count;
    });

    return result;
};

const KnowledgeReview = dbAdapter.getModel('KnowledgeReview', knowledgeReviewSchema);

module.exports = KnowledgeReview;
