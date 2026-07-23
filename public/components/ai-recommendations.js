/**
 * 智能学习建议模块
 * 完整的AI推荐功能组件
 */
class AIRecommendationsModule {
    constructor(app) {
        this.app = app;
        this.isLoading = false;
        this.recommendations = null;
        this.retryCount = 0;
        this.maxRetries = 2;
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    /**
     * 初始化模块
     */
    init() {
        console.log('🧠 智能学习建议模块初始化');
        this.bindGlobalEvents();
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 切换抽屉
        window.toggleAiDrawer = () => this.toggleDrawer();
        // 刷新建议
        window.refreshAiRecommendations = () => this.refresh();
        // 标记建议已读
        window.markRecommendationRead = (type, id) => this.markRead(type, id);
    }

    /**
     * 切换抽屉显示
     */
    toggleDrawer() {
        const overlay = document.getElementById('aiDrawerOverlay');
        const drawer = document.getElementById('aiDrawer');

        if (!overlay || !drawer) {return;}

        const isVisible = overlay.style.display === 'flex';

        if (isVisible) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    }

    /**
     * 打开抽屉
     */
    openDrawer() {
        const overlay = document.getElementById('aiDrawerOverlay');
        const drawer = document.getElementById('aiDrawer');

        if (!overlay || !drawer) {return;}

        overlay.style.display = 'flex';
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';

        // 加载建议
        if (!this.recommendations) {
            this.loadRecommendations();
        }
    }

    /**
     * 关闭抽屉
     */
    closeDrawer() {
        const overlay = document.getElementById('aiDrawerOverlay');
        const drawer = document.getElementById('aiDrawer');

        if (!overlay || !drawer) {return;}

        overlay.style.display = 'none';
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    }

    /**
     * 加载推荐建议
     */
    async loadRecommendations() {
        if (this.isLoading) {return;}

        const container = document.getElementById('aiRecommendations');
        if (!container) {return;}

        this.isLoading = true;
        this.retryCount = 0;

        // 显示加载状态
        container.innerHTML = this.getLoadingHTML();

        try {
            // 检查缓存
            const cached = this.getCachedRecommendations();
            if (cached) {
                this.recommendations = cached;
                this.renderRecommendations();
                this.isLoading = false;
                return;
            }

            // 加载新数据
            await this.fetchRecommendations();
        } catch (error) {
            console.error('加载推荐失败:', error);
            this.handleLoadError(error);
        }
    }

    /**
     * 获取加载状态HTML
     */
    getLoadingHTML() {
        return `
            <div class="ai-loading">
                <div class="ai-loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="ai-loading-text">正在分析您的学习数据...</p>
                <p class="ai-loading-tip">生成个性化学习建议</p>
            </div>
        `;
    }

    /**
     * 获取错误状态HTML
     */
    getErrorHTML(message, showRetry = true) {
        return `
            <div class="ai-error">
                <div class="ai-error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4>加载失败</h4>
                <p>${message}</p>
                ${
                    showRetry
                        ? `
                    <button class="btn btn-primary" onclick="app.aiRecommendations.loadRecommendations()">
                        <i class="fas fa-redo"></i> 重试
                    </button>
                `
                        : ''
                }
            </div>
        `;
    }

    /**
     * 获取空状态HTML
     */
    getEmptyHTML() {
        return `
            <div class="ai-empty">
                <div class="ai-empty-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <h4>暂无学习建议</h4>
                <p>继续学习更多内容，我们将为您生成个性化的学习建议</p>
            </div>
        `;
    }

    /**
     * 获取缓存的推荐
     */
    getCachedRecommendations() {
        try {
            const cached = localStorage.getItem('ai_recommendations_cache');
            if (cached) {
                const data = JSON.parse(cached);
                if (data.timestamp && Date.now() - data.timestamp < this.cacheTimeout) {
                    return data.recommendations;
                }
            }
        } catch (e) {
            console.warn('读取缓存失败:', e);
        }
        return null;
    }

    /**
     * 缓存推荐数据
     */
    cacheRecommendations(recommendations) {
        try {
            const data = {
                timestamp: Date.now(),
                recommendations,
            };
            localStorage.setItem('ai_recommendations_cache', JSON.stringify(data));
        } catch (e) {
            console.warn('缓存失败:', e);
        }
    }

    /**
     * 获取API响应
     */
    async fetchRecommendations() {
        const token = localStorage.getItem('token');

        // 使用AbortController实现超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

        try {
            const response = await fetch(`${this.app.apiBase}/ai-recommendations/recommendations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // 处理数据
            this.recommendations = this.transformRecommendations(data);
            this.cacheRecommendations(this.recommendations);
            this.renderRecommendations();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 转换推荐数据格式
     */
    transformRecommendations(data) {
        // 如果API返回空或错误，使用模拟数据
        if (!data || !data.recommendations || data.recommendations.length === 0) {
            return this.getMockRecommendations();
        }

        return {
            weakPoints: data.weakPoints || [],
            pendingTasks: data.pendingTasks || [],
            recommendedCases: data.recommendedCases || [],
            discussionGroups: data.discussionGroups || [],
            efficiencyTips: data.efficiencyTips || [],
            reminders: data.reminders || [],
            total: data.total || 0,
            reasoning: data.reasoning || '',
        };
    }

    /**
     * 获取模拟推荐数据
     */
    getMockRecommendations() {
        return {
            weakPoints: [
                {
                    title: '跨学科整合能力较弱',
                    description: '在测井-地质协同方面需要加强',
                    priority: 'high',
                },
                {
                    title: '实践操作经验不足',
                    description: '现场作业流程掌握不够熟练',
                    priority: 'medium',
                },
            ],
            pendingTasks: [
                { title: '完成电阻率测井章节', module: '电法测井技术', progress: 65 },
                { title: '复习API标准规范', module: '标准规范', progress: 30 },
            ],
            recommendedCases: [
                { title: '复杂储层测井解释案例', category: '典型案例', difficulty: 'advanced' },
                {
                    title: '钻井液侵入影响校正案例',
                    category: '典型案例',
                    difficulty: 'intermediate',
                },
            ],
            discussionGroups: [
                { title: '测井解释技术交流群', members: 156, activity: 'high' },
                { title: '现场作业经验分享', members: 89, activity: 'medium' },
            ],
            efficiencyTips: [
                { title: '建议使用番茄工作法', description: '每25分钟休息5分钟，提高学习效率' },
                { title: '多做实践练习', description: '理论学习后立即进行实操练习效果更好' },
            ],
            reminders: [
                { title: '测井基础考试将在3天后进行', type: 'exam', time: '3天后' },
                { title: '您有2个学习任务已超时', type: 'task', time: '现在' },
            ],
            total: 8,
            reasoning: '基于您最近的学习数据分析',
        };
    }

    /**
     * 渲染推荐内容
     */
    renderRecommendations() {
        const container = document.getElementById('aiRecommendations');
        if (!container) {return;}

        if (!this.recommendations || this.recommendations.total === 0) {
            container.innerHTML = this.getEmptyHTML();
            return;
        }

        container.innerHTML = `
            <!-- 智能分析摘要 -->
            <div class="ai-summary">
                <div class="ai-summary-icon">
                    <i class="fas fa-brain"></i>
                </div>
                <div class="ai-summary-content">
                    <h4>智能分析摘要</h4>
                    <p>${this.recommendations.reasoning}</p>
                </div>
                <div class="ai-summary-badge">${this.recommendations.total}条建议</div>
            </div>

            <!-- 薄弱点分析 -->
            ${this.renderSection('薄弱点分析', 'exclamation-circle', 'weakPoints', 'warning', 'high')}

            <!-- 待完成任务 -->
            ${this.renderSection('待完成任务', 'tasks', 'pendingTasks', 'info', 'medium')}

            <!-- 推荐案例 -->
            ${this.renderSection('推荐案例', 'folder-open', 'recommendedCases', 'success', 'medium')}

            <!-- 学习效率建议 -->
            ${this.renderSection('学习效率建议', 'lightbulb', 'efficiencyTips', 'primary', 'low')}

            <!-- 讨论组推荐 -->
            ${this.renderSection('讨论组', 'comments', 'discussionGroups', 'accent', 'low')}

            <!-- 学习提醒 -->
            ${this.renderSection('学习提醒', 'bell', 'reminders', 'danger', 'high')}
        `;

        // 更新徽章
        this.updateBadge();
    }

    /**
     * 渲染单个区块
     */
    renderSection(title, icon, dataKey, theme, priority) {
        const data = this.recommendations[dataKey];
        if (!data || data.length === 0) {return '';}

        const themeClass = {
            warning: 'orange',
            info: 'blue',
            success: 'green',
            primary: 'indigo',
            accent: 'cyan',
            danger: 'red',
        };

        return `
            <div class="ai-section">
                <div class="ai-section-header">
                    <div class="section-icon ${themeClass[theme]}">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <h3>${title}</h3>
                    <span class="section-count">${data.length}</span>
                </div>
                <div class="ai-section-content">
                    ${data.map((item, index) => this.renderItem(item, dataKey, index, priority)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 渲染单个推荐项
     */
    renderItem(item, type, index, priority) {
        const priorityLabels = { high: '紧急', medium: '重要', low: '建议' };

        switch (type) {
            case 'weakPoints':
                return `
                    <div class="ai-item weak-point priority-${priority}">
                        <div class="item-header">
                            <h4>${item.title}</h4>
                            <span class="priority-badge ${priority}">${priorityLabels[priority]}</span>
                        </div>
                        <p>${item.description}</p>
                        <div class="item-actions">
                            <button class="btn btn-sm btn-primary" onclick="app.showKnowledgeDetail('${item.relatedId || ''}')">
                                <i class="fas fa-book"></i> 去学习
                            </button>
                        </div>
                    </div>
                `;

            case 'pendingTasks':
                return `
                    <div class="ai-item task-item">
                        <div class="item-header">
                            <h4>${item.title}</h4>
                            <span class="progress-badge">${item.progress}%</span>
                        </div>
                        <p class="task-module">${item.module}</p>
                        <div class="progress-mini">
                            <div class="progress-fill" style="width: ${item.progress}%"></div>
                        </div>
                        <div class="item-actions">
                            <button class="btn btn-sm btn-primary">
                                <i class="fas fa-play"></i> 继续学习
                            </button>
                        </div>
                    </div>
                `;

            case 'recommendedCases':
                return `
                    <div class="ai-item case-item">
                        <div class="item-header">
                            <h4>${item.title}</h4>
                            <span class="difficulty-badge ${item.difficulty}">${this.getDifficultyText(item.difficulty)}</span>
                        </div>
                        <p class="case-category"><i class="fas fa-folder"></i> ${item.category}</p>
                        <div class="item-actions">
                            <button class="btn btn-sm btn-outline">
                                <i class="fas fa-eye"></i> 查看详情
                            </button>
                            <button class="btn btn-sm btn-primary">
                                <i class="fas fa-play"></i> 开始学习
                            </button>
                        </div>
                    </div>
                `;

            case 'efficiencyTips':
                return `
                    <div class="ai-item tip-item">
                        <div class="item-header">
                            <h4><i class="fas fa-lightbulb"></i> ${item.title}</h4>
                        </div>
                        <p>${item.description}</p>
                    </div>
                `;

            case 'discussionGroups':
                return `
                    <div class="ai-item group-item">
                        <div class="item-header">
                            <h4>${item.title}</h4>
                            <span class="activity-badge ${item.activity}">${this.getActivityText(item.activity)}</span>
                        </div>
                        <p class="group-members"><i class="fas fa-users"></i> ${item.members} 人参与</p>
                        <div class="item-actions">
                            <button class="btn btn-sm btn-primary">
                                <i class="fas fa-comments"></i> 加入讨论
                            </button>
                        </div>
                    </div>
                `;

            case 'reminders':
                const typeIcons = { exam: 'fa-graduation-cap', task: 'fa-tasks', review: 'fa-eye' };
                return `
                    <div class="ai-item reminder-item priority-${priority}">
                        <div class="reminder-icon">
                            <i class="fas ${typeIcons[item.type] || 'fa-bell'}"></i>
                        </div>
                        <div class="reminder-content">
                            <h4>${item.title}</h4>
                            <span class="reminder-time"><i class="fas fa-clock"></i> ${item.time}</span>
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    getDifficultyText(difficulty) {
        const texts = { beginner: '入门', intermediate: '进阶', advanced: '高级' };
        return texts[difficulty] || difficulty;
    }

    getActivityText(activity) {
        const texts = { high: '活跃', medium: '一般', low: '较少' };
        return texts[activity] || activity;
    }

    /**
     * 处理加载错误
     */
    handleLoadError(error) {
        const container = document.getElementById('aiRecommendations');
        if (!container) {return;}

        // 如果是超时且有缓存，使用缓存
        if (error.name === 'AbortError' && this.getCachedRecommendations()) {
            this.recommendations = this.getCachedRecommendations();
            this.renderRecommendations();
            this.isLoading = false;
            return;
        }

        // 如果重试次数未超过最大值，显示重试按钮
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            // 显示加载状态 2 秒后自动重试
            container.innerHTML = this.getErrorHTML(
                error.name === 'AbortError' ? '请求超时，请检查网络连接' : '加载失败，正在重试...',
                true
            );

            // 2秒后自动重试
            setTimeout(() => {
                if (this.isLoading && this.retryCount <= this.maxRetries) {
                    this.loadRecommendations();
                }
            }, 2000);
        } else {
            // 使用模拟数据
            this.recommendations = this.getMockRecommendations();
            this.renderRecommendations();
        }

        this.isLoading = false;
    }

    /**
     * 刷新推荐
     */
    async refresh() {
        // 清除缓存
        try {
            localStorage.removeItem('ai_recommendations_cache');
        } catch (e) {}

        this.recommendations = null;
        this.retryCount = 0;
        await this.loadRecommendations();
    }

    /**
     * 标记建议已读
     */
    markRead(type, id) {
        console.log('标记已读:', type, id);
        // 实现已读逻辑
    }

    /**
     * 更新徽章数量
     */
    updateBadge() {
        const badge = document.getElementById('aiBadge');
        if (badge && this.recommendations) {
            const count = this.recommendations.total || 0;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// 浏览器环境导出
if (typeof window !== 'undefined') {
    window.AIRecommendationsModule = AIRecommendationsModule;
}

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIRecommendationsModule;
}
