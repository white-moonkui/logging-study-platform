# 测井专业智能培训系统 — 设计系统 (WellLog Design System)

> Category: Education & Training
> 专业测井培训平台。蓝色科技感主导，玻璃态质感，数据仪表盘风格。面向石油行业工程师和管理人员。

## 1. Visual Theme & Atmosphere

科技蓝 + 优雅玻璃态。背景使用柔和蓝-青渐变模拟专业氛围，卡片使用毛玻璃效果（backdrop-filter: blur）营造层次感和现代感。整体风格：冷静、专业、数据驱动。

- **Visual style:** modern, glassmorphism, data-dashboard
- **Color stance:** blue-primary with teal accent, light backgrounds
- **Design intent:** 传达石油行业的技术专业性和可靠性，同时保持现代清爽的视觉体验

## 2. Color

### Primary Palette
- **Primary:** `#0ea5e9` (Sky Blue) — 主要操作按钮、链接、活动状态
- **Primary Light:** `#38bdf8` — hover 状态、浅色高亮
- **Primary Dark:** `#0284c7` — 激活状态、深色背景

### Accent
- **Accent:** `#14b8a6` (Teal) — 次要操作、特殊高亮、进度指示
- **Accent Hover:** `#0d9488` — 次要按钮 hover

### Status Colors
- **Success:** `#10b981` — 通过、完成、在线
- **Warning:** `#f59e0b` — 待审核、警告
- **Danger:** `#ef4444` — 失败、错误、删除
- **Info:** `#8b5cf6` (Purple) — 提示信息、特殊标签

### Neutral Scale (Slate)
- **Gray-50:** `#f8fafc` — 最浅背景
- **Gray-100:** `#f1f5f9` — 二级背景
- **Gray-200:** `#e2e8f0` — 边框、分割线
- **Gray-300:** `#cbd5e1` — 禁用状态
- **Gray-400:** `#94a3b8` — 次要文字
- **Gray-500:** `#64748b` — 辅助文字
- **Gray-600:** `#475569` — 正文
- **Gray-700:** `#334155` — 标题
- **Gray-800:** `#1e293b` — 主要文字
- **Gray-900:** `#0f172a` — 极端强调

### Surface & Background
- **Background:** `#ffffff` — 纯白背景
- **Bg Subtle:** `#f8fafc` — 浅灰背景
- **Bg Soft:** `#f0f9ff` — 蓝色调和背景
- **Glass Background:** `rgba(255, 255, 255, 0.85)` — 毛玻璃卡片
- **Glass Border:** `rgba(255, 255, 255, 0.6)` — 毛玻璃边框

### Gradients
- **Bg Gradient:** `linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdfa 100%)`
- **Primary Gradient:** `linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)`

## 3. Typography

### Font Families
- **Display / Headings:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Body:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif`
- **Mono:** `'JetBrains Mono', 'Fira Code', monospace`

### Type Scale
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| xs | 12px | 400 | 辅助文字、标签 |
| sm | 14px | 400/500 | 表单标签、表格内容 |
| base | 16px | 400 | 正文 |
| lg | 18px | 500/600 | 卡片标题 |
| xl | 24px | 600 | 页面标题 |
| 2xl | 32px | 600/700 | 大标题 |
| 3xl | 40px | 700 | Hero 标题 |

### Line Height
- Body: 1.6
- Headings: 1.2
- Tight: 1.1 (小标题)

## 4. Spacing & Grid

- **Spacing scale (8pt):** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
- **Grid:** 12-column responsive grid
- **Container max:** 1400px
- **Sidebar:** 280px (桌面端)

## 5. Layout & Composition

- **App shell:** 固定侧边栏 + 内容区，侧边栏 280px
- **Content padding:** 24px-32px
- **Card grid:** 2-4 列响应式
- **Whitespace:** 使用间距替代边框做分隔

## 6. Components

### Glass Card
- Background: `rgba(255, 255, 255, 0.6)` 到 `rgba(255, 255, 255, 0.85)`
- Backdrop-filter: `blur(20px) saturate(180%)`
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Border-radius: 16px (`--radius-xl`)
- Shadow: `0 8px 32px rgba(31, 38, 135, 0.12)`

### Buttons
- **Primary:** `--accent` fill, white text, 12px radius, 10px 20px padding
- **Secondary:** transparent, `1px solid var(--border-color)`, gray text
- **Danger:** `--danger` fill, white text
- **Ghost:** transparent, `--primary` text

### Tables
- Clean header row with `--bg-subtle`, no vertical borders
- Row hover: `--primary` at 3% opacity
- Rounded corners on the container

### Forms
- Input padding: 10px 16px
- Border: `1px solid var(--border-color)`, 8px radius
- Focus: `--accent` color, 2px width
- Labels: 14px, `--text-secondary`

### Stats / KPI Cards
- Large number, small label, optional trend indicator
- Colored top accent bar or icon
- Glass card background

### Navigation (Sidebar)
- Fixed left, full height
- Logo + brand at top
- Nav items with icon + label
- Active item: `--accent` background at 10%
- Bottom: user avatar + logout

## 7. Motion & Interaction

- **Transitions default:** 200ms ease
- **Hover:** subtle lift (transform: translateY(-2px)) on cards
- **Active:** `scale(0.97)` on buttons
- **Sidebar:** smooth slide on mobile
- **Loading:** shimmer skeleton animation
- **Modal:** fade in + scale up (200ms)

## 8. Voice & Brand

- **Tone:** 专业、清晰、自信
- **Language:** 中文为主，技术术语使用行业标准英文缩写
- **Microcopy:** 行动导向（"开始学习" > "点击这里"）
- **Brand name:** 测井专业智能培训系统
- **避免：** 过于随意的网络用语、冗余的修饰词

## 9. Anti-patterns

- ❌ 不要引入调色板之外的颜色
- ❌ 不要在同一页面使用多种不同风格的表单/按钮
- ❌ 不要在卡片上使用纯白背景（`#ffffff`）加高阴影（用玻璃态替代）
- ❌ 不要在一行中使用超过3种字体大小
- ❌ 不要使用纯 CSS 颜色字符串（必须通过 CSS 变量引用）
- ❌ 不要混用不同的 border-radius 风格（统一使用 8/12/16 体系）
- ❌ 不要在玻璃卡片上使用深色背景
