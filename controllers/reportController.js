/**
 * 报告控制器
 * 处理培训/考核报告的生成、查询、导出
 */

const Report = require('../models/Report');
const User = require('../models/User');
const TrainingCycle = require('../models/TrainingCycle');
const { ExamResult } = require('../models/Exam');
const pdfService = require('../services/pdfService');

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

class ReportController {
    // 获取报告列表
    async getReportList(req, res) {
        try {
            const { type, page = 1, limit = 10 } = req.query;
            const userId = req.userId;

            // 非管理员只能查看自己的报告
            const filter =
                req.userRole === 'admin' && req.query.userId
                    ? { user: req.query.userId }
                    : { user: userId };

            if (type) {filter.type = type;}

            const reports = await Report.find(filter)
                .populate('user', 'username profile.name')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Report.countDocuments(filter);

            res.json({
                reports,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            res.status(500).json({
                message: '获取报告列表失败',
                error: error.message,
            });
        }
    }

    // 获取报告详情
    async getReportDetail(req, res) {
        try {
            const { id } = req.params;

            const report = await Report.findById(id).populate('user', 'username profile.name');

            if (!report) {
                return res.status(404).json({
                    message: '报告不存在',
                });
            }

            // 非管理员只能查看自己的报告
            if (req.userRole !== 'admin' && report.user._id.toString() !== req.userId) {
                return res.status(403).json({
                    message: '没有权限查看此报告',
                });
            }

            res.json({ report });
        } catch (error) {
            res.status(500).json({
                message: '获取报告详情失败',
                error: error.message,
            });
        }
    }

    // 生成培训报告
    async generateTrainingReport(req, res) {
        try {
            const { periodStart, periodEnd, userId } = req.body;
            const targetUserId = req.userRole === 'admin' && userId ? userId : req.userId;

            const user = await User.findById(targetUserId);
            if (!user) {
                return res.status(404).json({
                    message: '用户不存在',
                });
            }

            // 生成报告内容
            const reportContent = await this.buildTrainingContent(
                targetUserId,
                periodStart,
                periodEnd
            );

            const report = new Report({
                type: 'training',
                user: targetUserId,
                period: {
                    start: new Date(periodStart),
                    end: new Date(periodEnd),
                },
                title: `培训报告 - ${user.username} - ${new Date(periodStart).toLocaleDateString()}`,
                content: reportContent,
                summary: reportContent.summary
                    ? `${reportContent.summary.completedModules}个模块完成，平均分${reportContent.summary.avgScore}分`
                    : '',
                generatedBy: 'system',
            });

            await report.save();

            res.status(201).json({
                message: '培训报告生成成功',
                report,
            });
        } catch (error) {
            res.status(500).json({
                message: '生成培训报告失败',
                error: error.message,
            });
        }
    }

    // 生成考核报告
    async generateAssessmentReport(req, res) {
        try {
            const { examId, userId } = req.body;
            const targetUserId = req.userRole === 'admin' && userId ? userId : req.userId;

            const user = await User.findById(targetUserId);
            if (!user) {
                return res.status(404).json({
                    message: '用户不存在',
                });
            }

            // 构建考核报告内容
            const reportContent = await this.buildAssessmentContent(targetUserId, examId);

            const report = new Report({
                type: 'assessment',
                user: targetUserId,
                period: {
                    start: new Date(),
                    end: new Date(),
                },
                title: `考核报告 - ${user.username} - ${new Date().toLocaleDateString()}`,
                content: reportContent,
                summary: `考核得分 ${reportContent.examResults?.[0]?.score || 0} 分`,
                generatedBy: 'system',
            });

            await report.save();

            res.status(201).json({
                message: '考核报告生成成功',
                report,
            });
        } catch (error) {
            res.status(500).json({
                message: '生成考核报告失败',
                error: error.message,
            });
        }
    }

    // 生成综合报告
    async generateComprehensiveReport(req, res) {
        try {
            const { periodStart, periodEnd, userId } = req.body;
            const targetUserId = req.userRole === 'admin' && userId ? userId : req.userId;

            const user = await User.findById(targetUserId);
            if (!user) {
                return res.status(404).json({
                    message: '用户不存在',
                });
            }

            // 获取培训和考核数据
            const trainingContent = await this.buildTrainingContent(
                targetUserId,
                periodStart,
                periodEnd
            );
            const assessmentContent = await this.buildAssessmentContent(targetUserId);

            const reportContent = {
                summary: {
                    totalLearningTime: trainingContent.summary?.totalLearningTime || 0,
                    completedModules: trainingContent.summary?.completedModules || 0,
                    totalModules: trainingContent.summary?.totalModules || 0,
                    completionRate: trainingContent.summary?.completionRate || 0,
                    avgScore:
                        assessmentContent.examResults?.[0]?.score ||
                        trainingContent.summary?.avgScore ||
                        0,
                    examCount: trainingContent.summary?.examCount || 0,
                    passCount: trainingContent.summary?.passCount || 0,
                },
                learningDetails: trainingContent.learningDetails || [],
                examResults: assessmentContent.examResults || [],
                abilityMatrix: user.abilityMatrix || {},
                strengths: this.calculateStrengths(trainingContent, assessmentContent),
                weaknesses: this.calculateWeaknesses(trainingContent, assessmentContent),
                recommendations: this.generateRecommendations(trainingContent, assessmentContent),
            };

            const report = new Report({
                type: 'comprehensive',
                user: targetUserId,
                period: {
                    start: new Date(periodStart),
                    end: new Date(periodEnd),
                },
                title: `综合报告 - ${user.username} - ${new Date(periodStart).toLocaleDateString()} 至 ${new Date(periodEnd).toLocaleDateString()}`,
                content: reportContent,
                summary: `周期完成率 ${reportContent.summary.completionRate}%，平均分 ${reportContent.summary.avgScore} 分`,
                generatedBy: 'system',
            });

            await report.save();

            res.status(201).json({
                message: '综合报告生成成功',
                report,
            });
        } catch (error) {
            res.status(500).json({
                message: '生成综合报告失败',
                error: error.message,
            });
        }
    }

    // 删除报告
    async deleteReport(req, res) {
        try {
            const { id } = req.params;

            const report = await Report.findById(id);
            if (!report) {
                return res.status(404).json({
                    message: '报告不存在',
                });
            }

            // 非管理员只能删除自己的报告
            if (req.userRole !== 'admin' && report.user.toString() !== req.userId) {
                return res.status(403).json({
                    message: '没有权限删除此报告',
                });
            }

            await Report.findByIdAndDelete(id);

            res.json({
                message: '报告删除成功',
            });
        } catch (error) {
            res.status(500).json({
                message: '删除报告失败',
                error: error.message,
            });
        }
    }

    // 导出培训报告 PDF
    exportTrainingReportPDF = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const report = await Report.findById(id).populate('user', 'username profile role');
        if (!report) {
            return res.status(404).json({ message: '报告不存在' });
        }

        if (req.userRole !== 'admin' && report.user._id.toString() !== req.userId) {
            return res.status(403).json({ message: '没有权限导出此报告' });
        }

        const pdfBuffer = await pdfService.generateTrainingReportPDF(report, report.user);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=培训报告_${report.user.username}_${Date.now()}.pdf`
        );
        res.send(pdfBuffer);
    });

    // 导出考核报告 PDF
    exportAssessmentReportPDF = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const report = await Report.findById(id).populate('user', 'username profile role');
        if (!report) {
            return res.status(404).json({ message: '报告不存在' });
        }

        if (req.userRole !== 'admin' && report.user._id.toString() !== req.userId) {
            return res.status(403).json({ message: '没有权限导出此报告' });
        }

        const pdfBuffer = await pdfService.generateAssessmentReportPDF(report, report.user);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=考核报告_${report.user.username}_${Date.now()}.pdf`
        );
        res.send(pdfBuffer);
    });

    // 构建培训内容（从真实数据聚合）
    async buildTrainingContent(userId, periodStart, periodEnd) {
        const LearningProgress = require('../models/LearningProgress');

        const dateFilter = periodStart && periodEnd
            ? { lastAccessedAt: { $gte: new Date(periodStart), $lte: new Date(periodEnd) } }
            : {};

        const progressRecords = await LearningProgress.find({ userId, ...dateFilter })
            .populate('knowledgeId', 'title categoryId');

        const learningDetails = progressRecords.map(r => ({
            moduleName: r.knowledgeId?.title || '未知',
            progress: r.overallProgress,
            timeSpent: r.fileProgress?.reduce((s, f) => s + (f.timeSpent || 0), 0) || 0,
            score: null,
            status: r.overallStatus,
        }));

        const examDateFilter = periodStart && periodEnd
            ? { createdAt: { $gte: new Date(periodStart), $lte: new Date(periodEnd) } }
            : {};
        const examResults = await ExamResult.find({ user: userId, ...examDateFilter })
            .populate('exam', 'title')
            .sort({ createdAt: -1 });

        const totalTimeSpent = learningDetails.reduce((s, d) => s + d.timeSpent, 0);
        const completedModules = progressRecords.filter(r => r.overallStatus === 'completed').length;
        const passedCount = examResults.filter(r => r.passed).length;

        const user = await User.findById(userId);
        const abilityMatrix = user?.abilityMatrix || {};

        return {
            summary: {
                totalLearningTime: totalTimeSpent,
                completedModules,
                totalModules: progressRecords.length,
                completionRate: progressRecords.length > 0 ? Math.round((completedModules / progressRecords.length) * 100) : 0,
                avgScore: examResults.length > 0 ? Math.round(examResults.reduce((s, r) => s + r.score, 0) / examResults.length) : 0,
                examCount: examResults.length,
                passCount: passedCount,
            },
            learningDetails,
            examResults: examResults.map(r => ({
                examTitle: r.exam?.title || '未知',
                score: r.score,
                passed: r.passed,
                attemptDate: r.createdAt,
                timeSpent: r.timeSpent,
            })),
            abilityMatrix,
        };
    }

    // 构建考核内容
    async buildAssessmentContent(userId, examId) {
        const user = await User.findById(userId);
        const abilityMatrix = user?.abilityMatrix || {};

        if (examId) {
            const result = await ExamResult.findOne({ exam: examId, user: userId })
                .populate('exam', 'title')
                .sort({ createdAt: -1 });
            if (result) {
                return {
                    examResults: [{
                        examTitle: result.exam?.title || '未知',
                        score: result.score,
                        passed: result.passed,
                        attemptDate: result.createdAt,
                        timeSpent: result.timeSpent,
                    }],
                    abilityMatrix: result.abilityImprovement?.afterTest || abilityMatrix,
                };
            }
        }

        const lastResult = await ExamResult.findOne({ user: userId })
            .populate('exam', 'title')
            .sort({ createdAt: -1 });

        return {
            examResults: lastResult ? [{
                examTitle: lastResult.exam?.title || '未知',
                score: lastResult.score,
                passed: lastResult.passed,
                attemptDate: lastResult.createdAt,
                timeSpent: lastResult.timeSpent,
            }] : [],
            abilityMatrix,
        };
    }

    // 培训效果评估（趋势数据）
    async getTrainingEffect(req, res) {
        try {
            const userId = req.userId;
            const isAdmin = req.userRole === 'admin';
            const targetUserId = isAdmin && req.query.userId ? req.query.userId : userId;

            const cycles = await TrainingCycle.find({ userId: targetUserId })
                .sort({ createdAt: -1 })
                .limit(10);

            const examResults = await ExamResult.find({ user: targetUserId })
                .populate('exam', 'title category difficulty')
                .sort({ createdAt: -1 })
                .limit(20);

            const trends = examResults.map(r => ({
                date: r.createdAt,
                examTitle: r.exam?.title,
                score: r.score,
                passed: r.passed,
                timeSpent: r.timeSpent,
                abilityAfter: r.abilityImprovement?.afterTest,
            }));

            const cycleSummary = cycles.map(c => ({
                id: c._id,
                status: c.status,
                type: c.type,
                gaps: c.gaps?.length || 0,
                scoreDelta: c.remediation?.scoreDelta || null,
                createdAt: c.createdAt,
            }));

            res.json({
                trends,
                cycles: cycleSummary,
                examCount: examResults.length,
                passRate: examResults.length > 0
                    ? Math.round((examResults.filter(r => r.passed).length / examResults.length) * 100)
                    : 0,
                averageScore: examResults.length > 0
                    ? Math.round(examResults.reduce((s, r) => s + r.score, 0) / examResults.length)
                    : 0,
            });
        } catch (error) {
            res.status(500).json({ message: '获取培训效果失败', error: error.message });
        }
    }

    // 计算优势
    calculateStrengths(training, assessment) {
        const strengths = [];
        const ability = training.abilityMatrix || assessment.abilityMatrix || {};
        if (ability.professionalKnowledge >= 75) {strengths.push('专业知识扎实');}
        if (ability.standardApplication >= 75) {strengths.push('标准应用能力强');}
        if (ability.crossIntegration >= 70) {strengths.push('跨学科整合能力良好');}
        if (training.summary?.completionRate >= 70) {strengths.push('学习完成率高');}
        return strengths.length > 0 ? strengths : ['学习态度端正'];
    }

    // 计算劣势
    calculateWeaknesses(training, assessment) {
        const weaknesses = [];
        const ability = training.abilityMatrix || assessment.abilityMatrix || {};
        if (ability.practicalSkills < 70) {weaknesses.push('实操能力有待提高');}
        if (ability.crossIntegration < 65) {weaknesses.push('跨学科整合能力不足');}
        if (training.summary?.completionRate < 60) {weaknesses.push('学习进度需要加强');}
        if (training.summary?.passRate < 70) {weaknesses.push('考核通过率有待提升');}
        return weaknesses.length > 0 ? weaknesses : ['继续保持当前学习状态'];
    }

    // 生成建议
    generateRecommendations(training, assessment) {
        const recommendations = [];
        const ability = training.abilityMatrix || assessment.abilityMatrix || {};
        if (ability.practicalSkills < 70) {recommendations.push('建议增加实操练习');}
        if (ability.crossIntegration < 65) {recommendations.push('建议加强跨学科知识学习');}
        recommendations.push('定期进行知识回顾和总结');
        recommendations.push('多做练习题巩固所学知识');
        return recommendations;
    }
}

module.exports = new ReportController();
