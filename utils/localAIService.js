const { spawn } = require('child_process');
const EventEmitter = require('events');

class LocalAIService extends EventEmitter {
    constructor() {
        super();
        this.process = null;
        this.isReady = false;
        this.modelPath = process.env.LOCAL_MODEL_PATH || './models';
        this.defaultResponses = {
            generateQuestions: [
                {
                    questionText: '测井中自然伽马测井主要用于什么？',
                    questionType: 'single_choice',
                    options: ['识别岩性和泥质含量', '测量孔隙度', '计算电阻率', '测量温度'],
                    correctAnswer: 0,
                    explanation: '自然伽马测井主要用于识别岩性和判断泥质含量。',
                    points: 2,
                    difficulty: 'easy',
                },
                {
                    questionText: '电阻率测井的主要影响因素包括？',
                    questionType: 'multiple_choice',
                    options: ['含水饱和度', '孔隙水矿化度', '岩性', '温度'],
                    correctAnswer: [0, 1, 2],
                    explanation: '电阻率受含水饱和度、孔隙水矿化度、岩性等多种因素影响。',
                    points: 3,
                    difficulty: 'medium',
                },
                {
                    questionText: '声波时差与地层孔隙度呈正相关关系。',
                    questionType: 'true_false',
                    correctAnswer: true,
                    explanation: '声波时差随孔隙度增加而增大，二者呈正相关关系。',
                    points: 1,
                    difficulty: 'easy',
                },
                {
                    questionText:
                        '阵列感应测井仪(AIT)的典型探测深度包括____、____、____、____和90英寸。',
                    questionType: 'fill_blank',
                    correctAnswer: '10英寸,20英寸,30英寸,60英寸',
                    explanation: 'AIT的典型探测深度为10in、20in、30in、60in、90in五条曲线。',
                    points: 4,
                    difficulty: 'medium',
                },
                {
                    questionText: '简述补偿密度测井的原理及其在储层评价中的应用。',
                    questionType: 'essay',
                    correctAnswer:
                        '补偿密度测井通过伽马源向地层发射伽马射线，探测器接收经地层散射后的伽马射线强度，从而计算地层体积密度。在储层评价中，密度测井用于识别岩性、计算孔隙度、识别气层（与中子测井组合），以及辅助判断地层岩矿组分。',
                    explanation: '密度测井是评价储层物性的重要方法，常与中子、声波测井联合应用。',
                    points: 10,
                    difficulty: 'hard',
                },
            ],
            evaluateCaseInnovation: {
                innovationScore: 75,
                technicalAccuracy: 80,
                practicalValue: 70,
                completenessScore: 75,
                recommendations: ['建议补充更多技术细节', '可以增加实际应用案例'],
                overallComments: '案例具有一定的实用价值，技术方案合理。',
            },
            extractKeywords: {
                keywords: ['测井', '解释', '评价', '数据处理'],
                missingKeywords: [],
            },
            generateProblemSolution: {
                analysis: '基于问题描述，初步分析为测井设备故障。',
                possibleCauses: ['仪器损坏', '连接问题', '环境干扰'],
                solutions: [
                    {
                        solution: '检查设备连接',
                        priority: '高',
                        steps: ['检查电缆连接', '确认电源供应'],
                        estimatedTime: '30分钟',
                        resources: ['万用表', '备用电缆'],
                    },
                ],
                prevention: ['定期维护设备', '加强操作培训'],
                riskLevel: '中等',
            },
            evaluateAbility: {
                scores: {
                    professionalKnowledge: 65,
                    standardApplication: 60,
                    crossIntegration: 55,
                    practicalSkills: 50,
                    decisionAbility: 60,
                },
                weaknesses: ['实践经验不足', '跨学科知识需要加强'],
                recommendations: ['建议增加实际操作练习', '学习相关学科知识'],
            },
        };
    }

    // 初始化本地AI模型
    async initialize() {
        try {
            console.log('正在初始化本地AI服务...');

            // 检查是否存在本地模型文件
            const fs = require('fs');
            const path = require('path');

            if (fs.existsSync(path.join(this.modelPath, 'model.bin'))) {
                console.log('发现本地模型文件，正在加载...');
                await this.loadLocalModel();
            } else {
                console.log('未找到本地模型文件，使用规则引擎...');
                this.isReady = true;
                this.emit('ready');
            }
        } catch (error) {
            console.error('AI服务初始化失败:', error);
            this.isReady = true; // 降级到规则引擎
            this.emit('ready');
        }
    }

    // 加载本地模型（使用ollama或其他本地LLM）
    async loadLocalModel() {
        const MODEL_STARTUP_TIMEOUT = 30000; // 模型启动超时30秒

        return new Promise((resolve, reject) => {
            try {
                const modelName = process.env.LOCAL_MODEL_NAME || 'qwen:7b';
                this.process = spawn('ollama', ['run', modelName], {
                    cwd: this.modelPath,
                    stdio: ['pipe', 'pipe', 'pipe'],
                });

                let startupOutput = '';

                // 监听进程输出
                this.process.stdout.on('data', data => {
                    startupOutput += data.toString();
                    console.log('AI输出:', data.toString());
                });

                this.process.stderr.on('data', data => {
                    console.log('AI错误:', data.toString());
                });

                // 进程错误处理
                this.process.on('error', error => {
                    console.log('本地模型启动失败，使用规则引擎:', error.message);
                    this.isReady = true;
                    this.emit('ready');
                    resolve();
                });

                // 进程退出处理
                this.process.on('exit', code => {
                    if (code !== 0 && code !== null) {
                        console.log(`本地模型进程异常退出，代码: ${code}，使用规则引擎`);
                    }
                    this.process = null;
                });

                // 超时保护
                const timeoutId = setTimeout(() => {
                    console.log('模型启动超时，使用规则引擎');
                    if (this.process && !this.process.killed) {
                        this.process.kill();
                        this.process = null;
                    }
                    this.isReady = true;
                    this.emit('ready');
                    resolve();
                }, MODEL_STARTUP_TIMEOUT);

                // 模拟启动完成（实际应检查进程就绪状态）
                setTimeout(() => {
                    clearTimeout(timeoutId);
                    if (this.process && !this.process.killed) {
                        this.isReady = true;
                        this.emit('ready');
                        resolve();
                    }
                }, 5000);
            } catch (error) {
                console.log('本地模型初始化异常，使用规则引擎:', error.message);
                this.isReady = true;
                this.emit('ready');
                resolve();
            }
        });
    }

    // 调用AI服务
    async callAI(prompt, maxTokens = 1000) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                return reject(new Error('AI服务未就绪'));
            }

            // 如果有本地模型进程，使用本地模型
            if (this.process && !this.process.killed) {
                try {
                    // 检查 stdin 是否可用
                    if (this.process.stdin && !this.process.stdin.destroyed) {
                        this.process.stdin.write(`${prompt}\n`);
                    }

                    // 模拟AI响应（实际应从 stdout 读取）
                    setTimeout(() => {
                        resolve(this.generateFallbackResponse(prompt));
                    }, 500); // 减少延迟到500ms
                } catch (error) {
                    console.warn('AI进程通信失败，使用规则引擎:', error.message);
                    resolve(this.generateFallbackResponse(prompt));
                }
            } else {
                // 使用规则引擎
                resolve(this.generateFallbackResponse(prompt));
            }
        });
    }

    // 基于规则的响应生成
    generateFallbackResponse(prompt) {
        const p = prompt.toLowerCase();

        // 优先检查生成题目意图（在关键词检测之前）
        // 生成题目的特征：有"生成"+"题"+"道"或"选择题"或"quiz"，并且没有单独的"关键词提取"意图
        const hasGenerateIntent =
            (p.includes('生成') &&
                (p.includes('题') || p.includes('选择题') || p.includes('quiz'))) ||
            p.includes('generatequestions');

        if (hasGenerateIntent && !p.includes('提取关键词') && !p.includes('extract keywords')) {
            return JSON.stringify({
                questions: this.defaultResponses.generateQuestions,
            });
        }

        // 关键词提取
        if (p.includes('关键词') || p.includes('extractkeywords') || p.includes('keyword')) {
            return JSON.stringify(this.defaultResponses.extractKeywords);
        }

        // 案例评估
        if (p.includes('评估案例') || p.includes('evaluat') || p.includes('创新')) {
            return JSON.stringify(this.defaultResponses.evaluateCaseInnovation);
        }

        // 问题解决
        if (p.includes('解决问题') || p.includes('问题') || p.includes('solution')) {
            return JSON.stringify(this.defaultResponses.generateProblemSolution);
        }

        // 能力评估
        if (p.includes('能力评估') || p.includes('ability') || p.includes('能力')) {
            return JSON.stringify(this.defaultResponses.evaluateAbility);
        }

        return JSON.stringify({
            message: '抱歉，当前AI服务不可用，请联系管理员。',
            fallback: true,
        });
    }

    // 生成考试题目
    async generateQuestions(params) {
        try {
            const prompt = this.buildQuestionPrompt(params);
            const response = await this.callAI(prompt);
            return JSON.parse(response).questions || this.defaultResponses.generateQuestions;
        } catch (error) {
            return this.defaultResponses.generateQuestions;
        }
    }

    // 案例创新度评估
    async evaluateCaseInnovation(caseData) {
        try {
            const prompt = this.buildEvaluationPrompt(caseData);
            const response = await this.callAI(prompt);
            return JSON.parse(response);
        } catch (error) {
            return this.defaultResponses.evaluateCaseInnovation;
        }
    }

    // 关键字提取
    async extractKeywords(text) {
        try {
            // 简单的关键词提取算法
            const keywords = this.extractTechnicalKeywords(text);
            return {
                keywords: keywords.slice(0, 8),
                missingKeywords: this.suggestMissingKeywords(text, keywords),
            };
        } catch (error) {
            return this.defaultResponses.extractKeywords;
        }
    }

    // 现场问题处置建议
    async generateProblemSolution(problemDescription) {
        try {
            const prompt = this.buildProblemPrompt(problemDescription);
            const response = await this.callAI(prompt);
            return JSON.parse(response);
        } catch (error) {
            return this.defaultResponses.generateProblemSolution;
        }
    }

    // 能力评估
    async evaluateAbility(userAnswers, examQuestions) {
        try {
            const prompt = this.buildAbilityPrompt(userAnswers, examQuestions);
            const response = await this.callAI(prompt);
            return JSON.parse(response);
        } catch (error) {
            return this.defaultResponses.evaluateAbility;
        }
    }

    // 辅助方法：提取技术关键词
    extractTechnicalKeywords(text) {
        const technicalTerms = [
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
            '自然伽马',
            '补偿密度',
            '补偿中子',
            '阵列感应',
            '声波时差',
            '微球型聚焦',
        ];

        const found = technicalTerms.filter(term =>
            text.toLowerCase().includes(term.toLowerCase())
        );

        // 去重并返回
        return [...new Set(found)];
    }

    // 建议缺失的关键词
    suggestMissingKeywords(text, existingKeywords) {
        const suggestions = [];
        if (!text.includes('安全')) {
            suggestions.push('安全操作');
        }
        if (!text.includes('质量')) {
            suggestions.push('质量控制');
        }
        if (!text.includes('标准')) {
            suggestions.push('技术标准');
        }
        return suggestions.slice(0, 3);
    }

    // 构建提示词
    buildQuestionPrompt(params) {
        return `生成${params.questionCount}道${params.difficulty}难度的测井题目`;
    }

    buildEvaluationPrompt(caseData) {
        return `评估案例创新性：${caseData.title}`;
    }

    buildProblemPrompt(problem) {
        return `提供测井问题解决方案：${problem}`;
    }

    buildAbilityPrompt(answers, questions) {
        return `评估用户能力水平`;
    }

    // 停止AI服务
    stop() {
        if (this.process && !this.process.killed) {
            try {
                this.process.stdin.end();
                this.process.kill('SIGTERM');
            } catch (error) {
                console.warn('停止AI进程时出错:', error.message);
            }
            this.process = null;
        }
        this.isReady = false;
    }
}

module.exports = LocalAIService;

// 创建默认实例供直接使用
const defaultInstance = new LocalAIService();
module.exports.defaultInstance = defaultInstance;
