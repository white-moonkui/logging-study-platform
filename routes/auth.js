const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 用户注册
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

// 获取用户信息（需要认证）
router.get('/profile', authenticateToken, authController.getProfile);

// 更新用户信息（需要认证）
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
