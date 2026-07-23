const dbAdapter = require('../utils/dbAdapter');
const Category = dbAdapter.getModel('Category', {});

// 初始分类数据
const initialCategories = [
    // 根分类
    {
        id: 'root_basic',
        name: '测井基础理论',
        code: 'basic',
        parentId: null,
        level: 1,
        sortOrder: 1,
        icon: 'fa-book',
    },
    {
        id: 'root_instrument',
        name: '测井仪器设备',
        code: 'instrument',
        parentId: null,
        level: 1,
        sortOrder: 2,
        icon: 'fa-cogs',
    },
    {
        id: 'root_standard',
        name: '测井专业标准',
        code: 'standard',
        parentId: null,
        level: 1,
        sortOrder: 3,
        icon: 'fa-clipboard-list',
    },
    {
        id: 'root_cross',
        name: '跨专业知识',
        code: 'cross',
        parentId: null,
        level: 1,
        sortOrder: 4,
        icon: 'fa-globe',
    },
    {
        id: 'root_operation',
        name: '现场操作',
        code: 'operation',
        parentId: null,
        level: 1,
        sortOrder: 5,
        icon: 'fa-hand-paper',
    },
    {
        id: 'root_case',
        name: '典型案例',
        code: 'case',
        parentId: null,
        level: 1,
        sortOrder: 6,
        icon: 'fa-lightbulb',
    },

    // 二级分类 - 测井基础理论
    {
        id: 'basic_radio',
        name: '放射性测井原理',
        code: 'basic_radio',
        parentId: 'root_basic',
        level: 2,
        sortOrder: 1,
        icon: 'fa-radiation',
    },
    {
        id: 'basic_electric',
        name: '电法测井技术',
        code: 'basic_electric',
        parentId: 'root_basic',
        level: 2,
        sortOrder: 2,
        icon: 'fa-bolt',
    },
    {
        id: 'basic_acoustic',
        name: '声波测井技术',
        code: 'basic_acoustic',
        parentId: 'root_basic',
        level: 2,
        sortOrder: 3,
        icon: 'fa-wave-square',
    },

    // 二级分类 - 测井仪器设备
    {
        id: 'inst_electric',
        name: '电法测井仪器',
        code: 'inst_electric',
        parentId: 'root_instrument',
        level: 2,
        sortOrder: 1,
        icon: 'fa-bolt',
    },
    {
        id: 'inst_acoustic',
        name: '声波测井仪器',
        code: 'inst_acoustic',
        parentId: 'root_instrument',
        level: 2,
        sortOrder: 2,
        icon: 'fa-wave-square',
    },
    {
        id: 'inst_radio',
        name: '放射性测井仪器',
        code: 'inst_radio',
        parentId: 'root_instrument',
        level: 2,
        sortOrder: 3,
        icon: 'fa-radiation',
    },
    {
        id: 'inst_LWD',
        name: '随钻测井仪器',
        code: 'inst_LWD',
        parentId: 'root_instrument',
        level: 2,
        sortOrder: 4,
        icon: 'fa-satellite-dish',
    },
    {
        id: 'inst_bit',
        name: '过钻头仪器',
        code: 'inst_bit',
        parentId: 'root_instrument',
        level: 2,
        sortOrder: 5,
        icon: 'fa-bullseye',
    },
    {
        id: 'inst_tool',
        name: '辅助工具设备',
        code: 'inst_tool',
        parentId: 'root_instrument',
        level: 2,
        sortOrder: 6,
        icon: 'fa-tools',
    },
    {
        id: 'inst_new',
        name: '新技术',
        code: 'inst_new',
        parentId: 'root_instrument',
        level: 2,
        sortOrder: 7,
        icon: 'fa-rocket',
    },

    // 二级分类 - 测井专业标准
    {
        id: 'standard_norm',
        name: '测井规范',
        code: 'standard_norm',
        parentId: 'root_standard',
        level: 2,
        sortOrder: 1,
        icon: 'fa-list-ol',
    },
    {
        id: 'standard_quality',
        name: '质量标准',
        code: 'standard_quality',
        parentId: 'root_standard',
        level: 2,
        sortOrder: 2,
        icon: 'fa-check-circle',
    },
    {
        id: 'standard_safety',
        name: '安全标准',
        code: 'standard_safety',
        parentId: 'root_standard',
        level: 2,
        sortOrder: 3,
        icon: 'fa-shield-alt',
    },

    // 三级分类 - 测井专业标准
    {
        id: 'standard_norm_team',
        name: '队伍建设规范',
        code: 'standard_norm_team',
        parentId: 'standard_norm',
        level: 3,
        sortOrder: 1,
        icon: 'fa-users',
    },
    {
        id: 'standard_norm_process',
        name: '作业流程规范',
        code: 'standard_norm_process',
        parentId: 'standard_norm',
        level: 3,
        sortOrder: 2,
        icon: 'fa-tasks',
    },

    // 二级分类 - 跨专业知识
    {
        id: 'cross_rock',
        name: '岩石力学',
        code: 'cross_rock',
        parentId: 'root_cross',
        level: 2,
        sortOrder: 1,
        icon: 'fa-mountain',
    },
    {
        id: 'cross_geophysics',
        name: '地球物理',
        code: 'cross_geophysics',
        parentId: 'root_cross',
        level: 2,
        sortOrder: 2,
        icon: 'fa-globe',
    },
    {
        id: 'cross_electronics',
        name: '仪器电子',
        code: 'cross_electronics',
        parentId: 'root_cross',
        level: 2,
        sortOrder: 3,
        icon: 'fa-microchip',
    },
    {
        id: 'cross_processing',
        name: '数据处理',
        code: 'cross_processing',
        parentId: 'root_cross',
        level: 2,
        sortOrder: 4,
        icon: 'fa-chart-bar',
    },

    // 二级分类 - 现场操作
    {
        id: 'op_debug',
        name: '设备调试',
        code: 'op_debug',
        parentId: 'root_operation',
        level: 2,
        sortOrder: 1,
        icon: 'fa-cogs',
    },
    {
        id: 'op_collect',
        name: '数据采集',
        code: 'op_collect',
        parentId: 'root_operation',
        level: 2,
        sortOrder: 2,
        icon: 'fa-download',
    },

    // 二级分类 - 典型案例
    {
        id: 'case_fault',
        name: '测井仪器故障',
        code: 'case_fault',
        parentId: 'root_case',
        level: 2,
        sortOrder: 1,
        icon: 'fa-bug',
    },
    {
        id: 'case_mistake',
        name: '现场操作失误',
        code: 'case_mistake',
        parentId: 'root_case',
        level: 2,
        sortOrder: 2,
        icon: 'fa-exclamation-triangle',
    },
];

async function initCategories() {
    try {
        console.log('开始初始化分类数据...');

        // 检查是否已有数据
        const existingCount = await Category.countDocuments();
        if (existingCount > 0) {
            console.log(`已有 ${existingCount} 条分类数据，跳过初始化`);
            return;
        }

        // 插入数据
        for (const category of initialCategories) {
            await Category.create(category);
        }

        console.log(`✅ 成功初始化 ${initialCategories.length} 条分类数据`);
    } catch (error) {
        console.error('初始化分类数据失败:', error);
        throw error;
    }
}

// 如果直接运行此文件
if (require.main === module) {
    initCategories()
        .then(() => {
            console.log('初始化完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('初始化失败:', error);
            process.exit(1);
        });
}

module.exports = initCategories;
