const dbAdapter = require('../utils/dbAdapter');

let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

const learningProgressSchema = new (getMongoose().Schema)(
    {
        // 用户和学习内容关联
        userId: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        knowledgeId: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'Knowledge',
            required: true,
        },

        // 文件级进度
        fileProgress: [
            {
                fileId: {
                    type: getMongoose().Schema.Types.ObjectId,
                    ref: 'File',
                },
                status: {
                    type: String,
                    enum: ['not-started', 'in-progress', 'completed'],
                    default: 'not-started',
                },
                progress: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 100,
                },
                lastPosition: Number, // 视频/音频最后位置（秒）或PDF页码
                completedAt: Date,
                timeSpent: {
                    type: Number,
                    default: 0, // 实际学习时间（秒）
                },
            },
        ],

        // 知识点级汇总
        overallStatus: {
            type: String,
            enum: ['not-started', 'in-progress', 'completed'],
            default: 'not-started',
        },
        overallProgress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // 时间记录
        startedAt: Date,
        lastAccessedAt: Date,
        completedAt: Date,

        // 笔记
        notes: [
            {
                fileId: {
                    type: getMongoose().Schema.Types.ObjectId,
                    ref: 'File',
                },
                timestamp: Number, // 视频时间点或页码
                content: {
                    type: String,
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // 收藏
        isBookmarked: {
            type: Boolean,
            default: false,
        },
        bookmarkedAt: Date,
    },
    {
        timestamps: true,
    }
);

// 复合索引
learningProgressSchema.index({ userId: 1, knowledgeId: 1 }, { unique: true });
learningProgressSchema.index({ userId: 1, overallStatus: 1 });

// 方法：更新文件进度
learningProgressSchema.methods.updateFileProgress = async function (fileId, progress, position) {
    const fileProg = this.fileProgress.find(fp => fp.fileId.equals(fileId));

    if (fileProg) {
        fileProg.progress = progress;
        fileProg.lastPosition = position;
        fileProg.status =
            progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started';
        if (progress >= 100 && !fileProg.completedAt) {
            fileProg.completedAt = new Date();
        }
    } else {
        this.fileProgress.push({
            fileId,
            progress,
            lastPosition: position,
            status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started',
            completedAt: progress >= 100 ? new Date() : null,
        });
    }

    // 重新计算整体进度
    this.calculateOverallProgress();
    this.lastAccessedAt = new Date();
    await this.save();
};

// 方法：计算整体进度
learningProgressSchema.methods.calculateOverallProgress = function () {
    if (this.fileProgress.length === 0) {
        this.overallProgress = 0;
        return;
    }

    const totalProgress = this.fileProgress.reduce((sum, fp) => sum + fp.progress, 0);
    this.overallProgress = Math.round(totalProgress / this.fileProgress.length);

    if (this.overallProgress >= 100) {
        this.overallStatus = 'completed';
        if (!this.completedAt) {
            this.completedAt = new Date();
        }
    } else if (this.overallProgress > 0) {
        this.overallStatus = 'in-progress';
        if (!this.startedAt) {
            this.startedAt = new Date();
        }
    }
};

// 方法：添加笔记
learningProgressSchema.methods.addNote = async function (fileId, timestamp, content) {
    this.notes.push({
        fileId,
        timestamp,
        content,
    });
    await this.save();
};

// 静态方法：获取或创建学习进度
learningProgressSchema.statics.getOrCreate = async function (userId, knowledgeId) {
    let progress = await this.findOne({ userId, knowledgeId });

    if (!progress) {
        const knowledge = await getMongoose().model('Knowledge').findById(knowledgeId);
        if (!knowledge) {
            throw new Error('Knowledge not found');
        }

        // 初始化文件进度
        const fileProgress = knowledge.files.map(file => ({
            fileId: file.fileId,
            status: 'not-started',
            progress: 0,
        }));

        progress = await this.create({
            userId,
            knowledgeId,
            fileProgress,
            startedAt: new Date(),
            lastAccessedAt: new Date(),
        });
    }

    return progress;
};

module.exports = dbAdapter.getModel('LearningProgress', learningProgressSchema);
