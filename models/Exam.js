const dbAdapter = require('../utils/dbAdapter');

// 延迟导入 mongoose，仅在需要时加载
let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

const examSchema = new (getMongoose().Schema)(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        category: {
            type: String,
            required: true,
            enum: ['basic', 'standard', 'cross', 'comprehensive'],
        },
        difficulty: {
            type: String,
            required: true,
            enum: ['beginner', 'intermediate', 'advanced'],
        },
        timeLimit: {
            type: Number, // 分钟
            required: true,
        },
        passingScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        questions: [
            {
                questionText: {
                    type: String,
                    required: true,
                },
                questionType: {
                    type: String,
                    required: true,
                    enum: ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'essay'],
                },
                options: [String], // 选择题选项
                correctAnswer: getMongoose().Schema.Types.Mixed, // 单选/多选为数字或数组，判断为布尔值，填空为字符串，论述为参考答案
                explanation: String,
                points: {
                    type: Number,
                    required: true,
                    default: 1,
                },
                difficulty: {
                    type: String,
                    enum: ['easy', 'medium', 'hard'],
                    default: 'medium',
                },
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
            },
        ],
        isPublished: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        randomizeQuestions: {
            type: Boolean,
            default: false,
        },
        randomizeOptions: {
            type: Boolean,
            default: false,
        },
        allowReview: {
            type: Boolean,
            default: true,
        },
        maxAttempts: {
            type: Number,
            default: 3,
        },
        tags: [
            {
                type: String,
            },
        ],
        // 题目来源
        source: {
            type: String,
            enum: ['preset', 'ai'],
            default: 'preset',
        },
        sourceRef: {
            type: String,
            comment: '预设题库标识，用于重导匹配（如 CJ-0）',
        },
        generatedAt: {
            type: Date,
            comment: 'AI 生成时间，非 AI 来源为 null',
        },
    },
    {
        timestamps: true,
    }
);

const examResultSchema = new (getMongoose().Schema)(
    {
        exam: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'Exam',
            required: true,
        },
        user: {
            type: getMongoose().Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        attemptNumber: {
            type: Number,
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
        },
        timeSpent: {
            type: Number, // 秒
        },
        answers: [
            {
                questionIndex: Number,
                answer: getMongoose().Schema.Types.Mixed,
                isCorrect: Boolean,
                points: Number,
                timeSpent: Number, // 答题用时（秒）
            },
        ],
        totalPoints: {
            type: Number,
            required: true,
        },
        earnedPoints: {
            type: Number,
            required: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        passed: {
            type: Boolean,
            required: true,
        },
        detailedResults: {
            correctCount: Number,
            incorrectCount: Number,
            skippedCount: Number,
            accuracyByDifficulty: {
                easy: Number,
                medium: Number,
                hard: Number,
            },
            accuracyByCategory: {
                basic: Number,
                standard: Number,
                cross: Number,
            },
        },
        abilityImprovement: {
            beforeTest: {
                professionalKnowledge: Number,
                standardApplication: Number,
                crossIntegration: Number,
                practicalSkills: Number,
                decisionAbility: Number,
            },
            afterTest: {
                professionalKnowledge: Number,
                standardApplication: Number,
                crossIntegration: Number,
                practicalSkills: Number,
                decisionAbility: Number,
            },
        },
        recommendations: [String],
        nextSteps: [String],
    },
    {
        timestamps: true,
    }
);

const Exam = dbAdapter.getModel('Exam', examSchema);
const ExamResult = dbAdapter.getModel('ExamResult', examResultSchema);

module.exports = { Exam, ExamResult };
