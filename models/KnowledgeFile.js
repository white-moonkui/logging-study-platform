const dbAdapter = require('../utils/dbAdapter');
const mongoose = require('mongoose');

const knowledgeFileSchema = new mongoose.Schema(
    {
        knowledgeId: { type: String, required: true, ref: 'Knowledge' },
        fileType: {
            type: String,
            required: true,
            enum: ['video', 'document', 'presentation', 'image', 'other'],
        },
        filename: { type: String, required: true, maxlength: 255 },
        originalName: { type: String, required: true, maxlength: 255 },
        filePath: { type: String, required: true },
        fileSize: { type: Number, required: true },
        mimeType: { type: String, required: true },
        duration: { type: Number },
        thumbnail: { type: String },
        sortOrder: { type: Number, default: 0 },
        uploadedBy: { type: String, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        collection: 'knowledge_files',
    }
);

module.exports = dbAdapter.getModel('KnowledgeFile', knowledgeFileSchema);
