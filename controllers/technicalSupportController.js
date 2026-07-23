const TechnicalSupport = require('../models/TechnicalSupport');

class TechnicalSupportController {
    async getList(req, res) {
        try {
            const { status, type, category, priority, page = 1, limit = 10 } = req.query;

            const filter = {};
            if (status) {filter.status = status;}
            if (type) {filter.type = type;}
            if (category) {filter.category = category;}
            if (priority) {filter.priority = priority;}

            const items = await TechnicalSupport.find(filter)
                .populate('submittedBy', 'username')
                .populate('assignedTo', 'username')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await TechnicalSupport.countDocuments(filter);

            res.json({
                items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({ message: '获取列表失败', error: error.message });
        }
    }

    async getMyList(req, res) {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const filter = { submittedBy: req.userId };
            if (status) {filter.status = status;}

            const items = await TechnicalSupport.find(filter)
                .populate('assignedTo', 'username')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await TechnicalSupport.countDocuments(filter);

            res.json({
                items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({ message: '获取我的问题失败', error: error.message });
        }
    }

    async getFAQ(req, res) {
        try {
            const { category, keyword, page = 1, limit = 10 } = req.query;

            const filter = { isPublic: true, status: 'resolved' };
            if (category) {filter.category = category;}
            if (keyword) {
                filter.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { solution: { $regex: keyword, $options: 'i' } },
                ];
            }

            const items = await TechnicalSupport.find(filter)
                .populate('submittedBy', 'username')
                .sort({ viewCount: -1, createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await TechnicalSupport.countDocuments(filter);

            res.json({
                items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({ message: '获取常见问题失败', error: error.message });
        }
    }

    async getDetail(req, res) {
        try {
            const { id } = req.params;

            const item = await TechnicalSupport.findById(id)
                .populate('submittedBy', 'username')
                .populate('assignedTo', 'username');

            if (!item) {
                return res.status(404).json({ message: '记录不存在' });
            }

            item.viewCount = (item.viewCount || 0) + 1;
            await item.save();

            res.json({ item });
        } catch (error) {
            res.status(500).json({ message: '获取详情失败', error: error.message });
        }
    }

    async create(req, res) {
        try {
            const data = req.body;
            data.submittedBy = req.userId;

            const item = new TechnicalSupport(data);
            await item.save();

            res.status(201).json({ message: '提交成功', item });
        } catch (error) {
            res.status(500).json({ message: '提交失败', error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const item = await TechnicalSupport.findById(id);

            if (!item) {
                return res.status(404).json({ message: '记录不存在' });
            }

            if (item.submittedBy.toString() !== req.userId && req.userRole !== 'admin') {
                return res.status(403).json({ message: '权限不足' });
            }

            Object.assign(item, updateData);
            await item.save();

            res.json({ message: '更新成功', item });
        } catch (error) {
            res.status(500).json({ message: '更新失败', error: error.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, solution } = req.body;

            const item = await TechnicalSupport.findById(id);

            if (!item) {
                return res.status(404).json({ message: '记录不存在' });
            }

            if (req.userRole !== 'admin') {
                return res.status(403).json({ message: '权限不足' });
            }

            item.status = status;
            if (solution) {item.solution = solution;}
            if (status === 'resolved') {
                item.assignedTo = req.userId;
            }

            await item.save();

            res.json({ message: '状态更新成功', item });
        } catch (error) {
            res.status(500).json({ message: '更新失败', error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            const item = await TechnicalSupport.findById(id);

            if (!item) {
                return res.status(404).json({ message: '记录不存在' });
            }

            if (item.submittedBy.toString() !== req.userId && req.userRole !== 'admin') {
                return res.status(403).json({ message: '权限不足' });
            }

            await TechnicalSupport.findByIdAndDelete(id);

            res.json({ message: '删除成功' });
        } catch (error) {
            res.status(500).json({ message: '删除失败', error: error.message });
        }
    }

    async getStatistics(req, res) {
        try {
            const { startDate, endDate } = req.query;

            const filter = {};
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) {filter.createdAt.$gte = new Date(startDate);}
                if (endDate) {filter.createdAt.$lte = new Date(endDate);}
            }

            const stats = await TechnicalSupport.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]);

            const typeStats = await TechnicalSupport.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                    },
                },
            ]);

            const priorityStats = await TechnicalSupport.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$priority',
                        count: { $sum: 1 },
                    },
                },
            ]);

            res.json({
                statusStats: stats,
                typeStats,
                priorityStats,
            });
        } catch (error) {
            res.status(500).json({ message: '获取统计失败', error: error.message });
        }
    }
}

module.exports = new TechnicalSupportController();
