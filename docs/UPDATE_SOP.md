# 内容更新 SOP

## 一、案例更新

编辑 `public/data/interactive-cases.json`，覆盖后立即生效（前端防缓存）。
有需要时同步到数据库：

```bash
npm run init
node scripts/import-interactive-cases.js
```

JSON 结构见现有数据，每步含 `instruction`(题干) → `hints`(提示) → `answer`(答案) → `feedback`(解析)。

## 二、学习资料更新

Obsidian 知识库 `D:\PEIHM-知识库\裴宏明的知识库` 中写/改笔记，然后：

```bash
node scripts/sync-from-obsidian.js
```

只导入新增和标题变更的笔记，已有内容不会覆盖。
