# 测井知识学习培训模块 — 评估与修订方案

> **编制日期**: 2026-07-20
> **状态**: 待执行（中期汇报后启动）
> **影响范围**: `public/prototype_v6_user_mgmt.html`（17272 行单文件）

---

## 一、现状总览

"测井知识学习培训"模块位于 `prototype_v6_user_mgmt.html` 中，分为 4 个子模块：

| 子模块 | 卡片数 | 详情页格式 | 媒体文件状态 | 当前代码行 |
|--------|--------|-----------|-------------|-----------|
| 测井基础理论 | 3 | 独立 detail page（text + quiz） | ❌ 无媒体区 | ~5980-6140 |
| 测井仪器设备 | 25+ 仪器 | 2 种模式（独立 detail / 通用 cat-detail） | 🟡 46 处"待接入" | ~6170-8490 |
| 测井专业标准 | 5 类标准 | JSON 动态渲染（`/data/standards.json`） | — | ~9308-9390 |
| 跨专业知识 | 4 专题 | JSON 动态渲染（`/data/cross-knowledge.json`） | — | ~9458-9519 |

**总计**: HTML 内联约 5000+ 行知识详情正文内容，17272 行单文件承载全部前端逻辑。

---

## 二、核心诊断

### 问题 1：格式不统一，缺少"参考页"标准

全模块 **只有 1 个页面** 具备完整格式：

> ✅ **过钻头测井系统**（`page-knowledge-detail-bit-system`，行 8490）

要素清单对比：

| 要素 | 过钻头测井系统 | 其他 24+ 详情页 |
|------|:------------:|:--------------:|
| 卡片文件徽章预览 (`knowledge-files-preview`) | ✅ | ❌ |
| 学习进度条 (`knowledge-progress-mini`) | ✅ | ❌ |
| 页面操作区（收藏 / 记笔记） | ✅ | ❌ |
| 知识点信息卡片（徽章 + 进度 + 描述） | ✅ | ❌ |
| 文字学习材料（带学习目标 callout） | ✅ | ✅ |
| 配套学习资料（视频 / PDF / PPT 文件卡片） | ✅ | 🟡 "待接入"占位 |
| 关联学习内容 | ✅ | 🟡 仅电法部分有 |
| 随书测验 CTA | ✅ | ✅ |

### 问题 2：46 处 "待接入" 空占位

所有仪器详情页（电法 5 + 声波 2 + 放射性 5 + 新技术 4 + 随钻 3 + 过钻头 2 + 辅助工具 3）底部的"配套学习资料"区全部显示：

```html
<span class="badge">讲解视频 · 待接入</span>
<span class="badge">技术手册 · 待接入</span>
<span class="badge">培训课件 · 待接入</span>
```

无实际文件链接，影响展示效果。

### 问题 3：17272 行单文件，维护困难

所有知识详情页的 HTML 正文内联在 `prototype_v6_user_mgmt.html` 中。按模块拆分：

- 基础理论详情：~160 行内联 HTML
- 仪器详情：~2300 行内联 HTML（25 个仪器 × 平均 90 行/个）
- JS 逻辑：~200 行（`showInstrumentDetail` / `showCatInstrumentDetail` 等）

参考已有的 `standards.json` 和 `cross-knowledge.json` 模式，正文内容应抽离为 JSON 数据文件。

### 问题 4：基础理论页面缺少媒体区

`page-basic-electric`、`page-basic-radioactive`、`page-basic-acoustic` 三个基础理论详情页仅有文字内容 + 测验 CTA，**连"待接入"的媒体占位区都没有**，是所有页面中最不完整的。

### 问题 5：测验功能全部为占位

所有"开始测验"按钮均执行 `alert('测验功能开发中，即将上线！')`，未对接实际的 `/api/knowledge/:id/generate-quiz` 后端接口。

---

## 三、修订方案

### 第一阶段：格式标准化（模板先行）

#### Step 1：定义"标准详情页模板"

以过钻头测井系统为蓝本，提炼可复用的 HTML 结构模板：

```
┌─ page-header ─────────────────────────────────────────────┐
│  [← 返回]  标题              [收藏] [记笔记]              │
├─ card: 知识点信息卡片 ────────────────────────────────────┤
│  [高级] [测井仪器设备] [过钻头仪器]           学习进度 65%│
│  过钻头测井（Through-Tubing Logging, TTL）是...          │
├─ card: 📖 文字学习材料 ───────────────────────────────────┤
│  🎯 本节学习目标                                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 💡 通俗理解：...                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│  ## 一、概述                                             │
│  ## 二、...                                              │
│  ## 三、...                                              │
│  > 要点记忆：...                                         │
│  ────                                                    │
│  [📝 随书测验]                                           │
├─ card: 🎬 配套学习资料 ──────────────────────────────────┤
│  [🎬 讲解视频] [📄 技术手册] [📊 培训课件]               │
├─ card: 🔗 关联学习内容 ──────────────────────────────────┤
│  [知识条目A] [知识条目B] [知识条目C]                      │
└───────────────────────────────────────────────────────────┘
```

#### Step 2：为每类详情页补充缺失的模板段落

| 页面组 | 需补充要素 | 工作量 |
|--------|-----------|--------|
| 基础理论 × 3 | 知识点信息卡片 + 配套学习资料 + 关联学习内容 | ~60 行/页 |
| 仪器详情 × 20+ | 知识点信息卡片（含学习进度）+ 替换"待接入"为实际文件 | ~40 行/页 |
| 标准 / 跨知识 | 评估是否统一模板（目前 JSON 驱动，格式独立） | 待评估 |

---

### 第二阶段：内容抽取（维护性重构）

#### Step 3a：抽取媒体文件配置为 JSON（推荐最小方案）

```javascript
// data/knowledge-media.json
{
  "instr-resistivity": {
    "video": { "url": "/media/resistivity-intro.mp4", "title": "普通电阻率测井原理讲解" },
    "pdf":   { "url": "/media/resistivity-handbook.pdf", "title": "普通电阻率测井技术手册" },
    "ppt":   { "url": "/media/resistivity-training.pptx", "title": "普通电阻率测井培训课件" }
  },
  "instr-lateral": { ... },
  // ... 覆盖全部 25+ 仪器
}
```

优势：
- 不动现有 `showInstrumentDetail` / `showCatInstrumentDetail` 逻辑
- 只需修改"配套学习资料"区的渲染方式（从硬编码到动态读取）
- 后续接入实际文件只需改 JSON 路径，不动 HTML

#### Step 3b：抽取正文内容为 JSON（推荐大重构）

```
data/
├── knowledge-content.json    # 所有知识详情正文
├── knowledge-media.json      # 所有知识媒体文件配置
└── knowledge-related.json    # 关联知识关系图
```

参考已有模式：
- `standards.json` — 标准详情动态渲染（行 15635-15708）
- `cross-knowledge.json` — 跨专业知识动态渲染（行 15599-15627）

此方案可消除 ~5000 行内联 HTML，但需要重构导航函数（`showInstrumentDetail` / `showCatInstrumentDetail` → 统一的数据驱动渲染函数）。

---

### 第三阶段：功能增强

#### Step 4：卡片级文件徽章

```html
<div class="knowledge-files-preview">
  <span class="file-badge file-video"><i class="fas fa-video"></i> 视频</span>
  <span class="file-badge file-pdf"><i class="fas fa-file-pdf"></i> PDF</span>
  <span class="file-badge file-ppt"><i class="fas fa-file-powerpoint"></i> PPT</span>
</div>
```

- 应用于所有知识卡片（基础理论 × 3 + 仪器子分类卡片 × 7 + 子卡片 × 25+）
- 徽章显示依据 `knowledge-media.json` 中是否存在对应媒体文件
- 无文件的卡片不显示徽章区（避免空占位）

#### Step 5：学习进度条

- 基于 `localStorage` 存储每个知识点的完成状态
- 首次访问进度 0%，点击"完成学习"后更新
- 卡片级迷你进度条与详情页内进度条联动
- 参考过钻头测井系统已有实现（行 8559-8572）

#### Step 6：测验功能对接后端

- 替换所有 `alert('开发中')` 为实际 API 调用
- 后端接口已存在：`POST /api/knowledge/:id/generate-quiz`
- 与考试模块风格统一（选择题 / 判断题格式）

---

## 四、工作量估算

| 阶段 | 任务 | 涉及文件 | 估时 |
|------|------|---------|------|
| S1-1 | 定义模板 JS 组件（复用过钻头样式） | `prototype_v6_user_mgmt.html` | 2h |
| S1-2 | 基础理论 3 页补全模板 | `prototype_v6_user_mgmt.html` | 1h |
| S1-3 | 仪器 20+ 页统一配套资料区 | `prototype_v6_user_mgmt.html` | 2h |
| S2-a | 创建 `knowledge-media.json` + 渲染逻辑改造 | `prototype_v6_user_mgmt.html` + 新建 | 2h |
| S2-b | 创建 `knowledge-content.json` + 导航重构 | `prototype_v6_user_mgmt.html` + 新建 | 4h |
| S3-1 | 卡片级文件徽章（有文件才显示） | `prototype_v6_user_mgmt.html` | 1.5h |
| S3-2 | 学习进度条（localStorage 联动） | `prototype_v6_user_mgmt.html` | 2h |
| S3-3 | 测验对接后端 | `prototype_v6_user_mgmt.html` + route | 1.5h |
| **合计** | **完整方案** | | **~16h** |

### 分阶段交付建议

| 交付物 | 内容 | 估时 |
|--------|------|------|
| **Quick Win（2h）** | S1-1 + S1-2（模板 + 基础理论补全） | 2h |
| **MVP（6h）** | Quick Win + S2-a + S3-1（媒体配置 + 徽章） | 6h |
| **完整版（16h）** | MVP + S2-b + S3-2 + S3-3 | 16h |

---

## 五、风险与注意事项

1. **数据驱动重构的兼容风险** — 现有 `showInstrumentDetail` 和 `showCatInstrumentDetail` 两套导航逻辑，需确保重构后所有内部跳转（`onclick="showInstrumentDetail('lateral')"` / "关联学习"链接）正确映射
2. **`toObject()` 不可靠** — 如果涉及从后端 API 获取知识数据，注意内存模式下 `toObject()` 可能不存在，需防御性检测 `doc._model || doc.toObject?.() || doc`
3. **测验接口依赖** — `POST /api/knowledge/:id/generate-quiz` 当前由 `localAIService`（规则引擎）处理，需确认是否覆盖所有仪器类型
4. **媒体文件尚未准备** — 即使改造了"配套学习资料"区的渲染方式，实际视频/PDF/PPT 文件仍需要内容团队准备。建议先让 UI 准备好（显示静态占位），文件就绪后只需改 JSON 路径

---

## 六、与现有架构的兼容性

本方案**不改变**：
- 后端 API 结构（不改 route / controller / model）
- 数据库模式（不改 schema）
- 认证/权限逻辑
- AI 服务调用方式

本方案**只影响**：
- `public/prototype_v6_user_mgmt.html`（前端展示层）
- 新增 `data/knowledge-*.json`（数据配置文件）
- 可能新增少量 CSS class（模板样式复用）
