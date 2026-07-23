const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
    // 用户注册
    async register(req, res) {
        try {
            const { username, email, password, role = 'student', profile } = req.body;

            // 检查用户是否已存在
            const existingUser = await User.findOne({
                $or: [{ email }, { username }],
            });

            if (existingUser) {
                return res.status(400).json({
                    message: '用户名或邮箱已存在',
                });
            }

            // 加密密码
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 创建新用户
            const user = new User({
                username,
                email,
                password: hashedPassword,
                role,
                profile,
            });

            await user.save();

            // 生成JWT令牌
            const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: '24h',
            });

            res.status(201).json({
                message: '注册成功',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '注册失败',
                error: error.message,
            });
        }
    }

    // 用户登录
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // 查找用户
            const user = await User.findOne({
                $or: [{ username }, { email: username }],
            });

            if (!user) {
                return res.status(401).json({
                    message: '用户名或密码错误',
                });
            }

            // 验证密码
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    message: '用户名或密码错误',
                });
            }

            // 更新最后登录时间
            user.lastLogin = new Date();
            await user.save();

            // 生成JWT令牌
            const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: '24h',
            });

            res.json({
                message: '登录成功',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                    learningProgress: user.learningProgress,
                    abilityMatrix: user.abilityMatrix,
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '登录失败',
                error: error.message,
            });
        }
    }

    // 获取用户信息
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.userId);
            const userData = user ? user._model || user : null;

            if (!userData) {
                return res.status(404).json({
                    message: '用户不存在',
                });
            }

            // 排除密码字段
            const { password, ...userWithoutPassword } = userData;

            res.json({
                user: userWithoutPassword,
            });
        } catch (error) {
            res.status(500).json({
                message: '获取用户信息失败',
                error: error.message,
            });
        }
    }

    // 更新用户信息
    async updateProfile(req, res) {
        try {
            const { profile, learningProgress } = req.body;

            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    message: '用户不存在',
                });
            }

            if (profile) {
                user.profile = { ...user.profile, ...profile };
            }

            if (learningProgress) {
                user.learningProgress = { ...user.learningProgress, ...learningProgress };
            }

            await user.save();

            res.json({
                message: '更新成功',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                    learningProgress: user.learningProgress,
                    abilityMatrix: user.abilityMatrix,
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '更新失败',
                error: error.message,
            });
        }
    }
}

module.exports = new AuthController();
