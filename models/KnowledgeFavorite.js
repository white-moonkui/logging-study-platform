const dbAdapter = require('../utils/dbAdapter');
const mongoose = require('mongoose');

const knowledgeFavoriteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        knowledgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Knowledge',
            required: true,
        },
        folder: {
            type: String,
            default: '默认收藏夹',
        },
        note: {
            type: String,
            maxLength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// 确保用户对同一知识只有一个收藏
knowledgeFavoriteSchema.index({ userId: 1, knowledgeId: 1 }, { unique: true });

module.exports = dbAdapter.getModel('KnowledgeFavorite', knowledgeFavoriteSchema);
