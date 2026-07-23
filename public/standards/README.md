# 测井专业标准文件库

此目录包含全部 72 项测井专业标准文件（PDF/DOCX），由 `scripts/update-standards.js` 自动管理。

## 更新方法

```bash
node scripts/update-standards.js
```

该脚本会：
1. 从 `D:\1测井站工作\测井专业标准` 扫描全部文件
2. 复制到本目录
3. 自动分类（仪器/作业/安全/质量/数据）
4. 生成 `public/data/standards.json`

## 数据驱动

标准数据由 `public/data/standards.json` 提供，前端通过 fetch 加载并动态渲染卡片。
版本信息随 JSON 自动更新。
