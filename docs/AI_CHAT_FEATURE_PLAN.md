# 智能答疑模块 - 功能规划文档

## 📋 概述

**模块名称**: 智能答疑 (AI Chat)  
**当前状态**: 已完成基础界面设计  
**待开发功能**: 大模型 API 集成

---

## 🎯 已完成功能

### 1. 界面设计

- ✅ 大模型风格对话界面
- ✅ 顶部欢迎消息
- ✅ 消息输入框（支持多行）
- ✅ 发送按钮
- ✅ 快速提问标签
- ✅ 玻璃态 UI 风格

### 2. 基础交互

- ✅ 导航切换
- ✅ 消息显示
- ✅ 清空历史
- ✅ 导出记录

---

## 🚀 待开发功能

### 1. 大模型 API 集成

**优先级**: 🔴 高  
**状态**: 未开始

#### 技术方案

```javascript
// 计划集成的大模型调用方式
class LLMService {
    constructor(config) {
        this.apiKey = process.env.LLM_API_KEY;
        this.model = config.model || 'gpt-3.5-turbo';
        this.systemPrompt = `你是一个专业的石油工程测井专家，请使用简洁的中文回答。
                              你的主要职责是：
                              1. 解答测井相关的专业问题
                              2. 提供仪器操作指导
                              3. 解释测井原理和方法
                              4. 分享现场作业经验
                              5. 提供标准规范解读`;
    }

    async chat(message, context = []) {
        // 调用大模型 API
        const response = await this.callAPI({
            model: this.model,
            messages: [
                { role: 'system', content: this.systemPrompt },
                ...context,
                { role: 'user', content: message },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });
        return response;
    }
}
```

#### 集成步骤

1. **选择大模型提供商**
    - OpenAI GPT-4/3.5
    - Claude
    - 本地部署模型
    - 国内模型（文心一言、通义千问等）

2. **设计 API 接口**

    ```javascript
    // 计划新增的 API 路由
    POST /api/ai-chat/message
    Body: { message: string, context?: array }
    Response: { reply: string, tokens: number }
    ```

3. **实现流式响应**（可选）
    - 使用 Server-Sent Events (SSE)
    - 实现打字机效果

---

### 2. 上下文管理

**优先级**: 🟡 中  
**状态**: 未开始

#### 功能说明

- 维护对话历史
- 实现上下文理解
- 支持多轮对话
- 控制上下文长度（防止超出 token 限制）

#### 技术实现

```javascript
class ContextManager {
    constructor(maxTokens = 8000) {
        this.maxTokens = maxTokens;
        this.history = [];
    }

    addMessage(role, content) {
        this.history.push({ role, content, timestamp: Date.now() });
    }

    getContextForLLM() {
        // 智能截取，保持重要上下文
        const context = [];
        let currentTokens = 0;

        for (const msg of this.history.reverse()) {
            const msgTokens = this.estimateTokens(msg.content);
            if (currentTokens + msgTokens > this.maxTokens) break;
            context.unshift(msg);
            currentTokens += msgTokens;
        }

        return context;
    }
}
```

---

### 3. 知识库检索增强（RAG）

**优先级**: 🟡 中  
**状态**: 未开始

#### 功能说明

- 结合知识库内容回答问题
- 引用来源和参考
- 提高回答准确性

#### 技术实现

```javascript
class RAGService {
    async retrieveRelevantDocs(query) {
        // 1. 向量化查询
        const queryEmbedding = await this.embedQuery(query);

        // 2. 向量检索
        const relevantDocs = await this.vectorStore.search(queryEmbedding, {
            topK: 5,
            similarityThreshold: 0.7,
        });

        return relevantDocs;
    }

    async generateAnswerWithContext(query) {
        const context = await this.retrieveRelevantDocs(query);
        const prompt = this.buildPrompt(query, context);
        return await this.llm.chat(prompt);
    }
}
```

---

### 4. 快捷问题推荐

**优先级**: 🟢 低  
**状态**: 已完成基础

#### 当前实现

- 硬编码的快捷问题

#### 优化方向

- 基于知识库热门内容推荐
- 基于用户学习历史推荐
- 基于当前上下文动态推荐

---

### 5. 对话导出功能增强

**优先级**: 🟢 低  
**状态**: 已完成基础

#### 优化方向

- 支持 Markdown 格式导出
- 支持 PDF 导出
- 支持分享到其他平台

---

## 📊 开发优先级

| 功能            | 优先级 | 预估工时 | 依赖       |
| --------------- | ------ | -------- | ---------- |
| 大模型 API 集成 | 🔴 高  | 3-5天    | API Key    |
| 上下文管理      | 🟡 中  | 2-3天    | 大模型 API |
| RAG 检索增强    | 🟡 中  | 5-7天    | 知识库     |
| 流式响应        | 🟢 低  | 2-3天    | 大模型 API |
| 导出功能增强    | 🟢 低  | 1-2天    | -          |

---

## 🔧 技术选型建议

### 方案一：OpenAI GPT

**优点**:

- 效果最好
- 文档完善
- 社区活跃

**缺点**:

- 需要翻墙
- 成本较高
- 国内访问不稳定

### 方案二：Claude API

**优点**:

- 长上下文能力强
- 推理能力强

**缺点**:

- 需要翻墙
- 国内访问不稳定

### 方案三：国内大模型

**优点**:

- 国内访问稳定
- 成本较低
- 中文效果好

**缺点**:

- 效果略逊于 GPT-4
- 生态系统不完善

**推荐**:

- 开发阶段: 使用 OpenAI API
- 生产阶段: 切换到国内大模型（如通义千问、文心一言）

---

## 📝 实施计划

### Phase 1: 基础集成 (Week 1-2)

1. 申请大模型 API Key
2. 实现后端 API 路由
3. 实现前端消息发送和显示
4. 测试基本对话功能

### Phase 2: 上下文增强 (Week 3)

1. 实现对话历史管理
2. 实现上下文窗口控制
3. 测试多轮对话效果

### Phase 3: RAG 集成 (Week 4-5)

1. 实现知识库检索
2. 实现上下文注入
3. 测试回答准确性

### Phase 4: 优化和完善 (Week 6)

1. 实现流式响应
2. 优化 UI/UX
3. 添加导出功能
4. 性能优化

---

## 💰 成本预估

| 项目       | 月成本估算    | 备注            |
| ---------- | ------------- | --------------- |
| OpenAI API | ¥500-2000     | 按使用量计费    |
| 向量数据库 | ¥100-300      | Qdrant/Weaviate |
| 服务器     | ¥200-500      | API 服务        |
| **合计**   | **¥800-2800** | -               |

---

## ⚠️ 注意事项

1. **API 安全**
    - 不要在前端暴露 API Key
    - 使用后端代理调用
    - 实现速率限制

2. **内容安全**
    - 实现敏感词过滤
    - 添加用户举报功能
    - 记录对话日志（合规要求）

3. **用户体验**
    - 添加加载状态
    - 实现错误重试
    - 优化响应速度

4. **合规要求**
    - 遵守 AI 相关法规
    - 添加免责声明
    - 保护用户隐私

---

## 📞 联系方式

**负责人**: [待定]  
**开始时间**: [待定]  
**预计完成**: [待定]
