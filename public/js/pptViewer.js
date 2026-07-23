/**
 * PPT预览组件
 * 使用Microsoft Office Online Viewer或本地iframe嵌入
 */
class PPTViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            fileId: options.fileId,
            src: options.src, // 文件访问URL
            title: options.title || 'PPT演示',
            knowledgeId: options.knowledgeId,
            totalSlides: options.totalSlides || 0,
            ...options,
        };

        this.currentSlide = 1;
        this.isFullscreen = false;

        this.init();
    }

    init() {
        this.render();
        this.loadPPT();
    }

    render() {
        this.container.innerHTML = `
            <div class="ppt-viewer-container">
                <div class="ppt-toolbar">
                    <div class="ppt-toolbar-left">
                        <button class="ppt-btn" id="ppt-prev-${this.options.fileId}" title="上一页">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="ppt-slide-info">
                            <input type="number" class="ppt-slide-input" id="ppt-slide-input-${this.options.fileId}" 
                                   value="${this.currentSlide}" min="1">
                            <span>/</span>
                            <span id="ppt-total-${this.options.fileId}">${this.options.totalSlides || '--'}</span>
                        </div>
                        <button class="ppt-btn" id="ppt-next-${this.options.fileId}" title="下一页">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="ppt-toolbar-center">
                        <span class="ppt-title">${this.options.title}</span>
                    </div>
                    
                    <div class="ppt-toolbar-right">
                        <button class="ppt-btn" id="ppt-note-${this.options.fileId}" title="添加笔记">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="ppt-btn" id="ppt-fullscreen-${this.options.fileId}" title="全屏">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
                
                <div class="ppt-content" id="ppt-content-${this.options.fileId}">
                    <div class="ppt-loading" id="ppt-loading-${this.options.fileId}">
                        <div class="loading-spinner"></div>
                        <p>正在加载PPT...</p>
                    </div>
                    <iframe id="ppt-iframe-${this.options.fileId}" class="ppt-iframe" frameborder="0"></iframe>
                </div>
                
                <!-- 笔记输入框 -->
                <div class="ppt-note-panel hidden" id="ppt-note-panel-${this.options.fileId}">
                    <div class="ppt-note-header">
                        <span>添加笔记 - 第${this.currentSlide}页</span>
                        <button class="ppt-note-close" id="ppt-note-close-${this.options.fileId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <textarea class="ppt-note-input" id="ppt-note-input-${this.options.fileId}" 
                              placeholder="在此添加笔记..." rows="3"></textarea>
                    <div class="ppt-note-actions">
                        <button class="btn btn-sm btn-secondary" id="ppt-note-cancel-${this.options.fileId}">取消</button>
                        <button class="btn btn-sm btn-primary" id="ppt-note-save-${this.options.fileId}">保存笔记</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        // 页面导航
        document
            .getElementById(`ppt-prev-${this.options.fileId}`)
            .addEventListener('click', () => this.prevSlide());
        document
            .getElementById(`ppt-next-${this.options.fileId}`)
            .addEventListener('click', () => this.nextSlide());

        // 页码输入
        const slideInput = document.getElementById(`ppt-slide-input-${this.options.fileId}`);
        slideInput.addEventListener('change', e => {
            const slide = parseInt(e.target.value);
            if (slide >= 1 && slide <= this.options.totalSlides) {
                this.gotoSlide(slide);
            }
        });

        // 笔记
        document
            .getElementById(`ppt-note-${this.options.fileId}`)
            .addEventListener('click', () => this.showNotePanel());
        document
            .getElementById(`ppt-note-close-${this.options.fileId}`)
            .addEventListener('click', () => this.hideNotePanel());
        document
            .getElementById(`ppt-note-cancel-${this.options.fileId}`)
            .addEventListener('click', () => this.hideNotePanel());
        document
            .getElementById(`ppt-note-save-${this.options.fileId}`)
            .addEventListener('click', () => this.saveNote());

        // 全屏
        document
            .getElementById(`ppt-fullscreen-${this.options.fileId}`)
            .addEventListener('click', () => this.toggleFullscreen());

        // 键盘快捷键
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {return;}

            switch (e.key) {
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'ArrowRight':
                case 'PageDown':
                case ' ':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.gotoSlide(1);
                    break;
                case 'End':
                    e.preventDefault();
                    this.gotoSlide(this.options.totalSlides);
                    break;
            }
        });
    }

    loadPPT() {
        this.showLoading();

        const iframe = document.getElementById(`ppt-iframe-${this.options.fileId}`);

        // 使用Microsoft Office Online Viewer
        // 注意：需要将文件URL编码
        const encodedUrl = encodeURIComponent(this.options.src);
        const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

        iframe.src = officeUrl;

        iframe.onload = () => {
            this.hideLoading();
            // 加载上次阅读的页码
            this.loadProgress();
        };

        iframe.onerror = () => {
            this.hideLoading();
            // 如果Office Online加载失败，显示备用方案
            this.showFallback();
        };
    }

    showFallback() {
        const content = document.getElementById(`ppt-content-${this.options.fileId}`);
        content.innerHTML = `
            <div class="ppt-fallback">
                <i class="fas fa-file-powerpoint" style="font-size: 64px; color: var(--warning); margin-bottom: 16px;"></i>
                <h3>PPT预览暂时不可用</h3>
                <p>可能的原因：</p>
                <ul style="text-align: left; margin: 16px 0;">
                    <li>文件需要外网访问才能预览</li>
                    <li>文件格式不支持在线预览</li>
                    <li>网络连接问题</li>
                </ul>
                <div style="margin-top: 24px;">
                    <a href="${this.options.src}" download class="btn btn-primary">
                        <i class="fas fa-download"></i> 下载PPT
                    </a>
                </div>
            </div>
        `;
    }

    prevSlide() {
        if (this.currentSlide > 1) {
            this.gotoSlide(this.currentSlide - 1);
        }
    }

    nextSlide() {
        if (this.currentSlide < this.options.totalSlides) {
            this.gotoSlide(this.currentSlide + 1);
        }
    }

    gotoSlide(slideNum) {
        if (slideNum >= 1 && slideNum <= this.options.totalSlides) {
            this.currentSlide = slideNum;
            document.getElementById(`ppt-slide-input-${this.options.fileId}`).value = slideNum;

            // 更新笔记面板标题
            const noteHeader = document.querySelector(
                `#ppt-note-panel-${this.options.fileId} .ppt-note-header span`
            );
            if (noteHeader) {
                noteHeader.textContent = `添加笔记 - 第${slideNum}页`;
            }

            // Office Online不支持下标跳转，这里仅记录进度
            this.saveProgress();
            this.updateNavigationButtons();
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById(`ppt-prev-${this.options.fileId}`);
        const nextBtn = document.getElementById(`ppt-next-${this.options.fileId}`);

        prevBtn.disabled = this.currentSlide <= 1;
        nextBtn.disabled = this.currentSlide >= this.options.totalSlides;

        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    }

    showNotePanel() {
        const panel = document.getElementById(`ppt-note-panel-${this.options.fileId}`);
        panel.classList.remove('hidden');
        document.getElementById(`ppt-note-input-${this.options.fileId}`).focus();
    }

    hideNotePanel() {
        document.getElementById(`ppt-note-panel-${this.options.fileId}`).classList.add('hidden');
        document.getElementById(`ppt-note-input-${this.options.fileId}`).value = '';
    }

    async saveNote() {
        const content = document
            .getElementById(`ppt-note-input-${this.options.fileId}`)
            .value.trim();
        if (!content) {return;}

        try {
            const response = await fetch('/api/progress/note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    knowledgeId: this.options.knowledgeId,
                    fileId: this.options.fileId,
                    timestamp: this.currentSlide, // PPT使用幻灯片页码
                    content,
                }),
            });

            if (response.ok) {
                alert('笔记保存成功！');
                this.hideNotePanel();
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存笔记失败:', error);
            alert('保存失败，请重试');
        }
    }

    toggleFullscreen() {
        const container = this.container.querySelector('.ppt-viewer-container');
        if (!document.fullscreenElement) {
            container.requestFullscreen();
            this.isFullscreen = true;
        } else {
            document.exitFullscreen();
            this.isFullscreen = false;
        }
    }

    async loadProgress() {
        try {
            const response = await fetch(
                `/api/progress/${this.options.knowledgeId}/${this.options.fileId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.lastPosition && data.lastPosition > 0) {
                    this.currentSlide = Math.min(data.lastPosition, this.options.totalSlides);
                    document.getElementById(`ppt-slide-input-${this.options.fileId}`).value =
                        this.currentSlide;
                    this.updateNavigationButtons();
                }
            }
        } catch (error) {
            console.error('加载进度失败:', error);
        }
    }

    async saveProgress() {
        try {
            await fetch('/api/progress/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    knowledgeId: this.options.knowledgeId,
                    fileId: this.options.fileId,
                    progress: Math.floor((this.currentSlide / this.options.totalSlides) * 100),
                    position: this.currentSlide,
                    completed: this.currentSlide === this.options.totalSlides,
                }),
            });
        } catch (error) {
            console.error('保存进度失败:', error);
        }
    }

    showLoading() {
        document.getElementById(`ppt-loading-${this.options.fileId}`).style.display = 'flex';
    }

    hideLoading() {
        document.getElementById(`ppt-loading-${this.options.fileId}`).style.display = 'none';
    }

    destroy() {
        const iframe = document.getElementById(`ppt-iframe-${this.options.fileId}`);
        if (iframe) {
            iframe.src = '';
        }
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PPTViewer;
}
