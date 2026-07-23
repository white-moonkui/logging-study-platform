/**
 * 文档模型
 * 存储上传的文档及其解析后的内容
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

const documentSchema = new (getMongoose().Schema)(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
            enum: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'text/markdown',
            ],
        },
        fileSize: {
            type: Number,
            required: true,
        },

        // 解析后的内容
        extractedContent: {
            type: String,
            default: '',
        },
        pages: {
            type: Number,
            default: 0,
        },
        chunks: [
            {
                text: String,
                index: Number,
                start: Number,
                end: Number,
            },
        ],

        // 元数据
        category: {
            type: String,
            enum: ['manual', 'case', 'standard', 'report', 'training', 'other'],
            default: 'other',
        },
        tags: [
            {
                type: String,
            },
        ],

        // 索引状态
        isIndexed: {
            type: Boolean,
            default: false,
        },
        indexedAt: {
            type: Date,
        },
        vectorCount: {
            type: Number,
            default: 0,
        },

        // 上传信息
        uploadedBy: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // 状态
        status: {
            type: String,
            enum: ['uploading', 'parsing', 'indexing', 'ready', 'error'],
            default: 'uploading',
        },
        errorMessage: {
            type: String,
        },

        // 软删除
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// 索引
documentSchema.index({ title: 'text', extractedContent: 'text', tags: 1 });
documentSchema.index({ category: 1, status: 1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

// 查询方法
documentSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, isDeleted: false });
};

documentSchema.statics.findByCategory = function (category) {
    return this.findActive({ category });
};

documentSchema.statics.findNotIndexed = function () {
    return this.findActive({ isIndexed: false, status: 'ready' });
};

// 实例方法
documentSchema.methods.markAsIndexed = async function () {
    this.isIndexed = true;
    this.indexedAt = new Date();
    this.vectorCount = this.chunks ? this.chunks.length : 0;
    return this.save();
};

documentSchema.methods.markAsError = function (message) {
    this.status = 'error';
    this.errorMessage = message;
};

const Document = dbAdapter.getModel('Document', documentSchema);

module.exports = Document;
