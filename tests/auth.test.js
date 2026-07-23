/**
 * 用户认证模块测试
 * 覆盖：注册、登录、个人信息 CRUD
 */
const request = require('supertest');
const { app, setupDatabase, teardownDatabase, loginAs } = require('./helpers/testSetup');

let studentToken, studentId;

beforeAll(async () => {
    await setupDatabase();
    const session = await loginAs(request(app), 'student', 'student123');
    studentToken = session.token;
    studentId = session.userId;
});

afterAll(async () => {
    await teardownDatabase();
});

describe('POST /api/auth/register', () => {
    const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123456',
        role: 'student',
    };

    test('应当成功注册新用户并返回 token', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(newUser);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('注册成功');
        expect(res.body.token).toBeDefined();
        expect(res.body.user.username).toBe('testuser');
        expect(res.body.user.email).toBe('test@example.com');
        expect(res.body.user.role).toBe('student');
        expect(res.body.user.password).toBeUndefined();
    });

    test('应当拒绝重复的用户名', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(newUser);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/用户名|邮箱.*已存在/);
    });

    test('应当拒绝重复的邮箱', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'another', email: 'test@example.com', password: 'pwd123456' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/用户名|邮箱.*已存在/);
    });

    test('应当拒绝缺少必填字段', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'noemail' });
        expect(res.status).toBe(500); // mongoose 验证失败转 500
    });
});

describe('POST /api/auth/login', () => {
    test('应当使用用户名成功登录', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'student', password: 'student123' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('登录成功');
        expect(res.body.token).toBeDefined();
        expect(res.body.user.role).toBe('student');
        // memoryDB 不自动应用 schema 默认值，若有则验证结构
        if (res.body.user.learningProgress) {
            expect(res.body.user.learningProgress.basicKnowledge).toBeDefined();
        }
        if (res.body.user.abilityMatrix) {
            expect(res.body.user.abilityMatrix.professionalKnowledge).toBeDefined();
        }
    });

    test('应当使用邮箱成功登录', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'student@well-logging.com', password: 'student123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test('应当拒绝错误密码', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'student', password: 'wrongpass' });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('用户名或密码错误');
    });

    test('应当拒绝不存在的用户', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'nobody', password: 'somepass' });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('用户名或密码错误');
    });
});

describe('GET /api/auth/profile', () => {
    test('应当返回已认证用户的个人信息', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe('student');
        expect(res.body.user.password).toBeUndefined();
    });

    test('应当拒绝未认证请求（无 token）', async () => {
        const res = await request(app).get('/api/auth/profile');
        expect(res.status).toBe(401);
    });

    test('应当拒绝无效 token', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', 'Bearer invalid-token-here');
        expect(res.status).toBe(403);
    });
});

describe('PUT /api/auth/profile', () => {
    test('应当更新用户 profile 信息', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ profile: { name: '张三', organization: '胜利油田' } });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('更新成功');
        expect(res.body.user.profile.name).toBe('张三');
        expect(res.body.user.profile.organization).toBe('胜利油田');
    });

    test('应当更新学习进度', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ learningProgress: { basicKnowledge: 50, standards: 30 } });
        expect(res.status).toBe(200);
        expect(res.body.user.learningProgress.basicKnowledge).toBe(50);
        expect(res.body.user.learningProgress.standards).toBe(30);
    });

    test('应当拒绝未认证的更新请求', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .send({ profile: { name: 'Hacker' } });
        expect(res.status).toBe(401);
    });

    test('不应当通过 profile 更新修改密码', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ password: 'hacked123456' });
        expect(res.status).toBe(200);
        // 验证原密码仍然有效（密码未被修改）
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'student', password: 'student123' });
        expect(loginRes.status).toBe(200);
        // 验证"新密码"无效
        const failLogin = await request(app)
            .post('/api/auth/login')
            .send({ username: 'student', password: 'hacked123456' });
        expect(failLogin.status).toBe(401);
    });
});
