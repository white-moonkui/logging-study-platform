const dbAdapter = require('./utils/dbAdapter');
const Category = require('./models/Category');

async function testMemoryDB() {
    try {
        console.log('测试内存数据库...');

        // 连接数据库
        await dbAdapter.connect();
        console.log('✅ 数据库连接成功');

        // 检查是否使用内存数据库
        console.log(`✅ 使用内存数据库: ${dbAdapter.isMemory}`);

        // 测试创建分类
        const testCategory = await Category.create({
            name: '测试分类',
            code: 'test_category',
            parentId: null,
            level: 1,
            sortOrder: 1,
            icon: 'fa-check',
        });

        console.log(`✅ 创建分类成功: ${testCategory.name}`);

        // 测试查询
        const count = await Category.countDocuments();
        console.log(`✅ 分类数量: ${count}`);

        // 测试查找
        const found = await Category.findOne({ code: 'test_category' });
        console.log(`✅ 查询成功: ${found.name}`);

        console.log('\\n✅ 内存数据库测试完成！');
    } catch (error) {
        console.error('\\n❌ 测试失败:', error);
        process.exit(1);
    }
}

testMemoryDB();
