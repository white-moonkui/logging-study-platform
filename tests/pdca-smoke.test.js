/**
 * PDCA 闭环集成冒烟测试
 * 覆盖完整的 Plan→Do→Check→Act 流程：
 * 创建知识→创建考试→开始培训周期→学习→考试→评估→补学→复测→闭环
 */
const request = require('supertest');
const { app, setupDatabase, teardownDatabase, loginAs } = require('./helpers/testSetup');

let adminToken, studentToken, studentId;
let categoryId, knowledgeId, examId, cycleId, examResultId, retestResultId;

beforeAll(async () => {
    await setupDatabase();
    const admin = await loginAs(request(app), 'admin', 'admin123');
    const student = await loginAs(request(app), 'student', 'student123');
    adminToken = admin.token;
    studentToken = student.token;
    studentId = student.userId;
});

afterAll(async () => {
    await teardownDatabase();
});

// ==================== 准备测试数据 ====================

describe('Phase P-准备: 创建测试基础数据', () => {
    test('创建基础分类', async () => {
        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: '基础知识', code: 'basic', level: 1 });
        expect(res.status).toBe(200);
        categoryId = res.body.data?._id || res.body._id;
        expect(categoryId).toBeDefined();
    });

    test('创建知识条目', async () => {
        const res = await request(app)
            .post('/api/knowledge')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: '钻井液基础知识',
                categoryId: 'basic',
                description: '钻井液基本性能指标介绍',
                keywords: ['钻井液', '粘度', '密度'],
                status: 'published',
            });
        expect(res.status).toBe(200);
        knowledgeId = res.body.data?._id;
        expect(knowledgeId).toBeDefined();
    });

    test('创建带题目的考试', async () => {
        const res = await request(app)
            .post('/api/exams')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: '钻井基础知识测试',
                category: 'basic',
                difficulty: 'beginner',
                timeLimit: 30,
                passingScore: 60,
                isPublished: true,
                questions: [
                    {
                        questionText: '钻井液的主要功能是什么？',
                        questionType: 'single_choice',
                        options: ['A. 冷却钻头', 'B. 携带岩屑', 'C. 以上都是', 'D. 以上都不是'],
                        correctAnswer: 'C',
                        points: 10,
                    },
                    {
                        questionText: '钻井液密度越高越好',
                        questionType: 'true_false',
                        correctAnswer: false,
                        points: 10,
                    },
                ],
            });
        expect(res.status).toBe(201);
        examId = res.body.exam?._id;
        expect(examId).toBeDefined();
    });
});

// ==================== PDCA 闭环流程 ====================
// 流程：先考试 → startCycle(传examId自动关联) → evaluate → remediate → retest → completeRetest

describe('Phase D-执行: 先考试（all wrong→0% 触发差距）', () => {
    test('POST /api/exams/:id/start — 开始考试', async () => {
        const res = await request(app)
            .post(`/api/exams/${examId}/start`)
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.examResult).toBeDefined();
        expect(res.body.examResult.id).toBeDefined();
        expect(res.body.questions).toBeInstanceOf(Array);
        expect(res.body.questions.length).toBe(2);
        examResultId = res.body.examResult.id;
    });

    test('POST /api/exams/:id/submit — 提交考试（故意全部答错得 0%）', async () => {
        const res = await request(app)
            .post(`/api/exams/${examResultId}/submit`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                answers: ['A', true],
                endTime: new Date(Date.now() + 60000).toISOString(),
            });
        expect(res.status).toBe(200);
        expect(res.body.result).toBeDefined();
        expect(res.body.result.score).toBe(0); // 全部答错
        expect(res.body.result.passed).toBe(false);
    });
});

describe('Phase P-计划: 创建培训周期（关联考试结果）', () => {
    test('POST /api/training-cycles/start — 传 examId 自动关联', async () => {
        const res = await request(app)
            .post('/api/training-cycles/start')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ examId });
        expect(res.status).toBe(201);
        expect(res.body.cycle).toBeDefined();
        expect(res.body.cycle.status).toBe('exam_ready');
        expect(res.body.cycle.exams.length).toBe(1);
        cycleId = res.body.cycle._id;
    });

    test('POST /api/training-cycles/start — 重复创建应被拒绝', async () => {
        const res = await request(app)
            .post('/api/training-cycles/start')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/已有进行中/);
    });

    test('GET /api/training-cycles/current — 获取当前周期', async () => {
        const res = await request(app)
            .get('/api/training-cycles/current')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.cycle).toBeDefined();
        expect(res.body.cycle._id).toBe(cycleId);
    });
});

describe('Phase C-检查: 差距分析', () => {
    test('POST /api/training-cycles/:id/evaluate — 发现差距', async () => {
        const res = await request(app)
            .post(`/api/training-cycles/${cycleId}/evaluate`)
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.gaps).toBeInstanceOf(Array);
        expect(res.body.gaps.length).toBeGreaterThanOrEqual(1);
        expect(res.body.status).toBe('evaluated');

        const gap = res.body.gaps[0];
        expect(gap.dimension).toBeDefined();
        expect(gap.score).toBeLessThan(gap.threshold);
        expect(gap.gap).toBeGreaterThan(0);
        expect(gap.priority).toBeDefined();
    });

    test('GET /api/training-cycles/:id — 验证周期状态已更新', async () => {
        const res = await request(app)
            .get(`/api/training-cycles/${cycleId}`)
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.cycle.status).toBe('evaluated');
        expect(res.body.cycle.gaps).toBeInstanceOf(Array);
        expect(res.body.cycle.exams.length).toBe(1);
    });
});

describe('Phase A-改进: 补学 + 复测闭环', () => {
    test('POST /api/training-cycles/:id/remediate — 生成补学计划', async () => {
        const res = await request(app)
            .post(`/api/training-cycles/${cycleId}/remediate`)
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.cycle).toBeDefined();
        expect(res.body.cycle.status).toBe('remediation');
        expect(res.body.cycle.remediation).toBeDefined();
        expect(res.body.cycle.remediation.knowledgeItems).toBeInstanceOf(Array);
    });

    test('PUT /api/training-cycles/:id/knowledge/:knowledgeId/complete — 标记补学完成', async () => {
        // 先获取周期详情拿到 knowledgeItems
        const detailRes = await request(app)
            .get(`/api/training-cycles/${cycleId}`)
            .set('Authorization', `Bearer ${studentToken}`);
        const items = detailRes.body.cycle?.remediation?.knowledgeItems || [];
        const kid = items[0]?.knowledgeId?._id || items[0]?.knowledgeId;
        expect(kid).toBeDefined();

        const res = await request(app)
            .put(`/api/training-cycles/${cycleId}/knowledge/${kid}/complete`)
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('补学完成');
    });

    test('再考一次（全对 100%）— 为闭环准备', async () => {
        const startRes = await request(app)
            .post(`/api/exams/${examId}/start`)
            .set('Authorization', `Bearer ${studentToken}`);
        expect(startRes.status).toBe(200);
        retestResultId = startRes.body.examResult.id;

        const submitRes = await request(app)
            .post(`/api/exams/${retestResultId}/submit`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                answers: ['C', false],
                endTime: new Date(Date.now() + 60000).toISOString(),
            });
        expect(submitRes.status).toBe(200);
        expect(submitRes.body.result.score).toBe(100);
        expect(submitRes.body.result.passed).toBe(true);
    });

    test('POST /api/training-cycles/:id/retest — 闭环完成（0→100, delta=100）', async () => {
        const res = await request(app)
            .post(`/api/training-cycles/${cycleId}/retest`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ examId, resultId: retestResultId });
        expect(res.status).toBe(200);
        expect(res.body.scoreDelta).toBe(100); // 0→100
        expect(res.body.previousScore).toBe(0);
        expect(res.body.newScore).toBe(100);
        expect(res.body.improvement).toBe('提升');
    });

    test('GET /api/training-cycles/history — 验证闭环记录', async () => {
        const res = await request(app)
            .get('/api/training-cycles/history')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.cycles).toBeInstanceOf(Array);
        expect(res.body.cycles.length).toBeGreaterThanOrEqual(1);
        const closed = res.body.cycles.find(c => c._id === cycleId);
        expect(closed).toBeDefined();
        expect(closed.status).toBe('closed');
        expect(closed.remediation.scoreDelta).toBe(100);
    });

    test('GET /api/reports/training-effect — 验证培训效果报表', async () => {
        const res = await request(app)
            .get('/api/reports/training-effect')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.trends).toBeInstanceOf(Array);
        expect(res.body.cycles).toBeInstanceOf(Array);
    });
});
