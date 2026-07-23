const PptxGenJS = require('pptxgenjs');

const pres = new PptxGenJS();

// ============================================================
// Slide 1: 传统开发方案（市场调研）
// ============================================================
const slide1 = pres.addSlide();

// Title
slide1.addText('传统开发方案调研', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: '1A5276',
    fontFace: 'Microsoft YaHei',
});

slide1.addText('测井培训平台 - 开发模式、人员、时间、费用分析', {
    x: 0.5,
    y: 1.0,
    w: 9,
    h: 0.4,
    fontSize: 14,
    color: '7F8C8D',
    fontFace: 'Microsoft YaHei',
});

// Grid layout
const sections = [
    {
        title: '一、开发模式与费用',
        items: '模板/SaaS: 2-15万/年\n全定制基础: 10-30万\n全定制高级: 30-80万\n企业级AI: 50-200万+',
        color: '3498DB',
    },
    {
        title: '二、团队配置',
        items: '项目经理: 1人\n产品经理: 1-2人\nUI设计: 1-2人\n前端开发: 2-3人\n后端开发: 2-4人\n测试工程师: 1-2人\n总计: 8-15人',
        color: '9B59B6',
    },
    {
        title: '三、开发周期',
        items: '需求分析: 1-2月\n设计开发: 1-2月\n核心开发: 2-4月\n测试优化: 1月\n部署上线: 0.5-1月\n总计: 3-6个月',
        color: '27AE60',
    },
];

let xPos = 0.4;
let yPos = 1.8;

sections.forEach(sec => {
    // Card background
    slide1.addShape(pres.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: 2.9,
        h: 3.2,
        fill: 'FFFFFF',
        shadow: { type: 'outer', color: '00000015', blur: 8, offset: 2, angle: 45 },
        r: 10,
    });

    // Color header
    slide1.addShape(pres.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: 2.9,
        h: 0.55,
        fill: sec.color,
        r: [10, 10, 0, 0],
    });

    // Title
    slide1.addText(sec.title, {
        x: xPos,
        y: yPos,
        w: 2.9,
        h: 0.55,
        fontSize: 12,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Microsoft YaHei',
        align: 'center',
        valign: 'middle',
    });

    // Items
    slide1.addText(sec.items, {
        x: xPos + 0.15,
        y: yPos + 0.7,
        w: 2.6,
        h: 2.3,
        fontSize: 10,
        color: '2C3E50',
        fontFace: 'Microsoft YaHei',
        align: 'left',
        valign: 'top',
        lineSpacingMultiple: 1.4,
    });

    xPos += 3.1;
});

// Second row
const sections2 = [
    {
        title: '四、费用明细参考',
        items: '人工成本: 50-60%\n设计UI: 10-15%\n服务器/云: 10-15%\n第三方服务: 5-10%\n测试/验收: 5-10%\n维护(首年): 10-15%',
        color: 'E67E22',
    },
    {
        title: '五、关键成本因素',
        items: '功能复杂度\n用户规模\n定制程度\n移动端开发\n第三方集成\n视频处理/带宽',
        color: 'E74C3C',
    },
    {
        title: '六、综合结论',
        items: '人员: 8-15人\n时间: 3-12个月\n费用: 20-150万+\n\n传统开发成本高\n周期长\n需专职团队',
        color: '1ABC9C',
    },
];

xPos = 0.4;
yPos = 5.2;

sections2.forEach(sec => {
    slide1.addShape(pres.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: 2.9,
        h: 2.5,
        fill: 'FFFFFF',
        shadow: { type: 'outer', color: '00000015', blur: 8, offset: 2, angle: 45 },
        r: 10,
    });

    slide1.addShape(pres.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: 2.9,
        h: 0.55,
        fill: sec.color,
        r: [10, 10, 0, 0],
    });

    slide1.addText(sec.title, {
        x: xPos,
        y: yPos,
        w: 2.9,
        h: 0.55,
        fontSize: 12,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Microsoft YaHei',
        align: 'center',
        valign: 'middle',
    });

    slide1.addText(sec.items, {
        x: xPos + 0.15,
        y: yPos + 0.7,
        w: 2.6,
        h: 1.6,
        fontSize: 10,
        color: '2C3E50',
        fontFace: 'Microsoft YaHei',
        align: 'left',
        valign: 'top',
        lineSpacingMultiple: 1.4,
    });

    xPos += 3.1;
});

// Footer
slide1.addText('第1页 / 共2页', {
    x: 8,
    y: 7.2,
    w: 1.5,
    h: 0.3,
    fontSize: 9,
    color: 'BDC3C7',
    fontFace: 'Microsoft YaHei',
    align: 'right',
});

// ============================================================
// Slide 2: AI辅助开发对比
// ============================================================
const slide2 = pres.addSlide();

// Title
slide2.addText('AI辅助开发 vs 传统开发', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: '1A5276',
    fontFace: 'Microsoft YaHei',
});

slide2.addText('测井培训平台 - 开发效率与成本对比', {
    x: 0.5,
    y: 1.0,
    w: 9,
    h: 0.4,
    fontSize: 14,
    color: '7F8C8D',
    fontFace: 'Microsoft YaHei',
});

// Comparison table header
slide2.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1.6,
    w: 9,
    h: 0.6,
    fill: '2C3E50',
    r: [8, 8, 0, 0],
});

slide2.addText('对比项', {
    x: 0.5,
    y: 1.6,
    w: 2,
    h: 0.6,
    fontSize: 14,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Microsoft YaHei',
    align: 'center',
    valign: 'middle',
});

slide2.addText('传统开发', {
    x: 2.5,
    y: 1.6,
    w: 3.5,
    h: 0.6,
    fontSize: 14,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Microsoft YaHei',
    align: 'center',
    valign: 'middle',
});

slide2.addText('AI辅助开发（当前）', {
    x: 6,
    y: 1.6,
    w: 3.5,
    h: 0.6,
    fontSize: 14,
    bold: true,
    color: '27AE60',
    fontFace: 'Microsoft YaHei',
    align: 'center',
    valign: 'middle',
});

// Table rows
const rows = [
    { item: '人员配置', trad: '8-15人', ai: '1人+AI助手', bg: 'ECF0F1' },
    { item: '开发周期', trad: '3-12个月', ai: '~1个月', bg: 'FFFFFF' },
    { item: '开发费用', trad: '20-150万+', ai: '~0（仅服务器）', bg: 'ECF0F1' },
    { item: '项目完成度', trad: '取决于团队', ai: '95%（进行中）', bg: 'FFFFFF' },
    { item: '维护成本', trad: '5-15万/年', ai: '低', bg: 'ECF0F1' },
];

let yRow = 2.2;
rows.forEach(row => {
    slide2.addShape(pres.ShapeType.rect, {
        x: 0.5,
        y: yRow,
        w: 9,
        h: 0.7,
        fill: row.bg,
        line: { color: 'BDC3C7', width: 0.5 },
    });

    slide2.addText(row.item, {
        x: 0.5,
        y: yRow,
        w: 2,
        h: 0.7,
        fontSize: 13,
        bold: true,
        color: '2C3E50',
        fontFace: 'Microsoft YaHei',
        align: 'center',
        valign: 'middle',
    });

    slide2.addText(row.trad, {
        x: 2.5,
        y: yRow,
        w: 3.5,
        h: 0.7,
        fontSize: 13,
        color: '7F8C8D',
        fontFace: 'Microsoft YaHei',
        align: 'center',
        valign: 'middle',
    });

    slide2.addText(row.ai, {
        x: 6,
        y: yRow,
        w: 3.5,
        h: 0.7,
        fontSize: 13,
        bold: true,
        color: '27AE60',
        fontFace: 'Microsoft YaHei',
        align: 'center',
        valign: 'middle',
    });

    yRow += 0.7;
});

// Savings highlight
slide2.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 5.8,
    w: 9,
    h: 1.2,
    fill: '27AE60',
    r: 10,
});

slide2.addText('AI辅助开发节省', {
    x: 0.5,
    y: 5.9,
    w: 9,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Microsoft YaHei',
    align: 'center',
});

slide2.addText('费用: ~90%  |  时间: ~70%  |  人员: ~90%', {
    x: 0.5,
    y: 6.4,
    w: 9,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Microsoft YaHei',
    align: 'center',
});

// Footer
slide2.addText('第2页 / 共2页', {
    x: 8,
    y: 7.2,
    w: 1.5,
    h: 0.3,
    fontSize: 9,
    color: 'BDC3C7',
    fontFace: 'Microsoft YaHei',
    align: 'right',
});

// Save
pres.writeFile({ fileName: 'F:/ai/logging-study-platform-1/docs/立项汇报_开发方案对比.pptx' })
    .then(() => console.log('PPT created: 立项汇报_开发方案对比.pptx'))
    .catch(err => console.error(err));
