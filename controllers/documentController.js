/**
 * 文档控制器
 * 处理文档上传、解析、索引、查询
 */

const Document = require('../models/Document');
const path = require('path');
const fs = require('fs').promises;

class DocumentController {
    // 获取文档列表
    async getDocumentList(req, res) {
        try {
            const { category, status, page = 1, limit = 10 } = req.query;

            const filter = { isDeleted: false };
            if (category) {filter.category = category;}
            if (status) {filter.status = status;}

            const documents = await Document.find(filter)
                .populate('uploadedBy', 'username profile.name')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Document.countDocuments(filter);

            res.json({
                documents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '获取文档列表失败',
                error: error.message,
            });
        }
    }

    // 获取文档详情
    async getDocumentDetail(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id).populate(
                'uploadedBy',
                'username profile.name'
            );

            if (!document || document.isDeleted) {
                return res.status(404).json({
                    message: '文档不存在',
                });
            }

            res.json({ document });
        } catch (error) {
            res.status(500).json({
                message: '获取文档详情失败',
                error: error.message,
            });
        }
    }

    // 获取文档内容
    async getDocumentContent(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id);
            if (!document || document.isDeleted) {
                return res.status(404).json({
                    message: '文档不存在',
                });
            }

            res.json({
                title: document.title,
                content: document.extractedContent,
                chunks: document.chunks || [],
            });
        } catch (error) {
            res.status(500).json({
                message: '获取文档内容失败',
                error: error.message,
            });
        }
    }

    // 上传文档（基础版本，不涉及实际文件上传）
    async uploadDocument(req, res) {
        try {
            const { title, category, tags } = req.body;

            // 验证必填字段
            if (!title) {
                return res.status(400).json({
                    message: '文档标题不能为空',
                });
            }

            // 如果有文件信息（在实际实现中应通过 multer 处理）
            const documentData = {
                title,
                originalName: req.file?.originalname || 'manual_upload',
                filePath: req.file?.path || '',
                fileType: req.file?.mimetype || 'text/plain',
                fileSize: req.file?.size || 0,
                uploadedBy: req.userId,
                category: category || 'other',
                tags: tags ? JSON.parse(tags) : [],
                status: 'uploading',
            };

            const document = new Document(documentData);
            await document.save();

            // 触发异步解析（实际实现中应由后台任务处理）
            this.processDocument(document._id);

            res.status(201).json({
                message: '文档上传成功',
                document,
            });
        } catch (error) {
            res.status(500).json({
                message: '上传文档失败',
                error: error.message,
            });
        }
    }

    // 创建文档记录（用于已上传的文件）
    async createDocument(req, res) {
        try {
            const { title, filePath, fileType, fileSize, category, tags } = req.body;

            if (!title || !filePath || !fileType) {
                return res.status(400).json({
                    message: '缺少必要字段：title, filePath, fileType',
                });
            }

            const document = new Document({
                title,
                originalName: path.basename(filePath),
                filePath,
                fileType,
                fileSize: fileSize || 0,
                uploadedBy: req.userId,
                category: category || 'other',
                tags: tags || [],
                status: 'ready',
                extractedContent: '文档已上传，待解析。', // 简化处理
            });

            await document.save();

            res.status(201).json({
                message: '文档创建成功',
                document,
            });
        } catch (error) {
            res.status(500).json({
                message: '创建文档失败',
                error: error.message,
            });
        }
    }

    // 解析文档内容
    async parseDocument(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id);
            if (!document) {
                return res.status(404).json({
                    message: '文档不存在',
                });
            }

            document.status = 'parsing';
            await document.save();

            // 模拟解析过程 - 实际实现中应调用解析服务
            const extractedContent = await this.extractContent(
                document.filePath,
                document.fileType
            );
            const chunks = this.splitContent(extractedContent);

            document.extractedContent = extractedContent;
            document.chunks = chunks;
            document.pages = Math.ceil(extractedContent.length / 2000);
            document.status = 'ready';
            await document.save();

            res.json({
                message: '文档解析成功',
                document: {
                    id: document._id,
                    title: document.title,
                    pages: document.pages,
                    chunks: chunks.length,
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '解析文档失败',
                error: error.message,
            });
        }
    }

    // 索引文档
    async indexDocument(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id);
            if (!document) {
                return res.status(404).json({
                    message: '文档不存在',
                });
            }

            if (document.status !== 'ready') {
                return res.status(400).json({
                    message: '文档未就绪，无法索引',
                });
            }

            document.status = 'indexing';
            await document.save();

            // 模拟索引过程 - 实际实现中应调用向量数据库
            await new Promise(resolve => setTimeout(resolve, 1000));

            document.isIndexed = true;
            document.indexedAt = new Date();
            document.vectorCount = document.chunks ? document.chunks.length : 0;
            document.status = 'ready';
            await document.save();

            res.json({
                message: '文档索引成功',
                document: {
                    id: document._id,
                    isIndexed: true,
                    vectorCount: document.vectorCount,
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '索引文档失败',
                error: error.message,
            });
        }
    }

    // 更新文档
    async updateDocument(req, res) {
        try {
            const { id } = req.params;
            const { title, category, tags } = req.body;

            const document = await Document.findById(id);
            if (!document || document.isDeleted) {
                return res.status(404).json({
                    message: '文档不存在',
                });
            }

            // 只能修改自己的文档或管理员
            if (req.userRole !== 'admin' && document.uploadedBy.toString() !== req.userId) {
                return res.status(403).json({
                    message: '没有权限修改此文档',
                });
            }

            if (title) {document.title = title;}
            if (category) {document.category = category;}
            if (tags) {document.tags = tags;}

            await document.save();

            res.json({
                message: '文档更新成功',
                document,
            });
        } catch (error) {
            res.status(500).json({
                message: '更新文档失败',
                error: error.message,
            });
        }
    }

    // 删除文档（软删除）
    async deleteDocument(req, res) {
        try {
            const { id } = req.params;

            const document = await Document.findById(id);
            if (!document) {
                return res.status(404).json({
                    message: '文档不存在',
                });
            }

            // 只能删除自己的文档或管理员
            if (req.userRole !== 'admin' && document.uploadedBy.toString() !== req.userId) {
                return res.status(403).json({
                    message: '没有权限删除此文档',
                });
            }

            document.isDeleted = true;
            document.status = 'deleted';
            await document.save();

            res.json({
                message: '文档删除成功',
            });
        } catch (error) {
            res.status(500).json({
                message: '删除文档失败',
                error: error.message,
            });
        }
    }

    // 搜索文档
    async searchDocuments(req, res) {
        try {
            const { keyword, category } = req.query;

            const filter = { isDeleted: false };
            if (category) {filter.category = category;}

            // 使用文本搜索
            if (keyword) {
                filter.$text = { $search: keyword };
            }

            const documents = await Document.find(filter)
                .populate('uploadedBy', 'username')
                .sort({ score: { $meta: 'textScore' } })
                .limit(20);

            res.json({ documents });
        } catch (error) {
            res.status(500).json({
                message: '搜索文档失败',
                error: error.message,
            });
        }
    }

    // 辅助方法：处理文档
    async processDocument(documentId) {
        try {
            const document = await Document.findById(documentId);
            if (!document) {return;}

            // 异步解析和索引
            await this.extractContent(document.filePath, document.fileType);
            // 实际实现中应有完整的后台处理流程
        } catch (error) {
            console.error('处理文档失败:', error.message);
        }
    }

    // 辅助方法：提取内容
    async extractContent(filePath, fileType) {
        // 简化实现 - 实际应根据文件类型调用不同解析器
        try {
            if (fileType === 'text/plain' || fileType === 'text/markdown') {
                return await fs.readFile(filePath, 'utf8');
            }
            return '文档内容解析功能需要在完整实现中配置。';
        } catch (error) {
            return '无法读取文档内容。';
        }
    }

    // 辅助方法：分割内容
    splitContent(content, chunkSize = 2000) {
        const chunks = [];
        for (let i = 0; i < content.length; i += chunkSize) {
            chunks.push({
                text: content.substring(i, i + chunkSize),
                index: Math.floor(i / chunkSize),
                start: i,
                end: Math.min(i + chunkSize, content.length),
            });
        }
        return chunks;
    }
}

module.exports = new DocumentController();
