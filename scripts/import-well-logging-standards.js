/**
 * 测井专业标准批量导入工具
 *
 * 将 D:\1测井站工作\测井专业标准 中的标准文件导入平台
 *
 * 用法:
 *   node scripts/import-well-logging-standards.js              # 导入全部 69 个文件
 *   node scripts/import-well-logging-standards.js --test        # 仅导入 3 个测试文件
 *   node scripts/import-well-logging-standards.js --dir=自定义目录
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbAdapter = require('../utils/dbAdapter');
const Knowledge = require('../models/Knowledge');
const Document = require('../models/Document');
const Category = require('../models/Category');

// ============================================================
// 1. 分类映射表 — 按标准编号前缀归类
// ============================================================
const CATEGORY_MAP = [
  {
    code: 'standard-instrument',
    name: '仪器与刻度标准',
    icon: 'fa-microscope',
    description: '测井仪器刻度规范、校准方法、量值传递规程',
    patterns: [
      // 仪器刻度/校准类标准编号特征
      /^0[12]-(SYT|SY)/,         // 地层倾角测井仪刻度、连续测斜仪
      /^0[3-7]-SYT/,             // 感应/声速/核/电法/核磁共振 测井仪
      /^08-SYT6594/,             // 电声成像测井仪刻度
      /^0[9]-SYT6704/,           // 井斜仪校准
      /^1[0]-SYT6720/,           // 自然伽马能谱刻度器
      /^11-SYT6786/,             // 微球形聚焦测井仪刻度
      /^12-SYT6813/,             // 井温仪校准
      /^18-SYT6449/,             // 固井质量检测仪刻度
      /^19-SYT6493/,             // 核测井仪器量值传递
      /^57-SYT6741/,             // 计量器具校准方法编写规则
      /^60-QSH.*0551/,           // 声波变密度/自然伽马组合测井仪维修及操作与刻度
      /^66-SYT6704/,             // 井斜仪校准装置(重复)
    ],
  },
  {
    code: 'standard-operation',
    name: '作业技术规范',
    icon: 'fa-hard-hat',
    description: '电缆测井、存储式测井、随钻测井等现场作业技术规程',
    patterns: [
      /^2[1-5]-SYT(5600|6030|7308|669[12])/,  // 电缆/钻杆/泵出/随钻测井
      /^38-SYT5361/,            // 仪器打捞
      /^39-SYT6751/,            // 电缆测井与射孔带压
      /^40-SYT5326/,            // 井壁取心
      /^4[2-7]-QSH/,            // QSH 作业规程系列
      /^53-QSH.*2622/,          // 测井工程质量
      /^65-QSH.*3133/,          // 直推存储式
      /^67-SYT7411/,            // 海上石油电缆测井
      /^68-QSH0289/,            // 裸眼井测井推荐系列
      /^69-QSH0537/,            // 带压全密闭
      /^SYT 6548/,              // 测井电缆和连接器使用技术规范
    ],
  },
  {
    code: 'standard-safety',
    name: '安全规范',
    icon: 'fa-shield-alt',
    description: '放射源管理、井控安全、硫化氢防护、爆炸物品管理等安全生产操作规程',
    patterns: [
      /^20-SYT6432/,            // 浅海井控
      /^26-SYT6276/,            // HSE 体系
      /^27-SY5131/,             // 放射性测井辐射防护
      /^28-SY5436/,             // 井筒爆炸物品
      /^29-SYT5726/,            // 测井作业安全
      /^30-SYT6044/,            // 浅海安全应急
      /^31-SYT6345/,            // 海洋作业人员安全资格
      /^32-SYT6355/,            // 安全标志
      /^33-SYT6501/,            // 浅海放射性及爆炸物品
      /^34-SYT6502/,            // 海上逃生救生
      /^35-SYT6277/,            // 硫化氢防护
      /^36-SYT6308/,            // 爆破器材安全使用
      /^37-SYT6524/,            // 劳动防护用具
      /^41-AQ/,                 // AQ 测录井安全
      /^54-QSH0190/,            // 含硫天然气井
      /^55-QSH.*0997/,          // 密封型放射源
      /^56-QSH.*0999/,          // 裸眼井作业安全
      /^58-SYT6429/,            // 海洋消防
      /^59-SY6634/,             // 滩海陆岸安全
      /^61-QSH.*0996/,          // 海上射孔爆炸物品
      /^62-QSH.*1154/,          // 射孔取心爆炸物品
      /^63-SYT6202/,            // 钻井井场安装
      /^64-GBT8196/,            // 机械安全防护
    ],
  },
  {
    code: 'standard-quality',
    name: '质量控制管理',
    icon: 'fa-clipboard-check',
    description: '测井质量规范、监督工作规程、工程设计规范及标准体系管理',
    patterns: [
      /^48-QSH0360/,            // 裸眼井质量控制
      /^49-QSH.*0332/,          // 原始资料检验
      /^50-QSH.*1488/,          // 核磁共振原始资料质量
      /^51-QSH.*1490/,          // 声电成象原始资料质量
      /^52-QSH.*2762/,          // 测井监督工作规程
      /^24-SYT6691/,            // 裸眼井测井设计规范
      /测井监督站标准体系表/,
    ],
  },
  {
    code: 'standard-data',
    name: '数据与资料规范',
    icon: 'fa-database',
    description: '测井数据格式标准、原始资料质量验收、图件格式规范',
    patterns: [
      /^13-SYT5132/,            // 原始资料质量规范
      /^14-SYT5633/,            // 测井图件格式
      /^15-SYT5703/,            // 数据项名称
      /^16-SYT5751/,            // 岩石名称及颜色代码
      /^17-SYT5752/,            // 录井数据项名称
    ],
  },
];

// ============================================================
// 2. 主导入器
// ============================================================
class WellLoggingStandardImporter {
  constructor(options = {}) {
    this.sourceDir = options.sourceDir || 'D:\\1测井站工作\\测井专业标准';
    this.targetDir = path.join(__dirname, '..', 'uploads', 'standards');
    this.testMode = options.testMode || false;
    this.stats = {
      scanned: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      files: [],
    };
  }

  /**
   * 根据文件名判断所属分类
   */
  classifyFile(fileName) {
    for (const cat of CATEGORY_MAP) {
      for (const pattern of cat.patterns) {
        if (pattern.test(fileName)) {
          return cat;
        }
      }
    }
    return null; // 未匹配
  }

  /**
   * 解析文件名 → 标准编号 + 标准名称
   */
  parseFileName(fileName) {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    // 带前缀: "01-SYT5704-2012 名称"
    const withPrefix = baseName.match(/^\d+-(.+?)(\d{4})\s+(.+)$/);
    if (withPrefix) {
      return {
        standardNo: withPrefix[1] + withPrefix[2],
        year: withPrefix[2],
        name: withPrefix[3],
        ext,
      };
    }

    // 不带前缀: "SYT 6548-2018 名称"
    const noPrefix = baseName.match(/^(.+?\d{4})\s+(.+)$/);
    if (noPrefix) {
      return {
        standardNo: noPrefix[1].trim(),
        year: (noPrefix[1].match(/(\d{4})/) || [])[1] || '',
        name: noPrefix[2],
        ext,
      };
    }

    // 特殊: "测井监督站标准体系表（2025.01.06）"
    return {
      standardNo: '',
      year: '',
      name: baseName,
      ext,
    };
  }

  /**
   * 生成目标文件名（标准编号 + 名称）
   */
  generateTargetName(fileName, parsed) {
    if (parsed.standardNo) {
      return `${parsed.standardNo}-${parsed.name}${parsed.ext}`.replace(/[/\\?%*:|"<>]/g, '_');
    }
    return fileName;
  }

  /**
   * 确保分类目录存在
   */
  async ensureCategories() {
    const created = [];
    for (const cat of CATEGORY_MAP) {
      const existing = await Category.findOne({ code: cat.code });
      if (!existing) {
        await Category.create({
          name: cat.name,
          code: cat.code,
          level: 2,
          parentId: 'standard',
          icon: cat.icon,
          sortOrder: CATEGORY_MAP.indexOf(cat),
        });
        created.push(cat.name);
      }
    }
    return created;
  }

  /**
   * 执行导入
   */
  async run() {
    console.log('='.repeat(60));
    console.log('  测井专业标准批量导入工具');
    console.log('='.repeat(60));
    console.log(`\n📂 源目录: ${this.sourceDir}`);
    console.log(`📂 目标目录: ${this.targetDir}`);
    console.log(`🧪 测试模式: ${this.testMode ? '是（仅3个文件）' : '否（全部导入）'}\n`);

    // Step 1: 连接数据库
    console.log('📡 连接数据库...');
    try {
      await dbAdapter.connect();
      console.log('✅ 数据库连接成功\n');
    } catch (err) {
      console.error('❌ 数据库连接失败:', err.message);
      process.exit(1);
    }

    // Step 2: 扫描源目录
    console.log('🔍 扫描源目录...');
    let files;
    try {
      files = await fsp.readdir(this.sourceDir);
    } catch (err) {
      console.error(`❌ 无法读取目录: ${this.sourceDir}`);
      process.exit(1);
    }

    // 过滤出支持的文件类型
    const supportedExts = ['.pdf', '.docx', '.doc'];
    let targetFiles = files.filter(f => supportedExts.includes(path.extname(f).toLowerCase()));

    if (this.testMode) {
      // 测试模式：取 3 个典型文件（仪器 + 作业 + 安全 各一）
      const testFiles = [
        targetFiles.find(f => f.includes('SYT5704')),  // 仪器刻度
        targetFiles.find(f => f.includes('SYT5600')),  // 作业技术
        targetFiles.find(f => f.includes('SYT5726')),  // 安全规范
      ].filter(Boolean);
      if (testFiles.length === 0) {
        // fallback: 取前 3 个
        targetFiles = targetFiles.slice(0, 3);
      } else {
        targetFiles = testFiles;
      }
      console.log(`  测试模式，选取 ${targetFiles.length} 个文件\n`);
    }

    this.stats.scanned = targetFiles.length;

    // Step 3: 确保分类存在
    console.log('📁 确保分类目录存在...');
    const createdCats = await this.ensureCategories();
    if (createdCats.length > 0) {
      console.log(`  新建分类: ${createdCats.join(', ')}`);
    } else {
      console.log('  分类已存在，跳过');
    }
    console.log();

    // Step 4: 确保上传目录存在
    await fsp.mkdir(this.targetDir, { recursive: true });

    // Step 5: 逐个导入
    console.log('📄 开始导入文件...\n');
    for (const fileName of targetFiles) {
      await this.importFile(fileName);
    }

    // Step 6: 输出报告
    this.printReport();
    process.exit(0);
  }

  /**
   * 导入单个文件
   */
  async importFile(fileName) {
    const sourcePath = path.join(this.sourceDir, fileName);
    const ext = path.extname(fileName).toLowerCase();

    // 解析文件名
    const parsed = this.parseFileName(fileName);
    const targetName = this.generateTargetName(fileName, parsed);
    const targetPath = path.join(this.targetDir, targetName);

    // 分类
    const category = this.classifyFile(fileName);
    if (!category) {
      console.log(`  ⚠️  跳过(无法分类): ${fileName}`);
      this.stats.skipped++;
      this.stats.files.push({ name: fileName, status: 'skipped', reason: '未匹配分类' });
      return;
    }

    const mimeMap = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const fileType = mimeMap[ext] || 'application/octet-stream';

    // 检查是否已导入（通过源文件路径去重）
    const existingDoc = await Document.findOne({
      originalName: fileName,
      category: 'standard',
    });
    if (existingDoc) {
      console.log(`  ⏭️  已存在: ${fileName}`);
      this.stats.skipped++;
      this.stats.files.push({ name: fileName, status: 'skipped', reason: '已存在' });
      return;
    }

    try {
      // 获取文件信息
      const stat = fs.statSync(sourcePath);

      // 复制文件到目标目录
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  📋 复制: ${fileName}`);

      // 创建 Knowledge 条目
      const knowledgeTitle = parsed.standardNo
        ? `${parsed.standardNo} ${parsed.name}`
        : parsed.name;

      const knowledge = await Knowledge.create({
        title: knowledgeTitle,
        categoryId: category.code,
        description: `【${category.name}】${parsed.standardNo} ${parsed.name} — ${category.description}`,
        keywords: this.extractKeywords(parsed, category),
        level: 1,
        sortOrder: 0,
        status: 'published',
        fileCount: 1,
        documentCount: 1,
      });

      // 创建 Document 记录
      const document = await Document.create({
        title: knowledgeTitle,
        originalName: fileName,
        filePath: path.relative(path.join(__dirname, '..'), targetPath),
        fileType,
        fileSize: stat.size,
        category: 'standard',
        tags: [category.name, parsed.standardNo || '', '测井标准'],
        status: 'ready',
        isIndexed: false,
        uploadedBy: null, // 系统导入
      });

      this.stats.imported++;
      this.stats.files.push({
        name: fileName,
        status: 'imported',
        category: category.name,
        knowledgeId: knowledge._id,
        documentId: document._id,
      });

      console.log(`  ✅ 导入成功: ${knowledgeTitle}`);
      console.log(`     → 知识条目: ${knowledge._id}`);
      console.log(`     → 文档记录: ${document._id}\n`);
    } catch (err) {
      console.error(`  ❌ 导入失败: ${fileName} — ${err.message}`);
      this.stats.failed++;
      this.stats.errors.push({ file: fileName, error: err.message });
    }
  }

  /**
   * 提取关键词
   */
  extractKeywords(parsed, category) {
    const keywords = [category.name, '测井标准'];
    if (parsed.standardNo) {
      keywords.push(parsed.standardNo);
      // 提取前缀（如 SYT, QSH, GB 等）
      const prefix = parsed.standardNo.match(/^([A-Za-z]+)/);
      if (prefix) {keywords.push(prefix[1]);}
    }
    if (parsed.name) {
      // 按空格拆分名称作为关键词
      const nameParts = parsed.name.split(/[\s、，,]+/).filter(s => s.length >= 2);
      keywords.push(...nameParts.slice(0, 5));
    }
    return [...new Set(keywords)];
  }

  /**
   * 打印导入报告
   */
  printReport() {
    console.log('='.repeat(60));
    console.log('  导入报告');
    console.log('='.repeat(60));
    console.log(`  扫描文件:    ${this.stats.scanned}`);
    console.log(`  成功导入:    ${this.stats.imported}`);
    console.log(`  跳过:        ${this.stats.skipped}`);
    console.log(`  失败:        ${this.stats.failed}`);

    if (this.stats.imported > 0) {
      console.log('\n📊 分类分布:');
      const dist = {};
      this.stats.files.filter(f => f.status === 'imported').forEach(f => {
        dist[f.category] = (dist[f.category] || 0) + 1;
      });
      for (const [cat, count] of Object.entries(dist)) {
        console.log(`   ${cat}: ${count} 项`);
      }
    }

    if (this.stats.errors.length > 0) {
      console.log('\n❌ 错误明细:');
      this.stats.errors.forEach(e => console.log(`   ${e.file}: ${e.error}`));
    }

    const total = this.stats.imported + this.stats.skipped + this.stats.failed;
    console.log(`\n📌 共处理 ${total} 个文件`);
    if (this.stats.imported > 0) {
      console.log('💡 浏览地址: http://localhost:3000  → 测井专业标准');
    }
    console.log('');
  }
}

// ============================================================
// 3. 命令行入口
// ============================================================
const args = process.argv.slice(2);
const options = {
  testMode: args.includes('--test'),
  sourceDir: 'D:\\1测井站工作\\测井专业标准',
};

// 支持 --dir=xxx
const dirArg = args.find(a => a.startsWith('--dir='));
if (dirArg) {
  options.sourceDir = dirArg.split('=')[1];
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
用法: node scripts/import-well-logging-standards.js [选项]

选项:
  --test        仅导入 3 个测试文件（验证流程）
  --dir=PATH    自定义源文件目录
  --help, -h    显示帮助

示例:
  node scripts/import-well-logging-standards.js          # 导入全部
  node scripts/import-well-logging-standards.js --test    # 测试 3 个文件
  node scripts/import-well-logging-standards.js --dir=D:\\自定义目录
`);
  process.exit(0);
}

const importer = new WellLoggingStandardImporter(options);
importer.run();
