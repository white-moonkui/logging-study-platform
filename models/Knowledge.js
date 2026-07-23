const dbAdapter = require('../utils/dbAdapter');
const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, maxlength: 200 },
        categoryId: { type: String, required: true, ref: 'Category' },
        description: { type: String, maxlength: 1000 },
        content: { type: String, default: '' },
        keywords: [{ type: String }],
        level: { type: Number, default: 1 },
        sortOrder: { type: Number, default: 0 },
        status: { type: String, default: 'draft', enum: ['draft', 'published', 'pending'] },
        videoCover: { type: String },
        videoDuration: { type: Number },
        fileCount: { type: Number, default: 0 },
        videoCount: { type: Number, default: 0 },
        documentCount: { type: Number, default: 0 },
        presentationCount: { type: Number, default: 0 },
        imageCount: { type: Number, default: 0 },
        createdBy: { type: String, ref: 'User' },
    },
    {
        timestamps: true,
        collection: 'knowledge_items',
    }
);

module.exports = dbAdapter.getModel('Knowledge', knowledgeSchema);
