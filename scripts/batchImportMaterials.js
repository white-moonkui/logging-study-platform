/**
 * 培训材料批量导入工具
 * 使用方法：
 *   node scripts/batchImportMaterials.js <data-file-path>
 *
 * 示例：
 *   node scripts/batchImportMaterials.js data/training_materials.json
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 导入模型
const dbAdapter = require('../utils/dbAdapter');
const Knowledge = require('../models/Knowledge');
const Case = require('../models/Case');
const Exam = require('../models/Exam');
const User = require('../models/User');

class BatchImporter {
    constructor(filePath) {
        this.filePath = filePath;
        this.stats = {
            total: 0,
            knowledge: 0,
            cases: 0,
            exams: 0,
            skipped: 0,
            failed: 0,
            errors: [],
        };
    }

    async import() {
        console.log('🚀 开始批量导入培训材料...\n');

        try {
            // 1. 读取数据文件
            this.loadData();

            // 2. 连接数据库
            await this.connectDatabase();

            // 3. 导入数据
            await this.importData();

            // 4. 显示统计结果
            this.showStatistics();
        } catch (error) {
            console.error('❌ 导入过程出错:', error);
            process.exit(1);
        }
    }

    loadData() {
        console.log('📂 读取数据文件...');

        if (!fs.existsSync(this.filePath)) {
            throw new Error(`文件不存在: ${this.filePath}`);
        }

        const content = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(content);

        if (!Array.isArray(this.data)) {
            throw new Error('数据格式错误：应为JSON数组');
        }

        this.stats.total = this.data.length;
        console.log(`✅ 成功读取 ${this.stats.total} 条数据\n`);
    }

    async connectDatabase() {
        console.log('📡 连接数据库...');
        try {
            await dbAdapter.connect();
            console.log('✅ 数据库连接成功\n');
        } catch (error) {
            throw new Error(`数据库连接失败: ${error.message}`);
        }
    }

    async importData() {
        console.log('📥 开始导入数据...\n');

        for (let i = 0; i < this.data.length; i++) {
            const item = this.data[i];
            try {
                if (item.type === 'knowledge') {
                    await this.importKnowledge(item, i);
                } else if (item.type === 'case') {
                    await this.importCase(item, i);
                } else if (item.type === 'exam_question') {
                    await this.importExamQuestion(item, i);
                } else {
                    console.log(`⏭️  跳过未知类型: ${item.title || '未知'} (索引: ${i})`);
                    this.stats.skipped++;
                }
            } catch (error) {
                console.error(`❌ 导入失败: ${item.title || '未知'} (索引: ${i})`);
                console.error(`   错误: ${error.message}`);
                this.stats.failed++;
                this.stats.errors.push({
                    item: item.title || '未知',
                    error: error.message,
                    index: i,
                });
            }
        }

        console.log(`\n✅ 导入完成！\n`);
    }

    async importKnowledge(knowledge, index) {
        console.log(`[${index + 1}/${this.stats.total}] 导入知识库: "${knowledge.title}"`);

        // 检查是否已存在
        const existing = await Knowledge.findOne({ title: knowledge.title });
        if (existing) {
            console.log(`   ⏭️  跳过（已存在）`);
            this.stats.skipped++;
            return;
        }

        // 获取创建用户
        const user = await this.getUser(knowledge.createdBy);

        // 创建知识库记录
        const knowledgeDoc = new Knowledge({
            title: knowledge.title,
            category: knowledge.category,
            subcategory: knowledge.subcategory,
            content: knowledge.content,
            keywords: knowledge.keywords,
            difficulty: knowledge.difficulty,
            readingTime: knowledge.readingTime,
            hasQuiz: knowledge.hasQuiz,
            quizQuestions: knowledge.quizQuestions,
            tags: knowledge.tags,
            createdBy: user._id,
            createdAt: new Date(knowledge.createdAt),
            status: knowledge.status || 'published',
        });

        await knowledgeDoc.save();
        console.log(`   ✅ 导入成功`);
        this.stats.knowledge++;
    }

    async importCase(caseItem, index) {
        console.log(`[${index + 1}/${this.stats.total}] 导入案例: "${caseItem.title}"`);

        // 检查是否已存在
        const existing = await Case.findOne({ title: caseItem.title });
        if (existing) {
            console.log(`   ⏭️  跳过（已存在）`);
            this.stats.skipped++;
            return;
        }

        // 获取创建用户
        const user = await this.getUser(caseItem.createdBy);

        // 创建案例记录
        const caseDoc = new Case({
            title: caseItem.title,
            description: caseItem.description,
            category: caseItem.category,
            wellInfo: caseItem.wellInfo,
            problemStatement: caseItem.problemStatement,
            analysisProcess: caseItem.analysisProcess,
            solution: caseItem.solution,
            results: caseItem.results,
            lessons: caseItem.lessons,
            keywords: caseItem.keywords,
            technicalTerms: caseItem.technicalTerms,
            difficulty: caseItem.difficulty,
            interactivityLevel: caseItem.interactivityLevel,
            interactiveSteps: caseItem.interactiveSteps,
            status: caseItem.status,
            viewCount: caseItem.viewCount || 0,
            rating: caseItem.rating,
            userInteractions: caseItem.userInteractions,
            createdBy: user._id,
            createdAt: new Date(caseItem.createdAt),
            updatedAt: new Date(caseItem.createdAt),
        });

        await caseDoc.save();
        console.log(`   ✅ 导入成功`);
        this.stats.cases++;
    }

    async importExamQuestion(question, index) {
        console.log(
            `[${index + 1}/${this.stats.total}] 导入考试题: "${question.questionText.substring(0, 30)}..."`
        );

        // 检查是否已存在
        const existing = await Exam.findOne({ questionText: question.questionText });
        if (existing) {
            console.log(`   ⏭️  跳过（已存在）`);
            this.stats.skipped++;
            return;
        }

        // 获取创建用户
        const user = await this.getUser(question.createdBy);

        // 创建考试题记录
        const examDoc = new Exam({
            title: question.category,
            description: `从 ${question.category} 导入的考试题`,
            category: question.category,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            points: question.points,
            difficulty: question.difficulty,
            relatedKnowledge: question.relatedKnowledge,
            tags: question.tags,
            createdBy: user._id,
            createdAt: new Date(question.createdAt),
            status: 'published',
        });

        await examDoc.save();
        console.log(`   ✅ 导入成功`);
        this.stats.exams++;
    }

    async getUser(username) {
        if (!username) {
            // 使用默认用户
            const user = await User.findOne({ username: 'admin' });
            if (user) {return user;}

            // 如果没有admin用户，使用第一个用户
            const firstUser = await User.findOne();
            if (firstUser) {return firstUser;}

            throw new Error('数据库中没有可用的用户，请先创建用户');
        }

        const user = await User.findOne({ username });
        if (!user) {
            console.warn(`⚠️  用户 ${username} 不存在，使用默认用户`);
            const defaultUser = await User.findOne({ username: 'admin' });
            if (defaultUser) {return defaultUser;}
        }

        return user;
    }

    showStatistics() {
        console.log('='.repeat(60));
        console.log('📊 导入统计');
        console.log('='.repeat(60));
        console.log(`总计: ${this.stats.total} 条`);
        console.log(
            `✅ 成功导入: ${this.stats.knowledge + this.stats.cases + this.stats.exams} 条`
        );
        console.log(`   ├─ 知识库: ${this.stats.knowledge} 条`);
        console.log(`   ├─ 案例: ${this.stats.cases} 个`);
        console.log(`   └─ 考试题: ${this.stats.exams} 道`);
        console.log(`⏭️  跳过: ${this.stats.skipped} 条`);
        console.log(`❌ 失败: ${this.stats.failed} 条`);
        console.log('='.repeat(60));

        if (this.stats.errors.length > 0) {
            console.log('\n❌ 错误列表:');
            this.stats.errors.forEach(error => {
                console.log(`   - [${error.index}] ${error.item}: ${error.error}`);
            });
        }
    }
}

// 命令行参数解析
const filePath = process.argv[2];

if (!filePath) {
    console.log('使用方法: node scripts/batchImportMaterials.js <data-file-path>');
    console.log('\n示例:');
    console.log('  node scripts/batchImportMaterials.js data/training_materials.json');
    process.exit(1);
}

// 运行导入
const importer = new BatchImporter(filePath);
importer.import();
