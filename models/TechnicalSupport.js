const dbAdapter = require('../utils/dbAdapter');

let mongoose;
const getMongoose = () => {
    if (!mongoose) {mongoose = require('mongoose');}
    return mongoose;
};

const technicalSupportSchema = new (getMongoose().Schema)(
    {
        type: {
            type: String,
            required: true,
            enum: ['troubleshooting', 'consultation', 'submission'],
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'resolved'],
            default: 'pending',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        solution: {
            type: String,
            default: '',
        },
        attachments: [
            {
                filename: String,
                path: String,
                type: String,
            },
        ],
        submittedBy: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        assignedTo: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        aiDiagnosis: {
            suggestedSolution: String,
            relatedCases: [String],
            confidence: Number,
        },
        responseCount: {
            type: Number,
            default: 0,
        },
        lastResponseAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

technicalSupportSchema.index({ status: 1, createdAt: -1 });
technicalSupportSchema.index({ submittedBy: 1, createdAt: -1 });
technicalSupportSchema.index({ category: 1, status: 1 });

module.exports = dbAdapter.getModel('TechnicalSupport', technicalSupportSchema);
