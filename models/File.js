const dbAdapter = require('../utils/dbAdapter');

let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

const fileSchema = new (getMongoose().Schema)(
    {
        // 文件基本信息
        originalName: {
            type: String,
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },

        // 存储信息
        storageType: {
            type: String,
            enum: ['gridfs', 'local'],
            required: true,
        },
        gridfsId: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'fs.files', // GridFS 文件引用
        },
        localPath: String, // 本地存储路径

        // 文件元数据
        mimeType: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        extension: {
            type: String,
            required: true,
        },

        // 文件类型
        type: {
            type: String,
            enum: ['video', 'pdf', 'word', 'excel', 'ppt', 'image', 'other'],
            required: true,
        },

        // 类型特定信息
        videoInfo: {
            duration: Number, // 秒
            resolution: String, // 如 "1920x1080"
            thumbnail: String, // 缩略图路径
        },

        // 版本控制
        version: {
            type: Number,
            default: 1,
        },
        previousVersions: [
            {
                version: Number,
                fileId: {
                    type: getMongoose().Schema.Types.ObjectId,
                    ref: 'File',
                },
                updatedAt: Date,
            },
        ],

        // 访问统计
        stats: {
            downloadCount: {
                type: Number,
                default: 0,
            },
            viewCount: {
                type: Number,
                default: 0,
            },
            lastAccessedAt: Date,
        },

        // 安全
        checksum: String, // SHA256 校验和

        // 上传信息
        uploadedBy: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationId: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// 索引
fileSchema.index({ type: 1, organizationId: 1 });
fileSchema.index({ uploadedBy: 1 });

// 方法：增加访问计数
fileSchema.methods.incrementView = async function () {
    this.stats.viewCount += 1;
    this.stats.lastAccessedAt = new Date();
    await this.save();
};

// 方法：获取文件访问URL
fileSchema.methods.getAccessUrl = function () {
    if (this.storageType === 'gridfs') {
        return `/api/files/${this._id}/stream`;
    } else {
        return `/uploads/${this.localPath}`;
    }
};

module.exports = dbAdapter.getModel('File', fileSchema);
