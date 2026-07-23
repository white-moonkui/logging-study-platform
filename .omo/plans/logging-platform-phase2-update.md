# 第二阶段工作更新方案（基于 2026-07-22 代码验证）

> 基于 `AGENTS.md`、`docs/PROGRESS_REPORT_2026-07-17.md`、`.omo/plans/logging-platform-phase2-plan.md`
> 与代码库实际交叉验证后更新。

---

## 一、验证结论速览

| 项目 | 文档声称 | 实际验证 | 状态 |
|------|---------|---------|:----:|
| 测试总数 | 55+ | 42（auth 14 + users 12 + pdca 16） | ❌ 虚标 |
| auth.test.js | 15 tests | 14 | ⚠️ -1 |
| users.test.js | 25 tests | 12 | ❌ -13 |
| pdca-smoke.test.js | 16 tests | 16 | ✅ 准确 |
| Git 提交历史 | — | 仅 1 个 commit | ⚠️ 无法追溯增量 |
| 17 个 Model | 全部存在 | 全部存在 | ✅ |
| 15 个 Controller | 全部存在 | 全部存在 | ✅ |
| Routes vs Controllers 映射 | 完整 | 基本匹配（无幽灵路由） | ✅ |

### Phase2 计划 7 项任务实际状态

| # | 任务 | 代码实际状态 | 完成度 |
|---|------|------------|:-----:|
| 1 | **内容生成流水线** | ❌ `scripts/content-pipeline/` 不存在，`package.json` 无 `content-sync` | **0%** |
| 2 | **教材导入和测试** | ❌ 无导入脚本，无迁移工具 | **0%** |
| 3 | **交互式案例** | ⚠️ Model/Routes/Controller 全（CRUD+交互+AI评审），缺前端编辑器+真实案例+测试 | **50%** |
| 4 | **考试模块测试完善** | ⚠️ Model/Routes/Controller 全（含智能出题），缺前端配置+验证测试 | **50%** |
| 5 | **培训结果评估(PDCA)** | ✅ `TrainingCycle` Model + Controller(385行) + Routes(9端点) + 16测试，闭环完整 | **100%** |
| 6 | **问答式案例** | ⚠️ `ai-analysis` 路由(366行)含内联AIAnalysisService，缺Agent架构+提示词+准确率测试 | **40%** |
| 7 | **用户模块测试** | ⚠️ Model/Routes/Controller 全，测试不完整（仅 12+14 条） | **60%** |

### 额外发现

- **AI 推荐模块**：`controllers/aiRecommendationController.js`（562行）功能完整，route 3端点注册，`models/AIRecommendation.js` **不存在**但控制器只用已有 Model（User/LearningProgress/Exam/Case/Knowledge），不一定需要独立 Model
- **学习页面系统**：`routes/learning-pages.js`（633行）独立 route 完整 CRUD + 资料管理 + 审核 + 面包屑，**无同名 controller**（逻辑在 route 内联）
- **PDCA 测试**：`pdca-smoke.test.js` 16 个端到端冒烟测试，覆盖 P→D→C→A 全闭环，真实可运行

---

## 二、剩余工作详细清单

### ✅ Task 5/6/7 已完成部分（无需再做）

| 子项 | 文件 |
|------|------|
| PDCA 后端全流程 | `models/TrainingCycle.js`, `controllers/trainingCycleController.js`, `routes/training-cycles.js` |
| 学习进度心跳 | `controllers/progressController.js` heartbeat + `routes/progress.js` |
| 权限加固 | `middleware/auth.js` (optionalAuth + loginRateLimiter) + 5 个 route 文件 |
| progressController BUG 修复 | `req.user` → `req.userId`，schema 字段修正 |
| 报表路由 | `routes/reports.js` 含 `/training-effect`, CRUD, PDF 导出 |

### ❌ 需要新建

#### Task 1：内容生成流水线（从零搭建）

| 子任务 | 交付物 | 工时 |
|--------|--------|:----:|
| 1a. 目录结构 | `scripts/content-pipeline/` + `package.json` 添加 `content-sync` script | 0.5h |
| 1b. Obsidian 笔记解析器 | `parse-obsidian.js` — 读取 .md → 解析 frontmatter + content → 结构化对象 | 1h |
| 1c. 知识条目生成器 | `generate-knowledge.js` — 结构化对象 → Knowledge 格式 + 分类映射 | 1h |
| 1d. 考题提取器 | `generate-questions.js` — 从笔记内容提取考题（localAI规则引擎） | 1h |
| 1e. 案例骨架生成器 | `generate-cases.js` — 从"案例分析"类章节提取案例骨架 | 1h |
| 1f. 批量导入器 | `import-to-platform.js` — 调用 `POST /api/knowledge/batch` 导入 | 1h |
| 1g. 一键运行脚本 | `npm run content-sync` 串联全流程 | 0.5h |
| **小计** | | **6h** |

#### Task 2：教材导入（与 Task 1 合并执行）

| 子任务 | 交付物 | 工时 |
|--------|--------|:----:|
| 2a. 映射配置 | 知识库目录 ↔ 平台分类映射表（硬编码 JSON） | 0.5h |
| 2b. 导入验证 | 导入后校验 + 重复检测 + 统计报告 | 0.5h |
| **小计** | | **1h** |

### ⚠️ 需要补全

#### Task 3：交互式案例（后端已有，补前端+测试）

| 子任务 | 交付物 | 工时 |
|--------|--------|:----:|
| 3a. 案例编辑器页面 | 前端页面：新建/编辑案例、步骤管理（拖拽排序）、题目配置 | 2h |
| 3b. 真实案例数据 | 5 个测井案例 JSON（测井解释/碳酸盐岩/曲线质量/层位对比/岩性识别） | 1h |
| 3c. 案例批量导入工具 | 支持 JSON 格式批量导入 | 0.5h |
| 3d. 交互流程 E2E 测试 | 新增测试文件 `tests/cases-interactive.test.js`（8-10 tests） | 1.5h |
| **小计** | | **5h** |

#### Task 4：考试模块验证

| 子任务 | 交付物 | 工时 |
|--------|--------|:----:|
| 4a. 考试全流程测试 | 新增测试文件 `tests/exam-flow.test.js`（创建→开始→提交→批改→评分，10-12 tests） | 2h |
| 4b. AI 出题验证 | 测试 `POST /api/exams/smart-generate` 题目质量 | 1h |
| 4c. 能力矩阵更新验证 | 测试考试→能力增量→User.abilityMatrix 全链路 | 0.5h |
| **小计** | | **3.5h** |

#### Task 6：问答式案例（补 Agent 层+测试）

| 子任务 | 交付物 | 工时 |
|--------|--------|:----:|
| 6a. 重构 AIAnalysisService | 从 route 内联类提取为 `services/aiAnalysisService.js` | 0.5h |
| 6b. 提示词模板 | 分场景模板（概念解释/案例分析/错误排查/操作指导） | 1h |
| 6c. 知识检索增强 | 关键词→知识库搜索→排序返回（复用现有 Knowledge 模型） | 1h |
| 6d. 问答准确率测试 | 新增测试文件 `tests/ai-analysis.test.js`（5-8 tests） | 1h |
| **小计** | | **3.5h** |

#### Task 7：用户模块测试补全

| 子任务 | 交付物 | 工时 |
|--------|--------|:----:|
| 7a. 补全 auth.test.js | 从 14 → 15 tests（加 1 个测试用例） | 0.5h |
| 7b. 补全 users.test.js | 从 12 → 25 tests（加 13 个：权限隔离、学习统计、分页、筛选、角色 CRUD） | 2h |
| **小计** | | **2.5h** |

### 📋 前端看板（PROGRESS_REPORT 下步计划）

| 子任务 | 交付物 | 工时 |
|--------|--------|:----:|
| F1. PDCA 看板页面 | 培训周期进度展示、差距可视化、补学推荐列表 | 2h |
| F2. 管理员培训仪表盘 | 基于 `/api/reports/training-effect` 数据可视化 | 2h |
| F3. 补学推荐自动排课 | 根据差距维度推荐知识条目 | 1h |
| **小计** | | **5h** |

---

## 三、执行路线图（明日启动）

### 执行策略

1. **串行依赖链**：Task 1 → Task 2 → (Task 3, Task 4, Task 6 可并行)
2. **Task 7 零依赖**：可随时穿插（推荐上午热身前做）
3. **前端任务**（F1-F3）最后做，或在后端任务间隙穿插

### 建议执行顺序

```
上午（9:00-12:00）
  ├── [热身] Task 7a: auth.test.js 补 1 test（15min）
  ├── [核心] Task 1a-1c: 流水线骨架 + 解析器 + 知识生成器（2h）
  └── [核心] Task 1d-1e: 考题提取器 + 案例骨架生成器（1h）

下午（13:30-17:30）
  ├── [收尾] Task 1f-1g: 导入器 + 一键脚本（1h）
  ├── [并行] Task 7b: users.test.js 补 13 tests（1.5h）
  ├── [并行] Task 3a-3b: 案例编辑器前端 + 5 个真实案例（2h）
  └── [并行] Task 4a: 考试全流程测试（1.5h）

次日上午（如继续）
  ├── [并行] Task 3c-3d: 案例导入工具 + E2E 测试（2h）
  ├── [并行] Task 4b-4c: AI 出题验证 + 能力矩阵测试（1.5h）
  ├── [并行] Task 6a-6d: 问答服务重构 + 提示词 + 测试（3h）
  └── [前端] F1-F3: PDCA 看板 + 仪表盘 + 排课（4-5h 可按需拆分）
```

### 验证标准

每个子任务完成后必须：

1. ✅ `lsp_diagnostics` 无错误
2. ✅ `npm run lint` 通过
3. ✅ 关联测试通过（`npx jest <test-file>`）
4. ✅ 全量测试不倒退（`npx jest` 总数 ≥ 42 + 新增）

### 最终验收指标

| 指标 | 目标值 |
|------|:------:|
| 测试总数 | ≥ 75（42 + 新增 33+） |
| 测试通过率 | 100% |
| Lint 通过 | `npm run gate` exit 0 |
| Task 1-7 | 全部达到可运行/已验证状态 |
| 前端看板 | PDCA 闭环可视化可用 |

---

## 四、附录：验证过程引用

验证于 2026-07-22 完成，涉及文件：

```
读取的 routes:   auth.js, exams.js, knowledge.js, cases.js, progress.js,
                training-cycles.js, reports.js, ai-analysis.js,
                ai-recommendations.js, learning-pages.js, learning-categories.js
读取的 models:   User, Knowledge, Category, Case, Exam, ExamResult,
                TrainingCycle, Report, LearningProgress, LearningPage,
                LearningCategory, File, Document
读取的 controllers: trainingCycleController (385行), progressController (398行),
                   aiRecommendationController (562行), reportController,
                   examController, caseController, knowledgeController
读取的 middleware: auth.js, validation.js, errorHandler.js
读取的 tests:    auth.test.js (14 tests), users.test.js (12 tests),
                pdca-smoke.test.js (16 tests)
```

---

*更新日期：2026-07-22 | 基于代码库实际验证*
