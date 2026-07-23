const TrainingCycle = require('../models/TrainingCycle');
const { Exam, ExamResult } = require('../models/Exam');
const Knowledge = require('../models/Knowledge');

const THRESHOLDS = { basic: 60, standard: 60, cross: 60, comprehensive: 60 };
const DIMENSION_MAP = { basic: 'professionalKnowledge', standard: 'standardApplication', cross: 'crossIntegration', comprehensive: 'practicalSkills' };

// ponytail: memoryDB 不支持 schema.statics，内联替代 getCurrent/getHistory

async function _getCurrent(userId) {
    const all = await TrainingCycle.find({ userId }).sort({ createdAt: -1 });
    return all.find(c => c.status !== 'closed') || null;
}

async function _getHistory(userId, limit = 20) {
    const all = await TrainingCycle.find({ userId }).sort({ createdAt: -1 });
    return all.slice(0, limit);
}

class TrainingCycleController {
    // P: 创建培训周期
    async startCycle(req, res) {
        try {
            const { examId } = req.body;
            const userId = req.userId;

            const existing = await _getCurrent(userId);
            if (existing) {
                return res.status(400).json({ message: '已有进行中的培训周期', cycleId: existing._id });
            }

            const cycle = new TrainingCycle({ userId });
            // ponytail: memoryDB 不初始化子文档数组
            cycle.exams = [];
            cycle.gaps = [];
            if (examId) {
                // ponytail: memoryDB examId 存为 String，user 存为 Number
                const results = await ExamResult.find({ exam: String(examId), user: userId }).sort({ createdAt: -1 }).limit(1);
                const result = results[0];
                if (result) {
                    cycle.exams.push({ examId, resultId: result._id, score: result.score, passed: result.passed, takenAt: result.createdAt });
                    cycle.abilityBefore = result.abilityImprovement?.beforeTest || {};
                    cycle.status = 'exam_ready';
                }
            }

            await cycle.save();
            res.status(201).json({ message: '培训周期已创建', cycle });
        } catch (error) {
            res.status(500).json({ message: '创建培训周期失败', error: error.message });
        }
    }

    // 获取当前周期
    async getCurrent(req, res) {
        try {
            const cycle = await _getCurrent(req.userId);
            res.json({ cycle: cycle || null });
        } catch (error) {
            res.status(500).json({ message: '获取当前周期失败', error: error.message });
        }
    }

    // 获取历史周期
    async getHistory(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const cycles = await _getHistory(req.userId, limit);
            res.json({ cycles });
        } catch (error) {
            res.status(500).json({ message: '获取历史周期失败', error: error.message });
        }
    }

    // 管理员查看指定学员的培训周期历史
    async adminGetStudentHistory(req, res) {
        try {
            const { userId } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const all = await TrainingCycle.find({ userId }).sort({ createdAt: -1 });
            const cycles = all.slice(0, limit);
            res.json({ cycles });
        } catch (error) {
            res.status(500).json({ message: '获取学员培训周期失败', error: error.message });
        }
    }

    // 获取周期详情
    async getDetail(req, res) {
        try {
            const cycle = await TrainingCycle.findById(req.params.id)
                .populate('exams.examId', 'title category difficulty passingScore')
                .populate('exams.resultId')
                .populate('gaps.suggestedKnowledge', 'title')
                .populate('remediation.retestExamId', 'title')
                .populate('remediation.knowledgeItems.knowledgeId', 'title');
            if (!cycle) { return res.status(404).json({ message: '培训周期不存在' }); }
            res.json({ cycle });
        } catch (error) {
            res.status(500).json({ message: '获取周期详情失败', error: error.message });
        }
    }

    // C: 差距分析
    async evaluate(req, res) {
        try {
            const cycle = await TrainingCycle.findById(req.params.id);
            if (!cycle) { return res.status(404).json({ message: '培训周期不存在' }); }

            const lastExam = cycle.exams[cycle.exams.length - 1];
            if (!lastExam) { return res.status(400).json({ message: '周期内无考试记录' }); }

            const exam = await Exam.findById(lastExam.examId);
            const result = await ExamResult.findById(lastExam.resultId);
            if (!exam || !result) { return res.status(404).json({ message: '考试或结果不存在' }); }

            const gaps = [];
            const category = exam.category; // 'basic' | 'standard' | 'cross' | 'comprehensive'
            const threshold = THRESHOLDS[category] || 60;
            const score = result.score;
            const dimension = DIMENSION_MAP[category] || 'professionalKnowledge';

            if (score < threshold) {
                const gap = threshold - score;
                const priority = gap > 30 ? 'high' : gap > 15 ? 'medium' : 'low';

                // 查找同类别的知识条目作为补学推荐
                const knowledgeList = await Knowledge.find({
                    categoryId: category,
                    status: 'published',
                }).limit(5).select('_id title');

                gaps.push({
                    dimension,
                    score,
                    threshold,
                    gap,
                    priority,
                    suggestedKnowledge: knowledgeList.map(k => k._id),
                });
            }

            // 也检查 accuracyByCategory（如果 ExamResult 有数据）
            if (result.detailedResults?.accuracyByCategory) {
                for (const [cat, acc] of Object.entries(result.detailedResults.accuracyByCategory)) {
                    if (acc < (THRESHOLDS[cat] || 60)) {
                        const existingGap = gaps.find(g => g.dimension === DIMENSION_MAP[cat]);
                        if (!existingGap) {
                            const knowledgeList = await Knowledge.find({ categoryId: cat, status: 'published' })
                                .limit(5).select('_id title');
                            gaps.push({
                                dimension: DIMENSION_MAP[cat] || cat,
                                score: acc,
                                threshold: THRESHOLDS[cat],
                                gap: THRESHOLDS[cat] - acc,
                                priority: THRESHOLDS[cat] - acc > 30 ? 'high' : THRESHOLDS[cat] - acc > 15 ? 'medium' : 'low',
                                suggestedKnowledge: knowledgeList.map(k => k._id),
                            });
                        }
                    }
                }
            }

            cycle.gaps = gaps;
            cycle.abilityBefore = result.abilityImprovement?.beforeTest || cycle.abilityBefore || {};
            cycle.status = 'evaluated';
            await cycle.save();

            res.json({ message: '评估完成', gaps, status: cycle.status });
        } catch (error) {
            res.status(500).json({ message: '评估失败', error: error.message });
        }
    }

    // A: 生成补学计划
    async remediate(req, res) {
        try {
            const cycle = await TrainingCycle.findById(req.params.id);
            if (!cycle) { return res.status(404).json({ message: '培训周期不存在' }); }
            if (cycle.status !== 'evaluated') { return res.status(400).json({ message: '周期状态不是 evaluated，请先执行评估' }); }

            const knowledgeItems = [];
            for (const gap of cycle.gaps) {
                for (const kid of gap.suggestedKnowledge) {
                    if (!knowledgeItems.find(k => k.knowledgeId.toString() === kid.toString())) {
                        knowledgeItems.push({ knowledgeId: kid, completed: false });
                    }
                }
            }

            cycle.remediation = {
                assignedAt: new Date(),
                knowledgeItems,
            };
            cycle.status = 'remediation';
            await cycle.save();

            const populated = await TrainingCycle.findById(cycle._id)
                .populate('remediation.knowledgeItems.knowledgeId', 'title');

            res.json({ message: '补学计划已生成', cycle: populated });
        } catch (error) {
            res.status(500).json({ message: '生成补学计划失败', error: error.message });
        }
    }

    // 补学完成 → 复测闭环
    async completeRetest(req, res) {
        try {
            const cycle = await TrainingCycle.findById(req.params.id);
            if (!cycle) { return res.status(404).json({ message: '培训周期不存在' }); }

            const { examId, resultId } = req.body;

            const result = await ExamResult.findById(resultId);
            if (!result) { return res.status(404).json({ message: '考试结果不存在' }); }

            const lastScore = cycle.exams[cycle.exams.length - 1]?.score || 0;
            const scoreDelta = result.score - lastScore;

            cycle.exams.push({ examId, resultId, score: result.score, passed: result.passed, takenAt: result.createdAt });
            cycle.remediation.retestExamId = examId;
            cycle.remediation.retestResultId = resultId;
            cycle.remediation.scoreDelta = scoreDelta;
            cycle.remediation.completedAt = new Date();
            cycle.abilityAfter = result.abilityImprovement?.afterTest || {};
            cycle.status = 'closed';
            await cycle.save();

            res.json({
                message: '闭环完成',
                scoreDelta,
                previousScore: lastScore,
                newScore: result.score,
                improvement: scoreDelta > 0 ? '提升' : scoreDelta < 0 ? '下降' : '持平',
            });
        } catch (error) {
            res.status(500).json({ message: '闭环失败', error: error.message });
        }
    }

    // 标记补学知识为已完成
    async completeKnowledgeItem(req, res) {
        try {
            const { id, knowledgeId } = req.params;
            const cycle = await TrainingCycle.findById(id);
            if (!cycle) { return res.status(404).json({ message: '培训周期不存在' }); }

            const item = cycle.remediation?.knowledgeItems?.find(k => k.knowledgeId.toString() === knowledgeId);
            if (!item) { return res.status(404).json({ message: '补学条目不存在' }); }

            item.completed = true;
            item.completedAt = new Date();
            await cycle.save();

            res.json({ message: '补学完成', item });
        } catch (error) {
            res.status(500).json({ message: '更新失败', error: error.message });
        }
    }
}

module.exports = new TrainingCycleController();
