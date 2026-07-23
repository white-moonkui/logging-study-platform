/**
 * 向量化任务队列
 * 异步处理知识的向量化任务
 */

const Knowledge = require('../models/Knowledge');
const { vectorizationService } = require('./vectorizationService');

class VectorQueue {
    constructor() {
        this.processing = new Set(); // 正在处理的任务
        this.maxConcurrent = 3; // 最大并发数
        this.retryAttempts = 3; // 重试次数
        this.retryDelay = 5000; // 重试间隔（毫秒）
    }

    /**
     * 将知识加入向量化队列
     * @param {string} knowledgeId - 知识ID
     */
    async enqueue(knowledgeId) {
        try {
            // 检查是否已经在处理中
            if (this.processing.has(knowledgeId)) {
                console.log(`[VectorQueue] 知识 ${knowledgeId} 已在处理队列中`);
                return;
            }

            // 更新状态为 pending
            await Knowledge.findByIdAndUpdate(knowledgeId, {
                vectorStatus: 'pending',
            });

            // 异步处理
            this.processDocument(knowledgeId);

            console.log(`[VectorQueue] 知识 ${knowledgeId} 已加入队列`);
        } catch (error) {
            console.error(`[VectorQueue] 入队失败: ${error.message}`);
        }
    }

    /**
     * 处理单个文档的向量化
     * @param {string} knowledgeId - 知识ID
     * @param {number} attempt - 当前重试次数
     */
    async processDocument(knowledgeId, attempt = 1) {
        // 检查并发数
        if (this.processing.size >= this.maxConcurrent) {
            console.log(`[VectorQueue] 达到最大并发数，延迟处理知识 ${knowledgeId}`);
            setTimeout(() => this.processDocument(knowledgeId, attempt), 2000);
            return;
        }

        this.processing.add(knowledgeId);
        const startTime = Date.now();

        try {
            console.log(
                `[VectorQueue] 开始处理知识 ${knowledgeId} (尝试 ${attempt}/${this.retryAttempts})`
            );

            // 更新状态为 processing
            await Knowledge.findByIdAndUpdate(knowledgeId, {
                vectorStatus: 'processing',
                'metadata.processingStartedAt': new Date(),
            });

            // 获取知识
            const knowledge = await Knowledge.findById(knowledgeId);

            if (!knowledge) {
                console.error(`[VectorQueue] 找不到知识 ${knowledgeId}`);
                await this.markFailed(knowledgeId, '知识不存在');
                return;
            }

            // 执行向量化
            const result = await vectorizationService.vectorizeKnowledge(knowledge);

            if (result.success) {
                // 更新知识文档
                await Knowledge.findByIdAndUpdate(knowledgeId, {
                    $set: {
                        embedding: result.embedding,
                        chunks: result.chunks,
                        vectorStatus: 'completed',
                        vectorCreatedAt: new Date(),
                        metadata: result.metadata,
                    },
                });

                const duration = Date.now() - startTime;
                console.log(
                    `[VectorQueue] ✅ 知识 ${knowledgeId} 向量化完成，耗时 ${duration}ms，${result.chunks.length} 个块`
                );
            } else {
                throw new Error(result.error || '向量化失败');
            }
        } catch (error) {
            console.error(`[VectorQueue] 处理知识 ${knowledgeId} 失败: ${error.message}`);

            // 检查是否需要重试
            if (attempt < this.retryAttempts) {
                console.log(`[VectorQueue] ${this.retryDelay}ms 后重试...`);
                setTimeout(() => {
                    this.processDocument(knowledgeId, attempt + 1);
                }, this.retryDelay);
            } else {
                await this.markFailed(knowledgeId, error.message);
            }
        } finally {
            this.processing.delete(knowledgeId);
        }
    }

    /**
     * 标记向量化失败
     * @param {string} knowledgeId - 知识ID
     * @param {string} error - 错误信息
     */
    async markFailed(knowledgeId, error) {
        await Knowledge.findByIdAndUpdate(knowledgeId, {
            $set: {
                vectorStatus: 'failed',
                'metadata.errorMessage': error,
                'metadata.failedAt': new Date(),
            },
        });
        console.log(`[VectorQueue] ❌ 知识 ${knowledgeId} 向量化失败: ${error}`);
    }

    /**
     * 批量处理待向量化的知识
     */
    async processPending() {
        try {
            const pendingKnowledge = await Knowledge.find({
                vectorStatus: 'pending',
            }).limit(10);

            console.log(`[VectorQueue] 发现 ${pendingKnowledge.length} 条待向量化知识`);

            for (const knowledge of pendingKnowledge) {
                this.enqueue(knowledge._id.toString());
            }
        } catch (error) {
            console.error(`[VectorQueue] 获取待处理知识失败: ${error.message}`);
        }
    }

    /**
     * 重新处理失败的知识
     * @param {number} limit - 数量限制
     */
    async retryFailed(limit = 10) {
        try {
            const failedKnowledge = await Knowledge.find({
                vectorStatus: 'failed',
            }).limit(limit);

            console.log(`[VectorQueue] 发现 ${failedKnowledge.length} 条失败的知识，重新处理`);

            for (const knowledge of failedKnowledge) {
                await Knowledge.findByIdAndUpdate(knowledge._id, {
                    $set: { vectorStatus: 'pending' },
                });
                this.enqueue(knowledge._id.toString());
            }
        } catch (error) {
            console.error(`[VectorQueue] 获取失败知识失败: ${error.message}`);
        }
    }

    /**
     * 获取队列状态
     */
    async getStatus() {
        const counts = await Knowledge.aggregate([
            {
                $group: {
                    _id: '$vectorStatus',
                    count: { $sum: 1 },
                },
            },
        ]);

        const status = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
        };

        for (const item of counts) {
            status[item._id] = item.count;
        }

        return {
            ...status,
            processingNow: this.processing.size,
            maxConcurrent: this.maxConcurrent,
        };
    }

    /**
     * 启动定时任务
     * 每分钟检查一次待处理的知识
     */
    startScheduler() {
        // 启动时处理积压
        this.processPending();

        // 每60秒检查一次
        setInterval(() => {
            this.processPending();
        }, 60000);

        console.log('[VectorQueue] 调度器已启动');
    }
}

// 导出单例
const vectorQueue = new VectorQueue();

module.exports = {
    VectorQueue,
    vectorQueue,
};
