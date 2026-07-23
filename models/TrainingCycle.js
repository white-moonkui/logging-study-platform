const dbAdapter = require('../utils/dbAdapter');

let mongoose;
const getMongoose = () => {
    if (!mongoose) { mongoose = require('mongoose'); }
    return mongoose;
};

const cycleSchema = new (getMongoose().Schema)({
    userId: { type: getMongoose().Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['initial', 'remediation'], default: 'initial' },
    status: {
        type: String,
        enum: ['learning', 'exam_ready', 'evaluated', 'remediation', 'closed'],
        default: 'learning',
    },
    exams: [{
        examId: { type: getMongoose().Schema.Types.ObjectId, ref: 'Exam' },
        resultId: { type: getMongoose().Schema.Types.ObjectId, ref: 'ExamResult' },
        score: Number,
        passed: Boolean,
        takenAt: Date,
    }],
    gaps: [{
        dimension: { type: String },
        score: Number,
        threshold: Number,
        gap: Number,
        priority: { type: String, enum: ['high', 'medium', 'low'] },
        suggestedKnowledge: [{ type: getMongoose().Schema.Types.ObjectId, ref: 'Knowledge' }],
    }],
    remediation: {
        assignedAt: Date,
        completedAt: Date,
        knowledgeItems: [{
            knowledgeId: { type: getMongoose().Schema.Types.ObjectId, ref: 'Knowledge' },
            completed: { type: Boolean, default: false },
            completedAt: Date,
        }],
        retestExamId: { type: getMongoose().Schema.Types.ObjectId, ref: 'Exam' },
        retestResultId: { type: getMongoose().Schema.Types.ObjectId, ref: 'ExamResult' },
        scoreDelta: Number,
    },
    abilityBefore: {
        professionalKnowledge: Number,
        standardApplication: Number,
        crossIntegration: Number,
        practicalSkills: Number,
        decisionAbility: Number,
    },
    abilityAfter: {
        professionalKnowledge: Number,
        standardApplication: Number,
        crossIntegration: Number,
        practicalSkills: Number,
        decisionAbility: Number,
    },
}, { timestamps: true });

cycleSchema.index({ userId: 1, createdAt: -1 });

cycleSchema.statics.getCurrent = function (userId) {
    return this.findOne({ userId, status: { $ne: 'closed' } }).sort({ createdAt: -1 });
};

cycleSchema.statics.getHistory = function (userId, limit = 10) {
    return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

module.exports = dbAdapter.getModel('TrainingCycle', cycleSchema);
