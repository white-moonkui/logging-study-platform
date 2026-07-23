/**
 * 知识卡片组件
 * 提供统一的卡片渲染接口
 */
class KnowledgeCardComponent {
    constructor(options = {}) {
        this.options = options;
    }

    /**
     * 创建知识卡片HTML
     */
    createCard(data, options = {}) {
        const {
            id,
            title,
            description,
            icon,
            category,
            subcategory,
            tags = [],
            viewCount = 0,
            averageRating = null,
            readingTime = 10,
            difficulty = 'intermediate',
            isFavorite = false,
            showStats = true,
            viewMode = 'card',
        } = data;

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

        const categoryIcons = {
            basic: 'fa-book',
            standard: 'fa-ruler-combined',
            cross: 'fa-project-diagram',
            equipment: 'fa-microchip',
            operation: 'fa-hard-hat',
        };

        const displayIcon = icon || categoryIcons[category] || 'fa-book';
        const displayRating = averageRating
            ? `<span class="rating"><i class="fas fa-star"></i> ${averageRating.toFixed(1)}</span>`
            : '';

        if (viewMode === 'list') {
            return this.createListItem(
                {
                    id,
                    title,
                    description,
                    displayIcon,
                    category,
                    subcategory,
                    tags,
                    viewCount,
                    displayRating,
                    readingTime,
                    difficulty,
                    difficultyClass,
                    difficultyText,
                    isFavorite,
                    showStats,
                },
                options
            );
        }

        return `
            <div class="knowledge-card ${difficultyClass[difficulty] || ''}" 
                 data-id="${id}" 
                 data-category="${category || ''}"
                 data-subcategory="${subcategory || ''}">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="${displayIcon}"></i>
                    </div>
                    <div class="card-title-wrap">
                        <h3>${title}</h3>
                        <div class="card-meta">
                            <span class="category-tag">${this.getCategoryText(category)}</span>
                            <span class="difficulty-tag ${difficultyClass[difficulty]}">${difficultyText[difficulty] || '进阶'}</span>
                        </div>
                    </div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="event.stopPropagation(); app.toggleFavorite('${id}')">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="card-body">
                    <p class="description">${description?.substring(0, 120)}${description?.length > 120 ? '...' : ''}</p>
                    ${
                        tags.length > 0
                            ? `
                        <div class="card-tags">
                            ${tags
                                .slice(0, 3)
                                .map(tag => `<span class="tag">${tag}</span>`)
                                .join('')}
                            ${tags.length > 3 ? `<span class="tag tag-more">+${tags.length - 3}</span>` : ''}
                        </div>
                    `
                            : ''
                    }
                </div>
                ${
                    showStats
                        ? `
                    <div class="card-stats">
                        <span class="stat"><i class="fas fa-eye"></i> ${viewCount}</span>
                        ${displayRating ? `<span class="stat rating">${displayRating}</span>` : ''}
                        <span class="stat"><i class="fas fa-clock"></i> ${readingTime}分钟</span>
                    </div>
                `
                        : ''
                }
                <div class="card-actions">
                    <button class="btn-small" onclick="event.stopPropagation(); app.startLearning('${category}', '${id}')">
                        <i class="fas fa-play"></i> 开始学习
                    </button>
                    <button class="btn-small btn-outline" onclick="event.stopPropagation(); app.viewKnowledgeDetail('${category}', '${id}')">
                        <i class="fas fa-eye"></i> 查看详情
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 创建列表项HTML
     */
    createListItem(data, options = {}) {
        const {
            id,
            title,
            description,
            displayIcon,
            category,
            subcategory,
            tags,
            viewCount,
            displayRating,
            readingTime,
        } = data;

        return `
            <div class="knowledge-list-item" data-id="${id}" data-category="${category || ''}">
                <div class="list-icon">
                    <i class="${displayIcon}"></i>
                </div>
                <div class="list-content">
                    <div class="list-header">
                        <h3>${title}</h3>
                        <div class="list-meta">
                            <span class="category-tag">${this.getCategoryText(category)}</span>
                            ${displayRating ? `<span class="rating">${displayRating}</span>` : ''}
                        </div>
                    </div>
                    <p class="description">${description?.substring(0, 200)}${description?.length > 200 ? '...' : ''}</p>
                    <div class="list-footer">
                        ${
                            tags.length > 0
                                ? `
                            <div class="card-tags">
                                ${tags
                                    .slice(0, 5)
                                    .map(tag => `<span class="tag">${tag}`)
                                    .join(
                                        '</span>'
                                    )}${tags.length > 5 ? `<span class="tag tag-more">+${tags.length - 5}</span>` : ''}
                            </div>
                        `
                                : ''
                        }
                        <div class="list-stats">
                            <span><i class="fas fa-eye"></i> ${viewCount}</span>
                            <span><i class="fas fa-clock"></i> ${readingTime}分钟</span>
                        </div>
                    </div>
                </div>
                <div class="list-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); app.startLearning('${category}', '${id}')">
                        <i class="fas fa-play"></i> 学习
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); app.viewKnowledgeDetail('${category}', '${id}')">
                        <i class="fas fa-info-circle"></i> 详情
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 获取分类中文名称
     */
    getCategoryText(category) {
        const categoryMap = {
            basic: '基础知识',
            standard: '标准规范',
            cross: '跨学科',
            equipment: '仪器设备',
            operation: '现场作业',
        };
        return categoryMap[category] || category || '未分类';
    }

    /**
     * 渲染多个卡片
     */
    renderCards(dataList, container) {
        const html = dataList.map(data => this.createCard(data)).join('');
        if (container) {
            container.innerHTML = html;
        }
        return html;
    }

    /**
     * 初始化事件监听
     */
    initEvents(container) {
        if (!container) {return;}

        container.querySelectorAll('.knowledge-card').forEach(card => {
            card.addEventListener('click', e => {
                // 阻止事件冒泡到卡片操作按钮
                if (e.target.closest('.card-actions')) {return;}

                const id = card.dataset.id;
                const category = card.dataset.category;
                app.viewKnowledgeDetail(id, category);
            });
        });
    }
}

// 导出组件
module.exports = KnowledgeCardComponent;
