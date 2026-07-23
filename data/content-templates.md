# 培训材料内容模板

本目录包含培训材料的标准模板，用于内容采集、整理和导入。

---

## 📋 目录

1. [知识库内容模板](#知识库内容模板)
2. [案例内容模板](#案例内容模板)
3. [考试题目模板](#考试题目模板)
4. [数据导入示例](#数据导入示例)

---

## 知识库内容模板

### JSON格式模板

```json
{
    "type": "knowledge",
    "title": "测井知识点标题",
    "category": "分类名称",
    "subcategory": "子分类",
    "content": "详细内容描述（至少100字）\n\n本知识点需要包括：\n1. 基本概念\n2. 技术原理\n3. 应用场景\n4. 注意事项",
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
    "difficulty": "beginner",
    "readingTime": 15,
    "hasQuiz": true,
    "quizQuestions": [
        {
            "question": "问题内容",
            "questionType": "single_choice",
            "options": ["选项1", "选项2", "选项3", "选项4"],
            "correctAnswer": 0,
            "explanation": "答案解析",
            "points": 2,
            "difficulty": "easy"
        }
    ],
    "tags": ["标签1", "标签2"],
    "relatedKnowledge": ["相关知识点ID1", "相关知识点ID2"],
    "createdBy": "用户ID",
    "createdAt": "2026-03-06T10:00:00Z",
    "status": "published"
}
```

### 字段说明

| 字段             | 类型    | 必填 | 说明                           |
| ---------------- | ------- | ---- | ------------------------------ |
| type             | string  | 是   | 固定值：knowledge              |
| title            | string  | 是   | 知识点标题，5-100字            |
| category         | string  | 是   | 一级分类                       |
| subcategory      | string  | 是   | 二级分类                       |
| content          | string  | 是   | 详细内容，至少100字            |
| keywords         | array   | 是   | 5-10个关键词                   |
| difficulty       | enum    | 是   | beginner/intermediate/advanced |
| readingTime      | number  | 是   | 阅读时间（分钟）               |
| hasQuiz          | boolean | 是   | 是否包含测试题                 |
| quizQuestions    | array   | 否   | 测试题目数组                   |
| tags             | array   | 是   | 2-5个标签                      |
| relatedKnowledge | array   | 否   | 相关知识点ID列表               |
| createdBy        | string  | 是   | 创建用户ID                     |
| createdAt        | date    | 是   | 创建时间                       |
| status           | enum    | 是   | draft/published                |

---

## 案例内容模板

### JSON格式模板

```json
{
    "type": "case",
    "title": "案例标题",
    "description": "案例描述，包括案例背景、研究目的等",
    "category": "案例分类",
    "wellInfo": {
        "wellName": "井号",
        "location": "地理位置",
        "depth": 5480,
        "formation": "地层名称",
        "drillingDate": "2024-03-15"
    },
    "problemStatement": "问题描述，详细描述需要解决的技术问题",
    "analysisProcess": "分析过程，逐步分析问题和解决方案",
    "solution": "解决方案，详细描述解决步骤和方法",
    "results": "结果描述，包括最终成果和评价",
    "lessons": "经验教训，总结经验和启示",
    "keywords": ["关键词1", "关键词2", "关键词3"],
    "technicalTerms": [
        {
            "term": "技术术语",
            "definition": "术语定义"
        }
    ],
    "difficulty": "intermediate",
    "interactivityLevel": "interactive",
    "interactiveSteps": [
        {
            "stepNumber": 1,
            "instruction": "步骤说明，包括具体任务和引导问题",
            "expectedInput": "正确答案",
            "hints": ["提示1", "提示2", "提示3"],
            "feedback": "反馈内容，正确答案后的详细说明"
        }
    ],
    "status": "published",
    "viewCount": 0,
    "rating": {
        "average": 0,
        "count": 0
    },
    "userInteractions": [],
    "createdBy": "用户ID",
    "createdAt": "2026-03-06T10:00:00Z"
}
```

### 字段说明

| 字段               | 类型   | 必填 | 说明                                          |
| ------------------ | ------ | ---- | --------------------------------------------- |
| type               | string | 是   | 固定值：case                                  |
| title              | string | 是   | 案例标题，10-50字                             |
| description        | string | 是   | 案例描述，50-200字                            |
| category           | string | 是   | 案例分类（储层评价/生产动态/故障处理/跨学科） |
| wellInfo           | object | 是   | 井信息对象                                    |
| problemStatement   | string | 是   | 问题描述，100-300字                           |
| analysisProcess    | string | 是   | 分析过程，详细描述分析步骤                    |
| solution           | string | 是   | 解决方案，100-300字                           |
| results            | string | 是   | 结果描述，50-150字                            |
| lessons            | string | 是   | 经验教训，30-100字                            |
| keywords           | array  | 是   | 3-8个关键词                                   |
| technicalTerms     | array  | 否   | 技术术语列表                                  |
| difficulty         | enum   | 是   | beginner/intermediate/advanced                |
| interactivityLevel | enum   | 是   | interactive/guided/read_only                  |
| interactiveSteps   | array  | 否   | 交互步骤列表（interactive模式必填）           |
| status             | enum   | 是   | draft/published                               |
| createdBy          | string | 是   | 创建用户ID                                    |
| createdAt          | date   | 是   | 创建时间                                      |

---

## 考试题目模板

### 单选题模板

```json
{
    "type": "exam_question",
    "category": "考试分类",
    "questionText": "题目内容",
    "questionType": "single_choice",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctAnswer": 0,
    "explanation": "答案解析，解释为什么正确答案是对的",
    "points": 2,
    "difficulty": "easy",
    "relatedKnowledge": ["知识点ID1", "知识点ID2"],
    "tags": ["标签1", "标签2"]
}
```

### 多选题模板

```json
{
    "type": "exam_question",
    "category": "考试分类",
    "questionText": "题目内容",
    "questionType": "multiple_choice",
    "options": ["选项A", "选项B", "选项C", "选项D", "选项E"],
    "correctAnswer": [0, 2, 4],
    "explanation": "答案解析，解释每个正确答案",
    "points": 4,
    "difficulty": "medium",
    "relatedKnowledge": ["知识点ID1", "知识点ID2"],
    "tags": ["标签1", "标签2"]
}
```

### 判断题模板

```json
{
    "type": "exam_question",
    "category": "考试分类",
    "questionText": "题目内容",
    "questionType": "true_false",
    "correctAnswer": true,
    "explanation": "答案解析，解释对错原因",
    "points": 1,
    "difficulty": "easy",
    "relatedKnowledge": ["知识点ID1"],
    "tags": ["标签1"]
}
```

### 字段说明

| 字段             | 类型         | 必填 | 说明                                     |
| ---------------- | ------------ | ---- | ---------------------------------------- |
| type             | string       | 是   | 固定值：exam_question                    |
| category         | string       | 是   | 考试分类                                 |
| questionText     | string       | 是   | 题目内容，10-50字                        |
| questionType     | enum         | 是   | single_choice/multiple_choice/true_false |
| options          | array        | 否   | 选项列表（单选/多选）                    |
| correctAnswer    | number/array | 是   | 正确答案（单选为索引，多选为数组）       |
| explanation      | string       | 是   | 答案解析，50-100字                       |
| points           | number       | 是   | 分值（1-5分）                            |
| difficulty       | enum         | 是   | easy/medium/hard                         |
| relatedKnowledge | array        | 否   | 相关知识点ID列表                         |
| tags             | array        | 否   | 标签列表                                 |

---

## 数据导入示例

### 示例1：知识库导入

```json
[
    {
        "type": "knowledge",
        "title": "自然伽马测井原理",
        "category": "测井原理",
        "subcategory": "放射性测井",
        "content": "自然伽马测井是通过测量地层自然放射性来识别岩性和判断泥质含量的测井方法。地层中的放射性元素（如铀、钍、钾）衰变会产生伽马射线，地层中泥质含量越高，放射性通常越强。\n\n主要应用包括：\n1. 岩性识别：通过伽马值判断岩石类型\n2. 泥质含量计算：伽马值与泥质含量呈正相关\n3. 地层对比：不同地层的伽马曲线特征不同",
        "keywords": ["自然伽马", "放射性", "岩性识别", "泥质含量", "钾铀钍"],
        "difficulty": "intermediate",
        "readingTime": 15,
        "hasQuiz": true,
        "quizQuestions": [
            {
                "question": "自然伽马测井主要利用哪种放射性元素？",
                "questionType": "single_choice",
                "options": ["铀U-238", "钍Th-232", "钾K-40", "镭Ra-226"],
                "correctAnswer": 2,
                "explanation": "地层中主要的放射性元素是铀（U-238）、钍（Th-232）和钾（K-40），其中钾K-40含量最高，因此自然伽马测井主要反映钾元素的含量。",
                "points": 2,
                "difficulty": "easy"
            },
            {
                "question": "自然伽马值与泥质含量呈什么关系？",
                "questionType": "true_false",
                "correctAnswer": true,
                "explanation": "正确。泥质通常含有较多的放射性元素，因此自然伽马值越高，通常泥质含量也越高。",
                "points": 1,
                "difficulty": "easy"
            }
        ],
        "tags": ["基础理论", "放射性测井"],
        "relatedKnowledge": [],
        "createdBy": "admin",
        "createdAt": "2026-03-06T10:00:00Z",
        "status": "published"
    }
]
```

### 示例2：案例导入

```json
[
    {
        "type": "case",
        "title": "【交互式学习】复杂碳酸盐岩储层测井识别与分析",
        "description": "本案例通过一个真实的碳酸盐岩储层测井解释案例，带领学员逐步学习如何识别储层特征、选择测井系列、进行孔隙度计算和流体性质判断。适合中级测井解释工程师学习。",
        "category": "储层评价",
        "wellInfo": {
            "wellName": "塔河油田TH-2024-01井",
            "location": "新疆塔里木盆地",
            "depth": 5480,
            "formation": "奥陶系鹰山组",
            "drillingDate": "2024-03-15"
        },
        "problemStatement": "该井在奥陶系鹰山组钻遇碳酸盐岩储层，岩性以灰岩为主，局部发育白云岩化。常规测井显示电阻率数值差异较大，需要准确识别储层类型（裂缝型、孔洞型或基质型），判断流体性质，并计算储层参数。关键难点在于：1）裂缝识别与定量评价；2）次生孔隙度计算；3）油气水层综合判断。",
        "analysisProcess": "通过常规测井、成像测井和核磁共振测井的综合分析，识别储层类型和流体性质。重点利用深中浅探测电阻率差异识别裂缝，利用声波时差和密度计算孔隙度，利用核磁共振T2谱分析孔隙结构。",
        "solution": "采用'三性'评价方法：岩性识别采用自然伽马-光电吸收截面指数交会图；物性评价采用声波时差-密度交会计算总孔隙度，减去基质孔隙度得到次生孔隙度；含油气性评价采用深探测电阻率-孔隙度交会图，结合核磁共振流体识别技术。",
        "results": "成功识别出3段优质储层，累计厚度45米，次生孔隙度平均8.5%。测试获得日产油120立方米，证实为裂缝-孔洞型油气层。储层评价结果与试油结论吻合度达95%以上。",
        "lessons": "1）碳酸盐岩储层非均质性强，必须综合利用多种测井方法；2）成像测井是识别裂缝的有效手段，但要注意区分天然裂缝和诱导裂缝；3）核磁共振测井在孔隙结构分析和流体识别方面具有独特优势；4）测井解释必须与地质、地震资料相结合，进行多井对比分析。",
        "keywords": [
            "碳酸盐岩",
            "储层评价",
            "裂缝识别",
            "孔隙度计算",
            "流体识别",
            "核磁共振",
            "成像测井"
        ],
        "technicalTerms": [
            {
                "term": "次生孔隙度",
                "definition": "由溶蚀、白云岩化等地质作用形成的孔隙空间占总岩石体积的百分比"
            },
            {
                "term": "裂缝孔隙度",
                "definition": "裂缝空间占岩石总体积的百分比，通常远小于基质孔隙度但对渗透率贡献巨大"
            }
        ],
        "difficulty": "intermediate",
        "interactivityLevel": "interactive",
        "interactiveSteps": [
            {
                "stepNumber": 1,
                "instruction": "【步骤1：岩性识别】观察测井曲线，该层段自然伽马值较低（15-25API），光电吸收截面指数Pe约为5.0 b/e，密度约2.70 g/cm³。请判断主要岩性是什么？\n\n提示：石灰岩的Pe值约5.08，白云岩约3.14，砂岩约1.81",
                "expectedInput": "石灰岩",
                "hints": [
                    "观察Pe值接近哪种岩石的特征值",
                    "自然伽马低说明泥质含量少",
                    "密度2.70接近石灰岩理论值"
                ],
                "feedback": "正确！Pe值约5.0是石灰岩的典型特征，结合低密度伽马值，可以确定该层段主要为石灰岩。这是碳酸盐岩储层评价的基础。"
            }
        ],
        "status": "published",
        "viewCount": 0,
        "rating": {
            "average": 0,
            "count": 0
        },
        "userInteractions": [],
        "createdBy": "admin",
        "createdAt": "2026-03-06T10:00:00Z"
    }
]
```

### 示例3：考试题目导入

```json
[
    {
        "type": "exam_question",
        "category": "基础理论",
        "questionText": "自然伽马测井主要用于识别什么？",
        "questionType": "single_choice",
        "options": ["岩性和泥质含量", "孔隙度", "渗透率", "含油饱和度"],
        "correctAnswer": 0,
        "explanation": "自然伽马测井主要用于识别岩性和判断泥质含量。地层中泥质含量越高，放射性通常越强。",
        "points": 2,
        "difficulty": "easy",
        "relatedKnowledge": ["自然伽马测井原理"],
        "tags": ["基础理论", "放射性测井"]
    },
    {
        "type": "exam_question",
        "category": "基础理论",
        "questionText": "以下哪些是地层中主要的放射性元素？（多选）",
        "questionType": "multiple_choice",
        "options": ["铀U-238", "钍Th-232", "钾K-40", "镭Ra-226"],
        "correctAnswer": [0, 1, 2],
        "explanation": "地层中主要的放射性元素是铀（U-238）、钍（Th-232）和钾（K-40），其中钾K-40含量最高，因此自然伽马测井主要反映钾元素的含量。",
        "points": 4,
        "difficulty": "medium",
        "relatedKnowledge": ["自然伽马测井原理"],
        "tags": ["基础理论", "放射性测井"]
    },
    {
        "type": "exam_question",
        "category": "基础理论",
        "questionText": "自然伽马值与泥质含量呈正相关关系。",
        "questionType": "true_false",
        "correctAnswer": true,
        "explanation": "正确。泥质通常含有较多的放射性元素，因此自然伽马值越高，通常泥质含量也越高。",
        "points": 1,
        "difficulty": "easy",
        "relatedKnowledge": ["自然伽马测井原理"],
        "tags": ["基础理论", "放射性测井"]
    }
]
```

---

## 导入工具使用说明

### 步骤1：准备数据文件

按照上述模板格式准备数据文件，可以是一个JSON数组文件：

```json
// data/20260306_knowledge_materials.json
[
  {
    "type": "knowledge",
    "title": "测井知识点1",
    "category": "测井原理",
    "subcategory": "基础理论",
    "content": "内容描述...",
    "keywords": ["关键词1", "关键词2"],
    "difficulty": "intermediate",
    "readingTime": 15,
    "hasQuiz": true,
    "quizQuestions": [...],
    "tags": ["标签1"],
    "createdBy": "admin",
    "createdAt": "2026-03-06T10:00:00Z",
    "status": "published"
  }
]
```

### 步骤2：运行导入工具

```bash
# 确保在项目根目录
cd F:\ai\logging-study-platform-1

# 运行批量导入工具
node scripts/batchImport.js data/20260306_knowledge_materials.json

# 验证导入结果
npm run verify-db
```

### 步骤3：查看导入结果

系统会显示导入统计信息：

```
📊 导入统计：
✅ 成功导入知识库：15条
✅ 成功导入案例：2个
✅ 成功导入考试题：50道
⏭️  跳过已存在：5条
❌ 导入失败：0条

验证结果：
知识库数量：15
案例数量：2
考试题数量：50
```

---

## 注意事项

1. **数据格式**：必须使用JSON格式，严格按照模板字段填写
2. **必填字段**：请确保所有必填字段都有值
3. **长度限制**：标题10-100字，内容至少100字
4. **难度等级**：只能选择 beginner/intermediate/advanced
5. **重复检查**：系统会自动跳过已存在的标题内容
6. **数据验证**：导入前建议先使用验证工具检查格式

---

**版本**: v1.0
**更新日期**: 2026年3月6日
