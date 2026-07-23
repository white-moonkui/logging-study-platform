/**
 * 测试工具模块
 * - 连接内存数据库
 * - 种子默认用户（admin/student）
 * - 提供登录辅助函数
 */

const path = require('path');
const bcrypt = require('bcryptjs');

// 设置测试环境
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'memory://well_logging_training';
// 加载 .env（但避免覆盖已设置的值）
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const dbAdapter = require('../../utils/dbAdapter');
const app = require('../../server');

const DEFAULT_USERS = [
    { username: 'admin', password: 'admin123', email: 'admin@well-logging.com', role: 'admin' },
    { username: 'student', password: 'student123', email: 'student@well-logging.com', role: 'student' },
];

/** 连接并初始化内存数据库，种子默认用户 */
async function setupDatabase() {
    await dbAdapter.connect();
    const User = require('../../models/User');
    const count = await User.countDocuments();
    if (count === 0) {
        for (const u of DEFAULT_USERS) {
            const hashedPwd = await bcrypt.hash(u.password, 10);
            await User.create({ ...u, password: hashedPwd });
        }
    }
}

/** 断开内存数据库 */
async function teardownDatabase() {
    const { memoryDB } = require('../../utils/memoryDB');
    await memoryDB.reset();
    await dbAdapter.disconnect();
}

/**
 * 以指定用户身份登录，返回 { token, userId, role }
 * @param {import('supertest').SuperTest} request
 * @param {string} username
 * @param {string} password
 */
async function loginAs(request, username, password) {
    const res = await request
        .post('/api/auth/login')
        .send({ username, password });
    if (res.status !== 200) {
        throw new Error(`loginAs(${username}) failed: ${res.status} ${JSON.stringify(res.body)}`);
    }
    return {
        token: res.body.token,
        userId: res.body.user.id,
        role: res.body.user.role,
    };
}

module.exports = {
    app,
    setupDatabase,
    teardownDatabase,
    loginAs,
    DEFAULT_USERS,
};
