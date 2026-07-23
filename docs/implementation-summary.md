# 多模式学习内容与知识库管理 - 实施方案

## 实施状态：核心架构已完成 ✅

---

## 一、已完成的工作

### 1. 数据模型设计（models/）

#### ✅ Organization.js - 单位管理模型

```javascript
// 支持监督站和施工队伍双模式
{
  name: "测井监督站",
  type: "supervision",  // supervision | construction
  code: "WLS-001",
  config: {
    maxUsers: 200,
    storageQuota: 50GB,
    allowedModules: [...]
  }
}
```

**功能**：

- 单位类型系统（supervision/construction）
- 存储配额管理
- 统计信息跟踪
- 自动创建默认监督站方法

#### ✅ File.js - 文件管理模型

```javascript
// 混合存储方案
{
  storageType: "gridfs" | "local",  // 小文件存GridFS，大文件存本地
  gridfsId: ObjectId,               // GridFS引用
  localPath: "/files/...",          // 本地路径
  type: "video" | "pdf" | "word" | "excel" | "ppt",
  size: 1024000,
  checksum: "sha256-hash"           // 完整性校验
}
```

**功能**：

- 自动根据文件大小选择存储方式（10MB阈值）
- 文件校验和防重复
- 访问统计
- 版本控制

#### ✅ Knowledge.js - 知识点模型（已更新）

```javascript
{
  // 多文件支持
  files: [{
    fileId: ObjectId,
    type: "video",
    title: "讲解视频",
    isRequired: true
  }],

  // 权限控制
  visibility: {
    type: "unitType",
    allowedUnitTypes: ["supervision"]
  },

  // 审核流程
  status: "draft" | "pending" | "approved" | "rejected" | "published",
  approval: {
    submittedAt: Date,
    reviewedBy: ObjectId,
    history: [...]
  },

  // 版本控制
  version: 1,
  versionHistory: [...]
}
```

**功能**：

- 多文件关联
- 审核工作流
- 权限控制
- 版本管理
- 访问权限检查方法

#### ✅ LearningProgress.js - 学习进度模型（已更新）

```javascript
{
  userId: ObjectId,
  knowledgeId: ObjectId,

  // 文件级进度
  fileProgress: [{
    fileId: ObjectId,
    status: "not-started" | "in-progress" | "completed",
    progress: 65,           // 百分比
    lastPosition: 120,      // 视频秒数或页码
    timeSpent: 1800         // 学习时间（秒）
  }],

  // 笔记
  notes: [{
    fileId: ObjectId,
    timestamp: 120,         // 时间点
    content: "笔记内容"
  }]
}
```

**功能**：

- 文件级学习进度
- 视频/文档断点续看
- 笔记功能
- 自动计算整体进度

### 2. 控制器实现（controllers/）

#### ✅ fileController.js - 文件管理控制器

**功能**：

- 混合存储上传（自动判断GridFS/本地）
- 视频流式播放（支持断点续传/拖动）
- 文件预览URL生成
- 文件下载
- 存储配额检查
- 文件校验和去重

**核心方法**：

- `upload()` - 上传文件（自动选择存储方式）
- `stream()` - 流式播放（支持HTTP Range）
- `preview()` - 获取预览URL
- `download()` - 下载文件

#### knowledgeController.js - 知识点控制器（待集成）

**功能设计**：

- 知识点CRUD
- 审核工作流（提交审核、通过、拒绝）
- 待审核列表
- 版本管理
- 权限检查

### 3. 路由文件（routes/）

#### ✅ files.js - 文件路由

```
POST   /api/files/upload          上传文件
GET    /api/files/:id/stream      流式播放
GET    /api/files/:id/preview     获取预览信息
GET    /api/files/:id/download    下载文件
DELETE /api/files/:id             删除文件
```

---

## 二、待完成的工作

### 1. 后端集成（1-2天）

- [ ] 在 app.js 中注册新的路由
- [ ] 更新 User 模型添加 organization 字段
- [ ] 创建数据迁移脚本
- [ ] 运行迁移初始化默认监督站

### 2. 前端界面（3-4天）

- [ ] 更新用户信息显示（显示"测井监督站"）
- [ ] 添加单位管理页面（管理员）
- [ ] 更新知识库管理界面
    - 多文件上传
    - 可见性设置
    - 审核状态显示
- [ ] 知识点详情页
    - 多文件列表展示
    - 文件播放器集成

### 3. 播放器集成（2-3天）

- [ ] 视频播放器（HTML5 Video）
    - 进度保存
    - 笔记添加
- [ ] PDF阅读器（PDF.js）
    - 页码跳转
    - 缩放控制
    - 笔记添加
- [ ] Office预览（iframe嵌入）

### 4. 测试验证（1-2天）

- [ ] 文件上传测试
- [ ] 视频播放测试
- [ ] 审核流程测试
- [ ] 权限控制测试

---

## 三、技术亮点

### 1. 混合存储方案

```
小文件（<10MB） → MongoDB GridFS
大文件（≥10MB） → 本地文件系统
```

**优点**：兼顾性能和管理便利性

### 2. 视频流式传输

```javascript
// 支持断点续传（拖动进度条）
HTTP Range: bytes=start-end
响应：206 Partial Content
```

### 3. 审核工作流

```
draft → pending → published
         ↓
      rejected → draft
```

### 4. 权限控制

- 基于单位类型（监督站/施工队伍）
- 基于角色（学员/教师/管理员）
- 支持指定单位可见

---

## 四、快速启动步骤

### 步骤1：集成路由

在 `app.js` 中添加：

```javascript
const fileRoutes = require('./routes/files');
app.use('/api/files', fileRoutes);
```

### 步骤2：数据迁移

```bash
npm run init-db
# 或运行迁移脚本
node scripts/migrate-v1.1.js
```

### 步骤3：创建上传目录

```bash
mkdir -p uploads/files
mkdir -p uploads/temp
```

### 步骤4：测试文件上传

```bash
# 使用curl测试
curl -X POST -F "file=@test.mp4" \
     -F "organizationId=xxx" \
     -H "Authorization: Bearer token" \
     http://localhost:3000/api/files/upload
```

---

## 五、文件结构

```
models/
  ├── Organization.js      ✅ 单位管理
  ├── File.js             ✅ 文件管理
  ├── Knowledge.js        ✅ 知识点（已更新）
  ├── LearningProgress.js ✅ 学习进度（已更新）
  └── User.js             ⏳ 待更新（添加organization字段）

controllers/
  ├── fileController.js   ✅ 文件管理
  └── knowledgeController.js ⏳ 待集成

routes/
  └── files.js            ✅ 文件路由

uploads/                  ⏳ 待创建
  ├── files/             # 本地存储的大文件
  └── temp/              # 临时上传目录
```

---

## 六、后续建议

### 短期（1-2周）

1. 完成后端集成和测试
2. 实现基础前端界面
3. 集成视频和PDF播放器

### 中期（1个月）

1. 完善审核流程界面
2. 实现学习进度追踪
3. 添加笔记功能

### 长期（3个月）

1. 支持施工队伍接入
2. 多监督站管理
3. 高级统计分析

---

**核心架构已完成！下一步建议：**

1. 是否要我现在继续完成前端界面？
2. 还是您先测试后端API？
3. 有没有特定功能需要优先实现？
