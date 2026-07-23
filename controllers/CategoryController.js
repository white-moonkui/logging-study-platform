const Category = require('../models/Category');
const Knowledge = require('../models/Knowledge');
const { asyncHandler } = require('../middleware/auth');

class CategoryController {
    // 获取分类树（递归）
    getTree = asyncHandler(async (req, res) => {
        const categories = await Category.find({}).sort({ sortOrder: 1 });

        const buildTree = (parentId = null) => {
            return categories
                .filter(c => String(c.parentId) === String(parentId))
                .map(c => ({
                    ...c.toObject(),
                    children: buildTree(c._id),
                }));
        };

        res.json({ success: true, data: buildTree() });
    });

    // 获取所有分类（扁平）
    getAll = asyncHandler(async (req, res) => {
        const categories = await Category.find({}).sort({ sortOrder: 1 });
        res.json({ success: true, data: categories });
    });

    // 获取分类统计（包含知识点数量）
    getStats = asyncHandler(async (req, res) => {
        const categories = await Category.find({}).sort({ sortOrder: 1 });

        // 为每个分类添加知识点统计
        const stats = await Promise.all(
            categories.map(async category => {
                const itemCount = await Knowledge.countDocuments({ categoryId: category._id });
                return {
                    ...category.toObject(),
                    itemCount,
                };
            })
        );

        res.json({ success: true, data: stats });
    });

    // 创建分类（管理员和教师）
    create = asyncHandler(async (req, res) => {
        const { name, code, parentId, sortOrder, icon } = req.body;

        // 验证必填字段
        if (!name || !code) {
            return res.status(400).json({ message: '分类名称和代码不能为空' });
        }

        // 验证父分类
        let level = 1;
        if (parentId) {
            const parent = await Category.findById(parentId);
            if (!parent) {
                return res.status(404).json({ message: '父分类不存在' });
            }
            level = parent.level + 1;
        }

        // 创建分类
        const category = await Category.create({
            name,
            code,
            parentId,
            level,
            sortOrder: sortOrder ?? 0,
            icon,
        });

        res.json({ message: '创建成功', data: category });
    });

    // 更新分类（管理员和教师）
    update = asyncHandler(async (req, res) => {
        const { name, sortOrder, icon } = req.body;
        const { id } = req.params;

        const category = await Category.findByIdAndUpdate(
            id,
            { name, sortOrder, icon },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ message: '分类不存在' });
        }

        res.json({ message: '更新成功', data: category });
    });

    // 删除分类（管理员）
    delete = asyncHandler(async (req, res) => {
        const { id } = req.params;

        // 检查是否有子分类
        const childCount = await Category.countDocuments({ parentId: id });
        if (childCount > 0) {
            return res.status(400).json({ message: '该分类有子分类，无法删除' });
        }

        // 检查是否有关联知识点
        const knowledgeCount = await Knowledge.countDocuments({ categoryId: id });
        if (knowledgeCount > 0) {
            return res.status(400).json({
                message: '该分类下有知识点，无法删除',
                count: knowledgeCount,
            });
        }

        await Category.findByIdAndDelete(id);
        res.json({ message: '删除成功' });
    });
}

module.exports = new CategoryController();
