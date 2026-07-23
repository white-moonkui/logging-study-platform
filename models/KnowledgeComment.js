const dbAdapter = require('../utils/dbAdapter');
const mongoose = require('mongoose');

const knowledgeCommentSchema = new mongoose.Schema(
    {
        knowledgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Knowledge',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxLength: 2000,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        helpfulCount: {
            type: Number,
            default: 0,
        },
        helpfulUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        parentCommentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'KnowledgeComment',
            default: null,
        },
        isHidden: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// 索引优化
knowledgeCommentSchema.index({ knowledgeId: 1, createdAt: -1 });
knowledgeCommentSchema.index({ userId: 1 });

module.exports = dbAdapter.getModel('KnowledgeComment', knowledgeCommentSchema);
