/**
 * 单位管理器
 * 管理监督站信息、存储配额、模块权限
 */

class OrganizationManager {
    constructor() {
        this.currentOrg = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOrganization();
        this.loadStats();
    }

    bindEvents() {
        // 编辑按钮
        const editBtn = document.getElementById('edit-org-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.openEditModal());
        }

        // 表单提交
        const form = document.getElementById('org-form');
        if (form) {
            form.addEventListener('submit', e => this.handleSubmit(e));
        }

        // 模态框关闭
        const closeBtns = document.querySelectorAll('.modal-close, [data-close-modal]');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // 存储配额滑块
        const quotaSlider = document.getElementById('storage-quota');
        if (quotaSlider) {
            quotaSlider.addEventListener('input', e => {
                document.getElementById('quota-display').textContent = `${e.target.value} GB`;
            });
        }

        // 模块权限开关
        const moduleToggles = document.querySelectorAll('.module-toggle');
        moduleToggles.forEach(toggle => {
            toggle.addEventListener('change', e => {
                this.updateModuleStatus(e.target.dataset.module, e.target.checked);
            });
        });
    }

    // 加载单位信息
    async loadOrganization() {
        try {
            // 获取当前用户的单位信息
            const response = await fetch('/api/organizations/current', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('加载失败');}

            const org = await response.json();
            this.currentOrg = org;
            this.renderOrganizationInfo(org);
        } catch (error) {
            console.error('加载单位信息失败:', error);
            // 使用默认数据
            this.renderOrganizationInfo(this.getDefaultOrg());
        }
    }

    // 获取默认单位信息
    getDefaultOrg() {
        return {
            name: '测井监督站',
            code: 'WLS-001',
            type: 'supervision',
            description: '负责测井作业现场监督和培训工作',
            contact: {
                name: '张主任',
                phone: '010-12345678',
                email: 'contact@wls.com',
            },
            storageQuota: 100,
            storageUsed: 45.5,
            modules: {
                knowledge: true,
                cases: true,
                exams: true,
                training: true,
            },
            createdAt: '2024-01-15',
        };
    }

    // 渲染单位信息
    renderOrganizationInfo(org) {
        // 基本信息
        const nameEl = document.getElementById('org-name');
        const codeEl = document.getElementById('org-code');
        const typeEl = document.getElementById('org-type');
        const descEl = document.getElementById('org-description');

        if (nameEl) {nameEl.textContent = org.name;}
        if (codeEl) {codeEl.textContent = `编码: ${org.code}`;}
        if (typeEl) {typeEl.textContent = org.type === 'supervision' ? '监督站' : '建设单位';}
        if (descEl) {descEl.textContent = org.description || '暂无描述';}

        // 联系信息
        const contactNameEl = document.getElementById('contact-name');
        const contactPhoneEl = document.getElementById('contact-phone');
        const contactEmailEl = document.getElementById('contact-email');

        if (contactNameEl) {contactNameEl.textContent = org.contact?.name || '-';}
        if (contactPhoneEl) {contactPhoneEl.textContent = org.contact?.phone || '-';}
        if (contactEmailEl) {contactEmailEl.textContent = org.contact?.email || '-';}

        // 存储使用
        this.renderStorageUsage(org.storageUsed || 0, org.storageQuota || 100);

        // 模块状态
        this.renderModuleStatus(org.modules || {});
    }

    // 渲染存储使用情况
    renderStorageUsage(used, quota) {
        const percentage = ((used / quota) * 100).toFixed(1);
        const usedEl = document.getElementById('storage-used');
        const quotaEl = document.getElementById('storage-quota-display');
        const percentageEl = document.getElementById('storage-percentage');
        const progressEl = document.getElementById('storage-progress');

        if (usedEl) {usedEl.textContent = `${used.toFixed(1)} GB`;}
        if (quotaEl) {quotaEl.textContent = `${quota} GB`;}
        if (percentageEl) {percentageEl.textContent = `${percentage}%`;}
        if (progressEl) {
            progressEl.style.width = `${percentage}%`;

            // 根据使用率改变颜色
            progressEl.className = 'progress-bar';
            if (percentage >= 90) {
                progressEl.classList.add('danger');
            } else if (percentage >= 70) {
                progressEl.classList.add('warning');
            } else {
                progressEl.classList.add('success');
            }
        }
    }

    // 渲染模块状态
    renderModuleStatus(modules) {
        const container = document.getElementById('modules-status');
        if (!container) {return;}

        const moduleNames = {
            knowledge: '知识库',
            cases: '案例库',
            exams: '考试中心',
            training: '培训管理',
        };

        container.innerHTML = Object.entries(modules)
            .map(([key, enabled]) => {
                const name = moduleNames[key] || key;
                return `
                <div class="module-status-item ${enabled ? 'enabled' : 'disabled'}">
                    <i class="fas ${enabled ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    <span>${name}</span>
                    <span class="module-status-text">${enabled ? '已启用' : '已禁用'}</span>
                </div>
            `;
            })
            .join('');
    }

    // 加载统计数据
    async loadStats() {
        try {
            const response = await fetch('/api/organizations/stats', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('加载失败');}

            const stats = await response.json();
            this.renderStats(stats);
        } catch (error) {
            console.error('加载统计数据失败:', error);
            // 使用默认数据
            this.renderStats({
                totalUsers: 156,
                activeUsers: 142,
                totalKnowledge: 328,
                totalCases: 85,
                avgScore: 87.5,
                completionRate: 92.3,
            });
        }
    }

    // 渲染统计数据
    renderStats(stats) {
        const statsMap = {
            'stat-total-users': stats.totalUsers,
            'stat-active-users': stats.activeUsers,
            'stat-knowledge': stats.totalKnowledge,
            'stat-cases': stats.totalCases,
            'stat-avg-score': stats.avgScore?.toFixed(1),
            'stat-completion': `${stats.completionRate?.toFixed(1)  }%`,
        };

        Object.entries(statsMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {el.textContent = value || '0';}
        });
    }

    // 打开编辑模态框
    openEditModal() {
        if (!this.currentOrg) {return;}

        const org = this.currentOrg;

        document.getElementById('org-name-input').value = org.name;
        document.getElementById('org-code-input').value = org.code;
        document.getElementById('org-type-input').value = org.type;
        document.getElementById('org-desc-input').value = org.description || '';
        document.getElementById('contact-name-input').value = org.contact?.name || '';
        document.getElementById('contact-phone-input').value = org.contact?.phone || '';
        document.getElementById('contact-email-input').value = org.contact?.email || '';
        document.getElementById('storage-quota').value = org.storageQuota || 100;
        document.getElementById('quota-display').textContent = `${org.storageQuota || 100} GB`;

        // 设置模块权限
        const modules = org.modules || {};
        Object.entries(modules).forEach(([key, enabled]) => {
            const toggle = document.querySelector(`[data-module="${key}"]`);
            if (toggle) {toggle.checked = enabled;}
        });

        const modal = document.getElementById('org-modal');
        if (modal) {modal.classList.add('active');}
    }

    // 处理表单提交
    async handleSubmit(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById('org-name-input').value,
            code: document.getElementById('org-code-input').value,
            type: document.getElementById('org-type-input').value,
            description: document.getElementById('org-desc-input').value,
            contact: {
                name: document.getElementById('contact-name-input').value,
                phone: document.getElementById('contact-phone-input').value,
                email: document.getElementById('contact-email-input').value,
            },
            storageQuota: parseInt(document.getElementById('storage-quota').value),
            modules: {
                knowledge: document.querySelector('[data-module="knowledge"]')?.checked ?? true,
                cases: document.querySelector('[data-module="cases"]')?.checked ?? true,
                exams: document.querySelector('[data-module="exams"]')?.checked ?? true,
                training: document.querySelector('[data-module="training"]')?.checked ?? true,
            },
        };

        try {
            const response = await fetch('/api/organizations/current', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {throw new Error('保存失败');}

            const updatedOrg = await response.json();
            this.currentOrg = updatedOrg;
            this.renderOrganizationInfo(updatedOrg);

            this.showNotification('单位信息更新成功', 'success');
            this.closeModal();
        } catch (error) {
            console.error('更新单位信息失败:', error);
            this.showNotification('保存失败，请重试', 'error');
        }
    }

    // 更新模块状态
    async updateModuleStatus(moduleKey, enabled) {
        try {
            const response = await fetch(`/api/organizations/modules/${moduleKey}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ enabled }),
            });

            if (!response.ok) {throw new Error('更新失败');}

            // 更新本地状态
            if (this.currentOrg) {
                this.currentOrg.modules[moduleKey] = enabled;
                this.renderModuleStatus(this.currentOrg.modules);
            }

            const moduleNames = {
                knowledge: '知识库',
                cases: '案例库',
                exams: '考试中心',
                training: '培训管理',
            };

            this.showNotification(
                `${moduleNames[moduleKey]}已${enabled ? '启用' : '禁用'}`,
                'success'
            );
        } catch (error) {
            console.error('更新模块状态失败:', error);
            this.showNotification('操作失败，请重试', 'error');
        }
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('org-modal');
        if (modal) {modal.classList.remove('active');}
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 初始化
const organizationManager = new OrganizationManager();
