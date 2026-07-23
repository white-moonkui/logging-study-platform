const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
    generateTrainingReportPDF(report, user) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.buildPDFContent(doc, report, user);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    buildPDFContent(doc, report, user) {
        const content = report.content || {};
        const summary = content.summary || {};

        doc.fontSize(24).font('Helvetica-Bold').text('测井专业培训报告', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12)
            .font('Helvetica')
            .text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('一、学员信息', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`姓名: ${user.profile?.name || user.username}`);
        doc.text(`用户名: ${user.username}`);
        doc.text(`角色: ${this.formatRole(user.role)}`);
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('二、学习概览', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`总学习时长: ${summary.totalLearningTime || 0} 分钟`);
        doc.text(`已完成模块: ${summary.completedModules || 0} 个`);
        doc.text(`总模块数: ${summary.totalModules || 0} 个`);
        doc.text(`完成率: ${summary.completionRate || 0}%`);
        doc.text(`平均得分: ${summary.avgScore || 0} 分`);
        doc.text(`考核次数: ${summary.examCount || 0} 次`);
        doc.text(`通过次数: ${summary.passCount || 0} 次`);
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('三、学习详情', { underline: true });
        doc.moveDown(0.5);

        const learningDetails = content.learningDetails || [];
        if (learningDetails.length > 0) {
            learningDetails.forEach((item, index) => {
                doc.fontSize(12).font('Helvetica');
                doc.text(`${index + 1}. ${item.moduleName}`);
                doc.text(
                    `   进度: ${item.progress}% | 用时: ${item.timeSpent}分钟 | 得分: ${item.score || '未评分'}分`
                );
                doc.moveDown(0.5);
            });
        } else {
            doc.font('Helvetica').text('暂无学习记录');
        }
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('四、能力评估', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');

        const abilityMatrix = content.abilityMatrix || {};
        const abilities = [
            { name: '专业知识', value: abilityMatrix.professionalKnowledge },
            { name: '标准应用', value: abilityMatrix.standardApplication },
            { name: '跨学科整合', value: abilityMatrix.crossIntegration },
            { name: '实践技能', value: abilityMatrix.practicalSkills },
            { name: '决策能力', value: abilityMatrix.decisionAbility },
        ];

        abilities.forEach(ability => {
            const value = ability.value || 0;
            const bar = '█'.repeat(Math.floor(value / 5)) + '░'.repeat(20 - Math.floor(value / 5));
            doc.text(`${ability.name}: [${bar}] ${value}%`);
        });
        doc.moveDown(2);

        const strengths = content.strengths || [];
        if (strengths.length > 0) {
            doc.fontSize(16).font('Helvetica-Bold').text('五、优势分析', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica');
            strengths.forEach(strength => {
                doc.text(`• ${strength}`);
            });
            doc.moveDown(2);
        }

        const weaknesses = content.weaknesses || [];
        if (weaknesses.length > 0) {
            doc.fontSize(16).font('Helvetica-Bold').text('六、待改进项', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica');
            weaknesses.forEach(weakness => {
                doc.text(`• ${weakness}`);
            });
            doc.moveDown(2);
        }

        const recommendations = content.recommendations || [];
        if (recommendations.length > 0) {
            doc.fontSize(16).font('Helvetica-Bold').text('七、学习建议', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica');
            recommendations.forEach((rec, index) => {
                doc.text(`${index + 1}. ${rec}`);
            });
        }

        doc.moveDown(3);
        doc.fontSize(10)
            .font('Helvetica')
            .text('— 报告由测井专业培训系统自动生成 —', { align: 'center' });
    }

    formatRole(role) {
        const roles = {
            student: '学员',
            admin: '管理员',
        };
        return roles[role] || role;
    }

    generateAssessmentReportPDF(report, user) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.buildAssessmentPDFContent(doc, report, user);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    buildAssessmentPDFContent(doc, report, user) {
        const content = report.content || {};
        const examResults = content.examResults || [];

        doc.fontSize(24).font('Helvetica-Bold').text('测井专业考核报告', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12)
            .font('Helvetica')
            .text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('一、学员信息', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`姓名: ${user.profile?.name || user.username}`);
        doc.text(`用户名: ${user.username}`);
        doc.text(`角色: ${this.formatRole(user.role)}`);
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('二、考核成绩', { underline: true });
        doc.moveDown(0.5);

        if (examResults.length > 0) {
            examResults.forEach((exam, index) => {
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .text(`考试 ${index + 1}: ${exam.examTitle}`, { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(12).font('Helvetica');
                doc.text(`得分: ${exam.score} 分`);
                doc.text(`结果: ${exam.passed ? '通过' : '未通过'}`);
                doc.text(`用时: ${exam.timeSpent} 分钟`);
                doc.text(`考试日期: ${new Date(exam.attemptDate).toLocaleDateString('zh-CN')}`);
                doc.moveDown(1);
            });
        } else {
            doc.font('Helvetica').text('暂无考核记录');
        }
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('三、能力分析', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');

        const abilityMatrix = content.abilityMatrix || {};
        const abilities = [
            { name: '专业知识', value: abilityMatrix.professionalKnowledge },
            { name: '标准应用', value: abilityMatrix.standardApplication },
            { name: '跨学科整合', value: abilityMatrix.crossIntegration },
            { name: '实践技能', value: abilityMatrix.practicalSkills },
            { name: '决策能力', value: abilityMatrix.decisionAbility },
        ];

        abilities.forEach(ability => {
            const value = ability.value || 0;
            const bar = '█'.repeat(Math.floor(value / 5)) + '░'.repeat(20 - Math.floor(value / 5));
            doc.text(`${ability.name}: [${bar}] ${value}%`);
        });

        doc.moveDown(3);
        doc.fontSize(10)
            .font('Helvetica')
            .text('— 报告由测井专业培训系统自动生成 —', { align: 'center' });
    }
}

module.exports = new PDFService();
