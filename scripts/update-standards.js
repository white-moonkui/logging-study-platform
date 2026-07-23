/**
 * 测井专业标准更新工具
 *
 * 扫描 D:\1测井站工作\测井专业标准 → 复制到 public/standards/ → 生成 standards.json
 *
 * 用法: node scripts/update-standards.js
 *       node scripts/update-standards.js --dir=D:\其他目录
 *       node scripts/update-standards.js --dry-run  # 预览不复制
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const SOURCE_DIR = 'D:\\1测井站工作\\测井专业标准';
const TARGET_DIR = path.join(__dirname, '..', 'public', 'standards');
const JSON_PATH = path.join(__dirname, '..', 'public', 'data', 'standards.json');

const CATEGORY_MAP = [
  {
    id: 'instruments',
    name: '仪器与刻度标准',
    icon: 'fa-microscope',
    iconColor: '#8b5cf6',
    description: '测井仪器刻度规范、校准方法、量值传递规程',
    patterns: [
      /^0[12]-(SYT|SY)/, /^0[3-7]-SYT/, /^08-SYT6594/, /^0[9]-SYT6704/, /^1[0]-SYT6720/,
      /^11-SYT6786/, /^12-SYT6813/, /^18-SYT6449/, /^19-SYT6493/, /^57-SYT6741/,
      /^60-QSH.*0551/, /^66-SYT6704/,
    ],
  },
  {
    id: 'operation',
    name: '作业技术规范',
    icon: 'fa-hard-hat',
    iconColor: '#f59e0b',
    description: '电缆测井、存储式测井、随钻测井等现场作业技术规程',
    patterns: [
      /^2[1-5]-SYT(5600|6030|7308|669[12])/, /^38-SYT5361/, /^39-SYT6751/, /^40-SYT5326/,
      /^4[2-7]-QSH/, /^53-QSH.*2622/, /^65-QSH.*3133/, /^67-SYT7411/, /^68-QSH0289/,
      /^69-QSH0537/, /^SYT 6548/,
    ],
  },
  {
    id: 'safety',
    name: '安全规范',
    icon: 'fa-shield-alt',
    iconColor: '#ef4444',
    description: '放射源管理、井控安全、硫化氢防护、爆炸物品管理等安全生产操作规程',
    patterns: [
      /^20-SYT6432/, /^26-SYT6276/, /^27-SY5131/, /^28-SY5436/, /^29-SYT5726/, /^30-SYT6044/,
      /^31-SYT6345/, /^32-SYT6355/, /^33-SYT6501/, /^34-SYT6502/, /^35-SYT6277/, /^36-SYT6308/,
      /^37-SYT6524/, /^41-AQ/, /^54-QSH0190/, /^55-QSH.*0997/, /^56-QSH.*0999/, /^58-SYT6429/,
      /^59-SY6634/, /^61-QSH.*0996/, /^62-QSH.*1154/, /^63-SYT6202/, /^64-GBT8196/,
    ],
  },
  {
    id: 'quality',
    name: '质量控制管理',
    icon: 'fa-clipboard-check',
    iconColor: '#0891b2',
    description: '测井质量规范、监督工作规程、工程设计规范及标准体系管理',
    patterns: [
      /^48-QSH0360/, /^49-QSH.*0332/, /^50-QSH.*1488/, /^51-QSH.*1490/, /^52-QSH.*2762/,
      /^24-SYT6691/, /测井监督站标准体系表/,
    ],
  },
  {
    id: 'data',
    name: '数据与资料规范',
    icon: 'fa-database',
    iconColor: '#0284c7',
    description: '测井数据格式标准、原始资料质量验收、图件格式规范',
    patterns: [
      /^13-SYT5132/, /^14-SYT5633/, /^15-SYT5703/, /^16-SYT5751/, /^17-SYT5752/,
    ],
  },
];

const DESCRIPTION_TEMPLATES = {
  instruments: [
    () => '规定测井仪器刻度、校准及量值传递的技术要求与操作方法，确保测量数据的准确性和可溯源性。',
    () => '涵盖该标准的通用技术条件与性能指标要求，适用于仪器设计、制造与检验全流程。',
    () => '规范该标准的校准方法与验收标准，为测井仪器量值统一提供技术依据。',
    () => '明确该标准的刻度周期、刻度标准器管理要求及操作步骤，保障仪器性能稳定。',
    () => '规定该标准的计量性能校准方法、周期及计量标准装置管理要求。',
  ],
  operation: [
    () => '规范现场测井作业的技术要求与操作规程，涵盖施工准备、仪器安装与质量控制全流程。',
    () => '规定该标准的作业条件、施工步骤与资料验收标准，确保作业安全与数据质量。',
    () => '明确现场作业的设备配置、操作程序与应急处置要求，指导规范施工。',
    () => '涵盖该标准涉及的测井系列选择、参数设置与质量评价方法。',
  ],
  safety: [
    () => '规范石油测井作业中安全管理要求与防护措施，保障人员与设备安全。',
    () => '规定安全操作程序与应急处置要求，预防事故发生。',
    () => '明确该标准涉及的风险识别、防护装备配备与应急演练要求。',
    () => '涵盖该标准的健康、安全与环境管理体系要求，推动规范化管理。',
  ],
  quality: [
    () => '规定该标准的质量控制指标与验收标准，确保测井资料的真实性与可靠性。',
    () => '规范该标准的检验工作流程与质量要求，提升测井作业管理水平。',
    () => '明确质量监督要点、资料验收标准与考核评价方法。',
    () => '涵盖该标准的体系管理与持续改进要求。',
  ],
  data: [
    () => '统一该标准的格式标准与命名规范，促进数据共享与资料管理规范化。',
    () => '规范该标准的数据项名称、编码规则与交换格式。',
    () => '明确资料格式、图件标准与归档要求，确保数据一致性。',
  ],
};

const descCounter = {};

function getDescription(catId, stdName) {
  const templates = DESCRIPTION_TEMPLATES[catId] || [(n) => `${n}——本规范适用于石油测井行业相关技术操作与管理要求。`];
  if (!descCounter[catId]) {descCounter[catId] = 0;}
  const tpl = templates[descCounter[catId] % templates.length];
  descCounter[catId]++;
  return tpl(stdName);
}

function classifyFile(fileName) {
  for (const cat of CATEGORY_MAP) {
    for (const pattern of cat.patterns) {
      if (pattern.test(fileName)) {return cat;}
    }
  }
  return null;
}

function parseFile(fileName) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);

  let code = '', year = '', name = base;

  const m1 = base.match(/^\d+-(.+?)(\d{4})\s+(.+)$/);
  if (m1) {
    code = m1[1].replace(/\+/g, '/').replace(/_/g, ' ').trim() + m1[2];
    year = m1[2];
    name = m1[3].replace(/\(/g, '（').replace(/\)/g, '）');
  }

  const m2 = base.match(/^(.+?\d{4})\s+(.+)$/);
  if (!m1 && m2) {
    code = m2[1].replace(/\+/g, '/').replace(/_/g, ' ').trim();
    year = (m2[1].match(/(\d{4})/) || [])[1] || '';
    name = m2[2].replace(/\(/g, '（').replace(/\)/g, '）');
  }

  // 特殊处理标准体系表
  if (base.includes('标准体系表')) {
    name = base;
    code = '';
    year = '';
  }

  return { code, year, name, ext };
}

function getTags(cat) {
  const tags = ['现行'];
  if (cat.id === 'instruments' || cat.id === 'quality') {tags.push('行业标准');}
  else {tags.push('行业标准');}
  if (code => /^QSH|^Q\/SH/.test(code)) {tags.push('企业标准');}
  return tags;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const dirArg = process.argv.find(a => a.startsWith('--dir='));
  const sourceDir = dirArg ? dirArg.split('=')[1] : SOURCE_DIR;

  console.log('='.repeat(60));
  console.log('  测井专业标准更新工具');
  console.log('='.repeat(60));
  console.log(`\n📂 源目录: ${sourceDir}`);
  console.log(`📂 目标目录: ${TARGET_DIR}`);
  console.log(`   Dry-run: ${isDryRun ? '是' : '否'}\n`);

  // 扫描源目录
  const files = await fsp.readdir(sourceDir);
  const supportedExts = ['.pdf', '.docx', '.doc'];
  const targetFiles = files.filter(f => supportedExts.includes(path.extname(f).toLowerCase()));
  console.log(`🔍 扫描到 ${targetFiles.length} 个文件\n`);

  // 确保目标目录存在
  if (!isDryRun) {
    await fsp.mkdir(TARGET_DIR, { recursive: true });
  }

  const categories = CATEGORY_MAP.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    iconColor: cat.iconColor,
    description: cat.description,
    standards: [],
  }));

  const stats = { copied: 0, skipped: 0, unmatched: 0, errors: [] };

  for (const fileName of targetFiles.sort()) {
    const cat = classifyFile(fileName);
    if (!cat) {
      console.log(`  ⚠️ 未匹配: ${fileName}`);
      stats.unmatched++;
      continue;
    }

    const parsed = parseFile(fileName);
    const stdName = parsed.code ? `${parsed.code} ${parsed.name}` : parsed.name;

    // 构建标准条目
    const standard = {
      code: parsed.code || '—',
      name: parsed.name,
      description: getDescription(cat.id, stdName),
      year: parsed.year || '—',
      status: 'current',
      replaces: '',
      tags: ['现行', cat.id === 'instruments' || cat.id === 'quality' ? '行业标准' : (parsed.code.startsWith('Q') ? '企业标准' : '行业标准')],
      pdfUrl: `/standards/${  fileName}`,
    };

    const targetCat = categories.find(c => c.id === cat.id);
    if (targetCat) {targetCat.standards.push(standard);}

    // 复制文件
    if (!isDryRun) {
      const srcPath = path.join(sourceDir, fileName);
      const dstPath = path.join(TARGET_DIR, fileName);
      if (fs.existsSync(dstPath)) {
        // 覆盖（允许版本更新）
        fs.copyFileSync(srcPath, dstPath);
        stats.skipped++;
      } else {
        fs.copyFileSync(srcPath, dstPath);
        stats.copied++;
      }
    }
  }

  // 生成 JSON
  const jsonData = {
    version: new Date().toISOString().slice(0, 7),
    updated: new Date().toISOString().slice(0, 10),
    note: '由 scripts/update-standards.js 自动生成。运行 node scripts/update-standards.js 即可更新。',
    categories,
  };

  if (!isDryRun) {
    await fsp.writeFile(JSON_PATH, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`\n✅ standards.json 已写入: ${JSON_PATH}`);
  }

  // 输出报告
  console.log('\n📊 分类分布:');
  let total = 0;
  for (const cat of categories) {
    console.log(`   ${cat.name}: ${cat.standards.length} 项标准`);
    total += cat.standards.length;
  }
  console.log(`\n   合计: ${total} 项标准`);
  if (!isDryRun) {
    console.log(`   复制: ${stats.copied} 新文件, ${stats.skipped} 已存在(覆盖)`);
  }
  if (stats.errors.length) {
    console.log(`\n❌ 错误: ${stats.errors.length}`);
    stats.errors.forEach(e => console.log(`   ${e}`));
  }
  console.log(`\n💡 运行后刷新页面即可查看更新后的标准列表`);
  console.log(`💡 如需重新生成，再次运行: node scripts/update-standards.js\n`);

  // 输出更新 HTML 分类数量提示
  console.log('⚠️  请在 HTML 中更新以下分类数量:');
  for (const cat of categories) {
    console.log(`   ${cat.name}: ${cat.standards.length}项标准`);
  }
}

main().catch(console.error);
