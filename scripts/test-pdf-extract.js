/**
 * PDF 文本提取测试脚本（适配 pdf-parse v2）
 *
 * 用法: node scripts/test-pdf-extract.js [文件路径]
 * 默认测试一个导入的标准文件
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function main() {
  let filePath = process.argv[2];
  if (!filePath) {
    const importsDir = path.join(__dirname, '..', 'uploads', 'standards');
    if (!fs.existsSync(importsDir)) {
      console.error('❌ 未找到导入目录，请先运行 bootstrap 脚本');
      process.exit(1);
    }
    const files = fs.readdirSync(importsDir).filter(f => f.endsWith('.pdf'));
    if (files.length === 0) {
      console.error('❌ 导入目录中无 PDF 文件');
      process.exit(1);
    }
    filePath = path.join(importsDir, files[0]);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  console.log(`📄 文件: ${path.basename(filePath)}`);
  console.log(`📏 大小: ${(stat.size / 1024).toFixed(1)} KB`);

  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const startTime = Date.now();
    const result = await parser.getText();
    const elapsed = Date.now() - startTime;

    console.log(`⏱️  解析耗时: ${elapsed}ms`);
    console.log(`📝 页数: ${result.pages?.length || 'N/A'}`);
    console.log(`🔤 字符数: ${result.text?.length || 0}`);
    console.log(`\n--- 提取内容预览（前 500 字）---\n`);
    console.log((result.text || '').substring(0, 500));
    console.log(`\n--- 共 ${result.text?.length || 0} 字符 ---\n`);

    if (result.text && result.text.trim().length > 0) {
      console.log('✅ PDF 文本提取成功');
    } else {
      console.log('⚠️  PDF 提取结果为空（可能为扫描件，需 OCR）');
    }
  } finally {
    await parser.destroy();
  }
}

main();
