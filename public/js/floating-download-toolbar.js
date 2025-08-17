/**
 * 悬浮下载工具栏
 * 提供快速、智能的图片下载功能
 */

class FloatingDownloadToolbar {
    constructor() {
        this.isExpanded = false;
        this.selectedCards = new Set();
        this.downloadQueue = [];
        this.isProcessing = false;
        this.currentPreset = 'social';
        
        // 下载预设配置
        this.presets = {
            social: {
                name: '社交分享',
                icon: '📱',
                format: 'png',
                quality: 2,
                aspectRatio: '1:1',
                background: 'gradient',
                description: '正方形，高对比度'
            },
            study: {
                name: '学习笔记',
                icon: '📚',
                format: 'pdf',
                quality: 3,
                aspectRatio: '4:3',
                background: 'white',
                description: 'A4比例，清晰字体'
            },
            mobile: {
                name: '手机壁纸',
                icon: '📱',
                format: 'png',
                quality: 4,
                aspectRatio: '9:16',
                background: 'transparent',
                description: '手机屏幕比例'
            },
            presentation: {
                name: '演示文稿',
                icon: '🎯',
                format: 'png',
                quality: 3,
                aspectRatio: '16:9',
                background: 'white',
                description: '16:9比例，大字体'
            }
        };
        
        this.init();
    }

    /**
     * 初始化工具栏
     */
    init() {
        this.createToolbar();
        this.bindEvents();
        this.updateCardSelectors();
        console.log('✅ 悬浮下载工具栏已初始化');
    }

    /**
     * 生成预设按钮
     */
    generatePresetButtons() {
        const container = document.getElementById('preset-buttons');
        container.innerHTML = '';

        Object.entries(this.presets).forEach(([key, preset]) => {
            const button = document.createElement('button');
            button.className = `preset-btn ${key === this.currentPreset ? 'active' : ''}`;
            button.dataset.preset = key;
            button.title = preset.description;
            
            button.innerHTML = `
                <span class="preset-icon">${preset.icon}</span>
                <span class="preset-name">${preset.name}</span>
            `;
            
            container.appendChild(button);
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 主按钮点击事件
        document.getElementById('toolbar-main-btn').addEventListener('click', () => {
            this.toggleExpand();
        });

        // 快速下载事件
        document.getElementById('quick-download-current').addEventListener('click', () => {
            this.quickDownloadCurrent();
        });

        document.getElementById('quick-download-all').addEventListener('click', () => {
            this.quickDownloadAll();
        });

        // 预设选择事件
        document.getElementById('preset-buttons').addEventListener('click', (e) => {
            if (e.target.closest('.preset-btn')) {
                const preset = e.target.closest('.preset-btn').dataset.preset;
                this.selectPreset(preset);
            }
        });

        // 格式选择事件
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 批量操作事件
        document.getElementById('select-all-cards').addEventListener('click', () => {
            this.selectAllCards();
        });

        document.getElementById('clear-selection').addEventListener('click', () => {
            this.clearSelection();
        });

        document.getElementById('batch-download').addEventListener('click', () => {
            this.batchDownload();
        });

        // 高级设置事件
        document.getElementById('open-advanced-modal').addEventListener('click', () => {
            this.openAdvancedModal();
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#floating-download-toolbar')) {
                this.collapse();
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'd':
                        e.preventDefault();
                        this.quickDownloadCurrent();
                        break;
                    case 'a':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.selectAllCards();
                        }
                        break;
                }
            }
        });
    }

    /**
     * 更新卡片选择器
     */
    updateCardSelectors() {
        const cards = document.querySelectorAll('.tab-content');
        cards.forEach((card, index) => {
            if (!card.querySelector('.card-selector')) {
                const selector = document.createElement('div');
                selector.className = 'card-selector';
                selector.innerHTML = `
                    <input type="checkbox" id="card-${index}" class="card-checkbox">
                    <label for="card-${index}" class="card-checkbox-label">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </label>
                `;

                card.style.position = 'relative';
                card.appendChild(selector);

                // 绑定选择事件
                selector.querySelector('.card-checkbox').addEventListener('change', (e) => {
                    this.toggleCardSelection(card, e.target.checked);
                });
            }
        });
    }

    /**
     * 展开/收起工具栏
     */
    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        const panel = document.getElementById('toolbar-panel');
        const mainBtn = document.getElementById('toolbar-main-btn');

        if (this.isExpanded) {
            panel.classList.add('expanded');
            mainBtn.classList.add('expanded');
        } else {
            panel.classList.remove('expanded');
            mainBtn.classList.remove('expanded');
        }
    }

    /**
     * 收起工具栏
     */
    collapse() {
        if (this.isExpanded) {
            this.isExpanded = false;
            document.getElementById('toolbar-panel').classList.remove('expanded');
            document.getElementById('toolbar-main-btn').classList.remove('expanded');
        }
    }

    /**
     * 选择预设
     */
    selectPreset(presetKey) {
        this.currentPreset = presetKey;

        // 更新预设按钮状态
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === presetKey);
        });

        // 更新格式选择
        const preset = this.presets[presetKey];
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === preset.format);
        });

        console.log('📋 已选择预设:', preset.name);
    }

    /**
     * 切换卡片选择状态
     */
    toggleCardSelection(card, selected) {
        const cardId = card.id || card.querySelector('[id]')?.id;
        if (!cardId) return;

        if (selected) {
            this.selectedCards.add(cardId);
            card.classList.add('selected');
        } else {
            this.selectedCards.delete(cardId);
            card.classList.remove('selected');
        }

        this.updateSelectionCount();
        this.updateBatchDownloadButton();
    }

    /**
     * 更新选择计数
     */
    updateSelectionCount() {
        const count = this.selectedCards.size;
        const badge = document.getElementById('selected-count');
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }

    /**
     * 更新批量下载按钮状态
     */
    updateBatchDownloadButton() {
        const btn = document.getElementById('batch-download');
        const hasSelection = this.selectedCards.size > 0;
        btn.disabled = !hasSelection;
        btn.textContent = hasSelection ? `批量下载 (${this.selectedCards.size})` : '批量下载';
    }

    /**
     * 全选卡片
     */
    selectAllCards() {
        const checkboxes = document.querySelectorAll('.card-checkbox');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    }

    /**
     * 清除选择
     */
    clearSelection() {
        const checkboxes = document.querySelectorAll('.card-checkbox');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    }

    /**
     * 快速下载当前卡片
     */
    async quickDownloadCurrent() {
        const activeCard = document.querySelector('.tab-content.active') || document.querySelector('.tab-content');
        if (!activeCard) {
            this.showToast('没有找到可下载的卡片', 'warning');
            return;
        }

        this.showToast('正在下载当前卡片...', 'info');

        try {
            await this.downloadCard(activeCard);
            this.showToast('下载完成！', 'success');
        } catch (error) {
            console.error('下载失败:', error);
            this.showToast('下载失败，请重试', 'error');
        }
    }

    /**
     * 快速下载所有卡片
     */
    async quickDownloadAll() {
        const cards = document.querySelectorAll('.tab-content');
        if (cards.length === 0) {
            this.showToast('没有找到可下载的卡片', 'warning');
            return;
        }

        this.showToast(`正在下载 ${cards.length} 个卡片...`, 'info');
        this.showProgress(true);

        try {
            for (let i = 0; i < cards.length; i++) {
                this.updateProgress(i + 1, cards.length, `正在下载第 ${i + 1} 个卡片...`);
                await this.downloadCard(cards[i], i);
                await this.delay(500); // 避免过快下载
            }

            this.showToast('所有卡片下载完成！', 'success');
        } catch (error) {
            console.error('批量下载失败:', error);
            this.showToast('批量下载失败，请重试', 'error');
        } finally {
            this.showProgress(false);
        }
    }

    /**
     * 批量下载选中的卡片
     */
    async batchDownload() {
        if (this.selectedCards.size === 0) {
            this.showToast('请先选择要下载的卡片', 'warning');
            return;
        }

        const selectedElements = Array.from(this.selectedCards).map(id =>
            document.getElementById(id) || document.querySelector(`[id="${id}"]`)
        ).filter(el => el);

        this.showToast(`正在批量下载 ${selectedElements.length} 个卡片...`, 'info');
        this.showProgress(true);

        try {
            for (let i = 0; i < selectedElements.length; i++) {
                this.updateProgress(i + 1, selectedElements.length, `正在下载第 ${i + 1} 个卡片...`);
                await this.downloadCard(selectedElements[i], i);
                await this.delay(500);
            }

            this.showToast('批量下载完成！', 'success');
            this.clearSelection(); // 下载完成后清除选择
        } catch (error) {
            console.error('批量下载失败:', error);
            this.showToast('批量下载失败，请重试', 'error');
        } finally {
            this.showProgress(false);
        }
    }

    /**
     * 下载单个卡片
     */
    async downloadCard(cardElement, index = 0) {
        const preset = this.presets[this.currentPreset];
        const format = document.querySelector('.format-btn.active')?.dataset.format || preset.format;

        // 获取卡片信息
        const cardId = cardElement.id || `card-${index}`;
        const cardTitle = this.getCardTitle(cardElement);
        const filename = `${cardTitle}_${preset.name}_${Date.now()}`;

        // 根据格式选择下载方法
        if (format === 'pdf') {
            return await this.downloadAsPDF(cardElement, filename);
        } else {
            return await this.downloadAsImage(cardElement, filename, format, preset.quality);
        }
    }

    /**
     * 下载为图片 - 已禁用
     */
    async downloadAsImage(element, filename, format = 'png', quality = 2) {
        console.log('图片下载功能已禁用');
        this.showToast('图片下载功能已禁用', 'warning');
    }

    /**
     * 基础图片下载方法 - 已禁用
     */
    async basicImageDownload(element, filename, format, quality) {
        console.log('基础图片下载功能已禁用');
        this.showToast('图片下载功能已禁用', 'warning');
    }

    /**
     * 下载为PDF - 已禁用
     */
    async downloadAsPDF(element, filename) {
        console.log('PDF下载功能已禁用');
        this.showToast('PDF下载功能已禁用', 'warning');
    }

    /**
     * 打开高级模态框 - 已禁用
     */
    openAdvancedModal() {
        this.showToast('专业版下载功能已移除', 'warning');
    }

    /**
     * 获取卡片标题
     */
    getCardTitle(cardElement) {
        // 尝试从不同位置获取标题
        const titleSelectors = [
            'h1', 'h2', 'h3', '.title', '.card-title',
            '[data-title]', '.story-title'
        ];

        for (const selector of titleSelectors) {
            const titleEl = cardElement.querySelector(selector);
            if (titleEl) {
                return titleEl.textContent.trim().substring(0, 50);
            }
        }

        // 如果没有找到标题，使用默认名称
        const mode = this.detectCardMode(cardElement);
        const modeNames = {
            'story': '爽文带背',
            'bilingual': '中英对照',
            'vocab': '单词列表',
            'test': '填空测试'
        };

        return modeNames[mode] || '学习卡片';
    }

    /**
     * 检测卡片模式
     */
    detectCardMode(cardElement) {
        const cardId = cardElement.id;
        if (cardId.includes('card1')) return 'story';
        if (cardId.includes('card2')) return 'bilingual';
        if (cardId.includes('card3')) return 'vocab';
        if (cardId.includes('card4')) return 'test';

        // 根据内容特征检测
        if (cardElement.querySelector('.highlight')) return 'story';
        if (cardElement.querySelector('.vocab-item')) return 'vocab';
        if (cardElement.querySelector('input[type="text"]')) return 'test';

        return 'story'; // 默认
    }

    /**
     * 显示/隐藏进度条
     */
    showProgress(show) {
        const section = document.getElementById('download-progress-section');
        section.style.display = show ? 'block' : 'none';

        if (!show) {
            this.updateProgress(0, 0, '');
        }
    }

    /**
     * 更新进度条
     */
    updateProgress(current, total, message) {
        const fill = document.getElementById('progress-fill');
        const text = document.getElementById('progress-text');

        const percentage = total > 0 ? (current / total) * 100 : 0;
        fill.style.width = `${percentage}%`;
        text.textContent = message || `${current}/${total}`;
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `download-toast toast-${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => toast.classList.add('show'), 100);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 销毁工具栏
     */
    destroy() {
        const toolbar = document.getElementById('floating-download-toolbar');
        if (toolbar) {
            toolbar.remove();
        }

        // 移除卡片选择器
        document.querySelectorAll('.card-selector').forEach(selector => {
            selector.remove();
        });

        console.log('🗑️ 悬浮下载工具栏已销毁');
    }
}

// 全局实例
let floatingDownloadToolbar;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待一段时间确保其他脚本加载完成
    setTimeout(() => {
        try {
            floatingDownloadToolbar = new FloatingDownloadToolbar();
            window.floatingDownloadToolbar = floatingDownloadToolbar;
            console.log('✅ 悬浮下载工具栏已全局初始化');
        } catch (error) {
            console.error('❌ 悬浮下载工具栏初始化失败:', error);
        }
    }, 1000);
});

// 导出给其他模块使用
window.FloatingDownloadToolbar = FloatingDownloadToolbar;
