/**
 * 知识库管理模块
 * 完整的知识库管理界面
 */
class KnowledgeManagementModule {
    constructor(app) {
        this.app = app;
        this.currentTab = 'overview';
        this.currentFilter = {};
        this.pagination = { page: 1, limit: 10, total: 0 };
        this.data = {
            knowledge: [],
            categories: [],
            stats: null
        };
    }

    /**
     * 初始化模块
     */
    async init() {
        console.log('📚 知识库管理模块开始初始化');
        const container = document.getElementById('knowledge-management');
        if (!container) {
            console.error('找不到 knowledge-management 容器元素');
            return;
        }
        console.log('找到容器元素，开始加载数据');
        try {
            await this.loadAllData();
            
            // 确保 data 都是数组 - 添加详细日志
            console.log('categories 类型:', typeof this.data.categories, Array.isArray(this.data.categories));
            console.log('categories 值:', JSON.stringify(this.data.categories));
            
            if (!Array.isArray(this.data.categories)) {
                console.warn('categories 不是数组，使用默认值');
                this.data.categories = this.getDefaultCategories();
            }
            if (!Array.isArray(this.data.knowledge)) {
                this.data.knowledge = this.getDefaultKnowledge();
            }
            if (!Array.isArray(this.data.tags)) {
                this.data.tags = this.getDefaultTags();
            }
            if (!Array.isArray(this.data.contributors)) {
                this.data.contributors = this.getDefaultContributors();
            }
            
            console.log('数据加载完成，开始渲染');
            this.render();
            console.log('渲染完成，开始绑定事件');
            this.bindEvents();
            console.log('知识库管理模块初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 16px;"></i>
                    <p>模块加载失败</p>
                    <p style="font-size: 12px; color: var(--text-muted);">${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * 加载所有数据
     */
    async loadAllData() {
        try {
            // 并行加载数据
            const results = await Promise.all([
                this.loadStats().catch(() => null),
                this.loadCategories().catch(() => null),
                this.loadKnowledgeList().catch(() => null)
            ]);

            const statsRes = results[0];
            const categoriesRes = results[1];
            const knowledgeRes = results[2];

            // 确保 categories 是数组
            let categoriesData = categoriesRes;
            if (!categoriesData || (typeof categoriesData !== 'object' && !Array.isArray(categoriesData))) {
                categoriesData = this.getDefaultCategories();
            } else if (!Array.isArray(categoriesData)) {
                categoriesData = categoriesData.categories || this.getDefaultCategories();
            }
            // 确保是数组
            if (!Array.isArray(categoriesData)) {
                categoriesData = this.getDefaultCategories();
            }

            this.data.stats = statsRes || this.getDefaultStats();
            this.data.categories = categoriesData;
            this.data.knowledge = knowledgeRes?.items || this.getDefaultKnowledge();
            this.data.tags = this.getDefaultTags();
            this.data.contributors = this.getDefaultContributors();
            this.pagination.total = knowledgeRes?.pagination?.total || this.data.knowledge.length;
        } catch (error) {
            console.warn('加载数据失败，使用默认数据');
            this.data.stats = this.getDefaultStats();
            this.data.categories = this.getDefaultCategories();
            this.data.knowledge = this.getDefaultKnowledge();
            this.data.tags = this.getDefaultTags();
            this.data.contributors = this.getDefaultContributors();
            this.pagination.total = this.data.knowledge.length;
        }
    }

    /**
     * 获取默认统计数据
     */
    getDefaultStats() {
        return {
            totalKnowledge: 28,
            pendingReview: 3,
            approvedToday: 5,
            rejectedToday: 1,
            approvalRate: 85,
            avgReviewTime: '2h'
        };
    }

    /**
     * 获取默认分类
     */
    getDefaultCategories() {
        return [
            { id: 'basic', name: '测井基础知识', count: 12 },
            { id: 'instrument', name: '测井仪器知识', count: 8 },
            { id: 'operation', name: '现场作业知识', count: 6 },
            { id: 'standard', name: '测井标准规范', count: 4 }
        ];
    }

    /**
     * 加载统计数据
     */
    async loadStats() {
        try {
            const response = await fetch(`${this.app.apiBase}/knowledge-review/dashboard`);
            if (response.ok) return await response.json();
            return this.getDefaultStats();
        } catch {
            return this.getDefaultStats();
        }
    }

    /**
     * 加载分类
     */
    async loadCategories() {
        try {
            const response = await fetch(`${this.app.apiBase}/knowledge-management/categories`);
            if (response.ok) {
                const data = await response.json();
                return data.categories || [];
            }
        } catch {
            console.warn('加载分类失败');
        }
        return this.getDefaultCategories();
    }

    /**
     * 加载知识列表
     */
    async loadKnowledgeList(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page,
                limit: this.pagination.limit,
                ...this.currentFilter
            });
            const response = await fetch(`${this.app.apiBase}/knowledge-management/items?${params}`);
            if (response.ok) return await response.json();
        } catch {
            console.warn('加载知识列表失败');
        }
        return { items: [], pagination: { page: 1, limit: 10, total: 0 } };
    }

    /**
     * 获取默认统计数据
     */
    getDefaultStats() {
        return {
            totalKnowledge: 156,
            pendingReview: 12,
            approvedToday: 5,
            rejectedToday: 1,
            approvalRate: 89,
            avgReviewTime: '3.2天'
        };
    }

    /**
     * 获取默认标签
     */
    getDefaultTags() {
        return [
            { name: '测井原理', count: 45, color: '#2563eb' },
            { name: '电阻率', count: 32, color: '#3b82f6' },
            { name: '声波测井', count: 28, color: '#06b6d4' },
            { name: '伽马测井', count: 25, color: '#10b981' },
            { name: '中子测井', count: 22, color: '#f59e0b' },
            { name: '密度测井', count: 20, color: '#ef4444' },
            { name: '固井质量', count: 18, color: '#8b5cf6' },
            { name: '射孔', count: 15, color: '#ec4899' },
            { name: '测井解释', count: 42, color: '#6366f1' },
            { name: '储层评价', count: 38, color: '#14b8a6' }
        ];
    }

    /**
     * 获取默认知识数据
     */
    getDefaultKnowledge() {
        return [
            { _id: '1', title: '自然伽马测井原理', category: 'basic', status: 'published', createdBy: { username: '张老师' }, viewCount: 1256, updatedAt: '2026-01-15' },
            { _id: '2', title: '阵列感应测井技术', category: 'instrument', status: 'published', createdBy: { username: '李教师' }, viewCount: 892, updatedAt: '2026-01-14' },
            { _id: '3', title: '声波全波列处理方法', category: 'basic', status: 'draft', createdBy: { username: '王管理员' }, viewCount: 0, updatedAt: '2026-01-13' },
            { _id: '4', title: '复杂储层测井解释案例', category: 'cases', status: 'pending', createdBy: { username: '赵学员' }, viewCount: 0, updatedAt: '2026-01-12' },
            { _id: '5', title: '测井安全操作规范', category: 'standard', status: 'published', createdBy: { username: '钱管理员' }, viewCount: 2341, updatedAt: '2026-01-11' },
            { _id: '6', title: '中子孔隙度测井原理', category: 'basic', status: 'published', createdBy: { username: '孙教师' }, viewCount: 567, updatedAt: '2026-01-10' },
            { _id: '7', title: '密度测井仪器校准', category: 'instrument', status: 'pending', createdBy: { username: '周学员' }, viewCount: 0, updatedAt: '2026-01-09' },
            { _id: '8', title: '固井质量评价方法', category: 'operation', status: 'published', createdBy: { username: '吴老师' }, viewCount: 789, updatedAt: '2026-01-08' }
        ];
    }

    /**
     * 获取默认贡献者数据
     */
    getDefaultContributors() {
        return [
            { name: '张老师', role: '教师', contributions: 45, lastActive: '10分钟前', avatar: '#2563eb' },
            { name: '李管理员', role: '管理员', contributions: 32, lastActive: '30分钟前', avatar: '#ef4444' },
            { name: '王教师', role: '教师', contributions: 28, lastActive: '1小时前', avatar: '#10b981' },
            { name: '赵学员', role: '学员', contributions: 15, lastActive: '2小时前', avatar: '#f59e0b' },
            { name: '钱管理员', role: '管理员', contributions: 52, lastActive: '3小时前', avatar: '#8b5cf6' }
        ];
    }

    /**
     * 获取默认分类
     */
    getDefaultCategories() {
        return [
            { id: 'basic', name: '基础知识', count: 45, icon: 'fa-book' },
            { id: 'instrument', name: '仪器知识', count: 32, icon: 'fa-microchip' },
            { id: 'operation', name: '现场作业', count: 28, icon: 'fa-hard-hat' },
            { id: 'standard', name: '标准规范', count: 25, icon: 'fa-ruler-combined' },
            { id: 'cases', name: '典型案例', count: 18, icon: 'fa-folder-open' },
            { id: 'solutions', name: '解决方案', count: 8, icon: 'fa-lightbulb' }
        ];
    }

    /**
     * 渲染主界面
     */
    render() {
        const container = document.getElementById('knowledge-management');
        if (!container) return;

        container.innerHTML = `
            <div class="km-container">
                <!-- 顶部标题栏 -->
                <div class="km-header">
                    <div class="km-title">
                        <h2><i class="fas fa-cogs"></i> 知识库管理</h2>
                        <p>全面管理知识库内容、分类、标签和用户贡献</p>
                    </div>
                    <div class="km-actions">
                        <button class="btn btn-primary" onclick="app.knowledgeMgmt.showAddModal()">
                            <i class="fas fa-plus"></i> 新建知识
                        </button>
                        <button class="btn btn-secondary" onclick="app.knowledgeMgmt.showImportModal()">
                            <i class="fas fa-file-import"></i> 批量导入
                        </button>
                    </div>
                </div>

                <!-- 标签页导航 -->
                <div class="km-tabs">
                    <button class="km-tab ${this.currentTab === 'overview' ? 'active' : ''}" 
                        data-tab="overview" onclick="app.knowledgeMgmt.switchTab('overview')">
                        <i class="fas fa-chart-pie"></i> 概览
                    </button>
                    <button class="km-tab ${this.currentTab === 'knowledge' ? 'active' : ''}" 
                        data-tab="knowledge" onclick="app.knowledgeMgmt.switchTab('knowledge')">
                        <i class="fas fa-book"></i> 知识管理
                    </button>
                    <button class="km-tab ${this.currentTab === 'categories' ? 'active' : ''}" 
                        data-tab="categories" onclick="app.knowledgeMgmt.switchTab('categories')">
                        <i class="fas fa-folder"></i> 分类管理
                    </button>
                    <button class="km-tab ${this.currentTab === 'tags' ? 'active' : ''}" 
                        data-tab="tags" onclick="app.knowledgeMgmt.switchTab('tags')">
                        <i class="fas fa-tags"></i> 标签管理
                    </button>
                    <button class="km-tab ${this.currentTab === 'review' ? 'active' : ''}" 
                        data-tab="review" onclick="app.knowledgeMgmt.switchTab('review')">
                        <i class="fas fa-check-double"></i> 审核管理
                        ${this.data.stats?.pendingReview > 0 ? 
                            `<span class="km-badge">${this.data.stats.pendingReview}</span>` : ''}
                    </button>
                    <button class="km-tab ${this.currentTab === 'users' ? 'active' : ''}" 
                        data-tab="users" onclick="app.knowledgeMgmt.switchTab('users')">
                        <i class="fas fa-users"></i> 贡献者
                    </button>
                </div>

                <!-- 内容区域 -->
                <div class="km-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    }

    /**
     * 渲染标签页内容
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'overview': return this.renderOverview();
            case 'knowledge': return this.renderKnowledgeList();
            case 'categories': return this.renderCategories();
            case 'tags': return this.renderTags();
            case 'review': return this.renderReview();
            case 'users': return this.renderUsers();
            default: return this.renderOverview();
        }
    }

    /**
     * 渲染概览页面
     */
    renderOverview() {
        const stats = this.data.stats;
        return `
            <!-- 统计卡片 -->
            <div class="km-stats-grid">
                <div class="km-stat-card">
                    <div class="stat-icon blue"><i class="fas fa-book"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats?.totalKnowledge || 0}</div>
                        <div class="stat-label">知识总数</div>
                    </div>
                </div>
                <div class="km-stat-card">
                    <div class="stat-icon orange"><i class="fas fa-clock"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats?.pendingReview || 0}</div>
                        <div class="stat-label">待审核</div>
                    </div>
                </div>
                <div class="km-stat-card">
                    <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats?.approvedToday || 0}</div>
                        <div class="stat-label">今日通过</div>
                    </div>
                </div>
                <div class="km-stat-card">
                    <div class="stat-icon red"><i class="fas fa-times-circle"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats?.rejectedToday || 0}</div>
                        <div class="stat-label">今日拒绝</div>
                    </div>
                </div>
                <div class="km-stat-card">
                    <div class="stat-icon purple"><i class="fas fa-percentage"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats?.approvalRate || 0}%</div>
                        <div class="stat-label">通过率</div>
                    </div>
                </div>
                <div class="km-stat-card">
                    <div class="stat-icon cyan"><i class="fas fa-hourglass-half"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats?.avgReviewTime || '-'}</div>
                        <div class="stat-label">平均审核时长</div>
                    </div>
                </div>
            </div>

            <!-- 分类分布和最近活动 -->
            <div class="km-overview-grid">
                <div class="km-panel">
                    <div class="panel-header">
                        <h3><i class="fas fa-chart-bar"></i> 分类分布</h3>
                    </div>
                    <div class="panel-body">
                        ${this.renderCategoryDistribution()}
                    </div>
                </div>
                <div class="km-panel">
                    <div class="panel-header">
                        <h3><i class="fas fa-history"></i> 最近活动</h3>
                    </div>
                    <div class="panel-body">
                        ${this.renderRecentActivity()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染分类分布
     */
    renderCategoryDistribution() {
        // 确保 categories 是数组
        const categories = Array.isArray(this.data.categories) ? this.data.categories : [];
        const total = categories.reduce((sum, c) => sum + (c.count || 0), 0);
        
        if (categories.length === 0) {
            return '<div class="empty-state"><p>暂无分类数据</p></div>';
        }
        
        return `
            <div class="category-distribution">
                ${categories.map(cat => {
                    const percent = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                    return `
                        <div class="dist-item">
                            <div class="dist-header">
                                <span class="dist-name"><i class="fas ${cat.icon || 'fa-folder'}"></i> ${cat.name || '未命名'}</span>
                                <span class="dist-count">${cat.count || 0} 篇</span>
                            </div>
                            <div class="dist-bar">
                                <div class="dist-fill" style="width: ${percent}%"></div>
                            </div>
                            <span class="dist-percent">${percent}%</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * 渲染最近活动
     */
    renderRecentActivity() {
        const activities = [
            { type: 'add', user: '张老师', action: '添加了新知识', target: '自然伽马测井原理', time: '10分钟前' },
            { type: 'review', user: '李管理员', action: '审核通过', target: '电阻率测井基础', time: '30分钟前' },
            { type: 'edit', user: '王教师', action: '更新了', target: '声波测井技术', time: '1小时前' },
            { type: 'add', user: '赵学员', action: '提交了案例', target: '复杂储层解释案例', time: '2小时前' },
            { type: 'delete', user: '钱管理员', action: '删除了', target: '过时标准文档', time: '3小时前' }
        ];

        return `
            <div class="activity-list">
                ${activities.map(act => `
                    <div class="activity-item">
                        <div class="activity-icon ${act.type}">
                            <i class="fas fa-${this.getActivityIcon(act.type)}"></i>
                        </div>
                        <div class="activity-content">
                            <p><strong>${act.user}</strong> ${act.action} <span class="highlight">${act.target}</span></p>
                            <span class="activity-time">${act.time}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = { add: 'plus', review: 'check', edit: 'pen', delete: 'trash' };
        return icons[type] || 'circle';
    }

    /**
     * 渲染知识列表
     */
    renderKnowledgeList() {
        return `
            <!-- 搜索和筛选 -->
            <div class="km-toolbar">
                <div class="km-search">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="搜索知识标题、内容、标签..." 
                        id="kmSearchInput" onkeyup="if(event.key==='Enter') app.knowledgeMgmt.search()">
                </div>
                <div class="km-filters">
                    <select id="kmCategoryFilter" onchange="app.knowledgeMgmt.filterKnowledge()">
                        <option value="">全部分类</option>
                        ${this.data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                    <select id="kmStatusFilter" onchange="app.knowledgeMgmt.filterKnowledge()">
                        <option value="">全部状态</option>
                        <option value="published">已发布</option>
                        <option value="draft">草稿</option>
                        <option value="pending">待审核</option>
                    </select>
                    <select id="kmSortFilter" onchange="app.knowledgeMgmt.filterKnowledge()">
                        <option value="newest">最新发布</option>
                        <option value="popular">最受欢迎</option>
                        <option value="updated">最近更新</option>
                    </select>
                </div>
                <div class="km-view-toggle">
                    <button class="${'grid'}" onclick="app.knowledgeMgmt.setView('grid')"><i class="fas fa-th-large"></i></button>
                    <button class="${'list'}" onclick="app.knowledgeMgmt.setView('list')"><i class="fas fa-list"></i></button>
                </div>
            </div>

            <!-- 知识表格 -->
            <div class="km-table-container">
                <table class="km-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="kmSelectAll" onclick="app.knowledgeMgmt.toggleSelectAll()"></th>
                            <th>标题</th>
                            <th>分类</th>
                            <th>作者</th>
                            <th>状态</th>
                            <th>浏览量</th>
                            <th>更新时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="kmKnowledgeTableBody">
                        ${this.renderKnowledgeTableRows()}
                    </tbody>
                </table>
            </div>

            <!-- 分页 -->
            <div class="km-pagination">
                <span class="pagination-info">共 ${this.pagination.total} 条</span>
                <div class="pagination-controls">
                    <button class="btn btn-sm" onclick="app.knowledgeMgmt.goToPage(${this.pagination.page - 1})" 
                        ${this.pagination.page <= 1 ? 'disabled' : ''}>上一页</button>
                    <span class="pagination-page">${this.pagination.page} / ${Math.ceil(this.pagination.total / this.pagination.limit)}</span>
                    <button class="btn btn-sm" onclick="app.knowledgeMgmt.goToPage(${this.pagination.page + 1})"
                        ${this.pagination.page >= Math.ceil(this.pagination.total / this.pagination.limit) ? 'disabled' : ''}>下一页</button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染知识表格行
     */
    renderKnowledgeTableRows() {
        const knowledge = this.data.knowledge || this.getDefaultKnowledge();
        if (knowledge.length === 0) {
            return '<tr><td colspan="8" class="empty-state">暂无知识数据</td></tr>';
        }

        return knowledge.map(item => `
            <tr>
                <td><input type="checkbox" class="km-select-item" value="${item._id}"></td>
                <td>
                    <div class="km-item-title">
                        <i class="fas ${this.getCategoryIcon(item.category)}"></i>
                        <span>${item.title || '未命名'}</span>
                    </div>
                </td>
                <td><span class="km-category-tag">${this.getCategoryName(item.category)}</span></td>
                <td>${item.createdBy?.username || '未知'}</td>
                <td><span class="km-status ${item.status || 'published'}">${this.getStatusText(item.status)}</span></td>
                <td>${item.viewCount || 0}</td>
                <td>${this.formatDate(item.updatedAt)}</td>
                <td>
                    <div class="km-actions-cell">
                        <button class="btn-icon" title="编辑" onclick="app.knowledgeMgmt.editKnowledge('${item._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" title="预览" onclick="app.knowledgeMgmt.previewKnowledge('${item._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon danger" title="删除" onclick="app.knowledgeMgmt.deleteKnowledge('${item._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getCategoryIcon(category) {
        const icons = { basic: 'fa-book', instrument: 'fa-microchip', operation: 'fa-hard-hat', 
                       standard: 'fa-ruler-combined', cases: 'fa-folder-open', solutions: 'fa-lightbulb' };
        return icons[category] || 'fa-book';
    }

    getCategoryName(category) {
        const names = { basic: '基础知识', instrument: '仪器知识', operation: '现场作业',
                       standard: '标准规范', cases: '典型案例', solutions: '解决方案' };
        return names[category] || category || '未分类';
    }

    getStatusText(status) {
        const texts = { published: '已发布', draft: '草稿', pending: '待审核', rejected: '已拒绝' };
        return texts[status] || status || '未知';
    }

    formatDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    /**
     * 渲染分类管理
     */
    renderCategories() {
        const categories = this.data.categories || this.getDefaultCategories();
        
        return `
            <div class="km-categories">
                ${categories.map(cat => `
                    <div class="km-panel">
                        <div class="panel-body">
                            <div class="km-category-item">
                                <div class="cat-icon"><i class="fas ${cat.icon}"></i></div>
                                <div class="cat-info">
                                    <h4>${cat.name}</h4>
                                    <p>${cat.count || 0} 篇知识</p>
                                </div>
                                <div class="cat-actions">
                                    <button class="btn-icon" onclick="app.knowledgeMgmt.editCategory('${cat.id}')" title="编辑">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="app.knowledgeMgmt.deleteCategory('${cat.id}')" title="删除">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                <!-- 新建分类按钮 -->
                <div class="km-panel" style="display: flex; align-items: center; justify-content: center; min-height: 80px; cursor: pointer; border-style: dashed;" onclick="app.knowledgeMgmt.showAddCategoryModal()">
                    <div style="text-align: center; color: var(--text-muted);">
                        <i class="fas fa-plus" style="font-size: 24px; margin-bottom: 8px;"></i>
                        <p style="margin: 0; font-size: 13px;">新建分类</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染标签管理
     */
    renderTags() {
        const tags = this.data.tags || this.getDefaultTags();

        return `
            <div class="km-tags">
                <div class="km-panel">
                    <div class="panel-header">
                        <h3><i class="fas fa-tags"></i> 标签列表</h3>
                        <button class="btn btn-sm btn-primary" onclick="app.knowledgeMgmt.showAddTagModal()">
                            <i class="fas fa-plus"></i> 新建标签
                        </button>
                    </div>
                    <div class="panel-body">
                        <div class="km-tag-cloud">
                            ${tags.map(tag => `
                                <div class="km-tag-item">
                                    <span class="tag-name">${tag.name}</span>
                                    <span class="tag-count">${tag.count}</span>
                                    <div class="tag-actions">
                                        <button class="btn-icon" onclick="app.knowledgeMgmt.editTag('${tag.name}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon" onclick="app.knowledgeMgmt.deleteTag('${tag.name}')">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染审核管理
     */
    renderReview() {
        return `
            <div class="km-review">
                <div class="km-tabs-sub">
                    <button class="active">待审核 (${this.data.stats?.pendingReview || 0})</button>
                    <button>审核历史</button>
                </div>
                <div class="km-review-list">
                    ${this.renderReviewItems()}
                </div>
            </div>
        `;
    }

    /**
     * 渲染审核项目
     */
    renderReviewItems() {
        const items = [
            { id: 1, title: '新型PNN测井技术应用', type: '知识', author: '张老师', submitTime: '2024-01-15 10:30', status: 'pending' },
            { id: 2, title: '复杂储层测井解释案例分析', type: '案例', author: '王教师', submitTime: '2024-01-15 09:20', status: 'pending' },
            { id: 3, title: '测井安全操作规范更新', type: '标准', author: '李管理员', submitTime: '2024-01-14 16:45', status: 'pending' }
        ];

        if (items.length === 0) {
            return '<div class="empty-state"><i class="fas fa-check-circle"></i><p>暂无待审核内容</p></div>';
        }

        return items.map(item => `
            <div class="km-review-item">
                <div class="review-main">
                    <div class="review-icon ${item.type === '案例' ? 'case' : 'knowledge'}">
                        <i class="fas ${item.type === '案例' ? 'fa-folder' : 'fa-book'}"></i>
                    </div>
                    <div class="review-info">
                        <h4>${item.title}</h4>
                        <p>类型: ${item.type} | 提交人: ${item.author} | 提交时间: ${item.submitTime}</p>
                    </div>
                </div>
                <div class="review-actions">
                    <button class="btn btn-sm btn-outline" onclick="app.knowledgeMgmt.previewReview('${item.id}')">
                        <i class="fas fa-eye"></i> 预览
                    </button>
                    <button class="btn btn-sm btn-success" onclick="app.knowledgeMgmt.approveReview('${item.id}')">
                        <i class="fas fa-check"></i> 通过
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.knowledgeMgmt.rejectReview('${item.id}')">
                        <i class="fas fa-times"></i> 拒绝
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染贡献者
     */
    renderUsers() {
        const contributors = this.data.contributors || this.getDefaultContributors();

        return `
            <div class="km-users">
                <div class="km-panel">
                    <div class="panel-header">
                        <h3><i class="fas fa-users"></i> 贡献者统计</h3>
                    </div>
                    <div class="panel-body">
                        <div class="km-table-container">
                            <table class="km-table">
                                <thead>
                                    <tr>
                                        <th>用户</th>
                                        <th>角色</th>
                                        <th>贡献数量</th>
                                        <th>最后活跃</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${contributors.map(user => `
                                        <tr>
                                            <td>
                                                <div class="km-user-cell">
                                                    <div class="user-avatar" style="background: ${user.avatar || 'var(--primary)'}">${user.name[0]}</div>
                                                    <span>${user.name}</span>
                                                </div>
                                            </td>
                                            <td><span class="km-role-badge ${user.role}">${user.role}</span></td>
                                            <td>${user.contributions} 篇</td>
                                            <td>${user.lastActive}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline" onclick="app.knowledgeMgmt.viewUserContributions('${user.name}')">
                                                    查看贡献
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 切换标签页
     */
    async switchTab(tabName) {
        this.currentTab = tabName;
        this.render();
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索框回车事件在渲染时已绑定
    }

    /**
     * 搜索知识
     */
    async search() {
        const keyword = document.getElementById('kmSearchInput')?.value?.trim();
        this.currentFilter.keyword = keyword;
        const result = await this.loadKnowledgeList(1);
        this.data.knowledge = result?.items || [];
        this.pagination.page = 1;
        this.pagination.total = result?.pagination?.total || 0;
        this.render();
        this.bindEvents();
    }

    /**
     * 筛选知识
     */
    async filterKnowledge() {
        this.currentFilter.category = document.getElementById('kmCategoryFilter')?.value;
        this.currentFilter.status = document.getElementById('kmStatusFilter')?.value;
        this.currentFilter.sort = document.getElementById('kmSortFilter')?.value;
        const result = await this.loadKnowledgeList(1);
        this.data.knowledge = result?.items || [];
        this.pagination.page = 1;
        this.pagination.total = result?.pagination?.total || 0;
        this.render();
        this.bindEvents();
    }

    /**
     * 跳转到指定页
     */
    async goToPage(page) {
        if (page < 1) return;
        const result = await this.loadKnowledgeList(page);
        this.data.knowledge = result?.items || [];
        this.pagination.page = page;
        this.pagination.total = result?.pagination?.total || 0;
        this.render();
        this.bindEvents();
    }

    /**
     * 设置视图模式
     */
    setView(view) {
        // 视图切换逻辑
        console.log('切换视图:', view);
    }

    /**
     * 显示新建知识弹窗
     */
    showAddModal() {
        this.showModal('新建知识', this.getKnowledgeFormHtml());
    }

    /**
     * 获取知识表单HTML
     */
    getKnowledgeFormHtml(data = {}) {
        return `
            <form id="kmKnowledgeForm" onsubmit="return app.knowledgeMgmt.saveKnowledge(event)">
                <input type="hidden" name="id" value="${data._id || ''}">
                <div class="form-group">
                    <label>标题 <span class="required">*</span></label>
                    <input type="text" name="title" value="${data.title || ''}" required placeholder="请输入知识标题">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>分类 <span class="required">*</span></label>
                        <select name="category" required>
                            <option value="">请选择分类</option>
                            ${this.data.categories.map(c => `<option value="${c.id}" ${data.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>标签</label>
                        <input type="text" name="tags" value="${(data.tags || []).join(', ')}" placeholder="多个标签用逗号分隔">
                    </div>
                </div>
                <div class="form-group">
                    <label>内容 <span class="required">*</span></label>
                    <textarea name="content" rows="10" required placeholder="请输入知识内容">${data.content || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.knowledgeMgmt.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `;
    }

    /**
    /**
     * 显示模态框
     */
    showModal(title, content) {
        try {
            // 清除之前的modal（如果存在）
            const existingModal = document.getElementById('kmModal');
            if (existingModal) {
                existingModal.remove();
            }

            // 创建新的modal
            const modal = document.createElement('div');
            modal.id = 'kmModal';
            modal.className = 'km-modal-overlay';
            modal.style.display = 'none'; // 初始隐藏

            modal.innerHTML = `
                <div class="km-modal">
                    <div class="km-modal-header">
                        <h3>${title}</h3>
                        <button class="km-modal-close" onclick="app.knowledgeMgmt.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="km-modal-body">${content}</div>
                </div>
            `;

            document.body.appendChild(modal);

            // 使用requestAnimationFrame确保DOM更新后显示
            requestAnimationFrame(() => {
                modal.style.display = 'flex';
            });

            console.log(`Modal created: ${title}`);
        } catch (error) {
            console.error('Error creating modal:', error);
            this.showMessage('创建弹窗失败: ' + error.message, 'error');
        }
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('kmModal');
        if (modal) {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
            }, 300); // 等待过渡动画完成
        }
    showModal(title, content) {
    }
    showModal(title, content) {
        const modalId = 'kmModal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'km-modal-overlay';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div class="km-modal">
                <div class="km-modal-header">
                    <h3>${title}</h3>
                    <button class="km-modal-close" onclick="app.knowledgeMgmt.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="km-modal-body">${content}</div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('kmModal');
        if (modal) modal.style.display = 'none';
    }

    // 其他方法省略...
    showAddCategoryModal() {
        this.showModal('新建分类', `
            <form onsubmit="return app.knowledgeMgmt.saveCategory(event)">
                <div class="form-group">
                    <label>分类名称 <span class="required">*</span></label>
                    <input type="text" name="name" required placeholder="请输入分类名称">
                </div>
                <div class="form-group">
                    <label>分类图标</label>
                    <select name="icon">
                        <option value="fa-book">📖 书籍</option>
                        <option value="fa-microchip">💾 芯片</option>
                        <option value="fa-hard-hat">👷 安全帽</option>
                        <option value="fa-ruler-combined">📏 尺子</option>
                        <option value="fa-folder-open">📁 文件夹</option>
                        <option value="fa-lightbulb">💡 灯泡</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.knowledgeMgmt.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `);
    }

    saveCategory(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const name = formData.get('name');
        const icon = formData.get('icon') || 'fa-folder';
        
        const newCategory = {
            id: 'cat_' + Date.now(),
            name: name,
            icon: icon,
            count: 0
        };
        
        this.data.categories.push(newCategory);
        this.closeModal();
        this.render();
        this.bindEvents();
        this.showMessage('分类创建成功', 'success');
        return false;
    }

    showAddTagModal() {
        this.showModal('新建标签', `
            <form onsubmit="return app.knowledgeMgmt.saveTag(event)">
                <div class="form-group">
                    <label>标签名称 <span class="required">*</span></label>
                    <input type="text" name="name" required placeholder="请输入标签名称">
                </div>
                <div class="form-group">
                    <label>标签颜色</label>
                    <input type="color" name="color" value="#2563eb" style="width: 60px; height: 40px; padding: 4px;">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.knowledgeMgmt.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `);
    }

    saveTag(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const name = formData.get('name');
        const color = formData.get('color') || '#2563eb';
        
        const newTag = {
            name: name,
            count: 0,
            color: color
        };
        
        if (!this.data.tags) this.data.tags = [];
        this.data.tags.push(newTag);
        this.closeModal();
        this.render();
        this.bindEvents();
        this.showMessage('标签创建成功', 'success');
        return false;
    }

    editCategory(id) {
        const category = this.data.categories.find(c => c.id === id);
        if (!category) {
            this.showMessage('未找到该分类', 'warning');
            return;
        }
        this.showModal('编辑分类', `
            <form onsubmit="return app.knowledgeMgmt.updateCategory(event, '${id}')">
                <div class="form-group">
                    <label>分类名称 <span class="required">*</span></label>
                    <input type="text" name="name" value="${category.name}" required placeholder="请输入分类名称">
                </div>
                <div class="form-group">
                    <label>分类图标</label>
                    <select name="icon">
                        <option value="fa-book" ${category.icon === 'fa-book' ? 'selected' : ''}>📖 书籍</option>
                        <option value="fa-microchip" ${category.icon === 'fa-microchip' ? 'selected' : ''}>💾 芯片</option>
                        <option value="fa-hard-hat" ${category.icon === 'fa-hard-hat' ? 'selected' : ''}>👷 安全帽</option>
                        <option value="fa-ruler-combined" ${category.icon === 'fa-ruler-combined' ? 'selected' : ''}>📏 尺子</option>
                        <option value="fa-folder-open" ${category.icon === 'fa-folder-open' ? 'selected' : ''}>📁 文件夹</option>
                        <option value="fa-lightbulb" ${category.icon === 'fa-lightbulb' ? 'selected' : ''}>💡 灯泡</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.knowledgeMgmt.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `);
    }

    updateCategory(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const category = this.data.categories.find(c => c.id === id);
        if (category) {
            category.name = formData.get('name');
            category.icon = formData.get('icon');
            this.closeModal();
            this.render();
            this.bindEvents();
            this.showMessage('分类更新成功', 'success');
        }
        return false;
    }

    deleteCategory(id) {
        if (!confirm('确定要删除这个分类吗？删除后该分类下的知识将变为未分类状态。')) return;
        
        const index = this.data.categories.findIndex(c => c.id === id);
        if (index > -1) {
            this.data.categories.splice(index, 1);
            this.render();
            this.bindEvents();
            this.showMessage('分类删除成功', 'success');
        }
    }

    editTag(name) {
        const tag = this.data.tags?.find(t => t.name === name);
        if (!tag) {
            this.showMessage('未找到该标签', 'warning');
            return;
        }
        this.showModal('编辑标签', `
            <form onsubmit="return app.knowledgeMgmt.updateTag(event, '${name}')">
                <div class="form-group">
                    <label>标签名称 <span class="required">*</span></label>
                    <input type="text" name="name" value="${tag.name}" required placeholder="请输入标签名称">
                </div>
                <div class="form-group">
                    <label>标签颜色</label>
                    <input type="color" name="color" value="${tag.color || '#2563eb'}" style="width: 60px; height: 40px; padding: 4px;">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.knowledgeMgmt.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `);
    }

    updateTag(event, oldName) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const tag = this.data.tags?.find(t => t.name === oldName);
        if (tag) {
            tag.name = formData.get('name');
            tag.color = formData.get('color');
            this.closeModal();
            this.render();
            this.bindEvents();
            this.showMessage('标签更新成功', 'success');
        }
        return false;
    }

    deleteTag(name) {
        if (!confirm('确定要删除这个标签吗？')) return;
        
        const index = this.data.tags?.findIndex(t => t.name === name);
        if (index > -1) {
            this.data.tags.splice(index, 1);
            this.render();
            this.bindEvents();
            this.showMessage('标签删除成功', 'success');
        }
    }

    previewReview(id) { 
        this.showMessage(`预览审核: ${id}`, 'info'); 
    }
    
    approveReview(id) { 
        const stats = this.data.stats;
        if (stats && stats.pendingReview > 0) {
            stats.pendingReview--;
            stats.approvedToday++;
        }
        this.render();
        this.bindEvents();
        this.showMessage('审核已通过', 'success'); 
    }
    
    rejectReview(id) { 
        const stats = this.data.stats;
        if (stats && stats.pendingReview > 0) {
            stats.pendingReview--;
            stats.rejectedToday++;
        }
        this.render();
        this.bindEvents();
        this.showMessage('审核已拒绝', 'warning'); 
    }
    
    viewUserContributions(name) { 
        this.showMessage(`查看用户贡献: ${name}`, 'info'); 
    }

    /**
     * 保存知识（新增/编辑）
     */
    async saveKnowledge(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const submitData = {
            title: formData.get('title'),
            category: formData.get('category'),
            description: formData.get('content')?.substring(0, 500) || '',
            keywords: formData.get('tags') ? formData.get('tags').split(',').map(k => k.trim()).filter(k => k) : [],
            content: formData.get('content')
        };
        
        const id = formData.get('id');
        
        try {
            let response;
            if (id) {
                // 编辑模式 - 调用更新 API
                response = await fetch(`${this.app.apiBase}/knowledge-management/items/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.app.token}`
                    },
                    body: JSON.stringify(submitData)
                });
            } else {
                // 新增模式 - 调用上传 API
                response = await fetch(`${this.app.apiBase}/knowledge-management/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.app.token}`
                    },
                    body: JSON.stringify(submitData)
                });
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.closeModal();
                this.showMessage(id ? '知识更新成功' : '知识添加成功', 'success');
                // 刷新列表
                await this.loadKnowledgeList(1);
                this.render();
                this.bindEvents();
            } else {
                this.showMessage(result.error || '保存失败', 'error');
            }
        } catch (error) {
            this.showMessage('保存失败: ' + error.message, 'error');
        }
        
        return false;
    }
    
    toggleSelectAll() { 
        const selectAll = document.getElementById('kmSelectAll');
        const checkboxes = document.querySelectorAll('.km-select-item');
        checkboxes.forEach(cb => cb.checked = selectAll?.checked || false);
    }

    /**
     * 导入数据
     */
    /**
     * 显示批量导入弹窗
     */
    showImportModal() {
        const categories = this.data.categories || this.getDefaultCategories();
        const categoriesOptions = categories.map(c => 
            `<option value="${c.id}">${c.name}</option>`
        ).join('');

        this.showModal('批量导入知识', `
            <div class="import-modal">
                <!-- 导入说明 -->
                <div class="import-info">
                    <h4><i class="fas fa-info-circle"></i> 导入说明</h4>
                    <ul>
                        <li>支持 <strong>JSON</strong> 和 <strong>CSV</strong> 格式</li>
                        <li>可批量导入多条知识记录</li>
                        <li>可选择将导入的知识归入指定分类</li>
                    </ul>
                </div>

                <!-- 下载模板 -->
                <div class="template-section">
                    <h4><i class="fas fa-download"></i> 下载模板</h4>
                    <div class="template-buttons">
                        <button class="btn btn-sm btn-outline" onclick="app.knowledgeMgmt.downloadTemplate('json')">
                            <i class="fas fa-file-code"></i> JSON 模板
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="app.knowledgeMgmt.downloadTemplate('csv')">
                            <i class="fas fa-file-csv"></i> CSV 模板
                        </button>
                    </div>
                </div>

                <!-- 分类选择 -->
                <div class="form-group">
                    <label>目标分类 <span class="required">*</span></label>
                    <select id="importCategory" required>
                        <option value="">请选择分类</option>
                        ${categoriesOptions}
                    </select>
                    <small style="color: var(--text-muted);">导入的知识将保存到所选分类</small>
                </div>

                <!-- 导入模式 -->
                <div class="form-group">
                    <label>导入模式</label>
                    <div class="import-mode-options">
                        <label class="radio-option">
                            <input type="radio" name="importMode" value="append" checked>
                            <span class="radio-label">
                                <strong>追加导入</strong>
                                <small>保留已有数据，添加到知识库</small>
                            </span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="importMode" value="replace">
                            <span class="radio-label">
                                <strong>替换模式</strong>
                                <small>同分类同标题的旧数据将被替换</small>
                            </span>
                        </label>
                    </div>
                </div>

                <!-- 文件上传 -->
                <div class="form-group">
                    <label>选择文件 <span class="required">*</span></label>
                    <div class="file-upload-area" id="fileUploadArea">
                        <input type="file" id="importFile" accept=".json,.csv" style="display:none;" 
                            onchange="app.knowledgeMgmt.handleFileSelect(event)">
                        <div class="upload-placeholder" onclick="document.getElementById('importFile').click()">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>点击或拖拽文件到此处</p>
                            <small>支持 .json, .csv 格式</small>
                        </div>
                        <div class="file-info" id="selectedFileInfo" style="display:none;">
                            <i class="fas fa-file-alt"></i>
                            <span class="filename"></span>
                            <button class="btn-icon" onclick="app.knowledgeMgmt.clearSelectedFile()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 预览区域 -->
                <div id="importPreview" class="import-preview" style="display:none;">
                    <h4><i class="fas fa-eye"></i> 数据预览</h4>
                    <div class="preview-content"></div>
                    <div class="preview-summary"></div>
                </div>

                <!-- 操作按钮 -->
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.knowledgeMgmt.closeModal()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button type="button" class="btn btn-primary" onclick="app.knowledgeMgmt.executeImport()">
                        <i class="fas fa-file-import"></i> 开始导入
                    </button>
                </div>
            </div>
        `);
    }

    /**
     * 处理文件选择
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileInfo = document.getElementById('selectedFileInfo');
        const placeholder = document.querySelector('.upload-placeholder');
        const filename = fileInfo.querySelector('.filename');
        
        fileInfo.style.display = 'flex';
        placeholder.style.display = 'none';
        filename.textContent = file.name;

        // 读取并预览数据
        const content = await file.text();
        const preview = this.previewImportData(content, file.name);
        
        const previewEl = document.getElementById('importPreview');
        previewEl.style.display = 'block';
        previewEl.querySelector('.preview-content').innerHTML = preview.html;
        previewEl.querySelector('.preview-summary').innerHTML = `
            <span class="preview-badge success">${preview.count} 条记录</span>
            ${preview.errors.length > 0 ? 
                `<span class="preview-badge warning">${preview.errors.length} 个问题</span>` : ''}
        `;
    }

    /**
     * 预览导入数据
     */
    previewImportData(content, filename) {
        const ext = filename.split('.').pop().toLowerCase();
        let items = [];
        let errors = [];

        try {
            if (ext === 'json') {
                const parsed = JSON.parse(content);
                items = Array.isArray(parsed) ? parsed : [parsed];
            } else if (ext === 'csv') {
                items = this.parseCSV(content);
            }
        } catch (e) {
            errors.push('文件解析失败: ' + e.message);
        }

        // 验证数据
        const validItems = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.title && item.title.trim()) {
                validItems.push(item);
            } else {
                errors.push(`第 ${i + 1} 行：缺少标题`);
            }
        }

        // 生成预览HTML
        const html = `
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>标题</th>
                        <th>分类</th>
                        <th>关键词</th>
                    </tr>
                </thead>
                <tbody>
                    ${validItems.slice(0, 5).map((item, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${item.title}</td>
                            <td><span class="badge">${item.category || '未指定'}</span></td>
                            <td>${(item.keywords || item.tags || []).slice(0, 3).join(', ')}</td>
                        </tr>
                    `).join('')}
                    ${validItems.length > 5 ? `<tr><td colspan="4" class="more-rows">... 共 ${validItems.length} 条记录</td></tr>` : ''}
                </tbody>
            </table>
        `;

        return {
            html,
            count: validItems.length,
            errors,
            items: validItems
        };
    }

    /**
     * 解析CSV
     */
    parseCSV(content) {
        const lines = content.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const items = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const item = {};
            headers.forEach((header, index) => {
                const value = values[index]?.trim().replace(/^"|"$/g, '') || '';
                if (header === 'keywords' || header === 'tags') {
                    item[header] = value.split(';').map(k => k.trim()).filter(k => k);
                } else {
                    item[header] = value;
                }
            });

            items.push(item);
        }

        return items;
    }

    /**
     * 解析CSV行
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    /**
     * 清除已选文件
     */
    clearSelectedFile() {
        document.getElementById('importFile').value = '';
        document.getElementById('selectedFileInfo').style.display = 'none';
        document.querySelector('.upload-placeholder').style.display = 'block';
        document.getElementById('importPreview').style.display = 'none';
    }

    /**
     * 下载导入模板
     */
    downloadTemplate(format) {
        const templates = {
            json: {
                filename: 'knowledge_template.json',
                content: JSON.stringify([
                    {
                        title: '示例知识标题',
                        category: 'basic',
                        description: '知识描述',
                        keywords: ['关键词1', '关键词2'],
                        content: '知识详细内容...'
                    }
                ], null, 2)
            },
            csv: {
                filename: 'knowledge_template.csv',
                content: 'title,category,description,keywords,content\n"示例知识标题","basic","知识描述","关键词1;关键词2","知识详细内容..."'
            }
        };

        const template = templates[format];
        if (!template) return;

        const blob = new Blob([template.content], { 
            type: format === 'json' ? 'application/json' : 'text/csv' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = template.filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * 执行批量导入
     */
    async executeImport() {
        const category = document.getElementById('importCategory')?.value;
        const fileInput = document.getElementById('importFile');
        const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'append';

        if (!category) {
            this.showMessage('请选择目标分类', 'warning');
            return;
        }

        if (!fileInput.files[0]) {
            this.showMessage('请选择要导入的文件', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('category', category);
        formData.append('mode', mode);

        this.showMessage('正在导入...', 'info');

        try {
            const response = await fetch(`${this.app.apiBase}/knowledge-management/batch-import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.app.token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.closeModal();
                this.showMessage(`导入成功！${result.summary.success} 条记录已导入`, 'success');
                
                // 刷新列表 - 重新加载数据而不是使用默认数据
                const result = await this.loadKnowledgeList(1);
                this.data.knowledge = result?.items || [];
                this.pagination.total = result?.pagination?.total || 0;
                this.pagination.page = 1;
                this.render();
                this.bindEvents();
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            this.showMessage('导入失败: ' + error.message, 'error');
        }
    }

    showMessage(message, type = 'info') {
        try {
            // 移除已存在的消息提示
            const existingToast = document.getElementById('kmMessageToast');
            if (existingToast) {
                existingToast.remove();
            }

            // 创建新消息提示
            const toast = document.createElement('div');
            toast.id = 'kmMessageToast';
            toast.className = `km-message-toast km-message-${type}`;

            const icon = this.getMessageIcon(type);
            toast.innerHTML = `
                <i class="${icon}"></i>
                <span>${message}</span>
            `;

            document.body.appendChild(toast);

            // 3秒后自动消失
            setTimeout(() => {
                toast.classList.add('hide');
                toast.addEventListener('transitionend', () => {
                    toast.remove();
                });
            }, 3000);

            console.log(`[${type}] ${message}`);
        } catch (error) {
            console.error('Error showing message:', error);
        }
    }

    getMessageIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
        if (this.app.showMessage) {
            this.app.showMessage(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
}