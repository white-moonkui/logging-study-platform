/**
 * 知识库交互组件
 * 处理收藏、评论、评分等功能
 */
class KnowledgeInteractionModule {
    constructor(apiBase, token) {
        this.apiBase = apiBase;
        this.token = token;
    }

    // 获取认证头
    getHeaders() {
        return {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * 收藏知识
     */
    async favorite(knowledgeId, folder = '默认收藏夹', note = '') {
        try {
            const response = await fetch(`${this.apiBase}/knowledge-interaction/favorites`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ knowledgeId, folder, note }),
            });

            const data = await response.json();
            if (response.ok) {
                this.showMessage('收藏成功', 'success');
                return true;
            } else {
                this.showMessage(data.message || '收藏失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('收藏失败:', error);
            this.showMessage('收藏失败，请稍后重试', 'error');
            return false;
        }
    }

    /**
     * 取消收藏
     */
    async unfavorite(knowledgeId) {
        try {
            const response = await fetch(
                `${this.apiBase}/knowledge-interaction/favorites/${knowledgeId}`,
                {
                    method: 'DELETE',
                    headers: this.getHeaders(),
                }
            );

            const data = await response.json();
            if (response.ok) {
                this.showMessage('已取消收藏', 'success');
                return true;
            } else {
                this.showMessage(data.message || '取消收藏失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('取消收藏失败:', error);
            this.showMessage('操作失败，请稍后重试', 'error');
            return false;
        }
    }

    /**
     * 获取收藏状态
     */
    async getFavoriteStatus(knowledgeId) {
        try {
            const response = await fetch(`${this.apiBase}/knowledge-interaction/favorites`, {
                headers: this.getHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const favorite = data.favorites.find(
                    f => f.knowledgeId && f.knowledgeId._id === knowledgeId
                );
                return !!favorite;
            }
            return false;
        } catch (error) {
            console.error('获取收藏状态失败:', error);
            return false;
        }
    }

    /**
     * 获取收藏列表
     */
    async getFavorites(page = 1, limit = 10, folder = null) {
        try {
            let url = `${this.apiBase}/knowledge-interaction/favorites?page=${page}&limit=${limit}`;
            if (folder) {url += `&folder=${encodeURIComponent(folder)}`;}

            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('获取收藏列表失败:', error);
            return null;
        }
    }

    /**
     * 添加评论
     */
    async addComment(knowledgeId, content, rating = null, parentCommentId = null) {
        try {
            const response = await fetch(
                `${this.apiBase}/knowledge-interaction/${knowledgeId}/comments`,
                {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ content, rating, parentCommentId }),
                }
            );

            const data = await response.json();
            if (response.ok) {
                this.showMessage('评论成功', 'success');
                return true;
            } else {
                this.showMessage(data.message || '评论失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('评论失败:', error);
            this.showMessage('评论失败，请稍后重试', 'error');
            return false;
        }
    }

    /**
     * 获取评论列表
     */
    async getComments(knowledgeId, page = 1, limit = 10, sort = 'recent') {
        try {
            const response = await fetch(
                `${this.apiBase}/knowledge-interaction/${knowledgeId}/comments?page=${page}&limit=${limit}&sort=${sort}`,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('获取评论失败:', error);
            return null;
        }
    }

    /**
     * 标记评论有用
     */
    async helpfulComment(commentId) {
        try {
            const response = await fetch(
                `${this.apiBase}/knowledge-interaction/comments/${commentId}/helpful`,
                {
                    method: 'POST',
                    headers: this.getHeaders(),
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data.helpfulCount;
            }
            return null;
        } catch (error) {
            console.error('标记失败:', error);
            return null;
        }
    }

    /**
     * 删除评论
     */
    async deleteComment(commentId) {
        try {
            const response = await fetch(
                `${this.apiBase}/knowledge-interaction/comments/${commentId}`,
                {
                    method: 'DELETE',
                    headers: this.getHeaders(),
                }
            );

            const data = await response.json();
            if (response.ok) {
                this.showMessage('删除成功', 'success');
                return true;
            } else {
                this.showMessage(data.message || '删除失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('删除失败:', error);
            this.showMessage('删除失败，请稍后重试', 'error');
            return false;
        }
    }

    /**
     * 获取统计信息
     */
    async getStatistics(knowledgeId) {
        try {
            const response = await fetch(
                `${this.apiBase}/knowledge-interaction/${knowledgeId}/statistics`
            );

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('获取统计失败:', error);
            return null;
        }
    }

    /**
     * 渲染评论表单
     */
    renderCommentForm(knowledgeId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {return;}

        container.innerHTML = `
            <div class="comment-form">
                <h4><i class="fas fa-comment"></i> 发表评论</h4>
                <div class="rating-input">
                    <label>评分：</label>
                    <div class="star-rating" data-knowledge-id="${knowledgeId}">
                        ${[1, 2, 3, 4, 5]
                            .map(
                                i => `
                            <span class="star" data-rating="${i}">
                                <i class="far fa-star"></i>
                            </span>
                        `
                            )
                            .join('')}
                    </div>
                </div>
                <textarea id="commentContent" placeholder="分享您的学习心得和问题..." maxlength="2000"></textarea>
                <div class="form-actions">
                    <span class="char-count"><span id="charCount">0</span>/2000</span>
                    <button class="btn btn-primary" onclick="app.interactionModule.submitComment('${knowledgeId}')">
                        <i class="fas fa-paper-plane"></i> 发布评论
                    </button>
                </div>
            </div>
        `;

        // 绑定事件
        this.bindRatingEvents(knowledgeId);
        this.bindCharCount();
    }

    /**
     * 绑定评分事件
     */
    bindRatingEvents(knowledgeId) {
        const ratingContainer = document.querySelector(
            `[data-knowledge-id="${knowledgeId}"] .star-rating`
        );
        if (!ratingContainer) {return;}

        ratingContainer.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                ratingContainer.dataset.rating = rating;

                ratingContainer.querySelectorAll('.star').forEach((s, i) => {
                    const icon = s.querySelector('i');
                    if (i < rating) {
                        icon.className = 'fas fa-star';
                        s.classList.add('active');
                    } else {
                        icon.className = 'far fa-star';
                        s.classList.remove('active');
                    }
                });
            });

            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                ratingContainer.querySelectorAll('.star').forEach((s, i) => {
                    const icon = s.querySelector('i');
                    icon.className = i < rating ? 'fas fa-star' : 'far fa-star';
                });
            });

            star.addEventListener('mouseleave', () => {
                const currentRating = parseInt(ratingContainer.dataset.rating) || 0;
                ratingContainer.querySelectorAll('.star').forEach((s, i) => {
                    const icon = s.querySelector('i');
                    icon.className = i < currentRating ? 'fas fa-star' : 'far fa-star';
                });
            });
        });
    }

    /**
     * 绑定字符计数
     */
    bindCharCount() {
        const textarea = document.getElementById('commentContent');
        const charCount = document.getElementById('charCount');
        if (textarea && charCount) {
            textarea.addEventListener('input', () => {
                charCount.textContent = textarea.value.length;
            });
        }
    }

    /**
     * 提交评论
     */
    async submitComment(knowledgeId) {
        const content = document.getElementById('commentContent')?.value?.trim();
        const ratingContainer = document.querySelector(
            `[data-knowledge-id="${knowledgeId}"] .star-rating`
        );
        const rating = ratingContainer ? parseInt(ratingContainer.dataset.rating) || null : null;

        if (!content) {
            this.showMessage('请输入评论内容', 'warning');
            return;
        }

        if (content.length < 5) {
            this.showMessage('评论内容至少需要5个字符', 'warning');
            return;
        }

        await this.addComment(knowledgeId, content, rating);
    }

    /**
     * 渲染评论列表
     */
    renderCommentsList(comments, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {return;}

        if (!comments || comments.length === 0) {
            container.innerHTML =
                '<div class="empty-state"><i class="far fa-comment-dots"></i><p>暂无评论，快来发表第一条评论吧！</p></div>';
            return;
        }

        container.innerHTML = comments.map(comment => this.renderCommentItem(comment)).join('');
    }

    /**
     * 渲染单条评论
     */
    renderCommentItem(comment) {
        const avatar = comment.userId?.avatar || '/images/default-avatar.png';
        const username = comment.userId?.username || '匿名用户';
        const rating = comment.rating
            ? `<div class="comment-rating">${this.renderStars(comment.rating)}</div>`
            : '';

        return `
            <div class="comment-item" data-comment-id="${comment._id}">
                <div class="comment-header">
                    <img src="${avatar}" alt="${username}" class="user-avatar">
                    <div class="comment-meta">
                        <span class="username">${username}</span>
                        <span class="comment-date">${this.formatDate(comment.createdAt)}</span>
                    </div>
                    ${rating}
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                <div class="comment-actions">
                    <button class="btn-link" onclick="app.interactionModule.likeComment('${comment._id}')">
                        <i class="far fa-thumbs-up"></i> 有用 (${comment.helpfulCount || 0})
                    </button>
                    <button class="btn-link" onclick="app.interactionModule.replyComment('${comment._id}', '${username}')">
                        <i class="far fa-comment"></i> 回复
                    </button>
                    ${
                        comment.userId?._id === this.getCurrentUserId()
                            ? `
                        <button class="btn-link text-danger" onclick="app.interactionModule.deleteComment('${comment._id}')">
                            <i class="far fa-trash-alt"></i> 删除
                        </button>
                    `
                            : ''
                    }
                </div>
                ${
                    comment.replies?.length > 0
                        ? `
                    <div class="comment-replies">
                        ${comment.replies.map(reply => this.renderCommentItem(reply)).join('')}
                    </div>
                `
                        : ''
                }
            </div>
        `;
    }

    /**
     * 渲染星级
     */
    renderStars(rating) {
        return Array(5)
            .fill(0)
            .map(
                (_, i) =>
                    `<span class="star ${i < rating ? 'filled' : ''}"><i class="fas fa-star"></i></span>`
            )
            .join('');
    }

    /**
     * 格式化日期
     */
    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取当前用户ID
     */
    getCurrentUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            return user?.id;
        } catch {
            return null;
        }
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        if (window.app && window.app.showMessage) {
            window.app.showMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KnowledgeInteractionModule;
}
