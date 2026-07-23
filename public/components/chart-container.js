/**
 * 图表容器组件
 * 封装Chart.js图表的创建和管理
 */
class ChartContainerComponent {
    constructor(options = {}) {
        this.options = options;
        this.charts = new Map();
        this.defaultColors = [
            'rgba(37, 99, 235, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
        ];
    }

    /**
     * 创建图表容器
     */
    createContainer(id, type = 'line', options = {}) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.id = id;

        const canvas = document.createElement('canvas');
        canvas.id = `${id}-canvas`;

        if (options.height) {
            container.style.height = options.height;
        }

        container.appendChild(canvas);
        return container;
    }

    /**
     * 创建图表
     */
    createChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`找不到画布元素: ${canvasId}`);
            return null;
        }

        // 检查Chart.js是否可用
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js未加载，使用降级方案');
            return this.createFallbackChart(canvasId, config);
        }

        const chart = new Chart(canvas.getContext('2d'), {
            type: config.type || 'line',
            data: config.data || {
                labels: [],
                datasets: [],
            },
            options: config.options || this.getDefaultOptions(),
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * 获取默认配置
     */
    getDefaultOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                },
            },
            scales: this.getDefaultScales(),
            animation: {
                duration: 1000,
                easing: 'easeOutQuart',
            },
        };
    }

    /**
     * 获取默认坐标轴配置
     */
    getDefaultScales() {
        return {
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
        };
    }

    /**
     * 创建降级图表（纯CSS）
     */
    createFallbackChart(id, config) {
        const container = document.getElementById(id);
        if (!container) {return null;}

        // 创建简单的HTML图表
        const chartHtml = `
            <div class="fallback-chart" id="${id}-fallback">
                <div class="chart-bars">
                    ${
                        config.data?.labels
                            ?.map(
                                (label, index) => `
                        <div class="chart-bar-item">
                            <div class="chart-bar" style="height: ${config.data?.datasets?.[0]?.data?.[index] || 50}%"></div>
                            <span class="chart-label">${label}</span>
                        </div>
                    `
                            )
                            .join('') || ''
                    }
                </div>
            </div>
        `;

        // 清除原有内容并添加降级图表
        const canvas = container.querySelector('canvas');
        if (canvas) {canvas.remove();}
        container.innerHTML += chartHtml;

        return { type: 'fallback', id };
    }

    /**
     * 更新图表数据
     */
    updateChart(canvasId, newData) {
        const chart = this.charts.get(canvasId);
        if (chart && chart.type !== 'fallback') {
            chart.data = newData;
            chart.update();
        }
    }

    /**
     * 销毁图表
     */
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
        }
    }

    /**
     * 销毁所有图表
     */
    destroyAll() {
        this.charts.forEach((chart, id) => {
            if (chart.destroy) {
                chart.destroy();
            }
        });
        this.charts.clear();
    }
}

// 导出组件
module.exports = ChartContainerComponent;
