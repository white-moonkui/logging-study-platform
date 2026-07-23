/**
 * 视频播放器组件
 * 支持：播放控制、进度保存、笔记添加、倍速播放
 */
class VideoPlayer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            fileId: options.fileId,
            src: options.src,
            title: options.title || '视频',
            knowledgeId: options.knowledgeId,
            autoSaveInterval: 5000, // 自动保存间隔（毫秒）
            ...options,
        };

        this.video = null;
        this.currentTime = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.saveTimer = null;

        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.loadProgress();
    }

    render() {
        this.container.innerHTML = `
            <div class="video-player-container">
                <div class="video-wrapper">
                    <video id="video-${this.options.fileId}" class="video-element" preload="metadata">
                        <source src="${this.options.src}" type="video/mp4">
                        您的浏览器不支持视频播放
                    </video>
                    
                    <!-- 加载动画 -->
                    <div class="video-loading" id="loading-${this.options.fileId}">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
                
                <!-- 控制栏 -->
                <div class="video-controls">
                    <button class="control-btn play-pause" id="play-${this.options.fileId}">
                        <i class="fas fa-play"></i>
                    </button>
                    
                    <div class="time-display">
                        <span id="current-${this.options.fileId}">00:00</span>
                        <span>/</span>
                        <span id="duration-${this.options.fileId}">00:00</span>
                    </div>
                    
                    <div class="progress-bar" id="progress-container-${this.options.fileId}">
                        <div class="progress-fill" id="progress-${this.options.fileId}"></div>
                        <div class="progress-handle" id="handle-${this.options.fileId}"></div>
                    </div>
                    
                    <button class="control-btn" id="note-${this.options.fileId}" title="添加笔记">
                        <i class="fas fa-pen"></i>
                    </button>
                    
                    <select class="speed-select" id="speed-${this.options.fileId}">
                        <option value="0.5">0.5x</option>
                        <option value="1" selected>1.0x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2.0x</option>
                    </select>
                    
                    <button class="control-btn fullscreen" id="fullscreen-${this.options.fileId}">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
                
                <!-- 笔记输入框 -->
                <div class="note-input-container hidden" id="note-container-${this.options.fileId}">
                    <textarea class="note-input" id="note-input-${this.options.fileId}" 
                              placeholder="在此添加笔记..." rows="3"></textarea>
                    <div class="note-actions">
                        <button class="btn btn-sm btn-secondary" id="cancel-note-${this.options.fileId}">取消</button>
                        <button class="btn btn-sm btn-primary" id="save-note-${this.options.fileId}">保存笔记</button>
                    </div>
                </div>
            </div>
        `;

        this.video = document.getElementById(`video-${this.options.fileId}`);
    }

    bindEvents() {
        const playBtn = document.getElementById(`play-${this.options.fileId}`);
        const progressContainer = document.getElementById(
            `progress-container-${this.options.fileId}`
        );
        const noteBtn = document.getElementById(`note-${this.options.fileId}`);
        const speedSelect = document.getElementById(`speed-${this.options.fileId}`);
        const fullscreenBtn = document.getElementById(`fullscreen-${this.options.fileId}`);
        const cancelNoteBtn = document.getElementById(`cancel-note-${this.options.fileId}`);
        const saveNoteBtn = document.getElementById(`save-note-${this.options.fileId}`);

        // 播放/暂停
        playBtn.addEventListener('click', () => this.togglePlay());
        this.video.addEventListener('click', () => this.togglePlay());

        // 视频事件
        this.video.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.video.addEventListener('ended', () => this.onEnded());
        this.video.addEventListener('waiting', () => this.showLoading());
        this.video.addEventListener('canplay', () => this.hideLoading());

        // 进度条拖动
        let isDragging = false;
        progressContainer.addEventListener('mousedown', e => {
            isDragging = true;
            this.seek(e);
        });
        document.addEventListener('mousemove', e => {
            if (isDragging) {this.seek(e);}
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // 笔记功能
        noteBtn.addEventListener('click', () => this.showNoteInput());
        cancelNoteBtn.addEventListener('click', () => this.hideNoteInput());
        saveNoteBtn.addEventListener('click', () => this.saveNote());

        // 倍速播放
        speedSelect.addEventListener('change', e => {
            this.video.playbackRate = parseFloat(e.target.value);
        });

        // 全屏
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // 键盘快捷键
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'TEXTAREA') {return;}

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    this.video.currentTime -= 5;
                    break;
                case 'ArrowRight':
                    this.video.currentTime += 5;
                    break;
            }
        });
    }

    togglePlay() {
        if (this.video.paused) {
            this.video.play();
            this.isPlaying = true;
            this.startAutoSave();
        } else {
            this.video.pause();
            this.isPlaying = false;
            this.stopAutoSave();
            this.saveProgress();
        }
        this.updatePlayButton();
    }

    updatePlayButton() {
        const playBtn = document.getElementById(`play-${this.options.fileId}`);
        playBtn.innerHTML = this.video.paused
            ? '<i class="fas fa-play"></i>'
            : '<i class="fas fa-pause"></i>';
    }

    onLoadedMetadata() {
        this.duration = this.video.duration;
        document.getElementById(`duration-${this.options.fileId}`).textContent = this.formatTime(
            this.duration
        );
    }

    onTimeUpdate() {
        this.currentTime = this.video.currentTime;
        const progress = (this.currentTime / this.duration) * 100;

        document.getElementById(`current-${this.options.fileId}`).textContent = this.formatTime(
            this.currentTime
        );
        document.getElementById(`progress-${this.options.fileId}`).style.width = `${progress}%`;
        document.getElementById(`handle-${this.options.fileId}`).style.left = `${progress}%`;
    }

    onEnded() {
        this.isPlaying = false;
        this.updatePlayButton();
        this.saveProgress(true); // 标记为已完成
    }

    seek(e) {
        const progressContainer = document.getElementById(
            `progress-container-${this.options.fileId}`
        );
        const rect = progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const time = pos * this.duration;

        this.video.currentTime = time;
    }

    showLoading() {
        document.getElementById(`loading-${this.options.fileId}`).classList.add('active');
    }

    hideLoading() {
        document.getElementById(`loading-${this.options.fileId}`).classList.remove('active');
    }

    showNoteInput() {
        const container = document.getElementById(`note-container-${this.options.fileId}`);
        container.classList.remove('hidden');
        document.getElementById(`note-input-${this.options.fileId}`).focus();

        // 暂停视频
        if (!this.video.paused) {
            this.video.pause();
            this.updatePlayButton();
        }
    }

    hideNoteInput() {
        document.getElementById(`note-container-${this.options.fileId}`).classList.add('hidden');
        document.getElementById(`note-input-${this.options.fileId}`).value = '';
    }

    async saveNote() {
        const content = document.getElementById(`note-input-${this.options.fileId}`).value.trim();
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
                    timestamp: Math.floor(this.currentTime),
                    content,
                }),
            });

            if (response.ok) {
                alert('笔记保存成功！');
                this.hideNoteInput();
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存笔记失败:', error);
            alert('保存失败，请重试');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen();
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
                if (data.lastPosition) {
                    this.video.currentTime = data.lastPosition;
                }
            }
        } catch (error) {
            console.error('加载进度失败:', error);
        }
    }

    async saveProgress(completed = false) {
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
                    progress: Math.floor((this.currentTime / this.duration) * 100),
                    position: Math.floor(this.currentTime),
                    completed,
                }),
            });
        } catch (error) {
            console.error('保存进度失败:', error);
        }
    }

    startAutoSave() {
        this.saveTimer = setInterval(() => {
            this.saveProgress();
        }, this.options.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    destroy() {
        this.stopAutoSave();
        if (this.video) {
            this.video.pause();
            this.video.src = '';
        }
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoPlayer;
}
