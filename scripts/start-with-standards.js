/**
 * 启动服务 + 测井标准导入（共享同一内存数据库）
 *
 * 用法: node scripts/start-with-standards.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('='.repeat(60));
console.log('  测井标准导入 + 服务启动');
console.log('='.repeat(60));

// 先启动服务（它会初始化内存DB）
const server = spawn('node', ['start.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, SKIP_IMPORT_PROMPT: 'true' },
});

// 等待服务就绪，然后运行导入
let imported = false;
server.stdout.on('data', (data) => {
  const text = data.toString();
  // 服务就绪后，导入数据（同一个进程里没法直接调用）
  if (!imported && text.includes('系统启动成功')) {
    imported = true;
    // 过一会儿再通过API导入
    setTimeout(() => runApiImport(server), 2000);
  }
});

server.on('error', (err) => {
  console.error('服务启动失败:', err);
  process.exit(1);
});

async function runApiImport(serverProcess) {
  try {
    const http = require('http');

    // 1. 登录获取token
    const loginData = await httpRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123',
    });

    const token = loginData.token;
    if (!token) {
      console.log('⚠️ 登录失败，跳过API导入。请手动运行 npm run import-standards');
      return;
    }
    console.log('✅ 管理员登录成功\n');

    // 2. 扫描源目录
    const fs = require('fs');
    const sourceDir = 'D:\\1测井站工作\\测井专业标准';
    const files = fs.readdirSync(sourceDir).filter(f =>
      ['.pdf', '.docx', '.doc'].includes(path.extname(f).toLowerCase())
    );

    console.log(`📂 源目录: ${sourceDir}`);
    console.log(`📄 待导入: ${files.length} 个文件\n`);

    // 分类映射
    const categoryMap = {
      'standard-instrument': '仪器与刻度标准',
      'standard-operation': '作业技术规范',
      'standard-safety': '安全规范',
      'standard-quality': '质量控制管理',
      'standard-data': '数据与资料规范',
    };

    // 文件名 → 分类 映射 (同 import-well-logging-standards.js 逻辑)
    function classifyFile(fileName) {
      const patterns = [
        { code: 'standard-instrument', tests: [/^0[12]-SY/, /^0[3-7]-SYT/, /^08-SYT6594/, /^0[9]-SYT6704/, /^1[0]-SYT6720/, /^11-SYT6786/, /^12-SYT6813/, /^18-SYT6449/, /^19-SYT6493/, /^57-SYT6741/, /^60-QSH.*0551/, /^66-SYT6704/] },
        { code: 'standard-operation', tests: [/^2[1-5]-SYT(5600|6030|7308|669[12])/, /^38-SYT5361/, /^39-SYT6751/, /^40-SYT5326/, /^4[2-7]-QSH/, /^53-QSH.*2622/, /^65-QSH.*3133/, /^67-SYT7411/, /^68-QSH0289/, /^69-QSH0537/, /^SYT 6548/] },
        { code: 'standard-safety', tests: [/^20-SYT6432/, /^2[6-9]-SY/, /^3[0-7]-SY/, /^41-AQ/, /^54-QSH0190/, /^55-QSH.*0997/, /^56-QSH.*0999/, /^58-SYT6429/, /^59-SY6634/, /^61-QSH.*0996/, /^62-QSH.*1154/, /^63-SYT6202/, /^64-GBT8196/] },
        { code: 'standard-quality', tests: [/^48-QSH0360/, /^49-QSH.*0332/, /^50-QSH.*1488/, /^51-QSH.*1490/, /^52-QSH.*2762/, /^24-SYT6691/, /测井监督站标准体系表/] },
        { code: 'standard-data', tests: [/^1[3-7]-SYT(5132|5633|5703|5751|5752)/] },
      ];
      for (const cat of patterns) {
        for (const test of cat.tests) {
          if (test.test(fileName)) {return cat.code;}
        }
      }
      return null;
    }

    // 3. 确保分类存在
    const cats = await httpRequest('GET', '/api/categories', null, token);
    const existingCats = cats.categories || cats || [];

    for (const [code, name] of Object.entries(categoryMap)) {
      const exists = Array.isArray(existingCats)
        ? existingCats.find(c => c.code === code || c.name === name)
        : false;
      if (!exists) {
        // 先查standard分类的id
        const allCats = await httpRequest('GET', '/api/categories', null, token);
        const parentId = (allCats.categories || allCats || []).find(c => c.code === 'standard' || c.name === '标准规范');
        await httpRequest('POST', '/api/categories', {
          name,
          code,
          parentId: parentId?._id || 'standard',
          level: 2,
          icon: { 'standard-instrument': 'fa-microscope', 'standard-operation': 'fa-hard-hat', 'standard-safety': 'fa-shield-alt', 'standard-quality': 'fa-clipboard-check', 'standard-data': 'fa-database' }[code],
        }, token);
      }
    }
    console.log('📁 分类准备完成\n');

    // 4. 逐个导入
    let imported = 0, skipped = 0, failed = 0;

    for (const fileName of files) {
      const sourcePath = path.join(sourceDir, fileName);
      const categoryCode = classifyFile(fileName);
      if (!categoryCode) {
        console.log(`  ⚠️ 跳过(无法分类): ${fileName}`);
        skipped++;
        continue;
      }

      const ext = path.extname(fileName).toLowerCase();
      const mimeMap = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      // 通过API上传文件
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fs.createReadStream(sourcePath), {
        filename: fileName,
        contentType: mimeMap[ext] || 'application/octet-stream',
      });
      form.append('category', categoryCode);
      form.append('tags', JSON.stringify([categoryMap[categoryCode], '测井标准']));

      const uploadUrl = `http://localhost:3000/api/files/upload`;

      try {
        const uploadRes = await new Promise((resolve, reject) => {
          form.submit(uploadUrl, { headers: { 'Authorization': `Bearer ${token}` } }, (err, res) => {
            if (err) {return reject(err);}
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
              try { resolve(JSON.parse(body)); }
              catch { reject(new Error(body)); }
            });
          });
        });

        if (uploadRes.success || uploadRes.file) {
          imported++;
          process.stdout.write(`  ✅ [${imported}/${files.length}] ${fileName}\n`);
        } else {
          failed++;
          process.stdout.write(`  ❌ ${fileName}: ${JSON.stringify(uploadRes)}\n`);
        }
      } catch (err) {
        // 如果文件API不支持，退回直接创建知识条目
        failed++;
        process.stdout.write(`  ❌ ${fileName}: ${err.message}\n`);
      }
    }

    // 总结
    console.log(`\n${  '='.repeat(60)}`);
    console.log('  导入完成');
    console.log('='.repeat(60));
    console.log(`  总计: ${files.length} | 导入: ${imported} | 跳过: ${skipped} | 失败: ${failed}`);
    console.log(`\n  🌐 访问地址: http://localhost:3000`);

  } catch (err) {
    console.error('导入过程出错:', err.message);
    console.log('\n⚠️ 服务已启动，数据未导入。可再试: node scripts/import-well-logging-standards.js');
  }
}

function httpRequest(method, urlPath, data, token) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const body = data ? JSON.stringify(data) : '';
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) {options.headers['Authorization'] = `Bearer ${token}`;}
    if (body) {options.headers['Content-Length'] = Buffer.byteLength(body);}

    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch { resolve(chunks); }
      });
    });
    req.on('error', reject);
    if (body) {req.write(body);}
    req.end();
  });
}
