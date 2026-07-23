# 项目进度报告 - 2026-07-17

## 已完成的阶段

### Phase 1 — BUG 修复（progressController）
- `req.user.id` → `req.userId`（所有路由）
- schema 字段名修正：`user`→`userId`, `knowledge`→`knowledgeId`, `files`→`fileProgress`
- aggregate 查询修正
- 涉及文件：`controllers/progressController.js`

### Phase 2 — 学习心跳
- `POST /api/progress/:knowledgeId/heartbeat` — 每次调用增加 30s 学习时长
- 涉及文件：`controllers/progressController.js`

### Phase 3 — 权限加固
- 公共 GET 路由添加 `optionalAuth`（未登录可浏览）
- POST/PUT/DELETE 添加 `requireRole(['admin', 'instructor'])` 保护
- 涉及文件：`middleware/auth.js`, `routes/knowledge.js`, `routes/cases.js`, `routes/exams.js`, `routes/progress.js`

### Phase 4 — PDCA 闭环（核心交付）
- **四个子阶段全部完成**：
  - P(计划)：`POST /api/training-cycles/start` 创建培训周期
  - D(执行)：考试系统（已有）
  - C(检查)：`POST /training-cycles/:id/evaluate` 差距分析（4 维度：基础知识/标准规范/交叉知识/综合能力）
  - A(改进)：`POST /training-cycles/:id/remediate` 补学计划 + `POST /training-cycles/:id/retest` 复测闭环
- 模型：`models/TrainingCycle.js`
- 控制器：`controllers/trainingCycleController.js`
- 路由：`routes/training-cycles.js`
- 报表：`controllers/reportController.js` — `GET /api/reports/training-effect`

### memoryDB 兼容性修复（衍生工作）
- `this` 上下文丢失 → 提取模块级函数
- 类型不匹配 → `String()` 显式转换
- `findOne().sort()` 不支持 → `find`+`sort`+`limit(1)`
- 路由顺序 404 → `/training-effect` 移至 `/:id` 之前
- 静态方法不支持 → 内联 helper
- 子文档数组默认值 → 手动初始化 `[]`

## 测试状态

**55 个测试全部通过**：
- `tests/auth.test.js` — 15 个（注册/登录/个人信息）
- `tests/users.test.js` — 25 个（管理 CRUD/权限隔离/学习统计）
- `tests/pdca-smoke.test.js` — 16 个（PDCA 端到端冒烟，0%→100% 闭环验证）

## 下步计划

### 近期（建议优先级排序）
1. **前端 PDCA 看板页面** — 培训周期进度展示、差距可视化、补学推荐列表
2. **管理员培训效果仪表盘** — 基于 `/api/reports/training-effect` 的数据可视化
3. **补学推荐自动排课** — 根据差距维度推荐对应知识条目
4. **通知系统** — 补学任务推送、闭环提醒
5. **多周期对比分析** — 跨周期能力曲线、趋势报表

### 远期
- 考试策略引擎（自适应出题）
- 班组培训管理
- 移动端适配

## 关键文件索引

| 文件 | 说明 |
|------|------|
| `models/TrainingCycle.js` | 周期模型（状态机、差距分析、补学计划） |
| `controllers/trainingCycleController.js` | PDCA 控制器（memoryDB 兼容） |
| `routes/training-cycles.js` | 7 个路由端点 |
| `tests/pdca-smoke.test.js` | 端到端冒烟测试 |
| `controllers/reportController.js` | 培训效果报表 |
| `controllers/examController.js` | 考试能力基线记录 |
