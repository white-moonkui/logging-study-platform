const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const aiService = require('../utils/aiService');
const minimax = require('../utils/minimaxService');

const sessions = new Map();
const upload = multer({
    dest: path.join(__dirname, '../uploads/temp/'),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = ['.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.md'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, ok.includes(ext));
    }
});

const VAULT = 'D:\\PEIHM-知识库\\裴宏明的知识库';

// ==================== 多轮对话 ====================
router.post('/chat', upload.single('file'), async (req, res) => {
    const prompt = (req.body.prompt || '').trim();
    const sessionId = req.body.sessionId || '';
    const file = req.file;

    if (!prompt && !file) {
        return res.status(400).json({ error: '请输入问题或上传文件' });
    }

    let session = sessions.get(sessionId);
    if (!session) {
        session = { id: Date.now().toString(36), history: [], contextKeywords: [], contextAnswer: '' };
        sessions.set(session.id, session);
    }
    if (sessions.size > 50) {
        const first = sessions.keys().next().value;
        sessions.delete(first);
    }

    const workflow = [];

    try {
        // ===== Step 1: 文件解析 =====
        let fileText = '';
        if (file) {
            workflow.push({ step: 1, name: '文件解析', status: 'running' });
            fileText = await parseUploadedFile(file);
            workflow[workflow.length - 1] = { step: 1, name: '文件解析', status: 'done', detail: `提取 ${  fileText.length  } 字符` };
        } else {
            workflow.push({ step: 1, name: '文件解析', status: 'skip', detail: '未上传文件' });
        }

        // ===== Step 2: 关键词提取 =====
        workflow.push({ step: 2, name: '关键词提取', status: 'running' });
        const combined = [prompt, fileText, session.contextAnswer, session.history.map((h) => { return h.q; }).join(' ')].filter(Boolean).join(' ');
        let keywords = [];
        try {
            const kr = await aiService.extractKeywords(combined);
            if (kr && kr.keywords && kr.keywords.length) {keywords = kr.keywords;}
        } catch (e) { /* fallback */ }
        if (keywords.length < 2) {keywords = extractKeywordsSimple(combined);}
        const merged = [...new Set(keywords.concat(session.contextKeywords))];
        workflow[workflow.length - 1] = { step: 2, name: '关键词提取', status: 'done', detail: `提取 ${  merged.length  } 个关键词`, keywords: merged };

        // ===== Step 3: 知识库搜索 =====
        workflow.push({ step: 3, name: '知识库搜索', status: 'running' });
        const kbItems = await searchVault(merged, prompt);
        workflow[workflow.length - 1] = { step: 3, name: '知识库搜索', status: 'done', detail: `找到 ${  kbItems.length  } 条相关记录` };

        // ===== Step 4: 公网搜索 =====
        let webItems = [];
        if (kbItems.length < 3) {
            workflow.push({ step: 4, name: '公网搜索补充', status: 'running' });
            webItems = await webSearch(merged, prompt);
            workflow[workflow.length - 1] = { step: 4, name: '公网搜索补充', status: 'done', detail: `补充 ${  webItems.length  } 条` };
        } else {
            workflow.push({ step: 4, name: '公网搜索补充', status: 'skip', detail: '本地库已覆盖' });
        }

        // ===== Step 5: 结果整理 =====
        workflow.push({ step: 5, name: '结果整理', status: 'running' });
        const organized = organizeResults(kbItems, webItems);
        workflow[workflow.length - 1] = { step: 5, name: '结果整理', status: 'done', detail: `整理 ${  organized.sections.length  } 个主题` };

        // ===== Step 6: 答案生成 =====
        workflow.push({ step: 6, name: '答案生成', status: 'running' });
        const answer = await buildAnswer(prompt, organized, session);
        workflow[workflow.length - 1] = { step: 6, name: '答案生成', status: 'done' };

        session.history.push({ q: prompt, keywords: merged, answer: answer.summary || '' });
        session.contextKeywords = merged;
        session.contextAnswer = answer.summary || '';

        res.json({ sessionId: session.id, workflow, answer, context: { keywords: merged } });

    } catch (err) {
        console.error('AI推荐工作流错误:', err);
        res.status(500).json({ error: `处理失败: ${  err.message}`, workflow });
    }
});

// ==================== 清空会话 ====================
router.post('/clear', (req, res) => {
    const id = req.body.sessionId;
    if (id) {sessions.delete(id);}
    res.json({ ok: true });
});

// ==================== 文件解析 ====================
async function parseUploadedFile(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    const filePath = file.path;

    if (ext === '.txt' || ext === '.md') {
        const text = fs.readFileSync(filePath, 'utf-8');
        cleanup(file);
        return text;
    }

    try {
        const result = execSync(`python -c "from markitdown import MarkItDown; import sys; print(MarkItDown().convert(sys.argv[1]).text_content)" ${  JSON.stringify(filePath)}`, { timeout: 30000, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        cleanup(file);
        return (result.stdout || '').trim();
    } catch (e) {
        cleanup(file);
        return `[文件 ${  file.originalname  } 无法自动解析文本，请手动描述文件内容]`;
    }
}

function cleanup(file) {
    try { if (file && file.path) {fs.unlinkSync(file.path);} } catch (e) { }
}

// ==================== 关键词提取（兜底） ====================
function extractKeywordsSimple(text) {
    const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '如果', '虽然', '可以', '这个', '那个', '需要', '进行', '通过', '使用', '以及', '其中', '之后', '之前', '目前', '已经', '可能', '以及', '用于', '具有', '包括', '主要', '其他', '相关', '不同', '一定', '之间', '方面', '部分', '情况', '问题', '方法', '方式', '过程', '结果', '影响', '作用', '条件', '时间', '位置', '工作', '作业', '施工', '数据', '资料', '分析', '处理', '测量', '测试', '技术', '工艺', '设备', '仪器', '系统', '信息', '管理', '控制', '质量', '安全', '标准', '规范', '要求', '规定', '参数', '性能', '指标', '曲线', '深度', '井眼', '地层', '钻井', '测井', '录井', '完井', '解释', '评价', '识别', '判断', '诊断', '推荐', '建议', '方案', '措施', '对策', '策略', '改进', '优化', '提升', '提高', '加强', '增加', '减少', '降低', '避免', '防止', '预防', '保障']);
    const words = text.split(/[\s,，。；;：:、！!？?（）()【】\[\]{}""''"\n\r\t]+/).filter((w) => { return w.length >= 2 && !stopWords.has(w); });
    const freq = {};
    words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => { return b[1] - a[1]; }).slice(0, 15).map((e) => { return e[0]; });
}

// ==================== 知识库搜索 ====================
function searchVault(keywords, prompt) {
    let results = [];
    if (!fs.existsSync(VAULT)) {return results;}

    try {
        const files = walkDir(VAULT);
        const promptWords = prompt ? prompt.toLowerCase().split(/[\s,，。；;：:、！!？?]/).filter((w) => { return w.length >= 2; }) : [];
        const allTerms = [...new Set(keywords.concat(promptWords))];

        files.forEach((fp) => {
            try {
                const content = fs.readFileSync(fp, 'utf-8');
                const lower = content.toLowerCase();
                let score = 0;
                const matched = [];
                allTerms.forEach((term) => {
                    const t = term.toLowerCase();
                    const idx = lower.indexOf(t);
                    if (idx !== -1) {
                        const count = (lower.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                        score += count;
                        matched.push(term);
                    }
                });
                if (score > 0) {
                    const relPath = path.relative(VAULT, fp);
                    results.push({ file: relPath, score, matched, snippet: extractSnippet(content, matched[0] || '') });
                }
            } catch (e) { }
        });

        results.sort((a, b) => { return b.score - a.score; });
        results = results.slice(0, 10);
    } catch (e) { }

    return results;
}

function walkDir(dir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach((f) => {
            const fp = path.join(dir, f);
            try {
                const stat = fs.statSync(fp);
                if (stat.isDirectory() && !f.startsWith('_') && f !== '.obsidian' && f !== 'node_modules') {
                    results = results.concat(walkDir(fp));
                } else if (stat.isFile() && f.endsWith('.md')) {
                    results.push(fp);
                }
            } catch (e) { }
        });
    } catch (e) { }
    return results;
}

function extractSnippet(content, keyword) {
    if (!keyword) {return content.slice(0, 150);}
    const idx = content.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx === -1) {return content.slice(0, 150);}
    const start = Math.max(0, idx - 60);
    const end = Math.min(content.length, idx + 90);
    return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}

// ==================== 公网搜索 ====================
async function webSearch(keywords, prompt) {
    let items = [];
    const query = [prompt].concat(keywords.slice(0, 3)).filter(Boolean).join(' ');
    if (!query) {return items;}
    try {
        const url = `https://api.bochaai.com/v1/ai/search?query=${  encodeURIComponent(query)  }&count=5`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
            const data = await resp.json();
            if (data && data.data && data.data.results) {
                items = data.data.results.map((r) => { return { title: r.title, url: r.url, snippet: r.snippet || '' }; });
            }
        }
    } catch (e) { }
    return items;
}

// ==================== 结果整理 ====================
function organizeResults(kbItems, webItems) {
    const sections = [];
    const allText = kbItems.map((i) => { return i.snippet; }).concat(webItems.map((i) => { return i.snippet; })).join(' ');
    if (kbItems.length > 0) {
        sections.push({ title: '本地知识库', items: kbItems.map((i) => { return { source: i.file, content: i.snippet }; }) });
    }
    if (webItems.length > 0) {
        sections.push({ title: '公网参考', items: webItems.map((i) => { return { source: i.title, content: i.snippet }; }) });
    }
    return { sections, allText };
}

// ==================== 答案生成 ====================
async function buildAnswer(prompt, organized, session) {
    const contextText = organized.allText.slice(0, 3000);

    const messages = [{ role: 'system', content: '你是一位资深测井监督专家，回答专业、准确、简洁。' }];

    if (session.history.length > 1) {
        let historyText = '对话历史：\n';
        session.history.slice(-3).forEach((h) => {
            historyText += `问：${  h.q  }\n答：${  (h.answer || '').slice(0, 200)  }\n\n`;
        });
        messages.push({ role: 'system', content: historyText });
    }

    messages.push({
        role: 'user',
        content: `参考资料：\n${  contextText  }\n\n问题：${  prompt  }\n\n请按以下格式回答：\n**问题分析**：\n\n**处置建议**：\n\n**参考依据**：\n\n**注意事项**：`
    });

    let answerText;
    try {
        answerText = await minimax.chat(messages, { temperature: 0.5 });
    } catch (e) {
        console.error('MiniMax调用失败，降级到规则引擎:', e.message);
        answerText = generateFallbackAnswer(prompt, organized, session);
    }

    const summary = `${answerText.slice(0, 100)  }...`;

    return {
        summary,
        full: answerText,
        structured: answerText
    };
}

function generateFallbackAnswer(prompt, organized, session) {
    const lines = [];
    lines.push('**问题分析**：');
    lines.push(`根据您的问题"${  prompt  }"，结合知识库中${  organized.sections.length  }个相关主题的内容进行分析。`);
    lines.push('');
    lines.push('**处置建议**：');
    const snippets = [];
    organized.sections.forEach((s) => {
        s.items.forEach((item) => {
            const clean = item.content.replace(/\n/g, ' ').trim();
            if (clean.length > 30) {snippets.push(clean.slice(0, 200));}
        });
    });
    if (snippets.length > 0) {
        lines.push(snippets.slice(0, 3).join('\n\n'));
    } else {
        lines.push('建议：1. 核实现场实际情况；2. 参照相关标准规范执行；3. 做好过程记录。');
    }
    lines.push('');
    lines.push('**参考依据**：');
    organized.sections.forEach((s) => {
        lines.push(`- ${  s.title  } (${  s.items.length  }条)`);
        s.items.slice(0, 3).forEach((item) => {
            lines.push(`  · ${  item.source.slice(0, 50)}`);
        });
    });
    lines.push('');
    lines.push('**注意事项**：');
    lines.push('1. 以上建议仅供参考，现场应以实际情况为准。\n2. 涉及安全操作应严格执行相关安全规程。\n3. 建议结合最新的技术标准和规范进行综合判断。');

    if (session.history.length > 1) {
        lines.push('');
        lines.push('---');
        lines.push(`**本轮已结合前 ${  session.history.length - 1  } 轮对话上下文进行分析**`);
    }

    return lines.join('\n');
}

module.exports = router;
