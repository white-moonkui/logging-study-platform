const dbAdapter = require('../utils/dbAdapter');

// 延迟导入 mongoose，仅在需要时加载
let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

const userSchema = new (getMongoose().Schema)(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            default: 'student',
        },
        profile: {
            name: String,
            title: String,
            organization: String,
            experience: Number, // 工作年限
        },
        learningProgress: {
            basicKnowledge: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            standards: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            crossDiscipline: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
        },
        abilityMatrix: {
            professionalKnowledge: { type: Number, default: 0 },
            standardApplication: { type: Number, default: 0 },
            crossIntegration: { type: Number, default: 0 },
            practicalSkills: { type: Number, default: 0 },
            decisionAbility: { type: Number, default: 0 },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = dbAdapter.getModel('User', userSchema);
