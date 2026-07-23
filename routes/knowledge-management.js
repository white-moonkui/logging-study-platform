// 知识库管理API路由
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// 配置文件上传
const storage = multer.diskStorage({
    destination (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/knowledge');
        cb(null, uploadPath);
    },
    filename (req, file, cb) {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB限制
    },
    fileFilter (req, file, cb) {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'), false);
        }
    },
});

class KnowledgeManager {
    constructor() {
        this.knowledgePath = path.join(__dirname, '../data/knowledge_base.json');
        this.categories = [
            { id: 'basic', name: '基础知识', icon: 'fa-book', count: 0 },
            { id: 'instrument', name: '仪器知识', icon: 'fa-microchip', count: 0 },
            { id: 'operation', name: '现场作业', icon: 'fa-hard-hat', count: 0 },
            { id: 'standard', name: '标准规范', icon: 'fa-ruler-combined', count: 0 },
            { id: 'cases', name: '典型案例', icon: 'fa-folder-open', count: 0 },
            { id: 'solutions', name: '解决方案', icon: 'fa-lightbulb', count: 0 },
        ];
        this.tags = [];
        this.reviews = [];
        this.reviewHistory = [];
        this.init();
    }

    async init() {
        // 确保数据目录存在
        const dataDir = path.join(__dirname, '../data');
        const uploadDir = path.join(__dirname, '../uploads/knowledge');

        try {
            await fs.mkdir(dataDir, { recursive: true });
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (error) {
            console.log('目录创建失败:', error.message);
        }

        // 初始化知识库文件
        await this.initKnowledgeBase();
    }

    async initKnowledgeBase() {
        // 加载扩展数据（分类、标签、审核）
        await this.loadExtendedData();

        try {
            await fs.access(this.knowledgePath);
        } catch (error) {
            // 文件不存在，创建默认知识库
            const defaultKnowledge = {
                categories: this.categories,
                items: [
                    {
                        id: 'kb_001',
                        title: '放射性测井基础知识',
                        category: 'basic',
                        type: 'document',
                        description: '自然伽马、中子、密度测井的基本原理和应用',
                        fileName: 'radioactive_basics.pdf',
                        fileSize: '2.5MB',
                        uploadTime: '2026-01-30T10:00:00Z',
                        keywords: ['放射性', '测井', '原理', '伽马', '中子', '密度'],
                        content: '放射性测井是利用岩石的放射性特性来识别地层岩性...',
                    },
                    {
                        id: 'kb_002',
                        title: '井下仪器遇卡案例',
                        category: 'cases',
                        type: 'document',
                        description: '典型井下仪器遇卡事件的处理过程和经验总结',
                        fileName: 'instrument_stuck_case.docx',
                        fileSize: '1.8MB',
                        uploadTime: '2026-01-29T15:30:00Z',
                        keywords: ['遇卡', '井下', '仪器', '案例', '处置'],
                        content: '某井在深度3200米处发生仪器遇卡，经过分析...',
                    },
                ],
            };

            await fs.writeFile(this.knowledgePath, JSON.stringify(defaultKnowledge, null, 2));
            console.log('默认知识库已创建');
        }
    }

    // 加载扩展数据
    async loadExtendedData() {
        const extDataPath = path.join(__dirname, '../data/knowledge_extended.json');
        try {
            const data = await fs.readFile(extDataPath, 'utf8');
            const ext = JSON.parse(data);
            if (ext.categories && ext.categories.length > 0) {
                this.categories = ext.categories;
            }
            if (ext.tags) {
                this.tags = ext.tags;
            }
            if (ext.reviews) {
                this.reviews = ext.reviews;
            }
            if (ext.reviewHistory) {
                this.reviewHistory = ext.reviewHistory;
            }
        } catch (error) {
            // 文件不存在，使用默认数据
            this.tags = [
                { name: '测井原理', count: 45, color: '#2563eb' },
                { name: '电阻率', count: 32, color: '#3b82f6' },
                { name: '声波测井', count: 28, color: '#06b6d4' },
                { name: '伽马测井', count: 25, color: '#10b981' },
                { name: '中子测井', count: 22, color: '#f59e0b' },
            ];
            this.reviews = [];
            this.reviewHistory = [];
            await this.saveExtendedData();
        }
    }

    // 保存扩展数据
    async saveExtendedData() {
        const extDataPath = path.join(__dirname, '../data/knowledge_extended.json');
        const data = {
            categories: this.categories,
            tags: this.tags,
            reviews: this.reviews,
            reviewHistory: this.reviewHistory,
        };
        await fs.writeFile(extDataPath, JSON.stringify(data, null, 2));
    }

    // 获取知识库内容
    async getKnowledge(category = null) {
        try {
            const data = await fs.readFile(this.knowledgePath, 'utf8');
            const knowledge = JSON.parse(data);

            if (category) {
                knowledge.items = knowledge.items.filter(item => item.category === category);
            }

            return {
                success: true,
                categories: knowledge.categories,
                items: knowledge.items,
                total: knowledge.items.length,
            };
        } catch (error) {
            console.error('获取知识库失败:', error);
            return {
                success: false,
                error: '读取知识库失败',
            };
        }
    }

    // 添加知识项目
    async addKnowledgeItem(itemData, file = null) {
        try {
            const data = await fs.readFile(this.knowledgePath, 'utf8');
            const knowledge = JSON.parse(data);

            const newItem = {
                id: `kb_${  Date.now()}`,
                ...itemData,
                uploadTime: new Date().toISOString(),
            };

            if (file) {
                newItem.fileName = file.originalname;
                newItem.filePath = file.path;
                newItem.fileSize = `${(file.size / 1024 / 1024).toFixed(2)  }MB`;
                newItem.fileType = file.mimetype;
            }

            knowledge.items.push(newItem);

            await fs.writeFile(this.knowledgePath, JSON.stringify(knowledge, null, 2));

            return {
                success: true,
                item: newItem,
                message: '知识项目添加成功',
            };
        } catch (error) {
            console.error('添加知识项目失败:', error);
            return {
                success: false,
                error: '添加知识项目失败',
            };
        }
    }

    // 更新知识项目
    async updateKnowledgeItem(id, updateData) {
        try {
            const data = await fs.readFile(this.knowledgePath, 'utf8');
            const knowledge = JSON.parse(data);

            const itemIndex = knowledge.items.findIndex(item => item.id === id);

            if (itemIndex === -1) {
                return {
                    success: false,
                    error: '知识项目不存在',
                };
            }

            knowledge.items[itemIndex] = {
                ...knowledge.items[itemIndex],
                ...updateData,
                updateTime: new Date().toISOString(),
            };

            await fs.writeFile(this.knowledgePath, JSON.stringify(knowledge, null, 2));

            return {
                success: true,
                item: knowledge.items[itemIndex],
                message: '知识项目更新成功',
            };
        } catch (error) {
            console.error('更新知识项目失败:', error);
            return {
                success: false,
                error: '更新知识项目失败',
            };
        }
    }

    // 删除知识项目
    async deleteKnowledgeItem(id) {
        try {
            const data = await fs.readFile(this.knowledgePath, 'utf8');
            const knowledge = JSON.parse(data);

            const itemIndex = knowledge.items.findIndex(item => item.id === id);

            if (itemIndex === -1) {
                return {
                    success: false,
                    error: '知识项目不存在',
                };
            }

            const deletedItem = knowledge.items[itemIndex];

            // 删除文件
            if (deletedItem.filePath) {
                try {
                    await fs.unlink(deletedItem.filePath);
                } catch (error) {
                    console.log('删除文件失败:', error.message);
                }
            }

            knowledge.items.splice(itemIndex, 1);

            await fs.writeFile(this.knowledgePath, JSON.stringify(knowledge, null, 2));

            return {
                success: true,
                message: '知识项目删除成功',
            };
        } catch (error) {
            console.error('删除知识项目失败:', error);
            return {
                success: false,
                error: '删除知识项目失败',
            };
        }
    }

    // 搜索知识项目
    async searchKnowledge(query, category = null) {
        try {
            const data = await fs.readFile(this.knowledgePath, 'utf8');
            const knowledge = JSON.parse(data);

            let items = knowledge.items;

            // 按分类过滤
            if (category) {
                items = items.filter(item => item.category === category);
            }

            // 按关键词搜索
            if (query) {
                const lowerQuery = query.toLowerCase();
                items = items.filter(item => {
                    return (
                        item.title.toLowerCase().includes(lowerQuery) ||
                        item.description.toLowerCase().includes(lowerQuery) ||
                        item.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
                    );
                });
            }

            return {
                success: true,
                items,
                total: items.length,
                query,
                category,
            };
        } catch (error) {
            console.error('搜索知识库失败:', error);
            return {
                success: false,
                error: '搜索失败',
            };
        }
    }

    // 获取分类信息
    getCategories() {
        return {
            success: true,
            categories: this.categories,
        };
    }

    // 添加分类
    async addCategory(name, icon = 'fa-folder') {
        try {
            const id = `cat_${  Date.now()}`;
            const newCategory = {
                id,
                name,
                icon,
                count: 0,
                createdAt: new Date().toISOString(),
            };
            this.categories.push(newCategory);
            await this.saveExtendedData();
            return { success: true, category: newCategory, message: '分类添加成功' };
        } catch (error) {
            console.error('添加分类失败:', error);
            return { success: false, error: '添加分类失败' };
        }
    }

    // 更新分类
    async updateCategory(id, name, icon) {
        try {
            const category = this.categories.find(c => c.id === id);
            if (!category) {
                return { success: false, error: '分类不存在' };
            }
            category.name = name;
            if (icon) {category.icon = icon;}
            category.updatedAt = new Date().toISOString();
            await this.saveExtendedData();
            return { success: true, category, message: '分类更新成功' };
        } catch (error) {
            console.error('更新分类失败:', error);
            return { success: false, error: '更新分类失败' };
        }
    }

    // 删除分类
    async deleteCategory(id) {
        try {
            const index = this.categories.findIndex(c => c.id === id);
            if (index === -1) {
                return { success: false, error: '分类不存在' };
            }
            this.categories.splice(index, 1);
            await this.saveExtendedData();
            return { success: true, message: '分类删除成功' };
        } catch (error) {
            console.error('删除分类失败:', error);
            return { success: false, error: '删除分类失败' };
        }
    }

    // 获取标签列表
    getTags() {
        return {
            success: true,
            tags: this.tags,
        };
    }

    // 添加标签
    async addTag(name, color = '#2563eb') {
        try {
            const existingTag = this.tags.find(t => t.name === name);
            if (existingTag) {
                return { success: false, error: '标签已存在' };
            }
            const newTag = {
                name,
                color,
                count: 0,
                createdAt: new Date().toISOString(),
            };
            this.tags.push(newTag);
            await this.saveExtendedData();
            return { success: true, tag: newTag, message: '标签添加成功' };
        } catch (error) {
            console.error('添加标签失败:', error);
            return { success: false, error: '添加标签失败' };
        }
    }

    // 更新标签
    async updateTag(name, newName, color) {
        try {
            const tag = this.tags.find(t => t.name === name);
            if (!tag) {
                return { success: false, error: '标签不存在' };
            }
            if (newName) {tag.name = newName;}
            if (color) {tag.color = color;}
            tag.updatedAt = new Date().toISOString();
            await this.saveExtendedData();
            return { success: true, tag, message: '标签更新成功' };
        } catch (error) {
            console.error('更新标签失败:', error);
            return { success: false, error: '更新标签失败' };
        }
    }

    // 删除标签
    async deleteTag(name) {
        try {
            const index = this.tags.findIndex(t => t.name === name);
            if (index === -1) {
                return { success: false, error: '标签不存在' };
            }
            this.tags.splice(index, 1);
            await this.saveExtendedData();
            return { success: true, message: '标签删除成功' };
        } catch (error) {
            console.error('删除标签失败:', error);
            return { success: false, error: '删除标签失败' };
        }
    }

    // 获取待审核列表
    async getPendingReviews() {
        return {
            success: true,
            items: this.reviews.filter(r => r.status === 'pending'),
            total: this.reviews.filter(r => r.status === 'pending').length,
        };
    }

    // 审核通过
    async approveReview(id) {
        try {
            const review = this.reviews.find(r => r.id === id);
            if (!review) {
                return { success: false, error: '审核项目不存在' };
            }
            review.status = 'approved';
            review.reviewedAt = new Date().toISOString();
            this.reviewHistory.push({ ...review });
            await this.saveExtendedData();
            return { success: true, message: '审核通过' };
        } catch (error) {
            console.error('审核通过失败:', error);
            return { success: false, error: '审核通过失败' };
        }
    }

    // 审核拒绝
    async rejectReview(id, reason) {
        try {
            const review = this.reviews.find(r => r.id === id);
            if (!review) {
                return { success: false, error: '审核项目不存在' };
            }
            review.status = 'rejected';
            review.reason = reason;
            review.reviewedAt = new Date().toISOString();
            this.reviewHistory.push({ ...review });
            await this.saveExtendedData();
            return { success: true, message: '审核已拒绝' };
        } catch (error) {
            console.error('审核拒绝失败:', error);
            return { success: false, error: '审核拒绝失败' };
        }
    }

    // 获取审核历史
    async getReviewHistory() {
        return {
            success: true,
            items: this.reviewHistory,
            total: this.reviewHistory.length,
        };
    }

    // 获取仪表盘统计数据
    async getDashboardStats() {
        try {
            const data = await fs.readFile(this.knowledgePath, 'utf8');
            const knowledge = JSON.parse(data);

            const pendingReviews = this.reviews.filter(r => r.status === 'pending').length;
            const today = new Date().toISOString().split('T')[0];
            const approvedToday = this.reviewHistory.filter(
                r => r.status === 'approved' && r.reviewedAt?.startsWith(today)
            ).length;
            const rejectedToday = this.reviewHistory.filter(
                r => r.status === 'rejected' && r.reviewedAt?.startsWith(today)
            ).length;

            return {
                success: true,
                stats: {
                    totalKnowledge: knowledge.items.length,
                    pendingReview: pendingReviews,
                    approvedToday,
                    rejectedToday,
                    approvalRate:
                        this.reviewHistory.length > 0
                            ? Math.round(
                                  (this.reviewHistory.filter(r => r.status === 'approved').length /
                                      this.reviewHistory.length) *
                                      100
                              )
                            : 0,
                    avgReviewTime: '3.2天',
                },
            };
        } catch (error) {
            console.error('获取统计数据失败:', error);
            return {
                success: false,
                stats: {
                    totalKnowledge: 0,
                    pendingReview: 0,
                    approvedToday: 0,
                    rejectedToday: 0,
                    approvalRate: 0,
                    avgReviewTime: '-',
                },
            };
        }
    }
}

// 创建知识管理器实例
const knowledgeManager = new KnowledgeManager();

// 获取知识库内容
router.get('/items', async (req, res) => {
    try {
        const { category } = req.query;
        const result = await knowledgeManager.getKnowledge(category);

        res.json(result);
    } catch (error) {
        console.error('获取知识库错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误',
        });
    }
});

// 添加知识项目（JSON格式，用于批量导入和普通添加）
router.post('/items', async (req, res) => {
    try {
        const { title, category, description, keywords, content, status } = req.body;

        if (!title || !category) {
            return res.status(400).json({
                success: false,
                error: '标题和分类不能为空',
            });
        }

        const itemData = {
            title,
            category,
            description: description || '',
            keywords: Array.isArray(keywords)
                ? keywords
                : keywords
                  ? keywords.split(',').map(k => k.trim())
                  : [],
            content: content || description || '',
            status: status || 'draft',
        };

        const result = await knowledgeManager.addKnowledgeItem(itemData);

        res.json(result);
    } catch (error) {
        console.error('添加知识项目错误:', error);
        res.status(500).json({
            success: false,
            error: '添加失败',
        });
    }
});

// 上传文件并添加知识项目
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { title, category, description, keywords } = req.body;

        if (!title || !category) {
            return res.status(400).json({
                success: false,
                error: '标题和分类不能为空',
            });
        }

        const itemData = {
            title,
            category,
            description: description || '',
            keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        };

        const result = await knowledgeManager.addKnowledgeItem(itemData, req.file);

        res.json(result);
    } catch (error) {
        console.error('上传文件错误:', error);
        res.status(500).json({
            success: false,
            error: '上传失败',
        });
    }
});

// 更新知识项目
router.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await knowledgeManager.updateKnowledgeItem(id, updateData);

        res.json(result);
    } catch (error) {
        console.error('更新知识项目错误:', error);
        res.status(500).json({
            success: false,
            error: '更新失败',
        });
    }
});

// 删除知识项目
router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await knowledgeManager.deleteKnowledgeItem(id);

        res.json(result);
    } catch (error) {
        console.error('删除知识项目错误:', error);
        res.status(500).json({
            success: false,
            error: '删除失败',
        });
    }
});

// 搜索知识项目
router.get('/search', async (req, res) => {
    try {
        const { q: query, category } = req.query;

        const result = await knowledgeManager.searchKnowledge(query, category);

        res.json(result);
    } catch (error) {
        console.error('搜索知识项目错误:', error);
        res.status(500).json({
            success: false,
            error: '搜索失败',
        });
    }
});

// 获取分类信息
router.get('/categories', async (req, res) => {
    try {
        const result = knowledgeManager.getCategories();

        res.json(result);
    } catch (error) {
        console.error('获取分类信息错误:', error);
        res.status(500).json({
            success: false,
            error: '获取分类失败',
        });
    }
});

// 批量导入知识
router.post('/batch-import', upload.single('file'), async (req, res) => {
    try {
        const { category, mode } = req.body;
        // mode: 'replace' (替换) 或 'append' (追加)

        if (!category) {
            return res.status(400).json({
                success: false,
                error: '请选择分类',
            });
        }

        let items = [];
        let parseError = null;

        // 解析上传的文件
        if (req.file) {
            const fileContent = await fs.readFile(req.file.path, 'utf8');
            const fileExt = path.extname(req.file.originalname).toLowerCase();

            if (fileExt === '.json') {
                try {
                    const parsed = JSON.parse(fileContent);
                    items = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    parseError = 'JSON 格式解析失败';
                }
            } else if (fileExt === '.csv') {
                items = parseCSV(fileContent);
            } else {
                return res.status(400).json({
                    success: false,
                    error: '仅支持 JSON 和 CSV 格式文件',
                });
            }
        } else if (req.body.data) {
            // 直接传入的数据
            try {
                items = JSON.parse(req.body.data);
            } catch (e) {
                parseError = '数据解析失败';
            }
        } else {
            return res.status(400).json({
                success: false,
                error: '请上传文件或输入数据',
            });
        }

        if (parseError) {
            return res.status(400).json({
                success: false,
                error: parseError,
            });
        }

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有可导入的数据',
            });
        }

        // 验证和格式化数据
        const validItems = [];
        const errors = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rowNum = i + 1;

            if (!item.title || item.title.trim() === '') {
                errors.push(`第 ${rowNum} 行：标题不能为空`);
                continue;
            }

            validItems.push({
                id: `kb_${  Date.now()  }_${  i}`,
                title: item.title.trim(),
                category: item.category || category, // 使用文件中的分类或选择的分类
                type: 'document',
                description: (item.description || item.content || '').substring(0, 500),
                fileName: null,
                filePath: null,
                fileSize: null,
                fileType: null,
                keywords: item.keywords || item.tags || [],
                content: item.content || item.description || '',
                uploadTime: new Date().toISOString(),
                importBatch: Date.now(), // 导入批次号
            });
        }

        // 保存到知识库
        const data = await fs.readFile(knowledgeManager.knowledgePath, 'utf8');
        const knowledge = JSON.parse(data);

        let addedCount = 0;
        const skippedCount = 0;

        for (const item of validItems) {
            if (mode === 'replace') {
                // 替换模式：删除同分类同标题的旧数据
                const existingIndex = knowledge.items.findIndex(
                    existing => existing.category === item.category && existing.title === item.title
                );
                if (existingIndex !== -1) {
                    knowledge.items.splice(existingIndex, 1);
                }
            }
            // append 模式直接添加
            knowledge.items.push(item);
            addedCount++;
        }

        await fs.writeFile(knowledgeManager.knowledgePath, JSON.stringify(knowledge, null, 2));

        // 清理上传的临时文件
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (e) {
                console.log('清理临时文件失败:', e.message);
            }
        }

        res.json({
            success: true,
            message: `导入完成`,
            summary: {
                total: items.length,
                success: addedCount,
                skipped: skippedCount,
                errors: errors.length,
            },
            errors: errors.slice(0, 10), // 只返回前10个错误
            category,
        });
    } catch (error) {
        console.error('批量导入错误:', error);
        res.status(500).json({
            success: false,
            error: `批量导入失败: ${  error.message}`,
        });
    }
});

// 获取导入模板
router.get('/template/:format', async (req, res) => {
    try {
        const { format } = req.params;
        const templateData = [
            {
                title: '示例知识标题1',
                category: 'basic',
                description: '知识描述内容',
                keywords: ['关键词1', '关键词2', '关键词3'],
                content: '知识的详细内容...',
            },
            {
                title: '示例知识标题2',
                category: 'instrument',
                description: '另一条知识的描述',
                keywords: ['仪器', '测井'],
                content: '更多详细内容...',
            },
        ];

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=knowledge_template.json');
            res.send(JSON.stringify(templateData, null, 2));
        } else if (format === 'csv') {
            const csv = convertToCSV(templateData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=knowledge_template.csv');
            res.send(csv);
        } else {
            res.status(400).json({
                success: false,
                error: '不支持的格式',
            });
        }
    } catch (error) {
        console.error('生成模板错误:', error);
        res.status(500).json({
            success: false,
            error: '生成模板失败',
        });
    }
});

// 辅助函数：解析CSV
function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {return [];}

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const items = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) {continue;}

        const item = {};
        headers.forEach((header, index) => {
            const key = header.toLowerCase();
            let value = values[index]?.trim().replace(/^"|"$/g, '') || '';

            if (key === 'keywords' || key === 'tags') {
                value = value
                    .split(';')
                    .map(k => k.trim())
                    .filter(k => k);
            }

            item[key] = value;
        });

        items.push(item);
    }

    return items;
}

// 辅助函数：解析CSV行（处理引号）
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

// 辅助函数：转换为CSV
function convertToCSV(data) {
    if (data.length === 0) {return '';}

    const headers = ['title', 'category', 'description', 'keywords', 'content'];
    const rows = data.map(item => {
        return headers
            .map(header => {
                let value = item[header] || '';
                if (Array.isArray(value)) {
                    value = value.join(';');
                }
                // 处理包含逗号或引号的值
                if (value.includes(',') || value.includes('"')) {
                    value = `"${  value.replace(/"/g, '""')  }"`;
                }
                return value;
            })
            .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}

// ==================== 分类管理 API ====================

// 获取分类列表
router.get('/categories', async (req, res) => {
    try {
        const result = knowledgeManager.getCategories();
        res.json(result);
    } catch (error) {
        console.error('获取分类错误:', error);
        res.status(500).json({ success: false, error: '获取分类失败' });
    }
});

// 添加分类
router.post('/categories', async (req, res) => {
    try {
        const { name, icon } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: '分类名称不能为空' });
        }
        const result = await knowledgeManager.addCategory(name, icon);
        res.json(result);
    } catch (error) {
        console.error('添加分类错误:', error);
        res.status(500).json({ success: false, error: '添加分类失败' });
    }
});

// 更新分类
router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon } = req.body;
        const result = await knowledgeManager.updateCategory(id, name, icon);
        res.json(result);
    } catch (error) {
        console.error('更新分类错误:', error);
        res.status(500).json({ success: false, error: '更新分类失败' });
    }
});

// 删除分类
router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await knowledgeManager.deleteCategory(id);
        res.json(result);
    } catch (error) {
        console.error('删除分类错误:', error);
        res.status(500).json({ success: false, error: '删除分类失败' });
    }
});

// ==================== 标签管理 API ====================

// 获取标签列表
router.get('/tags', async (req, res) => {
    try {
        const result = knowledgeManager.getTags();
        res.json(result);
    } catch (error) {
        console.error('获取标签错误:', error);
        res.status(500).json({ success: false, error: '获取标签失败' });
    }
});

// 添加标签
router.post('/tags', async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: '标签名称不能为空' });
        }
        const result = await knowledgeManager.addTag(name, color);
        res.json(result);
    } catch (error) {
        console.error('添加标签错误:', error);
        res.status(500).json({ success: false, error: '添加标签失败' });
    }
});

// 更新标签
router.put('/tags/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { newName, color } = req.body;
        const result = await knowledgeManager.updateTag(name, newName, color);
        res.json(result);
    } catch (error) {
        console.error('更新标签错误:', error);
        res.status(500).json({ success: false, error: '更新标签失败' });
    }
});

// 删除标签
router.delete('/tags/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const result = await knowledgeManager.deleteTag(name);
        res.json(result);
    } catch (error) {
        console.error('删除标签错误:', error);
        res.status(500).json({ success: false, error: '删除标签失败' });
    }
});

// ==================== 审核管理 API ====================

// 获取待审核列表
router.get('/reviews/pending', async (req, res) => {
    try {
        const result = await knowledgeManager.getPendingReviews();
        res.json(result);
    } catch (error) {
        console.error('获取待审核列表错误:', error);
        res.status(500).json({ success: false, error: '获取审核列表失败' });
    }
});

// 审核通过
router.post('/reviews/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await knowledgeManager.approveReview(id);
        res.json(result);
    } catch (error) {
        console.error('审核通过错误:', error);
        res.status(500).json({ success: false, error: '审核通过失败' });
    }
});

// 审核拒绝
router.post('/reviews/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const result = await knowledgeManager.rejectReview(id, reason);
        res.json(result);
    } catch (error) {
        console.error('审核拒绝错误:', error);
        res.status(500).json({ success: false, error: '审核拒绝失败' });
    }
});

// 获取审核历史
router.get('/reviews/history', async (req, res) => {
    try {
        const result = await knowledgeManager.getReviewHistory();
        res.json(result);
    } catch (error) {
        console.error('获取审核历史错误:', error);
        res.status(500).json({ success: false, error: '获取审核历史失败' });
    }
});

// 获取仪表盘统计数据
router.get('/dashboard', async (req, res) => {
    try {
        const result = await knowledgeManager.getDashboardStats();
        res.json(result);
    } catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({ success: false, error: '获取统计数据失败' });
    }
});

module.exports = router;
