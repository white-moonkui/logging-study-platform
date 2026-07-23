/**
 * 知识库管理器
 * 支持多文件上传、审核流程、版本管理
 */

class KnowledgeManager {
    constructor() {
        this.currentKnowledge = null;
        this.uploadedFiles = [];
        this.fileInput = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadKnowledgeList();
    }

    bindEvents() {
        // 新建知识按钮
        const createBtn = document.getElementById('create-knowledge-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateModal());
        }

        // 文件上传
        const fileInput = document.getElementById('knowledge-files');
        if (fileInput) {
            this.fileInput = fileInput;
            fileInput.addEventListener('change', e => this.handleFileSelect(e));
        }

        // 拖拽上传
        const dropZone = document.getElementById('file-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', e => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', e => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                this.handleFileDrop(e);
            });
        }

        // 表单提交
        const form = document.getElementById('knowledge-form');
        if (form) {
            form.addEventListener('submit', e => this.handleSubmit(e));
        }

        // 模态框关闭
        const closeBtns = document.querySelectorAll('.modal-close, [data-close-modal]');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // 搜索
        const searchInput = document.getElementById('knowledge-search');
        if (searchInput) {
            searchInput.addEventListener(
                'input',
                this.debounce(e => {
                    this.searchKnowledge(e.target.value);
                }, 300)
            );
        }

        // 筛选
        const filterSelect = document.getElementById('knowledge-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', e => {
                this.filterKnowledge(e.target.value);
            });
        }
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 加载知识列表
    async loadKnowledgeList(page = 1, limit = 10) {
        try {
            const response = await fetch(`/api/knowledge?page=${page}&limit=${limit}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('加载失败');}

            const data = await response.json();
            this.renderKnowledgeList(data.items);
            this.renderPagination(data.pagination);
        } catch (error) {
            console.error('加载知识列表失败:', error);
            this.showNotification('加载失败，请重试', 'error');
        }
    }

    // 渲染知识列表
    renderKnowledgeList(knowledgeList) {
        const container = document.getElementById('knowledge-list');
        if (!container) {return;}

        if (!knowledgeList || knowledgeList.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>暂无知识内容</p>
                    <button class="btn btn-primary" onclick="knowledgeManager.openCreateModal()">
                        <i class="fas fa-plus"></i> 创建新知识
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = knowledgeList
            .map(knowledge => {
                const statusBadge = this.getStatusBadge(knowledge.status);
                const fileIcons = this.getFileIcons(knowledge.files);
                const visibilityIcon =
                    knowledge.visibility === 'organization' ? 'building' : 'globe';
                const visibilityText = knowledge.visibility === 'organization' ? '本单位' : '公开';

                return `
                <div class="knowledge-card" data-id="${knowledge._id}">
                    <div class="knowledge-card-header">
                        <div class="knowledge-title">
                            <h3>${this.escapeHtml(knowledge.title)}</h3>
                            ${statusBadge}
                        </div>
                        <div class="knowledge-actions">
                            <button class="btn-icon" onclick="knowledgeManager.editKnowledge('${knowledge._id}')" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="knowledgeManager.viewKnowledge('${knowledge._id}')" title="预览">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="knowledgeManager.deleteKnowledge('${knowledge._id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="knowledge-card-body">
                        <p class="knowledge-description">${this.escapeHtml(knowledge.content?.substring(0, 100) || '')}...</p>
                        <div class="knowledge-meta">
                            <span class="meta-item"><i class="fas fa-${visibilityIcon}"></i> ${visibilityText}</span>
                            <span class="meta-item"><i class="fas fa-folder"></i> ${knowledge.category || '未分类'}</span>
                            <span class="meta-item"><i class="fas fa-user"></i> ${knowledge.createdBy?.name || '未知'}</span>
                            <span class="meta-item"><i class="fas fa-calendar"></i> ${this.formatDate(knowledge.createdAt)}</span>
                        </div>
                        <div class="knowledge-files">
                            ${fileIcons}
                        </div>
                    </div>
                    ${this.renderApprovalActions(knowledge)}
                </div>
            `;
            })
            .join('');
    }

    // 获取状态标签
    getStatusBadge(status) {
        const statusMap = {
            draft: { class: 'status-draft', text: '草稿' },
            pending: { class: 'status-pending', text: '待审核' },
            approved: { class: 'status-approved', text: '已通过' },
            rejected: { class: 'status-rejected', text: '已拒绝' },
            published: { class: 'status-published', text: '已发布' },
        };
        const config = statusMap[status] || statusMap['draft'];
        return `<span class="status-badge ${config.class}">${config.text}</span>`;
    }

    // 获取文件图标
    getFileIcons(files) {
        if (!files || files.length === 0) {return '<span class="no-files">无附件</span>';}

        const typeIcons = {
            video: 'fa-video',
            pdf: 'fa-file-pdf',
            word: 'fa-file-word',
            ppt: 'fa-file-powerpoint',
        };

        return files
            .map(file => {
                const icon = typeIcons[file.type] || 'fa-file';
                return `
                <span class="file-tag" title="${this.escapeHtml(file.title)}">
                    <i class="fas ${icon}"></i>
                    ${this.escapeHtml(file.title.substring(0, 10))}${file.title.length > 10 ? '...' : ''}
                </span>
            `;
            })
            .join('');
    }

    // 渲染审核操作按钮
    renderApprovalActions(knowledge) {
        const userRole = this.getUserRole();

        // 只有管理员可以审核
        if (userRole !== 'admin') {return '';}

        // 只有待审核状态显示审核按钮
        if (knowledge.status !== 'pending') {return '';}

        return `
            <div class="knowledge-approval-actions">
                <button class="btn btn-sm btn-success" onclick="knowledgeManager.approveKnowledge('${knowledge._id}')">
                    <i class="fas fa-check"></i> 通过
                </button>
                <button class="btn btn-sm btn-danger" onclick="knowledgeManager.rejectKnowledge('${knowledge._id}')">
                    <i class="fas fa-times"></i> 拒绝
                </button>
            </div>
        `;
    }

    // 打开创建模态框
    openCreateModal() {
        this.currentKnowledge = null;
        this.uploadedFiles = [];
        this.renderUploadedFiles();

        const modal = document.getElementById('knowledge-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('knowledge-form');

        if (title) {title.textContent = '创建新知识';}
        if (form) {form.reset();}
        if (modal) {modal.classList.add('active');}

        // 加载分类选择
        this.loadCategories();
    }

    // 编辑知识
    async editKnowledge(id) {
        try {
            const response = await fetch(`/api/knowledge/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('加载失败');}

            const knowledge = await response.json();
            this.currentKnowledge = knowledge;
            this.uploadedFiles = knowledge.files || [];

            // 填充表单
            document.getElementById('knowledge-title').value = knowledge.title;
            document.getElementById('knowledge-content').value = knowledge.content;
            document.getElementById('knowledge-category').value = knowledge.category || '';
            document.getElementById('knowledge-visibility').value =
                knowledge.visibility || 'organization';
            document.getElementById('knowledge-tags').value = knowledge.tags?.join(', ') || '';

            this.renderUploadedFiles();

            // 打开模态框
            const modal = document.getElementById('knowledge-modal');
            const title = document.getElementById('modal-title');
            if (title) {title.textContent = '编辑知识';}
            if (modal) {modal.classList.add('active');}
        } catch (error) {
            console.error('加载知识详情失败:', error);
            this.showNotification('加载失败，请重试', 'error');
        }
    }

    // 处理文件选择
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
    }

    // 处理文件拖拽
    handleFileDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        this.processFiles(files);
    }

    // 处理文件
    async processFiles(files) {
        for (const file of files) {
            // 检查文件类型
            const allowedTypes = [
                'video/mp4',
                'video/webm',
                'video/ogg',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-powerpoint',
            ];

            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['mp4', 'webm', 'ogg', 'pdf', 'doc', 'docx', 'ppt', 'pptx'];

            if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
                this.showNotification(`不支持的文件格式: ${file.name}`, 'error');
                continue;
            }

            // 检查文件大小 (500MB限制)
            if (file.size > 500 * 1024 * 1024) {
                this.showNotification(`文件过大: ${file.name} (最大500MB)`, 'error');
                continue;
            }

            // 创建文件对象
            const fileObj = {
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                name: file.name,
                size: file.size,
                type: this.getFileType(file),
                title: file.name.replace(/\.[^/.]+$/, ''),
                isRequired: false,
                sortOrder: this.uploadedFiles.length,
                status: 'pending', // pending, uploading, uploaded, error
            };

            this.uploadedFiles.push(fileObj);
            this.renderUploadedFiles();

            // 自动上传
            await this.uploadFile(fileObj);
        }
    }

    // 获取文件类型
    getFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const typeMap = {
            mp4: 'video',
            webm: 'video',
            ogg: 'video',
            pdf: 'pdf',
            doc: 'word',
            docx: 'word',
            ppt: 'ppt',
            pptx: 'ppt',
        };
        return typeMap[extension] || 'other';
    }

    // 上传文件
    async uploadFile(fileObj) {
        fileObj.status = 'uploading';
        this.renderUploadedFiles();

        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('type', fileObj.type);
        formData.append('title', fileObj.title);

        try {
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            if (!response.ok) {throw new Error('上传失败');}

            const result = await response.json();

            // 更新文件对象
            fileObj.status = 'uploaded';
            fileObj.fileId = result.fileId;
            fileObj.url = result.url;

            this.showNotification(`文件上传成功: ${fileObj.name}`, 'success');
        } catch (error) {
            console.error('上传文件失败:', error);
            fileObj.status = 'error';
            this.showNotification(`上传失败: ${fileObj.name}`, 'error');
        }

        this.renderUploadedFiles();
    }

    // 渲染已上传文件列表
    renderUploadedFiles() {
        const container = document.getElementById('uploaded-files-list');
        if (!container) {return;}

        if (this.uploadedFiles.length === 0) {
            container.innerHTML = '<p class="no-files">暂无文件，请选择或拖拽文件到上方</p>';
            return;
        }

        container.innerHTML = this.uploadedFiles
            .map((file, index) => {
                const typeIcons = {
                    video: 'fa-video',
                    pdf: 'fa-file-pdf',
                    word: 'fa-file-word',
                    ppt: 'fa-file-powerpoint',
                };
                const icon = typeIcons[file.type] || 'fa-file';

                let statusHtml = '';
                if (file.status === 'uploading') {
                    statusHtml =
                        '<span class="file-status uploading"><i class="fas fa-spinner fa-spin"></i> 上传中...</span>';
                } else if (file.status === 'uploaded') {
                    statusHtml =
                        '<span class="file-status uploaded"><i class="fas fa-check"></i> 已上传</span>';
                } else if (file.status === 'error') {
                    statusHtml =
                        '<span class="file-status error"><i class="fas fa-exclamation-triangle"></i> 失败</span>';
                }

                return `
                <div class="file-item ${file.status}" data-id="${file.id}">
                    <div class="file-item-header">
                        <i class="fas ${icon} file-icon"></i>
                        <input type="text" class="file-title-input" value="${this.escapeHtml(file.title)}" 
                               onchange="knowledgeManager.updateFileTitle('${file.id}', this.value)"
                               placeholder="文件标题">
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        ${statusHtml}
                    </div>
                    <div class="file-item-actions">
                        <label class="checkbox-label">
                            <input type="checkbox" ${file.isRequired ? 'checked' : ''} 
                                   onchange="knowledgeManager.toggleFileRequired('${file.id}', this.checked)">
                            必修
                        </label>
                        <button class="btn-icon" onclick="knowledgeManager.moveFile('${file.id}', -1)" 
                                ${index === 0 ? 'disabled' : ''} title="上移">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn-icon" onclick="knowledgeManager.moveFile('${file.id}', 1)" 
                                ${index === this.uploadedFiles.length - 1 ? 'disabled' : ''} title="下移">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="knowledgeManager.removeFile('${file.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            })
            .join('');
    }

    // 更新文件标题
    updateFileTitle(fileId, title) {
        const file = this.uploadedFiles.find(f => f.id === fileId);
        if (file) {
            file.title = title;
        }
    }

    // 切换必修状态
    toggleFileRequired(fileId, isRequired) {
        const file = this.uploadedFiles.find(f => f.id === fileId);
        if (file) {
            file.isRequired = isRequired;
        }
    }

    // 移动文件顺序
    moveFile(fileId, direction) {
        const index = this.uploadedFiles.findIndex(f => f.id === fileId);
        if (index === -1) {return;}

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.uploadedFiles.length) {return;}

        // 交换位置
        [this.uploadedFiles[index], this.uploadedFiles[newIndex]] = [
            this.uploadedFiles[newIndex],
            this.uploadedFiles[index],
        ];

        // 更新排序
        this.uploadedFiles.forEach((file, idx) => {
            file.sortOrder = idx;
        });

        this.renderUploadedFiles();
    }

    // 移除文件
    removeFile(fileId) {
        if (!confirm('确定要删除此文件吗？')) {return;}

        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
        this.renderUploadedFiles();
    }

    // 处理表单提交
    async handleSubmit(event) {
        event.preventDefault();

        const formData = {
            title: document.getElementById('knowledge-title').value,
            content: document.getElementById('knowledge-content').value,
            category: document.getElementById('knowledge-category').value,
            visibility: document.getElementById('knowledge-visibility').value,
            tags: document
                .getElementById('knowledge-tags')
                .value.split(',')
                .map(t => t.trim())
                .filter(t => t),
            files: this.uploadedFiles
                .filter(f => f.status === 'uploaded')
                .map(f => ({
                    fileId: f.fileId,
                    type: f.type,
                    title: f.title,
                    isRequired: f.isRequired,
                    sortOrder: f.sortOrder,
                })),
        };

        try {
            const url = this.currentKnowledge
                ? `/api/knowledge/${this.currentKnowledge._id}`
                : '/api/knowledge';

            const method = this.currentKnowledge ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {throw new Error('保存失败');}

            this.showNotification(
                this.currentKnowledge ? '知识更新成功' : '知识创建成功，等待审核',
                'success'
            );

            this.closeModal();
            this.loadKnowledgeList();
        } catch (error) {
            console.error('保存知识失败:', error);
            this.showNotification('保存失败，请重试', 'error');
        }
    }

    // 审核通过
    async approveKnowledge(id) {
        if (!confirm('确定要通过此知识的审核吗？')) {return;}

        try {
            const response = await fetch(`/api/knowledge/${id}/approve`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('操作失败');}

            this.showNotification('审核通过', 'success');
            this.loadKnowledgeList();
        } catch (error) {
            console.error('审核失败:', error);
            this.showNotification('操作失败，请重试', 'error');
        }
    }

    // 审核拒绝
    async rejectKnowledge(id) {
        const reason = prompt('请输入拒绝原因（可选）：');
        if (reason === null) {return;} // 用户取消

        try {
            const response = await fetch(`/api/knowledge/${id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) {throw new Error('操作失败');}

            this.showNotification('已拒绝', 'success');
            this.loadKnowledgeList();
        } catch (error) {
            console.error('拒绝失败:', error);
            this.showNotification('操作失败，请重试', 'error');
        }
    }

    // 删除知识
    async deleteKnowledge(id) {
        if (!confirm('确定要删除此知识吗？此操作不可恢复。')) {return;}

        try {
            const response = await fetch(`/api/knowledge/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('删除失败');}

            this.showNotification('删除成功', 'success');
            this.loadKnowledgeList();
        } catch (error) {
            console.error('删除失败:', error);
            this.showNotification('删除失败，请重试', 'error');
        }
    }

    // 查看知识
    viewKnowledge(id) {
        window.open(`/knowledge-detail.html?id=${id}`, '_blank');
    }

    // 搜索知识
    async searchKnowledge(keyword) {
        if (!keyword.trim()) {
            this.loadKnowledgeList();
            return;
        }

        try {
            const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(keyword)}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('搜索失败');}

            const data = await response.json();
            this.renderKnowledgeList(data.items);
        } catch (error) {
            console.error('搜索失败:', error);
        }
    }

    // 筛选知识
    async filterKnowledge(status) {
        try {
            const url = status ? `/api/knowledge?status=${status}` : '/api/knowledge';

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('筛选失败');}

            const data = await response.json();
            this.renderKnowledgeList(data.items);
        } catch (error) {
            console.error('筛选失败:', error);
        }
    }

    // 加载分类
    async loadCategories() {
        const select = document.getElementById('knowledge-category');
        if (!select) {return;}

        try {
            const response = await fetch('/api/knowledge/categories', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {throw new Error('加载失败');}

            const categories = await response.json();

            select.innerHTML =
                `<option value="">选择分类</option>${ 
                categories.map(cat => `<option value="${cat._id}">${cat.name}</option>`).join('')}`;
        } catch (error) {
            console.error('加载分类失败:', error);
        }
    }

    // 渲染分页
    renderPagination(pagination) {
        const container = document.getElementById('knowledge-pagination');
        if (!container || !pagination) {return;}

        const { page, pages, total } = pagination;

        let html = '';

        // 上一页
        html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="knowledgeManager.loadKnowledgeList(${page - 1})">上一页</button>`;

        // 页码
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
                html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="knowledgeManager.loadKnowledgeList(${i})">${i}</button>`;
            } else if (i === page - 3 || i === page + 3) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }

        // 下一页
        html += `<button class="page-btn" ${page >= pages ? 'disabled' : ''} onclick="knowledgeManager.loadKnowledgeList(${page + 1})">下一页</button>`;

        // 统计信息
        html += `<span class="page-info">共 ${total} 条</span>`;

        container.innerHTML = html;
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('knowledge-modal');
        if (modal) {modal.classList.remove('active');}
    }

    // 获取用户角色
    getUserRole() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.role || 'student';
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) {return '-';}
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) {return '0 Bytes';}
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
    }

    // HTML转义
    escapeHtml(text) {
        if (!text) {return '';}
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 初始化
const knowledgeManager = new KnowledgeManager();
