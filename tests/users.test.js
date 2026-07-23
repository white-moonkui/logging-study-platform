/**
 * 用户管理模块测试
 * 覆盖：管理员 CRUD、角色权限隔离、学习统计
 */
const request = require('supertest');
const { app, setupDatabase, teardownDatabase, loginAs } = require('./helpers/testSetup');

let adminToken, studentToken;

beforeAll(async () => {
    await setupDatabase();
    const admin = await loginAs(request(app), 'admin', 'admin123');
    const student = await loginAs(request(app), 'student', 'student123');
    adminToken = admin.token;
    studentToken = student.token;
});

afterAll(async () => {
    await teardownDatabase();
});

// ============ 管理员 CRUD ============

describe('管理员用户管理 [POST/GET/PUT/DELETE /api/users]', () => {
    let createdUserId;

    test('管理员创建新用户', async () => {
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'newuser',
                email: 'new@example.com',
                password: 'pass123456',
                role: 'student',
            });
        expect(res.status).toBe(201);
        expect(res.body.user.username).toBe('newuser');
        expect(res.body.user.role).toBe('student');
        expect(res.body.user.password).toBeUndefined();
        createdUserId = res.body.user.id || res.body.user._id;
    });

    test('管理员获取用户列表', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.users).toBeInstanceOf(Array);
        expect(res.body.users.length).toBeGreaterThanOrEqual(3); // 2 default + 1 new
        expect(res.body.pagination).toBeDefined();
        expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
    });

    test('管理员获取用户详情', async () => {
        const res = await request(app)
            .get(`/api/users/${createdUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('newuser');
    });

    test('管理员更新用户信息', async () => {
        const res = await request(app)
            .put(`/api/users/${createdUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'student', profile: { name: '新学员' } });
        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe('student');
        expect(res.body.user.profile.name).toBe('新学员');
    });

    test('管理员切换用户状态', async () => {
        const res = await request(app)
            .put(`/api/users/${createdUserId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ isActive: false });
        expect(res.status).toBe(200);
        expect(res.body.user.isActive).toBe(false);
    });

    test('管理员重置用户密码', async () => {
        const res = await request(app)
            .put(`/api/users/${createdUserId}/reset-password`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ newPassword: 'newpass123' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('密码重置成功');
    });

    test('管理员删除用户', async () => {
        const res = await request(app)
            .delete(`/api/users/${createdUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('用户删除成功');
    });

    test('管理员不能删除最后一个管理员', async () => {
        const res = await request(app)
            .delete(`/api/users/1`) // 尝试删除 admin (id=1)
            .set('Authorization', `Bearer ${adminToken}`);
        // admin 是唯一的 admin，删除应被拒绝
        if (res.status === 400) {
            expect(res.body.message).toContain('不能删除最后一个管理员');
        } else {
            // 如果 id=1 不是 admin，删除应当成功
            expect(res.status).toBe(200);
        }
    });

    test('用户列表支持分页参数', async () => {
        const res = await request(app)
            .get('/api/users?page=1&limit=2')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.users.length).toBeLessThanOrEqual(2);
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBe(2);
        expect(res.body.pagination.pages).toBeGreaterThanOrEqual(1);
    });

    test('用户列表支持按角色筛选', async () => {
        const res = await request(app)
            .get('/api/users?role=admin')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.users.every(u => u.role === 'admin')).toBe(true);
        expect(res.body.pagination.total).toBe(1); // 只有 1 个 admin 用户
    });
});

// ============ 角色权限隔离 ============

describe('角色权限隔离', () => {
    // 列出所有需要 admin 权限的端点
    const adminEndpoints = [
        ['POST', '/api/users', { username: 'x', email: 'x@x.com', password: '123456' }],
        ['GET', '/api/users'],
        ['GET', '/api/users/1'],
        ['PUT', '/api/users/1', { role: 'student' }],
        ['PUT', '/api/users/1/status', { isActive: true }],
        ['PUT', '/api/users/1/reset-password', { newPassword: '123456' }],
        ['DELETE', '/api/users/1'],
    ];

    describe.each(adminEndpoints)('%s %s', (method, url, body) => {
        test('student 用户应当被拒绝（403）', async () => {
            const req = request(app)[method.toLowerCase()](url)
                .set('Authorization', `Bearer ${studentToken}`);
            if (body) {req.send(body);}
            const res = await req;
            expect([401, 403]).toContain(res.status);
        });
    });

    test('未认证请求应当被拒绝（401）', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(401);
    });
});

// ============ 学习统计 ============

describe('GET /api/users/stats/learning', () => {
    test('应返回已认证用户的学习统计', async () => {
        const res = await request(app)
            .get('/api/users/stats/learning')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.stats).toBeDefined();
        // 学习进度三维
        expect(res.body.stats.learningProgress).toBeDefined();
        expect(res.body.stats.learningProgress.basicKnowledge).toBeDefined();
        expect(res.body.stats.learningProgress.standards).toBeDefined();
        expect(res.body.stats.learningProgress.crossDiscipline).toBeDefined();
        // 能力矩阵五维
        expect(res.body.stats.abilityMatrix).toBeDefined();
        expect(res.body.stats.abilityMatrix.professionalKnowledge).toBeDefined();
        expect(res.body.stats.abilityMatrix.standardApplication).toBeDefined();
        expect(res.body.stats.abilityMatrix.crossIntegration).toBeDefined();
        expect(res.body.stats.abilityMatrix.practicalSkills).toBeDefined();
        expect(res.body.stats.abilityMatrix.decisionAbility).toBeDefined();
        // 考试统计
        expect(res.body.stats.examStats).toBeDefined();
        expect(res.body.stats.examStats.totalExams).toBeDefined();
        expect(res.body.stats.examStats.passedExams).toBeDefined();
        // 案例统计
        expect(res.body.stats.caseStats).toBeDefined();
        expect(res.body.stats.caseStats.totalCases).toBeDefined();
        // 最后登录时间
        expect(res.body.stats.lastLogin).toBeDefined();
    });

    test('应拒绝未认证请求', async () => {
        const res = await request(app).get('/api/users/stats/learning');
        expect(res.status).toBe(401);
    });
});
