/**
 * 文档处理服务
 * 与Python AI服务集成，处理文档上传、解析、索引
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class DocumentService {
    constructor() {
        // Python AI服务地址
        this.pythonApi = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8001/api/v1';
        this.documentApi = `${this.pythonApi}/document`;
        this.embeddingApi = `${this.pythonApi}/embedding`;
        this.searchApi = `${this.pythonApi}/search`;
        this.ragApi = `${this.pythonApi}/rag`;
        
        // 超时设置
        this.timeout = {
            parse: 60000,      // 文档解析60秒
            embed: 30000,      // 向量化30秒
            search: 15000,     // 检索15秒
            rag: 60000         // RAG生成60秒
        };
    }
    
    /**
     * 解析并索引文档
     * @param {Buffer} fileBuffer - 文件buffer
     * @param {string} filename - 文件名
     * @param {string} mimeType - MIME类型
     * @param {Object} metadata - 元数据
     */
    async parseAndIndex(fileBuffer, filename, mimeType, metadata = {}) {
        try {
            // 1. 解析文档
            const parseResult = await this.parseDocument(fileBuffer, filename, mimeType);
            
            // 2. 向量化文档块
            const embeddedChunks = await this.embedChunks(parseResult.chunks);
            
            // 3. 准备索引数据
            const documents = embeddedChunks.map((chunk, index) => ({
                id: `${metadata.id || 'doc'}_chunk_${index}`,
                embedding: chunk.embedding,
                content: chunk.text,
                title: metadata.title || filename,
                category: metadata.category || 'general',
                metadata: {
                    ...metadata,
                    chunkIndex: index,
                    originalDocId: metadata.id
                },
                created_at: Date.now()
            }));
            
            // 4. 存储到向量数据库
            const indexResult = await this.indexDocuments(documents);
            
            return {
                success: true,
                document: {
                    id: metadata.id,
                    title: metadata.title || filename,
                    pages: parseResult.pages,
                    chunksCount: parseResult.chunks.length,
                    embeddedCount: indexResult.inserted,
                    content: `${parseResult.content.substring(0, 1000)  }...`  // 预览
                },
                vectorIndex: {
                    inserted: indexResult.inserted,
                    total: indexResult.total_entities
                }
            };
            
        } catch (error) {
            console.error('文档解析索引失败:', error);
            throw new Error(`文档处理失败: ${error.message}`);
        }
    }
    
    /**
     * 解析文档
     */
    async parseDocument(fileBuffer, filename, mimeType) {
        const formData = new FormData();
        formData.append('file', fileBuffer, filename);
        
        const response = await axios.post(
            `${this.documentApi}/parse-full`,
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: this.timeout.parse
            }
        );
        
        if (!response.data.success) {
            throw new Error(response.data.detail || '文档解析失败');
        }
        
        return {
            content: response.data.content,
            pages: response.data.pages,
            chunks: response.data.chunks,
            metadata: response.data.metadata
        };
    }
    
    /**
     * 批量向量化文本块
     */
    async embedChunks(chunks) {
        if (!chunks || chunks.length === 0) {
            return [];
        }
        
        const texts = chunks.map(c => c.text);
        
        const response = await axios.post(
            this.embeddingApi,
            { texts, normalize: true },
            { timeout: this.timeout.embed }
        );
        
        // 合并嵌入结果
        return response.data.embeddings.map((embedding, index) => ({
            text: texts[index],
            embedding,
            metadata: chunks[index]
        }));
    }
    
    /**
     * 向量化单个文本
     */
    async embedText(text) {
        const response = await axios.post(
            `${this.embeddingApi}/query`,
            { query: text },
            { timeout: this.timeout.embed }
        );
        
        return {
            embedding: response.data.embedding,
            cached: response.data.cached,
            dimensions: response.data.dimensions
        };
    }
    
    /**
     * 索引文档到向量数据库
     */
    async indexDocuments(documents) {
        const response = await axios.post(
            `${this.searchApi}/add`,
            { documents, batch_size: 100 },
            { timeout: this.timeout.search }
        );
        
        return response.data;
    }
    
    /**
     * 语义搜索
     */
    async semanticSearch(query, options = {}) {
        const response = await axios.post(
            `${this.searchApi}/semantic`,
            {
                query,
                limit: options.limit || 5,
                category: options.category,
                min_score: options.minScore || 0.5
            },
            { timeout: this.timeout.search }
        );
        
        return {
            query: response.data.query,
            results: response.data.results.map(r => ({
                id: r.id,
                content: r.content,
                score: r.score,
                metadata: r.metadata
            })),
            count: response.data.count,
            queryTimeMs: response.data.query_time_ms
        };
    }
    
    /**
     * RAG生成回答
     */
    async generateWithRAG(query, options = {}) {
        const response = await axios.post(
            this.ragApi,
            {
                query,
                template_type: options.templateType || 'general',
                category: options.category,
                limit: options.limit || 5
            },
            { timeout: this.timeout.rag }
        );
        
        return {
            answer: response.data.answer,
            sources: response.data.sources,
            metadata: response.data.metadata
        };
    }
    
    /**
     * 现场技术支持 - 生成处置方案
     */
    async generateFieldSolution(query, problemType, wellInfo) {
        const response = await axios.post(
            `${this.ragApi}/field-support`,
            {
                query,
                problem_type: problemType,
                well_info: wellInfo
            },
            { timeout: this.timeout.rag }
        );
        
        return {
            answer: response.data.answer,
            sources: response.data.sources
        };
    }
    
    /**
     * 文本分块
     */
    async chunkText(text, chunkSize = 500, overlap = 50) {
        const response = await axios.post(
            `${this.documentApi}/chunk`,
            {
                text,
                chunk_size: chunkSize,
                overlap
            },
            { timeout: this.timeout.parse }
        );
        
        return response.data.chunks;
    }
    
    /**
     * 获取向量服务状态
     */
    async getVectorStats() {
        try {
            const response = await axios.get(
                `${this.searchApi}/stats`,
                { timeout: this.timeout.search }
            );
            return response.data;
        } catch (error) {
            return { status: 'unavailable', error: error.message };
        }
    }
    
    /**
     * 获取RAG服务状态
     */
    async getRAGHealth() {
        try {
            const response = await axios.get(
                `${this.ragApi}/health`,
                { timeout: this.timeout.search }
            );
            return response.data;
        } catch (error) {
            return { status: 'unavailable', error: error.message };
        }
    }
    
    /**
     * 删除文档索引
     */
    async deleteDocument(doc) {
        try {
            // 查找该文档的所有块
            const docId = doc.id || doc;
            const searchResponse = await axios.post(
                `${this.searchApi}/semantic`,
                {
                    query: docId,
                    limit: 100
                },
                { timeout: this.timeout.search }
            );
            
            const chunkIds = searchResponse.data.results
                .filter(r => r.metadata?.originalDocId === docId)
                .map(r => r.id);
            
            if (chunkIds.length === 0) {
                return { deleted: 0 };
            }
            
            const deleteResponse = await axios.delete(
                this.searchApi,
                {
                    data: { ids: chunkIds },
                    timeout: this.timeout.search
                }
            );
            
            return {
                deleted: deleteResponse.data.deleted,
                totalChunks: chunkIds.length
            };
            
        } catch (error) {
            throw new Error(`删除文档失败: ${error.message}`);
        }
    }
};
