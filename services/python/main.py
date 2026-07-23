"""
测井专业智能培训系统 - Python AI 服务
FastAPI 主应用
"""

import os
import sys
from contextlib import asynccontextmanager

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    logger.info("=" * 50)
    logger.info("测井培训 AI 服务启动中...")
    logger.info("=" * 50)
    
    # 检查环境
    milvus_host = os.getenv("MILVUS_HOST", "localhost")
    logger.info(f"Milvus 主机: {milvus_host}")
    
    # 检查GPU
    try:
        import torch
        if torch.cuda.is_available():
            logger.info(f"GPU 可用: {torch.cuda.get_device_name(0)}")
            logger.info(f"GPU 显存: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        else:
            logger.info("使用 CPU 运行")
    except Exception as e:
        logger.warning(f"无法检测GPU状态: {e}")
    
    logger.info("服务启动完成")
    logger.info("=" * 50)
    
    yield
    
    # 关闭时
    logger.info("正在关闭服务...")


# 创建FastAPI应用
app = FastAPI(
    title="测井专业智能培训 AI 服务",
    description="提供文档解析、向量嵌入、语义搜索、RAG等AI能力",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 导入路由
from api import document, embedding, search, rag


# 注册路由
app.include_router(document.router, prefix="/api/v1/document", tags=["文档处理"])
app.include_router(embedding.router, prefix="/api/v1/embedding", tags=["向量化"])
app.include_router(search.router, prefix="/api/v1/search", tags=["向量检索"])
app.include_router(rag.router, prefix="/api/v1/rag", tags=["RAG生成"])


# 健康检查
@app.get("/health", tags=["系统"])
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "well-logging-ai",
        "version": "1.0.0",
        "endpoints": {
            "document": "/api/v1/document",
            "embedding": "/api/v1/embedding",
            "search": "/api/v1/search",
            "rag": "/api/v1/rag"
        }
    }


# 根路径
@app.get("/", tags=["系统"])
async def root():
    """服务信息"""
    return {
        "service": "测井专业智能培训 AI 服务",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# 错误处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理"""
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "内部服务器错误",
            "detail": str(exc) if os.getenv("DEBUG") else "请稍后重试"
        }
    )


# 启动配置
def main():
    """启动服务"""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))
    workers = int(os.getenv("WORKERS", 1))
    
    logger.info(f"启动服务: {host}:{port}")
    logger.info(f"工作进程数: {workers}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        reload=False  # 生产环境不使用reload
    )


if __name__ == "__main__":
    main()
