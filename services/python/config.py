"""
配置文件
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    """应用配置"""
    
    # 服务配置
    host: str = "0.0.0.0"
    port: int = 8001
    workers: int = 1
    
    # Milvus 配置
    milvus_host: str = "localhost"
    milvus_port: str = "19530"
    
    # 向量模型配置
    embedding_model: str = "BAAI/bge-large-zh"
    embedding_dimension: int = 1024
    
    # 文档处理配置
    chunk_size: int = 500
    chunk_overlap: int = 50
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    
    # 检索配置
    default_search_limit: int = 5
    min_search_score: float = 0.5
    max_search_score: float = 0.95
    
    # 日志配置
    log_level: str = "INFO"
    
    # CORS 配置
    cors_origins: list = None
    
    def __post_init__(self):
        # 环境变量覆盖
        self.host = os.getenv("HOST", self.host)
        self.port = int(os.getenv("PORT", self.port))
        self.milvus_host = os.getenv("MILVUS_HOST", self.milvus_host)
        self.milvus_port = os.getenv("MILVUS_PORT", self.milvus_port)
        
        if self.cors_origins is None:
            self.cors_origins = ["*"]
    
    @classmethod
    def from_env(cls) -> "Config":
        """从环境变量加载配置"""
        return cls()


# 单例配置
config = Config.from_env()
