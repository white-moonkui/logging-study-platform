/**
 * Obsidian → 平台 内容同步脚本
 *
 * 从 Obsidian 知识库读取 .md 笔记，解析 frontmatter，导入为 Knowledge 条目
 *
 * 用法:
 *   node scripts/sync-from-obsidian.js                    # 全量导入
 *   node scripts/sync-from-obsidian.js --dry-run           # 试运行（不写入）
 *   node scripts/sync-from-obsidian.js --limit=5           # 仅导入前 5 篇
 *   node scripts/sync-from-obsidian.js --dir=01-测井基本原理  # 只导入指定子目录
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbAdapter = require('../utils/dbAdapter');
const Knowledge = require('../models/Knowledge');
const Category = require('../models/Category');

// ============================================================
// 配置
// ============================================================
const OBSIDIAN_VAULT = 'D:\\PEIHM-知识库\\裴宏明的知识库';
const SOURCE_DIR = path.join(OBSIDIAN_VAULT, '01-测井专业');

// Obsidian 子目录 → 平台分类 code 映射（完整版）
const DIR_CATEGORY_MAP = {
    '01-测井基本原理': 'basic',
    '02-测井仪器设备': 'instrument',
    '03-测井方法与应': 'cross_geophysics',
    '04-测井新技术': 'inst_new',
    '05-测井地质学': 'cross_geophysics',
    '06-测井与钻井工程': 'cross',
    '99-其它资料': 'basic',
    '安全环保': 'standard_safety',
    '培训课件': 'basic',
    '专业标准': 'standard_norm',
    '科技成果': 'inst_new',
    '测井专业汇报': 'basic',
    '测井规范': 'standard_norm',
    '测井标准-MD': 'standard_norm',
};
const DEFAULT_CATEGORY_CODE = 'basic';

// ============================================================
// 简易 YAML frontmatter 解析器（无依赖）
// ============================================================
function parseFrontmatter(content) {
    const header = {};
    // 匹配 --- 包裹的 YAML frontmatter
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) {return { header, body: content };}

    const yaml = match[1];
    // 逐行解析简单 key-value
    let currentKey = null;
    const lines = yaml.split('\n');
    for (const line of lines) {
        const kvMatch = line.match(/^(\w+):\s*(.*)/);
        if (kvMatch) {
            currentKey = kvMatch[1];
            let val = kvMatch[2].trim();
            // 处理数组 [a, b, c]
            if (val.startsWith('[') && val.endsWith(']')) {
                val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
            }
            // 处理引号
            else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            header[currentKey] = val;
        } else if (currentKey) {
            // 多行值或列表 continuation
            const contMatch = line.match(/^\s+-\s+(.*)/);
            if (contMatch && Array.isArray(header[currentKey])) {
                header[currentKey].push(contMatch[1].trim());
            } else if (contMatch) {
                header[currentKey] = [header[currentKey], contMatch[1].trim()];
            }
        }
    }

    const body = content.slice(match[0].length);
    return { header, body };
}

function extractSummary(text, maxLen = 500) {
    // 去掉 ## 标题和空行，取前 maxLen 字符
    const clean = text.replace(/^#+\s+.*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    return clean.length > maxLen ? `${clean.slice(0, maxLen)  }...` : clean;
}

// ============================================================
// 目录扫描
// ============================================================
function scanMarkdownFiles(rootDir, dirFilter) {
    const files = [];

    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name.startsWith('_') || entry.name === '.obsidian') {continue;}
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_') && entry.name !== '.gitkeep') {
                files.push(fullPath);
            }
        }
    }

    if (dirFilter) {
        const targetDir = path.join(rootDir, dirFilter);
        if (fs.existsSync(targetDir)) {
            walk(targetDir);
        } else {
            console.error(`❌ 指定目录不存在: ${targetDir}`);
            process.exit(1);
        }
    } else {
        walk(rootDir);
    }

    return files.sort();
}

// ============================================================
// 分类查找/创建
// ============================================================
async function ensureCategory(code) {
    let cat = await Category.findOne({ code });
    if (!cat) {
        // 如果一级分类不存在，尝试按 code 前缀匹配
        const rootCode = code.split('_')[0];
        const rootMap = { basic: 'root_basic', instrument: 'root_instrument', standard: 'root_standard', cross: 'root_cross', operation: 'root_operation', case: 'root_case' };
        // 只创建一级分类（子分类手动补）
        const rootCat = await Category.findOne({ code: rootCode });
        if (!rootCat && rootMap[rootCode]) {
            const nameMap = { basic: '测井基础理论', instrument: '测井仪器设备', standard: '测井专业标准', cross: '跨专业知识', operation: '现场操作', case: '典型案例' };
            cat = await Category.create({
                id: rootMap[rootCode],
                name: nameMap[rootCode],
                code: rootCode,
                parentId: null,
                level: 1,
                sortOrder: Object.keys(rootMap).indexOf(rootCode) + 1,
                icon: 'fa-book',
            });
            console.log(`  📁 创建一级分类: ${cat.name} (${cat.code})`);
        } else if (rootCat) {
            cat = rootCat;
        } else {
            // fallback: 直接用 code
            cat = await Category.create({
                id: `auto_${code}`,
                name: code,
                code,
                parentId: null,
                level: 1,
                sortOrder: 99,
                icon: 'fa-book',
            });
        }
    }
    return cat;
}

// ============================================================
// 主流程
// ============================================================
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const limitArg = args.find(a => a.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0;
    const dirFilter = args.find(a => a.startsWith('--dir='));

    console.log('='.repeat(60));
    console.log('  Obsidian → 平台 内容同步');
    console.log('='.repeat(60));
    if (dryRun) {console.log('  ⚠️  试运行模式（不写入数据库）');}
    console.log('');

    // 1. 检查源目录
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`❌ Obsidian 目录不存在: ${SOURCE_DIR}`);
        console.error('   请确认路径正确，或修改脚本中的 OBSIDIAN_VAULT 变量');
        process.exit(1);
    }

    // 2. 扫描文件
    const mdFiles = scanMarkdownFiles(SOURCE_DIR, dirFilter ? dirFilter.split('=')[1] : null);
    console.log(`📄 找到 ${mdFiles.length} 个 .md 文件`);
    if (mdFiles.length === 0) {
        console.log('没有需要导入的文件');
        process.exit(0);
    }

    // 3. 连接数据库
    await dbAdapter.connect();
    console.log('✅ 数据库连接成功\n');

    // 4. 处理文件
    const stats = { total: mdFiles.length, created: 0, skipped: 0, failed: 0, errors: [] };
    const batchSize = limit > 0 ? Math.min(limit, mdFiles.length) : mdFiles.length;

    for (let i = 0; i < batchSize; i++) {
        const filePath = mdFiles[i];
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const dirName = relativePath.split(path.sep)[0];

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const { header, body } = parseFrontmatter(content);

            const title = header.title || header.aliases || path.basename(filePath, '.md');
            const keywords = []
                .concat(header.tags || [])
                .concat(header.keywords || [])
                .filter(Boolean);

            const categoryCode = DIR_CATEGORY_MAP[dirName] || DEFAULT_CATEGORY_CODE;
            const category = await ensureCategory(categoryCode);

            // 检查是否已存在（按 title 去重）
            const existing = await Knowledge.findOne({ title });
            if (existing) {
                console.log(`⏭️  [${i + 1}/${batchSize}] 跳过: ${title}（已存在）`);
                stats.skipped++;
                continue;
            }

            if (!dryRun) {
                const summary = extractSummary(body);
                await Knowledge.create({
                    title,
                    categoryId: category.id || category._id,
                    description: summary,
                    content: body,
                    keywords,
                    status: 'published',
                    createdBy: 'admin',
                });
            }

            console.log(`✅  [${i + 1}/${batchSize}] 导入: ${title} (${categoryCode})`);
            stats.created++;
        } catch (err) {
            console.error(`❌  [${i + 1}/${batchSize}] 失败: ${relativePath}`);
            console.error(`    错误: ${err.message}`);
            stats.failed++;
            stats.errors.push({ file: relativePath, error: err.message });
        }
    }

    // 5. 报告
    console.log(`\n${  '='.repeat(60)}`);
    console.log('📊 导入统计');
    console.log('='.repeat(60));
    console.log(`  总计: ${stats.total} 篇`);
    console.log(`  ✅ 新建: ${stats.created}`);
    console.log(`  ⏭️  跳过: ${stats.skipped}`);
    console.log(`  ❌ 失败: ${stats.failed}`);

    if (stats.errors.length > 0) {
        console.log('\n错误列表:');
        stats.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    }

    if (dryRun) {
        console.log('\n⚠️  试运行模式 - 未写入任何数据');
        console.log('   去掉 --dry-run 执行实际导入');
    }

    process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('💥 脚本异常:', err);
    process.exit(1);
});
