/**
 * 从 public/data/interactive-cases.json 导入案例到 Case 模型
 * 运行：node scripts/import-interactive-cases.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Case = require('../models/Case');
const User = require('../models/User');
const db = require('../utils/dbAdapter');

// 分类映射：JSON分类 → Case模型enum
const CATEGORY_MAP = {
  stuck: 'trouble_shooting',
  quality: 'new_technology',
  troubleshooting: 'trouble_shooting',
  evaluation: 'reservoir_evaluation',
  production: 'production',
  reservoir: 'reservoir_evaluation',
};

const CATEGORY_LABEL_MAP = {
  stuck: '遇阻遇卡',
  quality: '曲线质量判识',
  troubleshooting: '仪器故障排查',
  evaluation: '测井解释',
  production: '生产测井',
  reservoir: '储层评价',
};

async function main() {
  await db.connect();

  // 1. 找 admin 用户
  let user = await User.findOne({ role: 'admin' });
  if (!user) {user = await User.findOne();}
  if (!user) {
    console.error('❌ 数据库无用户，请先 npm run init');
    process.exit(1);
  }
  console.log(`✅ 使用用户: ${user.username} (${user._id})`);

  // 2. 读取 JSON
  const jsonPath = path.join(__dirname, '..', 'public', 'data', 'interactive-cases.json');
  const { cases } = require(jsonPath);
  console.log(`📖 读取到 ${cases.length} 个案例\n`);

  let created = 0;
  let skipped = 0;

  for (const item of cases) {
    // 去重
    const exists = await Case.findOne({ title: item.title });
    if (exists) {
      console.log(`⏭️  跳过: "${item.title}" (已存在)`);
      skipped++;
      continue;
    }

    // 分类映射
    const category = CATEGORY_MAP[item.category] || 'trouble_shooting';
    const categoryLabel = item.categoryLabel || CATEGORY_LABEL_MAP[item.category] || '其他';

    // 从 steps 提取 analysis/solution/lessons
    const stepTexts = item.steps.map(s => s.instruction).join('\n');
    const answerTexts = item.steps.map(s => s.answer || s.feedback).join('\n');
    const feedbackTexts = item.steps.map(s => s.feedback).join('\n');

    // 关键词
    const keywords = [categoryLabel, item.difficultyLabel || '中级'];

    // 构建案例对象
    const caseData = {
      title: item.title,
      description: item.description,
      category,
      difficulty: item.difficulty || 'intermediate',
      interactivityLevel: 'interactive',

      problemStatement: item.steps[0]?.instruction || item.description,
      analysisProcess: stepTexts,
      solution: answerTexts,
      results: `本案例包含 ${item.steps.length} 个交互步骤。`,
      lessons: item.steps[item.steps.length - 1]?.feedback || feedbackTexts,

      keywords: keywords.slice(0, 10),
      technicalTerms: [],

      interactiveSteps: item.steps.map((s, i) => ({
        stepNumber: i + 1,
        instruction: s.instruction,
        hints: s.hints || [],
        feedback: s.feedback,
      })),

      status: 'published',
      submittedBy: user._id,
      viewCount: item.viewCount || 0,
      rating: { average: item.rating || 4.5, count: 1 },
    };

    await new Case(caseData).save();
    console.log(`✅ 创建: "${item.title}" (${categoryLabel}, ${item.steps.length}步)`);
    created++;
  }

  console.log(`\n📊 完成: 新增 ${created}, 跳过 ${skipped}, 总计 ${cases.length}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
