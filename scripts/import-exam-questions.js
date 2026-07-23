/**
 * 测井试题题库导入脚本/模块
 * 从 Excel 文件读取试题并导入到 Exam 集合
 *
 * 使用方法:
 *   node scripts/import-exam-questions.js            # CLI 直接运行
 *   const imp = require('./scripts/import-exam-questions');
 *   await imp.importQuestions();                     # 程序调用
 *
 * Excel 格式 (queTemplate sheet):
 *   题型 | 难度 | 分数 | 业务分类 | 题目内容 | 参考答案 | 答案解析 | 是否子题 | opt1 | opt2 | opt3 | opt4
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbAdapter = require('../utils/dbAdapter');
const dbInitializer = require('../utils/dbInitializer');
const bcrypt = require('bcryptjs');
const { Exam } = require('../models/Exam');
const User = require('../models/User');

const EXCEL_PATH = path.join('C:', 'Users', 'Administrator', 'Desktop', '测井试题总题库.xlsx');

class ExamQuestionImporter {
  constructor() {
    this.stats = { total: 0, imported: 0, skipped: 0, failed: 0, errors: [] };
  }

  async run() {
    console.log('=== 测井试题题库导入工具 ===\n');

    // 1. 读 Excel
    const rows = this.readExcel();

    // 2. 连数据库
    await this.connectDB();

    // 3. 找到 admin 用户作为 createdBy（如果不存在则自动初始化）
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('⚙️ 未找到 admin 用户，自动初始化种子数据...');
      await dbInitializer.initialize();
      admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        console.error('❌ 初始化后仍未找到 admin 用户');
        process.exit(1);
      }
    }
    console.log(`✅ 使用 admin 用户: ${admin.username}\n`);

    // 4. 按题型拆分导入
    await this.importByCategory(rows, admin._id);

    // 5. 输出报告
    this.report();
    process.exit(0);
  }

  readExcel() {
    if (!fs.existsSync(EXCEL_PATH)) {
      console.error(`❌ Excel 文件不存在: ${EXCEL_PATH}`);
      console.log('   请确认文件在桌面: 测井试题总题库.xlsx');
      process.exit(1);
    }

    const wb = XLSX.readFile(EXCEL_PATH, { sheetStubs: false });
    const ws = wb.Sheets['queTemplate'];
    if (!ws) {
      console.error('❌ 未找到 queTemplate sheet');
      process.exit(1);
    }

    // 行转 JSON，跳过第 1 行（原始表头）
    const raw = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });
    // 第一行是列说明行，跳过
    const dataRows = raw.slice(2).filter(r => r[4] && String(r[4]).trim()); // 第 5 列 = 题目内容
    this.stats.total = dataRows.length;
    console.log(`📊 共读取 ${dataRows.length} 道题目\n`);
    return dataRows;
  }

  async connectDB() {
    console.log('📡 连接数据库...');
    await dbAdapter.connect();
    console.log('✅ 数据库连接成功\n');
  }

  mapType(t) {
    const map = { '单选题': 'single_choice', '多选题': 'multiple_choice', '判断题': 'true_false' };
    return map[String(t).trim()] || null;
  }

  mapDifficulty(d) {
    const map = { '容易': 'easy', '中等': 'medium', '较难': 'hard', '难': 'hard' };
    return map[String(d).trim()] || 'medium';
  }

  mapAnswer(type, raw) {
    const v = String(raw).trim();
    if (type === 'true_false') {
      return v === '对' || v === '√' || v === '正确' || v === 'true';
    }
    if (type === 'multiple_choice') {
      // "AB" → ["A", "B"], 按字母排序保证比较一致
      const arr = v.split('').filter(c => c >= 'A' && c <= 'Z').sort();
      return arr;
    }
    // single_choice: "A" → "A"
    return v;
  }

  /**
   * 按业务分类拆分，每个分类创建一个 exam
   */
  async importByCategory(rows, adminId) {
    // 按业务分类分组
    const groups = {};
    for (const r of rows) {
      const categoryName = String(r[3] || '未分类').trim(); // D列 = 业务分类
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(r);
    }

    console.log(`📁 按业务分类拆分为 ${Object.keys(groups).length} 组:\n`);

    for (const [catName, catRows] of Object.entries(groups)) {
      // 每个分类创建一个 exam（如果题目超过 200 道，按难度拆分）
      const byDifficulty = {};
      for (const r of catRows) {
        const diff = this.mapDifficulty(r[1]); // B列 = 难度
        if (!byDifficulty[diff]) byDifficulty[diff] = [];
        byDifficulty[diff].push(r);
      }

      for (const [diff, diffRows] of Object.entries(byDifficulty)) {
        // 如果同分类同难度的题还超过 200，再拆成多个 exam
        const chunks = this.chunkArray(diffRows, 200);
        for (let ci = 0; ci < chunks.length; ci++) {
          await this.createExam(chunks[ci], catName, diff, adminId, chunks.length > 1 ? ci + 1 : null);
        }
      }
    }
  }

  chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
    return result;
  }

  async createExam(rows, category, difficulty, adminId, part) {
    const safeTitle = category === '未分类' ? '测井基础知识' : category;
    const title = part ? `${safeTitle}题库(第${part}部分)` : `${safeTitle}题库`;
    const diffLabel = { easy: '基础', medium: '进阶', hard: '挑战' };

    // 过滤无效行
    const questions = [];
    for (const r of rows) {
      const qText = String(r[4] || '').trim();   // E列 = 题目内容
      const type = this.mapType(r[0]);             // A列 = 题型
      if (!qText || !type) continue;

      const answer = r[5];                         // F列 = 参考答案
      const explanation = r[6] ? String(r[6]).trim() : ''; // G列 = 答案解析
      const points = r[2] ? Number(r[2]) : 1;      // C列 = 分数

      // 选项: opt1-opt4 (I-L列, index 8-11)
      const options = [];
      for (let i = 8; i <= 11; i++) {
        const opt = r[i];
        if (opt !== undefined && opt !== null && String(opt).trim() !== '') {
          options.push(String(opt).trim());
        }
      }

      // 对于判断题，如果没有选项，填 "对/错"
      if (type === 'true_false' && options.length === 0) {
        options.push('对', '错');
      }

      questions.push({
        questionText: qText,
        questionType: type,
        options,
        correctAnswer: this.mapAnswer(type, answer),
        explanation,
        points: points > 0 ? points : 1,
        difficulty: this.mapDifficulty(r[1]),
      });
    }

    if (questions.length === 0) return;

    const diffDisplay = diffLabel[difficulty] || difficulty;
    const examTitle = `${title}(${diffDisplay})`;

    // upsert: 同名考试已存在 → 覆盖 questions；不存在 → 新建
    const exist = await Exam.findOne({ title: examTitle });
    if (exist) {
      exist.questions = questions;
      exist.description = `自动导入的 ${title} 试题，难度：${diffDisplay}，共 ${questions.length} 题`;
      exist.timeLimit = questions.length * 2;
      exist.isActive = true;
      exist.isPublished = true;
      await exist.save();
      this.stats.imported += questions.length;
      console.log(`  🔄 ${examTitle} — ${questions.length} 题 (已覆盖)`);
    } else {
      const exam = new Exam({
        title: examTitle,
        description: `自动导入的 ${title} 试题，难度：${diffDisplay}，共 ${questions.length} 题`,
        category: 'basic',
        difficulty,
        timeLimit: questions.length * 2,
        passingScore: 60,
        questions,
        isPublished: true,
        isActive: true,
        createdBy: adminId,
        randomizeQuestions: true,
        randomizeOptions: false,
        allowReview: true,
        maxAttempts: 0,
        tags: ['题库', category, diffDisplay],
        source: 'preset',
        sourceRef: 'CJ-0',
      });
      await exam.save();
      this.stats.imported += questions.length;
      console.log(`  ✅ ${examTitle} — ${questions.length} 题`);
    }
  }

  report() {
    console.log(`\n=== 导入完成 ===`);
    console.log(`  总计: ${this.stats.total} 题`);
    console.log(`  导入: ${this.stats.imported} 题`);
    console.log(`  跳过: ${this.stats.skipped} 题`);
    console.log(`  失败: ${this.stats.failed} 题`);
    if (this.stats.errors.length > 0) {
      console.log('\n  错误详情:');
      this.stats.errors.forEach((e, i) => console.log(`    ${i + 1}. ${e}`));
    }
  }
}

// 导出可复用的 import 函数（供 start.js 等调用）
async function importQuestions({ adminId } = {}) {
  const imp = new ExamQuestionImporter();
  // 如果提供了 adminId，跳过 User.find()
  if (adminId) {
    imp._adminId = adminId;
  }

  // 如果 Excel 不存在，静默跳过
  if (!fs.existsSync(EXCEL_PATH)) {
    console.log('📄 Excel 题库文件未找到，跳过导入');
    return false;
  }

  await imp.connectDB();

  const rows = imp.readExcel();
  if (rows.length === 0) {
    console.log('📄 Excel 题库无数据，跳过导入');
    return false;
  }

  // 找 admin 用户
  let admin;
  if (imp._adminId) {
    admin = await User.findById(imp._adminId);
  }
  if (!admin) {
    admin = await User.findOne({ role: 'admin' });
  }
  if (!admin) {
    admin = await User.findOne();
  }
  if (!admin) {
    console.log('⚠️ 无可用用户，跳过导入');
    return false;
  }

  await imp.importByCategory(rows, admin._id);
  imp.report();
  return imp.stats.imported > 0;
}

module.exports = { importQuestions, ExamQuestionImporter, EXCEL_PATH };

// 直接运行 = CLI 模式
if (require.main === module) {
  new ExamQuestionImporter().run().catch(err => {
    console.error('❌ 未捕获错误:', err);
    process.exit(1);
  });
}
