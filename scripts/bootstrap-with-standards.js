/**
 * 引导脚本：初始化数据库 → 导入标准 → 启动服务（同一进程）
 *
 * 用法: node scripts/bootstrap-with-standards.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 先确保数据库初始化完毕（内存模式），再导入
process.env.SKIP_DB_INIT = 'false';

console.log('='.repeat(60));
console.log('  测井专业智能培训系统 — 标准数据引导');
console.log('='.repeat(60));

async function main() {
  // 1. 连接数据库
  const dbAdapter = require('../utils/dbAdapter');
  await dbAdapter.connect();
  console.log('✅ 数据库连接成功\n');

  // 2. 初始化基础分类和页面
  console.log('📚 初始化学习模块...');
  const dbInit = require('../utils/dbInitializer');
  await dbInit.initialize();
  console.log('✅ 学习模块初始化完成\n');

  // 3. 导入测井标准
  console.log('📄 开始导入测井标准文件...\n');
  await importStandards(dbAdapter);

  // 4. 启动Web服务
  console.log('🌐 启动Web服务器...\n');
  const app = require('../server');
  const server = app.listen(3000, () => {
    console.log('='.repeat(60));
    console.log('🎉 系统启动成功！');
    console.log(`📱 访问地址: http://localhost:3000`);
    console.log(`📊 数据库: memory://well_logging_training`);
    console.log('='.repeat(60));
    console.log('\n📋 默认账户:');
    console.log('   管理员: admin / admin123');
    console.log('   学员: student / student123\n');
  });
}

async function importStandards(dbAdapter) {
  const Knowledge = require('../models/Knowledge');
  const Document = require('../models/Document');
  const Category = require('../models/Category');

  const sourceDir = 'D:\\1测井站工作\\测井专业标准';
  const targetDir = path.join(__dirname, '..', 'uploads', 'standards');
  fs.mkdirSync(targetDir, { recursive: true });

  // 分类映射表
  const CATEGORIES = [
    { code: 'standard-instrument', name: '仪器与刻度标准', icon: 'fa-microscope', sortOrder: 0 },
    { code: 'standard-operation', name: '作业技术规范', icon: 'fa-hard-hat', sortOrder: 1 },
    { code: 'standard-safety', name: '安全规范', icon: 'fa-shield-alt', sortOrder: 2 },
    { code: 'standard-quality', name: '质量控制管理', icon: 'fa-clipboard-check', sortOrder: 3 },
    { code: 'standard-data', name: '数据与资料规范', icon: 'fa-database', sortOrder: 4 },
  ];

  const CLASSIFY_RULES = [
    { code: 'standard-instrument', tests: [/^0[12]-SY/, /^0[3-7]-SYT/, /^08-SYT6594/, /^0[9]-SYT6704/, /^1[0]-SYT6720/, /^11-SYT6786/, /^12-SYT6813/, /^18-SYT6449/, /^19-SYT6493/, /^57-SYT6741/, /^60-QSH.*0551/, /^66-SYT6704/] },
    { code: 'standard-operation', tests: [/^2[1-5]-SYT(5600|6030|7308|669[12])/, /^38-SYT5361/, /^39-SYT6751/, /^40-SYT5326/, /^4[2-7]-QSH/, /^53-QSH.*2622/, /^65-QSH.*3133/, /^67-SYT7411/, /^68-QSH0289/, /^69-QSH0537/, /^SYT 6548/] },
    { code: 'standard-safety', tests: [/^20-SYT6432/, /^2[6-9]-SY/, /^3[0-7]-SY/, /^41-AQ/, /^54-QSH0190/, /^55-QSH.*0997/, /^56-QSH.*0999/, /^58-SYT6429/, /^59-SY6634/, /^61-QSH.*0996/, /^62-QSH.*1154/, /^63-SYT6202/, /^64-GBT8196/] },
    { code: 'standard-quality', tests: [/^48-QSH0360/, /^49-QSH.*0332/, /^50-QSH.*1488/, /^51-QSH.*1490/, /^52-QSH.*2762/, /^24-SYT6691/, /测井监督站标准体系表/] },
    { code: 'standard-data', tests: [/^1[3-7]-SYT(5132|5633|5703|5751|5752)/] },
  ];

  // 确保文件级分类存在
  for (const cat of CATEGORIES) {
    const exists = await Category.findOne({ code: cat.code });
    if (!exists) {
      await Category.create({
        name: cat.name, code: cat.code, level: 2,
        parentId: 'standard', icon: cat.icon, sortOrder: cat.sortOrder,
      });
    }
  }

  // 扫描文件
  const files = fs.readdirSync(sourceDir).filter(f =>
    ['.pdf', '.docx', '.doc'].includes(path.extname(f).toLowerCase())
  );

  let imported = 0, skipped = 0, failed = 0;

  for (const fileName of files) {
    const sourcePath = path.join(sourceDir, fileName);
    const ext = path.extname(fileName).toLowerCase();

    // 分类
    let categoryCode = null;
    for (const rule of CLASSIFY_RULES) {
      for (const test of rule.tests) {
        if (test.test(fileName)) { categoryCode = rule.code; break; }
      }
      if (categoryCode) {break;}
    }

    if (!categoryCode) {
      console.log(`  ⚠️  跳过(无法分类): ${fileName}`);
      skipped++;
      continue;
    }

    const cat = CATEGORIES.find(c => c.code === categoryCode);

    // 去重
    const exists = await Document.findOne({ originalName: fileName, category: 'standard' });
    if (exists) {
      console.log(`  ⏭️  已存在: ${fileName}`);
      skipped++;
      continue;
    }

    try {
      // 复制文件
      const targetName = fileName.replace(/^(\d+)-/, '');
      const targetPath = path.join(targetDir, targetName);
      fs.copyFileSync(sourcePath, targetPath);

      const stat = fs.statSync(sourcePath);
      const mimeMap = { '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

      // 解析文件名
      const baseName = path.basename(fileName, ext);
      const parsed = (() => {
        const m1 = baseName.match(/^\d+-(.+?)(\d{4})\s+(.+)$/);
        if (m1) {return { no: m1[1] + m1[2], name: m1[3] };}
        const m2 = baseName.match(/^(.+?\d{4})\s+(.+)$/);
        if (m2) {return { no: m2[1].trim(), name: m2[2] };}
        return { no: '', name: baseName };
      })();

      const title = parsed.no ? `${parsed.no} ${parsed.name}` : parsed.name;

      // 创建 Knowledge
      const knowledge = await Knowledge.create({
        title,
        categoryId: categoryCode,
        description: `【${cat.name}】${title}`,
        keywords: [cat.name, '测井标准', parsed.no || ''].filter(Boolean),
        status: 'published',
        fileCount: 1,
        documentCount: 1,
      });

      // 创建 Document
      await Document.create({
        title,
        originalName: fileName,
        filePath: `uploads/standards/${targetName}`,
        fileType: mimeMap[ext] || 'application/octet-stream',
        fileSize: stat.size,
        category: 'standard',
        tags: [cat.name, '测井标准'],
        status: 'ready',
        isIndexed: false,
        uploadedBy: null,
      });

      imported++;
      process.stdout.write(`  ✅ [${imported}/${files.length}] ${title}\n`);
    } catch (err) {
      failed++;
      process.stdout.write(`  ❌ ${fileName}: ${err.message}\n`);
    }
  }

  console.log(`\n📊 导入统计: 总计 ${files.length} | 导入 ${imported} | 跳过 ${skipped} | 失败 ${failed}`);

  // 打印分类分布
  const dist = {};
  for (const cat of CATEGORIES) {
    const count = await Knowledge.countDocuments({ categoryId: cat.code });
    if (count > 0) {dist[cat.name] = count;}
  }
  console.log('\n📊 分类分布:');
  for (const [name, count] of Object.entries(dist)) {
    console.log(`   ${name}: ${count} 项`);
  }
  console.log('');
}

main().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
