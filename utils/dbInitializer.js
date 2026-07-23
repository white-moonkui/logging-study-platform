require('dotenv').config();
const dbAdapter = require('./dbAdapter');
const User = require('../models/User');
const Knowledge = require('../models/Knowledge');
const { Exam } = require('../models/Exam');
const Case = require('../models/Case');

class DatabaseInitializer {
    constructor() {
        this.sampleUsers = [
            {
                username: 'admin',
                email: 'admin@welllogging.com',
                password: 'admin123',
                role: 'admin',
                profile: {
                    name: '系统管理员',
                    title: '系统管理员',
                    organization: '测井培训中心',
                },
            },
            {
                username: 'zhang_san',
                email: 'zhangsan@sinopec.com',
                password: 'zhang123',
                role: 'student',
                profile: {
                    name: '张三',
                    title: '助理工程师',
                    organization: '胜利油田',
                    experience: 5,
                },
            },
            {
                username: 'student',
                email: 'student@welllogging.com',
                password: 'student123',
                role: 'student',
                profile: {
                    name: '李学员',
                    title: '助理工程师',
                    organization: '油田公司',
                    experience: 2,
                },
            },
        ];

        this.sampleKnowledge = [
            {
                title: '自然伽马测井原理',
                category: 'basic',
                subcategory: '放射性测井',
                content:
                    '自然伽马测井是测量地层自然放射性的方法。地层中的泥质含量越高，自然伽马值通常越高。这种方法主要用于识别岩性、判断泥质含量和进行地层对比。',
                keywords: ['自然伽马', '放射性', '岩性识别', '泥质含量'],
                difficulty: 'intermediate',
                readingTime: 15,
                hasQuiz: true,
                quizQuestions: [
                    {
                        question: '自然伽马测井主要用于什么？',
                        options: ['识别岩性', '测量孔隙度', '计算电阻率', '测量温度'],
                        correctAnswer: 0,
                        explanation: '自然伽马测井主要用于识别岩性和判断泥质含量。',
                    },
                ],
                tags: ['基础理论', '放射性测井'],
            },
            {
                title: '电阻率测井基础',
                category: 'basic',
                subcategory: '电法测井',
                content:
                    '电阻率测井是测量地层电阻率的基本方法。地层的电阻率主要受含水饱和度、孔隙水矿化度、岩性等因素影响。含油气的地层通常具有较高电阻率。',
                keywords: ['电阻率', '含水饱和度', '油气识别', '地层对比'],
                difficulty: 'beginner',
                readingTime: 20,
                hasQuiz: true,
                tags: ['基础理论', '电法测井'],
            },
            {
                title: '声波测井技术',
                category: 'basic',
                subcategory: '声波测井',
                content:
                    '声波测井通过测量声波在地层中的传播速度来计算孔隙度等参数。声波时差与孔隙度呈正相关关系，常用于计算岩层孔隙度和识别裂缝。',
                keywords: ['声波时差', '孔隙度', '裂缝识别', '岩石力学'],
                difficulty: 'intermediate',
                readingTime: 18,
                tags: ['基础理论', '声波测井'],
            },
            {
                title: 'API测井标准规范',
                category: 'standard',
                subcategory: '安全标准',
                content:
                    'API RP 67标准规定了放射性测井作业的安全要求，包括源运输、存储、使用和事故处理的详细规程。所有测井作业必须严格遵守这些安全标准。',
                keywords: ['API标准', '安全规范', '放射性安全', '作业标准'],
                difficulty: 'advanced',
                readingTime: 25,
                tags: ['标准规范', '安全作业'],
            },
            {
                title: '测井-地质协同解释',
                category: 'cross',
                subcategory: '地质协同',
                content:
                    '测井资料与地质信息的结合可以提高解释精度。通过测井曲线可以识别沉积相、分析储层特征，为地质建模提供重要依据。',
                keywords: ['地质解释', '沉积相', '储层建模', '综合分析'],
                difficulty: 'advanced',
                readingTime: 30,
                tags: ['跨学科', '地质协同'],
            },
        ];

        this.sampleCases = [
            {
                title: '复杂储层测井解释案例',
                description: '针对某区块低孔低渗储层的测井解释实践',
                category: 'reservoir_evaluation',
                wellInfo: {
                    wellName: 'XX-01井',
                    location: '塔里木盆地',
                    depth: 3500,
                    formation: '三叠系砂岩',
                    drillingDate: new Date('2025-01-15'),
                },
                problemStatement: '该井目的层段电阻率异常低，常规解释方法难以准确判断油气层。',
                analysisProcess:
                    '通过对测井曲线的综合分析，发现地层水矿化度异常高，导致电阻率降低。结合岩心分析和测试资料，确定了油气层识别标准。',
                solution:
                    '采用电阻率-孔隙度交会图法，结合地层水矿化度校正，成功识别出2个油气层，厚度合计15米。',
                results: '经试油验证，日产油30吨，证实了解释结果的准确性。',
                lessons: '在复杂地层条件下，必须综合考虑各种地质因素，建立适合该区域的解释模型。',
                keywords: ['低孔低渗', '电阻率异常', '地层水矿化度', '交会图法'],
                interactivityLevel: 'interactive',
                interactiveSteps: [
                    {
                        stepNumber: 0,
                        instruction: '请观察测井曲线，识别异常层段',
                        expectedInput: '3100-3150米',
                        hints: ['注意电阻率变化', '观察自然伽马曲线'],
                        feedback: '正确！该层段电阻率明显降低。',
                    },
                ],
                status: 'published',
            },
            {
                title: '钻井液侵入影响校正案例',
                description: '解决钻井液侵入对电阻率测井影响的工程实践',
                category: 'trouble_shooting',
                wellInfo: {
                    wellName: 'YY-02井',
                    location: '大庆油田',
                    depth: 2000,
                    formation: '白垩系砂岩',
                    drillingDate: new Date('2025-02-20'),
                },
                problemStatement: '由于钻井液侵入，深浅电阻率差异很大，影响了饱和度计算精度。',
                analysisProcess: '通过分析侵入时间、侵入深度和钻井液性能，建立了侵入影响校正模型。',
                solution:
                    '采用时间推移测井方法，结合数值模拟，成功校正了侵入影响，提高了饱和度计算精度。',
                results: '校正后的含水饱和度与岩心分析结果误差小于5%。',
                lessons: '在高渗透性地层中，必须考虑钻井液侵入对测井响应的影响。',
                keywords: ['钻井液侵入', '电阻率校正', '时间推移测井', '饱和度计算'],
                interactivityLevel: 'guided',
                status: 'published',
            },
        ];

        this.sampleExams = [
            {
                title: '测井基础理论考试',
                description: '测试学员对测井基础理论的掌握程度',
                category: 'basic',
                difficulty: 'intermediate',
                timeLimit: 60,
                passingScore: 70,
                questions: [
                    {
                        questionText: '自然伽马测井主要用于识别什么？',
                        questionType: 'single_choice',
                        options: ['岩性和泥质含量', '孔隙度', '渗透率', '含油饱和度'],
                        correctAnswer: 0,
                        explanation: '自然伽马测井主要用于识别岩性和判断泥质含量。',
                        points: 2,
                        difficulty: 'easy',
                    },
                    {
                        questionText: '电阻率测井的影响因素包括？',
                        questionType: 'multiple_choice',
                        options: ['含水饱和度', '孔隙水矿化度', '岩性', '温度'],
                        correctAnswer: [0, 1, 2],
                        explanation: '电阻率受含水饱和度、孔隙水矿化度、岩性等多种因素影响。',
                        points: 3,
                        difficulty: 'medium',
                    },
                    {
                        questionText: '声波时差与孔隙度呈正相关关系。',
                        questionType: 'true_false',
                        correctAnswer: true,
                        explanation: '声波时差随孔隙度增加而增大，呈正相关关系。',
                        points: 1,
                        difficulty: 'easy',
                    },
                ],
                isPublished: true,
                isActive: true,
            },
            {
                title: '测井安全操作考试',
                description: '测试学员对测井安全规范的掌握',
                category: 'standard',
                difficulty: 'advanced',
                timeLimit: 45,
                passingScore: 80,
                questions: [
                    {
                        questionText: '放射性源的运输要求包括？',
                        questionType: 'multiple_choice',
                        options: ['专用容器', '明显标识', '防护措施', '普通运输'],
                        correctAnswer: [0, 1, 2],
                        explanation: '放射性源运输需要专用容器、明显标识和防护措施。',
                        points: 3,
                        difficulty: 'medium',
                    },
                ],
                isPublished: true,
                isActive: true,
            },
        ];
    }

    async initialize() {
        try {
            console.log('开始初始化数据库...');

            // 先连接数据库
            console.log('连接数据库...');
            await dbAdapter.connect();
            console.log('数据库连接成功');

            // 清空现有数据（可选）
            // await this.clearDatabase();

            // 创建示例用户
            await this.createUsers();

            // 创建示例知识内容
            await this.createKnowledge();

            // 创建示例案例
            await this.createCases();

            // 创建示例考试
            await this.createExams();

            console.log('数据库初始化完成！');
        } catch (error) {
            console.error('数据库初始化失败:', error);
        }
    }

    async clearDatabase() {
        console.log('清空现有数据...');
        await User.deleteMany({});
        await Knowledge.deleteMany({});
        await Case.deleteMany({});
        await Exam.deleteMany({});
        console.log('数据清空完成');
    }

    async createUsers() {
        console.log('创建示例用户...');
        const bcrypt = require('bcryptjs');

        for (const userData of this.sampleUsers) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            const user = new User({
                ...userData,
                password: hashedPassword,
            });
            await user.save();
            console.log(`用户 ${userData.username} 创建成功`);
        }

        // 验证用户创建是否成功
        const userCount = await User.countDocuments();
        console.log(`总用户数量: ${userCount}`);
    }

    async createKnowledge() {
        console.log('创建示例知识内容...');
        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            console.log('未找到管理员用户，跳过知识内容创建');
            return;
        }

        for (const knowledgeData of this.sampleKnowledge) {
            knowledgeData.createdBy = admin._id;
            knowledgeData.isPublished = true;

            const knowledge = new Knowledge(knowledgeData);
            await knowledge.save();
            console.log(`知识内容 "${knowledgeData.title}" 创建成功`);
        }
    }

    async createCases() {
        console.log('创建示例案例...');
        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            console.log('未找到管理员用户，跳过案例创建');
            return;
        }

        for (const caseData of this.sampleCases) {
            caseData.submittedBy = admin._id;
            caseData.status = 'approved';

            const caseDoc = new Case(caseData);
            await caseDoc.save();
            console.log(`案例 "${caseData.title}" 创建成功`);
        }
    }

    async createExams() {
        console.log('创建示例考试...');
        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            console.log('未找到管理员用户，跳过考试创建');
            return;
        }

        for (const examData of this.sampleExams) {
            examData.createdBy = admin._id;

            const exam = new Exam(examData);
            await exam.save();
            console.log(`考试 "${examData.title}" 创建成功`);
        }
    }

    // 验证初始化结果
    async verify() {
        // 确保已连接数据库
        try {
            await dbAdapter.connect();
        } catch (e) {
            // 忽略连接错误（可能已经连接）
        }

        const userCount = await User.countDocuments();
        const knowledgeCount = await Knowledge.countDocuments();
        const caseCount = await Case.countDocuments();
        const examCount = await Exam.countDocuments();

        console.log('\n数据验证:');
        console.log(`用户数量: ${userCount}`);
        console.log(`知识内容数量: ${knowledgeCount}`);
        console.log(`案例数量: ${caseCount}`);
        console.log(`考试数量: ${examCount}`);
    }
}

module.exports = new DatabaseInitializer();
