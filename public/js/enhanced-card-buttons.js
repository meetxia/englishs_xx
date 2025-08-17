/**
 * 增强的卡片下载按钮组件
 * 为每个学习卡片添加优化的下载按钮
 */

class EnhancedCardButtons {
    constructor() {
        this.cardButtons = new Map();
        this.init();
    }

    /**
     * 初始化增强按钮
     */
    init() {
        this.enhanceExistingCards();
        this.observeNewCards();
        console.log('✅ 增强卡片按钮已初始化');
    }

    /**
     * 增强现有卡片
     */
    enhanceExistingCards() {
        const cards = document.querySelectorAll('.tab-content');
        cards.forEach(card => this.enhanceCard(card));
    }

    /**
     * 监听新卡片的添加
     */
    observeNewCards() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList?.contains('tab-content')) {
                            this.enhanceCard(node);
                        } else {
                            const cards = node.querySelectorAll?.('.tab-content');
                            cards?.forEach(card => this.enhanceCard(card));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 增强单个卡片
     */
    enhanceCard(card) {
        if (this.cardButtons.has(card)) return; // 避免重复增强

        const cardId = card.id || `card-${Date.now()}`;
        if (!card.id) card.id = cardId;

        // 创建增强的下载按钮组
        const buttonGroup = this.createButtonGroup(card);
        
        // 插入到卡片中
        this.insertButtonGroup(card, buttonGroup);
        
        // 记录已增强的卡片
        this.cardButtons.set(card, buttonGroup);
        
        console.log('🎨 已增强卡片:', cardId);
    }

 
    /**
     * 插入按钮组到卡片
     */
    insertButtonGroup(card, buttonGroup) {
        // 设置卡片为相对定位
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }

        // 插入按钮组
        card.appendChild(buttonGroup);
    }

    /**
     * 绑定按钮事件
     */
    bindButtonEvents(buttonGroup, card) {
        const cardId = card.id;

        // 主下载按钮悬停显示菜单
        const mainBtn = buttonGroup.querySelector('.download-primary-btn');
        const optionsMenu = buttonGroup.querySelector('.download-options-menu');
        
        let hoverTimeout;
        
        mainBtn.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            optionsMenu.classList.add('show');
        });
        
        buttonGroup.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                optionsMenu.classList.remove('show');
            }, 200);
        });

        // 主下载按钮点击 - 快速下载
        mainBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.quickDownload(card, 'png', 2);
        });

        // 下载选项点击
        buttonGroup.querySelectorAll('.option-btn:not(.advanced-settings)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const format = btn.dataset.format;
                const quality = parseInt(btn.dataset.quality) || 2;
                this.quickDownload(card, format, quality);
                optionsMenu.classList.remove('show');
            });
        });

        // 高级设置按钮
        buttonGroup.querySelector('.advanced-settings').addEventListener('click', (e) => {
            e.stopPropagation();
            this.openAdvancedSettings(card);
            optionsMenu.classList.remove('show');
        });

        // 预览按钮
        buttonGroup.querySelector('.preview-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.previewCard(card);
        });

        // 分享按钮
        buttonGroup.querySelector('.share-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.shareCard(card);
        });

        // 收藏按钮
        buttonGroup.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(card);
        });
    }

    /**
     * 快速下载 - 已禁用
     */
    async quickDownload(card, format, quality) {
        const statusIndicator = card.querySelector('.card-status-indicator');
        this.updateStatus(statusIndicator, 'error', '下载已禁用');
        this.showToast('下载功能已禁用', 'warning');

        // 3秒后恢复状态
        setTimeout(() => {
            this.updateStatus(statusIndicator, 'ready', '就绪');
        }, 3000);
    }

    /**
     * 下载为图片 - 已禁用
     */
    async downloadAsImage(card, filename, format, quality) {
        console.log('图片下载功能已禁用');
        throw new Error('图片下载功能已禁用');
    }

    /**
     * 下载为PDF - 已禁用
     */
    async downloadAsPDF(card, filename) {
        console.log('PDF下载功能已禁用');
        throw new Error('PDF下载功能已禁用');
    }

    /**
     * 打开高级设置 - 已禁用
     */
    openAdvancedSettings(card) {
        this.showToast('专业版下载功能已移除', 'warning');
    }

    /**
     * 预览卡片
     */
    previewCard(card) {
        // 实现预览功能
        this.showToast('预览功能开发中...', 'info');
    }

    /**
     * 分享卡片
     */
    shareCard(card) {
        // 实现分享功能
        if (navigator.share) {
            navigator.share({
                title: this.getCardTitle(card),
                text: '查看我的英语学习卡片',
                url: window.location.href
            });
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href);
            this.showToast('链接已复制到剪贴板', 'success');
        }
    }

    /**
     * 切换收藏状态
     */
    toggleFavorite(card) {
        const favoriteBtn = card.querySelector('.favorite-btn');
        const isFavorited = favoriteBtn.classList.contains('favorited');
        
        if (isFavorited) {
            favoriteBtn.classList.remove('favorited');
            this.showToast('已取消收藏', 'info');
        } else {
            favoriteBtn.classList.add('favorited');
            this.showToast('已添加到收藏', 'success');
        }
    }

    /**
     * 更新状态指示器
     */
    updateStatus(statusIndicator, status, text) {
        const dot = statusIndicator.querySelector('.status-dot');
        const textEl = statusIndicator.querySelector('.status-text');
        
        dot.className = `status-dot status-${status}`;
        textEl.textContent = text;
    }

    /**
     * 获取卡片标题
     */
    getCardTitle(card) {
        const titleSelectors = ['h1', 'h2', 'h3', '.title', '.card-title'];
        
        for (const selector of titleSelectors) {
            const titleEl = card.querySelector(selector);
            if (titleEl) {
                return titleEl.textContent.trim().substring(0, 30);
            }
        }
        
        const mode = this.detectCardMode(card);
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
    detectCardMode(card) {
        const cardId = card.id;
        if (cardId.includes('card1')) return 'story';
        if (cardId.includes('card2')) return 'bilingual';
        if (cardId.includes('card3')) return 'vocab';
        if (cardId.includes('card4')) return 'test';
        return 'story';
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 复用悬浮工具栏的toast功能
        if (window.floatingDownloadToolbar) {
            window.floatingDownloadToolbar.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// 全局实例
let enhancedCardButtons;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        try {
            enhancedCardButtons = new EnhancedCardButtons();
            window.enhancedCardButtons = enhancedCardButtons;
            console.log('✅ 增强卡片按钮已全局初始化');
        } catch (error) {
            console.error('❌ 增强卡片按钮初始化失败:', error);
        }
    }, 1500);
});

window.EnhancedCardButtons = EnhancedCardButtons;
