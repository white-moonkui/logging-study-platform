/**
 * 导入测井专业知识四级分类结构到内存数据库
 */
const LearningPage = require('../models/LearningPage');
const LearningCategory = require('../models/LearningCategory');

async function importLearningStructure() {
    try {
        console.log('开始导入测井专业知识学习结构...\n');

        // 一级分类（根分类）
        const level1Categories = [
            {
                name: '测井基础知识',
                level: 1,
                icon: 'fas fa-book-open',
                description: '测井专业基础理论知识',
                order: 1,
            },
            {
                name: '测井仪器设备',
                level: 1,
                icon: 'fas fa-microscope',
                description: '各类测井仪器的原理和使用',
                order: 2,
            },
            {
                name: '测井专业标准',
                level: 1,
                icon: 'fas fa-file-contract',
                description: '行业标准和规范学习',
                order: 3,
            },
            {
                name: '跨专业知识',
                level: 1,
                icon: 'fas fa-network-wired',
                description: '相关行业的交叉知识',
                order: 4,
            },
        ];

        // 二级分类
        const level2Categories = [
            // 测井基础知识下的二级分类
            {
                name: '测井基础理论',
                parentId: null,
                level: 2,
                icon: 'fas fa-theater-masks',
                description: '测井理论基础',
                order: 1,
            },
            {
                name: '测井物理基础',
                parentId: null,
                level: 2,
                icon: 'fas fa-bolt',
                description: '测井物理原理',
                order: 2,
            },

            // 测井仪器设备下的二级分类
            {
                name: '电法测井仪器',
                parentId: null,
                level: 2,
                icon: 'fas fa-bolt',
                description: '电法测井仪器',
                order: 1,
            },
            {
                name: '声波测井仪器',
                parentId: null,
                level: 2,
                icon: 'fas fa-wave-square',
                description: '声波测井仪器',
                order: 2,
            },
            {
                name: '放射性测井仪器',
                parentId: null,
                level: 2,
                icon: 'fas fa-radiation',
                description: '放射性测井仪器',
                order: 3,
            },
            {
                name: '新技术',
                parentId: null,
                level: 2,
                icon: 'fas fa-lightbulb',
                description: '最新测井技术',
                order: 4,
            },
            {
                name: '随钻测井仪器',
                parentId: null,
                level: 2,
                icon: 'fas fa-cog',
                description: 'LWD测井技术',
                order: 5,
            },
            {
                name: '过钻头仪器',
                parentId: null,
                level: 2,
                icon: 'fas fa-diamond',
                description: '过钻头测井技术',
                order: 6,
            },
            {
                name: '辅助工具设备',
                parentId: null,
                level: 2,
                icon: 'fas fa-tools',
                description: '辅助工具设备',
                order: 7,
            },

            // 测井专业标准下的二级分类
            {
                name: '测井施工规范',
                parentId: null,
                level: 2,
                icon: 'fas fa-file-contract',
                description: '测井施工技术规范',
                order: 1,
            },
            {
                name: '安全操作规程',
                parentId: null,
                level: 2,
                icon: 'fas fa-shield-alt',
                description: '安全操作规程',
                order: 2,
            },
            {
                name: '设备维护标准',
                parentId: null,
                level: 2,
                icon: 'fas fa-wrench',
                description: '设备维护标准',
                order: 3,
            },

            // 跨专业知识下的二级分类
            {
                name: '地质知识',
                parentId: null,
                level: 2,
                icon: 'fas fa-mountain',
                description: '地质学基础',
                order: 1,
            },
            {
                name: '钻井知识',
                parentId: null,
                level: 2,
                icon: 'fas fa-digging',
                description: '钻井工程知识',
                order: 2,
            },
            {
                name: '地球物理知识',
                parentId: null,
                level: 2,
                icon: 'fas fa-chart-line',
                description: '地球物理基础',
                order: 3,
            },
        ];

        // 三级分类（示例）
        const level3Categories = [
            // 测井基础知识
            { name: '测井定义与分类', parentId: level2Categories[0]._id, level: 3, order: 1 },
            { name: '测井基本原理', parentId: level2Categories[0]._id, level: 3, order: 2 },
            { name: '测井参数', parentId: level2Categories[0]._id, level: 3, order: 3 },
            { name: '电法测井原理', parentId: level2Categories[1]._id, level: 3, order: 1 },
            { name: '声波测井原理', parentId: level2Categories[1]._id, level: 3, order: 2 },

            // 测井仪器设备
            { name: '电阻率测井', parentId: level2Categories[2]._id, level: 3, order: 1 },
            { name: '侧向测井', parentId: level2Categories[2]._id, level: 3, order: 2 },
            { name: '感应测井', parentId: level2Categories[2]._id, level: 3, order: 3 },
            { name: '密度测井', parentId: level2Categories[2]._id, level: 3, order: 4 },
            { name: '伽马测井', parentId: level2Categories[2]._id, level: 3, order: 5 },
            { name: '声波测井仪器原理', parentId: level2Categories[3]._id, level: 3, order: 1 },
            { name: '阵列声波测井', parentId: level2Categories[3]._id, level: 3, order: 2 },

            // 测井专业标准
            { name: '行业标准', parentId: level2Categories[6]._id, level: 3, order: 1 },
            { name: '安全规范', parentId: level2Categories[6]._id, level: 3, order: 2 },

            // 跨专业知识
            { name: '地质学基础', parentId: level2Categories[9]._id, level: 3, order: 1 },
            { name: '岩石力学', parentId: level2Categories[9]._id, level: 3, order: 2 },
            { name: '钻井工程', parentId: level2Categories[10]._id, level: 3, order: 1 },
            { name: '油藏工程', parentId: level2Categories[10]._id, level: 3, order: 2 },
        ];

        // 四级分类（示例 - 内容页面）
        const level4Categories = [
            // 测井基础理论 - 内容页面
            {
                name: '测井定义与分类',
                parentId: level3Categories[0]._id,
                level: 4,
                order: 1,
                status: 'published',
            },
            {
                name: '测井基本原理详解',
                parentId: level3Categories[1]._id,
                level: 4,
                order: 1,
                status: 'published',
            },
            {
                name: '测井参数含义',
                parentId: level3Categories[2]._id,
                level: 4,
                order: 1,
                status: 'published',
            },
            {
                name: '测井解释方法',
                parentId: level3Categories[1]._id,
                level: 4,
                order: 2,
                status: 'published',
            },

            // 测井仪器设备 - 内容页面
            {
                name: '电阻率测井技术',
                parentId: level3Categories[3]._id,
                level: 4,
                order: 1,
                status: 'published',
                pageType: 'video',
            },
            {
                name: '侧向测井实践',
                parentId: level3Categories[4]._id,
                level: 4,
                order: 1,
                status: 'published',
                pageType: 'pdf',
            },
            {
                name: '感应测井原理',
                parentId: level3Categories[5]._id,
                level: 4,
                order: 1,
                status: 'published',
                pageType: 'video',
            },
            {
                name: '密度测井详解',
                parentId: level3Categories[5]._id,
                level: 4,
                order: 2,
                status: 'published',
                pageType: 'ppt',
            },
            {
                name: '伽马测井应用',
                parentId: level3Categories[5]._id,
                level: 4,
                order: 3,
                status: 'published',
                pageType: 'document',
            },
            {
                name: '声波测井技术',
                parentId: level3Categories[6]._id,
                level: 4,
                order: 1,
                status: 'published',
                pageType: 'video',
            },
            {
                name: '阵列声波测井',
                parentId: level3Categories[6]._id,
                level: 4,
                order: 2,
                status: 'published',
                pageType: 'pdf',
            },

            // 测井专业标准
            {
                name: '测井施工规范',
                parentId: level3Categories[7]._id,
                level: 4,
                order: 1,
                status: 'published',
                pageType: 'document',
            },
            {
                name: '安全操作规程',
                parentId: level3Categories[7]._id,
                level: 4,
                order: 2,
                status: 'published',
                pageType: 'pdf',
            },

            // 跨专业知识
            {
                name: '地质学基础',
                parentId: level3Categories[11]._id,
                level: 4,
                order: 1,
                status: 'published',
            },
            {
                name: '岩石力学基础',
                parentId: level3Categories[12]._id,
                level: 4,
                order: 1,
                status: 'published',
            },
            {
                name: '钻井工程',
                parentId: level3Categories[13]._id,
                level: 4,
                order: 1,
                status: 'published',
                pageType: 'video',
            },
            {
                name: '油藏工程',
                parentId: level3Categories[13]._id,
                level: 4,
                order: 2,
                status: 'published',
                pageType: 'document',
            },
        ];

        // 创建一级分类
        let level1Count = 0;
        for (const cat of level1Categories) {
            try {
                const created = await LearningCategory.create(cat);
                console.log(`✓ 创建一级分类: ${created.name}`);
                level1Count++;
            } catch (err) {
                console.error(`✗ 创建一级分类失败: ${cat.name} - ${err.message}`);
            }
        }

        // 创建二级分类
        let level2Count = 0;
        for (const cat of level2Categories) {
            try {
                const created = await LearningCategory.create(cat);
                console.log(`✓ 创建二级分类: ${created.name}`);
                level2Count++;
            } catch (err) {
                console.error(`✗ 创建二级分类失败: ${cat.name} - ${err.message}`);
            }
        }

        // 创建三级分类
        let level3Count = 0;
        for (const cat of level3Categories) {
            try {
                const created = await LearningCategory.create(cat);
                console.log(`✓ 创建三级分类: ${created.name}`);
                level3Count++;
            } catch (err) {
                console.error(`✗ 创建三级分类失败: ${cat.name} - ${err.message}`);
            }
        }

        // 创建四级分类（内容页面）
        let level4Count = 0;
        for (const cat of level4Categories) {
            try {
                const created = await LearningCategory.create(cat);
                console.log(`✓ 创建四级分类: ${created.name} (${created.pageType || 'content'})`);
                level4Count++;

                // 创建对应的页面数据
                if (cat.status === 'published') {
                    await createSamplePage(created);
                }
            } catch (err) {
                console.error(`✗ 创建四级分类失败: ${cat.name} - ${err.message}`);
            }
        }

        console.log('\n=================================');
        console.log('导入完成！');
        console.log(`一级分类: ${level1Count} 个`);
        console.log(`二级分类: ${level2Count} 个`);
        console.log(`三级分类: ${level3Count} 个`);
        console.log(`四级分类: ${level4Count} 个`);
        console.log('=================================\n');
    } catch (error) {
        console.error('导入失败:', error);
        process.exit(1);
    }
}

// 创建示例页面数据
async function createSamplePage(category) {
    try {
        await LearningPage.create({
            title: `${category.name} - 示例内容`,
            slug: `${category.name.toLowerCase().replace(/\s+/g, '-')  }-example`,
            categoryId: category._id,
            pageType: category.pageType || 'text',
            summary: `${category.name}的详细内容说明和示例`,
            content: `<h1>${category.name} - 示例内容</h1>
            <p>这是${category.name}的示例内容页面。</p>
            <p>描述：${category.description || ''}</p>
            <h2>学习要点</h2>
            <ul>
                <li>要点1：了解基本概念</li>
                <li>要点2：掌握关键方法</li>
                <li>要点3：实践应用</li>
            </ul>
            <h2>相关资源</h2>
            <p>相关视频、文档、PPT等内容正在准备中。</p>`,
            difficulty: category.level === 4 ? 'beginner' : 'intermediate',
            status: 'published',
            viewCount: 0,
            learnCount: 0,
        });
    } catch (err) {
        // 忽略创建页面失败，不影响分类创建
    }
}

// 执行导入
importLearningStructure()
    .then(() => {
        console.log('导入脚本执行完成');
        process.exit(0);
    })
    .catch(err => {
        console.error('导入脚本执行失败:', err);
        process.exit(1);
    });
