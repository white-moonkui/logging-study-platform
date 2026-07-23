// 智能问答分析API路由
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 模拟大模型处理
class AIAnalysisService {
    constructor() {
        this.keywords = [
            '井下仪器',
            '遇卡',
            '电缆',
            '测井曲线',
            '异常',
            '放射性源',
            '安全',
            '校准',
            '参数',
            '地层',
            '泥浆',
            '井壁',
            '张力',
        ];
        this.knowledgeBase = new Map();
        this.loadKnowledgeBase();
    }

    async loadKnowledgeBase() {
        try {
            // 模拟加载知识库
            const knowledgePath = path.join(__dirname, '../data/knowledge.json');
            const data = await fs.readFile(knowledgePath, 'utf8');
            const knowledge = JSON.parse(data);

            knowledge.forEach(item => {
                this.knowledgeBase.set(item.id, item);
            });

            console.log('知识库加载完成，共', this.knowledgeBase.size, '条记录');
        } catch (error) {
            console.log('知识库加载失败，使用默认数据');
            this.initDefaultKnowledge();
        }
    }

    initDefaultKnowledge() {
        // 初始化默认知识库
        const defaultKnowledge = [
            {
                id: 'case_001',
                title: '井下仪器遇卡处置',
                category: '应急处置',
                content:
                    '井下仪器遇卡时应立即停止下放，检查电缆张力，分析遇卡原因。常见原因包括井壁坍塌、键槽效应、泥饼过厚等。',
                solution:
                    '1. 保持电缆张力在安全范围内；2. 尝试上下活动仪器；3. 如无效，考虑使用震击器；4. 严重时建议打捞。',
                keywords: ['遇卡', '张力', '电缆', '井下'],
            },
            {
                id: 'case_002',
                title: '测井曲线异常分析',
                category: '质量控制',
                content:
                    '测井曲线异常可能由仪器故障、井眼条件、地层变化等因素引起。需要对比多条曲线进行综合判断。',
                solution:
                    '1. 检查仪器工作状态；2. 重复测量验证；3. 对比邻井数据；4. 考虑环境影响校正。',
                keywords: ['曲线', '异常', '质量', '校准'],
            },
            {
                id: 'case_003',
                title: '放射性源安全规程',
                category: '安全管理',
                content:
                    '放射性源操作必须严格遵守安全规程，包括源罐检查、剂量监测、应急处理等环节。',
                solution:
                    '1. 立即疏散人员；2. 设置警戒区域；3. 使用剂量仪检测；4. 联系专业处理人员。',
                keywords: ['放射性', '安全', '源', '应急'],
            },
        ];

        defaultKnowledge.forEach(item => {
            this.knowledgeBase.set(item.id, item);
        });
    }

    // 关键词提取
    extractKeywords(text) {
        const extracted = [];
        const lowerText = text.toLowerCase();

        this.keywords.forEach(keyword => {
            if (lowerText.includes(keyword.toLowerCase())) {
                extracted.push(keyword);
            }
        });

        return extracted;
    }

    // 知识库检索
    searchKnowledge(keywords) {
        const results = [];

        this.knowledgeBase.forEach((item, id) => {
            let score = 0;

            // 计算匹配分数
            keywords.forEach(keyword => {
                if (item.title.includes(keyword) || item.content.includes(keyword)) {
                    score += 2;
                }

                item.keywords.forEach(itemKeyword => {
                    if (keyword.includes(itemKeyword) || itemKeyword.includes(keyword)) {
                        score += 3;
                    }
                });
            });

            if (score > 0) {
                results.push({ ...item, score });
            }
        });

        // 按分数排序
        return results.sort((a, b) => b.score - a.score);
    }

    // 生成AI回复
    async generateResponse(userMessage, attachments = []) {
        try {
            // 1. 关键词提取
            const keywords = this.extractKeywords(userMessage);

            // 2. 知识库检索
            const knowledgeResults = this.searchKnowledge(keywords);

            // 3. 构建回复
            let response = '';

            if (knowledgeResults.length > 0) {
                const bestMatch = knowledgeResults[0];

                response = `根据您的问题，我在知识库中找到了相关信息：\n\n`;
                response += `**相关案例：${bestMatch.title}**\n`;
                response += `${bestMatch.content}\n\n`;
                response += `**建议处置方案：**\n${bestMatch.solution}\n\n`;

                if (knowledgeResults.length > 1) {
                    response += `**其他相关案例：**\n`;
                    for (let i = 1; i < Math.min(3, knowledgeResults.length); i++) {
                        response += `- ${knowledgeResults[i].title}\n`;
                    }
                }
            } else {
                response = `抱歉，在现有知识库中没有找到完全匹配的信息。\n\n`;
                response += `基于您的描述，我提取到关键词：${keywords.join('、')}\n\n`;
                response += `**一般建议：**\n`;
                response += `1. 首先确保现场安全作业条件\n`;
                response += `2. 检查相关仪器设备状态\n`;
                response += `3. 参考相关技术标准和操作规程\n`;
                response += `4. 如问题严重，建议联系专业技术支持\n\n`;
                response += `您也可以提供更多详细信息，如具体参数、现场环境等，我将为您提供更精准的分析。`;
            }

            // 4. 处理附件信息
            if (attachments.length > 0) {
                response += `\n\n**附件分析：**\n`;
                response += `已收到${attachments.length}个附件，正在分析相关数据...`;

                // 模拟附件分析
                attachments.forEach((file, index) => {
                    response += `\n- ${file.name}: 文件类型${file.type}，大小${(file.size / 1024).toFixed(1)}KB`;
                });
            }

            return {
                success: true,
                response,
                keywords,
                knowledgeResults: knowledgeResults.slice(0, 5),
                processingTime: Math.random() * 2000 + 1000,
            };
        } catch (error) {
            console.error('AI分析错误:', error);
            return {
                success: false,
                error: '处理过程中发生错误，请稍后重试',
            };
        }
    }
}

// 创建AI分析服务实例
const aiService = new AIAnalysisService();

// 处理用户问题
router.post('/analyze', async (req, res) => {
    try {
        const { message, sessionId, attachments = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: '消息内容不能为空',
            });
        }

        console.log('收到用户问题:', message);
        console.log('附件数量:', attachments.length);

        // 调用AI分析服务
        const result = await aiService.generateResponse(message, attachments);

        // 记录对话历史
        const conversation = {
            sessionId: sessionId || 'default',
            timestamp: new Date().toISOString(),
            userMessage: message,
            aiResponse: result.response,
            keywords: result.keywords,
            attachments,
        };

        // 这里可以保存到数据库或文件
        saveConversation(conversation);

        res.json(result);
    } catch (error) {
        console.error('问题分析错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误',
        });
    }
});

// 获取对话历史
router.get('/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = await getConversationHistory(sessionId);

        res.json({
            success: true,
            history: history || [],
        });
    } catch (error) {
        console.error('获取历史记录错误:', error);
        res.status(500).json({
            success: false,
            error: '获取历史记录失败',
        });
    }
});

// 保存对话记录
async function saveConversation(conversation) {
    try {
        const historyFile = path.join(__dirname, '../data/conversation_history.json');
        let history = [];

        try {
            const data = await fs.readFile(historyFile, 'utf8');
            history = JSON.parse(data);
        } catch (error) {
            // 文件不存在，创建新数组
        }

        history.push(conversation);

        // 保持最近100条记录
        if (history.length > 100) {
            history = history.slice(-100);
        }

        await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('保存对话记录错误:', error);
    }
}

// 获取对话历史
async function getConversationHistory(sessionId) {
    try {
        const historyFile = path.join(__dirname, '../data/conversation_history.json');
        const data = await fs.readFile(historyFile, 'utf8');
        const history = JSON.parse(data);

        // 返回指定会话的历史记录
        return history.filter(item => item.sessionId === sessionId);
    } catch (error) {
        console.error('读取对话历史错误:', error);
        return [];
    }
}

// 外网大模型连接测试
router.post('/test-connect', async (req, res) => {
    try {
        const { provider, url, apiKey } = req.body;
        if (!url || !apiKey) {
            return res.status(400).json({ success: false, error: 'URL 和 API Key 不能为空' });
        }

        const axios = require('axios');

        const baseUrl = url.replace(/\/+$/, '');
        const chatUrl = baseUrl.includes('/chat/completions') ? baseUrl : `${baseUrl  }/chat/completions`;

        const modelMap = {
            DeepSeek: 'deepseek-chat',
            Kimi: 'moonshot-v1-8k',
            ChatGLM: 'glm-4',
            '通义千问': 'qwen-plus',
            '混元': 'hunyuan-standard',
            MiniMax: 'MiniMax-M3',
        };

        const headers = { 'Content-Type': 'application/json' };
        if (provider === '通义千问') {
            headers.Authorization = `Bearer ${apiKey}`;
        } else {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const resp = await axios.post(chatUrl, {
            model: modelMap[provider] || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 5,
        }, { headers, timeout: 15000 });

        res.json({ success: true });
    } catch (error) {
        const body = error.response?.data;
        const detail = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : error.message;
        res.json({ success: false, error: detail });
    }
});

// 外网大模型配置存储路径
const CONFIG_PATH = path.join(__dirname, '../data/ai_config.json');

// 保存外网大模型配置
router.post('/save-config', async (req, res) => {
    try {
        const { provider, url, apiKey } = req.body;
        await fs.writeFile(CONFIG_PATH, JSON.stringify({ provider, url, apiKey }, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 读取外网大模型配置
router.get('/load-config', async (req, res) => {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        res.json({ success: true, config: JSON.parse(data) });
    } catch {
        res.json({ success: true, config: null });
    }
});

module.exports = router;
