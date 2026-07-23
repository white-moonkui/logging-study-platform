/**
 * 初始化交互式学习案例示例数据
 * 运行：node scripts/init-interactive-cases.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { interactiveCaseExamples } = require('../data/interactiveCaseExamples');
const Case = require('../models/Case');
const User = require('../models/User');

async function initInteractiveCases() {
    console.log('🚀 开始初始化交互式学习案例数据...\n');

    try {
        // 查找管理员用户作为案例提交者
        let adminUser = await User.findOne({ role: 'admin' });

        if (!adminUser) {
            console.log('⚠️  未找到管理员用户，尝试查找任何用户...');
            const anyUser = await User.findOne();
            if (!anyUser) {
                console.log('❌ 数据库中没有用户，请先运行数据库初始化');
                process.exit(1);
            }
            adminUser = anyUser;
        }

        console.log(`✅ 使用用户: ${adminUser.username} (${adminUser._id})\n`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const example of interactiveCaseExamples) {
            // 检查是否已存在同名案例
            const existingCase = await Case.findOne({ title: example.title });

            if (existingCase) {
                console.log(`⏭️  跳过: "${example.title}" (已存在)`);
                skippedCount++;
                continue;
            }

            // 准备案例数据
            const caseData = {
                ...example,
                submittedBy: adminUser._id,
                status: 'published',
                viewCount: 0,
                rating: { average: 0, count: 0 },
                userInteractions: [],
            };

            // 创建案例
            const newCase = new Case(caseData);
            await newCase.save();

            console.log(`✅ 创建成功: "${example.title}"`);
            console.log(`   📚 类型: ${example.category}`);
            console.log(`   📊 难度: ${example.difficulty}`);
            console.log(`   🔄 互动步骤: ${example.interactiveSteps?.length || 0} 步`);
            console.log('');
            createdCount++;
        }

        console.log('\n📊 初始化完成统计:');
        console.log(`   ✅ 新增案例: ${createdCount} 个`);
        console.log(`   ⏭️  跳过案例: ${skippedCount} 个`);
        console.log(`   📚 总计案例: ${createdCount + skippedCount} 个`);

        // 显示所有互动式案例
        console.log('\n📋 当前系统中的交互式学习案例:');
        const allInteractiveCases = await Case.find({
            interactivityLevel: 'interactive',
            status: 'published',
        }).select('title category difficulty interactiveSteps');

        allInteractiveCases.forEach((c, index) => {
            console.log(`   ${index + 1}. ${c.title}`);
            console.log(
                `      类别: ${c.category} | 难度: ${c.difficulty} | 步骤: ${c.interactiveSteps?.length || 0}`
            );
        });

        console.log('\n🎉 交互式学习案例初始化完成！');
        console.log('💡 提示: 访问 /cases 页面可以查看和使用这些案例进行学习');
    } catch (error) {
        console.error('❌ 初始化失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }

    process.exit(0);
}

// 运行初始化
initInteractiveCases();
