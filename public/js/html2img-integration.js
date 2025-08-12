// HTML2IMG 集成模块 - 将html2img功能集成到主项目中
class HTML2IMGIntegration {
    constructor() {
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

        // 延迟初始化模态框，确保DOM已加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeModal());
        } else {
            this.initializeModal();
        }
    }

    // 初始化模态框
    initializeModal() {
        if (this.modalInitialized) return;

        try {
            console.log('开始初始化HTML2IMG模态框...');

            // 检查模态框是否已存在，如果存在则移除旧的
            const existingModal = document.getElementById('html2img-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // 创建新的模态框HTML
            const modalHTML = this.createModalHTML();
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 绑定事件监听器
            this.bindEventListeners();

            this.modalInitialized = true;
            console.log('HTML2IMG模态框初始化完成');
        } catch (error) {
            console.error('初始化模态框失败:', error);
        }
    }

    // 创建模态框HTML结构
    createModalHTML() {
        return `
        <div id="html2img-modal" class="fixed inset-0 bg-black bg-opacity-60 hidden z-[9999] flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                <!-- 模态框头部 -->
                <div class="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
                    <h3 class="text-xl font-bold text-gray-800">🎨 智能图片生成器</h3>
                    <button onclick="html2imgIntegration.closeModal()" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-xl transition-colors">
                        ✕
                    </button>
                </div>

                <!-- 模态框主体内容 -->
                <div class="flex flex-1 min-h-0">
                    <!-- 左侧控制面板 -->
                    <div class="w-1/3 bg-gray-50 flex flex-col">
                        <div class="flex-1 overflow-y-auto p-6">
                            <!-- 模板选择 -->
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold mb-3 text-gray-700">选择模板</h4>
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
                                <h4 class="text-lg font-semibold mb-3 text-gray-700">字体设置</h4>
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
                                        <label class="block text-sm font-medium text-gray-600 mb-1">字体大小: <span id="font-size-value">20</span></label>
                                        <input type="range" id="html2img-font-size" min="12" max="80" value="20" class="w-full"
                                               oninput="html2imgIntegration.updateSetting('fontSize', this.value)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1">行间距: <span id="line-height-value">1.75</span></label>
                                        <input type="range" id="html2img-line-height" min="1.2" max="2.5" value="1.75" step="0.05" class="w-full"
                                               oninput="html2imgIntegration.updateSetting('lineHeight', this.value)">
                                    </div>
                                </div>
                            </div>

                            <!-- 高级设置 -->
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold mb-3 text-gray-700">高级设置</h4>
                                <div class="space-y-3">
                                    <div class="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                        <span class="text-sm font-medium text-blue-800">AI 智能字号</span>
                                        <label class="inline-flex relative items-center cursor-pointer">
                                            <input type="checkbox" id="html2img-autofit" class="sr-only peer" checked onchange="html2imgIntegration.updateSetting('autoFitFontSize', this.checked)">
                                            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
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
                        <div class="p-4 border-b border-gray-200 flex-shrink-0">
                            <h4 class="text-lg font-semibold text-gray-800">📱 实时预览</h4>
                        </div>
                        <div class="flex-1 p-4 flex items-start justify-center bg-gray-50 min-h-0 overflow-auto">
                            <div id="html2img-preview-container" class="bg-white rounded-lg shadow-lg overflow-hidden" style="width: 400px; height: 533px;">
                                <div id="html2img-preview-area" class="relative w-full h-full flex flex-col overflow-hidden p-8" style="width: 400px; height: 533px;">
                                    <h2 id="html2img-preview-title" class="title text-2xl font-bold mb-4 break-words"></h2>
                                    <div id="html2img-preview-content" class="whitespace-pre-wrap break-words flex-grow text-base leading-relaxed"></div>
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

    // 打开模态框
    openModal(cardData) {
        console.log('尝试打开模态框，卡片数据:', cardData);

        // 确保模态框已初始化
        if (!this.modalInitialized) {
            console.log('模态框未初始化，正在初始化...');
            this.initializeModal();
        }

        this.currentCardData = cardData;
        this.isModalOpen = true;

        const modal = document.getElementById('html2img-modal');
        if (modal) {
            console.log('显示模态框');
            modal.classList.remove('hidden');

            // 延迟更新预览，确保模态框完全显示
            setTimeout(() => {
                this.updatePreview();
            }, 100);
        } else {
            console.error('找不到模态框元素');
        }
    }

    // 关闭模态框
    closeModal() {
        this.isModalOpen = false;
        const modal = document.getElementById('html2img-modal');
        if (modal) {
            modal.classList.add('hidden');
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
        const fontSizeControl = document.getElementById('font-size-control');

        if (fontSizeValue) {
            fontSizeValue.textContent = this.currentSettings.fontSize;
        }
        if (lineHeightValue) {
            lineHeightValue.textContent = this.currentSettings.lineHeight.toFixed(2);
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
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
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

        // 确保内容区域也应用字体设置
        const contentElement = element.querySelector('#html2img-preview-content');
        if (contentElement) {
            contentElement.style.fontSize = fontSize + 'px';
            contentElement.style.lineHeight = this.currentSettings.lineHeight;
            contentElement.style.letterSpacing = this.currentSettings.letterSpacing + 'em';
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

            // 使用html2canvas生成图片
            const canvas = await html2canvas(previewArea, {
                scale: this.currentSettings.imageQuality,
                useCORS: true,
                backgroundColor: null,
                width: previewArea.offsetWidth,
                height: previewArea.offsetHeight
            });

            // 下载图片
            const link = document.createElement('a');
            link.download = this.currentCardData.filename || '学习卡片.png';
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showMessage('图片下载成功！', 'success');

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
            // 提取所有卡片数据
            const allData = this.extractAllCardData();

            if (!allData.cards || allData.cards.length === 0) {
                this.showMessage('没有找到卡片数据', 'error');
                return;
            }

            // 检查JSZip是否可用
            if (typeof JSZip === 'undefined') {
                this.showMessage('JSZip库未加载，无法打包下载', 'error');
                return;
            }

            const zip = new JSZip();
            const previewArea = document.getElementById('html2img-preview-area');

            if (!previewArea) {
                throw new Error('预览区域未找到');
            }

            // 逐个生成图片
            for (let i = 0; i < allData.cards.length; i++) {
                const cardData = allData.cards[i];
                button.textContent = `正在生成 ${i + 1}/${allData.cards.length}...`;

                // 更新预览内容为当前卡片
                this.currentCardData = cardData;
                this.updatePreview();

                // 等待渲染完成
                await new Promise(resolve => setTimeout(resolve, 200));

                // 生成图片
                const canvas = await html2canvas(previewArea, {
                    scale: this.currentSettings.imageQuality,
                    useCORS: true,
                    backgroundColor: null,
                    width: previewArea.offsetWidth,
                    height: previewArea.offsetHeight
                });

                // 转换为blob并添加到zip
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                zip.file(cardData.filename || `卡片${i + 1}.png`, blob);
            }

            // 生成并下载zip文件
            button.textContent = '正在打包...';
            const zipBlob = await zip.generateAsync({ type: "blob" });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `${allData.pageTitle}_全部卡片.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 清理URL对象
            URL.revokeObjectURL(link.href);

            this.showMessage('批量下载完成！', 'success');

        } catch (error) {
            console.error('批量下载失败:', error);
            this.showMessage('批量下载失败: ' + error.message, 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
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
            }
            .template-option:hover {
                border-color: #93c5fd;
            }

            /* 模板样式 */
            .template-modern {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .template-modern .title {
                color: white;
            }

            .template-academic {
                background-color: #fdfbf7;
                color: #3d3d3d;
                border: 1px solid #e0e0e0;
            }
            .template-academic .title {
                color: #1a1a1a;
                font-family: 'Noto Serif SC', serif;
            }

            .template-creative {
                background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
                color: #5d4157;
            }
            .template-creative .title {
                color: #dd4a48;
                font-family: 'ZCOOL KuaiLe', cursive;
            }

            .template-business {
                background-color: #1f2937;
                color: #d1d5db;
            }
            .template-business .title {
                color: #f3f4f6;
                border-bottom: 2px solid #4b5563;
                padding-bottom: 0.5rem;
            }

            /* 字体样式 */
            .font-noto-sans { font-family: 'Noto Sans SC', sans-serif; }
            .font-noto-serif { font-family: 'Noto Serif SC', serif; }
            .font-zcool { font-family: 'ZCOOL KuaiLe', cursive; }
        `;
        document.head.appendChild(style);
    }
}

// 创建全局实例
window.html2imgIntegration = new HTML2IMGIntegration();

// 页面加载完成后添加样式和测试功能
document.addEventListener('DOMContentLoaded', () => {
    window.html2imgIntegration.addStyles();

    // 添加测试函数
    window.testHTML2IMGIntegration = function() {
        const testData = {
            title: '测试卡片',
            content: '这是一个测试内容，用来验证HTML2IMG集成功能是否正常工作。',
            mode: 'story',
            filename: '测试卡片.png'
        };

        console.log('开始测试HTML2IMG集成功能...');
        window.html2imgIntegration.openModal(testData);
    };

    console.log('HTML2IMG集成模块已加载完成');
});
