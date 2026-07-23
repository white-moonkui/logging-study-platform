/**
 * 动态页面管理系统 - 页面模型
 * 对应四级层级中的第四级（内容页面）
 */
const dbAdapter = require('../utils/dbAdapter');

// 获取 mongoose
let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

// 创建 schema
const learningPageSchema = new (getMongoose().Schema)(
    {
        // 页面标题
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        // 页面别名（用于URL）
        slug: {
            type: String,
            trim: true,
            lowercase: true,
        },
        // 所属分类
        categoryId: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'LearningCategory',
            required: true,
        },
        // 页面类型: video, pdf, ppt, document, text, quiz
        pageType: {
            type: String,
            required: true,
            enum: ['video', 'pdf', 'ppt', 'document', 'text', 'quiz'],
            default: 'text',
        },
        // 内容摘要
        summary: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        // 详细内容（富文本或Markdown）
        content: {
            type: String,
        },
        // 关联的文件ID（视频、PDF、PPT等）
        fileIds: [
            {
                type: getMongoose().Schema.Types.ObjectId,
                ref: 'File',
            },
        ],
        // 学习资料配置（按类型分组，显示名称同步）
        learningMaterials: {
            video: [{
                fileId: { type: getMongoose().Schema.Types.ObjectId, ref: 'File' },
                title: { type: String, trim: true, maxlength: 200 },
                description: { type: String, trim: true, maxlength: 500 },
                order: { type: Number, default: 0 }
            }],
            pdf: [{
                fileId: { type: getMongoose().Schema.Types.ObjectId, ref: 'File' },
                title: { type: String, trim: true, maxlength: 200 },
                description: { type: String, trim: true, maxlength: 500 },
                order: { type: Number, default: 0 }
            }],
            ppt: [{
                fileId: { type: getMongoose().Schema.Types.ObjectId, ref: 'File' },
                title: { type: String, trim: true, maxlength: 200 },
                description: { type: String, trim: true, maxlength: 500 },
                order: { type: Number, default: 0 }
            }],
            other: [{
                fileId: { type: getMongoose().Schema.Types.ObjectId, ref: 'File' },
                title: { type: String, trim: true, maxlength: 200 },
                description: { type: String, trim: true, maxlength: 500 },
                order: { type: Number, default: 0 }
            }]
        },
        // 封面图片
        coverImage: {
            type: String,
        },
        // 标签
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        // 关键字（用于搜索）
        keywords: [
            {
                type: String,
                trim: true,
            },
        ],
        // 作者/讲师
        author: {
            type: String,
            trim: true,
        },
        // 时长（视频用，秒）
        duration: {
            type: Number,
            default: 0,
        },
        // 难度等级: beginner, intermediate, advanced
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
        },
        // 是否必修
        isRequired: {
            type: Boolean,
            default: false,
        },
        // 排序
        order: {
            type: Number,
            default: 0,
        },
        // 状态: draft, published, archived
        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
        },
        // 浏览次数
        viewCount: {
            type: Number,
            default: 0,
        },
        // 学习次数
        learnCount: {
            type: Number,
            default: 0,
        },
        // 创建者
        createdBy: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
        },
        // 审核状态: pending, approved, rejected
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        // 审核意见
        approvalNote: {
            type: String,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// 虚拟字段：关联的文件
learningPageSchema.virtual('files', {
    ref: 'File',
    localField: 'fileIds',
    foreignField: '_id',
});

// 索引
learningPageSchema.index({ categoryId: 1, order: 1 });
learningPageSchema.index({ pageType: 1, status: 1 });
learningPageSchema.index({ title: 'text', keywords: 'text' });
learningPageSchema.index({ slug: 1 }, { unique: true, sparse: true });

// 自动生成slug
learningPageSchema.pre('save', function (next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }
    next();
});

module.exports = dbAdapter.getModel('LearningPage', learningPageSchema);
