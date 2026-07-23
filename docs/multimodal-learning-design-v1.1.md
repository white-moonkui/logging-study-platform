# 多模式学习内容设计方案 V1.1

## 更新说明：适配监督站组织架构，支持未来扩展

---

## 核心变更

### 1. 组织架构调整

**从**：测井一队、测井二队（施工单位）
**改为**：测井监督站（监督单位）

**单位类型设计**：

```javascript
// 支持双模式
const UnitType = {
    SUPERVISION: 'supervision', // 监督站（当前使用）
    CONSTRUCTION: 'construction', // 施工队伍（未来扩展）
};
```

---

## 关键设计要点

### A. 用户模型更新

```javascript
{
  name: "张三",
  organization: {
    unitId: ObjectId,
    unitName: "测井监督站",      // 监督站
    unitType: "supervision",      // 类型
    department: "技术部",         // 科室（可选）
    position: "高级监督工程师",    // 职位
    employeeId: "WLS-2024-001"
  },
  roles: ["student"],
  permissions: {
    canSupervise: true           // 监督站特有权限
  }
}
```

### B. 权限控制策略

```javascript
// 内容可见性设置
visibility: {
  type: "unitType",              // 按单位类型
  allowedUnitTypes: ["supervision"],  // 仅监督站可见
  allowedRoles: ["student", "instructor"]
}
```

### C. 界面调整

**所有"测井一队/二队"改为"测井监督站"**

新增：

- 单位管理页面（管理员）
- 用户档案显示单位类型徽章
- 内容可见性配置

---

## 实施步骤

1. **数据库更新**（1-2天）
    - 创建 Organization 集合
    - 迁移现有用户到"测井监督站"

2. **后端 API**（2-3天）
    - 单位管理 CRUD
    - 权限检查中间件

3. **前端界面**（3-4天）
    - 更新用户信息显示
    - 添加单位管理页面
    - 更新知识库管理

4. **多模式内容**（5-7天）
    - 视频播放器
    - PDF.js 集成
    - Office 预览
    - 学习进度追踪

---

## 技术方案确认

### 存储方案：混合架构（推荐）

| 文件类型      | 存储方式       | 理由           |
| ------------- | -------------- | -------------- |
| 视频（>10MB） | 本地文件系统   | 避免数据库压力 |
| 文档（<10MB） | MongoDB GridFS | 便于权限控制   |

### 预览方案

1. **视频**：HTML5 Video + 本地流式传输
2. **PDF**：PDF.js 在线阅读
3. **Office**：Microsoft Office Online Viewer

---

## 问题确认

在实施前，请确认以下问题：

1. **监督站内部结构**：是否需要区分科室/部门？（如技术部、安全部等）

2. **证书管理**：是否需要记录监督人员的资质证书？

3. **监督检查功能**：未来是否需要对施工队伍进行监督检查记录？

4. **内容审批流程**：监督站内部的内容上传是否需要审批？

请告诉我以上问题的答案，以及是否需要调整设计方案，确认后立即开始实施！
