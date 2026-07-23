const express = require('express');
const logger = require('./utils/logger');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

// 注：.env 由调用者（start.js）加载，server.js 不再重复加载
// 数据库连接、数据初始化由 start.js 的 ApplicationStarter 编排完成

const app = express();
// HTTP request logging wired to Winston via Morgan
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保 HTML 响应使用 UTF-8 编码（防止中文 Windows 默认 GBK 解码导致乱码）
app.use((req, res, next) => {
    const _sendFile = res.sendFile.bind(res);
    res.sendFile = function (filePath, options, callback) {
        res.set('Content-Type', 'text/html; charset=utf-8');
        return _sendFile(filePath, options, callback);
    };
    next();
});

app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
            res.set('Content-Type', 'text/html; charset=utf-8');
        }
    },
}));

// 路由导入
const authRoutes = require('./routes/auth');
const knowledgeRoutes = require('./routes/knowledge');
const caseRoutes = require('./routes/cases');
const examRoutes = require('./routes/exams');
const userRoutes = require('./routes/users');
const aiAnalysisRoutes = require('./routes/ai-analysis');
const categoryRoutes = require('./routes/categoryRoutes');
const knowledgeManagementRoutes = require('./routes/knowledge-management');

// 新增路由导入
const aiRecommendationsRoutes = require('./routes/ai-recommendations');
const documentsRoutes = require('./routes/documents');
const knowledgeReviewRoutes = require('./routes/knowledge-review');
const knowledgeInteractionRoutes = require('./routes/knowledge-interaction');
const reportsRoutes = require('./routes/reports');
const filesRoutes = require('./routes/files');
const progressRoutes = require('./routes/progress');
const learningProgressRoutes = require('./routes/learning-progress');

// 动态页面管理路由
const learningCategoriesRoutes = require('./routes/learning-categories');
const learningPagesRoutes = require('./routes/learning-pages');
const technicalSupportRoutes = require('./routes/technical-support');
const aiRecommendRoutes = require('./routes/ai-recommend');
const trainingCycleRoutes = require('./routes/training-cycles');

// 路由使用
app.use('/api/auth', authRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.use('/api/knowledge-management', knowledgeManagementRoutes);
app.use('/api/categories', categoryRoutes);

// 新增路由注册
app.use('/api/ai-recommendations', aiRecommendationsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/knowledge-review', knowledgeReviewRoutes);
app.use('/api/knowledge-interaction', knowledgeInteractionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/learning-progress', learningProgressRoutes);
app.use('/api/technical-support', technicalSupportRoutes);
app.use('/api/ai-recommend', aiRecommendRoutes);
app.use('/api/training-cycles', trainingCycleRoutes);

// 动态页面管理
app.use('/api/learning-categories', learningCategoriesRoutes);
app.use('/api/learning-pages', learningPagesRoutes);

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'prototype_v6_user_mgmt.html'));
});

// 知识库管理页面路由
app.get('/knowledge-management', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'knowledge-management.html'));
});

// 知识库页面管理页面路由
app.get('/learning-pages', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'learning-page-management.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ message: '服务器内部错误' });
});

// 只在直接运行此文件时启动服务器
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`测井培训系统服务器运行在端口 ${PORT}`);
    });
}

module.exports = app;
