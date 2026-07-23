#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const dbAdapter = require('./utils/dbAdapter');
const dbInitializer = require('./utils/dbInitializer');
const LocalAIService = require('./utils/localAIService');
const NetworkAIService = require('./utils/networkAIService');

class ApplicationStarter {
    constructor() {
        this.mongodbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/well_logging_training';
        this.port = process.env.PORT || 3000;
    }

    async start() {
        try {
            console.log('='.repeat(50));
            console.log('测井专业智能培训系统启动中...');
            console.log('='.repeat(50));

            // 1. 连接数据库
            await this.connectDatabase();

            // 2. 初始化数据库（如果需要）
            await this.initializeDatabase();

            // 3. 初始化测井知识学习数据
            await this.initializeLearningData();

            // 4. 导入试题题库（如果 Excel 存在且 Exam 为空）
            await this.importExamQuestions();

            // 5. 初始化AI服务
            await this.initializeAIService();

            // 5. 启动向量队列调度器
            this.initializeVectorQueue();

            // 6. 启动Web服务器
            await this.startWebServer();

            console.log('='.repeat(50));
            console.log('🎉 系统启动成功！');
            console.log(`📱 访问地址: http://localhost:${this.port}`);
            console.log(`📊 数据库: ${this.mongodbURI}`);
            console.log(`🤖 AI服务: ${process.env.USE_LOCAL_AI === 'true' ? '本地AI' : '外部AI'}`);
            console.log('='.repeat(50));
            console.log('📋 默认账户:');
            console.log('   管理员: admin / admin123');
            console.log('   学员: student / student123');
            console.log('='.repeat(50));
        } catch (error) {
            console.error('❌ 系统启动失败:', error.message);
            process.exit(1);
        }
    }

    async connectDatabase() {
        console.log('📡 连接数据库...');
        try {
            await dbAdapter.connect();
            console.log('✅ 数据库连接成功');
        } catch (error) {
            console.log('⚠️ 数据库连接失败:', error.message);
            throw error;
        }
    }

    async initializeDatabase() {
        console.log('🔍 检查数据库状态...');

        if (this.useFileStorage) {
            console.log('📁 使用文件存储模式，初始化示例数据...');
            await this.initializeFileData();
            return;
        }

        try {
            const User = require('./models/User');
            const userCount = await User.countDocuments();

            if (userCount === 0) {
                console.log('数据库为空，开始初始化示例数据...');
                await dbInitializer.initialize();
                await dbInitializer.verify();
            } else {
                console.log(`数据库已有 ${userCount} 个用户，跳过初始化`);
            }
        } catch (error) {
            console.log('⚠️ 数据库初始化失败，使用文件存储模式');
            this.useFileStorage = true;
            await this.initializeFileData();
        }
    }

    async initializeFileData() {
        console.log('📁 初始化文件存储数据...');
        const fs = require('fs');
        const path = require('path');

        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        console.log('✅ 文件存储初始化完成');
    }

    async initializeLearningData() {
        console.log('📚 初始化测井知识学习模块...');

        try {
            const LearningCategory = require('./models/LearningCategory');
            const LearningPage = require('./models/LearningPage');

            const categoryCount = await LearningCategory.countDocuments();

            if (categoryCount > 0) {
                console.log(`   已有 ${categoryCount} 个分类，跳过`);
                return;
            }

            // 创建一级分类
            const cat1 = new LearningCategory({
                name: '测井基础理论',
                level: 1,
                order: 1,
                icon: 'fas fa-book',
                description: '测井学基本原理和基础知识',
                module: 'knowledge',
                status: 'active'
            });
            await cat1.save();

            const cat2 = new LearningCategory({
                name: '测井仪器设备',
                level: 1,
                order: 2,
                icon: 'fas fa-cogs',
                description: '各类测井仪器原理和操作',
                module: 'knowledge',
                status: 'active'
            });
            await cat2.save();

            const cat3 = new LearningCategory({
                name: '现场作业技术',
                level: 1,
                order: 3,
                icon: 'fas fa-hard-hat',
                description: '测井现场施工技术和安全规范',
                module: 'knowledge',
                status: 'active'
            });
            await cat3.save();

            const cat4 = new LearningCategory({
                name: '测井资料解释',
                level: 1,
                order: 4,
                icon: 'fas fa-chart-line',
                description: '测井曲线分析和地质解释方法',
                module: 'knowledge',
                status: 'active'
            });
            await cat4.save();

            // 创建二级分类
            const subCats = [
                { parentId: cat1._id, name: '放射性测井', icon: 'fas fa-radiation', order: 1 },
                { parentId: cat1._id, name: '声波测井', icon: 'fas fa-wave-square', order: 2 },
                { parentId: cat1._id, name: '电阻率测井', icon: 'fas fa-bolt', order: 3 },
                { parentId: cat1._id, name: '核磁共振测井', icon: 'fas fa-magnet', order: 4 },
                { parentId: cat2._id, name: '电缆测井仪', icon: 'fas fa-cable', order: 1 },
                { parentId: cat2._id, name: '随钻测井仪', icon: 'fas fa-drill', order: 2 },
                { parentId: cat2._id, name: '成像测井仪', icon: 'fas fa-image', order: 3 },
                { parentId: cat3._id, name: '测井准备作业', icon: 'fas fa-clipboard-check', order: 1 },
                { parentId: cat3._id, name: '测井资料采集', icon: 'fas fa-database', order: 2 },
                { parentId: cat3._id, name: '安全操作规范', icon: 'fas fa-shield-alt', order: 3 },
                { parentId: cat4._id, name: '岩性识别', icon: 'fas fa-layer-group', order: 1 },
                { parentId: cat4._id, name: '储层评价', icon: 'fas fa-oil-injector', order: 2 },
                { parentId: cat4._id, name: '流体识别', icon: 'fas fa-tint', order: 3 }
            ];

            for (const sc of subCats) {
                const subCat = new LearningCategory({
                    ...sc,
                    level: 2,
                    description: `${sc.name}相关知识`,
                    module: 'knowledge',
                    status: 'active'
                });
                await subCat.save();
            }

            // 创建示例页面
            const pagesData = [
                {
                    title: '自然伽马测井原理',
                    categoryId: subCats[0].parentId,
                    pageType: 'video',
                    summary: '学习自然伽马测井的基本原理和应用',
                    content: '# 自然伽马测井原理\n\n自然伽马测井是测量地层自然放射性的测井方法。',
                    difficulty: 'intermediate',
                    isRequired: true,
                    status: 'published',
                    tags: ['基础', '放射性', '原理'],
                    keywords: ['自然伽马', '放射性测井', 'GR'],
                    author: '测井专家',
                    viewCount: 1250,
                    order: 1
                },
                {
                    title: '声波时差测井技术',
                    categoryId: subCats[1].parentId,
                    pageType: 'video',
                    summary: '声波时差测井的原理和影响因素',
                    content: '# 声波时差测井技术\n\n声波时差测井测量声波在介质中的传播时间。',
                    difficulty: 'intermediate',
                    isRequired: true,
                    status: 'published',
                    tags: ['声波', '时差', '孔隙度'],
                    keywords: ['声波时差', '孔隙度', 'AC'],
                    author: '测井专家',
                    viewCount: 980,
                    order: 1
                },
                {
                    title: '电阻率测井基础',
                    categoryId: subCats[2].parentId,
                    pageType: 'document',
                    summary: '电阻率测井的基本原理和公式',
                    content: '# 电阻率测井基础\n\n电阻率测井是测量地层电阻率的测井方法。',
                    difficulty: 'beginner',
                    isRequired: true,
                    status: 'published',
                    tags: ['基础', '电阻率', '原理'],
                    keywords: ['电阻率', '侵入', '冲洗带'],
                    author: '测井专家',
                    viewCount: 2100,
                    order: 1
                },
                {
                    title: '电缆测井仪结构',
                    categoryId: subCats[4].parentId,
                    pageType: 'document',
                    summary: '电缆测井仪的组成结构和工作原理',
                    content: '# 电缆测井仪结构\n\n电缆测井系统由地面设备和井下仪器组成。',
                    difficulty: 'beginner',
                    isRequired: true,
                    status: 'published',
                    tags: ['仪器', '电缆', '结构'],
                    keywords: ['电缆', '测井仪', '结构'],
                    author: '设备工程师',
                    viewCount: 750,
                    order: 1
                },
                {
                    title: '测井作业安全规程',
                    categoryId: subCats[8].parentId,
                    pageType: 'document',
                    summary: '测井作业过程中的安全操作规程',
                    content: '# 测井作业安全规程\n\n测井作业必须严格遵守安全操作规程。',
                    difficulty: 'beginner',
                    isRequired: true,
                    status: 'published',
                    tags: ['安全', '规程', '作业'],
                    keywords: ['安全', '规程', 'HSE'],
                    author: '安全主管',
                    viewCount: 3200,
                    order: 1
                },
                {
                    title: '砂岩储层测井解释',
                    categoryId: subCats[10].parentId,
                    pageType: 'video',
                    summary: '砂岩储层的测井曲线特征和解释方法',
                    content: '# 砂岩储层测井解释\n\n砂岩储层在测井曲线上的特征明显。',
                    difficulty: 'advanced',
                    isRequired: false,
                    status: 'published',
                    tags: ['解释', '储层', '砂岩'],
                    keywords: ['砂岩', '储层', '解释'],
                    author: '高级工程师',
                    viewCount: 560,
                    order: 1
                }
            ];

            for (const pageData of pagesData) {
                const page = new LearningPage(pageData);
                await page.save();
            }

            const totalCats = await LearningCategory.countDocuments();
            const totalPages = await LearningPage.countDocuments();
            console.log(`   ✅ 创建 ${totalCats} 个分类, ${totalPages} 个页面`);

        } catch (error) {
            console.log('⚠️ 测井知识学习模块初始化失败:', error.message);
        }
    }

    async importExamQuestions() {
        console.log('📝 检查试题题库...');
        try {
            const { Exam } = require('./models/Exam');
            // REIMPORT=true 强制重导（覆盖已有预设题库）
            if (process.env.REIMPORT === 'true') {
                console.log('   REIMPORT=true，强制重导...');
                await Exam.deleteMany({ source: 'preset' });
            } else {
                const imported = await Exam.findOne({ source: 'preset' });
                if (imported) {
                    console.log(`   预设题库已导入，跳过（REIMPORT=true 可强制重导）`);
                    return;
                }
            }
            const { importQuestions } = require('./scripts/import-exam-questions');
            const ok = await importQuestions();
            if (ok) {
                console.log('✅ 试题题库导入完成');
            }
        } catch (error) {
            console.log('⚠️ 题库导入跳过:', error.message);
        }
    }

    async initializeAIService() {
        console.log('🤖 初始化AI服务...');

        try {
            await LocalAIService.init();
            await NetworkAIService.init();
        } catch (error) {
            console.log('⚠️ AI服务初始化失败:', error.message);
            this.useFileStorage = true;
        }
    }

    initializeVectorQueue() {
        console.log('📊 初始化向量队列...');

        try {
            const { vectorQueue } = require('./services/vectorQueue');
            vectorQueue.start();
            console.log('✅ 向量队列调度器已启动');
        } catch (error) {
            console.log('⚠️ 向量队列调度器启动失败:', error.message);
        }
    }

    async startWebServer() {
        console.log('🌐 启动Web服务器...');

        // 从 server.js 导入已配置好中间件和路由的 Express app
        const app = require('./server');
        const PORT = process.env.PORT || 3000;

        // 不再需要单独的路由导入/注册——server.js 已全部配置
        // 不再需要单独的 sendFile UTF-8 中间件——server.js 已配置
        // 不再需要单独的错误处理中间件——server.js 已配置

        app.listen(PORT, () => {
            const logger = require('./utils/logger');
            logger.info(`测井培训系统服务器运行在端口 ${PORT}`);
        });

        return app;
    }
}

module.exports = ApplicationStarter;

// 如果直接运行此文件，则自动启动
if (require.main === module) {
    const starter = new ApplicationStarter();
    starter.start().catch(err => {
        console.error('启动失败:', err);
        process.exit(1);
    });
}
