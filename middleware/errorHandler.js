/**
 * 统一错误处理中间件
 */

/**
 * 捕获异步错误
 * 在控制器中使用: asyncHandler(controllerMethod)
 */
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 处理
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        message: '资源不存在',
        path: req.originalUrl,
    });
};

/**
 * 全局错误处理
 */
const globalErrorHandler = (err, req, res, next) => {
    console.error('错误:', err);

    // Mongoose 验证错误
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            message: '数据验证失败',
            errors,
        });
    }

    // Mongoose 重复键错误
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            message: `${field} 已存在`,
        });
    }

    // Mongoose ObjectId 错误
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'ID 格式不正确',
        });
    }

    // JWT 错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: '无效的 Token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token 已过期',
        });
    }

    // 默认错误响应
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? '服务器内部错误' : err.message;

    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

/**
 * 业务错误类
 */
class BusinessError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'BusinessError';
    }
}

module.exports = {
    asyncHandler,
    notFoundHandler,
    globalErrorHandler,
    BusinessError,
};
