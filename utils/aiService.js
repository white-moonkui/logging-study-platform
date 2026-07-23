const axios = require('axios');
const LocalAIService = require('./localAIService');

class AIService {
    constructor() {
        this.baseURL = process.env.AI_SERVICE_URL;
        this.apiKey = process.env.AI_API_KEY;
        this.useLocalAI = process.env.USE_LOCAL_AI === 'true';
        this.localAI = null;
        this.isInitialized = false;

        // ========== Rate Limit 优化配置 ==========
        // 请求缓存（LRU）- 避免重复调用
        this.cache = new Map();
        this.MAX_CACHE_SIZE = 100; // 最多缓存 100 个请求
        this.CACHE_TTL = 5 * 60 * 1000; // 缓存 5 分钟

        // Token 控制
        this.MAX_PROMPT_TOKENS = 800; // 提示词不超过 800 tokens
        this.MAX_RESPONSE_TOKENS = 512; // 响应不超过 512 tokens（总计 < 1024）
    }

    // ========== 缓存方法 ==========
    getCacheKey(prompt, type = 'default') {
        // 改进的缓存 key 生成：包含完整内容哈希 + 类型 + 内容长度
        const crypto = require('crypto');
        const contentHash = crypto.createHash('md5').update(prompt).digest('hex');
        const typePrefix = type.toUpperCase().replace(/\s+/g, '_');
        return `${typePrefix}_${contentHash}_${prompt.length}`;
    }

    getFromCache(prompt, type = 'default') {
        const key = this.getCacheKey(prompt, type);
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log(`[缓存命中] ${type} 请求`);
            return cached.result;
        }
        return null;
    }

    setCache(prompt, result, type = 'default') {
        const key = this.getCacheKey(prompt, type);
        this.cache.set(key, { result, timestamp: Date.now() });

        // LRU 淘汰旧缓存
        if (this.cache.size > this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    // ========== 内容摘要方法 ==========
    summarizeContent(content, maxLength = 500) {
        if (content.length <= maxLength) {return content;}

        // 提取关键段落（保留首尾，中间截断）
        const head = content.substring(0, Math.floor(maxLength * 0.4));
        const tail = content.substring(content.length - Math.floor(maxLength * 0.3));

        return `${head}...[摘要:${content.length}字符]...${tail}`;
    }

    // ========== Prompt 精简方法 ==========
    compactPrompt(prompt) {
        // 移除多余空白和换行
        return prompt.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();
    }

    // ========== 延迟方法 ==========
    sleep(minMs = 1000, maxMs = 5000) {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // ========== 功能类型识别 ==========
    getFunctionType(prompt) {
        const p = prompt.toLowerCase();
        if (p.includes('生成题目') || p.includes('选择题') || p.includes('quiz'))
            {return 'GENERATE_QUESTIONS';}
        if (p.includes('关键词') || p.includes('keyword')) {return 'EXTRACT_KEYWORDS';}
        if (p.includes('评估') || p.includes('评分') || p.includes('evaluate')) {return 'EVALUATE';}
        if (p.includes('案例') || p.includes('创新')) {return 'CASE_EVALUATION';}
        if (p.includes('能力') || p.includes('ability')) {return 'ABILITY_EVALUATION';}
        if (p.includes('问题') && (p.includes('建议') || p.includes('解决')))
            {return 'PROBLEM_SOLUTION';}
        return 'DEFAULT';
    }

    // 初始化AI服务
    async initialize() {
        if (this.isInitialized) {return;}

        // 创建本地AI实例
        this.localAI = new LocalAIService();

        // 不等待ready事件，立即设置为已初始化
        // 这样可以立即提供服务，即使本地AI还在加载中
        this.isInitialized = true;

        // 异步初始化本地AI服务
        this.localAI.initialize().catch(err => {
            console.warn('本地AI服务初始化失败:', err.message);
        });
    }

    // 调用AI服务
    async callAI(prompt, maxTokens = null) {
        // 确保已初始化
        if (!this.isInitialized) {
            await this.initialize();
        }

        // 控制 token 消耗
        const actualMaxTokens = Math.min(
            maxTokens || this.MAX_RESPONSE_TOKENS,
            this.MAX_RESPONSE_TOKENS
        );

        // 精简 prompt
        const compactPrompt = this.compactPrompt(prompt);

        // 检查缓存 - 使用功能类型
        const funcType = this.getFunctionType(prompt);
        const cacheKey = this.getCacheKey(compactPrompt, funcType);
        const cachedResult = this.getFromCache(compactPrompt, funcType);
        if (cachedResult) {
            return cachedResult;
        }

        try {
            // 优先使用本地AI服务
            if (this.useLocalAI || !this.baseURL || !this.apiKey) {
                if (this.localAI && !this.localAI.isReady) {
                    // 如果本地AI还没就绪，等待一下
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                if (this.localAI) {
                    const result = await this.localAI.callAI(compactPrompt, actualMaxTokens);
                    this.setCache(compactPrompt, result, funcType);
                    return result;
                }
                // 如果没有本地AI，返回降级响应
                return this.getFallbackResponse(compactPrompt, funcType);
            }

            const response = await axios.post(
                this.baseURL,
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的石油工程测井专家，简洁回答。',
                        },
                        {
                            role: 'user',
                            content: compactPrompt,
                        },
                    ],
                    max_tokens: actualMaxTokens,
                    temperature: 0.5,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            const result = response.data.choices[0].message.content;
            this.setCache(compactPrompt, result, funcType);
            return result;
        } catch (error) {
            // 确保本地AI已初始化
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.error('远程AI服务调用失败，尝试本地AI:', error.message);
            // 降级到本地AI
            try {
                if (this.localAI && !this.localAI.isReady) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                if (this.localAI) {
                    const result = await this.localAI.callAI(compactPrompt, actualMaxTokens);
                    this.setCache(compactPrompt, result, funcType);
                    return result;
                }
                throw new Error('本地AI服务不可用');
            } catch (localError) {
                console.error('本地AI服务也失败，使用规则引擎降级:', localError.message);
                return this.getFallbackResponse(compactPrompt, funcType);
            }
        }
    }

    // 获取降级响应
    getFallbackResponse(prompt, funcType = 'DEFAULT') {
        if (
            funcType === 'GENERATE_QUESTIONS' ||
            prompt.includes('生成题目') ||
            prompt.includes('generateQuestions')
        ) {
            return JSON.stringify({
                questions: [
                    {
                        questionText: '测井中自然伽马测井主要用于什么？',
                        options: ['识别岩性', '测量孔隙度', '计算电阻率', '测量温度'],
                        correctAnswer: 0,
                        explanation: '自然伽马测井主要用于识别岩性和判断泥质含量。',
                        difficulty: 'medium',
                        keywords: ['自然伽马', '岩性识别'],
                    },
                ],
            });
        } else if (
            funcType === 'EXTRACT_KEYWORDS' ||
            prompt.includes('关键词') ||
            prompt.includes('extractKeywords')
        ) {
            return JSON.stringify({
                keywords: ['测井', '解释', '评价', '数据处理'],
                missingKeywords: [],
            });
        } else {
            return JSON.stringify({ message: 'AI服务暂时不可用，请稍后重试' });
        }
    }

    // 生成考试题目
    async generateQuestions({
        content,
        title,
        keywords,
        questionCount = 5,
        difficulty = 'medium',
    }) {
        // 使用摘要模式精简内容
        const summarizedContent = this.summarizeContent(content, 500);
        const summarizedKeywords = keywords.slice(0, 5).join('、');

        const prompt = `基于测井知识生成${questionCount}道${difficulty}题：标题${title}，关键词${summarizedKeywords}，内容：${summarizedContent}

要求：每题4选1，JSON格式返回{
    "questions": [{
        "questionText": "题目",
        "options": ["A","B","C","D"],
        "correctAnswer": 0,
        "explanation": "解释",
        "difficulty": "${difficulty}",
        "keywords": ["关键词"]
    }]
}`;

        try {
            // 批量任务添加间隔，避免 rate limit
            await this.sleep(1000, 3000);

            const response = await this.callAI(prompt, 800);
            console.log('AI response:', response);

            try {
                const parsed = JSON.parse(response);
                return parsed.questions || [];
            } catch (error) {
                console.log('JSON parse failed, trying fallback');
                return this.parseQuestionsFromText(response);
            }
        } catch (error) {
            console.error('generateQuestions error:', error.message);
            // 返回默认题目
            return [
                {
                    questionText: '测井中自然伽马测井主要用于什么？',
                    options: ['识别岩性', '测量孔隙度', '计算电阻率', '测量温度'],
                    correctAnswer: 0,
                    explanation: '自然伽马测井主要用于识别岩性和判断泥质含量。',
                    difficulty: 'medium',
                    keywords: ['自然伽马', '岩性识别'],
                },
            ];
        }
    }

    // 案例创新度评估
    async evaluateCaseInnovation(caseData) {
        // 摘要模式精简内容
        const summarizedProblem = this.summarizeContent(caseData.problemStatement, 200);
        const summarizedSolution = this.summarizeContent(caseData.solution, 300);
        const summarizedKeywords = caseData.keywords.slice(0, 5).join('、');

        const prompt = `测井案例评估：标题${caseData.title}，问题${summarizedProblem}，方案${summarizedSolution}，关键词${summarizedKeywords}

评分(0-100)：创新度、技术准确性、实用价值、完整性
返回JSON：{
    "innovationScore": 85,
    "technicalAccuracy": 90,
    "practicalValue": 80,
    "completenessScore": 75,
    "recommendations": ["建议"],
    "similarCasesFeatures": ["特征"],
    "improvements": ["改进"],
    "overallComments": "评价"
}`;

        // 批量任务添加间隔
        await this.sleep(1500, 4000);
        const response = await this.callAI(prompt, 1000);

        try {
            return JSON.parse(response);
        } catch (error) {
            throw new Error('AI评估结果解析失败');
        }
    }

    // 关键字提取
    async extractKeywords(text) {
        const summarizedText = this.summarizeContent(text, 500);

        const prompt = `从测井文本提取5-10个关键词：${summarizedText}

返回JSON：{
    "keywords": ["关键词1", "关键词2"],
    "missingKeywords": ["建议补充"]
}`;

        await this.sleep(1000, 3000);
        const response = await this.callAI(prompt, 512);

        try {
            return JSON.parse(response);
        } catch (error) {
            // 简单的关键词提取备选方案
            return this.simpleKeywordExtraction(text);
        }
    }

    // 现场问题处置建议
    async generateProblemSolution(problemDescription) {
        const summarizedProblem = this.summarizeContent(problemDescription, 400);

        const prompt = `测井现场问题：${summarizedProblem}

请提供：
1. 问题分析
2. 可能原因
3. 解决方案(按优先级)
4. 预防措施
5. 相关标准

返回JSON：{
    "analysis": "分析",
    "possibleCauses": ["原因"],
    "solutions": [{"solution": "方案", "priority": "高", "steps": ["步骤"], "estimatedTime": "时间", "resources": ["资源"]}],
    "prevention": ["预防"],
    "relatedStandards": ["标准"],
    "riskLevel": "等级"
}`;

        await this.sleep(1500, 4000);
        const response = await this.callAI(prompt, 1000);

        try {
            return JSON.parse(response);
        } catch (error) {
            throw new Error('生成解决方案失败');
        }
    }

    // 能力评估
    async evaluateAbility(userAnswers, examQuestions) {
        // 精简数据
        const summaryQuestions = examQuestions.slice(0, 3);
        const summaryAnswers = userAnswers.slice(0, 3);

        const prompt = `测井能力评估：题目${JSON.stringify(summaryQuestions)}，用户答案${JSON.stringify(summaryAnswers)}

评分(0-100)：专业知识、标准应用、跨学科整合、实操能力、决策能力
返回JSON：{
    "scores": {"professionalKnowledge": 85, "standardApplication": 70, "crossIntegration": 65, "practicalSkills": 60, "decisionAbility": 75},
    "weaknesses": ["弱点"],
    "recommendations": ["建议"],
    "suggestedContent": ["推荐内容"]
}`;

        await this.sleep(1000, 3000);
        const response = await this.callAI(prompt, 800);

        try {
            return JSON.parse(response);
        } catch (error) {
            // 返回默认评估结果
            return this.getDefaultAbilityEvaluation();
        }
    }

    // 简单关键词提取（备选方案）
    simpleKeywordExtraction(text) {
        const commonKeywords = [
            '测井',
            '电阻率',
            '伽马',
            '中子',
            '密度',
            '声波',
            '井眼',
            '地层',
            '储层',
            '钻井液',
            '侵入',
            '校正',
            '解释',
            '评价',
            '仪器',
            '现场',
            '作业',
            '安全',
        ];

        const found = commonKeywords.filter(keyword => text.includes(keyword));

        return {
            keywords: found.slice(0, 8),
            missingKeywords: [],
        };
    }

    // 从文本解析题目（备选方案）
    parseQuestionsFromText(text) {
        // 简单的文本解析逻辑
        const questions = [];
        // 这里可以实现更复杂的文本解析逻辑
        return questions;
    }

    // 默认能力评估
    getDefaultAbilityEvaluation() {
        return {
            scores: {
                professionalKnowledge: 60,
                standardApplication: 60,
                crossIntegration: 60,
                practicalSkills: 60,
                decisionAbility: 60,
            },
            weaknesses: ['需要更多实践练习'],
            recommendations: ['建议加强基础知识学习'],
            suggestedContent: ['测井基础原理', '标准操作规程'],
        };
    }
}

// 创建单例实例
const aiServiceInstance = new AIService();

// 导出实例方法，确保正确的this绑定
module.exports = {
    callAI: aiServiceInstance.callAI.bind(aiServiceInstance),
    generateQuestions: aiServiceInstance.generateQuestions.bind(aiServiceInstance),
    evaluateCaseInnovation: aiServiceInstance.evaluateCaseInnovation.bind(aiServiceInstance),
    extractKeywords: aiServiceInstance.extractKeywords.bind(aiServiceInstance),
    evaluateAbility: aiServiceInstance.evaluateAbility.bind(aiServiceInstance),
    initialize: aiServiceInstance.initialize.bind(aiServiceInstance),
};
