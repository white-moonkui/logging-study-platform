const Category = require('../models/Category');
const Knowledge = require('../models/Knowledge');
const KnowledgeFile = require('../models/KnowledgeFile');
const { asyncHandler, requireRole } = require('../middleware/auth');
const mongoose = require('mongoose');

class KnowledgeController {
    // 获取知识点详情（包含所有文件）
    getDetails = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const knowledge = await Knowledge.findById(id)
            .populate('categoryId', 'name code icon')
            .lean();

        if (!knowledge) {
            return res.status(404).json({ message: '知识点不存在' });
        }

        // 加载所有文件（按 sort_order 排序）
        const files = await KnowledgeFile.find({ knowledgeId: id })
            .sort({ sortOrder: 1, uploadedAt: 1 })
            .lean();

        // 按类型分组
        const filesByType = {
            video: files.filter(f => f.fileType === 'video'),
            document: files.filter(f => f.fileType === 'document'),
            presentation: files.filter(f => f.fileType === 'presentation'),
            image: files.filter(f => f.fileType === 'image'),
            other: files.filter(f => f.fileType === 'other'),
        };

        res.json({
            success: true,
            data: {
                ...knowledge,
                files: filesByType,
                fileCount: files.length,
                videoCount: filesByType.video.length,
                documentCount: filesByType.document.length,
                presentationCount: filesByType.presentation.length,
                imageCount: filesByType.image.length,
            },
        });
    });

    // 创建知识点（管理员和教师）
    create = asyncHandler(async (req, res) => {
        const { title, categoryId, description, keywords, sortOrder, status } = req.body;

        if (!title || !categoryId) {
            return res.status(400).json({ message: '标题和分类ID不能为空' });
        }

        const knowledge = await Knowledge.create({
            title,
            categoryId,
            description,
            keywords: keywords || [],
            level: 1,
            sortOrder: sortOrder ?? 0,
            status: status || 'draft',
            createdBy: req.user?.id,
        });

        res.json({ message: '创建成功', data: knowledge });
    });

    // 更新知识点（管理员和教师）
    update = asyncHandler(async (req, res) => {
        const { title, description, keywords, sortOrder, status, videoCover, videoDuration } =
            req.body;
        const { id } = req.params;

        const knowledge = await Knowledge.findByIdAndUpdate(
            id,
            {
                title,
                description,
                keywords,
                sortOrder,
                status,
                videoCover,
                videoDuration,
            },
            { new: true }
        );

        if (!knowledge) {
            return res.status(404).json({ message: '知识点不存在' });
        }

        res.json({ message: '更新成功', data: knowledge });
    });

    // 删除知识点（管理员和教师）
    delete = asyncHandler(async (req, res) => {
        const { id } = req.params;

        await Knowledge.findByIdAndDelete(id);
        res.json({ message: '删除成功' });
    });

    // ======== 以下为路由/控制器桥梁方法（补充缺失的接口） ========

    // 获取知识列表（路由: GET /api/knowledge）
    getKnowledgeList = asyncHandler(async (req, res) => {
        const { categoryId, page = 1, limit = 50 } = req.query;
        const filter = { status: 'published' };
        if (categoryId) {filter.categoryId = categoryId;}

        const items = await Knowledge.find(filter)
            .sort({ sortOrder: 1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await Knowledge.countDocuments(filter);

        res.json({ success: true, data: { items, total, page: parseInt(page), limit: parseInt(limit) } });
    });

    // 获取知识详情（路由: GET /api/knowledge/:id）
    getKnowledgeDetail = asyncHandler(async (req, res) => {
        return this.getDetails(req, res);
    });

    // 搜索知识内容（路由: GET /api/knowledge/search）
    searchKnowledge = asyncHandler(async (req, res) => {
        const { keyword, categoryId } = req.query;

        if (!keyword) {
            return res.status(400).json({ message: '搜索关键词不能为空' });
        }

        const allItems = await Knowledge.find({ status: 'published' });
        const keywordLower = keyword.toLowerCase();

        const filtered = allItems.filter(item => {
            const title = (item.title || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const keywords = (item.keywords || []).join(' ').toLowerCase();
            const matchCategory = categoryId ? item.categoryId === categoryId : true;
            return matchCategory && (title.includes(keywordLower) || desc.includes(keywordLower) || keywords.includes(keywordLower));
        });

        res.json({ success: true, data: filtered, total: filtered.length });
    });

    // 获取推荐知识（路由: GET /api/knowledge/recommended）
    getRecommendedKnowledge = asyncHandler(async (req, res) => {
        const items = await Knowledge.find({ status: 'published' })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({ success: true, data: items });
    });

    // 创建/更新/删除 别名（适配路由名称）
    createKnowledge = asyncHandler(async (req, res) => { return this.create(req, res); });
    updateKnowledge = asyncHandler(async (req, res) => { return this.update(req, res); });
    deleteKnowledge = asyncHandler(async (req, res) => { return this.delete(req, res); });

    // 智能出题（路由: POST /api/knowledge/:id/generate-quiz）
    generateQuiz = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const knowledge = await Knowledge.findById(id);
        if (!knowledge) {return res.status(404).json({ message: '知识点不存在' });}

        res.json({
            success: true,
            data: {
                questions: [
                    { type: 'single_choice', question: `关于"${knowledge.title}"，以下哪项描述正确？`, options: ['A', 'B', 'C', 'D'], answer: 'A' },
                    { type: 'true_false', question: `${knowledge.title}是测井专业标准之一`, answer: true },
                ],
            },
        });
    });
}

module.exports = new KnowledgeController();
