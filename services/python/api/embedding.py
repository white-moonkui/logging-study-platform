"""
向量化API路由
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from core.embedding import EmbeddingService, EmbeddingCache

router = APIRouter()

# 全局服务实例
embedding_service: EmbeddingService = None
embedding_cache = EmbeddingCache()


def get_embedding_service() -> EmbeddingService:
    global embedding_service
    if embedding_service is None:
        embedding_service = EmbeddingService()
    return embedding_service


class EmbeddingRequest(BaseModel):
    """向量化请求"""
    texts: List[str]
    normalize: bool = True


class EmbeddingResponse(BaseModel):
    """向量化响应"""
    embeddings: List[List[float]]
    dimensions: int
    count: int
    model: str


class QueryEmbeddingRequest(BaseModel):
    """查询向量化请求"""
    query: str


class ChunksEmbeddingRequest(BaseModel):
    """文本块向量化请求"""
    chunks: List[Dict[str, Any]]  # [{"text": "...", "metadata": {...}}]


@router.post("/")
async def embed_texts(request: EmbeddingRequest):
    """
    批量向量化文本
    
    Request Body:
    {
        "texts": ["文本1", "文本2", ...],
        "normalize": true
    }
    """
    try:
        service = get_embedding_service()
        
        # 检查缓存
        cached_results = []
        uncached_texts = []
        uncached_indices = []
        
        for i, text in enumerate(request.texts):
            cached = embedding_cache.get(text)
            if cached:
                cached_results.append((i, cached))
            else:
                uncached_texts.append(text)
                uncached_indices.append(i)
        
        # 嵌入未缓存的文本
        if uncached_texts:
            new_embeddings = service.embed_texts(uncached_texts, request.normalize)
            
            # 缓存新结果
            for text, emb in zip(uncached_texts, new_embeddings):
                embedding_cache.set(text, emb)
        
        # 合并结果
        all_embeddings = [None] * len(request.texts)
        
        # 填充缓存结果
        for idx, emb in cached_results:
            all_embeddings[idx] = emb
        
        # 填充新计算的结果
        new_iter = iter(new_embeddings)
        for idx in uncached_indices:
            all_embeddings[idx] = next(new_iter)
        
        return EmbeddingResponse(
            embeddings=all_embeddings,
            dimensions=service.dimensions,
            count=len(request.texts),
            model=service.model_name
        )
        
    except Exception as e:
        logger.error(f"向量化失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def embed_query(request: QueryEmbeddingRequest):
    """
    向量化单个查询文本
    """
    try:
        service = get_embedding_service()
        
        # 检查缓存
        cached = embedding_cache.get(request.query)
        if cached:
            return {
                "embedding": cached,
                "cached": True,
                "dimensions": service.dimensions
            }
        
        embedding = service.embed_query(request.query)
        
        # 缓存结果
        embedding_cache.set(request.query, embedding)
        
        return {
            "embedding": embedding,
            "cached": False,
            "dimensions": service.dimensions
        }
        
    except Exception as e:
        logger.error(f"查询向量化失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chunks")
async def embed_chunks(request: ChunksEmbeddingRequest):
    """
    向量化文本块，保留元数据
    
    Request Body:
    {
        "chunks": [
            {"text": "文本块1", "metadata": {...}},
            {"text": "文本块2", "metadata": {...}}
        ]
    }
    """
    try:
        service = get_embedding_service()
        
        if not request.chunks:
            return {"embedded_chunks": []}
        
        # 向量化
        embedded = service.embed_chunks(request.chunks)
        
        return {
            "embedded_chunks": embedded,
            "count": len(embedded),
            "dimensions": service.dimensions
        }
        
    except Exception as e:
        logger.error(f"文本块向量化失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cache/stats")
async def get_cache_stats():
    """获取缓存统计"""
    return embedding_cache.get_stats()


@router.post("/cache/clear")
async def clear_cache():
    """清空缓存"""
    embedding_cache.cache.clear()
    return {"status": "cleared"}


import logging
logger = logging.getLogger(__name__)
