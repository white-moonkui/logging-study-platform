/**
 * 虚拟列表组件
 * 用于高性能渲染大量数据的列表
 */
class VirtualListComponent {
    constructor(options = {}) {
        this.options = {
            itemHeight: options.itemHeight || 60,
            bufferSize: options.bufferSize || 5,
            containerHeight: options.containerHeight || 400,
            renderCallback: options.renderCallback || null,
        };

        this.items = [];
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.scrollTop = 0;
        this.container = null;
        this.content = null;
        this.observer = null;
    }

    /**
     * 初始化虚拟列表
     */
    init(container, items) {
        if (!container) {
            console.error('虚拟列表容器不存在');
            return;
        }

        this.container = container;
        this.items = items || [];

        // 设置容器样式
        container.style.cssText = `
            height: ${this.options.containerHeight}px;
            overflow-y: auto;
            position: relative;
        `;

        // 创建内容容器
        this.content = document.createElement('div');
        this.content.className = 'virtual-list-content';
        container.appendChild(this.content);

        // 设置总高度
        this.content.style.height = `${this.items.length * this.options.itemHeight}px`;

        // 绑定滚动事件
        container.addEventListener('scroll', this.handleScroll.bind(this));

        // 初始渲染
        this.render();

        // 设置Intersection Observer用于性能优化
        this.setupObserver();

        console.log(`📋 虚拟列表初始化完成: ${this.items.length} 项`);
    }

    /**
     * 处理滚动事件
     */
    handleScroll(e) {
        this.scrollTop = e.target.scrollTop;
        this.render();
    }

    /**
     * 渲染可见区域
     */
    render() {
        if (!this.items.length || !this.content) {return;}

        // 计算可见范围
        this.visibleStart = Math.floor(this.scrollTop / this.options.itemHeight);
        this.visibleEnd = Math.min(
            this.visibleStart +
                Math.ceil(this.options.containerHeight / this.options.itemHeight) +
                this.options.bufferSize,
            this.items.length
        );

        // 确保范围有效
        this.visibleStart = Math.max(0, this.visibleStart - this.options.bufferSize);
        this.visibleEnd = Math.min(this.items.length, this.visibleEnd);

        // 创建可见项
        const fragment = document.createDocumentFragment();
        const startOffset = this.visibleStart * this.options.itemHeight;

        this.content.style.transform = `translateY(${startOffset}px)`;

        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const item = this.items[i];
            const itemElement = this.createItemElement(item, i);
            fragment.appendChild(itemElement);
        }

        // 清除旧内容并添加新内容
        this.content.innerHTML = '';
        this.content.appendChild(fragment);

        // 调用渲染回调
        if (this.options.renderCallback) {
            this.options.renderCallback(this.visibleStart, this.visibleEnd);
        }
    }

    /**
     * 创建列表项元素
     */
    createItemElement(item, index) {
        const element = document.createElement('div');
        element.className = 'virtual-list-item';
        element.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: ${this.options.itemHeight}px;
            transform: translateY(${index * this.options.itemHeight}px);
            display: flex;
            align-items: center;
            padding: 0 16px;
            box-sizing: border-box;
            border-bottom: 1px solid #e2e8f0;
        `;

        // 根据数据类型渲染内容
        if (typeof item === 'object') {
            element.innerHTML = `
                <div class="item-content" style="display: flex; align-items: center; gap: 12px; width: 100%;">
                    ${item.icon ? `<i class="${item.icon}" style="color: var(--primary); font-size: 18px;"></i>` : ''}
                    <div class="item-text" style="flex: 1;">
                        <div class="item-title" style="font-weight: 500; color: #1e293b;">${item.title || item.name || ''}</div>
                        ${item.description ? `<div class="item-desc" style="font-size: 12px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ''}
                    </div>
                    ${item.badge ? `<span class="item-badge" style="background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${item.badge}</span>` : ''}
                </div>
            `;
        } else {
            element.textContent = item;
        }

        // 添加点击事件
        element.addEventListener('click', () => {
            this.handleItemClick(item, index);
        });

        return element;
    }

    /**
     * 处理列表项点击
     */
    handleItemClick(item, index) {
        console.log(`点击列表项: ${index}`, item);
        // 触发自定义事件
        this.container.dispatchEvent(
            new CustomEvent('virtualListClick', {
                detail: { item, index },
            })
        );
    }

    /**
     * 设置Intersection Observer
     */
    setupObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) {
                            entry.target.style.opacity = '0.5';
                        } else {
                            entry.target.style.opacity = '1';
                        }
                    });
                },
                { threshold: 0.1 }
            );
        }
    }

    /**
     * 更新列表数据
     */
    updateItems(newItems) {
        this.items = newItems || [];
        this.content.style.height = `${this.items.length * this.options.itemHeight}px`;
        this.render();
    }

    /**
     * 滚动到指定项
     */
    scrollToIndex(index, smooth = true) {
        if (index < 0 || index >= this.items.length) {return;}

        const targetScrollTop = index * this.options.itemHeight;

        if (smooth) {
            this.container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth',
            });
        } else {
            this.container.scrollTop = targetScrollTop;
        }
    }

    /**
     * 滚动到顶部
     */
    scrollToTop(smooth = true) {
        this.scrollToIndex(0, smooth);
    }

    /**
     * 获取当前可见项范围
     */
    getVisibleRange() {
        return {
            start: this.visibleStart,
            end: this.visibleEnd,
            count: this.visibleEnd - this.visibleStart,
        };
    }

    /**
     * 销毁虚拟列表
     */
    destroy() {
        if (this.container) {
            this.container.removeEventListener('scroll', this.handleScroll);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
        this.items = [];
        this.charts = new Map();
        console.log('🗑️ 虚拟列表已销毁');
    }
}

// 导出组件
module.exports = VirtualListComponent;
