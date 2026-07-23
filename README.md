# 测井专业智能培训系统

## 系统概述

基于 Node.js 构建的测井专业智能培训学习平台，集成知识库管理、案例学习、智能出题、自动判卷、能力评估等功能。**默认使用内存数据库，无需安装 MongoDB**，开箱即用。

## 主要功能

### 🎓 核心学习功能

- **基础知识学习**: 测井原理、仪器设备、现场作业等专业知识
- **专业标准学习**: API 标准、行业规范、安全操作规程
- **跨专业知识**: 测井-地质、测井-钻井、测井-物探协同知识

### 📝 智能考试系统

- **智能出题**: 基于知识库自动生成考试题目
- **自动判卷**: 客观题自动评分，主观题辅助评分
- **成绩管理**: 详细的成绩记录和统计分析
- **能力评估**: 五维能力矩阵评估和改进建议

### 📚 案例学习系统

- **案例库管理**: 典型案例收集、分类、检索
- **互动学习**: 分步骤的互动式案例学习
- **案例评估**: AI 创新度评估和专家审核
- **经验积累**: 学习过程记录和新案例生成

### 🔧 管理功能

- **用户管理**: 多角色用户权限管理
- **知识库维护**: 知识内容的创建、编辑、审核
- **系统配置**: 灵活的系统参数配置

## 技术架构

### 后端技术栈

- **Node.js 18+**: 服务器运行环境
- **Express.js**: Web 应用框架
- **MongoDB / 内存数据库**: 双模式数据存储，默认使用内存数据库（无需安装）
- **Mongoose / memoryDB 适配层**: 透明切换数据库后端
- **JWT**: 用户认证
- **Socket.io**: 实时通信
- **EJS**: 服务端模板引擎

### 前端技术栈

- **HTML5 + CSS3**: 页面结构和样式
- **JavaScript (ES6+)**: 交互逻辑
- **Chart.js**: 数据可视化
- **Bootstrap 5**: UI 组件库（本地托管）
- **Font Awesome 6**: 图标库（本地托管）

### AI 服务

- **本地规则引擎**: 内网环境默认方案，无需网络
- **可接入外部 AI**: 支持 OpenAI / DeepSeek 等 API
- **混合模式**: 自动降级和容错机制

## 快速开始

### 环境要求

- Node.js 18.0+（推荐 20.x LTS）
- 无需 MongoDB（默认使用内存数据库）

### 安装步骤

1. **获取代码**

```bash
git clone <repository-url>
cd logging-study-platform-3121
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量（可选）**

```bash
# Windows PowerShell
Copy-Item .env.example .env
# 或 Linux/Mac
cp .env.example .env
```

默认配置可直接运行，无需编辑 `.env` 文件。

4. **初始化数据**

```bash
# 导入基础知识库和分类数据
npm run init
```

5. **启动系统**

```bash
# 方式1: 使用启动脚本（推荐）
npm start

# 方式2: 直接启动
node start.js
```

6. **访问系统**

打开浏览器访问：http://localhost:3000

### 默认账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 学员 | student | student123 |

## 内网部署指南（胜利油田）

### 无需 MongoDB

系统默认使用 `memoryDB`（基于 JSON 文件存储），数据持久化到 `data/` 目录。
要切换回 MongoDB，在 `.env` 中设置：

```ini
USE_MONGO_DB=true
MONGODB_URI=mongodb://localhost:27017/well_logging_training
```

### AI 服务配置

#### 方案1: 内置规则引擎（默认，无需网络）

```ini
USE_LOCAL_AI=true
```

内置规则引擎覆盖：自动出题、判卷、能力评估、知识问答。无需任何外部依赖。

#### 方案2: 外部 AI API（若有外网条件）

```ini
USE_LOCAL_AI=false
AI_SERVICE_URL=https://api.deepseek.com/v1/chat/completions
AI_API_KEY=your_api_key_here
```

支持 OpenAI 兼容接口（DeepSeek、GPT 等）。

#### 方案3: 本地大语言模型

```bash
# 安装 Ollama（需从内网镜像源下载）
ollama pull qwen2.5:7b

# .env 配置
USE_LOCAL_AI=true
LOCAL_MODEL_PATH=/path/to/ollama/models
```

### 数据库配置

#### 内存数据库（默认）

零配置，数据文件位于 `data/` 目录，自动备份。

#### MongoDB（可选）

```bash
# 安装 MongoDB Community Server（Windows）
# 或 Linux
sudo apt-get install mongodb

# 配置 .env
USE_MONGO_DB=true
MONGODB_URI=mongodb://localhost:27017/well_logging_training
```

## 项目结构

```
├── controllers/         # 控制器
├── models/             # 数据模型
├── routes/             # 路由定义
├── middleware/         # 中间件
├── services/           # 业务服务（文档处理、AI、向量化等）
├── utils/              # 工具函数
│   ├── memoryDB.js     # 内存数据库引擎
│   ├── dbAdapter.js    # 双模式数据库适配层
│   ├── dbInitializer.js# 数据初始化器
│   ├── localAIService.js   # 本地规则引擎 AI
│   └── networkAIService.js # 外部 AI API 封装
├── public/             # 静态文件（CSS/JS/图片）
├── views/              # EJS 模板
├── data/               # 内存数据库持久化文件
├── logs/               # 日志文件
├── devtoolkit/         # 开发者工具集
├── start.js            # 入口脚本
├── server.js           # Express 应用工厂
└── package.json        # 项目配置
```

## 开发者工具

项目提供 `devtoolkit` 辅助脚本，用于日常运维：

```bash
node devtoolkit/cli.js start    # 一键启动
node devtoolkit/cli.js status   # 查看运行状态
node devtoolkit/cli.js test     # 运行测试
```

## API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/profile | 获取用户信息 |

### 知识库接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/knowledge | 获取知识列表 |
| GET | /api/knowledge/:id | 获取知识详情 |
| POST | /api/knowledge | 创建知识内容 |
| POST | /api/knowledge/:id/generate-quiz | 生成题目 |

### 分类接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 获取分类树 |
| GET | /api/categories/:id | 获取分类详情 |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/:id | 更新分类 |

### 案例接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cases | 获取案例列表 |
| GET | /api/cases/:id | 获取案例详情 |
| POST | /api/cases | 创建案例 |
| POST | /api/cases/:id/evaluate | AI 评估案例 |

### 考试接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/exams | 获取考试列表 |
| POST | /api/exams/:id/start | 开始考试 |
| POST | /api/exams/:id/submit | 提交考试 |

## 故障排除

### 1. 端口被占用

```bash
# Windows
netstat -ano | findstr :3000

# 更改端口
set PORT=3001
node start.js
```

### 2. AI 服务不可用

检查 `.env` 中的 `AI_API_KEY` 是否正确，或切换到本地 AI 模式：

```ini
USE_LOCAL_AI=true
```

### 3. 数据重置

```bash
# 清空内存数据库并重新初始化
node -e "require('./utils/memoryDB').reset()"
npm run init
```

## 安全配置

### 生产环境建议

```bash
# 设置强 JWT 密钥（建议 32 字符以上随机字符串）
JWT_SECRET=your-strong-secret-here

# 启用 HTTPS（需配置证书）
HTTPS=true
SSL_KEY_PATH=./ssl/key.pem
SSL_CERT_PATH=./ssl/cert.pem

# 限制 CORS
CORS_ORIGIN=https://yourdomain.com
```

### 数据备份

内存数据库数据位于 `data/` 目录，定期备份该目录即可：

```bash
# Windows PowerShell
Compress-Archive -Path data\* -DestinationPath backup-yyyy-MM-dd.zip
```

## 许可证

MIT License
