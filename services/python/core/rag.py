"""
RAG (检索增强生成) 服务
基于知识库检索的AI回答生成
"""

import os
import sys
import json
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from core.embedding import EmbeddingService
from core.search import VectorSearchService

logger = logging.getLogger(__name__)


@dataclass
class RAGSource:
    """RAG检索来源"""
    id: str
    title: str
    content: str
    score: float
    category: str
    page: Optional[int] = None
    chunk_index: Optional[int] = None


@dataclass
class RAGResult:
    """RAG生成结果"""
    answer: str
    sources: List[RAGSource]
    relevance_scores: List[float]
    total_retrieval_time_ms: float
    total_generation_time_ms: float
    tokens_used: int
    model_name: str


class PromptTemplate:
    """提示词模板"""
    
    # 系统提示词
    SYSTEM_PROMPT = """你是一个专业的石油测井工程师，具有丰富的理论知识和实践经验。

你的工作流程：
1. 首先理解用户的问题
2. 在知识库中检索相关信息
3. 基于检索到的信息给出专业、准确的回答
4. 如果知识库中没有相关信息，明确告知用户

回答要求：
- 使用专业术语，但保持清晰易懂
- 涉及安全操作时，必须强调安全注意事项
- 提供具体的操作步骤和建议
- 引用你检索到的资料来源"""

    # RAG回答提示词
    RAG_PROMPT = """基于以下测井专业知识回答用户问题。

【知识库检索结果】
{context}

【用户问题】
{query}

请根据以上知识库内容回答。
问题如果知识库内容不足以回答问题，请说明并给出一般性建议。

回答时请：
1. 直接回答问题
2. 引用相关的知识库来源（使用编号如[1],[2]）
3. 涉及安全操作时强调安全注意事项
4. 如有必要，提供具体的操作建议"""

    # 现场问题处置提示词
    FIELD_SUPPORT_PROMPT = """你是一位经验丰富的测井现场技术支持专家。

【问题信息】
问题类型：{problem_type}
井场信息：{well_info}
问题描述：{problem_description}

【相关知识库内容】
{context}

请提供：
1. 问题分析
2. 可能原因
3. 建议处置步骤（按优先级排序）
4. 所需资源
5. 安全注意事项
6. 预防措施

输出格式要求：
- 使用清晰的标题和编号
- 重要信息用**加粗**
- 步骤要具体可操作"""

    # 学习辅导提示词
    LEARNING_PROMPT = """你是一位专业的测井培训导师。

【学习内容】
{content}

【学员问题】
{question}

请提供：
1. 知识要点解释
2. 相关背景知识
3. 实践应用案例
4. 学习建议

回答要循序渐进，易于理解。"""

    @classmethod
    def get_prompt(cls, template_type: str, **kwargs) -> Tuple[str, str]:
        """获取提示词
        
        Returns: (system_prompt, user_prompt)
        """
        templates = {
            "general": (cls.SYSTEM_PROMPT, cls.RAG_PROMPT),
            "field_support": (cls.SYSTEM_PROMPT, cls.FIELD_SUPPORT_PROMPT),
            "learning": (cls.SYSTEM_PROMPT, cls.LEARNING_PROMPT),
            "qa": (cls.SYSTEM_PROMPT, cls.RAG_PROMPT),
        }
        
        template = templates.get(template_type, templates["general"])
        
        user_prompt = template[1].format(**kwargs)
        
        return template[0], user_prompt


class ContextBuilder:
    """上下文构建器"""
    
    def __init__(self, max_context_length: int = 8000, max_sources: int = 5):
        self.max_context_length = max_context_length
        self.max_sources = max_sources
    
    def build_context(
        self,
        sources: List[RAGSource],
        query: str
    ) -> str:
        """构建上下文文本
        
        Args:
            sources: 检索结果
            query: 用户查询
            
        Returns:
            上下文文本
        """
        if not sources:
            return ""
        
        # 截取到最大长度
        context_parts = []
        total_length = 0
        
        for i, source in enumerate(sources[:self.max_sources]):
            # 格式化来源
            source_text = f"[{i+1}] {source.title}\n{source.content}"
            
            if total_length + len(source_text) > self.max_context_length:
                # 截断当前来源
                remaining = self.max_context_length - total_length
                if remaining > 200:
                    context_parts.append(source_text[:remaining])
                break
            
            context_parts.append(source_text)
            total_length += len(source_text)
        
        return "\n\n".join(context_parts)
    
    def format_sources_for_citation(
        self,
        sources: List[RAGSource]
    ) -> List[Dict[str, Any]]:
        """格式化来源用于引用"""
        return [
            {
                "id": s.id,
                "title": s.title,
                "score": round(s.score, 4),
                "category": s.category
            }
            for s in sources
        ]


class RAGService:
    """RAG服务主类"""
    
    def __init__(
        self,
        embedding_service: EmbeddingService = None,
        search_service: VectorSearchService = None,
        ai_service_url: str = None
    ):
        self.embedding_service = embedding_service or EmbeddingService()
        self.search_service = search_service
        self.ai_service_url = ai_service_url or os.getenv("AI_SERVICE_URL")
        
        # 初始化上下文构建器
        self.context_builder = ContextBuilder(
            max_context_length=8000,
            max_sources=5
        )
        
        logger.info("RAG服务初始化完成")
    
    async def generate_with_knowledge(
        self,
        query: str,
        template_type: str = "general",
        category: str = None,
        options: Dict[str, Any] = None
    ) -> RAGResult:
        """
        基于知识库生成回答
        
        Args:
            query: 用户问题
            template_type: 提示词模板类型
            category: 知识分类过滤
            options: 额外选项
            
        Returns:
            RAG生成结果
        """
        options = options or {}
        
        start_time = time.time()
        
        # 1. 向量化查询
        query_vector = self.embedding_service.embed_query(query)
        retrieval_time = (time.time() - start_time) * 1000
        
        # 2. 向量检索
        search_results = []
        if self.search_service:
            search_results = await self.search_service.search(
                query_vector=query_vector,
                limit=options.get("limit", 5),
                category=category,
                min_score=options.get("min_score", 0.5)
            )
        
        # 3. 构建RAG来源
        sources = [
            RAGSource(
                id=r.id,
                title=r.metadata.get("title", ""),
                content=r.content,
                score=r.score,
                category=r.metadata.get("category", "")
            )
            for r in search_results
        ]
        
        # 4. 构建上下文
        context = self.context_builder.build_context(sources, query)
        
        # 5. 获取提示词
        system_prompt, user_prompt = PromptTemplate.get_prompt(
            template_type,
            query=query,
            context=context,
            **options.get("template_vars", {})
        )
        
        # 6. 调用AI生成
        generation_start = time.time()
        
        answer = await self._call_ai_service(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        generation_time = (time.time() - generation_start) * 1000
        
        return RAGResult(
            answer=answer,
            sources=sources,
            relevance_scores=[s.score for s in sources],
            total_retrieval_time_ms=retrieval_time,
            total_generation_time_ms=generation_time,
            tokens_used=len(answer) // 4,
            model_name="external-ai"
        )
    
    async def generate_field_solution(
        self,
        query: str,
        well_info: Dict[str, Any],
        problem_type: str
    ) -> RAGResult:
        """生成现场问题处置方案"""
        return await self.generate_with_knowledge(
            query=query,
            template_type="field_support",
            template_vars={
                "problem_type": problem_type,
                "well_info": self._format_well_info(well_info),
                "problem_description": query
            }
        )
    
    async def generate_learning_answer(
        self,
        content: str,
        question: str
    ) -> RAGResult:
        """生成学习辅导回答"""
        return await self.generate_with_knowledge(
            query=question,
            template_type="learning",
            template_vars={
                "content": content[:2000],  # 限制内容长度
                "question": question
            }
        )
    
    async def _call_ai_service(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> str:
        """调用外部AI服务"""
        if not self.ai_service_url:
            # 使用规则引擎降级
            return self._fallback_response(user_prompt)
        
        try:
            import httpx
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.ai_service_url,
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": 2000,
                        "temperature": 0.7
                    },
                    headers={
                        "Authorization": f"Bearer {os.getenv('AI_API_KEY', '')}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.warning(f"AI服务返回错误: {response.status_code}")
                    return self._fallback_response(user_prompt)
                    
        except Exception as e:
            logger.error(f"AI服务调用失败: {e}")
            return self._fallback_response(user_prompt)
    
    def _fallback_response(self, user_prompt: str) -> str:
        """降级响应"""
        # 简单的关键词匹配回复
        if "故障" in user_prompt or "问题" in user_prompt:
            return """根据您描述的问题，建议按以下步骤处理：

1. **安全第一**：确认现场安全后进行操作
2. **检查设备**：检查测井仪器各部件连接是否正常
3. **查看日志**：检查系统日志中的错误信息
4. **重启尝试**：在确认安全的情况下尝试重启设备
5. **联系支持**：如问题仍未解决，请联系技术支持

如有更多详细信息，我可以提供更具体的指导。"""
        
        return """您好！我是测井培训AI助手。

当前AI服务暂时不可用，我为您提供以下建议：

1. **查看知识库**：在左侧导航栏浏览相关知识内容
2. **联系管理员**：如需紧急帮助，请联系系统管理员
3. **稍后重试**：AI功能将在服务恢复后自动可用

感谢您的理解！"""

    def _format_well_info(self, well_info: Dict[str, Any]) -> str:
        """格式化井场信息"""
        parts = []
        if well_info.get("wellName"):
            parts.append(f"井名: {well_info['wellName']}")
        if well_info.get("depth"):
            parts.append(f"井深: {well_info['depth']}m")
        if well_info.get("formation"):
            parts.append(f"层位: {well_info['formation']}")
        if well_info.get("mudType"):
            parts.append(f"钻井液: {well_info['mudType']}")
        
        return " | ".join(parts) if parts else "未提供井场信息"


class HybridSearchService:
    """混合检索服务（关键词 + 向量）"""
    
    def __init__(
        self,
        vector_service: VectorSearchService = None,
        keyword_index: Dict[str, Any] = None
    ):
        self.vector_service = vector_service
        self.keyword_index = keyword_index or {}
    
    async def search(
        self,
        query: str,
        query_vector: List[float] = None,
        limit: int = 5,
        category: str = None
    ) -> List[RAGSource]:
        """
        混合检索
        
        1. 向量检索
        2. 关键词检索（备用）
        """
        results = []
        
        # 向量检索
        if query_vector and self.vector_service:
            vector_results = await self.vector_service.search(
                query_vector=query_vector,
                limit=limit,
                category=category
            )
            
            results = [
                RAGSource(
                    id=r.id,
                    title=r.metadata.get("title", ""),
                    content=r.content,
                    score=r.score,
                    category=r.metadata.get("category", "")
                )
                for r in vector_results
            ]
        
        # 如果向量检索无结果，尝试关键词检索
        if not results and self.keyword_index:
            keyword_results = self._keyword_search(query, category)
            
            results = [
                RAGSource(
                    id=r["id"],
                    title=r.get("title", ""),
                    content=r.get("content", ""),
                    score=r.get("score", 0.0),
                    category=r.get("category", "")
                )
                for r in keyword_results[:limit]
            ]
        
        return results
    
    def _keyword_search(
        self,
        query: str,
        category: str = None
    ) -> List[Dict[str, Any]]:
        """关键词检索（简单实现）"""
        keywords = query.lower().split()
        results = []
        
        for doc_id, doc in self.keyword_index.items():
            if category and doc.get("category") != category:
                continue
            
            score = 0
            for keyword in keywords:
                if keyword in doc.get("title", "").lower():
                    score += 2
                if keyword in doc.get("content", "").lower():
                    score += 1
                if keyword in doc.get("keywords", []):
                    score += 3
            
            if score > 0:
                results.append({
                    "id": doc_id,
                    **doc,
                    "score": score / 10  # 归一化到0-1
                })
        
        # 按分数排序
        results.sort(key=lambda x: x["score"], reverse=True)
        
        return results
