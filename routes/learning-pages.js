/**
 * 动态页面管理系统 - 页面管理路由
 * 对应四级层级中的内容页面
 */
const express = require('express');
const router = express.Router();
const LearningPage = require('../models/LearningPage');
const LearningCategory = require('../models/LearningCategory');
const File = require('../models/File');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 支持的资料类型
const MATERIAL_TYPES = ['video', 'pdf', 'ppt', 'other'];

/**
 * 获取页面列表
 * GET /api/learning-pages
 */
router.get('/', async (req, res) => {
    try {
        const {
            categoryId,
            pageType,
            status,
            difficulty,
            isRequired,
            keyword,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        if (categoryId) {filter.categoryId = categoryId;}
        if (pageType) {filter.pageType = pageType;}
        if (status) {filter.status = status;}
        if (difficulty) {filter.difficulty = difficulty;}
        if (isRequired !== undefined) {filter.isRequired = isRequired === 'true';}
        if (keyword) {
            filter.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { keywords: { $in: [new RegExp(keyword, 'i')] } },
            ];
        }

        // 默认只显示已发布的页面
        if (!status && !req.user) {
            filter.status = 'published';
        }

        const total = await LearningPage.countDocuments(filter);
        const pages = await LearningPage.find(filter)
            .populate('categoryId', 'name level module')
            .populate('createdBy', 'username')
            .sort({ order: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            data: pages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: '获取页面列表失败', error: error.message });
    }
});

/**
 * 获取单个页面详情
 * GET /api/learning-pages/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const page = await LearningPage.findById(req.params.id)
            .populate('categoryId')
            .populate('createdBy', 'username')
            .populate('files');

        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        // 增加浏览次数
        page.viewCount += 1;
        await page.save();

        res.json({ data: page });
    } catch (error) {
        res.status(500).json({ message: '获取页面详情失败', error: error.message });
    }
});

/**
 * 根据slug获取页面
 * GET /api/learning-pages/slug/:slug
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        const page = await LearningPage.findOne({ slug: req.params.slug })
            .populate('categoryId')
            .populate('files');

        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        res.json({ data: page });
    } catch (error) {
        res.status(500).json({ message: '获取页面失败', error: error.message });
    }
});

/**
 * 创建页面
 * POST /api/learning-pages
 */
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const {
            title,
            slug,
            categoryId,
            pageType,
            summary,
            content,
            fileIds,
            coverImage,
            tags,
            keywords,
            author,
            duration,
            difficulty,
            isRequired,
            order,
            status,
        } = req.body;

        // 验证分类存在
        const category = await LearningCategory.findById(categoryId);
        if (!category) {
            return res.status(400).json({ message: '分类不存在' });
        }

        // 验证页面类型
        const validTypes = ['video', 'pdf', 'ppt', 'document', 'text', 'quiz'];
        if (!validTypes.includes(pageType)) {
            return res.status(400).json({ message: '无效的页面类型' });
        }

        // 检查slug唯一性
        if (slug) {
            const existing = await LearningPage.findOne({ slug });
            if (existing) {
                return res.status(400).json({ message: '页面别名已存在' });
            }
        }

        const page = new LearningPage({
            title,
            slug,
            categoryId,
            pageType,
            summary,
            content,
            fileIds: fileIds || [],
            coverImage,
            tags: tags || [],
            keywords: keywords || [],
            author,
            duration: duration || 0,
            difficulty: difficulty || 'beginner',
            isRequired: isRequired || false,
            order: order || 0,
            status: status || 'draft',
            createdBy: req.user.id,
        });

        await page.save();

        res.status(201).json({
            message: '页面创建成功',
            data: page,
        });
    } catch (error) {
        res.status(500).json({ message: '创建页面失败', error: error.message });
    }
});

/**
 * 更新页面
 * PUT /api/learning-pages/:id
 */
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const page = await LearningPage.findById(req.params.id);

        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        const allowedFields = [
            'title',
            'slug',
            'categoryId',
            'pageType',
            'summary',
            'content',
            'fileIds',
            'coverImage',
            'tags',
            'keywords',
            'author',
            'duration',
            'difficulty',
            'isRequired',
            'order',
            'status',
            'learningMaterials',
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                page[field] = req.body[field];
            }
        });

        await page.save();

        res.json({
            message: '页面更新成功',
            data: page,
        });
    } catch (error) {
        res.status(500).json({ message: '更新页面失败', error: error.message });
    }
});

/**
 * 删除页面
 * DELETE /api/learning-pages/:id
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const page = await LearningPage.findById(req.params.id);

        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        await LearningPage.findByIdAndDelete(req.params.id);

        res.json({ message: '页面删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除页面失败', error: error.message });
    }
});

/**
 * 审核页面
 * POST /api/learning-pages/:id/approve
 */
router.post(
    '/:id/approve',
    authenticateToken,
    requireRole(['admin']),
    async (req, res) => {
        try {
            const { approved, note } = req.body;

            const page = await LearningPage.findById(req.params.id);

            if (!page) {
                return res.status(404).json({ message: '页面不存在' });
            }

            page.approvalStatus = approved ? 'approved' : 'rejected';
            page.approvalNote = note || '';

            await page.save();

            res.json({
                message: approved ? '页面审核通过' : '页面审核拒绝',
                data: page,
            });
        } catch (error) {
            res.status(500).json({ message: '审核页面失败', error: error.message });
        }
    }
);

/**
 * 发布/下线页面
 * POST /api/learning-pages/:id/publish
 */
router.post(
    '/:id/publish',
    authenticateToken,
    requireRole(['admin']),
    async (req, res) => {
        try {
            const { published } = req.body;

            const page = await LearningPage.findById(req.params.id);

            if (!page) {
                return res.status(404).json({ message: '页面不存在' });
            }

            // 检查是否已审核通过
            if (published && page.approvalStatus !== 'approved') {
                return res.status(400).json({ message: '页面未通过审核，无法发布' });
            }

            page.status = published ? 'published' : 'draft';

            await page.save();

            res.json({
                message: published ? '页面发布成功' : '页面已下线',
                data: page,
            });
        } catch (error) {
            res.status(500).json({ message: '发布页面失败', error: error.message });
        }
    }
);

/**
 * 获取页面的完整路径信息
 * GET /api/learning-pages/:id/breadcrumb
 */
router.get('/:id/breadcrumb', async (req, res) => {
    try {
        const page = await LearningPage.findById(req.params.id).populate('categoryId');

        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        // 获取分类路径
        const categoryPath = await getCategoryBreadcrumb(page.categoryId._id);

        res.json({
            data: {
                page: {
                    _id: page._id,
                    title: page.title,
                    slug: page.slug,
                    pageType: page.pageType,
                },
                breadcrumb: [...categoryPath, { _id: page._id, name: page.title, type: 'page' }],
            },
        });
    } catch (error) {
        res.status(500).json({ message: '获取面包屑失败', error: error.message });
    }
});

/**
 * 辅助函数：获取分类面包屑
 */
async function getCategoryBreadcrumb(categoryId) {
    const path = [];
    let current = await LearningCategory.findById(categoryId);

    while (current) {
        path.unshift({
            _id: current._id,
            name: current.name,
            type: 'category',
            level: current.level,
        });
        current = current.parentId ? await LearningCategory.findById(current.parentId) : null;
    }

    return path;
}

/**
 * 获取页面的学习资料列表
 * GET /api/learning-pages/:id/materials
 */
router.get('/:id/materials', async (req, res) => {
    try {
        const page = await LearningPage.findById(req.params.id);

        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        // 获取每种类型的资料，并填充文件信息
        const materials = {};
        
        for (const type of MATERIAL_TYPES) {
            const items = page.learningMaterials?.[type] || [];
            const populatedItems = [];
            
            for (const item of items) {
                const file = await File.findById(item.fileId);
                populatedItems.push({
                    _id: item._id,
                    fileId: item.fileId,
                    title: item.title,
                    description: item.description,
                    order: item.order,
                    file: file ? {
                        _id: file._id,
                        originalName: file.originalName,
                        mimeType: file.mimeType,
                        size: file.size,
                        extension: file.extension
                    } : null
                });
            }
            
            // 按 order 排序
            populatedItems.sort((a, b) => a.order - b.order);
            materials[type] = populatedItems;
        }

        res.json({ data: materials });
    } catch (error) {
        res.status(500).json({ message: '获取学习资料失败', error: error.message });
    }
});

/**
 * 添加学习资料
 * POST /api/learning-pages/:id/materials
 */
router.post('/:id/materials', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { materialType, fileId, title, description, order } = req.body;

        // 验证页面存在
        const page = await LearningPage.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        // 验证资料类型
        if (!MATERIAL_TYPES.includes(materialType)) {
            return res.status(400).json({ message: '无效的资料类型' });
        }

        // 验证文件存在
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(400).json({ message: '文件不存在' });
        }

        // 验证文件类型匹配
        const fileTypeMap = {
            'video': ['video'],
            'pdf': ['pdf'],
            'ppt': ['ppt', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
            'other': ['word', 'excel', 'image', 'other']
        };
        
        const fileType = file.type;
        const allowedTypes = fileTypeMap[materialType];
        if (!allowedTypes.includes(fileType)) {
            return res.status(400).json({ 
                message: `文件类型不匹配：${materialType} 类型不能接受 ${fileType} 类型文件` 
            });
        }

        // 初始化 learningMaterials
        if (!page.learningMaterials) {
            page.learningMaterials = { video: [], pdf: [], ppt: [], other: [] };
        }
        if (!page.learningMaterials[materialType]) {
            page.learningMaterials[materialType] = [];
        }

        // 添加资料
        const newMaterial = {
            fileId,
            title: title || file.originalName,  // 默认使用文件名
            description: description || '',
            order: order || page.learningMaterials[materialType].length + 1
        };

        page.learningMaterials[materialType].push(newMaterial);

        // 同时添加到 fileIds（保持兼容）
        if (!page.fileIds.includes(fileId)) {
            page.fileIds.push(fileId);
        }

        await page.save();

        res.status(201).json({
            message: '学习资料添加成功',
            data: newMaterial
        });
    } catch (error) {
        res.status(500).json({ message: '添加学习资料失败', error: error.message });
    }
});

/**
 * 更新学习资料
 * PUT /api/learning-pages/:id/materials/:materialId
 */
router.put('/:id/materials/:materialId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { title, description, order, materialType } = req.body;

        const page = await LearningPage.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        // 查找资料
        let found = false;
        for (const type of MATERIAL_TYPES) {
            const materials = page.learningMaterials?.[type] || [];
            const index = materials.findIndex(m => m._id.toString() === req.params.materialId);
            
            if (index !== -1) {
                // 可以更新 title, description, order
                if (title !== undefined) {materials[index].title = title;}
                if (description !== undefined) {materials[index].description = description;}
                if (order !== undefined) {materials[index].order = order;}
                
                found = true;
                break;
            }
        }

        if (!found) {
            return res.status(404).json({ message: '学习资料不存在' });
        }

        await page.save();

        res.json({
            message: '学习资料更新成功',
            data: page.learningMaterials
        });
    } catch (error) {
        res.status(500).json({ message: '更新学习资料失败', error: error.message });
    }
});

/**
 * 删除学习资料
 * DELETE /api/learning-pages/:id/materials/:materialId
 */
router.delete('/:id/materials/:materialId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const page = await LearningPage.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        // 查找并删除资料
        let found = false;
        for (const type of MATERIAL_TYPES) {
            const materials = page.learningMaterials?.[type] || [];
            const index = materials.findIndex(m => m._id.toString() === req.params.materialId);
            
            if (index !== -1) {
                const removedFileId = materials[index].fileId;
                materials.splice(index, 1);
                
                // 从 fileIds 中也移除
                const fileIdIndex = page.fileIds.findIndex(f => f.toString() === removedFileId.toString());
                if (fileIdIndex !== -1) {
                    page.fileIds.splice(fileIdIndex, 1);
                }
                
                found = true;
                break;
            }
        }

        if (!found) {
            return res.status(404).json({ message: '学习资料不存在' });
        }

        await page.save();

        res.json({ message: '学习资料删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除学习资料失败', error: error.message });
    }
});

/**
 * 批量更新学习资料顺序
 * PUT /api/learning-pages/:id/materials/reorder
 */
router.put('/:id/materials/reorder', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { materialType, orders } = req.body; // orders: [{ materialId, order }]

        const page = await LearningPage.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: '页面不存在' });
        }

        if (!MATERIAL_TYPES.includes(materialType)) {
            return res.status(400).json({ message: '无效的资料类型' });
        }

        const materials = page.learningMaterials?.[materialType] || [];
        
        for (const { materialId, order } of orders) {
            const item = materials.find(m => m._id.toString() === materialId);
            if (item) {
                item.order = order;
            }
        }

        await page.save();

        res.json({
            message: '顺序更新成功',
            data: page.learningMaterials[materialType]
        });
    } catch (error) {
        res.status(500).json({ message: '更新顺序失败', error: error.message });
    }
});

module.exports = router;
