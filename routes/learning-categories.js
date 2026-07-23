/**
 * 动态页面管理系统 - 分类管理路由
 * 支持四级页面层级架构的分类管理
 */
const express = require('express');
const router = express.Router();
const LearningCategory = require('../models/LearningCategory');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * 获取分类树
 * GET /api/learning-categories/tree
 */
router.get('/tree', async (req, res) => {
    try {
        const { module } = req.query;
        const filter = module ? { module } : {};

        const categories = await LearningCategory.find(filter)
            .populate('createdBy', 'username')
            .sort({ level: 1, order: 1 });

        // 构建树形结构
        const tree = buildTree(categories);

        res.json({ data: tree });
    } catch (error) {
        res.status(500).json({ message: '获取分类树失败', error: error.message });
    }
});

/**
 * 获取分类列表（扁平结构）
 * GET /api/learning-categories
 */
router.get('/', async (req, res) => {
    try {
        const { module, level, parentId, status } = req.query;

        const filter = {};
        if (module) {filter.module = module;}
        if (level) {filter.level = parseInt(level);}
        if (parentId) {filter.parentId = parentId || null;}
        if (status) {filter.status = status;}

        const categories = await LearningCategory.find(filter)
            .populate('createdBy', 'username')
            .sort({ level: 1, order: 1 });

        res.json({ data: categories });
    } catch (error) {
        res.status(500).json({ message: '获取分类列表失败', error: error.message });
    }
});

/**
 * 获取单个分类详情
 * GET /api/learning-categories/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const category = await LearningCategory.findById(req.params.id).populate(
            'createdBy',
            'username'
        );

        if (!category) {
            return res.status(404).json({ message: '分类不存在' });
        }

        res.json({ data: category });
    } catch (error) {
        res.status(500).json({ message: '获取分类详情失败', error: error.message });
    }
});

/**
 * 创建分类
 * POST /api/learning-categories
 */
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, parentId, level, order, icon, description, module } = req.body;

        // 验证层级
        if (level < 1 || level > 4) {
            return res.status(400).json({ message: '层级必须是1-4' });
        }

        // 如果有父分类，验证父分类存在且层级正确
        if (parentId) {
            const parent = await LearningCategory.findById(parentId);
            if (!parent) {
                return res.status(400).json({ message: '父分类不存在' });
            }
            if (parent.level !== level - 1) {
                return res.status(400).json({ message: `父分类层级必须是${level - 1}` });
            }
        } else if (level !== 1) {
            return res.status(400).json({ message: '一级分类不需要父分类' });
        }

        const category = new LearningCategory({
            name,
            parentId: parentId || null,
            level,
            order: order || 0,
            icon: icon || 'fas fa-folder',
            description,
            module,
            createdBy: req.user.id,
        });

        await category.save();

        res.status(201).json({
            message: '分类创建成功',
            data: category,
        });
    } catch (error) {
        res.status(500).json({ message: '创建分类失败', error: error.message });
    }
});

/**
 * 更新分类
 * PUT /api/learning-categories/:id
 */
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, order, icon, description, status } = req.body;

        const category = await LearningCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: '分类不存在' });
        }

        if (name) {category.name = name;}
        if (order !== undefined) {category.order = order;}
        if (icon) {category.icon = icon;}
        if (description !== undefined) {category.description = description;}
        if (status) {category.status = status;}

        await category.save();

        res.json({
            message: '分类更新成功',
            data: category,
        });
    } catch (error) {
        res.status(500).json({ message: '更新分类失败', error: error.message });
    }
});

/**
 * 删除分类
 * DELETE /api/learning-categories/:id
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const categoryId = req.params.id;

        // 检查是否有子分类
        const childrenCount = await LearningCategory.countDocuments({ parentId: categoryId });
        if (childrenCount > 0) {
            return res.status(400).json({ message: '该分类下有子分类，无法删除' });
        }

        // 检查是否有关联页面
        const LearningPage = require('../models/LearningPage');
        const pageCount = await LearningPage.countDocuments({ categoryId });
        if (pageCount > 0) {
            return res.status(400).json({ message: '该分类下有页面，无法删除' });
        }

        await LearningCategory.findByIdAndDelete(categoryId);

        res.json({ message: '分类删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除分类失败', error: error.message });
    }
});

/**
 * 获取分类的路径（从根到当前）
 * GET /api/learning-categories/:id/path
 */
router.get('/:id/path', async (req, res) => {
    try {
        const category = await LearningCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: '分类不存在' });
        }

        // 递归获取路径
        const path = await getCategoryPath(category);

        res.json({ data: path.reverse() });
    } catch (error) {
        res.status(500).json({ message: '获取分类路径失败', error: error.message });
    }
});

/**
 * 辅助函数：构建树形结构
 */
function buildTree(categories, parentId = null) {
    const tree = [];

    for (const category of categories) {
        const categoryParentId = category.parentId ? category.parentId.toString() : null;
        const currentParentId = parentId ? parentId.toString() : null;

        if (categoryParentId === currentParentId) {
            const children = buildTree(categories, category._id);
            const node = {
                _id: category._id,
                name: category.name,
                level: category.level,
                order: category.order,
                icon: category.icon,
                description: category.description,
                module: category.module,
                status: category.status,
                createdAt: category.createdAt,
                children: children.length > 0 ? children : undefined,
            };
            tree.push(node);
        }
    }

    return tree.sort((a, b) => a.order - b.order);
}

/**
 * 辅助函数：获取分类路径
 */
async function getCategoryPath(category) {
    const path = [category];

    let current = category;
    while (current.parentId) {
        current = await LearningCategory.findById(current.parentId);
        if (current) {
            path.push(current);
        } else {
            break;
        }
    }

    return path;
}

module.exports = router;
