const dbAdapter = require('../utils/dbAdapter');

// 延迟导入 mongoose，仅在需要时加载
let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

const caseSchema = new (getMongoose().Schema)(
    {
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
            enum: [
                'reservoir_evaluation',
                'drilling',
                'production',
                'trouble_shooting',
                'new_technology',
            ],
        },
        wellInfo: {
            wellName: String,
            location: String,
            depth: Number,
            formation: String,
            drillingDate: Date,
        },
        problemStatement: {
            type: String,
            required: true,
        },
        analysisProcess: {
            type: String,
            required: true,
        },
        solution: {
            type: String,
            required: true,
        },
        results: {
            type: String,
        },
        lessons: {
            type: String,
        },
        keywords: [
            {
                type: String,
                required: true,
            },
        ],
        technicalTerms: [
            {
                term: String,
                definition: String,
            },
        ],
        relatedKnowledge: [
            {
                type: getMongoose().Schema.Types.ObjectId,
                ref: 'Knowledge',
            },
        ],
        relatedCases: [
            {
                type: getMongoose().Schema.Types.ObjectId,
                ref: 'Case',
            },
        ],
        attachments: [
            {
                filename: String,
                path: String,
                type: String, // log_data, report, image, etc.
            },
        ],
        difficulty: {
            type: String,
            enum: ['basic', 'intermediate', 'advanced'],
            default: 'intermediate',
        },
        interactivityLevel: {
            type: String,
            enum: ['reading', 'guided', 'interactive'],
            default: 'reading',
        },
        interactiveSteps: [
            {
                stepNumber: Number,
                instruction: String,
                expectedInput: String,
                hints: [String],
                feedback: String,
            },
        ],
        status: {
            type: String,
            enum: ['draft', 'pending_review', 'approved', 'published', 'rejected'],
            default: 'draft',
        },
        aiEvaluation: {
            innovationScore: { type: Number, min: 0, max: 100 },
            technicalAccuracy: { type: Number, min: 0, max: 100 },
            practicalValue: { type: Number, min: 0, max: 100 },
            completenessScore: { type: Number, min: 0, max: 100 },
            similarCases: [{ type: getMongoose().Schema.Types.ObjectId, ref: 'Case' }],
            recommendations: [String],
            evaluatedAt: Date,
            aiComments: String,
        },
        humanReview: {
            reviewer: { type: getMongoose().Schema.Types.ObjectId, ref: 'User' },
            reviewDate: Date,
            approved: Boolean,
            comments: String,
            rejectionReason: String,
        },
        submittedBy: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        rating: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
        userInteractions: [
            {
                user: { type: getMongoose().Schema.Types.ObjectId, ref: 'User' },
                interactionType: {
                    type: String,
                    enum: ['view', 'complete', 'bookmark', 'share'],
                },
                timestamp: { type: Date, default: Date.now },
                progress: { type: Number, default: 0 }, // for interactive cases
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = dbAdapter.getModel('Case', caseSchema);
