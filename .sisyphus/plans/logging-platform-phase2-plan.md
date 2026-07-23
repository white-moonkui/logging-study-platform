# 测井专业智能培训系统 - 第二阶段开发计划

## 概述

基于四份输入：
1. **开题报告**（三期建设目标：知识库→AIGC课程定制→学科大模型）
2. **中期汇报大纲**（已实现功能清单）
3. **代码库现状扫描**（17 models, 20 routes, 14 controllers, 1 AI service）
4. **内容源流水线**（Mac 端资料搜集 → Obsidian 同步 → AI 生成培训教材导入）

本计划覆盖第二阶段 **7 项任务**的优先级、依赖关系、实施方案和风险评估。

---

## 总体状态总览

| 模块 | 完成度 | 代码状态 | 数据状态 | 测试状态 |
|------|--------|----------|----------|----------|
| 用户模块 | 85% | Routes/Controllers/Model 全 | 无种子 | 未测试 |
| 知识管理 | 80% | CRUD 全 | 5条示例 | 未测试 |
| 考试模块 | 80% | 完整流程 | 2套考题 | 未测试 |
| 案例模块 | 75% | 交互式流程+AI评审 | 2个案例 | 未测试 |
| 学习进度 | 70% | 文件级+知识点级 | 无种子 | 未测试 |
| 报表 | 60% | 三类报表+PDF导出 | 无种子 | PDF依赖待验证 |
| AI服务 | 50% | 规则引擎 | 内联规则 | 未测试，缺大模型 |

---

## 任务 1：内容生成流水线（Mac 资料搜集 → Obsidian → AI 培训教材导入）

**优先级**：P0（内容源头，整个平台的生命线）  
**预估工时**：3-4 天（首次搭建）+ 持续维护（每次新资料 0.5-1 天）  
**依赖**：无

### 任务说明

你在 Mac 上定期搜集下载测井专业资料（论文、标准、报告、技术手册等），这些资料通过同步机制进入 Obsidian 知识库。本任务建立一条自动化流水线：

```
Mac 端搜集下载
     │
     ▼ (iCloud / Syncthing / 手动拷贝)
Obsidian 知识库 (D:\PEIHM-知识库\裴宏明的知识库\01-测井专业\)
     │
     ▼ (AI 内容生成器)
培训教材生成
 ├── Knowledge 条目（知识库导入）
 ├── 考题种子（Exam 适配）
 ├── 案例素材（Case 骨架）
 └── 问答语料（Q&A 训练集）
     │
     ▼ (导入脚本)
平台数据库 (MemoryDB / MongoDB)
```

### 现有资产
- Obsidian 知识库约 2190 篇 .md，`01-测井专业/` 模块有大量测井专业笔记
- 平台 `Knowledge` 模型可接收 Markdown 内容
- `routes/knowledge.js` 有批量导入端点 `POST /api/knowledge/batch`
- `utils/localAIService.js` 可做基础的文本分析和关键词提取

### 待完成

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| 1.1 内容源接入 | 0.5天 | 确定 Mac → Obsidian 同步机制，建立知识库与培训平台的映射关系 |
| 1.2 AI 内容生成器（核心） | 2天 | 设计并实现从 Obsidian .md 笔记 → 培训教材的转换管道 |
| 1.3 批量导入适配 | 0.5天 | 将生成的教材通过平台 API 导入，支持增量更新 |
| 1.4 持续维护 SOP | 0.5天 | 建立"新资料到达 → 内容生成 → 导入"的标准操作流程 |

### 实施方案

**子任务 1.1 — 内容源接入**
- 确认 Mac ↔ Windows 同步方式（推荐 Syncthing 或 iCloud 同步盘）
- 扫描 `01-测井专业/` 子目录结构，建立分类→平台 category 映射表：

| 知识库目录 | 平台知识分类 | 适用培训模块 |
|-----------|------------|------------|
| `01-测井专业/01-测井基本原理/` | `logging-basics` | 知识点、考题 |
| `01-测井专业/02-测井解释与评价/` | `logging-interpretation` | 案例、知识点 |
| `01-测井专业/03-测井仪器与操作/` | `logging-equipment` | 操作指导、案例 |
| `01-测井专业/04-测井新技术/` | `logging-new-tech` | 知识点、问答 |
| `01-测井专业/05-地质与录井/` | `geology-mudlogging` | 案例、考题 |

**子任务 1.2 — AI 内容生成器（核心组件）**

核心 AI Pipeline — 输入一篇 .md 笔记，输出多类培训教材：

```javascript
// 内容生成管线（伪代码）
async function generateTrainingContent(markdownNote) {
  // Step 1: 解析笔记结构
  const { title, tags, category, sections } = parseMarkdown(markdownNote);
  
  // Step 2: 生成 Knowledge 条目
  const knowledge = {
    title,
    category: mapCategory(category),
    keywords: tags,
    content: markdownNote,        // 完整 Markdown 保留
    hasQuiz: sections.length > 2, // 内容丰富的笔记自动标记可出题
    source: "obsidian",
    sourcePath: relativePath      // 溯源
  };
  
  // Step 3: 智能提取考题（若内容含知识点）
  const questions = extractQuestions(markdownNote);
  // 提取策略：识别定义句→单选，识别分类/对比→多选，识别数据→填空
  // 使用 localAIService 的规则引擎
  
  // Step 4: 生成案例骨架（若内容含实际案例描述）
  const caseSkeleton = buildCaseSkeleton(markdownNote);
  // 从"现场实例""案例分析""应用案例"等小节提取
  
  // Step 5: 生成问答语料
  const qaPairs = extractQAPairs(markdownNote);
  // 从"常见问题""疑难点"等小节提取
  
  return { knowledge, questions, caseSkeleton, qaPairs };
}
```

**输出格式 — Knowledge 条目**：
```json
{
  "title": "自然伽马测井原理及应用",
  "category": "logging-basics",
  "keywords": ["自然伽马", "GR", "放射性测井", "泥质含量"],
  "content": "# 自然伽马测井\n\n## 基本原理\n...（完整笔记内容）",
  "hasQuiz": true,
  "metadata": {
    "source": "obsidian",
    "sourcePath": "01-测井专业/01-测井基本原理/自然伽马测井.md",
    "generatedAt": "2026-07-08",
    "aiVersion": "pipeline-v1"
  }
}
```

**子任务 1.3 — 批量导入适配**
- 利用已有 `POST /api/knowledge/batch` 批量写入
- 增量更新策略：按 `sourcePath` 去重，MD5 比对 content 判断更新
- 导入后自动触发考题种子写入 `seed/questions.json`（供 Task 4 考试模块使用）

**子任务 1.4 — 持续维护 SOP**
- 新建 `scripts/content-pipeline/` 目录，包含：
  - `sync-from-obsidian.js` — 增量扫描新/变更笔记
  - `generate-knowledge.js` — AI 生成 Knowledge 条目
  - `generate-questions.js` — 考题提取
  - `import-to-platform.js` — 调用 API 导入
- 建立"一鍵运行"脚本 `npm run content-sync`

### 与后续任务的关系

```
Task 1 (内容生成流水线)
    │
    ├──→ Task 2 (教材导入) — 接收生成的 Knowledge 条目
    ├──→ Task 3 (案例编写) — 接收生成的案例骨架，人工完善
    ├──→ Task 4 (考试模块) — 接收提取的考题种子
    └──→ Task 6 (问答模块) — 接收 QA 语料作为训练基础
```

### 风险
- **中风险**：Mac ↔ Windows 同步不稳定 → 兜底：手动拷贝 + 增量导入脚本支持单文件导入
- **中风险**：AI 生成内容质量参差不齐 → 设计"草稿/已审核"状态标记，人工审核后再发布
- **低风险**：笔记 frontmatter 不统一 → 解析器带容错 + 默认值兜底

---

## 任务 2：单项培训教材导入和测试

**优先级**：P0（基础模块，其他任务依赖内容）  
**预估工时**：2-3 天  
**依赖**：无

### 现有资产
- `models/Knowledge.js` — schema 完整（title, category, keywords, content, version, hasQuiz, relatedKnowledgeIds）
- `routes/knowledge.js` — CRUD + 批量导入 + 关键词搜索
- `seed/knowledge.js` — 5 条示例数据（测井基础、解释、地质等）

### 待完成

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| 1.1 数据迁移脚本 | 1天 | 从 Obsidian 知识库 (`D:\PEIHM-知识库\裴宏明的知识库\01-测井专业/`) 提取.md → 解析 frontmatter + content → 通过 POST /api/knowledge/batch 导入 |
| 1.2 导入验证 | 0.5天 | 导入后校验：完整性检查、分类统计、重复检测 |
| 1.3 导入报告输出 | 0.5天 | 生成导入结果报表（成功/失败/跳过条目数） |
| 1.4 功能测试 | 0.5天 | 测试 CRUD、搜索、分类筛选、分页 |

### 实施方案

**Phase A — 数据摸底**（0.5天）
- 扫描 `01-测井专业/` 目录结构，识别子分类
- 分析 frontmatter 格式一致性
- 输出待导入清单

**Phase B — 迁移脚本**（1天）
```javascript
// 核心逻辑示意
- 读取所有 .md 文件
- 解析 frontmatter (tags → keywords, title, category)
- content 保留完整 Markdown
- POST /api/knowledge/batch
```
前端新建 `ImportTool.vue` 页面，支持：
- 拖拽文件/文件夹
- 导入进度条
- 冲突处理策略（跳过/覆盖/新建版本）

**Phase C — 验证**（0.5天）
- 导入后 `GET /api/knowledge` 验证数量/分类
- `GET /api/knowledge/search` 验证搜索
- `GET /api/knowledge/:id` 验证内容完整性

### 风险
- **中风险**：源文件 frontmatter 格式不统一 → 需预处理/容错
- **低风险**：大量文件一次导入超时 → 分批导入，每批 50 条

---

## 任务 3：交互式案例编写，导入和功能测试

**优先级**：P0（核心培训功能）  
**预估工时**：3-4 天  
**依赖**：任务 2（案例引用知识条目）

### 现有资产
- `models/Case.js` — schema 完整（interactiveSteps: [{title, content, question, options, correctAnswer, explanation, hints}], aiInnovation, reviewWorkflow）
- `routes/cases.js` — 全部路由（CRUD + interactive: start/submit/complete + aiEvaluate + review）
- `controllers/caseController.js` — 完整实现
- `seed/cases.js` — 2 个示例（一个简单，一个交互式）

### 待完成

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| 3.1 案例编辑器 | 1.5天 | 前端案例管理页面：新建/编辑案例、步骤管理（拖拽排序）、题目配置、关联知识点 |
| 3.2 真实案例编写 | 1天 | 编写 5-8 个测井专业真实案例（含交互式步骤） |
| 3.3 案例导入工具 | 0.5天 | 支持 JSON/Markdown 格式导入 |
| 3.4 交互流程端到端测试 | 0.5天 | 测试 start→submit step→complete→result 全流程 |
| 3.5 AI评审测试 | 0.5天 | 测试 `POST /api/cases/:id/evaluate` 的结果质量 |

### 实施方案

**优先编写案例领域**（来自 Obsidian 知识库已有内容）：
1. 测井解释中的砂泥岩识别
2. 碳酸盐岩储层评价
3. 测井曲线质量控制
4. 测井与地质结合的层位对比
5. 复杂岩性识别

### 交互式案例格式（JSON）：
```json
{
  "title": "砂泥岩测井解释案例",
  "knowledgeRefs": ["knowledge_id_1"],
  "difficulty": "intermediate",
  "interactiveSteps": [
    {
      "title": "观察测井曲线",
      "content": "以下是一段砂泥岩剖面的测井曲线...",
      "imageUrl": "/api/files/curve1.png",
      "question": "该层段的自然伽马值范围是多少？",
      "options": ["30-50 API", "50-80 API", "80-120 API", "120-150 API"],
      "correctAnswer": 1,
      "explanation": "砂岩储层自然伽马值一般在50-80 API范围内..."
    }
  ]
}
```

### 风险
- **中风险**：交互式案例需要高质量教学内容和领域专家知识 → 从知识库已有笔记提取骨架
- **低风险**：AI评审结果不稳定 → 规则引擎 + 人工复审双轨机制已存在

---

## 任务 4：考试模块功能测试与完善

**优先级**：P0（核心评估功能）  
**预估工时**：2-3 天  
**依赖**：任务 2（AI生成考题需知识库导入）

### 现有资产
- `models/Exam.js` — 完整（questions:[], passingScore, maxAttempts, timeLimit, shuffleQuestions, showResults）
- `models/ExamResult.js` — 完整（answers, score, passed, abilityDelta）
- `routes/exams.js` — 完整（CRUD + start/submit/grade + smart-generate）
- `controllers/examController.js` — 完整（含自动批改、能力矩阵更新、AI智能出题）

### 待完成

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| 4.1 出题规则配置 | 0.5天 | 前端出题规则配置（题型分布、难度比例、题数、知识点范围） |
| 4.2 AI出题测试 | 0.5天 | 测试 `POST /api/exams/smart-generate` 生成的题目质量 |
| 4.3 考试流程测试 | 0.5天 | 创建→引用考题→学员考试→提交→批改→评分→查看结果 |
| 4.4 客观题自动批改验证 | 0.5天 | 验证单选/多选/判断/填空的批改准确性 |
| 4.5 主观题批改 | 0.5天 | 设计主观题人工批改流程（教师端阅卷页面） |
| 4.6 能力矩阵更新验证 | 0.25天 | 考试→能力增量→更新用户能力矩阵 全链路 |

### 关键检查点
- `autoGrade` 函数的 type 处理：single_choice ✅, multiple_choice ✅, true_false ✅, fill_blank ✅（需要字符），essay → 0 分需人工批改
- 能力矩阵更新逻辑：`updateAbilityMatrix` 在 `examController.js:250` 左右 → 需验证 5 维度的增量计算
- 重考逻辑：`maxAttempts` 限制 + `remainingAttempts` 计算 → 需验证

### 风险
- **中风险**：AI生成题目质量不可控 → 规则模板 + 人工审核后再发布
- **低风险**：填空题型匹配过于严格 → 增加模糊匹配/同义词支持

---

## 任务 5：用户培训结果评估模块

**优先级**：P1（需等待数据积累）  
**预估工时**：2 天  
**依赖**：任务 2、3、4（需要知识、案例、考试数据）

### 现有资产
- `models/Report.js` — schema 完整（type: training/assessment/comprehensive, filters, summary, sections, exportUrl）
- `controllers/reportController.js` — 三类报表生成逻辑
- `routes/reports.js` — CRUD + 导出 PDF
- `services/reportExportService.js`（需确认是否存在）

### 待完成

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| 5.1 评估数据提取 | 0.5天 | 从 ExamResult + LearningProgress + CaseResult 汇总数据 |
| 5.2 评估报告生成 | 0.5天 | 综合评分/雷达图/薄弱环节分析/横向对比 |
| 5.3 PDF导出 | 0.5天 | 验证 pdfService 是否可用，修复依赖 |
| 5.4 再培训方案生成 | 0.5天 | 基于薄弱环节自动推荐知识条目/案例/考题 |

### 再培训方案逻辑
```javascript
// 薄弱环节检测 → 知识推荐（伪代码）
function generateRetrainingPlan(userId) {
  const weaknesses = analyzeWeaknesses(userAbilityMatrix);
  return weaknesses.map(w => ({
    dimension: w.dimension,
    score: w.score,
    recommended: {
      knowledge: findKnowledgeByCategory(w.dimension),
      cases: findCasesByDimension(w.dimension),
      exam: generateFocusedExam(w.dimension)
    }
  }));
}
```

### 风险
- **高风险**：PDF 导出服务 `pdfService` 可能未实现或依赖缺失 → 兜底方案：返回 HTML 预览 + 前端打印
- **中风险**：评估报告在数据量少时意义不大 → 设计"数据不足"提示

---

## 任务 6：问答式案例支持模块

**优先级**：P1（需要知识库支撑）  
**预估工时**：3 天  
**依赖**：任务 2（知识库导入）

### 现有资产
- `routes/ai-analysis.js` — 基本问答（提取关键词→搜索知识→返回结果）
- `routes/ai-recommendations.js` — 个性化推荐
- `utils/localAIService.js` — 规则引擎 + 关键词匹配
- `models/ConversationHistory.js` — 对话历史存储

### 待完成

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| 6.1 Agent 架构设计 | 0.5天 | System Prompt + 工具调用 + 知识检索策略 |
| 6.2 提示词模板体系 | 1天 | 分场景提示词（案例分析、概念解释、操作指导、错误排查） |
| 6.3 知识检索增强 | 0.5天 | 关键词→全文搜索→语义排序结果 |
| 6.4 对话管理 | 0.5天 | 上下文维护、多轮对话支持 |
| 6.5 准确性测试 | 0.5天 | 预设问答集 + 人工评分 + 迭代优化 |

### Prompt 模板设计要点
```
系统角色: 测井专业培训助教
核心约束:
1. 基于知识库回答，不编造
2. 不确定时引导查证
3. 结合案例解释概念
4. 主动提问促思考

场景模板:
- scenario: "concept_explain" → 定义 + 现场应用 + 常见问题
- scenario: "case_analysis" → 数据呈现 → 引导观察 → 得出结论
- scenario: "error_troubleshoot" → 现象描述 → 可能原因 → 排查步骤
```

### 风险
- **高风险**：当前无大模型 API 连接 → 只能靠规则引擎 + 知识检索，体验受限
- **中风险**：无语义搜索能力 → 关键词匹配可能遗漏相关内容

---

## 任务 7：用户模块功能测试

**优先级**：P2（已可工作，只需验证）  
**预估工时**：1 天  
**依赖**：无

### 现有资产
- `models/User.js` — 完整（3 roles + learningProgress + abilityMatrix + profile）
- `routes/users.js` — CRUD + stats + profile
- `controllers/userController.js` — 完整

### 待完成

| 子任务 | 工作量 | 说明 |
|--------|--------|------|
| 7.1 用户CRUD测试 | 0.25天 | 注册/登录/信息更新/删除 |
| 7.2 角色权限测试 | 0.25天 | student/instructor/admin 三种角色的权限隔离 |
| 7.3 能力矩阵展示 | 0.25天 | 前端能力雷达图、学习进度可视化 |
| 7.4 用户统计 | 0.25天 | `GET /api/users/stats` 功能验证 |

### 风险
- **无显著风险**，已有代码成熟度高

---

## 执行路线图

```
Week 1              Week 2              Week 3
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Task 1       │───│→ (持续运行)  │───│→ (持续运行)  │
│ 内容流水线   │   │ 增量同步     │   │ 增量生成     │
├──────────────┤   ├──────────────┤   ├──────────────┤
│ Task 2       │   │ Task 4       │   │ Task 6       │
│ (导入)       │   │ (考试)       │   │ (问答)       │
├──────────────┤   ├──────────────┤   ├──────────────┤
│ Task 3       │   │ Task 5       │   │ Task 7       │
│ (案例)       │   │ (评估)       │   │ (测试)       │
└──────────────┘   └──────────────┘   └──────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
    里程碑1            里程碑2            里程碑3
  内容流水线建成      考试+评估闭环      问答Agent上线
  + 首批教材导入      功能验证通过       全系统稳定
```

### 建议执行顺序

```
贯穿全周期 (Week 1-3):
  Task 1 → 内容生成流水线搭建 → 持续运行（每次新资料触发生成+导入）

Phase 1 (Week 1): 基础建设
  Task 2 → 导入知识库内容（为所有模块提供素材）
  Task 3 → 编写案例（可并行进行案例设计，从Task 1生成的案例骨架开始）

Phase 2 (Week 2): 核心功能完善
  Task 4 → 考试流程测试完善（考题种子来自Task 1的考题提取）
  Task 5 → 评估 + 再培训方案（需要考试数据）

Phase 3 (Week 3): 高阶功能 + 收尾
  Task 6 → 问答式案例（知识库+语料已就绪）
  Task 7 → 用户模块测试（可随时穿插进行）
```

---

## 建议的当前优先事项

1. **立即开始** — Task 1（内容生成流水线是平台生命线，源头必须先打通）
2. **同时启动** — Task 2（教材导入）+ Task 1.2（AI内容生成器）一起推进
3. **并行** — Task 7 用户模块测试（零依赖，可利用碎片时间）
4. **Day 2-3** — Task 3 案例编写（从Task 1生成的案例骨架开始人工完善）
5. **Day 3-4** — Task 4 考试模块验证（考题种来自Task 1的考题提取）
6. **Day 5-6** — Task 5 评估 + Task 6 问答模块

---

## 附录：代码库关键文件索引

| 领域 | 文件路径 | 状态 |
|------|----------|------|
| 用户 | `models/User.js`, `routes/users.js`, `controllers/userController.js` | ✅ 完整 |
| 知识 | `models/Knowledge.js`, `routes/knowledge.js`, `controllers/knowledgeController.js` | ✅ 完整 |
| 考试 | `models/Exam.js`, `models/ExamResult.js`, `routes/exams.js`, `controllers/examController.js` | ✅ 完整 |
| 案例 | `models/Case.js`, `routes/cases.js`, `controllers/caseController.js` | ✅ 完整 |
| 进度 | `models/LearningProgress.js`, `controllers/learningController.js` | ⚠️ 缺路由？ |
| 报表 | `models/Report.js`, `controllers/reportController.js`, `routes/reports.js` | ⚠️ PDF待验证 |
| AI | `utils/localAIService.js`, `utils/aiService.js`, `routes/ai-analysis.js` | ⚠️ 规则引擎 |
| 数据 | `database/seed.js` (6 个 seed 文件) | ✅ 有示例 |
| API | `routes/index.js` | 自动注册所有路由 |

## 附录：开题报告三期目标 vs 当前计划对照

| 开题报告阶段 | 对应任务 | 备注 |
|-------------|----------|------|
| 一期：专业知识库 + 智能搜索 | Task 1 + Task 2 | 内容流水线持续供给 → 教材导入 |
| 二期：AIGC 课程定制 + 交互式案例 | Task 3 + Task 4 | 案例/考试/AI赋能已有基础 |
| 三期：训练大模型 | Task 6 | 问答 Agent 为前序，大模型需后期接入 |
| — | Task 5 + Task 7 | 评估报告 + 用户管理贯穿全期 |

## 附录：任务总览表

| 编号 | 任务 | 优先级 | 工时 | 核心交付 |
|------|------|--------|------|----------|
| **Task 1** | 内容生成流水线（Mac→Obsidian→AI→平台） | P0 | 3-4天+持续 | AI内容生成器、增量同步脚本、SOP |
| **Task 2** | 单项培训教材导入和测试 | P0 | 2-3天 | 批量导入、验证、报告 |
| **Task 3** | 交互式案例编写，导入和功能测试 | P0 | 3-4天 | 案例编辑器、5-8个真实案例 |
| **Task 4** | 考试模块功能测试与完善 | P0 | 2-3天 | 全流程验证、AI出题、批改 |
| **Task 5** | 用户培训结果评估模块 | P1 | 2天 | 评估报告、PDF导出、再培训方案 |
| **Task 6** | 问答式案例支持模块 | P1 | 3天 | Agent架构、提示词模板、准确率测试 |
| **Task 7** | 用户模块功能测试 | P2 | 1天 | CRUD、权限、能力矩阵验证 |

**总工时：16-20天 + 持续运维**
