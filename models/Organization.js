const dbAdapter = require('../utils/dbAdapter');

let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

const organizationSchema = new (getMongoose().Schema)(
    {
        // 基本信息
        name: {
            type: String,
            required: true,
            trim: true,
            default: '测井监督站',
        },
        type: {
            type: String,
            enum: ['supervision', 'construction'],
            default: 'supervision',
            required: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            default: 'WLS-001',
        },

        // 联系信息
        contact: {
            address: String,
            phone: String,
            email: String,
        },

        // 单位配置
        config: {
            maxUsers: {
                type: Number,
                default: 200,
            },
            storageQuota: {
                type: Number,
                default: 50 * 1024 * 1024 * 1024, // 50GB
            },
            allowedModules: [
                {
                    type: String,
                    enum: ['learning', 'evaluation', 'knowledge', 'achievement', 'exam'],
                },
            ],
            customBranding: {
                logo: String,
                primaryColor: {
                    type: String,
                    default: '#2563eb',
                },
            },
        },

        // 统计信息
        stats: {
            totalUsers: {
                type: Number,
                default: 0,
            },
            totalKnowledge: {
                type: Number,
                default: 0,
            },
            storageUsed: {
                type: Number,
                default: 0,
            },
        },

        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

// 静态方法：获取默认监督站
organizationSchema.statics.getDefaultSupervisionStation = async function () {
    let org = await this.findOne({ type: 'supervision' });
    if (!org) {
        org = await this.create({
            name: '测井监督站',
            type: 'supervision',
            code: 'WLS-001',
            allowedModules: ['learning', 'evaluation', 'knowledge', 'achievement', 'exam'],
        });
    }
    return org;
};

module.exports = dbAdapter.getModel('Organization', organizationSchema);
