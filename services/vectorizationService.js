/**
 * 向量化服务
 * 负责将知识文本转换为向量并存储
 */

const axios = require('axios');

class VectorizationService {
    constructor() {
        // Python Embedding API 地址（从环境变量读取）
        this.pythonApi = process.env.PYTHON_API_URL || 'http://localhost:8000/api/v1';
        this.embeddingEndpoint = `${this.pythonApi}/embedding`;
        this.embeddingModel = 'BAAI/bge-large-zh';
        this.embeddingDimension = 1024;

        // 分块配置
        this.chunkSize = 1000; // 每个块的最大字符数
        this.chunkOverlap = 100; // 块之间的重叠字符数
    }

    /**
     * 将文本转换为向量
     * @param {string} text - 要向量化的文本
     * @returns {Promise<number[]>} - 1024维向量
     */
    async embedText(text) {
        try {
            const response = await axios.post(
                this.embeddingEndpoint,
                {
                    texts: [text],
                    normalize: true,
                },
                {
                    timeout: 60000, // 60秒超时
                }
            );

            if (response.data && response.data.embeddings && response.data.embeddings.length > 0) {
                return response.data.embeddings[0];
            } else {
                throw new Error('Embedding API 返回格式错误');
            }
        } catch (error) {
            console.error('向量生成失败:', error.message);
            throw error;
        }
    }

    /**
     * 将多个文本批量转换为向量
     * @param {string[]} texts - 文本数组
     * @returns {Promise<number[][]>} - 向量数组
     */
    async embedTexts(texts) {
        if (!texts || texts.length === 0) {
            return [];
        }

        try {
            const response = await axios.post(
                this.embeddingEndpoint,
                {
                    texts,
                    normalize: true,
                },
                {
                    timeout: 120000, // 120秒超时
                }
            );

            if (response.data && response.data.embeddings) {
                return response.data.embeddings;
            } else {
                throw new Error('Embedding API 返回格式错误');
            }
        } catch (error) {
            console.error('批量向量生成失败:', error.message);
            throw error;
        }
    }

    /**
     * 将查询文本转换为向量（带缓存）
     * @param {string} query - 查询文本
     * @returns {Promise<number[]>} - 向量
     */
    async embedQuery(query) {
        try {
            const response = await axios.post(
                `${this.embeddingEndpoint}/query`,
                {
                    query,
                },
                {
                    timeout: 30000,
                }
            );

            if (response.data && response.data.embedding) {
                return response.data.embedding;
            } else {
                throw new Error('Query embedding API 返回格式错误');
            }
        } catch (error) {
            console.error('查询向量生成失败:', error.message);
            throw error;
        }
    }

    /**
     * 文本分块
     * @param {string} text - 原始文本
     * @param {number} maxLength - 每个块的最大长度
     * @param {number} overlap - 块之间的重叠长度
     * @returns {string[]} - 分块后的文本数组
     */
    chunkText(text, maxLength = null, overlap = null) {
        const chunkSize = maxLength || this.chunkSize;
        const chunkOverlap = overlap || this.chunkOverlap;

        if (!text || text.length === 0) {
            return [];
        }

        // 如果文本长度小于分块大小，直接返回
        if (text.length <= chunkSize) {
            return [text];
        }

        const chunks = [];
        let start = 0;

        while (start < text.length) {
            let end = start + chunkSize;

            // 尝试在句子边界处截断
            if (end < text.length) {
                // 查找最后一个句号、问号、感叹号或段落分隔符
                const lastPeriod = Math.max(
                    text.lastIndexOf('。', end),
                    text.lastIndexOf('？', end),
                    text.lastIndexOf('！', end),
                    text.lastIndexOf('\n\n', end),
                    text.lastIndexOf('\n', end)
                );

                // 如果找到了合适的断点，且断点在当前块的后半部分
                if (lastPeriod > start + chunkSize * 0.5) {
                    end = lastPeriod + 1; // 包含句号
                }
            }

            chunks.push(text.slice(start, end));

            // 计算下一个块的起始位置（包含重叠部分）
            start = end - chunkOverlap;

            // 确保不会无限循环
            if (start >= text.length) {
                break;
            }

            // 确保下一个块至少有一点新内容
            if (start < chunks[chunks.length - 1].length) {
                start = chunks[chunks.length - 1].length - chunkOverlap;
            }
        }

        return chunks;
    }

    /**
     * 对知识内容进行完整向量化处理
     * @param {Object} knowledge - 知识对象
     * @returns {Promise<Object>} - 向量化结果
     */
    async vectorizeKnowledge(knowledge) {
        const { _id, title, content, category } = knowledge;

        console.log(`[Vectorization] 开始向量化知识: ${_id}`);
        const startTime = Date.now();

        try {
            // 1. 准备文本：将标题和内容组合
            const fullText = `${title}\n\n${content}`;

            // 2. 文本分块
            const chunks = this.chunkText(fullText);
            console.log(`[Vectorization] 文本分块完成，共 ${chunks.length} 个块`);

            if (chunks.length === 0) {
                throw new Error('文本分块结果为空');
            }

            // 3. 批量向量化
            console.log(`[Vectorization] 开始生成向量...`);
            const embeddings = await this.embedTexts(chunks);
            console.log(`[Vectorization] 向量生成完成，耗时 ${Date.now() - startTime}ms`);

            // 4. 构建分块数据
            const chunkData = chunks.map((chunk, index) => ({
                content: chunk,
                embedding: embeddings[index] || null,
                tokenCount: Math.ceil(chunk.length / 4), // 粗略估算
            }));

            // 5. 计算总向量（取所有块向量的平均值）
            const validEmbeddings = embeddings.filter(e => e !== null);
            const avgEmbedding = this.computeAverageEmbedding(validEmbeddings);

            const duration = Date.now() - startTime;

            return {
                success: true,
                chunks: chunkData,
                embedding: avgEmbedding,
                metadata: {
                    totalChunks: chunks.length,
                    embeddingModel: this.embeddingModel,
                    embeddingDimension: this.embeddingDimension,
                    vectorDb: 'mongodb', // 存储在 MongoDB
                    processingTime: duration,
                },
            };
        } catch (error) {
            console.error(`[Vectorization] 向量化失败: ${error.message}`);
            return {
                success: false,
                error: error.message,
                metadata: {
                    errorMessage: error.message,
                    embeddingModel: this.embeddingModel,
                    failedAt: new Date().toISOString(),
                },
            };
        }
    }

    /**
     * 计算多个向量的平均值
     * @param {number[][]} embeddings - 向量数组
     * @returns {number[]} - 平均向量
     */
    computeAverageEmbedding(embeddings) {
        if (!embeddings || embeddings.length === 0) {
            return null;
        }

        if (embeddings.length === 1) {
            return embeddings[0];
        }

        const dimension = embeddings[0].length;
        const avg = new Array(dimension).fill(0);

        for (const embedding of embeddings) {
            for (let i = 0; i < dimension; i++) {
                avg[i] += embedding[i];
            }
        }

        // 计算平均值
        for (let i = 0; i < dimension; i++) {
            avg[i] /= embeddings.length;
        }

        return avg;
    }

    /**
     * 计算两个向量的余弦相似度
     * @param {number[]} vec1 - 向量1
     * @param {number[]} vec2 - 向量2
     * @returns {number} - 相似度 (0-1)
     */
    computeSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            return 0;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);

        if (denominator === 0) {
            return 0;
        }

        return dotProduct / denominator;
    }

    /**
     * 检查 Embedding 服务是否可用
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${this.pythonApi}/health`, {
                timeout: 5000,
            });
            return response.status === 200;
        } catch (error) {
            console.error('[Vectorization] 健康检查失败:', error.message);
            return false;
        }
    }
}

// 导出单例
const vectorizationService = new VectorizationService();

module.exports = {
    VectorizationService,
    vectorizationService,
};
