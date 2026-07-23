const axios = require('axios');
const EventEmitter = require('events');

/**
 * 内网环境AI服务适配器
 * 支持通过代理访问外网大模型，或降级到本地AI服务
 */
class NetworkAIService extends EventEmitter {
    constructor() {
        super();
        this.isReady = false;
        this.aiServicePriority = process.env.AI_SERVICE_PRIORITY || 'local';
        this.proxyConfig = {
            host: process.env.PROXY_HOST,
            port: process.env.PROXY_PORT,
            username: process.env.PROXY_USERNAME,
            password: process.env.PROXY_PASSWORD,
        };
        this.externalConfig = {
            url: process.env.AI_SERVICE_URL,
            apiKey: process.env.AI_API_KEY,
        };
    }

    async initialize() {
        console.log('正在初始化内网环境AI服务...');

        // 初始化超时设置
        this.timeout = {
            test: 10000, // 测试连接超时10秒
            request: 30000, // 实际请求超时30秒
            local: 10000, // 本地服务超时10秒
        };

        try {
            // 根据优先级初始化AI服务
            switch (this.aiServicePriority) {
                case 'proxy':
                    await this.initializeProxyService();
                    break;
                case 'external':
                    await this.initializeExternalService();
                    break;
                case 'local':
                default:
                    await this.initializeLocalService();
                    break;
            }
        } catch (error) {
            console.warn('主AI服务初始化失败，降级到本地服务:', error.message);
            await this.initializeLocalService();
        }

        this.isReady = true;
        this.emit('ready');
    }

    async initializeProxyService() {
        if (!this.proxyConfig.host) {
            throw new Error('代理服务器配置缺失');
        }

        console.log('配置代理AI服务...');

        // 测试代理连接
        const testResponse = await this.makeProxyRequest({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: '测试连接' }],
            max_tokens: 10,
        });

        if (testResponse) {
            console.log('✅ 代理AI服务连接成功');
            this.currentService = 'proxy';
        }
    }

    async initializeExternalService() {
        console.log('尝试直接连接外部AI服务...');

        try {
            const testResponse = await axios.post(
                this.externalConfig.url,
                {
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: '测试连接' }],
                    max_tokens: 10,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.externalConfig.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: this.timeout.test, // 使用统一的测试超时
                }
            );

            console.log('✅ 外部AI服务连接成功');
            this.currentService = 'external';
        } catch (error) {
            throw new Error('外部AI服务不可达');
        }
    }

    async initializeLocalService() {
        console.log('初始化本地AI服务...');

        const LocalAIService = require('./localAIService');
        this.localAIService = new LocalAIService();

        // 等待本地AI服务初始化完成，带超时保护
        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                console.warn('本地AI服务初始化超时，使用规则引擎');
                resolve(); // 即使超时也继续
            }, this.timeout.local);

            this.localAIService.once('ready', () => {
                clearTimeout(timeoutId);
                resolve();
            });

            this.localAIService.once('error', () => {
                clearTimeout(timeoutId);
                resolve(); // 错误时也继续，使用规则引擎
            });

            this.localAIService.initialize();
        });

        console.log('✅ 本地AI服务初始化完成');
        this.currentService = 'local';
    }

    async makeProxyRequest(data) {
        try {
            // 创建代理配置
            const proxyUrl = `http://${this.proxyConfig.username}:${this.proxyConfig.password}@${this.proxyConfig.host}:${this.proxyConfig.port}`;

            const response = await axios.post(this.externalConfig.url, data, {
                headers: {
                    Authorization: `Bearer ${this.externalConfig.apiKey}`,
                    'Content-Type': 'application/json',
                },
                proxy: {
                    protocol: 'http',
                    host: this.proxyConfig.host,
                    port: parseInt(this.proxyConfig.port),
                    auth: {
                        username: this.proxyConfig.username,
                        password: this.proxyConfig.password,
                    },
                },
                timeout: this.timeout.request, // 使用统一的请求超时（30秒）
            });

            return response.data;
        } catch (error) {
            console.error('代理请求失败:', error.message);
            throw error;
        }
    }

    // 统一的AI调用接口
    async generateQuestions(params) {
        switch (this.currentService) {
            case 'proxy':
                return await this.generateQuestionsProxy(params);
            case 'external':
                return await this.generateQuestionsExternal(params);
            case 'local':
            default:
                return await this.localAIService.generateQuestions(params);
        }
    }

    async generateQuestionsProxy(params) {
        const prompt = `请为测井专业培训生成${params.count || 5}道选择题。
知识点：${params.topic || '测井基础'}
难度：${params.difficulty || '中等'}

请返回JSON格式的结果，包含：
- questionText: 问题文本
- options: 选项数组（4个选项）
- correctAnswer: 正确答案索引（0-3）
- explanation: 解释说明`;

        try {
            const response = await this.makeProxyRequest({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
            });

            // 解析AI返回的结果
            const content = response.choices[0].message.content;
            const questions = this.parseAIResponse(content);

            return questions;
        } catch (error) {
            console.error('代理AI生成题目失败，降级到本地服务');
            return await this.localAIService.generateQuestions(params);
        }
    }

    async generateQuestionsExternal(params) {
        // 实现外部服务调用逻辑
        const prompt = `请为测井专业培训生成${params.count || 5}道选择题。
知识点：${params.topic || '测井基础'}
难度：${params.difficulty || '中等'}

请返回JSON格式的结果...`;

        try {
            const response = await axios.post(
                this.externalConfig.url,
                {
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.externalConfig.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: this.timeout.request, // 添加超时配置
                }
            );

            const content = response.choices[0].message.content;
            return this.parseAIResponse(content);
        } catch (error) {
            console.error('外部AI生成题目失败，降级到本地服务');
            return await this.localAIService.generateQuestions(params);
        }
    }

    parseAIResponse(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            console.error('AI响应解析失败，返回默认题目');
            return require('./localAIService').defaultResponses.generateQuestions;
        }
    }

    // 其他AI方法的代理实现...
    async evaluateCaseInnovation(params) {
        if (this.currentService === 'local' || !this.localAIService) {
            return await this.localAIService.evaluateCaseInnovation(params);
        }
        // 实现代理调用逻辑
        return await this.localAIService.evaluateCaseInnovation(params);
    }

    async extractKeywords(params) {
        if (this.currentService === 'local' || !this.localAIService) {
            return await this.localAIService.extractKeywords(params);
        }
        // 实现代理调用逻辑
        return await this.localAIService.extractKeywords(params);
    }

    getStatus() {
        return {
            isReady: this.isReady,
            currentService: this.currentService,
            priority: this.aiServicePriority,
            proxyConfigured: !!this.proxyConfig.host,
            externalConfigured: !!this.externalConfig.apiKey,
        };
    }
}

module.exports = NetworkAIService;
