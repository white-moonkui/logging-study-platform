const memoryDB = require('../utils/memoryDB').memoryDB;

async function importLearningStructure() {
    try {
        console.log('开始在内存中创建测井专业知识学习结构...\n');

        // 清空现有数据
        console.log('清空现有数据...');
        memoryDB.collections.delete('learningcategories');
        memoryDB.collections.delete('learningpages');
        console.log('数据已清空\n');

        // 创建一级分类（根分类）
        console.log('创建一级分类（根分类）...');
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

        let level1Count = 0;
        for (const cat of level1Categories) {
            try {
                const doc = {
                    _id: level1Count + 1,
                    name: cat.name,
                    parentId: null,
                    level: cat.level,
                    icon: cat.icon,
                    description: cat.description,
                    order: cat.order,
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                const collection = memoryDB.getCollection('learningcategories');
                await collection.insertOne(doc);
                console.log(`Created: ${  cat.name}`);
                level1Count++;
            } catch (err) {
                console.error(`Failed to create ${  cat.name  }: ${  err.message}`);
            }
        }

        // 创建二级分类
        console.log('\n创建二级分类...');
        const level2Categories = [
            {
                name: '测井基础理论',
                parentId: 1,
                level: 2,
                icon: 'fas fa-theater-masks',
                description: '测井理论基础',
                order: 1,
            },
            {
                name: '测井物理基础',
                parentId: 1,
                level: 2,
                icon: 'fas fa-bolt',
                description: '测井物理原理',
                order: 2,
            },
            {
                name: '电法测井仪器',
                parentId: 2,
                level: 2,
                icon: 'fas fa-bolt',
                description: '电法测井仪器',
                order: 1,
            },
            {
                name: '声波测井仪器',
                parentId: 2,
                level: 2,
                icon: 'fas fa-wave-square',
                description: '声波测井仪器',
                order: 2,
            },
            {
                name: '放射性测井仪器',
                parentId: 2,
                level: 2,
                icon: 'fas fa-radiation',
                description: '放射性测井仪器',
                order: 3,
            },
            {
                name: '新技术',
                parentId: 2,
                level: 2,
                icon: 'fas fa-lightbulb',
                description: '最新测井技术',
                order: 4,
            },
            {
                name: '随钻测井仪器',
                parentId: 2,
                level: 2,
                icon: 'fas fa-cog',
                description: 'LWD测井技术',
                order: 5,
            },
            {
                name: '过钻头仪器',
                parentId: 2,
                level: 2,
                icon: 'fas fa-diamond',
                description: '过钻头测井技术',
                order: 6,
            },
            {
                name: '辅助工具设备',
                parentId: 2,
                level: 2,
                icon: 'fas fa-tools',
                description: '辅助工具设备',
                order: 7,
            },
            {
                name: '测井施工规范',
                parentId: 3,
                level: 2,
                icon: 'fas fa-file-contract',
                description: '测井施工技术规范',
                order: 1,
            },
            {
                name: '安全操作规程',
                parentId: 3,
                level: 2,
                icon: 'fas fa-shield-alt',
                description: '安全操作规程',
                order: 2,
            },
            {
                name: '设备维护标准',
                parentId: 3,
                level: 2,
                icon: 'fas fa-wrench',
                description: '设备维护标准',
                order: 3,
            },
            {
                name: '地质知识',
                parentId: 4,
                level: 2,
                icon: 'fas fa-mountain',
                description: '地质学基础',
                order: 1,
            },
            {
                name: '钻井知识',
                parentId: 4,
                level: 2,
                icon: 'fas fa-digging',
                description: '钻井工程知识',
                order: 2,
            },
            {
                name: '地球物理知识',
                parentId: 4,
                level: 2,
                icon: 'fas fa-chart-line',
                description: '地球物理基础',
                order: 3,
            },
        ];

        let level2Count = 0;
        for (const cat of level2Categories) {
            try {
                const doc = {
                    _id: level1Count + level2Count + 2,
                    name: cat.name,
                    parentId: cat.parentId,
                    level: cat.level,
                    icon: cat.icon,
                    description: cat.description,
                    order: cat.order,
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                const collection = memoryDB.getCollection('learningcategories');
                await collection.insertOne(doc);
                console.log(`Created: ${  cat.name}`);
                level2Count++;
            } catch (err) {
                console.error(`Failed to create ${  cat.name  }: ${  err.message}`);
            }
        }

        console.log('\n导入完成！');
        console.log(`一级分类: ${  level1Count  } 个`);
        console.log(`二级分类: ${  level2Count  } 个`);
        console.log(`总分类数: ${  level1Count + level2Count  } 个`);
    } catch (error) {
        console.error('导入失败:', error);
        process.exit(1);
    }
}

importLearningStructure()
    .then(() => {
        console.log('导入脚本执行完成');
        process.exit(0);
    })
    .catch(err => {
        console.error('导入脚本执行失败:', err);
        process.exit(1);
    });
