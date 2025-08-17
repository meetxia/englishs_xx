// HTML2IMG 集成模块 - 将html2img功能集成到主项目中
class HTML2IMGIntegration {
    constructor() {
        console.log('🔧 html2imgIntegration: 初始化HTML2IMG集成类...');
        
        this.currentSettings = {
            template: 'template-modern',
            fontFamily: 'font-noto-sans',
            fontSize: 20,
            charsPerPage: 300,
            padding: 8,
            lineHeight: 1.75,
            letterSpacing: 0.025,
            backgroundImage: '',
            watermark: '',
            useMarkdown: true,
            autoFitFontSize: true,
            imageQuality: 2
        };
        this.isModalOpen = false;
        this.currentCardData = null;
        this.previewElement = null;
        this.modalInitialized = false;
        this.initRetries = 0;
        this.maxRetries = 5;

        // 延迟初始化模态框，确保DOM和所有依赖都已加载
        this.startInitialization();
    }

    startInitialization() {
        const initDelay = Math.min(500 + (this.initRetries * 1000), 10000); // 递增延迟，最大10秒
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.initializeModal(), initDelay);
            });
        } else {
            setTimeout(() => this.initializeModal(), initDelay);
        }
    }

    // 初始化模态框
    initializeModal() {
        if (this.modalInitialized) {
            console.log('✅ html2imgIntegration: 模态框已经初始化过了');
            return true;
        }

        try {
            console.log('🔧 html2imgIntegration: 开始初始化HTML2IMG模态框...');

            // 检查必要的依赖（图片下载相关依赖已移除）
            const missingDeps = [];
            if (!window.marked) {
                missingDeps.push('marked');
            }
            if (!window.DOMPurify) {
                missingDeps.push('DOMPurify');
            }

            if (missingDeps.length > 0) {
                this.initRetries++;
                console.warn(`⚠️  html2imgIntegration: 以下依赖库未加载: ${missingDeps.join(', ')} (重试 ${this.initRetries}/${this.maxRetries})`);
                
                if (this.initRetries < this.maxRetries) {
                    console.log(`🔄 html2imgIntegration: ${3 + this.initRetries}秒后重试初始化...`);
                    setTimeout(() => this.initializeModal(), (3 + this.initRetries) * 1000);
                } else {
                    console.error('❌ html2imgIntegration: 达到最大重试次数，初始化失败');
                    window.dispatchEvent(new CustomEvent('html2imgIntegrationFailed', {
                        detail: { error: '依赖库加载失败', missingDeps }
                    }));
                }
                return false;
            }

            // 检查模态框是否已存在，如果存在则移除旧的
            const existingModal = document.getElementById('html2img-modal');
            if (existingModal) {
                console.log('🗑️  html2imgIntegration: 移除已存在的模态框');
                existingModal.remove();
            }

            // 创建新的模态框HTML
            console.log('🏗️  html2imgIntegration: 创建模态框HTML...');
            const modalHTML = this.createModalHTML();
            if (!modalHTML) {
                throw new Error('创建模态框HTML失败');
            }

            console.log('📝 html2imgIntegration: 插入模态框HTML到页面...');
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 验证模态框是否成功创建
            const modal = document.getElementById('html2img-modal');
            if (!modal) {
                throw new Error('模态框元素创建失败');
            }

            // 绑定事件监听器
            console.log('🔗 html2imgIntegration: 绑定事件监听器...');
            this.bindEventListeners();

            this.modalInitialized = true;
            console.log('✅ html2imgIntegration: HTML2IMG模态框初始化完成');

            // 通知页面初始化成功
            window.dispatchEvent(new CustomEvent('html2imgIntegrationReady', {
                detail: { integration: this }
            }));

            return true;

        } catch (error) {
            console.error('❌ html2imgIntegration: 初始化模态框失败:', error);
            this.initRetries++;
            if (this.initRetries < this.maxRetries) {
                console.log(`🔄 html2imgIntegration: 10秒后重试初始化... (${this.initRetries}/${this.maxRetries})`);
                setTimeout(() => this.initializeModal(), 10000);
            } else {
                console.error('❌ html2imgIntegration: 达到最大重试次数，初始化彻底失败');
                window.dispatchEvent(new CustomEvent('html2imgIntegrationFailed', {
                    detail: { error: error.message }
                }));
            }
            return false;
        }
    }

    // 创建模态框HTML结构
    createModalHTML() {
        return `
        <div id="html2img-modal" class="fixed inset-0 bg-black bg-opacity-60 hidden z-[9999] flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                <!-- 模态框头部 -->
                <div class="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
                    <div class="flex items-center space-x-3">
                        <h3 class="text-xl font-bold text-gray-800">🎨 智能图片编辑器</h3>
                        <span id="current-card-indicator" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"></span>
                    </div>
                    <button onclick="html2imgIntegration.closeModal()" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-xl transition-colors">
                        ✕
                    </button>
                </div>

                <!-- 模态框主体内容 -->
                <div class="flex flex-1 min-h-0">
                    <!-- 左侧控制面板 -->
                    <div class="w-1/3 bg-gray-50 flex flex-col">
                        <div class="flex-1 overflow-y-auto p-6">
                            <!-- 内容编辑区域 -->
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold mb-3 text-gray-700">📝 内容编辑</h4>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">标题</label>
                                        <input type="text" id="html2img-title-input" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                               placeholder="输入卡片标题..." oninput="html2imgIntegration.updateContent()">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">内容</label>
                                        <textarea id="html2img-content-textarea" rows="6" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                  placeholder="编辑卡片内容..." oninput="html2imgIntegration.updateContent()"></textarea>
                                    </div>
                                    <div class="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                                        <span class="text-sm font-medium text-yellow-800">启用 Markdown</span>
                                        <label class="inline-flex relative items-center cursor-pointer">
                                            <input type="checkbox" id="html2img-markdown" class="sr-only peer" checked onchange="html2imgIntegration.updateSetting('useMarkdown', this.checked)">
                                            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- 模板选择 -->
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold mb-3 text-gray-700">🎨 选择模板</h4>
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="template-option active" data-template="template-modern" onclick="html2imgIntegration.selectTemplate('template-modern')">
                                        <div class="w-full h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-2"></div>
                                        <span class="text-sm font-medium">现代简约</span>
                                    </div>
                                    <div class="template-option" data-template="template-academic" onclick="html2imgIntegration.selectTemplate('template-academic')">
                                        <div class="w-full h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg mb-2"></div>
                                        <span class="text-sm font-medium">学术风格</span>
                                    </div>
                                    <div class="template-option" data-template="template-creative" onclick="html2imgIntegration.selectTemplate('template-creative')">
                                        <div class="w-full h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg mb-2"></div>
                                        <span class="text-sm font-medium">创意活泼</span>
                                    </div>
                                    <div class="template-option" data-template="template-business" onclick="html2imgIntegration.selectTemplate('template-business')">
                                        <div class="w-full h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg mb-2"></div>
                                        <span class="text-sm font-medium">商务正式</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 字体设置 -->
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold mb-3 text-gray-700">🔤 字体设置</h4>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">字体类型</label>
                                        <select id="html2img-font-family" class="w-full p-2 border border-gray-300 rounded-lg" onchange="html2imgIntegration.updateSetting('fontFamily', this.value)">
                                            <option value="font-noto-sans">思源黑体</option>
                                            <option value="font-noto-serif">思源宋体</option>
                                            <option value="font-zcool">ZCOOL快乐体</option>
                                        </select>
                                    </div>
                                    <div id="font-size-control">
                                        <label class="block text-sm font-medium text-gray-600 mb-1">字体大小: <span id="font-size-value">20</span>px</label>
                                        <input type="range" id="html2img-font-size" min="12" max="80" value="20" class="w-full"
                                               oninput="html2imgIntegration.updateSetting('fontSize', this.value)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">行间距: <span id="line-height-value">1.75</span></label>
                                        <input type="range" id="html2img-line-height" min="1.2" max="2.5" value="1.75" step="0.05" class="w-full"
                                               oninput="html2imgIntegration.updateSetting('lineHeight', this.value)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">字间距: <span id="letter-spacing-value">0.025</span>em</label>
                                        <input type="range" id="html2img-letter-spacing" min="-0.05" max="0.2" value="0.025" step="0.005" class="w-full"
                                               oninput="html2imgIntegration.updateSetting('letterSpacing', this.value)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">内边距: <span id="padding-value">8</span></label>
                                        <input type="range" id="html2img-padding" min="4" max="16" value="8" step="1" class="w-full"
                                               oninput="html2imgIntegration.updateSetting('padding', this.value)">
                                    </div>
                                </div>
                            </div>

                            <!-- 高级设置 -->
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold mb-3 text-gray-700">⚙️ 高级设置</h4>
                                <div class="space-y-3">
                                    <div class="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                        <span class="text-sm font-medium text-blue-800">AI 智能字号</span>
                                        <label class="inline-flex relative items-center cursor-pointer">
                                            <input type="checkbox" id="html2img-autofit" class="sr-only peer" checked onchange="html2imgIntegration.updateSetting('autoFitFontSize', this.checked)">
                                            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">背景图片 URL</label>
                                        <input type="text" id="html2img-background" class="w-full p-2 border border-gray-300 rounded-lg"
                                               placeholder="输入图片链接..." oninput="html2imgIntegration.updateSetting('backgroundImage', this.value)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">水印文字</label>
                                        <input type="text" id="html2img-watermark" class="w-full p-2 border border-gray-300 rounded-lg"
                                               placeholder="输入水印文字..." oninput="html2imgIntegration.updateSetting('watermark', this.value)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">图片质量</label>
                                        <select id="html2img-quality" class="w-full p-2 border border-gray-300 rounded-lg" onchange="html2imgIntegration.updateSetting('imageQuality', this.value)">
                                            <option value="1">标准 (1x)</option>
                                            <option value="2" selected>高清 (2x)</option>
                                            <option value="3">超高清 (3x)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 操作按钮区域 -->
                        <div class="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
                            <div class="space-y-3">
                                <button onclick="html2imgIntegration.downloadSingleCard()" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg">
                                    🎨 下载当前卡片
                                </button>
                                <button onclick="html2imgIntegration.downloadAllCards()" class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                                    📦 下载全部卡片
                                </button>
                                <button onclick="html2imgIntegration.resetSettings()" class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                                    🔄 重置设置
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧预览区域 -->
                    <div class="flex-1 bg-white flex flex-col">
                        <div class="p-4 border-b border-gray-200 flex-shrink-0 flex justify-between items-center">
                            <h4 class="text-lg font-semibold text-gray-800">📱 实时预览</h4>
                            <div class="flex space-x-2">
                                <button onclick="html2imgIntegration.switchCard('prev')" class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm">
                                    ← 上一张
                                </button>
                                <button onclick="html2imgIntegration.switchCard('next')" class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm">
                                    下一张 →
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 p-4 flex items-start justify-center bg-gray-50 min-h-0 overflow-auto">
                            <div id="html2img-preview-container" class="bg-white rounded-lg shadow-lg overflow-hidden" style="width: 400px; height: 533px;">
                                <div id="html2img-preview-area" class="relative w-full h-full flex flex-col overflow-hidden p-8" style="width: 400px; height: 533px;">
                                    <h2 id="html2img-preview-title" class="title text-2xl font-bold mb-4 break-words"></h2>
                                    <div id="html2img-preview-content" class="whitespace-pre-wrap break-words flex-grow text-base leading-relaxed"></div>
                                    <div id="html2img-preview-watermark" class="watermark absolute inset-0 flex items-center justify-center text-6xl font-bold select-none pointer-events-none opacity-10 -rotate-12"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 模态框外部点击关闭
        const modal = document.getElementById('html2img-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
    }

    // 数据提取功能 - 提取页面标题和4个标签页内容
    extractAllCardData() {
        const cardData = [];

        // 提取页面标题
        const pageTitle = document.title || '爽文背单词卡片';

        // 定义4个标签页的配置
        const tabConfigs = [
            { id: 'card1-content', mode: 'story', name: '爽文带背', filename: '爽文带背.png' },
            { id: 'card2-content', mode: 'bilingual', name: '中英对照', filename: '中英对照.png' },
            { id: 'card3-content', mode: 'vocab', name: '单词列表', filename: '单词列表.png' },
            { id: 'card4-content', mode: 'test', name: '填空测试', filename: '填空测试.png' }
        ];

        // 提取每个标签页的数据
        tabConfigs.forEach(config => {
            const element = document.getElementById(config.id);
            if (element) {
                const data = this.extractCardData(element, config.mode, config.filename);
                data.tabName = config.name;
                cardData.push(data);
            }
        });

        return {
            pageTitle: pageTitle,
            cards: cardData
        };
    }

    // 新增：切换卡片功能
    switchCard(direction) {
        if (!this.allCardsData || !this.allCardsData.cards) {
            this.showMessage('没有可切换的卡片', 'error');
            return;
        }

        const cards = this.allCardsData.cards;
        let newIndex = this.currentCardIndex || 0;

        if (direction === 'next') {
            newIndex = (newIndex + 1) % cards.length;
        } else if (direction === 'prev') {
            newIndex = (newIndex - 1 + cards.length) % cards.length;
        }

        this.currentCardIndex = newIndex;
        this.currentCardData = cards[newIndex];

        // 更新编辑器内容
        this.updateEditorContent();

        // 更新预览
        this.updatePreview();

        // 更新指示器
        this.updateCardIndicator();
    }

    // 新增：更新编辑器内容
    updateEditorContent() {
        if (!this.currentCardData) return;

        const titleInput = document.getElementById('html2img-title-input');
        const contentTextarea = document.getElementById('html2img-content-textarea');

        if (titleInput) {
            titleInput.value = this.currentCardData.title || '';
        }
        if (contentTextarea) {
            contentTextarea.value = this.currentCardData.content || '';
        }
    }

    // 新增：更新内容（当用户编辑时）
    updateContent() {
        if (!this.currentCardData) return;

        const titleInput = document.getElementById('html2img-title-input');
        const contentTextarea = document.getElementById('html2img-content-textarea');

        if (titleInput) {
            this.currentCardData.title = titleInput.value;
        }
        if (contentTextarea) {
            this.currentCardData.content = contentTextarea.value;
        }

        // 实时更新预览
        this.updatePreview();
    }

    // 新增：更新卡片指示器
    updateCardIndicator() {
        const indicator = document.getElementById('current-card-indicator');
        if (indicator && this.allCardsData && this.allCardsData.cards) {
            const current = (this.currentCardIndex || 0) + 1;
            const total = this.allCardsData.cards.length;
            const cardName = this.currentCardData ? this.currentCardData.tabName : '';
            indicator.textContent = `${cardName} (${current}/${total})`;
        }
    }

    // 提取单个卡片数据（改进版本）
    extractCardData(cardElement, mode, filename) {
        const titleElement = cardElement.querySelector('h2');
        const title = titleElement ? titleElement.textContent.trim() : '学习卡片';

        let content = '';

        // 根据不同模式提取内容
        switch(mode) {
            case 'story':
                const storyOutput = cardElement.querySelector('#story-output, p');
                content = storyOutput ? storyOutput.textContent.trim() : '';
                break;
            case 'bilingual':
                const studyOutput = cardElement.querySelector('#study-output, p');
                content = studyOutput ? studyOutput.textContent.trim() : '';
                break;
            case 'vocab':
                const vocabOutput = cardElement.querySelector('#vocab-output');
                if (vocabOutput) {
                    // 提取单词列表内容
                    const vocabItems = vocabOutput.querySelectorAll('div[class*="justify-between"], .flex.justify-between');
                    content = Array.from(vocabItems).map(item => {
                        const word = item.querySelector('strong, span[class*="font-semibold"], span:first-child');
                        const meaning = item.querySelector('span[class*="text-gray"], span:last-child');
                        
                        const wordText = word ? word.textContent.trim() : '';
                        const meaningText = meaning ? meaning.textContent.trim() : '';
                        
                        return `${wordText}: ${meaningText}`;
                    }).filter(line => line.trim() !== ': ').join('\n');
                }
                break;
            case 'test':
                const testOutput = cardElement.querySelector('#test-output');
                content = testOutput ? testOutput.textContent.trim() : '';
                
                // 替换输入框为填空标记
                content = content.replace(/___+/g, '_______');
                break;
            default:
                content = cardElement.textContent.trim() || '';
        }

        return {
            title: title,
            content: content,
            mode: mode,
            filename: filename
        };
    }
    }

    // 打开模态框 - 支持单个卡片或全部卡片
    openModal(cardData) {
        console.log('尝试打开模态框，卡片数据:', cardData);

        try {
            // 确保模态框已初始化
            if (!this.modalInitialized) {
                console.log('模态框未初始化，正在初始化...');
                const initSuccess = this.initializeModal();

                // 如果初始化失败，等待一段时间后重试
                if (!initSuccess && !this.modalInitialized) {
                    console.log('模态框初始化失败，等待重试...');
                    // 等待初始化完成的事件
                    return new Promise((resolve, reject) => {
                        const onReady = () => {
                            window.removeEventListener('html2imgIntegrationReady', onReady);
                            window.removeEventListener('html2imgIntegrationFailed', onFailed);
                            console.log('模态框初始化成功，重新尝试打开');
                            this.openModal(cardData);
                            resolve();
                        };

                        const onFailed = () => {
                            window.removeEventListener('html2imgIntegrationReady', onReady);
                            window.removeEventListener('html2imgIntegrationFailed', onFailed);
                            reject(new Error('模态框初始化失败'));
                        };

                        window.addEventListener('html2imgIntegrationReady', onReady);
                        window.addEventListener('html2imgIntegrationFailed', onFailed);

                        // 10秒超时
                        setTimeout(() => {
                            window.removeEventListener('html2imgIntegrationReady', onReady);
                            window.removeEventListener('html2imgIntegrationFailed', onFailed);
                            reject(new Error('模态框初始化超时'));
                        }, 10000);
                    });
                }
            }

            // 如果传入的是单个卡片数据，则提取所有卡片数据
            if (cardData && !cardData.cards) {
                // 单个卡片模式，提取所有卡片数据
                console.log('提取所有卡片数据...');
                this.allCardsData = this.extractAllCardData();

                // 找到当前卡片在所有卡片中的索引
                this.currentCardIndex = 0;
                if (cardData.mode) {
                    const modeMap = { 'story': 0, 'bilingual': 1, 'vocab': 2, 'test': 3 };
                    this.currentCardIndex = modeMap[cardData.mode] || 0;
                }

                this.currentCardData = this.allCardsData.cards[this.currentCardIndex] || cardData;
            } else if (cardData && cardData.cards) {
                // 全部卡片模式
                this.allCardsData = cardData;
                this.currentCardIndex = 0;
                this.currentCardData = cardData.cards[0];
            } else {
                // 默认提取所有卡片
                console.log('使用默认卡片数据...');
                this.allCardsData = this.extractAllCardData();
                this.currentCardIndex = 0;
                this.currentCardData = this.allCardsData.cards[0];
            }

            console.log('当前卡片数据:', this.currentCardData);

            this.isModalOpen = true;

            const modal = document.getElementById('html2img-modal');
            if (modal) {
                console.log('显示模态框');
                modal.classList.remove('hidden');

                // 强制显示模态框，确保它在最顶层
                modal.style.display = 'flex';
                modal.style.zIndex = '99999';

                console.log('模态框样式设置完成:', {
                    display: modal.style.display,
                    zIndex: modal.style.zIndex,
                    classList: modal.className
                });

                // 延迟更新，确保模态框完全显示
                setTimeout(() => {
                    try {
                        this.initializeModalContent();
                        this.updateEditorContent();
                        this.updatePreview();
                        this.updateCardIndicator();
                        console.log('模态框内容更新完成');
                    } catch (error) {
                        console.error('更新模态框内容失败:', error);
                    }
                }, 100);
            } else {
                throw new Error('找不到模态框元素');
            }
        } catch (error) {
            console.error('打开模态框失败:', error);
            alert('打开图片编辑器失败: ' + error.message);
        }
    }

    // 新增：初始化模态框内容
    initializeModalContent() {
        // 初始化所有控件的值
        const fontFamilySelect = document.getElementById('html2img-font-family');
        const fontSizeSlider = document.getElementById('html2img-font-size');
        const lineHeightSlider = document.getElementById('html2img-line-height');
        const letterSpacingSlider = document.getElementById('html2img-letter-spacing');
        const paddingSlider = document.getElementById('html2img-padding');
        const autofitToggle = document.getElementById('html2img-autofit');
        const markdownToggle = document.getElementById('html2img-markdown');
        const backgroundInput = document.getElementById('html2img-background');
        const watermarkInput = document.getElementById('html2img-watermark');
        const qualitySelect = document.getElementById('html2img-quality');

        if (fontFamilySelect) fontFamilySelect.value = this.currentSettings.fontFamily;
        if (fontSizeSlider) fontSizeSlider.value = this.currentSettings.fontSize;
        if (lineHeightSlider) lineHeightSlider.value = this.currentSettings.lineHeight;
        if (letterSpacingSlider) letterSpacingSlider.value = this.currentSettings.letterSpacing;
        if (paddingSlider) paddingSlider.value = this.currentSettings.padding;
        if (autofitToggle) autofitToggle.checked = this.currentSettings.autoFitFontSize;
        if (markdownToggle) markdownToggle.checked = this.currentSettings.useMarkdown;
        if (backgroundInput) backgroundInput.value = this.currentSettings.backgroundImage;
        if (watermarkInput) watermarkInput.value = this.currentSettings.watermark;
        if (qualitySelect) qualitySelect.value = this.currentSettings.imageQuality;

        // 更新UI显示值
        this.updateUIValues();

        // 设置默认模板
        this.selectTemplate(this.currentSettings.template);
    }

    // 关闭模态框
    closeModal() {
        this.isModalOpen = false;
        const modal = document.getElementById('html2img-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    // 选择模板
    selectTemplate(template) {
        this.currentSettings.template = template;

        // 更新UI状态
        document.querySelectorAll('.template-option').forEach(option => {
            option.classList.remove('active');
        });
        const selectedOption = document.querySelector(`[data-template="${template}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }

        this.updatePreview();
    }

    // 更新设置
    updateSetting(key, value) {
        // 处理数值类型
        if (key === 'fontSize' || key === 'imageQuality') {
            value = parseInt(value);
        } else if (key === 'lineHeight' || key === 'letterSpacing') {
            value = parseFloat(value);
        } else if (key === 'autoFitFontSize') {
            value = Boolean(value);
        }

        this.currentSettings[key] = value;

        // 更新UI显示
        this.updateUIValues();

        // 更新预览
        this.updatePreview();
    }

    // 更新UI显示值
    updateUIValues() {
        const fontSizeValue = document.getElementById('font-size-value');
        const lineHeightValue = document.getElementById('line-height-value');
        const letterSpacingValue = document.getElementById('letter-spacing-value');
        const paddingValue = document.getElementById('padding-value');
        const fontSizeControl = document.getElementById('font-size-control');

        if (fontSizeValue) {
            fontSizeValue.textContent = this.currentSettings.fontSize;
        }
        if (lineHeightValue) {
            lineHeightValue.textContent = this.currentSettings.lineHeight.toFixed(2);
        }
        if (letterSpacingValue) {
            letterSpacingValue.textContent = this.currentSettings.letterSpacing.toFixed(3);
        }
        if (paddingValue) {
            paddingValue.textContent = this.currentSettings.padding;
        }

        // 根据自动字体大小设置显示/隐藏字体大小控制
        if (fontSizeControl) {
            fontSizeControl.style.display = this.currentSettings.autoFitFontSize ? 'none' : 'block';
        }
    }

    // 更新预览
    updatePreview() {
        console.log('开始更新预览...');

        if (!this.currentCardData) {
            console.warn('没有卡片数据，无法更新预览');
            return;
        }

        const previewArea = document.getElementById('html2img-preview-area');
        const previewTitle = document.getElementById('html2img-preview-title');
        const previewContent = document.getElementById('html2img-preview-content');
        const previewWatermark = document.getElementById('html2img-preview-watermark');

        if (!previewArea || !previewTitle || !previewContent) {
            console.error('预览元素未找到:', { previewArea: !!previewArea, previewTitle: !!previewTitle, previewContent: !!previewContent });
            return;
        }

        console.log('设置预览内容:', this.currentCardData);

        // 设置标题
        previewTitle.textContent = this.currentCardData.title || '无标题';

        // 设置内容
        const content = this.currentCardData.content || '暂无内容';
        if (this.currentSettings.useMarkdown && typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            try {
                const rawHtml = marked.parse(content, { breaks: true });
                const cleanHtml = DOMPurify.sanitize(rawHtml, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
                    ALLOWED_ATTR: []
                });
                previewContent.innerHTML = cleanHtml;
            } catch (e) {
                console.error('Markdown解析失败:', e);
                previewContent.textContent = content;
            }
        } else {
            previewContent.textContent = content;
        }

        // 设置水印
        if (previewWatermark) {
            previewWatermark.textContent = this.currentSettings.watermark || '';
        }

        // 应用模板样式
        this.applyTemplateStyles(previewArea);

        // 应用字体设置
        this.applyFontSettings(previewArea);

        console.log('预览更新完成');
    }

    // 应用模板样式
    applyTemplateStyles(element) {
        // 清除所有模板类和字体类
        element.className = element.className.replace(/template-\w+/g, '').replace(/font-\w+/g, '');

        // 添加当前模板类
        element.classList.add(this.currentSettings.template);
        element.classList.add(this.currentSettings.fontFamily);

        // 基础样式
        element.classList.add('relative', 'w-full', 'h-full', 'flex', 'flex-col', 'overflow-hidden', 'transition-all', 'duration-300');

        // 确保预览区域有最小高度
        element.style.minHeight = '533px';
    }

    // 应用字体设置
    applyFontSettings(element) {
        const fontSize = this.currentSettings.autoFitFontSize ?
            this.calculateOptimalFontSize(element) :
            this.currentSettings.fontSize;

        element.style.fontSize = fontSize + 'px';
        element.style.lineHeight = this.currentSettings.lineHeight;
        element.style.letterSpacing = this.currentSettings.letterSpacing + 'em';
        element.style.padding = this.currentSettings.padding * 0.25 + 'rem';

        // 设置背景图片
        if (this.currentSettings.backgroundImage && this.isValidUrl(this.currentSettings.backgroundImage)) {
            element.style.backgroundImage = `url('${this.currentSettings.backgroundImage}')`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
        } else {
            element.style.backgroundImage = 'none';
        }

        // 确保内容区域也应用字体设置
        const contentElement = element.querySelector('#html2img-preview-content');
        if (contentElement) {
            contentElement.style.fontSize = fontSize + 'px';
            contentElement.style.lineHeight = this.currentSettings.lineHeight;
            contentElement.style.letterSpacing = this.currentSettings.letterSpacing + 'em';
        }
    }

    // 验证URL有效性
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    // 计算最优字体大小
    calculateOptimalFontSize(container) {
        const content = container.querySelector('#html2img-preview-content');
        if (!content) return this.currentSettings.fontSize;

        const contentText = content.textContent || content.innerText || '';
        if (!contentText.trim()) return this.currentSettings.fontSize;

        const containerHeight = container.clientHeight - 120; // 减去标题和边距
        if (containerHeight <= 100) return this.currentSettings.fontSize;

        let low = 8, high = 60, bestSize = this.currentSettings.fontSize;
        const originalFontSize = content.style.fontSize;

        // 二分查找最优字体大小
        for (let i = 0; i < 8 && low <= high; i++) {
            let mid = Math.floor((low + high) / 2);
            if (mid <= 0) break;

            content.style.fontSize = mid + 'px';

            // 强制重新计算布局
            content.offsetHeight;

            if (content.scrollHeight > containerHeight) {
                high = mid - 1;
            } else {
                bestSize = mid;
                low = mid + 1;
            }
        }

        // 恢复原始样式
        content.style.fontSize = originalFontSize;
        return Math.max(bestSize, 10); // 确保最小字体大小为10px
    }

    // 重置设置
    resetSettings() {
        this.currentSettings = {
            template: 'template-modern',
            fontFamily: 'font-noto-sans',
            fontSize: 20,
            charsPerPage: 300,
            padding: 8,
            lineHeight: 1.75,
            letterSpacing: 0.025,
            backgroundImage: '',
            watermark: '',
            useMarkdown: true,
            autoFitFontSize: true,
            imageQuality: 2
        };

        // 更新UI控件
        const fontFamilySelect = document.getElementById('html2img-font-family');
        const fontSizeSlider = document.getElementById('html2img-font-size');
        const lineHeightSlider = document.getElementById('html2img-line-height');
        const autofitToggle = document.getElementById('html2img-autofit');
        const qualitySelect = document.getElementById('html2img-quality');

        if (fontFamilySelect) fontFamilySelect.value = this.currentSettings.fontFamily;
        if (fontSizeSlider) fontSizeSlider.value = this.currentSettings.fontSize;
        if (lineHeightSlider) lineHeightSlider.value = this.currentSettings.lineHeight;
        if (autofitToggle) autofitToggle.checked = this.currentSettings.autoFitFontSize;
        if (qualitySelect) qualitySelect.value = this.currentSettings.imageQuality;

        // 重置模板选择
        this.selectTemplate('template-modern');

        this.updateUIValues();
        this.updatePreview();
    }

    // 下载单个卡片
    async downloadSingleCard() {
        if (!this.currentCardData) {
            this.showMessage('没有卡片数据', 'error');
            return;
        }

        const button = document.querySelector('button[onclick="html2imgIntegration.downloadSingleCard()"]');
        if (!button) return;

        const originalText = button.textContent;
        button.innerHTML = '🔄 生成中...';
        button.disabled = true;

        try {
            const previewArea = document.getElementById('html2img-preview-area');
            if (!previewArea) {
                throw new Error('预览区域未找到');
            }

            // 图片下载功能已禁用
            this.showMessage('图片下载功能已禁用', 'error');

        } catch (error) {
            console.error('下载失败:', error);
            this.showMessage('下载失败: ' + error.message, 'error');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    // 下载全部卡片
    async downloadAllCards() {
        const button = document.querySelector('button[onclick="html2imgIntegration.downloadAllCards()"]');
        if (!button) return;

        const originalText = button.textContent;
        button.disabled = true;

        try {
            // 使用当前的卡片数据（包含用户编辑的内容）
            const cardsToDownload = this.allCardsData && this.allCardsData.cards ?
                this.allCardsData.cards : this.extractAllCardData().cards;

            if (!cardsToDownload || cardsToDownload.length === 0) {
                this.showMessage('没有找到卡片数据', 'error');
                return;
            }

            // 批量下载功能已禁用
            this.showMessage('批量下载功能已禁用', 'error');

        } catch (error) {
            console.error('批量下载失败:', error);
            this.showMessage('批量下载失败: ' + error.message, 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    // 释放canvas内存
    releaseCanvasMemory(canvas) {
        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            canvas.width = 1;
            canvas.height = 1;
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' :
                       type === 'error' ? 'bg-red-500' : 'bg-blue-500';

        messageDiv.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-[10000] transform transition-all duration-300 translate-x-full`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // 动画进入
        setTimeout(() => {
            messageDiv.classList.remove('translate-x-full');
        }, 100);

        // 动画退出并移除
        setTimeout(() => {
            messageDiv.classList.add('translate-x-full');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }, 3000);
    }

    // 添加CSS样式到页面
    addStyles() {
        const styleId = 'html2img-integration-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* HTML2IMG集成样式 */
            .template-option {
                cursor: pointer;
                padding: 8px;
                border: 2px solid transparent;
                border-radius: 8px;
                text-align: center;
                transition: all 0.3s ease;
            }
            .template-option.active {
                border-color: #3b82f6;
                background-color: #eff6ff;
                transform: scale(1.02);
            }
            .template-option:hover {
                border-color: #93c5fd;
                transform: scale(1.01);
            }

            /* 模板样式 */
            .template-modern {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .template-modern .title {
                color: white;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .template-modern .watermark {
                color: rgba(255, 255, 255, 0.1);
            }

            .template-academic {
                background-color: #fdfbf7;
                color: #3d3d3d;
                border: 1px solid #e0e0e0;
            }
            .template-academic .title {
                color: #1a1a1a;
                font-family: 'Noto Serif SC', serif;
                border-bottom: 2px solid #e0e0e0;
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
            }
            .template-academic .watermark {
                color: rgba(160, 160, 160, 0.1);
            }

            .template-creative {
                background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
                color: #5d4157;
            }
            .template-creative .title {
                color: #dd4a48;
                font-family: 'ZCOOL KuaiLe', cursive;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            .template-creative .watermark {
                color: rgba(93, 65, 87, 0.1);
            }

            .template-business {
                background-color: #1f2937;
                color: #d1d5db;
            }
            .template-business .title {
                color: #f3f4f6;
                border-bottom: 2px solid #4b5563;
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
            }
            .template-business .watermark {
                color: rgba(107, 114, 128, 0.1);
            }

            /* 字体样式 */
            .font-noto-sans { font-family: 'Noto Sans SC', sans-serif; }
            .font-noto-serif { font-family: 'Noto Serif SC', serif; }
            .font-zcool { font-family: 'ZCOOL KuaiLe', cursive; }

            /* 水印样式 */
            .watermark {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 4rem;
                font-weight: bold;
                user-select: none;
                pointer-events: none;
                transform: rotate(-12deg);
                opacity: 0.1;
                z-index: 1;
            }

            /* 预览区域样式优化 */
            #html2img-preview-area {
                position: relative;
                overflow: hidden;
            }

            #html2img-preview-content {
                position: relative;
                z-index: 2;
            }

            #html2img-preview-title {
                position: relative;
                z-index: 2;
            }

            /* 滚动条样式 */
            .overflow-y-auto::-webkit-scrollbar {
                width: 6px;
            }
            .overflow-y-auto::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;
        document.head.appendChild(style);
    }
}

// 创建全局实例 - 确保实例存在
console.log('📁 html2img-integration.js: 脚本已加载，HTML2IMGIntegration 类已定义');

// 如果还没有实例，创建一个
if (!window.html2imgIntegration) {
    console.log('🔧 html2img-integration.js: 创建HTML2IMGIntegration实例');
    window.html2imgIntegration = new HTML2IMGIntegration();
}

// 页面加载完成后添加样式和测试功能
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 html2imgIntegration: DOM内容已加载');
    
    // 添加样式
    window.html2imgIntegration.addStyles();

    // 监听模块就绪事件
    window.addEventListener('html2imgIntegrationReady', (event) => {
        console.log('🎉 html2imgIntegration: 模块已准备就绪');
        
        // 添加测试函数
        window.testHTML2IMGIntegration = function() {
            const testData = {
                title: '测试卡片',
                content: '这是一个测试内容，用来验证HTML2IMG集成功能是否正常工作。',
                mode: 'story',
                filename: '测试卡片.png'
            };

            console.log('🧪 html2imgIntegration: 开始测试HTML2IMG集成功能...');
            window.html2imgIntegration.openModal(testData);
        };
        
        console.log('✅ html2imgIntegration: 测试功能已加载');
    });

    // 检查初始化状态
    setTimeout(() => {
        if (window.html2imgIntegration && window.html2imgIntegration.modalInitialized) {
            console.log('✅ html2imgIntegration: 已加载');
        } else {
            console.log('⚠️  html2imgIntegration: 未完全加载，请等待...');
        }
    }, 1000);
    
    console.log('📊 html2imgIntegration: 集成模块脚本已执行');
});
