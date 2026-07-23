"""
RAG API路由
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from core.rag import RAGService, HybridSearchService, RAGResult

router = APIRouter()

# 全局服务实例
rag_service: RAGService = None
hybrid_search: HybridSearchService = None


def get_rag_service() -> RAGService:
    global rag_service
    if rag_service is None:
        try:
            rag_service = RAGService()
        except Exception as e:
            logger.warning(f"RAG服务初始化失败: {e}")
            rag_service = None
    return rag_service


class RAGRequest(BaseModel):
    """RAG请求"""
    query: str
    template_type: str = "general"  # general, field_support, learning, qa
    category: Optional[str] = None
    limit: int = 5
    min_score: float = 0.5
    template_vars: Dict[str, Any] = {}


class FieldSupportRequest(BaseModel):
    """现场技术支持请求"""
    query: str
    problem_type: str
    well_info: Dict[str, Any]
    limit: int = 5


class LearningSupportRequest(BaseModel):
    """学习辅导请求"""
    content: str
    question: str


@router.post("/")
async def generate_with_rag(request: RAGRequest):
    """
    基于知识库生成回答（通用RAG）
    
    Request Body:
    {
        "query": "自然伽马测井的原理是什么？",
        "template_type": "general",
        "category": "basic",
        "limit": 5,
        "min_score": 0.5
    }
    """
    try:
        service = get_rag_service()
        
        if service is None:
            return {
                "answer": "RAG服务暂时不可用，请检查后端服务状态",
                "sources": [],
                "status": "service_unavailable"
            }
        
        result = await service.generate_with_knowledge(
            query=request.query,
            template_type=request.template_type,
            category=request.category,
            options={
                "limit": request.limit,
                "min_score": request.min_score,
                "template_vars": request.template_vars
            }
        )
        
        return {
            "success": True,
            "answer": result.answer,
            "sources": [
                {
                    "id": s.id,
                    "title": s.title,
                    "score": round(s.score, 4),
                    "category": s.category
                }
                for s in result.sources
            ],
            "metadata": {
                "retrieval_time_ms": round(result.total_retrieval_time_ms, 2),
                "generation_time_ms": round(result.total_generation_time_ms, 2),
                "tokens_used": result.tokens_used,
                "model": result.model_name
            }
        }
        
    except Exception as e:
        logger.error(f"RAG生成失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/field-support")
async def generate_field_solution(request: FieldSupportRequest):
    """
    生成现场问题处置方案
    
    Request Body:
    {
        "query": "井深3200米处仪器遇卡，电缆张力异常",
        "problem_type": "instrument_stuck",
        "well_info": {
            "wellName": "XX-1井",
            "depth": 3200,
            "formation": "砂岩",
            "mudType": "水基"
        }
    }
    """
    try:
        service = get_rag_service()
        
        if service is None:
            return {
                "answer": "现场支持服务暂时不可用",
                "status": "service_unavailable"
            }
        
        result = await service.generate_field_solution(
            query=request.query,
            well_info=request.well_info,
            problem_type=request.problem_type
        )
        
        return {
            "success": True,
            "answer": result.answer,
            "sources": [
                {"id": s.id, "title": s.title, "score": round(s.score, 4)}
                for s in result.sources
            ],
            "metadata": {
                "retrieval_time_ms": round(result.total_retrieval_time_ms, 2),
                "generation_time_ms": round(result.total_generation_time_ms, 2)
            }
        }
        
    except Exception as e:
        logger.error(f"现场支持生成失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/learning-support")
async def generate_learning_answer(request: LearningSupportRequest):
    """
    生成学习辅导回答
    """
    try:
        service = get_rag_service()
        
        if service is None:
            return {
                "answer": "学习辅导服务暂时不可用",
                "status": "service_unavailable"
            }
        
        result = await service.generate_learning_answer(
            content=request.content,
            question=request.question
        )
        
        return {
            "success": True,
            "answer": result.answer,
            "sources": [
                {"id": s.id, "title": s.title, "score": round(s.score, 4)}
                for s in result.sources
            ]
        }
        
    except Exception as e:
        logger.error(f"学习辅导生成失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def rag_health():
    """RAG服务健康检查"""
    service = get_rag_service()
    
    return {
        "status": "healthy" if service else "degraded",
        "service": "RAG",
        "embedding_available": True,
        "search_available": service.search_service is not None if service else False,
        "ai_service_available": service.ai_service_url is not None if service else False
    }


import logging
logger = logging.getLogger(__name__)
