# 测井培训系统 - AI 智能体开发规范

## 项目概述

- **技术栈**: Node.js + Express + Mongoose，纯 HTML/CSS/JS 前端，无框架，CommonJS
- **数据库**: `MONGODB_URI=memory://` 时用内存 DB（JSON 文件持久化到 `data/`），否则连 MongoDB
- **AI**: 三层降级 — 内部规则引擎（默认）→ 代理 → 外部 API
- **主入口**: `public/prototype_v6_user_mgmt.html`（路由 `/`）

---

## 关键命令

| 命令 | 实际执行 |
|------|----------|
| `npm run dev` | `nodemon start.js` |
| `npm start` | `node start.js` |
| `npm run init` / `init-db` | 调用 `dbInitializer.initialize()` |
| `npm run lint` / `lint:fix` | ESLint 10 flat config（`eslint.config.mjs`） |
| `npm run format` / `format:check` | Prettier（4空格、单引号、100宽、尾逗号） |
| `npm run gate` | `lint + format:check`（**不含**测试） |
| `npx jest` | 运行 `tests/` 下所有 `*.test.js`（仅 auth + users） |

**⚠️ `npm test` 已被移除** — 执行仅输出提示信息。运行测试用 `npx jest [file]`。

**Husky pre-commit**: `npm run lint -- --fix` → `npm run format` → `npm test`（no-op）。

---

## 必须知道的架构陷阱

### 1. 数据库适配器（dbAdapter）

所有模型通过 `utils/dbAdapter.getModel(name, schema)` 创建，不直接 `mongoose.model()`。

**内存模式（`memory://`）限制:**
- `populate()` 被记录但不执行（返回空集合）
- `select()` 被忽略
- Mongoose ObjectId 不被验证
- `toObject()` 可能不存在 — 需防御性检测: `const obj = doc._model ? doc._model : doc.toObject ? doc.toObject() : doc;`

### 2. 入口架构

- `server.js` — Express 应用工厂（配置中间件 + 注册路由），导出 `module.exports = app`
- `start.js` (ApplicationStarter 类) — 编排启动流程: DB 连接 → 数据初始化 → AI 服务 → Web 服务器
- **所有路由仅在 `server.js` 中注册**，`start.js` 不重复

### 3. 两套并行的知识管理系统

| 系统 | 存储 | 路由 | 控制器 |
|------|------|------|--------|
| MongoDB 版 | Mongoose (Knowledge/Category) | `routes/knowledge.js` | `controllers/KnowledgeController.js` |
| 文件版 | `data/knowledge_base.json` | `routes/knowledge-management.js` | 内联 KnowledgeManager Class |

### 4. JWT 认证

- Header: `Authorization: Bearer <token>`，签名 `{ userId, role }`，24h 过期
- 中间件设置 **`req.userId`** 和 **`req.userRole`**（不是 `req.user`）
- 角色: `student | instructor | admin`
- `asyncHandler` 在 `middleware/auth.js` 和 `middleware/errorHandler.js` 各有一份，功能相同

```javascript
const { authenticateToken, requireRole } = require('../middleware/auth');
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/admin-only', authenticateToken, requireRole(['admin']), handler);
```

### 5. 控制器模式两种并存

**旧风格（try/catch）** vs **新风格（asyncHandler）**，均导出单例。

---

## API 路由总览（挂载 `/api/`）

| 前缀 | 文件 | 说明 |
|------|------|------|
| `/api/auth` | `routes/auth.js` | 注册/登录/个人信息 |
| `/api/knowledge` | `routes/knowledge.js` | 知识库 CRUD + 向量搜索 + 智能出题 |
| `/api/knowledge-management` | `routes/knowledge-management.js` | 文件版知识库管理 + 批量导入（独立 multer 配置，10MB 限制） |
| `/api/cases` | `routes/cases.js` | 案例 CRUD + AI 评估 |
| `/api/exams` | `routes/exams.js` | 考试 CRUD + 开始/提交 + 智能生成 |
| `/api/users` | `routes/users.js` | 用户管理 |
| `/api/categories` | `routes/categoryRoutes.js` | 分类管理 |
| `/api/files` | `routes/files.js` | 文件上传/流式播放/预览/下载 |
| `/api/learning-categories` | `routes/learning-categories.js` | 动态页面分类 |
| `/api/learning-pages` | `routes/learning-pages.js` | 动态页面管理 |
| `/api/learning-progress` | `routes/learning-progress.js` | 学习进度 |
| `/api/ai-analysis` | `routes/ai-analysis.js` | AI 分析 |
| `/api/ai-recommendations` | `routes/ai-recommendations.js` | AI 推荐 |
| `/api/ai-recommend` | `routes/ai-recommend.js` | AI 推荐（文件上传对话版） |
| `/api/documents` | `routes/documents.js` | 文档管理 |
| `/api/knowledge-review` | `routes/knowledge-review.js` | 知识审核 |
| `/api/knowledge-interaction` | `routes/knowledge-interaction.js` | 知识互动 |
| `/api/reports` | `routes/reports.js` | 报表 |
| `/api/progress` | `routes/progress.js` | 进度（多模式学习） |
| `/api/technical-support` | `routes/technical-support.js` | 技术支持 |

---

## 数据模型（17 个，在 `models/`）

| 模型 | 集合 | 关键字段 |
|------|------|----------|
| User | users | role, profile, learningProgress（三维）, abilityMatrix（五维） |
| Knowledge | knowledge_items | categoryId, status[draft/published/pending] |
| Category | categories | name, code(unique), parentId, level |
| LearningCategory | learningcategories | parentId, level[1-4], module, status |
| LearningPage | learningpages | categoryId, pageType[video/pdf/ppt/document/text/quiz], auto slug |
| Case | cases | category, wellInfo, aiEvaluation, status workflow |
| Exam | exams | questions[single/multiple/true_false/fill_blank/essay] |
| Document | documents | filePath, extractedContent, chunks, isIndexed, soft delete |
| File | files | storageType[local/gridfs], checksum |

---

## AI 服务架构

`utils/aiService.js` — 全局单例，三层降级:

1. **`USE_LOCAL_AI=true`（默认）** → `utils/localAIService.js` 规则引擎（基于关键词匹配的 JSON 模板响应）
2. **`AI_SERVICE_PRIORITY=proxy`** → 通过代理访问外网 API
3. **`AI_SERVICE_PRIORITY=external`** → 直连 OpenAI/DeepSeek 等

LocalAIService: LRU 缓存（100 条/5min TTL），prompt ≤800 token，response ≤512 token，`init()` 始终异步 resolve 不阻塞。

---

## 错误处理

- `middleware/errorHandler.js` — `asyncHandler`（同 `auth.js` 版）+ `globalErrorHandler`（Mongoose/JWT 错误处理）+ `BusinessError` 类
- `middleware/validation.js` — 请求验证: required, type, enum, pagination, objectId

**ESLint 关键规则:**
- `no-console`: warn（测试文件 off）
- `max-lines-per-function`: warn ≥100
- `complexity`: warn ≥15
- `curly`: error all
- `no-empty`: error（不允许空 catch）
- `sourceType: 'module'` 的 flat config，但源码使用 CommonJS `require`

---

## 测试

仅 2 个测试文件，均使用 supertest + 内存数据库:

```bash
npx jest tests/auth.test.js         # 注册/登录/个人信息 CRUD
npx jest tests/users.test.js        # 管理员 CRUD、角色权限隔离、学习统计
npx jest                             # 运行全部
```

- 测试自动连接 `memory://` 数据库，种子 admin/instructor/student 三个默认用户
- 测试辅助函数在 `tests/helpers/testSetup.js`: `setupDatabase()`, `teardownDatabase()`, `loginAs(request, username, password)`
- `npm test` 已被标记为移除 — 使用 `npx jest` 替代

---

## 文件上传

`controllers/fileController.js` — multer 配置:
- 存储策略: ≤10MB → GridFS，>10MB → 本地文件系统
- 限制: 单文件 2GB，SHA256 去重
- 类型: video/mp4/webm/ogg, pdf, docx/xlsx/pptx, image/jpeg/png/gif
- 支持 range 请求流式播放（视频）

---

## Docker

- `docker-compose.yml` — 完整栈: app + python-ai（文档向量化微服务）+ Milvus + MongoDB + Attu
- `mongodb-compose.yml` — 仅 MongoDB + Mongo-Express（端口 8081）
- Python 微服务: `services/python/`

---

## 已知坑点

- CommonJS + ESLint flat config（`eslint.config.mjs`，但 `sourceType: 'module'` 下 `require` 仍正常工作）
- 内存模式下 `toObject()` 不可靠 — `_model` 属性检测优先
- `.husky/pre-commit` 中 `npm test` 是 no-op，不阻断提交
- 一些控制器用 `req.user?.id` 而非 `req.userId` — 注意不一致

## 项目进度

- **当前状态/下步计划**：`docs/PROGRESS_REPORT_2026-07-17.md`（新会话说"看进度报告"即可加载）
