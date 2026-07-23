const fs = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../data/ai_config.json');

const MODEL_MAP = {
    DeepSeek: 'deepseek-chat',
    Kimi: 'moonshot-v1-8k',
    ChatGLM: 'glm-4',
    '通义千问': 'qwen-plus',
    混元: 'hunyuan-standard',
    MiniMax: 'MiniMax-M3',
};

const HARDCODED_URL = 'https://api.minimax.chat/v1/chat/completions';
const HARDCODED_KEY = 'sk-cp-qDbksTrYVPdKjHzwRo9m3MbFYMNlEJR_CZ8xSTU5FOhLPbv-N4X1BtErVX45HoqoAblkzyl6w9teagfTBoRn1I9KKJwIuBjTDQ9g4SFMvnWJniOfzuC3Xec';
const HARDCODED_MODEL = 'MiniMax-M3';

function loadConfig() {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(raw);
    } catch { return null; }
}

function buildChatUrl(baseUrl) {
    const u = baseUrl.replace(/\/+$/, '');
    return u.includes('/chat/completions') ? u : `${u  }/chat/completions`;
}

async function chat(messages, options = {}) {
    const cfg = loadConfig();
    const provider = cfg?.provider || 'MiniMax';
    const apiKey = cfg?.apiKey || HARDCODED_KEY;
    const chatUrl = cfg?.url ? buildChatUrl(cfg.url) : HARDCODED_URL;
    const model = MODEL_MAP[provider] || HARDCODED_MODEL;

    const resp = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
        }),
        signal: AbortSignal.timeout(options.timeout ?? 60000),
    });
    if (!resp.ok) {throw new Error(`API ${resp.status}: ${await resp.text()}`);}
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
}

module.exports = { chat };
