/**
 * 数据迁移脚本 v1.1
 * 用途：初始化监督站单位和更新现有数据
 * 执行：node scripts/migrate-v1.1.js
 */

require('dotenv').config();
const dbAdapter = require('../utils/dbAdapter');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Knowledge = require('../models/Knowledge');

async function migrate() {
    try {
        console.log('🚀 开始数据迁移 v1.1...\n');

        // 连接数据库
        await dbAdapter.connect();
        console.log('✅ 数据库连接成功\n');

        // Step 1: 创建默认监督站
        console.log('📋 Step 1: 创建默认监督站...');
        let defaultOrg = await Organization.findOne({ type: 'supervision' });

        if (!defaultOrg) {
            defaultOrg = await Organization.create({
                name: '测井监督站',
                type: 'supervision',
                code: 'WLS-001',
                status: 'active',
                contact: {
                    address: '',
                    phone: '',
                    email: '',
                },
                config: {
                    maxUsers: 200,
                    storageQuota: 50 * 1024 * 1024 * 1024, // 50GB
                    allowedModules: ['learning', 'evaluation', 'knowledge', 'achievement', 'exam'],
                    customBranding: {
                        logo: '',
                        primaryColor: '#2563eb',
                    },
                },
                stats: {
                    totalUsers: 0,
                    totalKnowledge: 0,
                    storageUsed: 0,
                },
            });
            console.log(`✅ 创建监督站成功: ${defaultOrg.name} (${defaultOrg._id})\n`);
        } else {
            console.log(`ℹ️ 监督站已存在: ${defaultOrg.name} (${defaultOrg._id})\n`);
        }

        // Step 2: 更新所有用户
        console.log('📋 Step 2: 更新用户组织信息...');
        const usersWithoutOrg = await User.find({
            $or: [{ organization: { $exists: false } }, { organization: null }],
        });

        console.log(`   找到 ${usersWithoutOrg.length} 个需要更新的用户`);

        for (const user of usersWithoutOrg) {
            user.organization = {
                unitId: defaultOrg._id,
                unitName: defaultOrg.name,
                unitType: defaultOrg.type,
                position:
                    user.role === 'admin'
                        ? '管理员'
                        : user.role === 'instructor'
                          ? '教师'
                          : '监督工程师',
                employeeId: `WLS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            };

            // 设置默认权限
            if (user.role === 'admin') {
                user.permissions = {
                    canCreateContent: true,
                    canApproveContent: true,
                    canManageUsers: true,
                    canViewReports: true,
                };
            } else if (user.role === 'instructor') {
                user.permissions = {
                    canCreateContent: true,
                    canApproveContent: false,
                    canManageUsers: false,
                    canViewReports: true,
                };
            } else {
                user.permissions = {
                    canCreateContent: false,
                    canApproveContent: false,
                    canManageUsers: false,
                    canViewReports: true,
                };
            }

            await user.save();
        }

        console.log(`✅ 更新用户完成: ${usersWithoutOrg.length} 个用户\n`);

        // Step 3: 更新所有知识点
        console.log('📋 Step 3: 更新知识点可见性设置...');
        const knowledgesWithoutVisibility = await Knowledge.find({
            $or: [{ visibility: { $exists: false } }, { visibility: null }],
        });

        console.log(`   找到 ${knowledgesWithoutVisibility.length} 个需要更新的知识点`);

        for (const knowledge of knowledgesWithoutVisibility) {
            knowledge.visibility = {
                type: 'unitType',
                allowedUnitTypes: ['supervision'],
                allowedUnits: [],
                allowedRoles: ['student', 'instructor', 'admin'],
            };

            // 设置组织ID
            if (!knowledge.organizationId) {
                knowledge.organizationId = defaultOrg._id;
            }

            // 迁移旧的状态字段到新字段
            if (knowledge.isPublished && !knowledge.status) {
                knowledge.status = 'published';
            } else if (!knowledge.status) {
                knowledge.status = 'draft';
            }

            await knowledge.save();
        }

        console.log(`✅ 更新知识点完成: ${knowledgesWithoutVisibility.length} 个知识点\n`);

        // Step 4: 更新监督站统计
        console.log('📋 Step 4: 更新监督站统计信息...');
        const totalUsers = await User.countDocuments({ 'organization.unitId': defaultOrg._id });
        const totalKnowledge = await Knowledge.countDocuments({ organizationId: defaultOrg._id });

        defaultOrg.stats.totalUsers = totalUsers;
        defaultOrg.stats.totalKnowledge = totalKnowledge;
        await defaultOrg.save();

        console.log(`✅ 统计信息更新完成:`);
        console.log(`   - 总用户数: ${totalUsers}`);
        console.log(`   - 总知识点数: ${totalKnowledge}\n`);

        // 迁移完成
        console.log('🎉 数据迁移 v1.1 完成！\n');
        console.log('📊 迁移摘要:');
        console.log(`   ✓ 监督站: ${defaultOrg.name}`);
        console.log(`   ✓ 更新用户: ${usersWithoutOrg.length} 个`);
        console.log(`   ✓ 更新知识点: ${knowledgesWithoutVisibility.length} 个`);
        console.log(`   ✓ 当前总用户: ${totalUsers}`);
        console.log(`   ✓ 当前总知识点: ${totalKnowledge}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ 迁移失败:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// 执行迁移
migrate();
