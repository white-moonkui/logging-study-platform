"""
向量检索API路由
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from core.search import VectorSearchService

router = APIRouter()

# 全局服务实例
search_service: VectorSearchService = None


def get_search_service() -> VectorSearchService:
    global search_service
    if search_service is None:
        try:
            search_service = VectorSearchService(
                host=os.getenv("MILVUS_HOST", "localhost"),
                port=os.getenv("MILVUS_PORT", "19530")
            )
        except Exception as e:
            logger.warning(f"Milvus连接失败: {e}")
            search_service = None
    return search_service


class SearchRequest(BaseModel):
    """检索请求"""
    query_vector: List[float]
    limit: int = 5
    category: Optional[str] = None
    min_score: float = 0.5


class SemanticSearchRequest(BaseModel):
    """语义检索请求（自动向量化）"""
    query: str
    limit: int = 5
    category: Optional[str] = None
    min_score: float = 0.5


class AddDocumentsRequest(BaseModel):
    """添加文档请求"""
    documents: List[Dict[str, Any]]
    batch_size: int = 100


class SearchResultItem(BaseModel):
    """检索结果项"""
    id: str
    content: str
    score: float
    metadata: Dict[str, Any]


class SearchResponse(BaseModel):
    """检索响应"""
    results: List[SearchResultItem]
    count: int
    query_time_ms: float


@router.post("/")
async def search(request: SearchRequest):
    """
    向量检索
    
    Request Body:
    {
        "query_vector": [...],
        "limit": 5,
        "category": "basic",
        "min_score": 0.5
    }
    """
    try:
        service = get_search_service()
        
        if service is None:
            return {
                "results": [],
                "count": 0,
                "query_time_ms": 0,
                "status": "milvus_unavailable"
            }
        
        import time
        start_time = time.time()
        
        results = await service.search(
            query_vector=request.query_vector,
            limit=request.limit,
            category=request.category,
            min_score=request.min_score
        )
        
        query_time_ms = (time.time() - start_time) * 1000
        
        return SearchResponse(
            results=[
                SearchResultItem(
                    id=r.id,
                    content=r.content,
                    score=r.score,
                    metadata=r.metadata
                )
                for r in results
            ],
            count=len(results),
            query_time_ms=query_time_ms
        )
        
    except Exception as e:
        logger.error(f"向量检索失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/semantic")
async def semantic_search(request: SemanticSearchRequest):
    """
    语义检索（自动将查询文本向量化）
    
    Request Body:
    {
        "query": "测井仪器故障排查",
        "limit": 5,
        "category": "basic"
    }
    """
    try:
        search_svc = get_search_service()
        embedding_svc = get_embedding_service()
        
        if search_svc is None or embedding_svc is None:
            return {
                "results": [],
                "count": 0,
                "status": "service_unavailable"
            }
        
        # 向量化查询
        query_vector = embedding_svc.embed_query(request.query)
        
        # 检索
        import time
        start_time = time.time()
        
        results = await search_svc.search(
            query_vector=query_vector,
            limit=request.limit,
            category=request.category,
            min_score=request.min_score
        )
        
        query_time_ms = (time.time() - start_time) * 1000
        
        return {
            "query": request.query,
            "results": [
                {
                    "id": r.id,
                    "content": r.content,
                    "score": r.score,
                    "metadata": r.metadata
                }
                for r in results
            ],
            "count": len(results),
            "query_time_ms": query_time_ms,
            "embedding_time_ms": 0  # 已包含在query_time_ms中
        }
        
    except Exception as e:
        logger.error(f"语义检索失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
async def add_documents(request: AddDocumentsRequest):
    """
    添加文档向量
    
    Request Body:
    {
        "documents": [
            {
                "id": "doc_001",
                "embedding": [...],
                "content": "...",
                "title": "文档标题",
                "category": "basic",
                "metadata": {...}
            }
        ]
    }
    """
    try:
        service = get_search_service()
        
        if service is None:
            raise HTTPException(status_code=503, detail="向量检索服务不可用")
        
        result = await service.add_documents(
            documents=request.documents,
            batch_size=request.batch_size
        )
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"添加文档失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents")
async def delete_documents(ids: List[str]):
    """
    删除文档向量
    """
    try:
        service = get_search_service()
        
        if service is None:
            raise HTTPException(status_code=503, detail="向量检索服务不可用")
        
        deleted = await service.delete_documents(ids)
        
        return {
            "success": True,
            "deleted": deleted
        }
        
    except Exception as e:
        logger.error(f"删除文档失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats():
    """获取检索服务统计"""
    service = get_search_service()
    
    if service is None:
        return {
            "status": "unavailable",
            "message": "Milvus服务未连接"
        }
    
    return await service.get_stats()


# 导入依赖
from core.embedding import EmbeddingService

def get_embedding_service() -> EmbeddingService:
    from core.embedding import EmbeddingService
    global embedding_service
    if embedding_service is None:
        embedding_service = EmbeddingService()
    return embedding_service

import logging
logger = logging.getLogger(__name__)
