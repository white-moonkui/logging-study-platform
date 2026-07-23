const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 创建用户（管理员权限）
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { username, password, email, role, profile, isActive } = req.body;

        // 检查用户名是否存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                message: '用户名已存在',
            });
        }

        // 检查邮箱是否存在
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                message: '邮箱已被使用',
            });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword,
            email,
            role: role || 'student',
            profile: profile || {},
            isActive: isActive !== false,
        });

        await user.save();

        // 返回时不包含密码
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: '用户创建成功',
            user: userResponse,
        });
    } catch (error) {
        res.status(500).json({
            message: '创建用户失败',
            error: error.message,
        });
    }
});

// 获取用户列表（管理员权限）
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, role, isActive } = req.query;

        const filter = {};
        if (role) {filter.role = role;}
        if (isActive !== undefined) {filter.isActive = isActive === 'true';}

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            message: '获取用户列表失败',
            error: error.message,
        });
    }
});

// 获取用户详情（管理员权限）
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                message: '用户不存在',
            });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({
            message: '获取用户详情失败',
            error: error.message,
        });
    }
});

// 更新用户状态（管理员权限）
router.put('/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: '用户不存在',
            });
        }

        user.isActive = isActive;
        await user.save();

        res.json({
            message: '用户状态更新成功',
            user,
        });
    } catch (error) {
        res.status(500).json({
            message: '更新用户状态失败',
            error: error.message,
        });
    }
});

// 更新用户信息（管理员权限）
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { username, email, role, profile, isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: '用户不存在',
            });
        }

        // 检查用户名是否与其他用户重复
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    message: '用户名已存在',
                });
            }
            user.username = username;
        }

        // 检查邮箱是否与其他用户重复
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({
                    message: '邮箱已被使用',
                });
            }
            user.email = email;
        }

        if (role) {user.role = role;}
        if (profile) {
            const currentProfile = user.profile && typeof user.profile.toObject === 'function'
                ? user.profile.toObject()
                : (user.profile || {});
            user.profile = { ...currentProfile, ...profile };
        }
        if (isActive !== undefined) {user.isActive = isActive;}

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            message: '用户信息更新成功',
            user: userResponse,
        });
    } catch (error) {
        res.status(500).json({
            message: '更新用户信息失败',
            error: error.message,
        });
    }
});

// 重置用户密码（管理员权限）
router.put('/:id/reset-password', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                message: '密码长度至少6位',
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: '用户不存在',
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            message: '密码重置成功',
        });
    } catch (error) {
        res.status(500).json({
            message: '重置密码失败',
            error: error.message,
        });
    }
});

// 删除用户（管理员权限）
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: '用户不存在',
            });
        }

        // 不允许删除最后一个管理员
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    message: '不能删除最后一个管理员',
                });
            }
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            message: '用户删除成功',
        });
    } catch (error) {
        res.status(500).json({
            message: '删除用户失败',
            error: error.message,
        });
    }
});

// 获取用户学习统计
router.get('/stats/learning', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: '用户不存在',
            });
        }

        // 获取考试结果统计
        const { ExamResult } = require('../models/Exam');
        const examStats = await ExamResult.aggregate([
            { $match: { user: user._id } },
            {
                $group: {
                    _id: null,
                    totalExams: { $sum: 1 },
                    passedExams: { $sum: { $cond: ['$passed', 1, 0] } },
                    averageScore: { $avg: '$score' },
                    totalTimeSpent: { $sum: '$timeSpent' },
                },
            },
        ]);

        // 获取案例学习统计
        const Case = require('../models/Case');
        const caseStats = await Case.aggregate([
            { $match: { 'userInteractions.user': user._id } },
            {
                $group: {
                    _id: null,
                    totalCases: { $sum: 1 },
                    completedCases: {
                        $sum: {
                            $cond: [{ $gte: ['$userInteractions.progress', 100] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        const stats = {
            learningProgress: user.learningProgress,
            abilityMatrix: user.abilityMatrix,
            examStats: examStats[0] || {
                totalExams: 0,
                passedExams: 0,
                averageScore: 0,
                totalTimeSpent: 0,
            },
            caseStats: caseStats[0] || {
                totalCases: 0,
                completedCases: 0,
            },
            lastLogin: user.lastLogin,
        };

        res.json({ stats });
    } catch (error) {
        res.status(500).json({
            message: '获取学习统计失败',
            error: error.message,
        });
    }
});

module.exports = router;
