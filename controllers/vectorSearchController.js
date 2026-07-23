/**
 * 向量搜索控制器
 * 处理基于向量的知识搜索
 */

const Knowledge = require('../models/Knowledge');
const { vectorizationService } = require('../services/vectorizationService');
const { vectorQueue } = require('../services/vectorQueue');

class VectorSearchController {
    /**
     * 向量搜索
     * 根据查询文本，找到最相似的知识
     */
    async vectorSearch(req, res) {
        try {
            const { query, limit = 5, threshold = 0.5 } = req.body;

            if (!query || query.trim().length === 0) {
                return res.status(400).json({
                    message: '搜索查询不能为空',
                });
            }

            console.log(`[VectorSearch] 搜索: "${query.substring(0, 50)}..."`);

            // 1. 将查询文本转换为向量
            const queryEmbedding = await vectorizationService.embedQuery(query);

            // 2. 获取所有已向量化的知识
            const knowledgeList = await Knowledge.find({
                vectorStatus: 'completed',
                embedding: { $exists: true, $ne: null },
            }).select('title content category embedding chunks');

            if (knowledgeList.length === 0) {
                return res.json({
                    message: '暂无已向量化的知识',
                    results: [],
                });
            }

            // 3. 计算相似度并排序
            const results = knowledgeList.map(knowledge => {
                const similarity = vectorizationService.computeSimilarity(
                    queryEmbedding,
                    knowledge.embedding
                );
                return {
                    knowledge: {
                        _id: knowledge._id,
                        title: knowledge.title,
                        category: knowledge.category,
                        content: `${knowledge.content.substring(0, 200)  }...`,
                    },
                    similarity,
                    relevantChunks: knowledge.chunks
                        ?.filter(chunk => chunk.embedding)
                        .map(chunk => ({
                            content: chunk.content,
                            similarity: vectorizationService.computeSimilarity(
                                queryEmbedding,
                                chunk.embedding
                            ),
                        }))
                        .sort((a, b) => b.similarity - a.similarity)
                        .slice(0, 3),
                };
            });

            // 4. 过滤低于阈值的結果，并排序
            const filteredResults = results
                .filter(r => r.similarity >= threshold)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            // 5. 返回结果
            res.json({
                message: '搜索成功',
                query,
                results: filteredResults,
                stats: {
                    totalKnowledge: knowledgeList.length,
                    returnedResults: filteredResults.length,
                    threshold,
                },
            });
        } catch (error) {
            console.error('[VectorSearch] 搜索失败:', error.message);
            res.status(500).json({
                message: '向量搜索失败',
                error: error.message,
            });
        }
    }

    /**
     * 获取知识的向量化状态
     */
    async getVectorStatus(req, res) {
        try {
            const { id } = req.params;

            const knowledge = await Knowledge.findById(id).select(
                'title vectorStatus vectorCreatedAt metadata chunks embedding'
            );

            if (!knowledge) {
                return res.status(404).json({
                    message: '知识不存在',
                });
            }

            res.json({
                knowledgeId: id,
                title: knowledge.title,
                vectorStatus: knowledge.vectorStatus,
                vectorCreatedAt: knowledge.vectorCreatedAt,
                metadata: knowledge.metadata,
                chunksCount: knowledge.chunks?.length || 0,
                hasEmbedding: !!knowledge.embedding && knowledge.embedding.length > 0,
            });
        } catch (error) {
            res.status(500).json({
                message: '获取状态失败',
                error: error.message,
            });
        }
    }

    /**
     * 手动触发向量化
     */
    async triggerVectorization(req, res) {
        try {
            const { id } = req.params;

            const knowledge = await Knowledge.findById(id);

            if (!knowledge) {
                return res.status(404).json({
                    message: '知识不存在',
                });
            }

            // 重新加入队列
            vectorQueue.enqueue(id);

            res.json({
                message: '已重新触发向量化',
                knowledgeId: id,
                vectorStatus: 'pending',
            });
        } catch (error) {
            res.status(500).json({
                message: '触发失败',
                error: error.message,
            });
        }
    }

    /**
     * 获取向量化队列状态
     */
    async getQueueStatus(req, res) {
        try {
            const status = await vectorQueue.getStatus();

            res.json({
                queue: status,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                message: '获取队列状态失败',
                error: error.message,
            });
        }
    }

    /**
     * 获取向量化服务健康状态
     */
    async healthCheck(req, res) {
        try {
            const isHealthy = await vectorizationService.healthCheck();

            res.json({
                embeddingService: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                embeddingService: 'error',
                error: error.message,
            });
        }
    }
}

module.exports = new VectorSearchController();
