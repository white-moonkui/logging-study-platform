const jwt = require('jsonwebtoken');

// 异步错误处理包装函数
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// 验证JWT令牌中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            message: '访问令牌缺失',
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: '访问令牌无效',
            });
        }

        req.userId = user.userId;
        req.userRole = user.role;
        next();
    });
};

// 可选认证中间件（有 token 解析，没有也不拒绝）
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) { return next(); }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err) { req.userId = user.userId; req.userRole = user.role; }
        next();
    });
};

// 角色权限验证中间件
const requireRole = roles => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                message: '权限不足',
            });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole,
    asyncHandler,
};
