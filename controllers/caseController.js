const Case = require('../models/Case');
const User = require('../models/User');
const AIService = require('../utils/aiService');

class CaseController {
    // 获取案例列表
    async getCaseList(req, res) {
        try {
            const { category, difficulty, status, page = 1, limit = 10 } = req.query;

            // 支持 'published' 或 'approved' 状态的案例
            let filter;
            if (req.userRole === 'admin' && status) {
                filter = { status };
            } else {
                // 非管理员只能看到 published 或 approved 的案例
                filter = {
                    $or: [{ status: 'published' }, { status: 'approved' }],
                };
            }

            if (category) {filter.category = category;}
            if (difficulty) {filter.difficulty = difficulty;}

            const casesQuery = await Case.find(filter);
            const cases = casesQuery._docs || casesQuery;

            // 分页
            const total = cases.length;
            const paginatedCases = cases.slice((page - 1) * limit, page * limit);

            res.json({
                cases: paginatedCases,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '获取案例列表失败',
                error: error.message,
            });
        }
    }

    // 获取案例详情
    async getCaseDetail(req, res) {
        try {
            const { id } = req.params;

            const caseResult = await Case.findById(id);
            const caseDetail = caseResult ? caseResult._model || caseResult : null;

            if (!caseDetail) {
                return res.status(404).json({
                    message: '案例不存在',
                });
            }

            // 记录用户互动
            if (req.userId) {
                const existingInteraction = caseDetail.userInteractions?.find(
                    interaction => interaction.user?.toString() === req.userId
                );

                if (!existingInteraction) {
                    caseDetail.userInteractions = caseDetail.userInteractions || [];
                    caseDetail.userInteractions.push({
                        user: req.userId,
                        interactionType: 'view',
                        timestamp: new Date(),
                    });
                } else {
                    existingInteraction.timestamp = new Date();
                }
            }

            // 增加浏览次数
            caseDetail.viewCount = (caseDetail.viewCount || 0) + 1;

            res.json({
                case: caseDetail,
            });
        } catch (error) {
            res.status(500).json({
                message: '获取案例详情失败',
                error: error.message,
            });
        }
    }

    // 创建案例
    async createCase(req, res) {
        try {
            const caseData = req.body;
            caseData.submittedBy = req.userId;
            caseData.status = 'pending_review';

            // 检查必要字段
            const requiredFields = [
                'title',
                'description',
                'category',
                'problemStatement',
                'analysisProcess',
                'solution',
            ];
            for (const field of requiredFields) {
                if (!caseData[field]) {
                    return res.status(400).json({
                        message: `${field} 字段为必填项`,
                    });
                }
            }

            // 自动提取关键词
            if (!caseData.keywords || caseData.keywords.length === 0) {
                const fullText = `${caseData.title} ${caseData.description} ${caseData.problemStatement} ${caseData.solution}`;
                const keywordResult = await AIService.extractKeywords(fullText);
                caseData.keywords = keywordResult.keywords;
            }

            const newCase = new Case(caseData);
            await newCase.save();

            res.status(201).json({
                message: '案例提交成功，等待审核',
                case: newCase,
            });
        } catch (error) {
            res.status(500).json({
                message: '创建案例失败',
                error: error.message,
            });
        }
    }

    // AI评估案例
    async evaluateCase(req, res) {
        try {
            const { id } = req.params;

            const caseDetail = await Case.findById(id);

            if (!caseDetail) {
                return res.status(404).json({
                    message: '案例不存在',
                });
            }

            // 调用AI服务进行评估
            const evaluation = await AIService.evaluateCaseInnovation(caseDetail);

            caseDetail.aiEvaluation = {
                ...evaluation,
                evaluatedAt: new Date(),
            };

            caseDetail.status = 'pending_review';
            await caseDetail.save();

            res.json({
                message: '案例评估完成',
                evaluation: caseDetail.aiEvaluation,
            });
        } catch (error) {
            res.status(500).json({
                message: '案例评估失败',
                error: error.message,
            });
        }
    }

    // 人工审核案例
    async reviewCase(req, res) {
        try {
            const { id } = req.params;
            const { approved, comments, rejectionReason } = req.body;

            const caseDetail = await Case.findById(id);

            if (!caseDetail) {
                return res.status(404).json({
                    message: '案例不存在',
                });
            }

            // 检查权限
            if (req.userRole !== 'admin') {
                return res.status(403).json({
                    message: '没有权限审核案例',
                });
            }

            caseDetail.humanReview = {
                reviewer: req.userId,
                reviewDate: new Date(),
                approved,
                comments,
                rejectionReason,
            };

            caseDetail.status = approved ? 'approved' : 'rejected';
            await caseDetail.save();

            res.json({
                message: `案例${approved ? '通过' : '未通过'}审核`,
                case: caseDetail,
            });
        } catch (error) {
            res.status(500).json({
                message: '案例审核失败',
                error: error.message,
            });
        }
    }

    // 互动式案例学习
    async startInteractiveCase(req, res) {
        try {
            const { id } = req.params;
            const { step = 0 } = req.body;

            const caseDetail = await Case.findById(id);

            if (!caseDetail) {
                return res.status(404).json({
                    message: '案例不存在',
                });
            }

            if (caseDetail.interactivityLevel !== 'interactive') {
                return res.status(400).json({
                    message: '此案例不支持互动学习',
                });
            }

            const interactiveSteps = caseDetail.interactiveSteps;

            if (step >= interactiveSteps.length) {
                return res.status(400).json({
                    message: '已经完成所有学习步骤',
                });
            }

            const currentStep = interactiveSteps[step];

            res.json({
                step: currentStep,
                totalSteps: interactiveSteps.length,
                currentStepNumber: step,
                progress: (step / interactiveSteps.length) * 100,
            });
        } catch (error) {
            res.status(500).json({
                message: '获取互动步骤失败',
                error: error.message,
            });
        }
    }

    // 提交互动答案
    async submitInteractiveAnswer(req, res) {
        try {
            const { id } = req.params;
            const { step, answer } = req.body;

            const caseDetail = await Case.findById(id);

            if (!caseDetail) {
                return res.status(404).json({
                    message: '案例不存在',
                });
            }

            const currentStep = caseDetail.interactiveSteps[step];

            if (!currentStep) {
                return res.status(400).json({
                    message: '无效的步骤',
                });
            }

            // 简单的答案匹配逻辑
            const isCorrect = answer
                .toLowerCase()
                .includes(currentStep.expectedInput.toLowerCase());

            // 记录用户互动
            let userInteraction = caseDetail.userInteractions.find(
                interaction => interaction.user.toString() === req.userId
            );

            if (!userInteraction) {
                userInteraction = {
                    user: req.userId,
                    interactionType: 'complete',
                    timestamp: new Date(),
                    progress: ((step + 1) / caseDetail.interactiveSteps.length) * 100,
                };
                caseDetail.userInteractions.push(userInteraction);
            } else {
                userInteraction.progress = ((step + 1) / caseDetail.interactiveSteps.length) * 100;
                userInteraction.timestamp = new Date();
            }

            await caseDetail.save();

            res.json({
                isCorrect,
                feedback: currentStep.feedback,
                nextStep: step < caseDetail.interactiveSteps.length - 1 ? step + 1 : null,
                completed: step === caseDetail.interactiveSteps.length - 1,
                progress: userInteraction.progress,
            });
        } catch (error) {
            res.status(500).json({
                message: '提交答案失败',
                error: error.message,
            });
        }
    }

    // 获取案例模板
    async getCaseTemplate(req, res) {
        try {
            const template = {
                title: '',
                description: '',
                category: 'reservoir_evaluation',
                wellInfo: {
                    wellName: '',
                    location: '',
                    depth: 0,
                    formation: '',
                    drillingDate: null,
                },
                problemStatement: '',
                analysisProcess: '',
                solution: '',
                results: '',
                lessons: '',
                keywords: [],
                technicalTerms: [],
                interactivityLevel: 'reading',
                interactiveSteps: [],
            };

            res.json({
                template,
                requiredFields: [
                    'title',
                    'description',
                    'category',
                    'problemStatement',
                    'analysisProcess',
                    'solution',
                    'keywords',
                ],
                categories: [
                    { value: 'reservoir_evaluation', label: '储层评价' },
                    { value: 'drilling', label: '钻井工程' },
                    { value: 'production', label: '生产测井' },
                    { value: 'trouble_shooting', label: '故障排除' },
                    { value: 'new_technology', label: '新技术应用' },
                ],
            });
        } catch (error) {
            res.status(500).json({
                message: '获取案例模板失败',
                error: error.message,
            });
        }
    }

    // 提取关键词
    async extractKeywords(req, res) {
        try {
            const { text } = req.body;

            if (!text) {
                return res.status(400).json({
                    message: '文本内容不能为空',
                });
            }

            const result = await AIService.extractKeywords(text);

            res.json({
                keywords: result.keywords,
                missingKeywords: result.missingKeywords,
            });
        } catch (error) {
            res.status(500).json({
                message: '关键词提取失败',
                error: error.message,
            });
        }
    }
}

module.exports = new CaseController();
