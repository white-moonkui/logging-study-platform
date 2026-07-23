const { Exam, ExamResult } = require('../models/Exam');
const User = require('../models/User');
const AIService = require('../utils/aiService');

// ponytail: standalone functions to avoid `this` context loss with Express route handlers
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function calculateCategoryProgress(questions, answers) {
    const progress = { basicKnowledge: 0, standardKnowledge: 0, crossKnowledge: 0, comprehensiveKnowledge: 0 };
    const categoryGroups = {};
    questions.forEach((q, i) => {
        const cat = q.category || 'basic';
        if (!categoryGroups[cat]) {categoryGroups[cat] = { correct: 0, total: 0 };}
        categoryGroups[cat].total++;
        const userAnswer = answers[i];
        let isCorrect = false;
        switch (q.questionType) {
            case 'single_choice': isCorrect = userAnswer === q.correctAnswer; break;
            case 'multiple_choice': isCorrect = JSON.stringify((userAnswer || []).sort()) === JSON.stringify((q.correctAnswer || []).sort()); break;
            case 'true_false': isCorrect = userAnswer === q.correctAnswer; break;
            case 'fill_blank': isCorrect = (userAnswer || '').toLowerCase().trim() === (q.correctAnswer || '').toLowerCase().trim(); break;
        }
        if (isCorrect) {categoryGroups[cat].correct++;}
    });
    for (const [cat, stats] of Object.entries(categoryGroups)) {
        const key = `${cat  }Knowledge`;
        if (progress[key] !== undefined) {
            progress[key] = Math.round((stats.correct / stats.total) * 100);
        }
    }
    return progress;
}

async function updateUserAbility(userId, answers, questions) {
    const user = await User.findById(userId);
    if (!user) {return;}

    const abilityMatrix = user.abilityMatrix || {
        professionalKnowledge: 0, standardApplication: 0, crossIntegration: 0,
        practicalSkills: 0, decisionAbility: 0,
    };
    const categoryMap = { basic: 'professionalKnowledge', standard: 'standardApplication', cross: 'crossIntegration', comprehensive: 'practicalSkills' };
    const categoryGroups = {};
    questions.forEach((q, i) => {
        const cat = q.category || 'basic';
        if (!categoryGroups[cat]) {categoryGroups[cat] = { correct: 0, total: 0 };}
        categoryGroups[cat].total++;
        let isCorrect = false;
        switch (q.questionType) {
            case 'single_choice': isCorrect = answers[i] === q.correctAnswer; break;
            case 'multiple_choice': isCorrect = JSON.stringify((answers[i] || []).sort()) === JSON.stringify((q.correctAnswer || []).sort()); break;
            case 'true_false': isCorrect = answers[i] === q.correctAnswer; break;
            case 'fill_blank': isCorrect = (answers[i] || '').toLowerCase().trim() === (q.correctAnswer || '').toLowerCase().trim(); break;
        }
        if (isCorrect) {categoryGroups[cat].correct++;}
    });
    for (const [cat, stats] of Object.entries(categoryGroups)) {
        const dim = categoryMap[cat];
        if (dim && stats.total > 0) {
            abilityMatrix[dim] = Math.round(abilityMatrix[dim] * 0.7 + (stats.correct / stats.total) * 100 * 0.3);
        }
    }
    user.abilityMatrix = abilityMatrix;
    await user.save();
}

class ExamController {
    // 获取考试列表
    async getExamList(req, res) {
        try {
            const { category, difficulty, page = 1, limit = 10 } = req.query;

            const filter = { isPublished: true, isActive: true };

            if (category) {filter.category = category;}
            if (difficulty) {filter.difficulty = difficulty;}

            const exams = await Exam.find(filter)
                .populate('createdBy', 'username')
                .select('-questions.correctAnswer') // 不返回正确答案
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Exam.countDocuments(filter);

            res.json({
                exams,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '获取考试列表失败',
                error: error.message,
            });
        }
    }

    // 获取考试详情（不包含正确答案）
    async getExamDetail(req, res) {
        try {
            const { id } = req.params;

            // 内存数据库不支持 populate 和 select，尝试直接查询
            let exam;
            try {
                exam = await Exam.findById(id);
            } catch (queryError) {
                // 如果查询失败，返回404
                return res.status(404).json({
                    message: '考试不存在',
                });
            }

            if (!exam) {
                return res.status(404).json({
                    message: '考试不存在',
                });
            }

            // 转换为普通对象以避免内存数据库问题
            const examObj = exam._model ? exam._model : exam.toObject ? exam.toObject() : exam;

            // 移除正确答案（如果存在）
            if (examObj.questions && Array.isArray(examObj.questions)) {
                examObj.questions = examObj.questions.map(q => {
                    const { correctAnswer, ...safeQ } = q;
                    return safeQ;
                });
            }

            // 检查用户是否已经参加过此考试
            const userId = req.userId || req.user?.id;
            let userAttempts = 0;
            const maxAttempts = examObj.maxAttempts || 3;

            try {
                if (userId) {
                    const userResults = await ExamResult.find({
                        exam: id,
                        user: userId,
                    }).sort({ attemptNumber: -1 });
                    userAttempts = userResults ? userResults.length : 0;
                }
            } catch (resultError) {
                console.warn('查询考试记录失败:', resultError.message);
                userAttempts = 0;
            }

            res.json({
                exam: examObj,
                userAttempts,
                maxAttempts,
                canAttempt: userAttempts < maxAttempts,
            });
        } catch (error) {
            console.error('获取考试详情失败:', error.message);
            res.status(500).json({
                message: '获取考试详情失败',
                error: error.message,
            });
        }
    }

    // 开始考试
    async startExam(req, res) {
        try {
            const { id } = req.params;

            const exam = await Exam.findById(id);

            if (!exam) {
                return res.status(404).json({
                    message: '考试不存在',
                });
            }

            // 检查考试次数限制
            const userResults = await ExamResult.countDocuments({
                exam: id,
                user: req.userId,
            });

            if (userResults >= exam.maxAttempts) {
                return res.status(400).json({
                    message: '已达到最大考试次数限制',
                });
            }

            // 创建考试结果记录
            const examResult = new ExamResult({
                exam: id,
                user: req.userId,
                attemptNumber: userResults + 1,
                startTime: new Date(),
                totalPoints: exam.questions.reduce((sum, q) => sum + q.points, 0),
            });

            await examResult.save();

            // 准备考试题目（可能需要随机化）
            let questions = [...exam.questions];

            if (exam.randomizeQuestions) {
                questions = shuffleArray(questions);
            }

            if (exam.randomizeOptions) {
                questions = questions.map(q => ({
                    ...q.toObject(),
                    options: shuffleArray(q.options),
                }));
            }

            res.json({
                examResult: {
                    id: examResult._id,
                    startTime: examResult.startTime,
                    timeLimit: exam.timeLimit,
                    totalPoints: examResult.totalPoints,
                },
                questions: questions.map(q => ({
                    questionText: q.questionText,
                    questionType: q.questionType,
                    options: q.options,
                    points: q.points,
                    difficulty: q.difficulty,
                })),
            });
        } catch (error) {
            res.status(500).json({
                message: '开始考试失败',
                error: error.message,
            });
        }
    }

    // 提交考试答案
    async submitExam(req, res) {
        try {
            const { id } = req.params;
            const { answers, endTime } = req.body;

            const examResult = await ExamResult.findById(id);
            const exam = await Exam.findById(examResult.exam);

            if (!examResult || !exam) {
                return res.status(404).json({
                    message: '考试记录不存在',
                });
            }

            // 检查是否是考试所有者
            // ponytail: memoryDB 类型不匹配，String() 统一
            if (String(examResult.user) !== String(req.userId)) {
                return res.status(403).json({
                    message: '没有权限提交此考试',
                });
            }

            // 计算得分
            let earnedPoints = 0;
            let correctCount = 0;
            let incorrectCount = 0;
            const detailedAnswers = [];

            exam.questions.forEach((question, index) => {
                const userAnswer = answers[index];
                let isCorrect = false;
                let points = 0;

                switch (question.questionType) {
                    case 'single_choice':
                        isCorrect = userAnswer === question.correctAnswer;
                        break;
                    case 'multiple_choice':
                        isCorrect =
                            JSON.stringify(userAnswer.sort()) ===
                            JSON.stringify(question.correctAnswer.sort());
                        break;
                    case 'true_false':
                        isCorrect = userAnswer === question.correctAnswer;
                        break;
                    case 'fill_blank':
                        isCorrect =
                            userAnswer.toLowerCase().trim() ===
                            question.correctAnswer.toLowerCase().trim();
                        break;
                    case 'essay':
                        // 论述题需要人工评分或AI评分
                        isCorrect = false; // 暂时设为false，后续可以加入AI评分
                        break;
                }

                if (isCorrect) {
                    points = question.points;
                    correctCount++;
                } else {
                    incorrectCount++;
                }

                earnedPoints += points;

                detailedAnswers.push({
                    questionIndex: index,
                    answer: userAnswer,
                    isCorrect,
                    points,
                    timeSpent: 0, // 可以记录答题时间
                });
            });

            const score = Math.round((earnedPoints / examResult.totalPoints) * 100);
            const passed = score >= exam.passingScore;

            // 更新考试结果
            examResult.answers = detailedAnswers;
            examResult.endTime = new Date(endTime);
            examResult.timeSpent = Math.floor((new Date(endTime) - examResult.startTime) / 1000);
            examResult.earnedPoints = earnedPoints;
            examResult.score = score;
            examResult.passed = passed;
            examResult.detailedResults = {
                correctCount,
                incorrectCount,
                skippedCount: exam.questions.length - correctCount - incorrectCount,
            };

            await examResult.save();

            // 更新用户能力矩阵
            const user = await User.findById(req.userId);
            const beforeAbility = user ? { ...(user._model || user.toObject ? user.toObject() : user).abilityMatrix } : {};

            await updateUserAbility(req.userId, detailedAnswers, exam.questions);

            const userAfter = await User.findById(req.userId);
            const afterAbility = userAfter ? { ...(userAfter._model || userAfter.toObject ? userAfter.toObject() : userAfter).abilityMatrix } : {};

            if (Object.keys(beforeAbility).length > 0 || Object.keys(afterAbility).length > 0) {
                examResult.abilityImprovement = { beforeTest: beforeAbility, afterTest: afterAbility };
                await examResult.save();
            }

            res.json({
                message: '考试提交成功',
                result: {
                    score,
                    earnedPoints,
                    totalPoints: examResult.totalPoints,
                    passed,
                    correctCount,
                    incorrectCount,
                    timeSpent: examResult.timeSpent,
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '提交考试失败',
                error: error.message,
            });
        }
    }

    // 获取考试结果
    async getExamResult(req, res) {
        try {
            const { id } = req.params;

            const examResult = await ExamResult.findById(id)
                .populate('exam', 'title timeLimit passingScore')
                .populate('user', 'username');

            if (!examResult) {
                return res.status(404).json({
                    message: '考试结果不存在',
                });
            }

            // 检查权限
            if (examResult.user._id.toString() !== req.userId && req.userRole !== 'admin') {
                return res.status(403).json({
                    message: '没有权限查看此考试结果',
                });
            }

            res.json({
                result: examResult,
            });
        } catch (error) {
            res.status(500).json({
                message: '获取考试结果失败',
                error: error.message,
            });
        }
    }

    // 获取用户考试历史
    async getUserExamHistory(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;

            const results = await ExamResult.find({ user: req.userId })
                .populate('exam', 'title category difficulty')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await ExamResult.countDocuments({ user: req.userId });

            res.json({
                results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '获取考试历史失败',
                error: error.message,
            });
        }
    }

    // 创建考试（管理员权限）
    async createExam(req, res) {
        try {
            const examData = req.body;
            examData.createdBy = req.userId;

            const exam = new Exam(examData);
            await exam.save();

            res.status(201).json({
                message: '考试创建成功',
                exam,
            });
        } catch (error) {
            res.status(500).json({
                message: '创建考试失败',
                error: error.message,
            });
        }
    }

    // 智能生成考试
    async generateExam(req, res) {
        try {
            const { category, difficulty, questionCount = 10, knowledgeIds } = req.body;

            // 获取相关知识内容
            const Knowledge = require('../models/Knowledge');
            const knowledge = await Knowledge.find({
                _id: { $in: knowledgeIds },
                category: category || 'basic',
            });

            if (knowledge.length === 0) {
                return res.status(400).json({
                    message: '未找到相关知识内容',
                });
            }

            // 使用AI生成题目
            const allQuestions = [];
            for (const item of knowledge) {
                const questions = await AIService.generateQuestions({
                    content: item.content,
                    title: item.title,
                    keywords: item.keywords,
                    questionCount: Math.ceil(questionCount / knowledge.length),
                    difficulty,
                });
                allQuestions.push(...questions);
            }

            // 创建考试
            const exam = new Exam({
                title: `${category} - ${difficulty} 智能生成考试`,
                description: `基于${knowledge.length}个知识点生成的${difficulty}难度考试`,
                category,
                difficulty,
                timeLimit: questionCount * 3, // 每题3分钟
                passingScore: 60,
                questions: allQuestions.slice(0, questionCount),
                createdBy: req.userId,
                isPublished: false, // 需要管理员审核后发布
                source: 'ai',
                generatedAt: new Date(),
            });

            await exam.save();

            res.json({
                message: '智能考试生成成功',
                exam,
            });
        } catch (error) {
            res.status(500).json({
                message: '生成智能考试失败',
                error: error.message,
            });
        }
    }

}

module.exports = new ExamController();
