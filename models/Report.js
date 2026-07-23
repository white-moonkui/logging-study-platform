/**
 * 报告模型
 * 存储生成的培训/考核报告
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

const reportSchema = new (getMongoose().Schema)(
    {
        // 报告类型
        type: {
            type: String,
            required: true,
            enum: ['training', 'assessment', 'comprehensive'],
            index: true,
        },

        // 关联用户
        user: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // 报告周期
        period: {
            start: {
                type: Date,
                required: true,
            },
            end: {
                type: Date,
                required: true,
            },
        },

        // 报告标题
        title: {
            type: String,
            required: true,
        },

        // 报告内容（JSON格式）
        content: {
            summary: {
                // 总体数据
                totalLearningTime: Number,
                completedModules: Number,
                totalModules: Number,
                completionRate: Number,
                avgScore: Number,
                examCount: Number,
                passCount: Number,
            },
            learningDetails: [
                {
                    moduleName: String,
                    progress: Number,
                    timeSpent: Number,
                    score: Number,
                    status: String,
                },
            ],
            examResults: [
                {
                    examTitle: String,
                    score: Number,
                    passed: Boolean,
                    attemptDate: Date,
                    timeSpent: Number,
                },
            ],
            abilityMatrix: {
                professionalKnowledge: Number,
                standardApplication: Number,
                crossIntegration: Number,
                practicalSkills: Number,
                decisionAbility: Number,
            },
            strengths: [String],
            weaknesses: [String],
            recommendations: [String],
            comparison: {
                previousPeriod: {
                    completionRateChange: Number,
                    scoreChange: Number,
                    abilityChanges: {
                        professionalKnowledge: Number,
                        standardApplication: Number,
                        crossIntegration: Number,
                        practicalSkills: Number,
                        decisionAbility: Number,
                    },
                },
            },
        },

        // 简要摘要
        summary: {
            type: String,
            maxLength: 500,
        },

        // 生成信息
        generatedBy: {
            type: String,
            enum: ['system', 'ai', 'admin'],
            default: 'system',
        },
        generationParams: {
            type: getMongoose().Schema.Types.Mixed,
        },

        // 文件导出
        exportUrl: {
            type: String,
        },
        exportFilename: {
            type: String,
        },
        exportedAt: {
            type: Date,
        },

        // 状态
        status: {
            type: String,
            enum: ['generating', 'ready', 'exported', 'error'],
            default: 'generating',
        },

        // 访问控制
        isPublic: {
            type: Boolean,
            default: false,
        },
        sharedWith: [
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
reportSchema.index({ user: 1, type: 1, createdAt: -1 });
reportSchema.index({ 'period.start': 1, 'period.end': 1 });

// 静态方法
reportSchema.statics.findByUser = function (userId, type = null) {
    const filter = { user: userId };
    if (type) {filter.type = type;}
    return this.find(filter).sort({ createdAt: -1 });
};

reportSchema.statics.findByPeriod = function (userId, startDate, endDate) {
    return this.find({
        user: userId,
        'period.start': { $gte: startDate },
        'period.end': { $lte: endDate },
    }).sort({ createdAt: -1 });
};

reportSchema.statics.getLatest = function (userId, type) {
    return this.findOne({ user: userId, type }).sort({ createdAt: -1 });
};

// 实例方法
reportSchema.methods.updateContent = async function (newContent) {
    this.content = { ...this.content, ...newContent };
    this.status = 'ready';
    return this.save();
};

reportSchema.methods.setExportInfo = function (url, filename) {
    this.exportUrl = url;
    this.exportFilename = filename;
    this.exportedAt = new Date();
    this.status = 'exported';
};

const Report = dbAdapter.getModel('Report', reportSchema);

module.exports = Report;
