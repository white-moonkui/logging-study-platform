"""
文档解析API路由
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
import sys
import os

# 添加core目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from core.parser import DocumentParserFactory

router = APIRouter()
parser_factory = DocumentParserFactory()


@router.post("/parse")
async def parse_document(file: UploadFile = File(...)):
    """
    解析上传的文档
    
    支持格式: PDF, Word, Excel, PowerPoint, TXT
    """
    try:
        # 读取文件内容
        content = await file.read()
        
        # 解析文档
        result = await parser_factory.parse(
            content=content,
            filename=file.filename,
            mime_type=file.content_type or "application/octet-stream"
        )
        
        return {
            "success": True,
            "filename": file.filename,
            "content": result.content[:10000],  # 限制返回内容长度
            "pages": result.pages,
            "chunks_count": len(result.chunks),
            "metadata": result.metadata
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"文档解析失败: {e}")
        raise HTTPException(status_code=500, detail=f"解析失败: {str(e)}")


@router.post("/parse-full")
async def parse_document_full(file: UploadFile = File(...)):
    """
    完整解析文档（返回所有内容）
    
    注意：大文件可能需要分块请求
    """
    try:
        content = await file.read()
        
        result = await parser_factory.parse(
            content=content,
            filename=file.filename,
            mime_type=file.content_type or "application/octet-stream"
        )
        
        return {
            "success": True,
            "filename": file.filename,
            "content": result.content,
            "pages": result.pages,
            "chunks": result.chunks,
            "metadata": result.metadata
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"文档解析失败: {e}")
        raise HTTPException(status_code=500, detail=f"解析失败: {str(e)}")


@router.post("/chunk")
async def chunk_text(request: Dict[str, Any]):
    """
    对文本进行分块处理
    
    Request Body:
    {
        "text": "长文本...",
        "chunk_size": 500,
        "overlap": 50
    }
    """
    try:
        text = request.get("text", "")
        chunk_size = request.get("chunk_size", 500)
        overlap = request.get("overlap", 50)
        
        if not text:
            raise HTTPException(status_code=400, detail="文本内容不能为空")
        
        # 使用PDF解析器的分块逻辑
        from core.parser import PDFParser
        
        parser = PDFParser()
        chunks = parser._chunk_text(text, chunk_size, overlap)
        
        return {
            "success": True,
            "original_length": len(text),
            "chunks_count": len(chunks),
            "chunks": chunks
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import logging
logger = logging.getLogger(__name__)
