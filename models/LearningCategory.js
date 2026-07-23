/**
 * 动态页面管理系统 - 分类模型
 * 支持四级页面层级架构
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
const categorySchema = new (getMongoose().Schema)(
    {
        // 分类名称
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        // 父分类ID（用于构建层级关系）
        parentId: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'LearningCategory',
            default: null,
        },
        // 层级深度 (1-4)
        level: {
            type: Number,
            required: true,
            enum: [1, 2, 3, 4],
            default: 1,
        },
        // 排序顺序
        order: {
            type: Number,
            default: 0,
        },
        // 图标
        icon: {
            type: String,
            default: 'fas fa-folder',
        },
        // 描述
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        // 所属模块: knowledge, cases, exams
        module: {
            type: String,
            required: true,
            enum: ['knowledge', 'cases', 'exams'],
            default: 'knowledge',
        },
        // 状态: active, inactive
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        // 创建者
        createdBy: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// 虚拟字段：子分类
categorySchema.virtual('children', {
    ref: 'LearningCategory',
    localField: '_id',
    foreignField: 'parentId',
});

// 虚拟字段：页面数量
categorySchema.virtual('pageCount', {
    ref: 'LearningPage',
    localField: '_id',
    foreignField: 'categoryId',
    count: true,
});

// 索引
categorySchema.index({ parentId: 1, order: 1 });
categorySchema.index({ module: 1, level: 1 });
categorySchema.index({ name: 'text', description: 'text' });

module.exports = dbAdapter.getModel('LearningCategory', categorySchema);
