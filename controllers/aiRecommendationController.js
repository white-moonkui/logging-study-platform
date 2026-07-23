const User = require('../models/User');
const LearningProgress = require('../models/LearningProgress');
const { Exam, ExamResult } = require('../models/Exam');
const Case = require('../models/Case');
const Knowledge = require('../models/Knowledge');

class AIRecommendationController {
    // 获取AI学习建议
    async getRecommendations(req, res) {
        try {
            const userId = req.userId;
            const { limit = 10, module } = req.query;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    message: '用户不存在',
                });
            }

            const recommendations = [];

            // 1. 分析薄弱知识点（基于考试结果）
            const weakPoints = await this.analyzeWeakPoints(userId);
            if (weakPoints.length > 0) {
                recommendations.push({
                    type: 'weak_point',
                    icon: 'fa-exclamation-triangle',
                    priority: 'high',
                    title: '需要加强',
                    items: weakPoints.slice(0, 3),
                });
            }

            // 2. 建议完成的学习任务
            const pendingTasks = await this.getPendingTasks(userId, module);
            if (pendingTasks.length > 0) {
                recommendations.push({
                    type: 'pending_task',
                    icon: 'fa-tasks',
                    priority: 'high',
                    title: '建议完成',
                    items: pendingTasks.slice(0, 3),
                });
            }

            // 3. 推荐的案例学习
            const recommendedCases = await this.getRecommendedCases(userId);
            if (recommendedCases.length > 0) {
                recommendations.push({
                    type: 'recommended_case',
                    icon: 'fa-book-reader',
                    priority: 'medium',
                    title: '推荐案例',
                    items: recommendedCases.slice(0, 2),
                });
            }

            // 4. 建议加入的讨论组
            const discussionGroups = await this.getDiscussionGroups(userId);
            if (discussionGroups.length > 0) {
                recommendations.push({
                    type: 'discussion_group',
                    icon: 'fa-user-friends',
                    priority: 'low',
                    title: '讨论推荐',
                    items: discussionGroups.slice(0, 2),
                });
            }

            // 5. 学习效率分析
            const efficiencyTips = await this.getEfficiencyTips(userId);
            if (efficiencyTips.length > 0) {
                recommendations.push({
                    type: 'efficiency_tip',
                    icon: 'fa-chart-line',
                    priority: 'medium',
                    title: '效率建议',
                    items: efficiencyTips.slice(0, 1),
                });
            }

            // 6. 预约提醒
            const reminders = await this.getReminders(userId);
            if (reminders.length > 0) {
                recommendations.push({
                    type: 'reminder',
                    icon: 'fa-bell',
                    priority: 'high',
                    title: '学习提醒',
                    items: reminders.slice(0, 2),
                });
            }

            res.json({
                recommendations,
                total: recommendations.reduce((sum, rec) => sum + rec.items.length, 0),
                user: {
                    abilityMatrix: user.abilityMatrix || {},
                    learningProgress: user.learningProgress || {},
                    totalStudyTime: this.calculateTotalStudyTime(userId),
                },
            });
        } catch (error) {
            console.error('获取AI推荐失败:', error.message);
            res.status(500).json({
                message: '获取AI推荐失败',
                error: error.message,
            });
        }
    }

    // 分析薄弱知识点
    async analyzeWeakPoints(userId) {
        try {
            const examResults = await ExamResult.find({ user: userId })
                .populate('exam', 'title category difficulty')
                .sort({ createdAt: -1 })
                .limit(20);

            const weakPoints = [];
            const topicAccuracy = {};

            // 统计每个主题的正确率
            examResults.forEach(result => {
                if (result.detailedResults && result.detailedResults.incorrectCount > 0) {
                    const exam = result.exam;
                    const accuracy = result.score;

                    if (exam) {
                        if (!topicAccuracy[exam.category]) {
                            topicAccuracy[exam.category] = { correct: 0, total: 0 };
                        }
                        topicAccuracy[exam.category].correct += result.detailedResults.correctCount;
                        topicAccuracy[exam.category].total += exam.questions?.length || 0;
                    }
                }
            });

            // 找出准确率低于70%的主题
            for (const [category, data] of Object.entries(topicAccuracy)) {
                const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                if (accuracy < 70) {
                    weakPoints.push({
                        topic: category,
                        accuracy: Math.round(accuracy),
                        message: `${this.getCategoryName(category)}（错误率${Math.round(100 - accuracy)}%）`,
                        actionUrl: `#${category}`,
                    });
                }
            }

            return weakPoints;
        } catch (error) {
            console.error('分析薄弱点失败:', error.message);
            return [];
        }
    }

    // 获取待完成的学习任务
    async getPendingTasks(userId, currentModule) {
        try {
            const progressRecords = await LearningProgress.find({
                userId,
                progress: { $lt: 100 },
            })
                .sort({ lastStudyDate: 1 })
                .limit(5);

            const tasks = [];
            const moduleNames = {
                basic: '测井基础知识',
                instrument: '测井仪器知识',
                operation: '现场作业知识',
                standard: '测井标准学习',
                cross: '跨行业知识',
                cases: '案例学习',
                exam: '考试模块',
            };

            progressRecords.forEach(record => {
                const moduleName = moduleNames[record.module] || record.module;
                const estimatedTime = (100 - record.progress) * 2; // 简单估算

                tasks.push({
                    topic: record.topic,
                    module: moduleName,
                    progress: record.progress,
                    estimatedTime,
                    message: `${moduleName} - ${record.topic}`,
                    actionUrl: `#${record.module}`,
                });
            });

            return tasks;
        } catch (error) {
            console.error('获取待完成任务失败:', error.message);
            return [];
        }
    }

    // 获取推荐案例
    async getRecommendedCases(userId) {
        try {
            const user = await User.findById(userId);
            const abilityMatrix = user?.abilityMatrix || {};

            // 基于用户能力矩阵推荐相关案例
            const weakCategories = Object.keys(abilityMatrix)
                .filter(key => abilityMatrix[key] < 70)
                .map(key => key.replace('Knowledge', ''));

            if (weakCategories.length === 0) {
                // 如果没有薄弱点，推荐最新案例
                const latestCases = await Case.find({
                    status: { $in: ['published', 'approved'] },
                })
                    .sort({ createdAt: -1 })
                    .limit(2);

                return latestCases.map(c => ({
                    id: c._id,
                    title: c.title,
                    category: c.category,
                    message: `最新案例：${c.title}`,
                    actionUrl: `/cases/${c._id}`,
                }));
            }

            // 推荐与薄弱点相关的案例
            const categoryMapping = {
                basic: 'reservoir_evaluation',
                instrument: 'trouble_shooting',
                operation: 'drilling',
            };

            const recommendedCategories = weakCategories
                .map(cat => categoryMapping[cat])
                .filter(Boolean);

            if (recommendedCategories.length === 0) {
                return [];
            }

            const cases = await Case.find({
                category: { $in: recommendedCategories },
                status: { $in: ['published', 'approved'] },
            })
                .sort({ viewCount: -1 })
                .limit(2);

            return cases.map(c => ({
                id: c._id,
                title: c.title,
                category: c.category,
                message: `推荐案例：${c.title}`,
                actionUrl: `/cases/${c._id}`,
            }));
        } catch (error) {
            console.error('获取推荐案例失败:', error.message);
            return [];
        }
    }

    // 获取讨论组推荐
    async getDiscussionGroups(userId) {
        try {
            // 模拟讨论组数据
            const groups = [
                {
                    name: '复杂储层解释',
                    members: 128,
                    messages: 3567,
                    message: '加入"复杂储层解释"讨论组',
                },
                {
                    name: '电阻率测井技术',
                    members: 95,
                    messages: 2845,
                    message: '加入"电阻率测井技术"讨论组',
                },
                {
                    name: '声波测井应用',
                    members: 82,
                    messages: 2103,
                    message: '加入"声波测井应用"讨论组',
                },
            ];

            // 随机选择1-2个讨论组
            const shuffled = groups.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 2).map(group => ({
                name: group.name,
                members: group.members,
                message: group.message,
            }));
        } catch (error) {
            console.error('获取讨论组失败:', error.message);
            return [];
        }
    }

    // 获取学习效率建议
    async getEfficiencyTips(userId) {
        try {
            const progressRecords = await LearningProgress.find({
                userId,
            })
                .sort({ lastStudyDate: -1 })
                .limit(30);

            if (progressRecords.length < 5) {
                return [];
            }

            // 分析学习时间分布
            const hourlyData = {};
            progressRecords.forEach(record => {
                const hour = record.lastStudyDate.getHours();
                hourlyData[hour] = (hourlyData[hour] || 0) + 1;
            });

            // 找出学习频率最高的时间段
            const sortedHours = Object.entries(hourlyData).sort((a, b) => b[1] - a[1]);

            if (sortedHours.length > 0) {
                const peakHour = sortedHours[0][0];
                const hourRange = `${peakHour}:00-${parseInt(peakHour) + 1}:00`;
                return [
                    {
                        message: `学习效率：${hourRange}表现最佳`,
                        type: 'time_analysis',
                    },
                ];
            }

            return [];
        } catch (error) {
            console.error('获取效率建议失败:', error.message);
            return [];
        }
    }

    // 获取学习提醒
    async getReminders(userId) {
        try {
            const reminders = [];

            // 检查是否有即将到期的任务
            const pendingExams = await ExamResult.find({
                user: userId,
                endTime: null,
                createdAt: { $gt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2小时内的考试
            });

            if (pendingExams.length > 0) {
                reminders.push({
                    type: 'pending_exam',
                    message: `您有${pendingExams.length}个考试正在进行中`,
                    urgent: true,
                });
            }

            // 检查长期未学习的模块
            const lastProgress = await LearningProgress.findOne({
                userId,
            }).sort({ lastStudyDate: 1 });

            if (lastProgress) {
                const daysSinceLastStudy = Math.floor(
                    (Date.now() - lastProgress.lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysSinceLastStudy > 3) {
                    reminders.push({
                        type: 'continue_learning',
                        message: `您已${daysSinceLastStudy}天未学习，建议继续`,
                        urgent: false,
                    });
                }
            }

            return reminders;
        } catch (error) {
            console.error('获取提醒失败:', error.message);
            return [];
        }
    }

    // 记录学习活动
    async recordActivity(req, res) {
        try {
            const { module, topic, itemType, itemId, score, timeSpent } = req.body;
            const userId = req.userId;

            // 查找或创建学习进度记录
            let progress = await LearningProgress.findOne({
                userId,
                module,
                topic,
            });

            if (!progress) {
                progress = new LearningProgress({
                    userId,
                    module,
                    topic,
                });
            }

            // 更新学习进度
            progress.lastStudyDate = new Date();
            progress.totalStudyTime += timeSpent || 0;

            // 记录完成的项目
            const completedItem = {
                itemId,
                itemType,
                completedAt: new Date(),
                score,
                timeSpent,
            };

            // 检查是否已经记录过
            const existingItem = progress.completedItems.find(
                item => item.itemId === itemId && item.itemType === itemType
            );

            if (!existingItem) {
                progress.completedItems.push(completedItem);

                // 更新准确率
                if (score !== undefined) {
                    const totalItems = progress.completedItems.length;
                    const totalScore = progress.completedItems.reduce(
                        (sum, item) => sum + (item.score || 0),
                        0
                    );
                    progress.accuracy = Math.round(totalScore / totalItems);
                }

                // 更新进度（简单估算：每完成一项增加10%）
                progress.progress = Math.min(100, progress.progress + 10);
            }

            await progress.save();

            res.json({
                message: '学习活动记录成功',
                progress: {
                    module,
                    topic,
                    progress: progress.progress,
                    accuracy: progress.accuracy,
                    totalStudyTime: progress.totalStudyTime,
                },
            });
        } catch (error) {
            console.error('记录学习活动失败:', error.message);
            res.status(500).json({
                message: '记录学习活动失败',
                error: error.message,
            });
        }
    }

    // 获取学习进度统计
    async getProgressStats(req, res) {
        try {
            const userId = req.userId;
            const { module } = req.query;

            const filter = { userId };
            if (module) {filter.module = module;}

            const progressRecords = await LearningProgress.find(filter);

            const stats = {
                totalModules: new Set(progressRecords.map(r => r.module)).size,
                totalTopics: progressRecords.length,
                completedTopics: progressRecords.filter(r => r.progress >= 100).length,
                overallProgress: 0,
                totalStudyTime: 0,
                averageAccuracy: 0,
                moduleBreakdown: {},
            };

            if (progressRecords.length > 0) {
                stats.totalStudyTime = progressRecords.reduce(
                    (sum, r) => sum + (r.totalStudyTime || 0),
                    0
                );

                stats.overallProgress = Math.round(
                    progressRecords.reduce((sum, r) => sum + r.progress, 0) / progressRecords.length
                );

                const validAccuracy = progressRecords.filter(r => r.accuracy > 0);
                if (validAccuracy.length > 0) {
                    stats.averageAccuracy = Math.round(
                        validAccuracy.reduce((sum, r) => sum + r.accuracy, 0) / validAccuracy.length
                    );
                }

                // 模块分组统计
                progressRecords.forEach(record => {
                    if (!stats.moduleBreakdown[record.module]) {
                        stats.moduleBreakdown[record.module] = {
                            topicCount: 0,
                            completedCount: 0,
                            averageProgress: 0,
                        };
                    }
                    stats.moduleBreakdown[record.module].topicCount++;
                    if (record.progress >= 100) {
                        stats.moduleBreakdown[record.module].completedCount++;
                    }
                });

                // 计算每个模块的平均进度
                for (const [moduleName, data] of Object.entries(stats.moduleBreakdown)) {
                    const moduleRecords = progressRecords.filter(r => r.module === moduleName);
                    data.averageProgress = Math.round(
                        moduleRecords.reduce((sum, r) => sum + r.progress, 0) / moduleRecords.length
                    );
                }
            }

            res.json({ stats });
        } catch (error) {
            console.error('获取学习进度统计失败:', error.message);
            res.status(500).json({
                message: '获取学习进度统计失败',
                error: error.message,
            });
        }
    }

    // 辅助方法：获取分类名称
    getCategoryName(category) {
        const names = {
            basic: '测井基础知识',
            instrument: '测井仪器知识',
            operation: '现场作业知识',
            standard: '测井标准学习',
            cross: '跨行业知识',
        };
        return names[category] || category;
    }

    // 计算总学习时间
    async calculateTotalStudyTime(userId) {
        try {
            const progressRecords = await LearningProgress.find({ userId });
            return progressRecords.reduce((sum, r) => sum + (r.totalStudyTime || 0), 0);
        } catch (error) {
            return 0;
        }
    }
}

module.exports = new AIRecommendationController();
