const PptxGenJS = require('pptxgenjs');

const pres = new PptxGenJS();

// Slide 1: Title
const slide1 = pres.addSlide();

// Title
slide1.addText('测井培训平台项目开发进度', {
    x: 0.5,
    y: 0.5,
    w: 8.5,
    h: 1,
    fontSize: 36,
    bold: true,
    color: '2C3E50',
    fontFace: 'Microsoft YaHei',
});

// Subtitle
slide1.addText('完成情况报告 - v1.1.0', {
    x: 0.5,
    y: 1.4,
    w: 8.5,
    h: 0.5,
    fontSize: 18,
    color: '7F8C8D',
    fontFace: 'Microsoft YaHei',
});

// Progress bar background
slide1.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 0.4,
    fill: 'ECF0F1',
    r: 5,
});

// Progress bar (95%)
slide1.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 2.2,
    w: 8.55,
    h: 0.4,
    fill: '27AE60',
    r: 5,
});

slide1.addText('95%', {
    x: 7.5,
    y: 2.3,
    w: 1.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Microsoft YaHei',
});

// Grid layout for categories
const categories = [
    {
        title: '后端API',
        items: '16个路由\nauth, users, knowledge\nfiles, progress, cases\nexams, AI分析等',
        color: '3498DB',
    },
    {
        title: '前端页面',
        items: '33个HTML文件\n登录、管理员、教师\n学员、知识库管理\n单位管理、播放器',
        color: '9B59B6',
    },
    { title: '播放器', items: '视频播放器\nPDF阅读器\nPPT预览器', color: 'E67E22' },
    {
        title: '核心功能',
        items: '用户认证JWT\n角色权限控制\n知识CRUD\n文件上传\n审核工作流\n学习进度追踪\n笔记系统',
        color: '1ABC9C',
    },
    { title: '代码质量', items: 'ESLint\nPrettier\n测试(Jest)\nGit Hooks', color: 'E74C3C' },
];

let xPos = 0.5;
const yPos = 3.0;

categories.forEach((cat, idx) => {
    // Card background
    slide1.addShape(pres.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: 2.7,
        h: 3.5,
        fill: 'FFFFFF',
        shadow: { type: 'outer', color: '00000020', blur: 10, offset: 3, angle: 45 },
        r: 8,
    });

    // Color header
    slide1.addShape(pres.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: 2.7,
        h: 0.6,
        fill: cat.color,
        r: [8, 8, 0, 0],
    });

    // Title
    slide1.addText(cat.title, {
        x: xPos,
        y: yPos,
        w: 2.7,
        h: 0.6,
        fontSize: 14,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Microsoft YaHei',
        align: 'center',
        valign: 'middle',
    });

    // Items
    slide1.addText(cat.items, {
        x: xPos + 0.15,
        y: yPos + 0.8,
        w: 2.4,
        h: 2.5,
        fontSize: 11,
        color: '2C3E50',
        fontFace: 'Microsoft YaHei',
        align: 'left',
        valign: 'top',
        lineSpacingMultiple: 1.3,
    });

    xPos += 2.85;
});

// Footer
slide1.addText('测井知识学习培训平台 | 2026年3月', {
    x: 0.5,
    y: 6.7,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: '95A5A6',
    fontFace: 'Microsoft YaHei',
    align: 'center',
});

pres.writeFile({ fileName: 'F:/ai/logging-study-platform-1/docs/项目开发进度报告.pptx' })
    .then(() => console.log('PPT created successfully!'))
    .catch(err => console.error(err));
