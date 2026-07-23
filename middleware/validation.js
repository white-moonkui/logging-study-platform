/**
 * 请求验证中间件
 * 提供常用验证函数
 */

const validation = {
    // 必填字段验证
    required(fields, source = 'body') {
        return (req, res, next) => {
            const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
            const missing = [];

            for (const field of fields) {
                if (data[field] === undefined || data[field] === null || data[field] === '') {
                    missing.push(field);
                }
            }

            if (missing.length > 0) {
                return res.status(400).json({
                    message: `缺少必填字段: ${missing.join(', ')}`,
                });
            }

            next();
        };
    },

    // 字段类型验证
    types(schema) {
        return (req, res, next) => {
            const errors = [];

            for (const [field, type] of Object.entries(schema)) {
                const value = req.body[field];
                if (value !== undefined && value !== null) {
                    if (type === 'string' && typeof value !== 'string') {
                        errors.push(`${field} 必须是字符串`);
                    } else if (type === 'number' && isNaN(Number(value))) {
                        errors.push(`${field} 必须是数字`);
                    } else if (type === 'array' && !Array.isArray(value)) {
                        errors.push(`${field} 必须是数组`);
                    } else if (
                        type === 'object' &&
                        (typeof value !== 'object' || Array.isArray(value))
                    ) {
                        errors.push(`${field} 必须是对象`);
                    } else if (type === 'boolean' && typeof value !== 'boolean') {
                        errors.push(`${field} 必须是布尔值`);
                    }
                }
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    message: '字段类型错误',
                    errors,
                });
            }

            next();
        };
    },

    // 字段长度验证
    length(field, min, max) {
        return (req, res, next) => {
            const value = req.body[field];
            if (value !== undefined && value !== null) {
                const len = String(value).length;
                if (len < min) {
                    return res.status(400).json({
                        message: `${field} 长度不能少于 ${min} 个字符`,
                    });
                }
                if (max && len > max) {
                    return res.status(400).json({
                        message: `${field} 长度不能超过 ${max} 个字符`,
                    });
                }
            }
            next();
        };
    },

    // 枚举值验证
    enum(field, allowedValues) {
        return (req, res, next) => {
            const value = req.body[field];
            if (value !== undefined && value !== null && !allowedValues.includes(value)) {
                return res.status(400).json({
                    message: `${field} 必须是以下值之一: ${allowedValues.join(', ')}`,
                });
            }
            next();
        };
    },

    // 邮箱格式验证
    email(field = 'email') {
        return (req, res, next) => {
            const value = req.body[field];
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return res.status(400).json({
                    message: '邮箱格式不正确',
                });
            }
            next();
        };
    },

    // 分页参数验证
    pagination() {
        return (req, res, next) => {
            const { page, limit } = req.query;

            if (page && (isNaN(page) || parseInt(page) < 1)) {
                return res.status(400).json({
                    message: 'page 必须是大于0的数字',
                });
            }

            if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
                return res.status(400).json({
                    message: 'limit 必须是 1-100 之间的数字',
                });
            }

            next();
        };
    },

    // MongoDB ObjectId 验证
    objectId(field) {
        return (req, res, next) => {
            const value = req.params[field] || req.body[field];
            if (value && !/^[0-9a-fA-F]{24}$/.test(value)) {
                return res.status(400).json({
                    message: `${field} 格式不正确`,
                });
            }
            next();
        };
    },

    // 日期格式验证
    date(field) {
        return (req, res, next) => {
            const value = req.body[field];
            if (value && isNaN(Date.parse(value))) {
                return res.status(400).json({
                    message: `${field} 日期格式不正确`,
                });
            }
            next();
        };
    },
};

module.exports = validation;
