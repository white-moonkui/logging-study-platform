/**
 * PDF阅读器组件
 * 基于PDF.js，支持页码跳转、缩放、笔记添加
 */
class PDFViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            fileId: options.fileId,
            src: options.src,
            title: options.title || 'PDF文档',
            knowledgeId: options.knowledgeId,
            initialPage: options.initialPage || 1,
            ...options,
        };

        this.pdfDoc = null;
        this.currentPage = this.options.initialPage;
        this.totalPages = 0;
        this.scale = 1.0;
        this.canvas = null;
        this.ctx = null;
        this.isLoading = false;

        // PDF.js配置
        this.pdfjsLib = window['pdfjs-dist/build/pdf'];
        if (this.pdfjsLib) {
            this.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        this.init();
    }

    init() {
        this.render();
        if (this.options.src) {
            this.loadPDF(this.options.src);
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="pdf-viewer-container">
                <div class="pdf-toolbar">
                    <div class="pdf-toolbar-left">
                        <button class="pdf-btn" id="pdf-prev-${this.options.fileId}" title="上一页">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="pdf-page-info">
                            <input type="number" class="pdf-page-input" id="pdf-page-input-${this.options.fileId}" 
                                   value="${this.currentPage}" min="1">
                            <span>/</span>
                            <span id="pdf-total-${this.options.fileId}">--</span>
                        </div>
                        <button class="pdf-btn" id="pdf-next-${this.options.fileId}" title="下一页">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="pdf-toolbar-center">
                        <span class="pdf-title">${this.options.title}</span>
                    </div>
                    
                    <div class="pdf-toolbar-right">
                        <button class="pdf-btn" id="pdf-zoom-out-${this.options.fileId}" title="缩小">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="pdf-zoom-level" id="pdf-zoom-${this.options.fileId}">100%</span>
                        <button class="pdf-btn" id="pdf-zoom-in-${this.options.fileId}" title="放大">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="pdf-btn" id="pdf-note-${this.options.fileId}" title="添加笔记">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="pdf-btn" id="pdf-fullscreen-${this.options.fileId}" title="全屏">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
                
                <div class="pdf-content" id="pdf-content-${this.options.fileId}">
                    <canvas id="pdf-canvas-${this.options.fileId}" class="pdf-canvas"></canvas>
                    <div class="pdf-loading" id="pdf-loading-${this.options.fileId}">
                        <div class="loading-spinner"></div>
                        <p>正在加载PDF...</p>
                    </div>
                </div>
                
                <!-- 笔记输入框 -->
                <div class="pdf-note-panel hidden" id="pdf-note-panel-${this.options.fileId}">
                    <div class="pdf-note-header">
                        <span>添加笔记 - 第${this.currentPage}页</span>
                        <button class="pdf-note-close" id="pdf-note-close-${this.options.fileId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <textarea class="pdf-note-input" id="pdf-note-input-${this.options.fileId}" 
                              placeholder="在此添加笔记..." rows="4"></textarea>
                    <div class="pdf-note-actions">
                        <button class="btn btn-sm btn-secondary" id="pdf-note-cancel-${this.options.fileId}">取消</button>
                        <button class="btn btn-sm btn-primary" id="pdf-note-save-${this.options.fileId}">保存笔记</button>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById(`pdf-canvas-${this.options.fileId}`);
        this.ctx = this.canvas.getContext('2d');

        this.bindEvents();
    }

    bindEvents() {
        // 页面导航
        document
            .getElementById(`pdf-prev-${this.options.fileId}`)
            .addEventListener('click', () => this.prevPage());
        document
            .getElementById(`pdf-next-${this.options.fileId}`)
            .addEventListener('click', () => this.nextPage());

        // 页码输入
        const pageInput = document.getElementById(`pdf-page-input-${this.options.fileId}`);
        pageInput.addEventListener('change', e => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= this.totalPages) {
                this.gotoPage(page);
            }
        });

        // 缩放
        document
            .getElementById(`pdf-zoom-out-${this.options.fileId}`)
            .addEventListener('click', () => this.zoomOut());
        document
            .getElementById(`pdf-zoom-in-${this.options.fileId}`)
            .addEventListener('click', () => this.zoomIn());

        // 笔记
        document
            .getElementById(`pdf-note-${this.options.fileId}`)
            .addEventListener('click', () => this.showNotePanel());
        document
            .getElementById(`pdf-note-close-${this.options.fileId}`)
            .addEventListener('click', () => this.hideNotePanel());
        document
            .getElementById(`pdf-note-cancel-${this.options.fileId}`)
            .addEventListener('click', () => this.hideNotePanel());
        document
            .getElementById(`pdf-note-save-${this.options.fileId}`)
            .addEventListener('click', () => this.saveNote());

        // 全屏
        document
            .getElementById(`pdf-fullscreen-${this.options.fileId}`)
            .addEventListener('click', () => this.toggleFullscreen());

        // 键盘快捷键
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {return;}

            switch (e.key) {
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    this.prevPage();
                    break;
                case 'ArrowRight':
                case 'PageDown':
                    e.preventDefault();
                    this.nextPage();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.gotoPage(1);
                    break;
                case 'End':
                    e.preventDefault();
                    this.gotoPage(this.totalPages);
                    break;
            }
        });
    }

    async loadPDF(src) {
        if (!this.pdfjsLib) {
            alert('PDF.js库未加载，请检查网络连接');
            return;
        }

        this.showLoading();

        try {
            this.pdfDoc = await this.pdfjsLib.getDocument(src).promise;
            this.totalPages = this.pdfDoc.numPages;

            document.getElementById(`pdf-total-${this.options.fileId}`).textContent =
                this.totalPages;

            // 加载上次阅读的页码
            await this.loadProgress();

            await this.renderPage(this.currentPage);
            this.hideLoading();
        } catch (error) {
            console.error('PDF加载失败:', error);
            this.hideLoading();
            alert('PDF加载失败，请重试');
        }
    }

    async renderPage(pageNum) {
        if (!this.pdfDoc || this.isLoading) {return;}

        this.isLoading = true;
        this.showLoading();

        try {
            const page = await this.pdfDoc.getPage(pageNum);

            const viewport = page.getViewport({ scale: this.scale });
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;

            const renderContext = {
                canvasContext: this.ctx,
                viewport,
            };

            await page.render(renderContext).promise;

            this.currentPage = pageNum;
            document.getElementById(`pdf-page-input-${this.options.fileId}`).value = pageNum;

            // 更新按钮状态
            this.updateNavigationButtons();

            // 保存进度
            this.saveProgress();
        } catch (error) {
            console.error('页面渲染失败:', error);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.renderPage(this.currentPage - 1);
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.renderPage(this.currentPage + 1);
        }
    }

    gotoPage(pageNum) {
        if (pageNum >= 1 && pageNum <= this.totalPages) {
            this.renderPage(pageNum);
        }
    }

    zoomIn() {
        this.scale = Math.min(this.scale + 0.25, 3.0);
        this.updateZoomDisplay();
        this.renderPage(this.currentPage);
    }

    zoomOut() {
        this.scale = Math.max(this.scale - 0.25, 0.5);
        this.updateZoomDisplay();
        this.renderPage(this.currentPage);
    }

    updateZoomDisplay() {
        document.getElementById(`pdf-zoom-${this.options.fileId}`).textContent =
            `${Math.round(this.scale * 100)}%`;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById(`pdf-prev-${this.options.fileId}`);
        const nextBtn = document.getElementById(`pdf-next-${this.options.fileId}`);

        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= this.totalPages;

        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    }

    showNotePanel() {
        const panel = document.getElementById(`pdf-note-panel-${this.options.fileId}`);
        panel.classList.remove('hidden');
        document.getElementById(`pdf-note-input-${this.options.fileId}`).focus();
    }

    hideNotePanel() {
        document.getElementById(`pdf-note-panel-${this.options.fileId}`).classList.add('hidden');
        document.getElementById(`pdf-note-input-${this.options.fileId}`).value = '';
    }

    async saveNote() {
        const content = document
            .getElementById(`pdf-note-input-${this.options.fileId}`)
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
                    timestamp: this.currentPage, // PDF使用页码作为timestamp
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
        const container = this.container.querySelector('.pdf-viewer-container');
        if (!document.fullscreenElement) {
            container.requestFullscreen();
        } else {
            document.exitFullscreen();
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
                    this.currentPage = Math.min(data.lastPosition, this.totalPages);
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
                    progress: Math.floor((this.currentPage / this.totalPages) * 100),
                    position: this.currentPage,
                    completed: this.currentPage === this.totalPages,
                }),
            });
        } catch (error) {
            console.error('保存进度失败:', error);
        }
    }

    showLoading() {
        document.getElementById(`pdf-loading-${this.options.fileId}`).style.display = 'flex';
    }

    hideLoading() {
        document.getElementById(`pdf-loading-${this.options.fileId}`).style.display = 'none';
    }

    destroy() {
        if (this.pdfDoc) {
            this.pdfDoc.destroy();
            this.pdfDoc = null;
        }
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFViewer;
}
