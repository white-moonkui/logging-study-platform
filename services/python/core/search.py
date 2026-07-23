"""
向量检索服务
Milvus 向量数据库集成
"""

from pymilvus import (
    Collection, CollectionSchema, FieldSchema,
    DataType, connections, utility, MilvusException
)
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """检索结果"""
    id: str
    content: str
    score: float
    metadata: Dict[str, Any] = field(default_factory=dict)


class VectorSearchService:
    """向量检索服务"""
    
    def __init__(
        self,
        host: str = "localhost",
        port: str = "19530",
        collection_name: str = "knowledge_documents"
    ):
        self.host = host
        self.port = port
        self.collection_name = collection_name
        self.collection: Optional[Collection] = None
        
        # 连接Milvus
        self._connect()
        
        # 初始化集合
        self._init_collection()
    
    def _connect(self):
        """连接Milvus"""
        try:
            connections.connect(
                "default",
                host=self.host,
                port=self.port
            )
            logger.info(f"已连接到 Milvus ({self.host}:{self.port})")
        except MilvusException as e:
            logger.error(f"连接Milvus失败: {e}")
            raise
    
    def _init_collection(self):
        """初始化集合"""
        # 定义Schema
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=64),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1024),
            FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=4096),
            FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=512),
            FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=2048),
            FieldSchema(name="created_at", dtype=DataType.INT64)
        ]
        
        schema = CollectionSchema(fields, "测井知识库文档向量索引")
        
        # 创建或加载集合
        if not utility.has_collection(self.collection_name):
            logger.info(f"创建新集合: {self.collection_name}")
            self.collection = Collection(schema)
            
            # 创建索引
            index_params = {
                "metric_type": "COSINE",
                "index_type": "HNSW",
                "params": {"M": 16, "efConstruction": 64}
            }
            self.collection.create_index("embedding", index_params)
        else:
            logger.info(f"加载现有集合: {self.collection_name}")
            self.collection = Collection(self.collection_name)
        
        # 加载到内存
        self.collection.load()
        logger.info(f"集合已加载，实体数量: {self.collection.num_entities}")
    
    async def search(
        self,
        query_vector: List[float],
        limit: int = 5,
        category: Optional[str] = None,
        min_score: float = 0.5
    ) -> List[SearchResult]:
        """
        向量检索
        
        Args:
            query_vector: 查询向量
            limit: 返回结果数量
            category: 分类过滤
            min_score: 最小相似度阈值
            
        Returns:
            检索结果列表
        """
        if not self.collection:
            raise ValueError("集合未初始化")
        
        search_params = {"metric_type": "COSINE", "params": {"ef": 64}}
        
        # 构建过滤表达式
        expr = None
        if category:
            expr = f'category == "{category}"'
        
        try:
            start_time = time.time()
            
            results = self.collection.search(
                data=[query_vector],
                anns_field="embedding",
                param=search_params,
                limit=limit,
                expr=expr,
                output_fields=["id", "content", "title", "category", "metadata", "created_at"]
            )
            
            search_time = time.time() - start_time
            logger.info(f"向量检索完成，耗时: {search_time:.3f}s")
            
            # 解析结果
            search_results = []
            for hit in results[0]:
                if hit.score >= min_score:
                    search_results.append(SearchResult(
                        id=hit.entity.get("id"),
                        content=hit.entity.get("content", ""),
                        score=hit.score,
                        metadata={
                            "title": hit.entity.get("title", ""),
                            "category": hit.entity.get("category", ""),
                            "created_at": hit.entity.get("created_at", 0)
                        }
                    ))
            
            return search_results
            
        except MilvusException as e:
            logger.error(f"向量检索失败: {e}")
            raise
    
    async def add_documents(
        self,
        documents: List[Dict[str, Any]],
        batch_size: int = 100
    ) -> Dict[str, Any]:
        """
        添加文档向量
        
        Args:
            documents: 文档列表
                [{
                    "id": "doc_001",
                    "embedding": [...],
                    "content": "...",
                    "title": "文档标题",
                    "category": "basic",
                    "metadata": {...}
                }]
            batch_size: 批量大小
        """
        if not self.collection:
            raise ValueError("集合未初始化")
        
        total = len(documents)
        inserted = 0
        
        logger.info(f"开始插入 {total} 个文档向量")
        
        for i in range(0, total, batch_size):
            batch = documents[i:i + batch_size]
            
            ids = [doc["id"] for doc in batch]
            embeddings = [doc["embedding"] for doc in batch]
            contents = [doc["content"][:4000] for doc in batch]  # 截断
            titles = [doc.get("title", "")[:500] for doc in batch]
            categories = [doc.get("category", "general")[:60] for doc in batch]
            metadatas = [str(doc.get("metadata", {}))[:2000] for doc in batch]
            created_at = [int(doc.get("created_at", time.time())) for doc in batch]
            
            self.collection.insert([
                ids, embeddings, contents, titles, 
                categories, metadatas, created_at
            ])
            
            inserted += len(batch)
            logger.info(f"已插入 {inserted}/{total} 个文档")
        
        # 刷新以确保数据可检索
        self.collection.flush()
        
        logger.info(f"文档向量插入完成，总计: {inserted}")
        
        return {
            "inserted": inserted,
            "total_entities": self.collection.num_entities
        }
    
    async def delete_documents(self, ids: List[str]) -> int:
        """删除文档"""
        if not self.collection:
            raise ValueError("集合未初始化")
        
        expr = f'id in ["' + '", "'.join(ids) + '"]'
        result = self.collection.delete(expr)
        
        return result.delete_count
    
    async def get_stats(self) -> Dict[str, Any]:
        """获取集合统计"""
        if not self.collection:
            return {"status": "not initialized"}
        
        return {
            "status": "ready",
            "collection_name": self.collection_name,
            "entities": self.collection.num_entities,
            "index_type": "HNSW",
            "metric_type": "COSINE",
            "dimension": 1024
        }
    
    def close(self):
        """关闭连接"""
        if self.collection:
            self.collection.release()
        connections.disconnect("default")
        logger.info("已断开Milvus连接")
