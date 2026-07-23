/**
 * 知识库管理模块 - 简化版测试
 */
class KnowledgeManagementSimple {
    constructor(app) {
        this.app = app;
        this.data = {
            stats: { totalKnowledge: 156, pendingReview: 12 },
            categories: [
                { id: 'basic', name: '基础知识', count: 45, icon: 'fa-book' },
                { id: 'instrument', name: '仪器知识', count: 32, icon: 'fa-microchip' },
                { id: 'operation', name: '现场作业', count: 28, icon: 'fa-hard-hat' },
                { id: 'standard', name: '标准规范', count: 25, icon: 'fa-ruler-combined' },
            ],
            knowledge: [
                { _id: '1', title: '自然伽马测井原理', category: 'basic', status: 'published' },
                {
                    _id: '2',
                    title: '阵列感应测井技术',
                    category: 'instrument',
                    status: 'published',
                },
                { _id: '3', title: '声波全波列处理方法', category: 'basic', status: 'draft' },
            ],
        };
    }

    async init() {
        console.log('🔧 知识库管理简化版初始化...');
        const container = document.getElementById('knowledge-management');
        if (!container) {
            console.error('❌ 找不到 knowledge-management 容器');
            return;
        }
        console.log('✅ 找到容器，开始渲染');
        this.render();
    }

    render() {
        const container = document.getElementById('knowledge-management');
        if (!container) {return;}

        console.log('📝 渲染内容...');
        container.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="margin-bottom: 20px; color: #2563eb;">
                    <i class="fas fa-cogs"></i> 知识库管理
                </h2>
                
                <!-- 统计 -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="background: rgba(37, 99, 235, 0.1); padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #2563eb;">${this.data.stats.totalKnowledge}</div>
                        <div style="font-size: 12px; color: #64748b;">知识总数</div>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.1); padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${this.data.stats.pendingReview}</div>
                        <div style="font-size: 12px; color: #64748b;">待审核</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #10b981;">85%</div>
                        <div style="font-size: 12px; color: #64748b;">通过率</div>
                    </div>
                    <div style="background: rgba(139, 92, 246, 0.1); padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #8b5cf6;">${this.data.categories.length}</div>
                        <div style="font-size: 12px; color: #64748b;">分类数</div>
                    </div>
                </div>

                <!-- 分类列表 -->
                <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-bottom: 16px; font-size: 14px; color: #1e293b;">分类管理</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${this.data.categories
                            .map(
                                cat => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 6px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fas ${cat.icon}" style="color: #2563eb; width: 20px;"></i>
                                    <span>${cat.name}</span>
                                </div>
                                <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 10px; font-size: 12px;">${cat.count} 篇</span>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- 知识列表 -->
                <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; margin-top: 16px;">
                    <h3 style="margin-bottom: 16px; font-size: 14px; color: #1e293b;">知识列表</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${this.data.knowledge
                            .map(
                                item => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 6px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-book" style="color: #2563eb; width: 20px;"></i>
                                    <span>${item.title}</span>
                                </div>
                                <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; background: ${item.status === 'published' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${item.status === 'published' ? '#10b981' : '#f59e0b'};">${item.status === 'published' ? '已发布' : '草稿'}</span>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>
            </div>
        `;
        console.log('✅ 渲染完成');
    }
}

// 立即挂载到全局
window.KnowledgeManagementSimple = KnowledgeManagementSimple;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 KnowledgeManagementSimple 已加载');
    setTimeout(() => {
        const container = document.getElementById('knowledge-management');
        if (container && window.app) {
            console.log('🚀 自动初始化简化版模块');
            window.app.knowledgeMgmtSimple = new KnowledgeManagementSimple(window.app);
            window.app.knowledgeMgmtSimple.init();
        }
    }, 100);
});
