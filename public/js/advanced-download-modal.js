/**
 * 高级下载模态框 - 集成新技术方案
 * 基于 Puppeteer 后端渲染的专业版图片/PDF生成器
 */

class AdvancedDownloadModal {
    constructor() {
        this.isInitialized = false;
        this.currentCardData = null;
        this.modal = null;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
        this.isInitialized = true;
        console.log('✅ 高级下载模态框已初始化');
    }

    createModal() {
        const modalHtml = `
            <div id="advanced-download-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <!-- 模态框头部 -->
                        <div class="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 class="text-2xl font-bold text-gray-800">
                                <svg class="inline-block w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                                专业版下载设置
                            </h2>
                            <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        <div class="flex">
                            <!-- 左侧：设置面板 -->
                            <div class="w-1/2 p-6 border-r border-gray-200">
                                <h3 class="text-lg font-semibold mb-4 text-gray-700">生成选项</h3>
                                
                                <!-- 模式选择 -->
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">选择模式:</label>
                                    <select id="mode-select" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        <option value="story-highlight">爽文带背</option>
                                        <option value="story-cn">中英对照</option>
                                        <option value="vocab-list">单词列表</option>
                                        <option value="fill-test">填空测试</option>
                                    </select>
                                </div>

                                <!-- 输出格式选择 -->
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">输出格式:</label>
                                    <div class="space-y-2">
                                        <label class="flex items-center">
                                            <input type="radio" name="output-format" value="png" class="form-radio text-blue-500" checked>
                                            <span class="ml-2">PNG 图片 (高清)</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="radio" name="output-format" value="pdf" class="form-radio text-blue-500">
                                            <span class="ml-2">PDF 文档 (可打印)</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- 尺寸选择 -->
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">画布尺寸:</label>
                                    <select id="format-select" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        <option value="social_3_4">自媒体分享 (3:4)</option>
                                        <option value="social_16_9">横屏分享 (16:9)</option>
                                        <option value="A4_portrait">A4打印 (纵向)</option>
                                        <option value="A4_landscape">A4打印 (横向)</option>
                                        <option value="square">正方形 (1:1)</option>
                                    </select>
                                </div>

                                <!-- 字体大小 -->
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        正文字号: <span id="font-size-display" class="font-bold text-blue-600">20px</span>
                                    </label>
                                    <input type="range" id="font-size-input" min="12" max="32" value="20" 
                                           class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>12px</span>
                                        <span>22px</span>
                                        <span>32px</span>
                                    </div>
                                </div>

                                <!-- 背景选项 -->
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">背景样式:</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <label class="flex items-center">
                                            <input type="radio" name="background" value="white" class="form-radio text-blue-500" checked>
                                            <span class="ml-2">纯白背景</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="radio" name="background" value="gradient" class="form-radio text-blue-500">
                                            <span class="ml-2">渐变背景</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- 右侧：预览和操作面板 -->
                            <div class="w-1/2 p-6">
                                <h3 class="text-lg font-semibold mb-4 text-gray-700">预览效果</h3>
                                
                                <!-- 预览区域 -->
                                <div id="preview-container" class="mb-6">
                                    <div id="preview-placeholder" class="w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                        <div class="text-center text-gray-500">
                                            <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                            <p>点击"生成预览"查看效果</p>
                                        </div>
                                    </div>
                                    <img id="preview-image" class="hidden w-full rounded-lg shadow-lg" alt="预览图片">
                                </div>

                                <!-- 状态显示 -->
                                <div id="status-message" class="mb-4 p-3 rounded-lg text-sm hidden">
                                    <div class="flex items-center">
                                        <div class="loader mr-2"></div>
                                        <span>正在处理中...</span>
                                    </div>
                                </div>

                                <!-- 操作按钮 -->
                                <div class="space-y-3">
                                    <button id="generate-preview" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                        生成预览
                                    </button>
                                    
                                    <button id="download-final" class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                        下载完整版
                                    </button>

                                    <button id="cancel-modal" class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors">
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .loader {
                border: 2px solid #f3f3f3;
                border-top: 2px solid #3498db;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                animation: spin 1s linear infinite;
                display: inline-block;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            #advanced-download-modal .form-radio:checked {
                background-color: #3B82F6;
                border-color: #3B82F6;
            }
        `;

        document.head.appendChild(style);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('advanced-download-modal');
    }

    bindEvents() {
        // 关闭模态框事件
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-modal').addEventListener('click', () => this.closeModal());
        
        // 点击模态框外部关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // 字体大小滑块事件
        document.getElementById('font-size-input').addEventListener('input', (e) => {
            document.getElementById('font-size-display').textContent = e.target.value + 'px';
        });

        // 生成预览按钮
        document.getElementById('generate-preview').addEventListener('click', () => this.generatePreview());
        
        // 下载按钮
        document.getElementById('download-final').addEventListener('click', () => this.downloadFinal());

        // 输出格式变化时更新UI
        document.querySelectorAll('input[name="output-format"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateUIForFormat());
        });
    }

    /**
     * 打开模态框
     * @param {Object} cardData - 卡片数据 {elementId, filename, mode, content}
     */
    openModal(cardData) {
        this.currentCardData = cardData;
        
        // 根据传入的模式设置默认选项
        const modeSelect = document.getElementById('mode-select');
        if (cardData.mode === 'story') {
            modeSelect.value = 'story-highlight';
        } else if (cardData.mode === 'bilingual') {
            modeSelect.value = 'story-cn';
        } else if (cardData.mode === 'vocab') {
            modeSelect.value = 'vocab-list';
        } else if (cardData.mode === 'test') {
            modeSelect.value = 'fill-test';
        }

        // 显示模态框
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        console.log('📋 模态框已打开，卡片数据:', cardData);
    }

    closeModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // 重置预览状态
        this.resetPreview();
        
        console.log('✖️ 模态框已关闭');
    }

    resetPreview() {
        document.getElementById('preview-placeholder').classList.remove('hidden');
        document.getElementById('preview-image').classList.add('hidden');
        document.getElementById('download-final').disabled = true;
        this.hideStatus();
    }

    updateUIForFormat() {
        const isPDF = document.querySelector('input[name="output-format"]:checked').value === 'pdf';
        const formatSelect = document.getElementById('format-select');
        
        // 当选择PDF时，建议A4格式
        if (isPDF && formatSelect.value.startsWith('social')) {
            formatSelect.value = 'A4_portrait';
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('status-message');
        statusEl.className = `mb-4 p-3 rounded-lg text-sm ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`;
        statusEl.querySelector('span').textContent = message;
        statusEl.classList.remove('hidden');
    }

    hideStatus() {
        document.getElementById('status-message').classList.add('hidden');
    }

    /**
     * 生成预览
     */
    async generatePreview() {
        this.showStatus('正在生成预览...');
        
        try {
            const { htmlContent, options } = this.preparePayload();
            
            // 调用后端API生成预览
            const response = await fetch('/api/generate-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    htmlContent, 
                    options: { 
                        ...options, 
                        preview: true // 标记为预览模式，可能返回较小的图片
                    } 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `服务器错误: ${response.status}`);
            }

            // 显示预览图片
            const blob = await response.blob();
            const previewUrl = URL.createObjectURL(blob);
            
            document.getElementById('preview-placeholder').classList.add('hidden');
            const previewImg = document.getElementById('preview-image');
            previewImg.src = previewUrl;
            previewImg.classList.remove('hidden');
            
            // 启用下载按钮
            document.getElementById('download-final').disabled = false;
            
            this.showStatus('预览生成成功！', 'success');
            setTimeout(() => this.hideStatus(), 3000);
            
        } catch (error) {
            console.error('预览生成失败:', error);
            this.showStatus(`预览生成失败: ${error.message}`, 'error');
        }
    }

    /**
     * 下载完整版
     */
    async downloadFinal() {
        this.showStatus('正在生成完整版文件...');
        
        try {
            const { htmlContent, options } = this.preparePayload();
            
            // 调用后端API生成完整版
            const response = await fetch('/api/generate-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ htmlContent, options })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `服务器错误: ${response.status}`);
            }

            // 下载文件
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${options.filename}.${options.output === 'pdf' ? 'pdf' : 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理临时URL
            URL.revokeObjectURL(downloadUrl);
            
            this.showStatus('文件下载成功！', 'success');
            setTimeout(() => {
                this.hideStatus();
                this.closeModal();
            }, 2000);
            
        } catch (error) {
            console.error('下载失败:', error);
            this.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }

    /**
     * 准备发送给后端的数据
     */
    preparePayload() {
        const mode = document.getElementById('mode-select').value;
        const format = document.getElementById('format-select').value;
        const fontSize = document.getElementById('font-size-input').value;
        const outputFormat = document.querySelector('input[name="output-format"]:checked').value;
        const background = document.querySelector('input[name="background"]:checked').value;

        // 提取卡片数据
        const cardElement = document.getElementById(this.currentCardData.elementId);
        const dayData = this.extractCardData(cardElement, mode);

        // 生成HTML内容
        const { title, bodyHtml, filenamePrefix } = this.generateCardHtml(dayData, mode);
        const htmlContent = this.getFullHtmlTemplate(title, bodyHtml, fontSize, background, format);

        // 设置选项
        let options = {
            filename: filenamePrefix,
            output: outputFormat
        };

        if (outputFormat === 'pdf') {
            options.format = format.includes('A4') ? 'A4' : 'A4';
        } else {
            // PNG选项
            const dimensions = this.getCanvasDimensions(format);
            options.width = dimensions.width;
            options.height = dimensions.height;
        }

        return { htmlContent, options };
    }

    /**
     * 提取卡片数据
     */
    extractCardData(cardElement, mode) {
        // 这里需要根据不同的卡片类型提取数据
        // 简化版本，实际应该更详细地解析内容
        let data = {
            words: [],
            story: '',
            vocabulary: []
        };

        try {
            if (mode === 'story-highlight' || mode === 'story-cn') {
                // 提取故事内容和高亮单词
                const storyContent = cardElement.querySelector('#story-output, #study-output');
                if (storyContent) {
                    data.story = storyContent.textContent || storyContent.innerHTML;
                    
                    // 提取高亮的单词
                    const highlightedWords = storyContent.querySelectorAll('.bg-red-100, .bg-blue-100, .bg-green-100, .bg-yellow-100, .bg-purple-100, .bg-pink-100, .bg-indigo-100');
                    data.words = Array.from(highlightedWords).map(el => el.textContent.trim());
                }
            } else if (mode === 'vocab-list') {
                // 提取词汇列表
                const vocabContainer = cardElement.querySelector('#vocab-output');
                if (vocabContainer) {
                    const vocabItems = vocabContainer.querySelectorAll('.flex');
                    data.vocabulary = Array.from(vocabItems).map(item => {
                        const word = item.querySelector('.font-semibold')?.textContent || '';
                        const meaning = item.querySelector('.text-gray-600')?.textContent || '';
                        return { word, meaning };
                    });
                }
            }
        } catch (error) {
            console.error('提取卡片数据失败:', error);
        }

        return data;
    }

    /**
     * 生成卡片HTML
     */
    generateCardHtml(dayData, mode) {
        let title, bodyHtml, filenamePrefix;

        switch (mode) {
            case 'story-highlight':
                title = '爽文带背';
                bodyHtml = this.generateStoryHighlightHtml(dayData);
                filenamePrefix = '爽文带背';
                break;
            case 'story-cn':
                title = '中英对照';
                bodyHtml = this.generateBilingualHtml(dayData);
                filenamePrefix = '中英对照';
                break;
            case 'vocab-list':
                title = '单词列表';
                bodyHtml = this.generateVocabListHtml(dayData);
                filenamePrefix = '单词列表';
                break;
            case 'fill-test':
                title = '填空测试';
                bodyHtml = this.generateFillTestHtml(dayData);
                filenamePrefix = '填空测试';
                break;
            default:
                title = '学习卡片';
                bodyHtml = dayData.story || '内容生成中...';
                filenamePrefix = '学习卡片';
        }

        return { title, bodyHtml, filenamePrefix };
    }

    generateStoryHighlightHtml(dayData) {
        if (!dayData.story) return '<p>暂无故事内容</p>';
        
        let html = dayData.story;
        
        // 为单词添加高亮样式
        if (dayData.words && dayData.words.length > 0) {
            const colors = ['bg-red-100 text-red-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800'];
            
            dayData.words.forEach((word, index) => {
                const colorClass = colors[index % colors.length];
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                html = html.replace(regex, `<span class="rounded px-1 ${colorClass}">${word}</span>`);
            });
        }
        
        return `<div class="text-gray-700 leading-relaxed">${html}</div>`;
    }

    generateBilingualHtml(dayData) {
        // 简化版双语对照生成
        return this.generateStoryHighlightHtml(dayData);
    }

    generateVocabListHtml(dayData) {
        if (!dayData.vocabulary || dayData.vocabulary.length === 0) {
            return '<p>暂无词汇数据</p>';
        }

        let html = '<div class="space-y-3">';
        dayData.vocabulary.forEach(item => {
            html += `
                <div class="flex justify-between items-center p-3 border-b border-gray-200">
                    <span class="font-semibold text-gray-800">${item.word}</span>
                    <span class="text-gray-600">${item.meaning}</span>
                </div>
            `;
        });
        html += '</div>';
        
        return html;
    }

    generateFillTestHtml(dayData) {
        if (!dayData.story) return '<p>暂无测试内容</p>';
        
        let html = dayData.story;
        
        // 将一些单词替换为空白填空
        if (dayData.words && dayData.words.length > 0) {
            dayData.words.slice(0, 5).forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'i');
                html = html.replace(regex, `<span class="inline-block border-b-2 border-gray-400 min-w-[100px] h-6"></span>`);
            });
        }
        
        return `<div class="text-gray-700 leading-relaxed">${html}</div>`;
    }

    /**
     * 生成完整的HTML模板
     */
    getFullHtmlTemplate(title, bodyHtml, fontSize, background, format) {
        const backgroundStyle = background === 'gradient' 
            ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'
            : 'background: white;';

        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body {
                        font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
                        margin: 0;
                        padding: 40px;
                        ${backgroundStyle}
                        font-size: ${fontSize}px;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 60px;
                        border-radius: 20px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    }
                    .title {
                        text-align: center;
                        font-size: 2.5em;
                        font-weight: bold;
                        margin-bottom: 40px;
                        color: #2563eb;
                    }
                    .content {
                        font-size: 1em;
                        line-height: 1.8;
                    }
                    .rounded {
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-weight: 500;
                    }
                    .bg-red-100 { background: #fee2e2; }
                    .bg-blue-100 { background: #dbeafe; }
                    .bg-green-100 { background: #dcfce7; }
                    .bg-yellow-100 { background: #fef3c7; }
                    .bg-purple-100 { background: #f3e8ff; }
                    .bg-pink-100 { background: #fce7f3; }
                    .text-red-800 { color: #991b1b; }
                    .text-blue-800 { color: #1e40af; }
                    .text-green-800 { color: #166534; }
                    .text-yellow-800 { color: #92400e; }
                    .text-purple-800 { color: #6b21a8; }
                    .text-pink-800 { color: #9d174d; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="title">${title}</h1>
                    <div class="content">
                        ${bodyHtml}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * 获取画布尺寸
     */
    getCanvasDimensions(format) {
        const dimensions = {
            'social_3_4': { width: 1200, height: 1600 },
            'social_16_9': { width: 1920, height: 1080 },
            'A4_portrait': { width: 794, height: 1123 },
            'A4_landscape': { width: 1123, height: 794 },
            'square': { width: 1200, height: 1200 }
        };
        
        return dimensions[format] || dimensions['social_3_4'];
    }
}

// 全局实例
window.advancedDownloadModal = new AdvancedDownloadModal();

// 暴露到全局供其他脚本调用
window.openAdvancedDownloadModal = function(cardData) {
    window.advancedDownloadModal.openModal(cardData);
};

console.log('✅ 高级下载模态框脚本已加载');