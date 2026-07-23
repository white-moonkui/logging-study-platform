// 测井专业智能培训系统 - 基于第四版设计的前端应用
class WellLoggingTrainingApp {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.currentUser = null;
        this.token = null;
        this.currentModule = 'basic';
        this.isAdmin = false;

        // 知识库增强功能配置
        this.knowledgeModules = {
            basic: {
                id: 'basic',
                name: '测井基础知识',
                icon: 'fas fa-book-open',
                description: '测井专业基础理论知识',
            },
            instrument: {
                id: 'instrument',
                name: '测井仪器知识',
                icon: 'fas fa-microscope',
                description: '各类测井仪器的原理和使用',
            },
            operation: {
                id: 'operation',
                name: '现场作业知识',
                icon: 'fas fa-hard-hat',
                description: '现场作业流程和安全规范',
            },
            standard: {
                id: 'standard',
                name: '测井标准学习',
                icon: 'fas fa-file-contract',
                description: '行业标准和规范学习',
            },
            cross: {
                id: 'cross',
                name: '跨行业知识',
                icon: 'fas fa-network-wired',
                description: '相关行业的交叉知识',
                subModules: {
                    drilling: { name: '钻井-测井知识', icon: 'fas fa-digging' },
                    geology: { name: '地质-测井知识', icon: 'fas fa-mountain' },
                    geophysics: { name: '物探-测井知识', icon: 'fas fa-waveform' },
                },
            },
            evaluation: {
                id: 'evaluation',
                name: '培训效果评估',
                icon: 'fas fa-chart-line',
                description: '学习效果评估和建议',
            },
            knowledgeManagement: {
                id: 'knowledge-management',
                name: '知识库管理',
                icon: 'fas fa-cogs',
                description: '知识审核与录入管理',
            },
        };

        this.init();
    }

    async init() {
        // 初始化内存管理和组件加载器
        this.initMemoryManagement();

        this.bindEvents();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
        this.checkAuth();
        this.loadInitialData();
        this.initCharts();

        // 初始化扩展系统
        this.initExtensionSystem();

        // 初始化培训评估模块
        this.initTrainingEvaluation();

        // 初始化VR模拟器
        this.initVRSimulator();

        // 加载用户插件
        this.loadUserExtensions();

        // 初始化AI推荐系统
        this.initAiRecommendationSystem();

        // 初始化聊天消息
        this.initChatMessages();

        // 初始化知识库筛选状态
        this.initKnowledgeFilter();

        // 初始化知识交互模块
        this.initKnowledgeInteraction();
    }

    // 初始化AI推荐系统
    initAiRecommendationSystem() {
        // 加载收藏状态
        this.updateAllBookmarksUI();

        // 初始化AI推荐模块
        if (window.AIRecommendationsModule) {
            this.aiRecommendations = new AIRecommendationsModule(this);
            this.aiRecommendations.init();
            console.log('🧠 智能学习建议模块已加载');
        }

        // 延迟加载推荐（避免页面加载时立即请求）
        setTimeout(() => {
            if (this.aiRecommendations) {
                this.aiRecommendations.loadRecommendations();
            }
        }, 2000);
    }

    // 更新所有收藏UI
    updateAllBookmarksUI() {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');

        document.querySelectorAll('[onclick*="bookmarkContent"]').forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            const match = onclick.match(/bookmarkContent\('([^,]+),\s*([^)]+)'\)/);
            if (match) {
                const module = match[1].replace(/'/g, '');
                const topic = match[2].replace(/'/g, '');
                const key = `${module}_${topic}`;
                const isBookmarked = bookmarks[key] || false;

                const icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fas', isBookmarked);
                    icon.classList.toggle('far', !isBookmarked);
                }
            }
        });
    }

    bindEvents() {
        // 左侧导航栏事件
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.addEventListener('click', e => {
                const moduleId = e.currentTarget.dataset.module;
                if (moduleId) {
                    app.showModule(moduleId);
                }
            });
        });

        // 知识库子标签事件
        document.querySelectorAll('.knowledge-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                const moduleId = e.currentTarget.dataset.module;
                if (moduleId) {
                    this.showKnowledgeModule(moduleId);
                }
            });
        });

        // 跨行业子模块事件
        document.querySelectorAll('.sub-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                const subModuleId = e.currentTarget.dataset.submodule;
                if (subModuleId) {
                    this.showSubModule(subModuleId);
                }
            });
        });

        // 管理员标签事件
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                const adminTab = e.currentTarget.dataset.adminTab;
                if (adminTab) {
                    this.showAdminTab(adminTab);
                }
            });
        });

        // 登录相关事件（添加空值检查）
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn)
            {loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });}

        const loginForm = document.getElementById('loginForm');
        if (loginForm)
            {loginForm.addEventListener('submit', e => {
                e.preventDefault();
                this.handleLogin();
            });}

        // 模态框关闭事件
        const closeBtn = document.querySelector('.close');
        if (closeBtn)
            {closeBtn.addEventListener('click', () => {
                this.hideLoginModal();
            });}

        // 演示账户快速登录
        document.querySelectorAll('.btn-demo').forEach(btn => {
            btn.addEventListener('click', e => {
                const username = e.target.dataset.user;
                const password = e.target.dataset.pass;
                const loginUsername = document.getElementById('loginUsername');
                const loginPassword = document.getElementById('loginPassword');
                if (loginUsername) {loginUsername.value = username || '';}
                if (loginPassword) {loginPassword.value = password || '';}
                this.handleLogin();
            });
        });

        // 个人资料表单
        const profileForm = document.getElementById('profileForm');
        if (profileForm)
            {profileForm.addEventListener('submit', e => {
                e.preventDefault();
                this.updateProfile();
            });}

        // 过滤器事件
        document.getElementById('categoryFilter')?.addEventListener('change', () => {
            this.filterKnowledge();
        });

        document.getElementById('difficultyFilter')?.addEventListener('change', () => {
            this.filterKnowledge();
        });

        // 登录按钮事件
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.handleLoginAction();
        });

        // 模块管理按钮
        document.getElementById('moduleManageBtn')?.addEventListener('click', () => {
            this.showModule('admin');
            this.showAdminTab('moduleManage');
        });

        // 开始考试按钮
        document.getElementById('startExamBtn')?.addEventListener('click', () => {
            this.startNewExam();
        });

        // 键盘快捷键
        document.addEventListener('keydown', e => {
            this.handleKeyboardShortcuts(e);
        });

        // 点击外部关闭面板
        document.addEventListener('click', e => {
            if (
                !e.target.closest('.notification-btn') &&
                !e.target.closest('.notification-panel')
            ) {
                this.closeNotifications();
            }
            if (!e.target.closest('.user-btn') && !e.target.closest('.user-menu')) {
                this.closeUserMenu();
            }
        });

        // 文件拖拽上传
        this.setupFileUpload();
    }

    // 通知面板功能
    toggleNotifications() {
        const panel = document.getElementById('notificationPanel');
        const isVisible = panel.style.display === 'block';

        if (isVisible) {
            this.closeNotifications();
        } else {
            this.showNotifications();
        }
    }

    showNotifications() {
        const panel = document.getElementById('notificationPanel');
        const menu = document.getElementById('userMenu');

        panel.style.display = 'block';
        menu.style.display = 'none';

        // 清除通知徽章
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }

    closeNotifications() {
        const panel = document.getElementById('notificationPanel');
        panel.style.display = 'none';
    }

    // 用户菜单功能
    toggleUserMenu() {
        const menu = document.getElementById('userMenu');
        const panel = document.getElementById('notificationPanel');

        const isVisible = menu.style.display === 'block';

        if (isVisible) {
            this.closeUserMenu();
        } else {
            this.showUserMenu();
        }
    }

    showUserMenu() {
        const menu = document.getElementById('userMenu');
        const panel = document.getElementById('notificationPanel');

        menu.style.display = 'block';
        panel.style.display = 'none';

        // 更新用户信息
        if (this.currentUser) {
            document.getElementById('menuUserName').textContent =
                this.currentUser.username || this.currentUser.name;
        }
    }

    closeUserMenu() {
        const menu = document.getElementById('userMenu');
        menu.style.display = 'none';
    }

    // 个人中心
    openPersonalCenter() {
        this.closeUserMenu();
        this.showMessage('个人中心功能开发中...', 'info');
    }

    // 系统设置
    openSettings() {
        this.closeUserMenu();
        this.showMessage('系统设置功能开发中...', 'info');
    }

    // 知识库管理
    openKnowledgeAdmin() {
        this.closeUserMenu();
        if (this.isAdmin) {
            this.showModuleManager();
        } else {
            this.showMessage('您没有权限访问知识库管理', 'error');
        }
    }

    // 打开VR模拟器
    openVRSimulator() {
        if (this.vrSimulator) {
            this.vrSimulator.createVRInterface();
            this.showMessage('VR模拟器已启动', 'success');
        } else {
            this.showMessage('VR模拟器正在初始化...', 'info');
        }
    }

    // 切换性能监控面板
    togglePerformancePanel() {
        const panel = document.getElementById('performancePanel');
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                this.updatePerformancePanel();
            }
        }
    }

    // 更新性能面板数据
    updatePerformancePanel() {
        if (!window.memoryManager) {return;}

        const stats = window.memoryManager.getMemoryStats();
        if (stats.available) {
            // 更新内存数据（添加空值检查）
            const memoryUsed = document.getElementById('memoryUsed');
            const memoryTotal = document.getElementById('memoryTotal');
            const memoryLimit = document.getElementById('memoryLimit');
            const memoryProgress = document.getElementById('memoryProgress');

            if (memoryUsed) {memoryUsed.textContent = `${stats.memory.used} MB`;}
            if (memoryTotal) {memoryTotal.textContent = `${stats.memory.total} MB`;}
            if (memoryLimit) {memoryLimit.textContent = `${stats.memory.limit} MB`;}

            const usagePercent = (stats.memory.used / stats.memory.total) * 100;
            if (memoryProgress) {memoryProgress.style.width = `${usagePercent}%`;}

            // 更新缓存数据
            const cacheItems = document.getElementById('cacheItems');
            const cacheSize = document.getElementById('cacheSize');
            const cacheHitRate = document.getElementById('cacheHitRate');

            if (cacheItems) {cacheItems.textContent = stats.cache.items;}
            if (cacheSize) {cacheSize.textContent = `${stats.cache.size} KB`;}
            if (cacheHitRate) {cacheHitRate.textContent = '85%';} // 模拟数据

            // 更新组件数据
            const componentsLoaded = document.getElementById('componentsLoaded');
            const componentsLoading = document.getElementById('componentsLoading');
            const componentsRegistered = document.getElementById('componentsRegistered');
            if (window.componentLoader && componentsLoaded) {
                const loadStats = window.componentLoader.getLoadStats();
                componentsLoaded.textContent = loadStats.loaded;
                if (componentsLoading) {componentsLoading.textContent = loadStats.loading;}
                if (componentsRegistered) {componentsRegistered.textContent = loadStats.registered;}
            }

            const virtualLists = document.getElementById('virtualLists');
            if (virtualLists) {virtualLists.textContent = stats.virtualScrolls;}

            // 更新性能指标（添加空值检查）
            const fps = document.getElementById('fps');
            const domNodes = document.getElementById('domNodes');
            const responseTime = document.getElementById('responseTime');

            if (fps) {fps.textContent = '60';}
            if (domNodes) {domNodes.textContent = document.querySelectorAll('*').length;}
            if (responseTime) {responseTime.textContent = '12ms';}
        }
    }

    // 清理缓存
    clearCache() {
        if (window.memoryManager) {
            window.memoryManager.performCleanup();
            this.updatePerformancePanel();
            this.showMessage('缓存已清理', 'success');
        }
    }

    // 性能优化
    optimizePerformance() {
        this.showMessage('正在执行性能优化...', 'info');

        // 执行优化操作
        if (window.memoryManager) {
            window.memoryManager.performCleanup();
        }

        // 清理不必要的DOM元素
        const oldNotifications = document.querySelectorAll('.message');
        oldNotifications.forEach(el => el.remove());

        setTimeout(() => {
            this.updatePerformancePanel();
            this.showMessage('性能优化完成', 'success');
        }, 2000);
    }

    // 退出登录
    logout() {
        this.closeUserMenu();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUser = null;
        this.isAdmin = false;

        document.getElementById('userName').textContent = '管理员';

        this.showMessage('已退出登录', 'info');
    }

    // 显示模块管理器
    showModuleManager(moduleId) {
        const modalHtml = `
            <div class="modal" id="moduleManagerModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> 模块管理 - ${this.knowledgeModules[moduleId]?.name}</h3>
                        <span class="close" onclick="app.closeModal('moduleManagerModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="moduleName">模块名称</label>
                            <input type="text" id="moduleName" value="${this.knowledgeModules[moduleId]?.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="moduleDescription">模块描述</label>
                            <textarea id="moduleDescription" rows="3">${this.knowledgeModules[moduleId]?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="moduleIcon">模块图标 (Font Awesome)</label>
                            <input type="text" id="moduleIcon" value="${this.knowledgeModules[moduleId]?.icon || ''}">
                        </div>
                        <div class="module-actions" style="display: flex; gap: 10px; margin-top: 20px;">
                            <button class="btn btn-primary" onclick="app.updateModule('${moduleId}')">
                                <i class="fas fa-save"></i> 保存修改
                            </button>
                            ${
                                moduleId !== 'basic' && moduleId !== 'evaluation'
                                    ? `
                                <button class="btn" style="background: var(--danger); color: white;" onclick="app.deleteModule('${moduleId}')">
                                    <i class="fas fa-trash"></i> 删除模块
                                </button>
                            `
                                    : ''
                            }
                            <button class="btn btn-secondary" onclick="app.closeModal('moduleManagerModal')">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 显示模态框
        this.showModal(modalHtml);
    }

    // 更新模块
    async updateModule(moduleId) {
        const name = document.getElementById('moduleName').value;
        const description = document.getElementById('moduleDescription').value;
        const icon = document.getElementById('moduleIcon').value;

        try {
            const response = await this.apiCall(`/admin/modules/${moduleId}`, {
                method: 'PUT',
                body: JSON.stringify({ name, description, icon }),
            });

            if (response.success) {
                this.knowledgeModules[moduleId].name = name;
                this.knowledgeModules[moduleId].description = description;
                this.knowledgeModules[moduleId].icon = icon;

                this.closeModal('moduleManagerModal');
                this.showMessage('模块更新成功', 'success');

                // 更新界面显示
                this.updateModuleDisplay(moduleId);
            }
        } catch (error) {
            this.showMessage('模块更新失败', 'error');
        }
    }

    // 删除模块
    async deleteModule(moduleId) {
        if (!confirm('确定要删除这个模块吗？删除后无法恢复！')) {
            return;
        }

        try {
            const response = await this.apiCall(`/admin/modules/${moduleId}`, {
                method: 'DELETE',
            });

            if (response.success) {
                delete this.knowledgeModules[moduleId];
                this.closeModal('moduleManagerModal');
                this.showMessage('模块删除成功', 'success');

                // 移除标签页
                const tab = document.querySelector(`[data-target="${moduleId}"]`);
                if (tab) {
                    tab.remove();
                }

                // 移除模块内容
                const module = document.getElementById(moduleId);
                if (module) {
                    module.remove();
                }

                // 切换到第一个模块
                this.showModule('basic');
            }
        } catch (error) {
            this.showMessage('模块删除失败', 'error');
        }
    }

    // 更新模块显示
    updateModuleDisplay(moduleId) {
        const module = this.knowledgeModules[moduleId];
        if (!module) {return;}

        // 更新标签页
        const tab = document.querySelector(`[data-target="${moduleId}"]`);
        if (tab) {
            tab.innerHTML = `<i class="${module.icon}"></i> ${module.name}`;
        }

        // 更新模块标题
        const moduleHeader = document.querySelector(`#${moduleId} .module-header h2`);
        if (moduleHeader) {
            moduleHeader.innerHTML = `<i class="${module.icon}"></i> ${module.name}`;
        }
    }

    // 显示知识内容导入
    showKnowledgeImport() {
        const modalHtml = `
            <div class="modal" id="knowledgeImportModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-upload"></i> 知识内容导入</h3>
                        <span class="close" onclick="app.closeModal('knowledgeImportModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="import-zone" id="importZone" ondrop="app.handleDrop(event)" ondragover="app.handleDragOver(event)" ondragleave="app.handleDragLeave(event)">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <h4>拖拽文件到此处或点击选择文件</h4>
                            <p>支持 JSON, CSV, Excel 格式</p>
                            <input type="file" id="fileInput" multiple accept=".json,.csv,.xlsx,.xls" style="display:none;" onchange="app.handleFileSelect(event)">
                            <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                                选择文件
                            </button>
                        </div>
                        <div class="import-options">
                            <h4>导入选项</h4>
                            <label>
                                <input type="checkbox" id="autoPublish" checked>
                                自动发布新内容
                            </label>
                            <label>
                                <input type="checkbox" id="updateExisting" checked>
                                更新已存在的内容
                            </label>
                            <label>
                                <input type="checkbox" id="sendNotification" checked>
                                发送更新通知
                            </label>
                        </div>
                        <div id="importPreview" class="import-preview" style="display:none;">
                            <h4>导入预览</h4>
                            <div id="previewContent"></div>
                            <div class="import-actions">
                                <button class="btn btn-success" onclick="app.confirmImport()">
                                    <i class="fas fa-check"></i> 确认导入
                                </button>
                                <button class="btn btn-secondary" onclick="app.cancelImport()">
                                    <i class="fas fa-times"></i> 取消
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHtml);
    }

    // 处理文件拖拽
    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        const importZone = document.getElementById('importZone');
        if (importZone) {
            importZone.classList.remove('drag-over');
        }

        const files = event.dataTransfer.files;
        this.processFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();

        const importZone = document.getElementById('importZone');
        if (importZone) {
            importZone.classList.add('drag-over');
        }
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();

        const importZone = document.getElementById('importZone');
        if (importZone) {
            importZone.classList.remove('drag-over');
        }
    }

    // 处理文件选择
    handleFileSelect(event) {
        const files = event.target.files;
        this.processFiles(files);
    }

    // 处理文件
    async processFiles(files) {
        const fileData = [];

        for (const file of files) {
            try {
                const content = await this.readFile(file);
                const parsedData = this.parseFileContent(content, file.name);
                fileData.push(...parsedData);
            } catch (error) {
                this.showMessage(`文件 ${file.name} 处理失败: ${error.message}`, 'error');
            }
        }

        if (fileData.length > 0) {
            this.showImportPreview(fileData);
        } else {
            this.showMessage('没有找到有效的数据', 'error');
        }
    }

    // 读取文件
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // 解析文件内容
    parseFileContent(content, fileName) {
        try {
            if (fileName.endsWith('.json')) {
                return JSON.parse(content);
            } else if (fileName.endsWith('.csv')) {
                return this.parseCSV(content);
            } else {
                throw new Error('不支持的文件格式');
            }
        } catch (error) {
            throw new Error('文件解析失败');
        }
    }

    // 解析CSV
    parseCSV(content) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') {continue;}

            const values = lines[i].split(',').map(v => v.trim());
            const item = {};

            headers.forEach((header, index) => {
                item[header] = values[index] || '';
            });

            data.push(item);
        }

        return data;
    }

    // 显示导入预览
    showImportPreview(data) {
        const previewContent = document.getElementById('previewContent');
        if (!previewContent) {return;}

        const previewHtml = `
            <p><strong>准备导入 ${data.length} 条数据</strong></p>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                ${data
                    .slice(0, 5)
                    .map(
                        (item, index) => `
                    <div style="padding: 5px; border-bottom: 1px solid #eee;">
                        <strong>${index + 1}.</strong> ${item.title || item.name || '未知标题'}
                        ${item.category ? `- ${item.category}` : ''}
                    </div>
                `
                    )
                    .join('')}
                ${data.length > 5 ? `<p>...还有 ${data.length - 5} 条数据</p>` : ''}
            </div>
        `;

        previewContent.innerHTML = previewHtml;

        const previewSection = document.getElementById('importPreview');
        if (previewSection) {
            previewSection.style.display = 'block';
        }

        // 保存数据供后续使用
        this.pendingImportData = data;
    }

    // 确认导入
    async confirmImport() {
        if (!this.pendingImportData || this.pendingImportData.length === 0) {
            this.showMessage('没有可导入的数据', 'error');
            return;
        }

        const autoPublish = document.getElementById('autoPublish')?.checked || false;
        const updateExisting = document.getElementById('updateExisting')?.checked || false;
        const sendNotification = document.getElementById('sendNotification')?.checked || false;

        try {
            const response = await this.apiCall('/admin/import', {
                method: 'POST',
                body: JSON.stringify({
                    data: this.pendingImportData,
                    autoPublish,
                    updateExisting,
                    sendNotification,
                }),
            });

            if (response.success) {
                this.closeModal('knowledgeImportModal');
                this.showMessage(response.message, 'success');

                // 刷新当前模块数据
                this.loadModuleData(this.currentModule);

                // 清空待导入数据
                this.pendingImportData = null;
            }
        } catch (error) {
            this.showMessage(`导入失败: ${  error.message}`, 'error');
        }
    }

    // 取消导入
    cancelImport() {
        this.pendingImportData = null;
        const previewSection = document.getElementById('importPreview');
        if (previewSection) {
            previewSection.style.display = 'none';
        }
    }

    // 显示模态框
    showModal(html) {
        const container = document.getElementById('modalContainer');
        if (container) {
            container.innerHTML = html;
            container.style.display = 'block';
        }
    }

    // 关闭模态框
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }

        // 如果模态框容器为空，隐藏容器
        const container = document.getElementById('modalContainer');
        if (container && container.children.length === 0) {
            container.style.display = 'none';
        }
    }

    // ===== 功能扩展系统 =====

    // 初始化培训评估模块
    initTrainingEvaluation() {
        if (window.TrainingEvaluationModule) {
            try {
                this.evaluationModule = new TrainingEvaluationModule(
                    window.memoryManager,
                    window.componentLoader
                );
                console.log('📊 培训评估模块已加载');
            } catch (error) {
                console.error('培训评估模块初始化失败:', error);
            }
        } else {
            console.warn('TrainingEvaluationModule 未找到');
        }
    }

    // 初始化VR模拟器
    initVRSimulator() {
        if (window.VRWellLoggingSimulator) {
            this.vrSimulator = new VRWellLoggingSimulator(window.memoryManager);
            console.log('🥽 VR模拟器已加载');
        }
    }

    // 初始化知识库交互模块
    initKnowledgeInteraction() {
        if (window.KnowledgeInteractionModule) {
            this.interactionModule = new KnowledgeInteractionModule(this.apiBase, this.token);
            console.log('💾 知识库交互模块已加载');
        }
    }

    // 初始化知识库筛选状态
    initKnowledgeFilter() {
        this.currentKnowledgeFilter = {
            currentCategory: 'all',
            currentSubcategory: null,
            searchKeyword: '',
            viewMode: 'card',
            sortBy: 'createdAt',
            difficulty: null,
        };
    }

    // 初始化扩展系统
    initExtensionSystem() {
        this.extensions = new Map();
        this.hooks = {
            beforeModuleLoad: [],
            afterModuleLoad: [],
            beforeLearning: [],
            afterLearning: [],
            beforeLogin: [],
            afterLogin: [],
        };

        // 扩展API
        this.extensionAPI = {
            registerModule: this.registerModule.bind(this),
            registerHook: this.registerHook.bind(this),
            addKnowledgeContent: this.addKnowledgeContent.bind(this),
            createCustomTab: this.createCustomTab.bind(this),
            addMenuItem: this.addMenuItem.bind(this),
            showMessage: this.showMessage.bind(this),
            currentUser: () => this.currentUser,
            isAdmin: () => this.isAdmin,
        };

        // 暴露API给全局（供插件使用）
        window.WellLoggingAppAPI = this.extensionAPI;
    }

    // 注册扩展模块
    registerModule(moduleConfig) {
        const { id, name, icon, description, content } = moduleConfig;

        // 添加到知识模块配置
        this.knowledgeModules[id] = {
            id,
            name,
            icon,
            description,
            customModule: true,
            content: content || [],
        };

        // 创建标签页
        this.createTab(id, name, icon);

        // 创建模块内容区域
        this.createModuleContent(id, moduleConfig);

        console.log(`注册自定义模块: ${name}`);
        return true;
    }

    // 注册钩子
    registerHook(hookName, callback) {
        if (this.hooks[hookName]) {
            this.hooks[hookName].push(callback);
            return true;
        }
        return false;
    }

    // 执行钩子
    executeHook(hookName, data) {
        if (this.hooks[hookName]) {
            this.hooks[hookName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`钩子执行错误 (${hookName}):`, error);
                }
            });
        }
    }

    // 添加知识内容
    addKnowledgeContent(moduleId, content) {
        if (!this.knowledgeModules[moduleId]) {
            return false;
        }

        if (!this.knowledgeModules[moduleId].content) {
            this.knowledgeModules[moduleId].content = [];
        }

        this.knowledgeModules[moduleId].content.push(content);

        // 如果当前在该模块，刷新显示
        if (this.currentModule === moduleId) {
            this.refreshModuleContent(moduleId);
        }

        return true;
    }

    // 创建自定义标签页
    createTab(id, name, icon) {
        const tabsContainer = document.querySelector('.tabs');
        if (!tabsContainer) {return;}

        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.setAttribute('data-target', id);
        tab.innerHTML = `<i class="${icon}"></i> ${name}`;
        tab.addEventListener('click', () => this.showModule(id));

        tabsContainer.appendChild(tab);
    }

    // 创建模块内容区域
    createModuleContent(id, config) {
        const container = document.querySelector('.container');
        if (!container) {return;}

        const module = document.createElement('div');
        module.className = 'module';
        module.id = id;

        module.innerHTML = `
            <div class="module-header">
                <h2><i class="${config.icon}"></i> ${config.name}</h2>
                <div class="module-actions">
                    ${
                        this.isAdmin
                            ? `
                        <button class="admin-btn" onclick="app.showModuleManager('${id}')">
                            <i class="fas fa-edit"></i> 管理模块
                        </button>
                    `
                            : ''
                    }
                </div>
            </div>
            <div class="module-content" id="${id}-content">
                ${config.content ? this.renderKnowledgeContent(config.content) : '<p>模块内容正在建设中...</p>'}
            </div>
            <div class="controls">
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="app.showMessage('功能开发中...', 'info')">
                        <i class="fas fa-play-circle"></i> 开始学习
                    </button>
                </div>
                <div class="progress-container">
                    <div class="progress-text">
                        <span>学习进度</span>
                        <span>0%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:0%"></div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(module);
    }

    // 渲染知识内容
    renderKnowledgeContent(content) {
        if (!Array.isArray(content) || content.length === 0) {
            return '<p>暂无内容</p>';
        }

        return content
            .map(
                item => `
            <div class="knowledge-card">
                <h3><i class="${item.icon || 'fas fa-book'}"></i> ${item.title}</h3>
                <p>${item.description}</p>
                <div class="card-actions">
                    <button class="btn-small" onclick="app.startLearning('${item.moduleId || 'custom'}', '${item.id}')">
                        <i class="fas fa-play"></i> 学习
                    </button>
                    <button class="btn-small" onclick="app.bookmarkContent('${item.moduleId || 'custom'}', '${item.id}')">
                        <i class="fas fa-bookmark"></i> 收藏
                    </button>
                    <button class="btn-small" onclick="app.shareContent('${item.moduleId || 'custom'}', '${item.id}')">
                        <i class="fas fa-share"></i> 分享
                    </button>
                </div>
            </div>
        `
            )
            .join('');
    }

    // 添加菜单项
    addMenuItem(menuConfig) {
        const { id, label, icon, action, position = 'user' } = menuConfig;

        if (position === 'user') {
            const userMenuItems = document.querySelector('.user-menu-items');
            if (userMenuItems) {
                const menuItem = document.createElement('button');
                menuItem.className = 'menu-item';
                menuItem.innerHTML = `<i class="${icon}"></i> ${label}`;
                menuItem.onclick = action;

                userMenuItems.appendChild(menuItem);
            }
        }
    }

    // 加载用户扩展
    loadUserExtensions() {
        // 这里可以加载用户定义的扩展
        // 从localStorage或服务器加载扩展配置
        try {
            const extensions = localStorage.getItem('userExtensions');
            if (extensions) {
                const extensionList = JSON.parse(extensions);
                extensionList.forEach(ext => {
                    this.loadExtension(ext);
                });
            }
        } catch (error) {
            console.error('加载用户扩展失败:', error);
        }
    }

    // 加载扩展
    loadExtension(extensionConfig) {
        try {
            if (typeof extensionConfig === 'string') {
                // 如果是URL，动态加载脚本
                this.loadExtensionScript(extensionConfig);
            } else if (typeof extensionConfig === 'object') {
                // 如果是配置对象，直接注册
                this.registerModule(extensionConfig);
            }
        } catch (error) {
            console.error('扩展加载失败:', error);
        }
    }

    // 动态加载扩展脚本
    loadExtensionScript(url) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            console.log(`扩展脚本加载成功: ${url}`);
        };
        script.onerror = () => {
            console.error(`扩展脚本加载失败: ${url}`);
        };
        document.head.appendChild(script);
    }

    // 刷新模块内容
    refreshModuleContent(moduleId) {
        const contentContainer = document.getElementById(`${moduleId}-content`);
        if (contentContainer) {
            const module = this.knowledgeModules[moduleId];
            contentContainer.innerHTML = module.content
                ? this.renderKnowledgeContent(module.content)
                : '<p>暂无内容</p>';
        }
    }

    // 保存用户扩展配置
    saveUserExtensions() {
        try {
            const customModules = Object.values(this.knowledgeModules)
                .filter(module => module.customModule)
                .map(module => ({
                    id: module.id,
                    name: module.name,
                    icon: module.icon,
                    description: module.description,
                    content: module.content,
                }));

            localStorage.setItem('userExtensions', JSON.stringify(customModules));
        } catch (error) {
            console.error('保存用户扩展失败:', error);
        }
    }

    // 初始化内存管理
    initMemoryManagement() {
        if (window.memoryManager) {
            // 添加内存观察者
            window.memoryManager.addObserver((event, data) => {
                if (event === 'memory-update') {
                    this.updateMemoryDisplay(data);
                }
            });

            // 设置懒加载
            window.memoryManager.setupLazyLoading();

            // 预加载关键组件
            if (window.componentLoader) {
                window.componentLoader.preloadComponents();
            }

            // 初始清理
            window.memoryManager.performCleanup();
        }
    }

    // 更新内存显示
    updateMemoryDisplay(memoryData) {
        const memoryInfo = document.getElementById('memoryInfo');
        if (memoryInfo && memoryData) {
            const usagePercent = ((memoryData.used / memoryData.total) * 100).toFixed(1);
            memoryInfo.innerHTML = `
                <span>内存: ${memoryData.used}MB/${memoryData.total}MB (${usagePercent}%)</span>
            `;

            // 内存使用率高时显示警告
            if (usagePercent > 80) {
                memoryInfo.style.color = 'var(--warning)';
            } else if (usagePercent > 60) {
                memoryInfo.style.color = 'var(--info)';
            } else {
                memoryInfo.style.color = 'var(--success)';
            }
        }
    }

    // 更新日期时间
    updateDateTime() {
        const now = new Date();

        // 更新日期
        const dateOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        const dateStr = now.toLocaleDateString('zh-CN', dateOptions);
        document.getElementById('currentDate').textContent = dateStr;

        // 更新时间
        const timeStr = now.toLocaleTimeString('zh-CN');
        document.getElementById('liveTime').textContent = timeStr;
    }

    // 初始化图表
    initCharts() {
        // 技能雷达图
        const ctx = document.getElementById('skillsRadar');
        if (ctx) {
            new Chart(ctx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['专业知识', '标准应用', '跨学科整合', '实践技能', '决策能力'],
                    datasets: [
                        {
                            label: '当前能力评估',
                            data: [85, 63, 72, 48, 56],
                            backgroundColor: 'rgba(52, 152, 219, 0.2)',
                            borderColor: 'rgba(41, 128, 185, 1)',
                            borderWidth: 2,
                            pointBackgroundColor: 'rgba(41, 128, 185, 1)',
                        },
                    ],
                },
                options: {
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                            grid: { color: 'rgba(0, 0, 0, 0.1)' },
                            suggestedMin: 0,
                            suggestedMax: 100,
                            ticks: { stepSize: 20, backdropColor: 'transparent' },
                        },
                    },
                    plugins: {
                        legend: { display: false },
                    },
                    maintainAspectRatio: false,
                },
            });
        }

        // 疲劳提醒（45分钟后显示）
        setTimeout(
            () => {
                const alertEl = document.getElementById('fatigueAlert');
                if (alertEl) {
                    alertEl.style.display = 'block';
                }
            },
            1000 * 60 * 45
        ); // 实际应为45分钟，此处为演示用45秒

        // 关闭提醒按钮事件
        const closeBtn = document.querySelector('#fatigueAlert .btn-primary');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('fatigueAlert').style.display = 'none';
            });
        }
    }

    // 显示模块
    showModule(targetId) {
        // 1. 切换模块内容显示
        document.querySelectorAll('.module').forEach(module => {
            module.classList.remove('active');
        });
        const targetModule = document.getElementById(targetId);
        if (targetModule) {
            targetModule.classList.add('active');
        }

        // 2. 重置所有导航项的active状态
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document
            .querySelectorAll('.submenu-list .submenu-item')
            .forEach(item => item.classList.remove('active'));

        // 3. 设置当前导航项为active
        const navItem = document.querySelector(`.nav-item[data-module="${targetId}"]`);
        const tabItem = document.querySelector(`.tab[data-target="${targetId}"]`);
        const submenuItem = document.querySelector(
            `.submenu-list .submenu-item[data-target="${targetId}"]`
        );

        if (navItem) {navItem.classList.add('active');}
        if (tabItem) {tabItem.classList.add('active');}
        if (submenuItem) {submenuItem.classList.add('active');}

        this.currentModule = targetId;

        // 隐藏默认标题
        const defaultTitle = document.getElementById('defaultModuleTitle');
        if (defaultTitle) {defaultTitle.style.display = 'none';}

        // 加载模块数据
        this.loadModuleData(targetId);
    }

    // 切换到指定模块（兼容 switchToModule 调用）
    switchToModule(targetId) {
        this.showModule(targetId);
    }

    // 展开/收起模块（兼容 toggleExpand 调用）
    toggleExpand(moduleId) {
        const submenu = document.getElementById(`submenu-${moduleId}`);
        const navItem = document.querySelector(`[data-module="${moduleId}"] .dropdown-icon`);

        if (submenu && navItem) {
            const isHidden =
                submenu.style.display === 'none' || getComputedStyle(submenu).display === 'none';
            submenu.style.display = isHidden ? 'block' : 'none';
            navItem.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }

    // 显示知识模块
    showKnowledgeModule(moduleId) {
        // 更新知识标签状态
        document.querySelectorAll('.knowledge-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-module="${moduleId}"]`)?.classList.add('active');

        this.currentKnowledgeModule = moduleId;

        // 更新模块标题
        const moduleConfig = this.knowledgeModuleConfig[moduleId];
        if (moduleConfig) {
            document.getElementById('currentModuleName').textContent = moduleConfig.name;
        }

        // 隐藏默认标题，仅在特定模块显示
        const defaultTitle = document.getElementById('defaultModuleTitle');
        if (defaultTitle) {
            defaultTitle.style.display = 'none';
        }

        // 显示/隐藏跨行业子模块
        const subModulesEl = document.getElementById('crossSubModules');
        if (moduleId === 'cross') {
            subModulesEl.style.display = 'flex';
            if (!this.currentSubModule) {
                this.showSubModule('drilling');
            }
        } else {
            subModulesEl.style.display = 'none';
            this.currentSubModule = null;
        }

        // 加载知识内容
        this.loadKnowledgeContent(moduleId);
    }

    // 显示子模块
    showSubModule(subModuleId) {
        // 更新子标签状态
        document.querySelectorAll('.sub-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-submodule="${subModuleId}"]`)?.classList.add('active');

        this.currentSubModule = subModuleId;

        // 更新标题
        const subModuleConfig = this.knowledgeModuleConfig.cross.subModules.find(
            sm => sm.id === subModuleId
        );
        if (subModuleConfig) {
            document.getElementById('currentModuleName').textContent = subModuleConfig.name;
        }

        // 加载子模块内容
        this.loadKnowledgeContent('cross', subModuleId);
    }

    // 显示管理员标签
    showAdminTab(adminTabName) {
        // 隐藏所有管理员内容
        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        // 显示目标内容
        const targetContent = document.getElementById(adminTabName);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.style.display = 'block';
        }

        // 更新标签状态
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-admin-tab="${adminTabName}"]`)?.classList.add('active');

        // 加载相应的管理数据
        this.loadAdminData(adminTabName);
    }

    // 加载模块数据
    async loadModuleData(moduleId) {
        switch (moduleId) {
            case 'basic':
            case 'instrument':
            case 'operation':
            case 'standard':
            case 'cross':
                break;
            case 'knowledge-management':
                // 初始化知识库管理模块
                if (window.KnowledgeManagementModule) {
                    if (!this.knowledgeMgmt) {
                        this.knowledgeMgmt = new KnowledgeManagementModule(this);
                    }
                    // 添加错误处理，避免阻塞导航
                    setTimeout(() => {
                        this.knowledgeMgmt.init().catch(err => {
                            console.warn('知识库管理模块初始化失败:', err.message);
                        });
                    }, 100);
                }
                break;
            case 'evaluation':
                // 重新加载评估数据
                if (this.evaluationModule) {
                    this.evaluationModule.loadEvaluationData();
                }
                break;
            case 'exam':
                break;
            case 'cases':
                break;
            case 'chat':
                break;
            default:
                console.log(`Unknown module: ${moduleId}`);
        }
    }

    // 页面切换
    showPage(pageName) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

        this.currentPage = pageName;

        // 保存用户偏好
        this.saveUserPreference('lastPage', pageName);

        // 加载页面数据
        this.loadPageData(pageName);
    }

    // 保存用户偏好
    saveUserPreference(key, value) {
        try {
            const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
            preferences[key] = value;
            localStorage.setItem('userPreferences', JSON.stringify(preferences));
        } catch (error) {
            console.log('保存用户偏好失败:', error);
        }
    }

    // 获取用户偏好
    getUserPreference(key, defaultValue = null) {
        try {
            const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
            return preferences[key] !== undefined ? preferences[key] : defaultValue;
        } catch (error) {
            console.log('获取用户偏好失败:', error);
            return defaultValue;
        }
    }

    // 加载页面数据
    async loadPageData(pageName) {
        switch (pageName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'knowledge':
                await this.loadKnowledgeData();
                break;
            case 'cases':
                await this.loadCasesData();
                break;
            case 'exam':
                await this.loadExamData();
                break;
            case 'knowledge-management':
                window.location.href = 'knowledge-review.html';
                break;
            case 'profile':
                await this.loadProfileData();
                break;
        }
    }

    // API调用方法
    async apiCall(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API调用错误:', error);
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // 认证相关方法
    checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            this.token = token;
            this.currentUser = JSON.parse(user);
            this.isAdmin = this.currentUser.role === 'admin';
            this.updateUIForAuth();
        } else {
            // 默认设置为管理员进行演示
            this.currentUser = {
                username: '管理员',
                role: 'admin',
                name: '系统管理员',
            };
            this.isAdmin = true;
            document.getElementById('userName').textContent = '管理员';
        }
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            this.token = response.token;
            this.currentUser = response.user;

            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            this.hideLoginModal();
            this.updateUIForAuth();
            this.showMessage('登录成功！', 'success');

            // 重新加载当前页面数据
            await this.loadPageData(this.currentPage);
        } catch (error) {
            this.showMessage('登录失败，请检查用户名和密码', 'error');
        }
    }

    updateUIForAuth() {
        if (this.currentUser) {
            const displayName = this.currentUser.username || this.currentUser.name || '管理员';
            document.getElementById('userName').textContent = displayName;

            // 显示管理员按钮
            if (this.isAdmin) {
                document.querySelectorAll('.admin-btn').forEach(btn => {
                    btn.style.display = 'flex';
                });
            }
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.currentUser = null;

        document.getElementById('userName').textContent = '访客';
        document.getElementById('loginBtn').textContent = '登录';
        document.getElementById('loginBtn').onclick = () => this.showLoginModal();

        this.showMessage('已退出登录', 'info');
        this.showPage('dashboard');
    }

    // 模态框方法
    showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
    }

    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('loginForm').reset();
    }

    // 消息提示方法
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;

        // 设置背景色
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db',
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(messageEl);

        // 3秒后自动移除
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    // 加载初始数据
    async loadInitialData() {
        try {
            // 检查API健康状态
            await this.apiCall('/health');
            console.log('API服务正常');

            // 添加服务状态指示器
            this.updateConnectionStatus(true);
        } catch (error) {
            console.log('API服务不可用，使用模拟数据');
            this.useMockData = true;
            this.updateConnectionStatus(false);
        }
    }

    // 加载知识模块数据
    async loadKnowledgeModules() {
        try {
            // 从API加载模块配置
            const response = await this.apiCall('/admin/modules');
            if (response.success) {
                // 合并远程模块配置和本地配置
                response.modules.forEach(module => {
                    if (this.knowledgeModuleConfig[module.id]) {
                        this.knowledgeModuleConfig[module.id] = {
                            ...this.knowledgeModuleConfig[module.id],
                            ...module,
                        };
                    } else {
                        this.knowledgeModuleConfig[module.id] = module;
                    }
                });
            }
        } catch (error) {
            console.log('使用默认模块配置');
        }

        // 初始化知识模块数据
        for (const [key, config] of Object.entries(this.knowledgeModuleConfig)) {
            this.knowledgeModules[key] = {
                ...config,
                count: 0,
                items: [],
            };
        }

        // 更新模块计数显示
        this.updateModuleCounts();
    }

    updateModuleCounts() {
        Object.keys(this.knowledgeModules).forEach(moduleId => {
            const countEl = document.querySelector(`[data-module="${moduleId}"] .count`);
            if (countEl) {
                countEl.textContent = this.knowledgeModules[moduleId].count;
            }
        });
    }

    // 加载知识内容（优化版）
    async loadKnowledgeContent(moduleId, subModuleId = null) {
        const cacheKey = `knowledge:${moduleId}:${subModuleId || 'default'}`;

        // 尝试从缓存获取
        const knowledgeData = window.memoryManager?.getCache(cacheKey);
        if (knowledgeData) {
            this.knowledgeModules[moduleId].items = knowledgeData;
            this.knowledgeModules[moduleId].count = knowledgeData.length;
            this.renderKnowledgeListOptimized(knowledgeData);
            this.updateModuleCounts();
            return;
        }

        try {
            let endpoint = `/knowledge?module=${moduleId}`;
            if (subModuleId) {
                endpoint += `&submodule=${subModuleId}`;
            }

            const response = await this.apiCall(endpoint);
            if (response.success) {
                const data = response.knowledge || [];
                this.knowledgeModules[moduleId].items = data;
                this.knowledgeModules[moduleId].count = data.length;

                // 缓存数据
                window.memoryManager?.setCache(cacheKey, data, 300000); // 5分钟缓存

                // 使用优化的渲染方法
                this.renderKnowledgeListOptimized(data);
                this.updateModuleCounts();
            }
        } catch (error) {
            // 使用模拟数据
            this.loadMockKnowledgeContent(moduleId, subModuleId);
        }
    }

    // 优化的知识列表渲染
    renderKnowledgeListOptimized(data) {
        if (!data || data.length === 0) {
            this.showEmptyState();
            return;
        }

        // 如果数据量大，使用虚拟滚动
        if (data.length > 50) {
            this.renderVirtualKnowledgeList(data);
        } else {
            this.renderStaticKnowledgeList(data);
        }
    }

    // 虚拟滚动知识列表
    renderVirtualKnowledgeList(data) {
        const container = document.querySelector('.module-content');
        if (!container) {return;}

        // 创建虚拟滚动容器
        const virtualListId = 'knowledge-virtual-list';
        let virtualContainer = document.getElementById(virtualListId);

        if (!virtualContainer) {
            virtualContainer = document.createElement('div');
            virtualContainer.id = virtualListId;
            virtualContainer.className = 'knowledge-virtual-list';
            container.innerHTML = '';
            container.appendChild(virtualContainer);
        }

        // 使用组件加载器创建虚拟列表
        if (window.componentLoader) {
            window.componentLoader.createVirtualList(virtualListId, data, (item, index) =>
                this.createKnowledgeCardOptimized(item, index)
            );
        } else {
            // 降级到静态渲染
            this.renderStaticKnowledgeList(data);
        }
    }

    // 静态知识列表
    renderStaticKnowledgeList(data) {
        const container = document.querySelector('.module-content');
        if (!container) {return;}

        // 使用文档片段优化DOM操作
        const fragment = document.createDocumentFragment();

        data.forEach((item, index) => {
            const card = this.createKnowledgeCardOptimized(item, index);
            fragment.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    // 优化的知识卡片创建
    createKnowledgeCardOptimized(item, index) {
        // 使用组件加载器创建卡片
        if (window.componentLoader) {
            return window.componentLoader
                .createKnowledgeCard(item)
                .then(card => card)
                .catch(() => this.createFallbackCard(item, index));
        } else {
            return this.createFallbackCard(item, index);
        }
    }

    // 降级卡片创建
    createFallbackCard(item, index) {
        const card = document.createElement('div');
        card.className = 'knowledge-card';
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            <h3><i class="${item.icon || 'fas fa-book'}"></i> ${item.title}</h3>
            <p>${item.description || item.content}</p>
            <div class="card-actions">
                <button class="btn-small" onclick="app.startLearning('${item.moduleId || 'basic'}', '${item.id}')">
                    <i class="fas fa-play"></i> 学习
                </button>
                <button class="btn-small" onclick="app.bookmarkContent('${item.moduleId || 'basic'}', '${item.id}')">
                    <i class="fas fa-bookmark"></i> 收藏
                </button>
            </div>
        `;

        return card;
    }

    // 显示空状态
    showEmptyState() {
        const container = document.querySelector('.module-content');
        if (!container) {return;}

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>暂无内容</h3>
                <p>该模块暂时还没有学习内容</p>
            </div>
        `;
    }

    loadMockKnowledgeContent(moduleId, subModuleId = null) {
        const mockData = this.getMockKnowledgeData(moduleId, subModuleId);
        this.knowledgeModules[moduleId].items = mockData;
        this.knowledgeModules[moduleId].count = mockData.length;
        this.renderKnowledgeList(mockData);
        this.updateModuleCounts();
    }

    getMockKnowledgeData(moduleId, subModuleId) {
        const baseKnowledge = [
            {
                id: 1,
                title: '测井基础原理',
                content: '测井是通过电缆将测量仪器下入井筒，测量地层物理参数的技术...',
                difficulty: 'beginner',
                readingTime: 15,
                tags: ['基础理论'],
                hasQuiz: true,
            },
            {
                id: 2,
                title: '电阻率测井方法',
                content: '电阻率测井是测量地层电阻率的重要方法，广泛应用于油气识别...',
                difficulty: 'intermediate',
                readingTime: 20,
                tags: ['电法测井'],
                hasQuiz: true,
            },
        ];

        switch (moduleId) {
            case 'basic':
                return baseKnowledge;
            case 'instrument':
                return [
                    {
                        id: 3,
                        title: '自然伽马测井仪',
                        content: '自然伽马测井仪是测量地层自然放射性的设备...',
                        difficulty: 'intermediate',
                        readingTime: 25,
                        tags: ['仪器原理'],
                        hasQuiz: true,
                    },
                ];
            case 'operation':
                return [
                    {
                        id: 4,
                        title: '测井现场作业安全规范',
                        content: '测井现场作业必须严格遵守安全规范，确保人员和设备安全...',
                        difficulty: 'advanced',
                        readingTime: 30,
                        tags: ['安全规范'],
                        hasQuiz: true,
                    },
                ];
            case 'standard':
                return [
                    {
                        id: 5,
                        title: '仪器与刻度标准',
                        content: '测井仪器刻度标准是保证测量数据准确性的重要技术规范...',
                        difficulty: 'advanced',
                        readingTime: 35,
                        tags: ['行业标准'],
                        hasQuiz: true,
                    },
                ];
            case 'cross':
                if (subModuleId === 'drilling') {
                    return [
                        {
                            id: 6,
                            title: '钻井参数与测井解释',
                            content: '钻井参数对测井数据质量有重要影响，需要综合考虑...',
                            difficulty: 'intermediate',
                            readingTime: 25,
                            tags: ['钻井-测井'],
                            hasQuiz: true,
                        },
                    ];
                } else if (subModuleId === 'geology') {
                    return [
                        {
                            id: 7,
                            title: '地质参数与测井响应',
                            content: '地质特征决定了测井响应的基本模式...',
                            difficulty: 'intermediate',
                            readingTime: 28,
                            tags: ['地质-测井'],
                            hasQuiz: true,
                        },
                    ];
                } else if (subModuleId === 'geophysics') {
                    return [
                        {
                            id: 8,
                            title: '物探与测井数据整合',
                            content: '物探数据和测井数据的整合可以提高解释精度...',
                            difficulty: 'advanced',
                            readingTime: 32,
                            tags: ['物探-测井'],
                            hasQuiz: true,
                        },
                    ];
                }
                break;
            default:
                return [];
        }
        return [];
    }

    // 渲染知识列表
    renderKnowledgeList(knowledge) {
        const container = document.getElementById('knowledgeList');
        if (!container) {return;}

        if (!knowledge || knowledge.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>暂无知识内容</h3>
                    <p>该模块正在建设中，敬请期待</p>
                </div>
            `;
            return;
        }

        container.innerHTML = knowledge
            .map(
                item => `
            <div class="knowledge-card" onclick="app.viewKnowledgeDetail('${item.id}')">
                <h4>
                    ${item.title}
                    <span class="difficulty">${this.getDifficultyText(item.difficulty)}</span>
                </h4>
                <p>${item.content.substring(0, 100)}...</p>
                <div class="knowledge-meta">
                    <span><i class="fas fa-clock"></i> ${item.readingTime || 15}分钟</span>
                    <span><i class="fas fa-tag"></i> ${item.tags?.join(', ') || '未分类'}</span>
                    ${item.hasQuiz ? '<span><i class="fas fa-question-circle"></i> 有测验</span>' : ''}
                </div>
                <div class="knowledge-actions-mini">
                    <button onclick="event.stopPropagation(); app.toggleKnowledgeFavorite('${item.id}')">
                        <i class="far fa-heart"></i>
                    </button>
                    <button onclick="event.stopPropagation(); app.shareKnowledge('${item.id}')">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </div>
        `
            )
            .join('');
    }

    // 渲染增强版知识库管理界面（带分类树、搜索、筛选）
    renderEnhancedKnowledgeList(knowledge, options = {}) {
        const {
            currentCategory = 'all',
            currentSubcategory = null,
            searchKeyword = '',
            viewMode = 'card', // 'card' or 'list'
            sortBy = 'createdAt',
            difficulty = null,
        } = options;

        const container = document.getElementById('knowledgeList');
        if (!container) {return;}

        // 分类配置
        const categories = [
            { id: 'all', name: '全部', icon: 'fa-th', count: knowledge.length },
            { id: 'basic', name: '基础知识', icon: 'fa-book', count: 0 },
            { id: 'standard', name: '标准规范', icon: 'fa-ruler-combined', count: 0 },
            { id: 'cross', name: '跨学科', icon: 'fa-project-diagram', count: 0 },
            { id: 'equipment', name: '仪器设备', icon: 'fa-microchip', count: 0 },
            { id: 'operation', name: '现场作业', icon: 'fa-hard-hat', count: 0 },
        ];

        // 统计各分类数量
        const categoryCount = {};
        knowledge.forEach(item => {
            const cat = item.category || 'basic';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        categories.forEach(cat => {
            if (cat.id !== 'all') {cat.count = categoryCount[cat.id] || 0;}
        });

        // 过滤数据
        let filteredKnowledge = [...knowledge];
        if (currentCategory !== 'all') {
            filteredKnowledge = filteredKnowledge.filter(k => k.category === currentCategory);
        }
        if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase();
            filteredKnowledge = filteredKnowledge.filter(
                k =>
                    k.title?.toLowerCase().includes(keyword) ||
                    k.content?.toLowerCase().includes(keyword) ||
                    k.tags?.some(t => t.toLowerCase().includes(keyword))
            );
        }
        if (difficulty) {
            filteredKnowledge = filteredKnowledge.filter(k => k.difficulty === difficulty);
        }

        // 排序
        filteredKnowledge.sort((a, b) => {
            switch (sortBy) {
                case 'viewCount':
                    return (b.viewCount || 0) - (a.viewCount || 0);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'readingTime':
                    return (a.readingTime || 0) - (b.readingTime || 0);
                default:
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            }
        });

        // 构建HTML
        container.innerHTML = `
            <div class="enhanced-knowledge-container">
                <!-- 面包屑导航 -->
                <div class="breadcrumb">
                    <span onclick="app.navigateToKnowledge('all')">知识库</span>
                    ${currentCategory !== 'all' ? `<span>/ ${this.getCategoryName(currentCategory)}</span>` : ''}
                    ${searchKeyword ? `<span>/ 搜索: "${searchKeyword}"</span>` : ''}
                </div>

                <div class="knowledge-layout">
                    <!-- 左侧分类树 -->
                    <aside class="category-sidebar">
                        <h3><i class="fas fa-filter"></i> 分类筛选</h3>
                        <ul class="category-tree">
                            ${categories
                                .map(
                                    cat => `
                                <li class="${currentCategory === cat.id ? 'active' : ''}" 
                                    onclick="app.filterByCategory('${cat.id}')">
                                    <i class="fas ${cat.icon}"></i>
                                    <span>${cat.name}</span>
                                    <span class="count">${cat.count}</span>
                                </li>
                            `
                                )
                                .join('')}
                        </ul>

                        <!-- 难度筛选 -->
                        <div class="filter-section">
                            <h4>难度等级</h4>
                            <div class="filter-options">
                                ${['beginner', 'intermediate', 'advanced']
                                    .map(
                                        diff => `
                                    <label class="filter-option ${difficulty === diff ? 'active' : ''}">
                                        <input type="radio" name="difficulty" value="${diff}"
                                            ${difficulty === diff ? 'checked' : ''}
                                            onchange="app.filterByDifficulty('${diff}')">
                                        <span>${this.getDifficultyText(diff)}</span>
                                    </label>
                                `
                                    )
                                    .join('')}
                                <label class="filter-option ${!difficulty ? 'active' : ''}">
                                    <input type="radio" name="difficulty" value=""
                                        ${!difficulty ? 'checked' : ''}
                                        onchange="app.filterByDifficulty(null)">
                                    <span>全部</span>
                                </label>
                            </div>
                        </div>

                        <!-- 热门标签 -->
                        <div class="filter-section">
                            <h4>热门标签</h4>
                            <div class="tag-cloud">
                                ${this.getPopularTags(knowledge)
                                    .map(
                                        tag => `
                                    <span class="tag" onclick="app.searchByTag('${tag}')">${tag}</span>
                                `
                                    )
                                    .join('')}
                            </div>
                        </div>
                    </aside>

                    <!-- 右侧内容区 -->
                    <main class="knowledge-content">
                        <!-- 顶部工具栏 -->
                        <div class="knowledge-toolbar">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" 
                                    placeholder="搜索知识标题、内容、标签..." 
                                    value="${searchKeyword}"
                                    onkeyup="app.handleSearchKeyup(event)">
                                <button class="search-btn" onclick="app.searchKnowledge()">搜索</button>
                                ${searchKeyword ? `<button class="clear-btn" onclick="app.clearSearch()"><i class="fas fa-times"></i></button>` : ''}
                            </div>

                            <div class="toolbar-actions">
                                <!-- 排序 -->
                                <select class="sort-select" onchange="app.changeSort(this.value)">
                                    <option value="createdAt" ${sortBy === 'createdAt' ? 'selected' : ''}>最新发布</option>
                                    <option value="viewCount" ${sortBy === 'viewCount' ? 'selected' : ''}>最多浏览</option>
                                    <option value="title" ${sortBy === 'title' ? 'selected' : ''}>标题排序</option>
                                    <option value="readingTime" ${sortBy === 'readingTime' ? 'selected' : ''}>阅读时长</option>
                                </select>

                                <!-- 视图切换 -->
                                <div class="view-toggle">
                                    <button class="${viewMode === 'card' ? 'active' : ''}" 
                                        onclick="app.switchViewMode('card')" title="卡片视图">
                                        <i class="fas fa-th-large"></i>
                                    </button>
                                    <button class="${viewMode === 'list' ? 'active' : ''}" 
                                        onclick="app.switchViewMode('list')" title="列表视图">
                                        <i class="fas fa-list"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 结果统计 -->
                        <div class="result-info">
                            <span>共找到 <strong>${filteredKnowledge.length}</strong> 条知识</span>
                        </div>

                        <!-- 知识列表 -->
                        <div class="knowledge-${viewMode}-view">
                            ${
                                filteredKnowledge.length === 0
                                    ? `
                                <div class="empty-state">
                                    <i class="fas fa-search"></i>
                                    <h3>未找到相关知识</h3>
                                    <p>试试其他关键词或调整筛选条件</p>
                                </div>
                            `
                                    : filteredKnowledge
                                          .map((item, index) =>
                                              this.createEnhancedKnowledgeCard(
                                                  item,
                                                  index,
                                                  viewMode
                                              )
                                          )
                                          .join('')
                            }
                        </div>
                    </main>
                </div>
            </div>
        `;
    }

    // 创建增强版知识卡片
    createEnhancedKnowledgeCard(item, index, viewMode) {
        const difficultyClass = {
            beginner: 'difficulty-beginner',
            intermediate: 'difficulty-intermediate',
            advanced: 'difficulty-advanced',
        };

        const difficultyText = {
            beginner: '入门',
            intermediate: '进阶',
            advanced: '高级',
        };

        const displayRating = item.averageRating
            ? `<span class="rating"><i class="fas fa-star"></i> ${item.averageRating.toFixed(1)}</span>`
            : '';

        if (viewMode === 'list') {
            return `
                <div class="knowledge-list-item" onclick="app.viewKnowledgeDetail('${item.id}')" 
                     style="animation-delay: ${index * 0.05}s">
                    <div class="list-icon">
                        <i class="fas ${this.getCategoryIcon(item.category)}"></i>
                    </div>
                    <div class="list-content">
                        <div class="list-header">
                            <h3>${item.title}</h3>
                            <div class="list-meta">
                                <span class="category-tag">${this.getCategoryName(item.category)}</span>
                                <span class="difficulty-tag ${difficultyClass[item.difficulty]}">${difficultyText[item.difficulty] || '进阶'}</span>
                                ${displayRating}
                            </div>
                        </div>
                        <p class="description">${item.content?.substring(0, 150)}${item.content?.length > 150 ? '...' : ''}</p>
                        <div class="list-footer">
                            <div class="card-tags">
                                ${(item.tags || [])
                                    .slice(0, 4)
                                    .map(tag => `<span class="tag">${tag}</span>`)
                                    .join('')}
                            </div>
                            <div class="list-stats">
                                <span><i class="fas fa-eye"></i> ${item.viewCount || 0}</span>
                                <span><i class="fas fa-clock"></i> ${item.readingTime || 10}分钟</span>
                            </div>
                        </div>
                    </div>
                    <div class="list-actions">
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); app.startLearning('${item.category}', '${item.id}')">
                            <i class="fas fa-play"></i> 学习
                        </button>
                    </div>
                </div>
            `;
        }

        // 卡片视图
        return `
            <div class="knowledge-card ${difficultyClass[item.difficulty]}" 
                 onclick="app.viewKnowledgeDetail('${item.id}')"
                 style="animation-delay: ${index * 0.05}s">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas ${this.getCategoryIcon(item.category)}"></i>
                    </div>
                    <div class="card-title-wrap">
                        <h3>${item.title}</h3>
                        <div class="card-meta">
                            <span class="category-tag">${this.getCategoryName(item.category)}</span>
                            <span class="difficulty-tag ${difficultyClass[item.difficulty]}">${difficultyText[item.difficulty] || '进阶'}</span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <p class="description">${item.content?.substring(0, 100)}${item.content?.length > 100 ? '...' : ''}</p>
                    ${
                        (item.tags || []).length > 0
                            ? `
                        <div class="card-tags">
                            ${item.tags
                                .slice(0, 3)
                                .map(tag => `<span class="tag">${tag}</span>`)
                                .join('')}
                            ${item.tags.length > 3 ? `<span class="tag tag-more">+${item.tags.length - 3}</span>` : ''}
                        </div>
                    `
                            : ''
                    }
                </div>
                <div class="card-stats">
                    <span><i class="fas fa-eye"></i> ${item.viewCount || 0}</span>
                    ${displayRating}
                    <span><i class="fas fa-clock"></i> ${item.readingTime || 10}分钟</span>
                </div>
                <div class="card-actions">
                    <button class="btn-small btn-primary" onclick="event.stopPropagation(); app.startLearning('${item.category}', '${item.id}')">
                        <i class="fas fa-play"></i> 开始学习
                    </button>
                    <button class="btn-small btn-outline" onclick="event.stopPropagation(); app.toggleFavorite('${item.id}')">
                        <i class="far fa-heart"></i> 收藏
                    </button>
                </div>
            </div>
        `;
    }

    // 获取分类图标
    getCategoryIcon(category) {
        const icons = {
            basic: 'fa-book',
            standard: 'fa-ruler-combined',
            cross: 'fa-project-diagram',
            equipment: 'fa-microchip',
            operation: 'fa-hard-hat',
        };
        return icons[category] || 'fa-book';
    }

    // 获取分类名称
    getCategoryName(category) {
        const names = {
            basic: '基础知识',
            standard: '标准规范',
            cross: '跨学科',
            equipment: '仪器设备',
            operation: '现场作业',
        };
        return names[category] || '未分类';
    }

    // 获取热门标签
    getPopularTags(knowledge) {
        const tagCount = {};
        knowledge.forEach(item => {
            (item.tags || []).forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });
        return Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag]) => tag);
    }

    // 筛选分类
    filterByCategory(categoryId) {
        this.currentKnowledgeFilter = {
            ...this.currentKnowledgeFilter,
            currentCategory: categoryId,
            currentSubcategory: null,
        };
        this.loadEnhancedKnowledgeList();
    }

    // 筛选难度
    filterByDifficulty(difficulty) {
        this.currentKnowledgeFilter = {
            ...this.currentKnowledgeFilter,
            difficulty,
        };
        this.loadEnhancedKnowledgeList();
    }

    // 搜索
    searchKnowledge() {
        const input = document.querySelector('.search-box input');
        if (input) {
            this.currentKnowledgeFilter = {
                ...this.currentKnowledgeFilter,
                searchKeyword: input.value.trim(),
            };
            this.loadEnhancedKnowledgeList();
        }
    }

    // 搜索框按键处理
    handleSearchKeyup(event) {
        if (event.key === 'Enter') {
            this.searchKnowledge();
        }
    }

    // 按标签搜索
    searchByTag(tag) {
        this.currentKnowledgeFilter = {
            ...this.currentKnowledgeFilter,
            searchKeyword: tag,
        };
        this.loadEnhancedKnowledgeList();
    }

    // 清除搜索
    clearSearch() {
        this.currentKnowledgeFilter = {
            ...this.currentKnowledgeFilter,
            searchKeyword: '',
        };
        this.loadEnhancedKnowledgeList();
    }

    // 切换排序
    changeSort(sortBy) {
        this.currentKnowledgeFilter = {
            ...this.currentKnowledgeFilter,
            sortBy,
        };
        this.loadEnhancedKnowledgeList();
    }

    // 切换视图模式
    switchViewMode(viewMode) {
        this.currentKnowledgeFilter = {
            ...this.currentKnowledgeFilter,
            viewMode,
        };
        this.loadEnhancedKnowledgeList();
    }

    // 导航到知识
    navigateToKnowledge(category) {
        this.filterByCategory(category);
    }

    // 加载增强版知识列表
    async loadEnhancedKnowledgeList() {
        try {
            const filter = { isPublished: true };
            if (this.currentKnowledgeFilter?.currentCategory !== 'all') {
                filter.category = this.currentKnowledgeFilter.currentCategory;
            }

            const response = await fetch(
                `${this.apiBase}/knowledge?${new URLSearchParams(filter)}`
            );
            if (response.ok) {
                const data = await response.json();
                this.renderEnhancedKnowledgeList(data.knowledge, this.currentKnowledgeFilter || {});
            }
        } catch (error) {
            console.error('加载知识列表失败:', error);
        }
    }

    // 收藏知识
    async toggleFavorite(knowledgeId) {
        if (this.interactionModule) {
            const isFavorite = await this.interactionModule.getFavoriteStatus(knowledgeId);
            if (isFavorite) {
                await this.interactionModule.unfavorite(knowledgeId);
            } else {
                await this.interactionModule.favorite(knowledgeId);
            }
            this.loadEnhancedKnowledgeList();
        } else {
            this.showMessage('收藏功能加载中...', 'info');
        }
    }

    // 初始化知识库筛选状态
    initKnowledgeFilter() {
        this.currentKnowledgeFilter = {
            currentCategory: 'all',
            currentSubcategory: null,
            searchKeyword: '',
            viewMode: 'card',
            sortBy: 'createdAt',
            difficulty: null,
        };
    }
    async loadAdminData(adminTabName) {
        switch (adminTabName) {
            case 'moduleManage':
                this.renderModuleList();
                await this.loadMaintainModuleSelect();
                break;
            case 'knowledgeMaintain':
                this.loadKnowledgeMaintainList();
                break;
            case 'userManage':
                this.loadUserStats();
                this.loadUserList();
                break;
        }
    }

    // 学习功能
    startLearning(moduleId, contentId) {
        this.showMessage(`开始学习: ${moduleId} - ${contentId}`, 'info');
        // 这里可以打开详细学习页面或模态框
    }

    // 收藏内容
    bookmarkContent(moduleId, contentId) {
        const bookmarkKey = `bookmark_${moduleId}_${contentId}`;
        const isBookmarked = localStorage.getItem(bookmarkKey) === 'true';

        if (isBookmarked) {
            localStorage.removeItem(bookmarkKey);
            this.showMessage('已取消收藏', 'info');
        } else {
            localStorage.setItem(bookmarkKey, 'true');
            this.showMessage('已添加到收藏', 'success');
        }

        // 更新按钮状态
        this.updateBookmarkButton(moduleId, contentId, !isBookmarked);
    }

    // 更新收藏按钮状态
    updateBookmarkButton(moduleId, contentId, isBookmarked) {
        // 这里可以根据实际的DOM结构来更新按钮状态
        console.log(`更新收藏状态: ${moduleId} - ${contentId} - ${isBookmarked}`);
    }

    // 分享内容
    shareContent(moduleId, contentId) {
        const shareUrl = `${window.location.origin}#${moduleId}/${contentId}`;

        if (navigator.share) {
            navigator.share({
                title: '测井专业智能培训系统',
                text: `分享学习内容: ${contentId}`,
                url: shareUrl,
            });
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showMessage('分享链接已复制到剪贴板', 'success');
            });
        }
    }

    // 更新连接状态
    updateConnectionStatus(isConnected) {
        let statusEl = document.getElementById('connectionStatus');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'connectionStatus';
            statusEl.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 999;
                transition: all 0.3s;
            `;
            document.body.appendChild(statusEl);
        }

        if (isConnected) {
            statusEl.textContent = '🟢 在线';
            statusEl.style.background = '#d4edda';
            statusEl.style.color = '#155724';
        } else {
            statusEl.textContent = '🔴 离线';
            statusEl.style.background = '#f8d7da';
            statusEl.style.color = '#721c24';
        }
    }

    // 控制台数据
    async loadDashboardData() {
        if (this.useMockData) {
            this.loadMockDashboardData();
            return;
        }

        try {
            // 加载用户学习进度
            const progressData = await this.apiCall('/users/progress');
            this.renderProgressChart(progressData);

            // 加载能力矩阵
            const abilityData = await this.apiCall('/users/ability');
            this.renderAbilityChart(abilityData);

            // 加载最近学习
            const recentData = await this.apiCall('/users/recent-learning');
            this.renderRecentLearning(recentData);

            // 加载通知
            const notifications = await this.apiCall('/users/notifications');
            this.renderNotifications(notifications);
        } catch (error) {
            this.loadMockDashboardData();
        }
    }

    loadMockDashboardData() {
        // 模拟进度数据
        const mockProgress = {
            basicKnowledge: 75,
            standards: 60,
            crossDiscipline: 45,
        };
        this.renderProgressChart(mockProgress);

        // 模拟能力矩阵
        const mockAbility = {
            professionalKnowledge: 80,
            standardApplication: 70,
            crossIntegration: 60,
            practicalSkills: 75,
            decisionAbility: 65,
        };
        this.renderAbilityChart(mockAbility);

        // 模拟最近学习
        const mockLearning = [
            { title: '自然伽马测井原理', time: '2小时前', progress: 80 },
            { title: '电阻率测井基础', time: '1天前', progress: 100 },
            { title: '声波测井技术', time: '3天前', progress: 60 },
        ];
        this.renderRecentLearning(mockLearning);

        // 模拟通知
        const mockNotifications = [
            { title: '新考试发布', content: '测井基础理论考试已发布', time: '1小时前' },
            { title: '学习提醒', content: '您有3天未登录学习', time: '2天前' },
        ];
        this.renderNotifications(mockNotifications);
    }

    renderProgressChart(data) {
        const ctx = document.getElementById('progressChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['基础知识', '专业标准', '跨专业知识'],
                datasets: [
                    {
                        label: '学习进度 (%)',
                        data: [data.basicKnowledge, data.standards, data.crossDiscipline],
                        backgroundColor: ['#3498db', '#e74c3c', '#f39c12'],
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                    },
                },
            },
        });
    }

    renderAbilityChart(data) {
        const ctx = document.getElementById('abilityChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['专业知识', '标准应用', '跨学科整合', '实践技能', '决策能力'],
                datasets: [
                    {
                        label: '能力评估',
                        data: [
                            data.professionalKnowledge,
                            data.standardApplication,
                            data.crossIntegration,
                            data.practicalSkills,
                            data.decisionAbility,
                        ],
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderColor: '#3498db',
                        pointBackgroundColor: '#3498db',
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                    },
                },
            },
        });
    }

    renderRecentLearning(data) {
        const container = document.getElementById('recentLearning');
        container.innerHTML = data
            .map(
                item => `
            <div class="learning-item">
                <h4>${item.title}</h4>
                <div class="progress">
                    <div class="progress-bar" style="width: ${item.progress}%"></div>
                </div>
                <small>${item.time}</small>
            </div>
        `
            )
            .join('');
    }

    renderNotifications(data) {
        const container = document.getElementById('notifications');
        container.innerHTML = data
            .map(
                item => `
            <div class="notification-item">
                <h4>${item.title}</h4>
                <p>${item.content}</p>
                <small>${item.time}</small>
            </div>
        `
            )
            .join('');
    }

    // 知识库数据
    async loadKnowledgeData() {
        if (this.useMockData) {
            this.loadMockKnowledgeData();
            return;
        }

        try {
            const knowledge = await this.apiCall('/knowledge');
            this.renderKnowledgeList(knowledge);
        } catch (error) {
            this.loadMockKnowledgeData();
        }
    }

    loadMockKnowledgeData() {
        const mockKnowledge = [
            {
                id: 1,
                title: '自然伽马测井原理',
                category: 'basic',
                subcategory: '放射性测井',
                content: '自然伽马测井是测量地层自然放射性的方法...',
                difficulty: 'intermediate',
                readingTime: 15,
                keywords: ['自然伽马', '放射性', '岩性识别'],
            },
            {
                id: 2,
                title: '电阻率测井基础',
                category: 'basic',
                subcategory: '电法测井',
                content: '电阻率测井是测量地层电阻率的基本方法...',
                difficulty: 'beginner',
                readingTime: 20,
                keywords: ['电阻率', '含水饱和度', '油气识别'],
            },
            {
                id: 3,
                title: '仪器与刻度标准规范',
                category: 'standard',
                subcategory: '仪器刻度',
                content: '测井仪器刻度规范规定了各类测井仪器的校准方法和量值传递要求...',
                difficulty: 'advanced',
                readingTime: 25,
                keywords: ['API标准', '安全规范', '放射性安全'],
            },
        ];
        this.renderKnowledgeList(mockKnowledge);
    }

    renderKnowledgeList(data) {
        const container = document.getElementById('knowledgeList');
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>暂无知识内容</h3>
                    <p>知识库正在建设中，敬请期待</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data
            .map(
                item => `
            <div class="knowledge-item" onclick="app.viewKnowledge(${item.id})">
                <div class="knowledge-header">
                    <h4>${item.title}</h4>
                    <div class="knowledge-actions">
                        ${item.hasQuiz ? '<span class="quiz-badge"><i class="fas fa-question-circle"></i>有测验</span>' : ''}
                        <button class="btn-favorite" onclick="event.stopPropagation(); app.toggleFavorite(${item.id})">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="knowledge-subtitle">${item.subcategory || '未分类'}</div>
                <p>${item.content.substring(0, 120)}...</p>
                <div class="keywords">
                    ${(item.keywords || []).map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
                </div>
                <div class="meta">
                    <span class="badge badge-${this.getDifficultyColor(item.difficulty)}">${this.getDifficultyText(item.difficulty)}</span>
                    <span><i class="fas fa-clock"></i> ${item.readingTime || 10}分钟</span>
                    <span><i class="fas fa-book"></i> ${this.getCategoryText(item.category)}</span>
                </div>
            </div>
        `
            )
            .join('');
    }

    // 案例数据
    async loadCasesData() {
        if (this.useMockData) {
            this.loadMockCasesData();
            return;
        }

        try {
            const cases = await this.apiCall('/cases');
            this.renderCasesList(cases);
        } catch (error) {
            this.loadMockCasesData();
        }
    }

    loadMockCasesData() {
        const mockCases = [
            {
                id: 1,
                title: '复杂储层测井解释案例',
                description: '针对某区块低孔低渗储层的测井解释实践',
                category: 'reservoir_evaluation',
                difficulty: 'advanced',
                status: 'published',
            },
            {
                id: 2,
                title: '钻井液侵入影响校正案例',
                description: '解决钻井液侵入对电阻率测井影响的工程实践',
                category: 'trouble_shooting',
                difficulty: 'intermediate',
                status: 'published',
            },
        ];
        this.renderCasesList(mockCases);
    }

    renderCasesList(data) {
        const container = document.getElementById('casesList');
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>暂无案例内容</h3>
                    <p>案例库正在建设中，敬请期待</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data
            .map(
                item => `
            <div class="case-item" onclick="app.viewCase(${item.id})">
                <div class="case-header">
                    <h4>${item.title}</h4>
                    <div class="case-actions">
                        <span class="status-badge status-${item.status}">${this.getStatusText(item.status)}</span>
                        <button class="btn-bookmark" onclick="event.stopPropagation(); app.toggleBookmark(${item.id})">
                            <i class="far fa-bookmark"></i>
                        </button>
                    </div>
                </div>
                <p class="case-description">${item.description}</p>
                <div class="case-preview">
                    <div class="preview-section">
                        <h5><i class="fas fa-exclamation-triangle"></i>问题陈述</h5>
                        <p>${item.problemStatement || '暂无问题描述'}</p>
                    </div>
                    <div class="preview-section">
                        <h5><i class="fas fa-lightbulb"></i>解决方案</h5>
                        <p>${item.solution || '暂无解决方案'}</p>
                    </div>
                </div>
                <div class="case-meta">
                    <span class="badge badge-${this.getDifficultyColor(item.difficulty)}">${this.getDifficultyText(item.difficulty)}</span>
                    <span><i class="fas fa-folder"></i> ${this.getCategoryText(item.category)}</span>
                    <span><i class="fas fa-chart-line"></i> ${item.results ? '有成果' : '待验证'}</span>
                </div>
            </div>
        `
            )
            .join('');
    }

    // 考试数据
    async loadExamData() {
        if (this.useMockData) {
            this.loadMockExamData();
            return;
        }

        try {
            const exams = await this.apiCall('/exams');
            this.renderExamList(exams);
        } catch (error) {
            this.loadMockExamData();
        }
    }

    loadMockExamData() {
        const mockExams = [
            {
                id: 1,
                title: '测井基础理论考试',
                description: '测试学员对测井基础理论的掌握程度',
                category: 'basic',
                difficulty: 'intermediate',
                timeLimit: 60,
                passingScore: 70,
                questionCount: 20,
            },
            {
                id: 2,
                title: '测井安全操作考试',
                description: '测试学员对测井安全规范的掌握',
                category: 'standard',
                difficulty: 'advanced',
                timeLimit: 45,
                passingScore: 80,
                questionCount: 15,
            },
        ];
        this.renderExamList(mockExams);
    }

    renderExamList(data) {
        const container = document.getElementById('examList');
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>暂无考试内容</h3>
                    <p>考试系统正在建设中，敬请期待</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data
            .map(
                item => `
            <div class="exam-item">
                <div class="exam-header">
                    <div class="exam-info">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                    <div class="exam-status">
                        ${item.isPublished ? '<span class="status-badge status-published">已发布</span>' : '<span class="status-badge status-draft">草稿</span>'}
                    </div>
                </div>
                
                <div class="exam-details">
                    <div class="exam-meta">
                        <span class="meta-item">
                            <i class="fas fa-clock"></i>
                            <strong>时长:</strong> ${item.timeLimit}分钟
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-question-circle"></i>
                            <strong>题数:</strong> ${item.questionCount || 20}题
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-percentage"></i>
                            <strong>及格分:</strong> ${item.passingScore}%
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-signal"></i>
                            <strong>难度:</strong> 
                            <span class="badge badge-${this.getDifficultyColor(item.difficulty)}">${this.getDifficultyText(item.difficulty)}</span>
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-book"></i>
                            <strong>类型:</strong> ${this.getCategoryText(item.category)}
                        </span>
                    </div>
                    
                    ${
                        item.questions && item.questions.length > 0
                            ? `
                        <div class="exam-preview">
                            <h5><i class="fas fa-eye"></i>题目预览</h5>
                            <div class="question-preview">
                                ${item.questions
                                    .slice(0, 2)
                                    .map(
                                        (q, index) => `
                                    <div class="preview-question">
                                        <span class="question-number">${index + 1}.</span>
                                        <span class="question-type ${q.questionType}">${this.getQuestionTypeText(q.questionType)}</span>
                                        <span class="question-text">${q.questionText.substring(0, 50)}...</span>
                                    </div>
                                `
                                    )
                                    .join('')}
                                ${item.questions.length > 2 ? `<div class="more-questions">...还有${item.questions.length - 2}道题目</div>` : ''}
                            </div>
                        </div>
                    `
                            : ''
                    }
                </div>
                
                <div class="exam-actions">
                    <button class="btn btn-success" onclick="app.startExam(${item.id})" ${!item.isPublished ? 'disabled' : ''}>
                        <i class="fas fa-play"></i>${item.isPublished ? '开始考试' : '未发布'}
                    </button>
                    <button class="btn btn-outline" onclick="app.viewExamInfo(${item.id})">
                        <i class="fas fa-info-circle"></i>详情
                    </button>
                    ${
                        this.canManageExam()
                            ? `
                        <button class="btn btn-secondary" onclick="app.editExam(${item.id})">
                            <i class="fas fa-edit"></i>编辑
                        </button>
                    `
                            : ''
                    }
                </div>
            </div>
        `
            )
            .join('');
    }

    // 个人资料数据
    async loadProfileData() {
        if (!this.currentUser) {
            // 未登录时显示提示信息
            this.updateProfileDisplay(null);
            return;
        }

        // 更新基本信息
        document.getElementById('username').value = this.currentUser.username;
        document.getElementById('fullName').value = this.currentUser.profile?.name || '';
        document.getElementById('title').value = this.currentUser.profile?.title || '';
        document.getElementById('experience').value = this.currentUser.profile?.experience || '';
        document.getElementById('email').value = this.currentUser.profile?.email || '';
        document.getElementById('phone').value = this.currentUser.profile?.phone || '';

        // 更新个人资料显示
        this.updateProfileDisplay(this.currentUser);

        // 加载学习数据
        await this.loadUserProgress();
        await this.loadUserStatistics();
        await this.loadUserActivities();
    }

    updateProfileDisplay(user) {
        if (user) {
            document.getElementById('profileName').textContent =
                user.profile?.name || user.username || '未知用户';
            document.getElementById('profileRole').textContent =
                user.profile?.title || this.getRoleText(user.role);
        } else {
            document.getElementById('profileName').textContent = '访客用户';
            document.getElementById('profileRole').textContent = '未登录';
        }
    }

    getRoleText(role) {
        const roles = {
            admin: '系统管理员',
            student: '学员',
        };
        return roles[role] || role;
    }

    async loadUserProgress() {
        try {
            const progressData = this.useMockData
                ? this.getMockProgressData()
                : await this.apiCall('/users/progress');

            this.updateProgressDisplay(progressData);
            this.createAbilityChart(progressData);
        } catch (error) {
            // 使用模拟数据
            const mockProgress = this.getMockProgressData();
            this.updateProgressDisplay(mockProgress);
            this.createAbilityChart(mockProgress);
        }
    }

    getMockProgressData() {
        return {
            basicKnowledge: 75,
            standards: 60,
            crossDiscipline: 45,
            professionalKnowledge: 80,
            standardApplication: 70,
            crossIntegration: 60,
            practicalSkills: 75,
            decisionAbility: 65,
        };
    }

    updateProgressDisplay(data) {
        // 更新总体进度
        const overall = Math.round(
            (data.basicKnowledge + data.standards + data.crossDiscipline) / 3
        );
        document.getElementById('overallProgress').textContent = overall;

        // 更新分类进度
        document.getElementById('basicProgress').style.width = `${data.basicKnowledge}%`;
        document.getElementById('basicPercent').textContent = `${data.basicKnowledge}%`;

        document.getElementById('standardProgress').style.width = `${data.standards}%`;
        document.getElementById('standardPercent').textContent = `${data.standards}%`;

        document.getElementById('crossProgress').style.width = `${data.crossDiscipline}%`;
        document.getElementById('crossPercent').textContent = `${data.crossDiscipline}%`;

        // 更新能力评分和等级
        const abilityScore = Math.round(
            (data.professionalKnowledge +
                data.standardApplication +
                data.crossIntegration +
                data.practicalSkills +
                data.decisionAbility) /
                5
        );

        document.getElementById('abilityScore').textContent = abilityScore;
        document.getElementById('abilityRank').textContent = this.getAbilityRank(abilityScore);
    }

    getAbilityRank(score) {
        if (score >= 90) {return '专家';}
        if (score >= 80) {return '高级';}
        if (score >= 70) {return '中级';}
        if (score >= 60) {return '初级';}
        return '新手';
    }

    createAbilityChart(data) {
        const ctx = document.getElementById('profileAbilityChart');
        if (!ctx) {return;}

        // 销毁现有图表
        if (this.profileAbilityChart) {
            this.profileAbilityChart.destroy();
        }

        this.profileAbilityChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['专业知识', '标准应用', '跨学科整合', '实践技能', '决策能力'],
                datasets: [
                    {
                        label: '能力评估',
                        data: [
                            data.professionalKnowledge,
                            data.standardApplication,
                            data.crossIntegration,
                            data.practicalSkills,
                            data.decisionAbility,
                        ],
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderColor: '#3498db',
                        pointBackgroundColor: '#3498db',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#3498db',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });
    }

    async loadUserStatistics() {
        // 使用模拟统计数据
        const stats = {
            knowledgeCount: Math.floor(Math.random() * 50) + 10,
            caseCount: Math.floor(Math.random() * 20) + 5,
            examCount: Math.floor(Math.random() * 10) + 2,
            studyTime: Math.floor(Math.random() * 100) + 20,
        };

        document.getElementById('knowledgeCount').textContent = stats.knowledgeCount;
        document.getElementById('caseCount').textContent = stats.caseCount;
        document.getElementById('examCount').textContent = stats.examCount;
        document.getElementById('studyTime').textContent = stats.studyTime;
    }

    async loadUserActivities() {
        // 使用模拟活动数据
        const activities = [
            { type: 'knowledge', title: '自然伽马测井原理', time: '2小时前', action: '完成学习' },
            { type: 'exam', title: '测井基础理论考试', time: '1天前', action: '获得85分' },
            { type: 'case', title: '复杂储层测井解释案例', time: '2天前', action: '开始模拟' },
            { type: 'knowledge', title: '电阻率测井基础', time: '3天前', action: '完成测验' },
        ];

        const container = document.getElementById('recentActivities');
        container.innerHTML = activities
            .map(
                activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <h5>${activity.title}</h5>
                    <p>${activity.action} · ${activity.time}</p>
                </div>
            </div>
        `
            )
            .join('');
    }

    getActivityIcon(type) {
        const icons = {
            knowledge: 'fa-book-open',
            case: 'fa-folder-open',
            exam: 'fa-clipboard-list',
        };
        return icons[type] || 'fa-circle';
    }

    async updateProfile() {
        if (!this.currentUser) {
            this.showMessage('请先登录', 'warning');
            return;
        }

        const profileData = {
            name: document.getElementById('fullName').value,
            title: document.getElementById('title').value,
            experience: parseInt(document.getElementById('experience').value) || 0,
        };

        try {
            await this.apiCall('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ profile: profileData }),
            });

            this.showMessage('个人资料更新成功', 'success');
        } catch (error) {
            this.showMessage('更新失败，请重试', 'error');
        }
    }

    // 工具方法
    getDifficultyColor(difficulty) {
        const colors = {
            beginner: 'success',
            intermediate: 'warning',
            advanced: 'danger',
        };
        return colors[difficulty] || 'warning';
    }

    getDifficultyText(difficulty) {
        const texts = {
            beginner: '初级',
            intermediate: '中级',
            advanced: '高级',
        };
        return texts[difficulty] || '中级';
    }

    getCategoryText(category) {
        const texts = {
            basic: '基础知识',
            standard: '专业标准',
            cross: '跨专业知识',
            reservoir_evaluation: '储层评价',
            drilling: '钻井工程',
            production: '生产测井',
            trouble_shooting: '故障排除',
        };
        return texts[category] || category;
    }

    // 键盘快捷键处理
    handleKeyboardShortcuts(e) {
        // 忽略在输入框中的按键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ctrl/Cmd + K: 快速搜索
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.showQuickSearch();
        }

        // Ctrl/Cmd + /: 显示帮助
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.showHelp();
        }

        // ESC: 关闭模态框
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Alt + 数字: 快速导航
        if (e.altKey && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const pages = ['dashboard', 'knowledge', 'cases', 'exam', 'profile'];
            const pageIndex = parseInt(e.key) - 1;
            if (pages[pageIndex]) {
                this.showPage(pages[pageIndex]);
            }
        }
    }

    // 快速搜索
    showQuickSearch() {
        // 创建搜索模态框
        const modal = document.createElement('div');
        modal.className = 'modal quick-search-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-search"></i>快速搜索</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <input type="text" id="quickSearchInput" placeholder="搜索知识、案例、考试..." autofocus>
                    <div id="quickSearchResults" class="search-results"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定事件
        const input = modal.querySelector('#quickSearchInput');
        input.addEventListener('input', e => this.performQuickSearch(e.target.value));

        modal.querySelector('.close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', e => {
            if (e.target === modal) {modal.remove();}
        });
    }

    // 执行快速搜索
    async performQuickSearch(query) {
        if (!query) {
            document.getElementById('quickSearchResults').innerHTML = '';
            return;
        }

        try {
            // 搜索知识库
            const knowledgeResponse = await fetch(`${this.apiBase}/knowledge`);
            const knowledgeData = await knowledgeResponse.json();

            // 搜索案例
            const casesResponse = await fetch(`${this.apiBase}/cases`);
            const casesData = await casesResponse.json();

            // 搜索考试
            const examsResponse = await fetch(`${this.apiBase}/exams`);
            const examsData = await examsResponse.json();

            const results = [];

            // 搜索知识
            if (knowledgeData.success) {
                knowledgeData.knowledge.forEach(item => {
                    if (
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        item.content.toLowerCase().includes(query.toLowerCase())
                    ) {
                        results.push({
                            type: 'knowledge',
                            title: item.title,
                            description: `${item.content.substring(0, 100)  }...`,
                            id: item.id,
                        });
                    }
                });
            }

            // 搜索案例
            if (casesData.success) {
                casesData.cases.forEach(item => {
                    if (
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        item.description.toLowerCase().includes(query.toLowerCase())
                    ) {
                        results.push({
                            type: 'case',
                            title: item.title,
                            description: item.description,
                            id: item.id,
                        });
                    }
                });
            }

            // 搜索考试
            if (examsData.success) {
                examsData.exams.forEach(item => {
                    if (
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        item.description.toLowerCase().includes(query.toLowerCase())
                    ) {
                        results.push({
                            type: 'exam',
                            title: item.title,
                            description: item.description,
                            id: item.id,
                        });
                    }
                });
            }

            this.displaySearchResults(results);
        } catch (error) {
            console.log('搜索失败:', error);
        }
    }

    // 显示搜索结果
    displaySearchResults(results) {
        const container = document.getElementById('quickSearchResults');

        if (results.length === 0) {
            container.innerHTML = '<div class="no-results">未找到相关内容</div>';
            return;
        }

        container.innerHTML = results
            .map(
                result => `
            <div class="search-result-item" onclick="app.handleSearchResult('${result.type}', ${result.id})">
                <div class="result-type">${this.getTypeText(result.type)}</div>
                <div class="result-title">${result.title}</div>
                <div class="result-description">${result.description}</div>
            </div>
        `
            )
            .join('');
    }

    // 处理搜索结果点击
    handleSearchResult(type, id) {
        // 关闭搜索模态框
        document.querySelector('.quick-search-modal')?.remove();

        // 根据类型跳转到相应页面
        switch (type) {
            case 'knowledge':
                this.showPage('knowledge');
                setTimeout(() => this.viewKnowledge(id), 100);
                break;
            case 'case':
                this.showPage('cases');
                setTimeout(() => this.viewCase(id), 100);
                break;
            case 'exam':
                this.showPage('exam');
                setTimeout(() => this.viewExamInfo(id), 100);
                break;
        }
    }

    // 获取类型文本
    getTypeText(type) {
        const types = {
            knowledge: '知识',
            case: '案例',
            exam: '考试',
        };
        return types[type] || type;
    }

    // 显示帮助
    showHelp() {
        const modal = document.createElement('div');
        modal.className = 'modal help-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-keyboard"></i>键盘快捷键</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-list">
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>K</kbd>
                            <span>快速搜索</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>/</kbd>
                            <span>显示帮助</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>关闭模态框</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt</kbd> + <kbd>1</kbd>
                            <span>控制台</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt</kbd> + <kbd>2</kbd>
                            <span>知识库</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt</kbd> + <kbd>3</kbd>
                            <span>案例学习</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt</kbd> + <kbd>4</kbd>
                            <span>考试系统</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt</kbd> + <kbd>5</kbd>
                            <span>个人中心</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', e => {
            if (e.target === modal) {modal.remove();}
        });
    }

    // 关闭所有模态框
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.remove();
        });
    }

    // 知识库相关方法
    viewKnowledge(id) {
        // 查找知识详情
        const knowledgeData = this.useMockData
            ? this.getMockKnowledgeData()
            : this.getKnowledgeData();

        const knowledge = knowledgeData.find(item => item.id === id);
        if (knowledge) {
            this.showKnowledgeDetail(knowledge);
        } else {
            this.showMessage('知识内容不存在', 'error');
        }
    }

    showKnowledgeDetail(knowledge) {
        // 创建知识详情模态框
        const modal = document.createElement('div');
        modal.className = 'modal knowledge-detail-modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><i class="fas fa-book"></i>${knowledge.title}</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="knowledge-detail">
                        <div class="knowledge-meta">
                            <span class="badge badge-${this.getDifficultyColor(knowledge.difficulty)}">${this.getDifficultyText(knowledge.difficulty)}</span>
                            <span><i class="fas fa-clock"></i> ${knowledge.readingTime || 10}分钟</span>
                            <span><i class="fas fa-book"></i> ${this.getCategoryText(knowledge.category)}</span>
                            <span><i class="fas fa-tag"></i> ${knowledge.subcategory || '未分类'}</span>
                        </div>
                        <div class="knowledge-content">
                            ${knowledge.content}
                        </div>
                        ${
                            knowledge.keywords
                                ? `
                            <div class="keywords-section">
                                <h4>关键词</h4>
                                <div class="keywords">
                                    ${knowledge.keywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
                                </div>
                            </div>
                        `
                                : ''
                        }
                        ${
                            knowledge.hasQuiz
                                ? `
                            <div class="quiz-section">
                                <h4>相关测验</h4>
                                <button class="btn btn-primary" onclick="app.startKnowledgeQuiz(${knowledge.id})">
                                    <i class="fas fa-question-circle"></i>开始测验
                                </button>
                            </div>
                        `
                                : ''
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        modal.querySelector('.close').addEventListener('click', () => {
            modal.remove();
        });

        // 点击背景关闭
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    toggleFavorite(id) {
        // 切换收藏状态
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const index = favorites.indexOf(id);

        if (index > -1) {
            favorites.splice(index, 1);
            this.showMessage('已取消收藏', 'info');
        } else {
            favorites.push(id);
            this.showMessage('已添加到收藏', 'success');
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));

        // 更新UI
        event.target.classList.toggle('fas');
        event.target.classList.toggle('far');
    }

    startKnowledgeQuiz(id) {
        if (!this.currentUser) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return;
        }
        this.showMessage(`开始知识测验 ID: ${id}`, 'info');
    }

    filterKnowledge() {
        const category = document.getElementById('categoryFilter').value;
        const difficulty = document.getElementById('difficultyFilter').value;

        // 重新加载知识数据并应用过滤
        this.loadKnowledgeData().then(() => {
            const items = document.querySelectorAll('.knowledge-item');
            items.forEach(item => {
                // 这里可以添加过滤逻辑
                item.style.display = 'block';
            });
        });
    }

    viewCase(id) {
        // 查找案例详情
        const caseData = this.useMockData ? this.getMockCasesData() : this.getCaseData();

        const caseItem = caseData.find(item => item.id === id);
        if (caseItem) {
            this.showCaseDetail(caseItem);
        } else {
            this.showMessage('案例内容不存在', 'error');
        }
    }

    showCaseDetail(caseItem) {
        // 创建案例详情模态框
        const modal = document.createElement('div');
        modal.className = 'modal case-detail-modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><i class="fas fa-folder-open"></i>${caseItem.title}</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="case-detail">
                        <div class="case-info">
                            <span class="badge badge-${this.getDifficultyColor(caseItem.difficulty)}">${this.getDifficultyText(caseItem.difficulty)}</span>
                            <span class="status-badge status-${caseItem.status}">${this.getStatusText(caseItem.status)}</span>
                            <span><i class="fas fa-folder"></i> ${this.getCategoryText(caseItem.category)}</span>
                        </div>
                        
                        <div class="case-description-full">
                            <h4>案例描述</h4>
                            <p>${caseItem.description}</p>
                        </div>
                        
                        <div class="case-problem">
                            <h4><i class="fas fa-exclamation-triangle text-warning"></i>问题陈述</h4>
                            <p>${caseItem.problemStatement || '暂无问题描述'}</p>
                        </div>
                        
                        <div class="case-solution">
                            <h4><i class="fas fa-lightbulb text-primary"></i>解决方案</h4>
                            <p>${caseItem.solution || '暂无解决方案'}</p>
                        </div>
                        
                        ${
                            caseItem.results
                                ? `
                            <div class="case-results">
                                <h4><i class="fas fa-chart-line text-success"></i>成果验证</h4>
                                <p>${caseItem.results}</p>
                            </div>
                        `
                                : ''
                        }
                        
                        <div class="case-actions-full">
                            <button class="btn btn-primary" onclick="app.startCaseSimulation(${caseItem.id})">
                                <i class="fas fa-play"></i>开始模拟学习
                            </button>
                            <button class="btn btn-secondary" onclick="app.downloadCase(${caseItem.id})">
                                <i class="fas fa-download"></i>下载案例
                            </button>
                            <button class="btn btn-outline" onclick="app.shareCase(${caseItem.id})">
                                <i class="fas fa-share"></i>分享
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        modal.querySelector('.close').addEventListener('click', () => {
            modal.remove();
        });

        // 点击背景关闭
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    toggleBookmark(id) {
        // 切换书签状态
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const index = bookmarks.indexOf(id);

        if (index > -1) {
            bookmarks.splice(index, 1);
            this.showMessage('已取消书签', 'info');
        } else {
            bookmarks.push(id);
            this.showMessage('已添加书签', 'success');
        }

        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

        // 更新UI
        event.target.classList.toggle('fas');
        event.target.classList.toggle('far');
    }

    startCaseSimulation(id) {
        if (!this.currentUser) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return;
        }
        this.showMessage(`开始案例模拟 ID: ${id}`, 'info');
    }

    downloadCase(id) {
        this.showMessage(`下载案例 ID: ${id}`, 'info');
    }

    shareCase(id) {
        this.showMessage(`分享案例 ID: ${id}`, 'info');
    }

    getStatusText(status) {
        const texts = {
            published: '已发布',
            draft: '草稿',
            archived: '已归档',
        };
        return texts[status] || status;
    }

    startExam(id) {
        if (!this.currentUser) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return;
        }

        // 查找考试详情
        const examData = this.useMockData ? this.getMockExamData() : this.getExamData();

        const exam = examData.find(item => item.id === id);
        if (exam && exam.isPublished) {
            this.showExamInterface(exam);
        } else {
            this.showMessage('考试不存在或未发布', 'error');
        }
    }

    showExamInterface(exam) {
        // 创建考试界面模态框
        const modal = document.createElement('div');
        modal.className = 'modal exam-modal';
        modal.innerHTML = `
            <div class="modal-content modal-full">
                <div class="exam-container">
                    <div class="exam-header">
                        <div class="exam-title">
                            <h3>${exam.title}</h3>
                            <div class="exam-timer">
                                <i class="fas fa-clock"></i>
                                <span id="examTimer">${exam.timeLimit}:00</span>
                            </div>
                        </div>
                        <div class="exam-progress">
                            <span>题目进度: <span id="currentQuestion">1</span>/${exam.questions.length}</span>
                            <div class="progress">
                                <div id="examProgressBar" class="progress-bar" style="width: ${(1 / exam.questions.length) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="exam-body">
                        <div class="question-container">
                            <div class="question-header">
                                <h4>第 <span id="questionNumber">1</span> 题</h4>
                                <span class="question-points">分值: <span id="questionPoints">2</span>分</span>
                            </div>
                            <div class="question-content">
                                <p id="questionText"></p>
                                <div id="questionOptions"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="exam-footer">
                        <button class="btn btn-secondary" onclick="app.previousQuestion()" id="prevBtn" disabled>
                            <i class="fas fa-chevron-left"></i>上一题
                        </button>
                        <button class="btn btn-primary" onclick="app.nextQuestion()" id="nextBtn">
                            下一题<i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-success" onclick="app.submitExam()" id="submitBtn" style="display:none;">
                            <i class="fas fa-check"></i>提交考试
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 初始化考试状态
        this.currentExam = {
            id: exam.id,
            title: exam.title,
            questions: exam.questions,
            timeLimit: exam.timeLimit,
            passingScore: exam.passingScore,
            currentQuestionIndex: 0,
            answers: {},
            startTime: new Date(),
            timer: null,
        };

        // 开始倒计时
        this.startExamTimer();

        // 显示第一题
        this.displayQuestion(0);
    }

    startExamTimer() {
        let timeRemaining = this.currentExam.timeLimit * 60; // 转换为秒

        this.currentExam.timer = setInterval(() => {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;

            document.getElementById('examTimer').textContent =
                `${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (timeRemaining <= 0) {
                clearInterval(this.currentExam.timer);
                this.submitExam(true); // 时间到，自动提交
            }

            timeRemaining--;
        }, 1000);
    }

    displayQuestion(index) {
        const question = this.currentExam.questions[index];

        // 更新题目信息
        document.getElementById('questionNumber').textContent = index + 1;
        document.getElementById('questionPoints').textContent = question.points || 2;
        document.getElementById('questionText').textContent = question.questionText;
        document.getElementById('currentQuestion').textContent = index + 1;

        // 更新进度条
        const progress = ((index + 1) / this.currentExam.questions.length) * 100;
        document.getElementById('examProgressBar').style.width = `${progress}%`;

        // 渲染选项
        const optionsContainer = document.getElementById('questionOptions');
        if (question.questionType === 'single_choice') {
            optionsContainer.innerHTML = question.options
                .map(
                    (option, i) => `
                <label class="option-label">
                    <input type="radio" name="answer" value="${i}" ${this.currentExam.answers[index] === i ? 'checked' : ''}>
                    <span class="option-text">${option}</span>
                </label>
            `
                )
                .join('');
        } else if (question.questionType === 'multiple_choice') {
            optionsContainer.innerHTML = question.options
                .map(
                    (option, i) => `
                <label class="option-label">
                    <input type="checkbox" name="answer" value="${i}" ${this.currentExam.answers[index]?.includes(i) ? 'checked' : ''}>
                    <span class="option-text">${option}</span>
                </label>
            `
                )
                .join('');
        }

        // 更新按钮状态
        document.getElementById('prevBtn').disabled = index === 0;
        document.getElementById('nextBtn').style.display =
            index === this.currentExam.questions.length - 1 ? 'none' : 'block';
        document.getElementById('submitBtn').style.display =
            index === this.currentExam.questions.length - 1 ? 'block' : 'none';

        // 保存当前答案
        this.saveCurrentAnswer();
    }

    saveCurrentAnswer() {
        const index = this.currentExam.currentQuestionIndex;
        const question = this.currentExam.questions[index];

        if (question.questionType === 'single_choice') {
            const selected = document.querySelector('input[name="answer"]:checked');
            if (selected) {
                this.currentExam.answers[index] = parseInt(selected.value);
            }
        } else if (question.questionType === 'multiple_choice') {
            const selected = document.querySelectorAll('input[name="answer"]:checked');
            this.currentExam.answers[index] = Array.from(selected).map(input =>
                parseInt(input.value)
            );
        }
    }

    nextQuestion() {
        this.saveCurrentAnswer();
        if (this.currentExam.currentQuestionIndex < this.currentExam.questions.length - 1) {
            this.currentExam.currentQuestionIndex++;
            this.displayQuestion(this.currentExam.currentQuestionIndex);
        }
    }

    previousQuestion() {
        this.saveCurrentAnswer();
        if (this.currentExam.currentQuestionIndex > 0) {
            this.currentExam.currentQuestionIndex--;
            this.displayQuestion(this.currentExam.currentQuestionIndex);
        }
    }

    submitExam(autoSubmit = false) {
        if (!autoSubmit) {
            const confirmed = confirm('确定要提交考试吗？提交后无法修改答案。');
            if (!confirmed) {return;}
        }

        this.saveCurrentAnswer();
        clearInterval(this.currentExam.timer);

        // 计算得分
        const score = this.calculateExamScore();
        const passed = score >= this.currentExam.passingScore;

        // 显示结果
        this.showExamResult(score, passed);
    }

    calculateExamScore() {
        let totalPoints = 0;
        let earnedPoints = 0;

        this.currentExam.questions.forEach((question, index) => {
            const points = question.points || 2;
            totalPoints += points;

            const userAnswer = this.currentExam.answers[index];
            const correctAnswer = question.correctAnswer;

            if (question.questionType === 'single_choice' && userAnswer === correctAnswer) {
                earnedPoints += points;
            } else if (question.questionType === 'multiple_choice' && userAnswer && correctAnswer) {
                // 多选题需要完全匹配
                const userSorted = [...userAnswer].sort();
                const correctSorted = [...correctAnswer].sort();
                if (
                    userSorted.length === correctSorted.length &&
                    userSorted.every((val, idx) => val === correctSorted[idx])
                ) {
                    earnedPoints += points;
                }
            }
        });

        return Math.round((earnedPoints / totalPoints) * 100);
    }

    showExamResult(score, passed) {
        const modal = document.querySelector('.exam-modal');
        modal.innerHTML = `
            <div class="modal-content">
                <div class="exam-result">
                    <div class="result-icon ${passed ? 'success' : 'fail'}">
                        <i class="fas ${passed ? 'fa-trophy' : 'fa-times-circle'}"></i>
                    </div>
                    <h3>${passed ? '恭喜通过！' : '未通过考试'}</h3>
                    <div class="score-display">
                        <div class="score-circle">
                            <span class="score-number">${score}</span>
                            <span class="score-label">分</span>
                        </div>
                        <div class="score-info">
                            <p>及格分: ${this.currentExam.passingScore}%</p>
                            <p>用时: ${Math.floor((new Date() - this.currentExam.startTime) / 60000)}分钟</p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-primary" onclick="app.closeExamResult()">
                            <i class="fas fa-times"></i>关闭
                        </button>
                        <button class="btn btn-secondary" onclick="app.viewExamDetails()">
                            <i class="fas fa-list"></i>查看详情
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    closeExamResult() {
        document.querySelector('.exam-modal').remove();
        this.currentExam = null;
    }

    viewExamDetails() {
        this.showMessage('查看考试详情功能开发中...', 'info');
    }

    viewExamInfo(id) {
        this.showMessage(`查看考试详情 ID: ${id}`, 'info');
    }

    editExam(id) {
        this.showMessage(`编辑考试 ID: ${id}`, 'info');
    }

    canManageExam() {
        return (
            this.currentUser &&
            (this.currentUser.role === 'admin')
        );
    }

    getQuestionTypeText(type) {
        const texts = {
            single_choice: '单选题',
            multiple_choice: '多选题',
            true_false: '判断题',
            essay: '问答题',
        };
        return texts[type] || '未知';
    }

    getExamData() {
        return JSON.parse(localStorage.getItem('examData') || '[]');
    }

    getMockExamData() {
        return [
            {
                id: 1,
                title: '测井基础理论考试',
                description: '测试学员对测井基础理论的掌握程度',
                category: 'basic',
                difficulty: 'intermediate',
                timeLimit: 60,
                passingScore: 70,
                questionCount: 20,
                isPublished: true,
                questions: [
                    {
                        questionText: '自然伽马测井主要用于识别什么？',
                        questionType: 'single_choice',
                        options: ['岩性和泥质含量', '孔隙度', '渗透率', '含油饱和度'],
                        correctAnswer: 0,
                        explanation: '自然伽马测井主要用于识别岩性和判断泥质含量。',
                        points: 2,
                        difficulty: 'easy',
                    },
                ],
            },
        ];
    }

    startNewExam() {
        if (!this.currentUser) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return;
        }
        this.showMessage('开始新考试', 'info');
    }

    filterKnowledge() {
        const category = document.getElementById('categoryFilter').value;
        const difficulty = document.getElementById('difficultyFilter').value;

        this.showMessage(`筛选: ${category || '全部分类'}, ${difficulty || '全部难度'}`, 'info');
        // 重新加载知识库数据
        this.loadKnowledgeData();
    }
    // 添加新模块
    async addNewModule() {
        const moduleData = {
            id: prompt('请输入模块ID（英文）:'),
            name: prompt('请输入模块名称:'),
            icon: prompt('请输入图标类名（如: fas fa-book）:'),
            description: prompt('请输入模块描述:'),
        };

        if (!moduleData.id || !moduleData.name) {
            this.showMessage('模块ID和名称不能为空', 'error');
            return;
        }

        try {
            const response = await this.apiCall('/admin/modules', {
                method: 'POST',
                body: JSON.stringify(moduleData),
            });

            if (response.success) {
                this.knowledgeModuleConfig[moduleData.id] = moduleData;
                this.knowledgeModules[moduleData.id] = {
                    ...moduleData,
                    count: 0,
                    items: [],
                };

                this.renderModuleList();
                this.renderKnowledgeTabs();
                this.showMessage('模块添加成功', 'success');
            }
        } catch (error) {
            this.showMessage('添加模块失败', 'error');
        }
    }

    // 编辑模块
    async editModule(moduleId) {
        const module = this.knowledgeModuleConfig[moduleId];
        if (!module) {return;}

        const moduleData = {
            id: moduleId,
            name: prompt('请输入新的模块名称:', module.name),
            icon: prompt('请输入新的图标类名:', module.icon),
            description: prompt('请输入新的模块描述:', module.description),
        };

        if (!moduleData.name) {
            this.showMessage('模块名称不能为空', 'error');
            return;
        }

        try {
            const response = await this.apiCall(`/admin/modules/${moduleId}`, {
                method: 'PUT',
                body: JSON.stringify(moduleData),
            });

            if (response.success) {
                this.knowledgeModuleConfig[moduleId] = { ...module, ...moduleData };
                this.renderModuleList();
                this.renderKnowledgeTabs();
                this.showMessage('模块更新成功', 'success');
            }
        } catch (error) {
            this.showMessage('更新模块失败', 'error');
        }
    }

    // 删除模块
    async deleteModule(moduleId) {
        if (!confirm('确定要删除这个模块吗？相关的知识内容也会被删除。')) {
            return;
        }

        try {
            const response = await this.apiCall(`/admin/modules/${moduleId}`, {
                method: 'DELETE',
            });

            if (response.success) {
                delete this.knowledgeModuleConfig[moduleId];
                delete this.knowledgeModules[moduleId];
                this.renderModuleList();
                this.renderKnowledgeTabs();
                this.showMessage('模块删除成功', 'success');
            }
        } catch (error) {
            this.showMessage('删除模块失败', 'error');
        }
    }

    // 渲染模块列表
    renderModuleList() {
        const container = document.getElementById('moduleList');
        if (!container) {return;}

        container.innerHTML = Object.values(this.knowledgeModuleConfig)
            .map(
                module => `
            <div class="module-item">
                <div class="module-item-info">
                    <h4><i class="${module.icon}"></i> ${module.name}</h4>
                    <p>${module.description}</p>
                    <small>ID: ${module.id} | 知识数量: ${this.knowledgeModules[module.id]?.count || 0}</small>
                </div>
                <div class="module-item-actions">
                    <button class="btn-secondary" onclick="app.editModule('${module.id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    ${
                        module.id !== 'basic' &&
                        module.id !== 'instrument' &&
                        module.id !== 'operation' &&
                        module.id !== 'standard' &&
                        module.id !== 'cross'
                            ? `
                        <button class="btn-secondary" style="background: var(--danger)" onclick="app.deleteModule('${module.id}')">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    `
                            : ''
                    }
                </div>
            </div>
        `
            )
            .join('');
    }

    // 渲染知识标签
    renderKnowledgeTabs() {
        const container = document.getElementById('knowledgeTabs');
        if (!container) {return;}

        container.innerHTML = Object.values(this.knowledgeModuleConfig)
            .map(
                module => `
            <div class="knowledge-tab ${this.currentKnowledgeModule === module.id ? 'active' : ''}" 
                 data-module="${module.id}">
                <i class="${module.icon}"></i>
                <span>${module.name}</span>
                <span class="count">${this.knowledgeModules[module.id]?.count || 0}</span>
            </div>
        `
            )
            .join('');

        // 重新绑定事件
        container.querySelectorAll('.knowledge-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                const moduleId = e.currentTarget.dataset.module;
                if (moduleId) {
                    this.showKnowledgeModule(moduleId);
                }
            });
        });
    }

    // 设置文件上传
    setupFileUpload() {
        const importZone = document.getElementById('importZone');
        const fileInput = document.getElementById('fileInput');

        if (!importZone || !fileInput) {return;}

        // 点击选择文件
        importZone.addEventListener('click', () => {
            fileInput.click();
        });

        // 拖拽上传
        importZone.addEventListener('dragover', e => {
            e.preventDefault();
            importZone.classList.add('drag-over');
        });

        importZone.addEventListener('dragleave', () => {
            importZone.classList.remove('drag-over');
        });

        importZone.addEventListener('drop', e => {
            e.preventDefault();
            importZone.classList.remove('drag-over');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // 文件选择
        fileInput.addEventListener('change', e => {
            this.handleFileSelect(e.target.files);
        });
    }

    // 处理文件选择
    handleFileSelect(files) {
        if (files.length === 0) {return;}

        const validFiles = Array.from(files).filter(file => {
            const validTypes = ['.json', '.csv', '.xlsx', '.xls'];
            const fileExtension = `.${  file.name.split('.').pop().toLowerCase()}`;
            return validTypes.includes(fileExtension);
        });

        if (validFiles.length === 0) {
            this.showMessage('请选择有效的文件格式（JSON, CSV, Excel）', 'error');
            return;
        }

        this.processImportFiles(validFiles);
    }

    // 处理导入文件
    async processImportFiles(files) {
        const preview = document.getElementById('importPreview');
        const previewContent = document.getElementById('previewContent');

        if (!preview || !previewContent) {return;}

        preview.style.display = 'block';

        let previewHTML = '<h4>文件预览</h4>';
        const allData = [];

        for (const file of files) {
            previewHTML += `<div class="file-preview-item">
                <h5><i class="fas fa-file"></i> ${file.name}</h5>
                <p>大小: ${(file.size / 1024).toFixed(2)} KB</p>
            </div>`;

            try {
                const data = await this.parseFile(file);
                allData.push(...data);
            } catch (error) {
                this.showMessage(`解析文件 ${file.name} 失败: ${error.message}`, 'error');
            }
        }

        previewHTML += `<div class="import-stats">
            <p>总计解析 ${allData.length} 条数据</p>
        </div>`;

        previewContent.innerHTML = previewHTML;

        // 保存到临时变量
        this.tempImportData = allData;
    }

    // 解析文件
    async parseFile(file) {
        const extension = `.${  file.name.split('.').pop().toLowerCase()}`;

        if (extension === '.json') {
            const text = await file.text();
            const data = JSON.parse(text);
            return Array.isArray(data) ? data : [data];
        } else if (extension === '.csv') {
            // 简单的CSV解析（实际项目中建议使用专门的库）
            const text = await file.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header.trim()] = values[index]?.trim() || '';
                    });
                    data.push(obj);
                }
            }
            return data;
        } else {
            throw new Error('不支持的文件格式');
        }
    }

    // 确认导入
    async confirmImport() {
        if (!this.tempImportData || this.tempImportData.length === 0) {
            this.showMessage('没有数据可以导入', 'error');
            return;
        }

        try {
            const response = await this.apiCall('/admin/import', {
                method: 'POST',
                body: JSON.stringify({
                    data: this.tempImportData,
                    autoPublish: document.getElementById('autoPublish')?.checked,
                    updateExisting: document.getElementById('updateExisting')?.checked,
                    sendNotification: document.getElementById('sendNotification')?.checked,
                }),
            });

            if (response.success) {
                this.showMessage(`成功导入 ${this.tempImportData.length} 条数据`, 'success');
                this.cancelImport();

                // 重新加载数据
                if (this.currentModule === 'knowledge') {
                    this.loadKnowledgeContent(this.currentKnowledgeModule, this.currentSubModule);
                }
            }
        } catch (error) {
            this.showMessage(`导入失败: ${  error.message}`, 'error');
        }
    }

    // 取消导入
    cancelImport() {
        const preview = document.getElementById('importPreview');
        if (preview) {
            preview.style.display = 'none';
        }
        this.tempImportData = null;
        document.getElementById('fileInput').value = '';
    }

    // 加载维护模块选择
    async loadMaintainModuleSelect() {
        const select = document.getElementById('maintainModuleSelect');
        if (!select) {return;}

        select.innerHTML =
            `<option value="">选择模块</option>${ 
            Object.values(this.knowledgeModuleConfig)
                .map(module => `<option value="${module.id}">${module.name}</option>`)
                .join('')}`;
    }

    // 加载知识维护列表
    loadKnowledgeMaintainList() {
        const container = document.getElementById('knowledgeMaintainList');
        if (!container) {return;}

        container.innerHTML = '<p>请先选择一个模块</p>';
    }

    // 加载用户统计
    loadUserStats() {
        // 模拟用户统计数据
        document.getElementById('totalUsers').textContent = '156';
        document.getElementById('activeUsers').textContent = '89';
        document.getElementById('newUsers').textContent = '12';
    }

    // 加载用户列表
    loadUserList() {
        const container = document.getElementById('userList');
        if (!container) {return;}

        // 模拟用户列表
        const mockUsers = [
            { id: 1, name: '张三', role: 'admin', status: 'active', lastLogin: '2026-01-29' },
            { id: 2, name: '李四', role: 'student', status: 'active', lastLogin: '2026-01-28' },
            {
                id: 3,
                name: '王五',
                role: 'student',
                status: 'inactive',
                lastLogin: '2026-01-25',
            },
        ];

        container.innerHTML = mockUsers
            .map(
                user => `
            <div class="user-item">
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p>角色: ${this.getRoleText(user.role)} | 最后登录: ${user.lastLogin}</p>
                </div>
                <div class="user-actions">
                    <span class="status-badge status-${user.status}">${user.status === 'active' ? '活跃' : '非活跃'}</span>
                    <button class="btn-secondary" onclick="app.editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `
            )
            .join('');
    }

    // ===== AI推荐功能 =====

    // 切换AI抽屉
    toggleAiDrawer() {
        const drawer = document.getElementById('aiDrawer');
        const overlay = document.getElementById('aiDrawerOverlay');

        if (drawer.classList.contains('show')) {
            drawer.classList.remove('show');
            overlay.classList.remove('show');
        } else {
            drawer.classList.add('show');
            overlay.classList.add('show');
            // 加载AI推荐
            this.loadAiRecommendations();
        }
    }

    // 加载AI推荐
    async loadAiRecommendations() {
        const container = document.getElementById('aiRecommendations');
        if (!container) {return;}

        // 显示加载状态
        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>加载智能建议...</p>
            </div>
        `;

        if (!this.currentUser || !this.token) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lock"></i>
                    <p>请先登录以获取个性化学习建议</p>
                    <button class="btn btn-primary" onclick="app.showLoginModal()">立即登录</button>
                </div>
            `;
            return;
        }

        try {
            // 设置超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.apiBase}/ai-recommendations/recommendations`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
                signal: controller.signal,
            });

            // 清除超时
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                this.renderAiRecommendations(data.recommendations);

                // 更新徽章
                const badge = document.getElementById('aiBadge');
                if (badge) {
                    badge.textContent = data.total || 0;
                    badge.style.display = data.total > 0 ? 'flex' : 'none';
                }
            } else {
                throw new Error('加载推荐失败');
            }
        } catch (error) {
            console.error('加载AI推荐失败:', error);
            if (error.name === 'AbortError') {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clock"></i>
                        <p>请求超时，请稍后重试</p>
                        <button class="btn btn-secondary" onclick="app.loadAiRecommendations()">重试</button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>加载智能建议失败，请稍后重试</p>
                        <button class="btn btn-secondary" onclick="app.loadAiRecommendations()">重试</button>
                    </div>
                `;
            }
        }
    }

    // 渲染AI推荐
    renderAiRecommendations(recommendations) {
        const container = document.getElementById('aiRecommendations');
        if (!container) {return;}

        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-smile"></i>
                    <p>暂无智能学习建议</p>
                    <p style="font-size: 12px; color: #999;">完成更多学习任务后，AI将为您提供个性化建议</p>
                </div>
            `;
            return;
        }

        let html = '';

        recommendations.forEach(group => {
            const priorityClass =
                group.priority === 'high'
                    ? 'high-priority'
                    : group.priority === 'medium'
                      ? 'medium-priority'
                      : 'low-priority';

            html += `
                <div class="ai-recommendation-group ${priorityClass}">
                    <div class="group-header">
                        <i class="fas ${group.icon}"></i>
                        <span class="group-title">${group.title}</span>
                    </div>
                    <div class="group-items">
            `;

            group.items.forEach(item => {
                html += `
                    <div class="ai-recommendation-item" onclick="app.handleRecommendationClick('${group.type}', '${item.topic || item.name || ''}', '${item.actionUrl || ''}')">
                        <div class="item-content">
                            <i class="fas fa-lightbulb"></i>
                            <div class="item-text">
                                <div class="item-message">${item.message || item.topic || ''}</div>
                                ${item.subtext ? `<div class="item-subtext">${item.subtext}</div>` : ''}
                            </div>
                        </div>
                        ${item.urgent ? '<span class="item-urgent">紧急</span>' : ''}
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // 处理推荐点击
    handleRecommendationClick(type, topic, actionUrl) {
        if (actionUrl && actionUrl.startsWith('#')) {
            // 导航到模块
            const targetId = actionUrl.replace('#', '');
            this.showModule(targetId);
        } else if (actionUrl && actionUrl.startsWith('/')) {
            // 导航到页面
            window.location.href = actionUrl;
        } else {
            // 显示提示
            this.showMessage(`前往：${topic}`, 'info');
        }

        // 关闭抽屉
        this.toggleAiDrawer();
    }

    // 刷新AI推荐
    async refreshAiRecommendations() {
        await this.loadAiRecommendations();
        this.showMessage('智能建议已刷新', 'success');
    }

    // 记录学习活动
    async recordLearningActivity(module, topic, itemType, itemId, score, timeSpent) {
        if (!this.currentUser || !this.token) {return;}

        try {
            // 设置超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.apiBase}/ai-recommendations/activity`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    module,
                    topic,
                    itemType,
                    itemId,
                    score,
                    timeSpent: timeSpent || 0,
                }),
                signal: controller.signal,
            });

            // 清除超时
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return data.progress;
            }
        } catch (error) {
            console.error('记录学习活动失败:', error);
            if (error.name === 'AbortError') {
                console.error('记录学习活动请求超时');
            }
        }
        return null;
    }

    // 获取学习进度统计
    async getLearningProgressStats() {
        if (!this.currentUser || !this.token) {return null;}

        try {
            // 设置超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.apiBase}/ai-recommendations/progress-stats`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
                signal: controller.signal,
            });

            // 清除超时
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return data.stats;
            }
        } catch (error) {
            console.error('获取学习进度失败:', error);
            if (error.name === 'AbortError') {
                console.error('获取学习进度请求超时');
            }
        }
        return null;
    }

    // 重写学习函数以记录活动
    async startLearning(module, topic) {
        if (!this.currentUser) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return;
        }

        // 显示学习界面
        const topicName = topic || module;
        this.showMessage(`开始学习：${topicName}`, 'info');

        // 记录学习活动
        await this.recordLearningActivity(
            module,
            topic,
            'learning_start',
            `${module}_${topic}`,
            null,
            0
        );

        // 这里可以添加更多学习逻辑
        // 例如打开学习模态框、加载学习内容等
    }

    // 重写收藏函数以记录活动
    async bookmarkContent(module, topic) {
        const topicName = topic || module;

        // 切换收藏状态
        const isBookmarked = !this.isBookmarked(module, topic);

        // 保存收藏状态
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
        const key = `${module}_${topic}`;
        bookmarks[key] = isBookmarked;
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

        // 记录活动
        await this.recordLearningActivity(module, topic, 'bookmark', key, null, 0);

        this.showMessage(isBookmarked ? '已收藏' : '已取消收藏', 'success');

        // 更新UI
        this.updateBookmarkUI(module, topic, isBookmarked);
    }

    // 检查是否已收藏
    isBookmarked(module, topic) {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
        const key = `${module}_${topic}`;
        return bookmarks[key] || false;
    }

    // 更新收藏UI
    updateBookmarkUI(module, topic, isBookmarked) {
        const buttons = document.querySelectorAll(
            `[onclick*="bookmarkContent('${module}', '${topic}')"]`
        );
        buttons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fas', isBookmarked);
                icon.classList.toggle('far', !isBookmarked);
            }
        });
    }

    // ===== 智能答疑功能 =====

    // 发送聊天消息
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) {
            this.showMessage('请输入消息', 'warning');
            return;
        }

        // 显示用户消息
        this.addChatMessage('user', message);

        // 清空输入框
        input.value = '';

        // 发送到后端
        try {
            const response = await fetch(`${this.apiBase}/ai-analysis/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    sessionId: this.currentUser?.id || 'default',
                }),
            });

            if (response.ok) {
                const result = await response.json();
                this.addChatMessage('system', result.response);
            } else {
                throw new Error('发送消息失败');
            }
        } catch (error) {
            console.error('发送聊天消息失败:', error);
            this.addChatMessage('system', '抱歉，处理您的请求时出现了问题。请稍后重试。');
        }
    }

    // 添加聊天消息到界面
    addChatMessage(type, content) {
        const container = document.getElementById('chatMessages');
        if (!container) {return;}

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;

        let html = '';

        if (type === 'user') {
            html = `
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <p>${this.escapeHtml(content)}</p>
                </div>
            `;
        } else {
            // 处理系统消息（支持markdown格式）
            html = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    ${this.formatMarkdown(content)}
                </div>
            `;
        }

        messageDiv.innerHTML = html;
        container.appendChild(messageDiv);

        // 滚动到底部
        container.scrollTop = container.scrollHeight;

        // 保存到本地存储
        this.saveChatHistory(type, content);
    }

    // 格式化Markdown文本
    formatMarkdown(text) {
        // 简单的markdown格式化
        return text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/(\d+\.\s)/g, '<br>$1');
    }

    // 快速提问
    askQuickQuestion(question) {
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = question;
            this.sendChatMessage();
        }
    }

    // 清空聊天历史
    clearChatHistory() {
        if (!confirm('确定要清空聊天记录吗？')) {
            return;
        }

        localStorage.removeItem('chatHistory');
        this.initChatMessages();
        this.showMessage('聊天记录已清空', 'success');
    }

    // 导出聊天记录
    exportChatHistory() {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');

        if (history.length === 0) {
            this.showMessage('没有聊天记录可以导出', 'warning');
            return;
        }

        // 生成文本
        let content = '测井专业智能答疑对话记录\n';
        content += `导出时间: ${  new Date().toLocaleString()  }\n`;
        content += '=================================\n\n';

        history.forEach(msg => {
            const type = msg.type === 'user' ? '用户' : 'AI';
            const time = new Date(msg.timestamp).toLocaleTimeString();
            content += `[${time}] ${type}:\n${msg.content}\n\n`;
        });

        // 创建下载
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-history-${Date.now()}.txt`;
        link.click();

        URL.revokeObjectURL(url);
        this.showMessage('聊天记录已导出', 'success');
    }

    // 保存聊天历史
    saveChatHistory(type, content) {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');

        history.push({
            type,
            content,
            timestamp: Date.now(),
        });

        // 限制历史记录数量
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        localStorage.setItem('chatHistory', JSON.stringify(history));

        // 更新今日对话计数
        const today = new Date().toDateString();
        const todayMessages = history.filter(msg => {
            return msg.type === 'user' && new Date(msg.timestamp).toDateString() === today;
        }).length;

        const countElement = document.querySelector('#chat .progress-text span:last-child');
        if (countElement) {
            countElement.textContent = `${todayMessages} 条`;
        }
    }

    // 初始化聊天消息
    initChatMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) {return;}

        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');

        // 清空容器，保留系统欢迎消息
        const systemMessage = container.querySelector('.chat-message.system');
        container.innerHTML = '';
        if (systemMessage) {
            container.appendChild(systemMessage);
        }

        // 加载历史消息
        history.forEach(msg => {
            if (msg.type === 'user' || msg.type === 'system') {
                this.addChatMessageToDOM(msg.type, msg.content, false);
            }
        });

        // 更新今日对话计数
        const today = new Date().toDateString();
        const todayMessages = history.filter(msg => {
            return msg.type === 'user' && new Date(msg.timestamp).toDateString() === today;
        }).length;

        const countElement = document.querySelector('#chat .progress-text span:last-child');
        if (countElement) {
            countElement.textContent = `${todayMessages} 条`;
        }
    }

    // 添加消息到DOM（不保存）
    addChatMessageToDOM(type, content, save = true) {
        const container = document.getElementById('chatMessages');
        if (!container) {return;}

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;

        let html = '';

        if (type === 'user') {
            html = `
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <p>${this.escapeHtml(content)}</p>
                </div>
            `;
        } else {
            html = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    ${this.formatMarkdown(content)}
                </div>
            `;
        }

        messageDiv.innerHTML = html;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;

        if (save) {
            this.saveChatHistory(type, content);
        }
    }

    // HTML转义（防止XSS）
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== 考试模块API对接 =====

    // 获取考试列表
    async loadExamList(module) {
        if (!this.currentUser || !this.token) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return [];
        }

        try {
            const response = await fetch(`${this.apiBase}/exams?module=${module || ''}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.exams || [];
            } else {
                throw new Error('加载考试列表失败');
            }
        } catch (error) {
            console.error('加载考试列表失败:', error);
            this.showMessage('加载考试列表失败', 'error');
            return [];
        }
    }

    // 获取考试详情
    async getExamDetail(examId) {
        if (!this.currentUser || !this.token) {
            this.showMessage('请先登录', 'warning');
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/exams/${examId}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.exam;
            } else {
                throw new Error('加载考试详情失败');
            }
        } catch (error) {
            console.error('加载考试详情失败:', error);
            this.showMessage('加载考试详情失败', 'error');
            return null;
        }
    }

    // 开始考试
    async startExam(examId) {
        if (!this.currentUser || !this.token) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/exams/${examId}/start`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.showMessage('考试已开始，请在规定时间内完成', 'success');
                return data;
            } else {
                const data = await response.json();
                this.showMessage(data.message || '开始考试失败', 'error');
                return null;
            }
        } catch (error) {
            console.error('开始考试失败:', error);
            this.showMessage('开始考试失败', 'error');
            return null;
        }
    }

    // 提交考试
    async submitExam(examResultId, answers) {
        if (!this.currentUser || !this.token) {
            this.showMessage('请先登录', 'warning');
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/exams/${examResultId}/submit`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers,
                    endTime: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.showMessage(`考试提交成功！得分：${data.result.score}分`, 'success');
                return data.result;
            } else {
                const data = await response.json();
                this.showMessage(data.message || '提交考试失败', 'error');
                return null;
            }
        } catch (error) {
            console.error('提交考试失败:', error);
            this.showMessage('提交考试失败', 'error');
            return null;
        }
    }

    // 获取考试结果
    async getExamResult(resultId) {
        if (!this.currentUser || !this.token) {
            this.showMessage('请先登录', 'warning');
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/exams/result/${resultId}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.result;
            } else {
                throw new Error('获取考试结果失败');
            }
        } catch (error) {
            console.error('获取考试结果失败:', error);
            this.showMessage('获取考试结果失败', 'error');
            return null;
        }
    }

    // 获取用户考试历史
    async getUserExamHistory() {
        if (!this.currentUser || !this.token) {
            return [];
        }

        try {
            const response = await fetch(`${this.apiBase}/exams/history/user`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.results || [];
            } else {
                throw new Error('获取考试历史失败');
            }
        } catch (error) {
            console.error('获取考试历史失败:', error);
            return [];
        }
    }

    // 渲染考试列表到模块
    async renderExamModule() {
        const container = document.querySelector('#exam .module-content');
        if (!container) {return;}

        container.innerHTML =
            '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>加载考试列表...</p></div>';

        const exams = await this.loadExamList();

        if (exams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>暂无考试</p>
                </div>
            `;
            return;
        }

        let html = '';
        exams.forEach(exam => {
            const difficultyText =
                exam.difficulty === 'easy'
                    ? '简单'
                    : exam.difficulty === 'medium'
                      ? '中等'
                      : '困难';

            html += `
                <div class="knowledge-card">
                    <h3><i class="fas fa-file-alt"></i> ${exam.title}</h3>
                    <p>${exam.description || ''}</p>
                    <div class="exam-meta">
                        <span><i class="fas fa-clock"></i> ${exam.timeLimit || 60}分钟</span>
                        <span><i class="fas fa-signal"></i> ${difficultyText}</span>
                        <span><i class="fas fa-question-circle"></i> ${exam.questions?.length || 0}题</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-small" onclick="app.startExamAndDisplay('${exam._id}')">
                            <i class="fas fa-play"></i> 开始考试
                        </button>
                        <button class="btn-small" onclick="app.viewExamHistory()">
                            <i class="fas fa-history"></i> 历史成绩
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // 开始考试并显示考试界面
    async startExamAndDisplay(examId) {
        const examData = await this.startExam(examId);
        if (!examData) {return;}

        // 显示考试界面
        this.showExamInterface(examData);
    }

    // 显示考试界面
    showExamInterface(examData) {
        const modal = document.createElement('div');
        modal.className = 'modal exam-modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><i class="fas fa-clock"></i> 考试进行中</h3>
                    <button class="close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="exam-info">
                        <div class="time-remaining">
                            <span id="examTimer">00:00</span>
                        </div>
                        <div class="exam-progress">
                            <span id="examProgress">1/${examData.questions.length}</span>
                        </div>
                    </div>
                    <div class="questions-container" id="questionsContainer">
                        ${examData.questions
                            .map(
                                (q, index) => `
                            <div class="question-item" data-index="${index}" ${index > 0 ? 'style="display:none"' : ''}>
                                <h4>${index + 1}. ${q.questionText || ''}</h4>
                                <div class="question-options">
                                    ${(q.options || [])
                                        .map(
                                            (opt, optIndex) => `
                                        <label class="option-label">
                                            <input type="radio" name="q${index}" value="${optIndex}">
                                            <span>${opt}</span>
                                        </label>
                                    `
                                        )
                                        .join('')}
                                </div>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                    <div class="exam-actions">
                        <button class="btn btn-secondary" onclick="app.prevQuestion()" id="prevBtn" disabled>
                            <i class="fas fa-chevron-left"></i> 上一题
                        </button>
                        <button class="btn btn-primary" onclick="app.nextQuestion()" id="nextBtn">
                            下一题 <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-accent" onclick="app.submitCurrentExam('${examData.examResult.id}')" id="submitBtn" style="display:none;">
                            <i class="fas fa-check"></i> 提交考试
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        modal.querySelector('.close').addEventListener('click', () => {
            if (confirm('考试进行中，确定要退出吗？')) {
                modal.remove();
            }
        });

        // 保存考试数据
        this.currentExam = examData;
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(examData.questions.length).fill(null);

        // 启动计时器
        this.startExamTimer(examData.timeLimit);
    }

    // 考试计时器
    startExamTimer(timeLimit) {
        let remainingSeconds = timeLimit * 60;

        const updateTimer = () => {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            const timerElement = document.getElementById('examTimer');
            if (timerElement) {
                timerElement.textContent = timerDisplay;

                if (remainingSeconds <= 60) {
                    timerElement.classList.add('urgent');
                }
            }

            if (remainingSeconds <= 0) {
                clearInterval(this.examTimer);
                this.showMessage('考试时间到，自动提交', 'warning');
                this.submitCurrentExam(this.currentExam.examResult.id);
            }

            remainingSeconds--;
        };

        this.examTimer = setInterval(updateTimer, 1000);
        updateTimer();
    }

    // 上一题
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.saveCurrentAnswer();
            this.currentQuestionIndex--;
            this.updateQuestionDisplay();
        }
    }

    // 下一题
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentExam.questions.length - 1) {
            this.saveCurrentAnswer();
            this.currentQuestionIndex++;
            this.updateQuestionDisplay();
        }
    }

    // 保存当前答案
    saveCurrentAnswer() {
        const selectedOption = document.querySelector(
            `input[name="q${this.currentQuestionIndex}"]:checked`
        );
        if (selectedOption) {
            this.userAnswers[this.currentQuestionIndex] = parseInt(selectedOption.value);
        }
    }

    // 更新题目显示
    updateQuestionDisplay() {
        const questionItems = document.querySelectorAll('.question-item');
        questionItems.forEach((item, index) => {
            item.style.display = index === this.currentQuestionIndex ? 'block' : 'none';
        });

        // 更新进度
        const progressElement = document.getElementById('examProgress');
        if (progressElement) {
            progressElement.textContent = `${this.currentQuestionIndex + 1}/${this.currentExam.questions.length}`;
        }

        // 更新按钮状态
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (prevBtn) {prevBtn.disabled = this.currentQuestionIndex === 0;}
        if (nextBtn)
            {nextBtn.style.display =
                this.currentQuestionIndex === this.currentExam.questions.length - 1
                    ? 'none'
                    : 'inline-block';}
        if (submitBtn)
            {submitBtn.style.display =
                this.currentQuestionIndex === this.currentExam.questions.length - 1
                    ? 'inline-block'
                    : 'none';}
    }

    // 提交当前考试
    async submitCurrentExam(examResultId) {
        // 保存最后一个答案
        this.saveCurrentAnswer();

        // 停止计时器
        if (this.examTimer) {
            clearInterval(this.examTimer);
        }

        // 提交答案
        await this.submitExam(examResultId, this.userAnswers);

        // 关闭考试界面
        const modal = document.querySelector('.exam-modal');
        if (modal) {modal.remove();}

        // 重新加载考试列表
        this.renderExamModule();
    }

    // 查看考试历史
    async viewExamHistory() {
        const history = await this.getUserExamHistory();

        if (history.length === 0) {
            this.showMessage('暂无考试历史记录', 'info');
            return;
        }

        // 显示历史记录界面
        const modal = document.createElement('div');
        modal.className = 'modal history-modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> 考试历史</h3>
                    <button class="close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="history-list">
                        ${history
                            .map(
                                result => `
                            <div class="history-item">
                                <div class="history-info">
                                    <h4>${result.exam?.title || '未知考试'}</h4>
                                    <p>考试时间：${new Date(result.startTime).toLocaleString()}</p>
                                    <p>用时：${Math.floor(result.timeSpent / 60)}分${result.timeSpent % 60}秒</p>
                                </div>
                                <div class="history-score">
                                    <span class="${result.passed ? 'passed' : 'failed'}">
                                        ${result.score}分
                                    </span>
                                    <small>${result.passed ? '通过' : '未通过'}</small>
                                </div>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // ===== 案例学习模块API对接 =====

    // 获取案例列表
    async loadCaseList(module) {
        if (!this.currentUser || !this.token) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return [];
        }

        try {
            const response = await fetch(`${this.apiBase}/cases?module=${module || ''}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.cases || [];
            } else {
                throw new Error('加载案例列表失败');
            }
        } catch (error) {
            console.error('加载案例列表失败:', error);
            this.showMessage('加载案例列表失败', 'error');
            return [];
        }
    }

    // 获取案例详情
    async getCaseDetail(caseId) {
        if (!this.currentUser || !this.token) {
            this.showMessage('请先登录', 'warning');
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/cases/${caseId}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.case;
            } else {
                throw new Error('加载案例详情失败');
            }
        } catch (error) {
            console.error('加载案例详情失败:', error);
            this.showMessage('加载案例详情失败', 'error');
            return null;
        }
    }

    // 创建案例
    async createCase(caseData) {
        if (!this.currentUser || !this.token) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/cases`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(caseData),
            });

            if (response.ok) {
                const data = await response.json();
                this.showMessage('案例提交成功，等待审核', 'success');
                return data.case;
            } else {
                const data = await response.json();
                this.showMessage(data.message || '创建案例失败', 'error');
                return null;
            }
        } catch (error) {
            console.error('创建案例失败:', error);
            this.showMessage('创建案例失败', 'error');
            return null;
        }
    }

    // 提取关键词
    async extractKeywords(text) {
        try {
            const response = await fetch(`${this.apiBase}/cases/extract-keywords`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (response.ok) {
                const data = await response.json();
                return data.keywords || [];
            } else {
                throw new Error('提取关键词失败');
            }
        } catch (error) {
            console.error('提取关键词失败:', error);
            return [];
        }
    }

    // 渲染案例列表到模块
    async renderCaseModule() {
        const container = document.querySelector('#cases .module-content');
        if (!container) {return;}

        container.innerHTML =
            '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>加载案例列表...</p></div>';

        const cases = await this.loadCaseList();

        if (cases.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-reader"></i>
                    <p>暂无案例</p>
                </div>
            `;
            return;
        }

        let html = '';
        cases.forEach(caseData => {
            const difficultyText =
                caseData.difficulty === 'easy'
                    ? '简单'
                    : caseData.difficulty === 'medium'
                      ? '中等'
                      : '困难';

            html += `
                <div class="knowledge-card">
                    <h3><i class="fas fa-book"></i> ${caseData.title}</h3>
                    <p>${caseData.description || ''}</p>
                    <div class="case-meta">
                        <span><i class="fas fa-folder"></i> ${caseData.category}</span>
                        <span><i class="fas fa-signal"></i> ${difficultyText}</span>
                        <span><i class="fas fa-eye"></i> ${caseData.viewCount || 0}次浏览</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-small" onclick="app.startCaseStudy('${caseData._id}')">
                            <i class="fas fa-play"></i> 开始学习
                        </button>
                        <button class="btn-small" onclick="app.bookmarkContent('cases', '${caseData._id}')">
                            <i class="fas fa-bookmark"></i> 收藏
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // 开始案例学习
    async startCaseStudy(caseId) {
        const caseDetail = await this.getCaseDetail(caseId);
        if (!caseDetail) {return;}

        // 记录学习活动
        await this.recordLearningActivity('cases', caseId, 'case_study', caseId, null, 0);

        // 显示案例详情界面
        this.showCaseDetail(caseDetail);
    }

    // 显示案例创建表单
    showCaseCreator() {
        if (!this.currentUser) {
            this.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal case-creator-modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> 创建新案例</h3>
                    <button class="close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <form id="caseCreatorForm">
                        <div class="form-group">
                            <label>案例标题 *</label>
                            <input type="text" name="title" required placeholder="请输入案例标题">
                        </div>
                        <div class="form-group">
                            <label>案例描述 *</label>
                            <textarea name="description" required placeholder="简要描述案例内容"></textarea>
                        </div>
                        <div class="form-group">
                            <label>分类 *</label>
                            <select name="category" required>
                                <option value="reservoir_evaluation">储层评价</option>
                                <option value="drilling">钻井工程</option>
                                <option value="production">生产测井</option>
                                <option value="trouble_shooting">故障排除</option>
                                <option value="new_technology">新技术应用</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>问题描述 *</label>
                            <textarea name="problemStatement" required placeholder="描述遇到的问题"></textarea>
                        </div>
                        <div class="form-group">
                            <label>分析过程 *</label>
                            <textarea name="analysisProcess" required placeholder="详细描述分析过程"></textarea>
                        </div>
                        <div class="form-group">
                            <label>解决方案 *</label>
                            <textarea name="solution" required placeholder="描述解决方案"></textarea>
                        </div>
                        <div class="form-group">
                            <label>关键词（自动提取）</label>
                            <input type="text" name="keywords" placeholder="保存后自动提取关键词">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> 提交案例
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        modal.querySelector('.close').addEventListener('click', () => {
            modal.remove();
        });

        // 绑定表单提交
        modal.querySelector('form').addEventListener('submit', async e => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const caseData = {
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                problemStatement: formData.get('problemStatement'),
                analysisProcess: formData.get('analysisProcess'),
                solution: formData.get('solution'),
            };

            await this.createCase(caseData);
            modal.remove();

            // 重新加载案例列表
            this.renderCaseModule();
        });

        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// 初始化应用
const app = new WellLoggingTrainingApp();

// 全局函数，供HTML调用
window.app = app;

// 兼容旧版HTML的全局函数
window.switchToModule = function (targetId) {
    if (window.app && typeof window.app.showModule === 'function') {
        window.app.showModule(targetId);
    } else {
        console.warn('App not initialized yet');
    }
};

window.toggleExpand = function (moduleId) {
    if (window.app && typeof window.app.toggleExpand === 'function') {
        window.app.toggleExpand(moduleId);
    } else {
        console.warn('App not initialized yet');
    }
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOM加载完成，应用初始化');
    });
}
