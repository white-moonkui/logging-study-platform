"""
向量化服务
使用 BAAI/bge-large-zh 模型生成中文文本嵌入
"""

import torch
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class EmbeddingResult:
    """向量化结果"""
    embeddings: List[List[float]]
    dimensions: int
    model_name: str
    processing_time: float


class EmbeddingService:
    """向量化服务"""
    
    def __init__(self, model_name: str = "BAAI/bge-large-zh"):
        self.model_name = model_name
        
        # 检测设备
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"初始化向量化服务，使用设备: {self.device}")
        
        # 加载模型
        self.model = SentenceTransformer(model_name, device=self.device)
        self.dimensions = self.model.get_sentence_embedding_dimension()
        
        print(f"模型加载完成，向量维度: {self.dimensions}")
    
    def embed_texts(self, texts: List[str], normalize: bool = True) -> List[List[float]]:
        """
        批量向量化文本
        
        Args:
            texts: 文本列表
            normalize: 是否归一化向量
            
        Returns:
            向量列表
        """
        if not texts:
            return []
        
        embeddings = self.model.encode(
            texts,
            device=self.device,
            normalize_embeddings=normalize,
            show_progress_bar=len(texts) > 10
        )
        
        return embeddings.tolist()
    
    def embed_query(self, query: str) -> List[float]:
        """
        向量化查询文本
        
        Args:
            query: 查询文本
            
        Returns:
            查询向量
        """
        return self.embed_texts([query])[0]
    
    def embed_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        向量化文本块，保留元数据
        
        Args:
            chunks: 文本块列表 [{text: "...", metadata: {...}}, ...]
            
        Returns:
            带向量的文本块列表
        """
        if not chunks:
            return []
        
        texts = [chunk["text"] for chunk in chunks]
        embeddings = self.embed_texts(texts)
        
        # 合并向量和元数据
        embedded_chunks = []
        for i, chunk in enumerate(chunks):
            embedded_chunks.append({
                **chunk,
                "embedding": embeddings[i]
            })
        
        return embedded_chunks
    
    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        计算两个向量的余弦相似度
        
        Args:
            embedding1: 第一个向量
            embedding2: 第二个向量
            
        Returns:
            余弦相似度
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # 余弦相似度
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def search_similar(
        self,
        query_embedding: List[float],
        embeddings: List[List[float]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        在嵌入列表中搜索最相似的向量
        
        Args:
            query_embedding: 查询向量
            embeddings: 候选向量列表
            top_k: 返回前k个结果
            
        Returns:
            相似度排序的结果 [{index, score}, ...]
        """
        if not embeddings:
            return []
        
        scores = []
        for i, emb in enumerate(embeddings):
            score = self.compute_similarity(query_embedding, emb)
            scores.append({"index": i, "score": score})
        
        # 按相似度降序排序
        scores.sort(key=lambda x: x["score"], reverse=True)
        
        return scores[:top_k]


class EmbeddingCache:
    """嵌入缓存（用于低并发场景）"""
    
    def __init__(self, max_size: int = 10000):
        self.cache: Dict[str, List[float]] = {}
        self.max_size = max_size
        self.hits = 0
        self.misses = 0
    
    def get(self, text: str) -> List[float] | None:
        """获取缓存的嵌入"""
        if text in self.cache:
            self.hits += 1
            return self.cache[text]
        self.misses += 1
        return None
    
    def set(self, text: str, embedding: List[float]):
        """缓存嵌入"""
        if len(self.cache) >= self.max_size:
            # 简单的LRU模拟：清空一半缓存
            keys_to_remove = list(self.cache.keys())[:self.max_size // 2]
            for key in keys_to_remove:
                del self.cache[key]
        
        self.cache[text] = embedding
    
    def get_stats(self) -> Dict[str, int]:
        """获取缓存统计"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.2f}%",
            "cache_size": len(self.cache)
        }
