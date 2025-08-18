/**
 * 历史记录管理系统
 * 提供历史记录的存储、查看、管理和重新应用功能
 */

class HistoryManager {
    constructor() {
        this.storageKey = 'englishLearningHistory';
        this.maxRecords = 50; // 最大保存50条记录
        this.currentSelectedHistory = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateHistoryCount();
        console.log('✅ 历史记录管理器已初始化');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 历史记录按钮
        const historyBtn = document.getElementById('history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistoryModal());
        }

        // 关闭模态框
        const closeBtn = document.getElementById('close-history-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideHistoryModal());
        }

        // 清空所有历史记录
        const clearAllBtn = document.getElementById('clear-all-history');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllHistory());
        }

        // 应用历史配置
        const applyConfigBtn = document.getElementById('apply-history-config');
        if (applyConfigBtn) {
            applyConfigBtn.addEventListener('click', () => this.applyHistoryConfig());
        }

        // 重新下载
        const redownloadBtn = document.getElementById('redownload-history');
        if (redownloadBtn) {
            redownloadBtn.addEventListener('click', () => this.redownloadHistory());
        }

        // 删除单条记录
        const deleteBtn = document.getElementById('delete-history-item');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteHistoryItem());
        }

        // 点击模态框背景关闭
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideHistoryModal();
                }
            });
        }

        // 历史记录标签页切换
        this.bindHistoryTabEvents();
    }

    /**
     * 绑定历史记录标签页事件
     */
    bindHistoryTabEvents() {
        // 使用事件委托处理标签页点击
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-tab-btn')) {
                const tabType = e.target.getAttribute('data-history-tab');
                this.switchHistoryTab(tabType);
            }
        });
    }

    /**
     * 切换历史记录标签页
     */
    switchHistoryTab(tabType) {
        // 更新标签按钮状态
        document.querySelectorAll('.history-tab-btn').forEach(btn => {
            btn.classList.remove('active', 'text-red-500', 'border-red-500', 'border-b-2');
            btn.classList.add('text-gray-500');
        });

        const activeBtn = document.querySelector(`[data-history-tab="${tabType}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'text-red-500', 'border-red-500', 'border-b-2');
            activeBtn.classList.remove('text-gray-500');
        }

        // 切换内容面板
        document.querySelectorAll('.history-tab-pane').forEach(pane => {
            pane.classList.add('hidden');
            pane.classList.remove('active');
        });

        const activePane = document.getElementById(`history-tab-${tabType}`);
        if (activePane) {
            activePane.classList.remove('hidden');
            activePane.classList.add('active');
        }
    }

    /**
     * 获取所有历史记录
     */
    getHistory() {
        try {
            const historyData = localStorage.getItem(this.storageKey);
            return historyData ? JSON.parse(historyData) : [];
        } catch (error) {
            console.error('读取历史记录失败:', error);
            return [];
        }
    }

    /**
     * 保存历史记录
     */
    saveHistory(history) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
            this.updateHistoryCount();
            return true;
        } catch (error) {
            console.error('保存历史记录失败:', error);
            // 如果存储空间不足，尝试清理旧记录
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldRecords();
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(history));
                    this.updateHistoryCount();
                    return true;
                } catch (retryError) {
                    console.error('重试保存历史记录失败:', retryError);
                    return false;
                }
            }
            return false;
        }
    }

    /**
     * 添加新的历史记录
     */
    addHistory(data, mode = null) {
        try {
            console.log('🔄 开始保存历史记录...', data);

            const history = this.getHistory();

            // 确定模式
            const recordMode = mode || this.getCurrentMode() || this.detectModeFromData(data);

            // 创建新记录
            const newRecord = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                mode: recordMode,
                filename: this.generateFilename(data, recordMode),
                content: {
                    storyOutput: data.storyOutput || '',
                    studyOutput: data.studyOutput || '',
                    vocabOutput: data.vocabOutput || [],
                    testOutput: data.testOutput || ''
                },
                config: this.getCurrentConfig(),
                thumbnail: this.generateThumbnail(data)
            };

            console.log('📝 新历史记录:', newRecord);

            // 添加到历史记录开头（最新在前）
            history.unshift(newRecord);

            // 限制记录数量
            if (history.length > this.maxRecords) {
                history.splice(this.maxRecords);
            }

            // 保存
            const saved = this.saveHistory(history);
            if (saved) {
                console.log('✅ 历史记录已保存:', newRecord.filename);
                this.showToast('历史记录已保存', 'success');
            } else {
                console.error('❌ 历史记录保存失败');
                this.showToast('历史记录保存失败', 'error');
            }

            return saved;
        } catch (error) {
            console.error('❌ 添加历史记录时发生错误:', error);
            this.showToast('保存历史记录时发生错误', 'error');
            return false;
        }
    }

    /**
     * 获取当前选中的模式
     */
    getCurrentMode() {
        try {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                const tabType = activeTab.getAttribute('data-tab');
                const modeMap = {
                    'card1': 'story',
                    'card2': 'bilingual',
                    'card3': 'vocab',
                    'card4': 'test'
                };
                const mode = modeMap[tabType];
                console.log('🎯 检测到当前模式:', mode, '(来自标签:', tabType, ')');
                return mode || 'story';
            }
            console.log('⚠️ 未找到活动标签，使用默认模式');
            return 'story'; // 默认模式
        } catch (error) {
            console.error('❌ 获取当前模式失败:', error);
            return 'story';
        }
    }

    /**
     * 从数据内容推断模式
     */
    detectModeFromData(data) {
        try {
            // 根据数据内容推断模式
            if (data.testOutput && data.testOutput.trim()) {
                return 'test';
            } else if (data.vocabOutput && data.vocabOutput.length > 0) {
                return 'vocab';
            } else if (data.studyOutput && data.studyOutput.trim()) {
                return 'bilingual';
            } else if (data.storyOutput && data.storyOutput.trim()) {
                return 'story';
            }

            console.log('⚠️ 无法从数据推断模式，使用默认模式');
            return 'story';
        } catch (error) {
            console.error('❌ 推断模式失败:', error);
            return 'story';
        }
    }

    /**
     * 获取当前配置
     */
    getCurrentConfig() {
        try {
            const customWordsInput = document.getElementById('custom-words');
            const charCountSlider = document.getElementById('char-count');
            const wordCountSlider = document.getElementById('word-count-slider');
            const aiModelInput = document.querySelector('input[name="ai-model"]:checked');

            // 获取选中的主题
            const selectedTheme = document.querySelector('.theme-btn.selected');

            // 获取选中的词库
            const selectedWordList = document.querySelector('.word-list-btn.selected');

            const config = {
                words: customWordsInput ? customWordsInput.value : '',
                theme: selectedTheme ? selectedTheme.textContent : '默认主题',
                charCount: charCountSlider ? parseInt(charCountSlider.value) : 300,
                wordCount: wordCountSlider ? parseInt(wordCountSlider.value) : 15,
                aiModel: aiModelInput ? aiModelInput.value : 'deepseek',
                wordList: selectedWordList ? selectedWordList.textContent : '默认词库'
            };

            console.log('⚙️ 获取当前配置:', config);
            return config;
        } catch (error) {
            console.error('❌ 获取当前配置失败:', error);
            return {
                words: '',
                theme: '默认主题',
                charCount: 300,
                wordCount: 15,
                aiModel: 'deepseek',
                wordList: '默认词库'
            };
        }
    }

    /**
     * 生成文件名
     */
    generateFilename(data, mode = null) {
        try {
            const now = new Date();
            const timeStr = now.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/[\/\s:]/g, '-');

            const recordMode = mode || this.getCurrentMode() || 'story';
            const modeNames = {
                'story': '爽文带背',
                'bilingual': '中英对照',
                'vocab': '单词列表',
                'test': '填空测试'
            };

            const filename = `${modeNames[recordMode] || '学习卡片'}_${timeStr}`;
            console.log('📝 生成文件名:', filename);
            return filename;
        } catch (error) {
            console.error('❌ 生成文件名失败:', error);
            return `学习卡片_${Date.now()}`;
        }
    }

    /**
     * 生成缩略图（简化版本，提取前100个字符）
     */
    generateThumbnail(data) {
        let content = '';
        
        if (data.storyOutput) {
            content = data.storyOutput;
        } else if (data.studyOutput) {
            content = data.studyOutput;
        } else if (data.vocabOutput && data.vocabOutput.length > 0) {
            content = data.vocabOutput.slice(0, 3).map(item => `${item.word}: ${item.translation}`).join(', ');
        } else if (data.testOutput) {
            content = data.testOutput;
        }

        // 移除HTML标签并截取前100个字符
        const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
    }

    /**
     * 显示历史记录模态框
     */
    showHistoryModal() {
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadHistoryList();
        }
    }

    /**
     * 隐藏历史记录模态框
     */
    hideHistoryModal() {
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.currentSelectedHistory = null;
            this.hideHistoryDetail();
        }
    }

    /**
     * 加载历史记录列表
     */
    loadHistoryList() {
        const history = this.getHistory();
        const historyList = document.getElementById('history-list');
        const historyEmpty = document.getElementById('history-empty');

        if (!historyList || !historyEmpty) return;

        if (history.length === 0) {
            historyEmpty.classList.remove('hidden');
            historyList.innerHTML = '';
            return;
        }

        historyEmpty.classList.add('hidden');
        
        historyList.innerHTML = history.map(record => this.createHistoryListItem(record)).join('');

        // 绑定点击事件
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const recordId = item.getAttribute('data-id');
                this.selectHistoryItem(recordId);
            });
        });
    }

    /**
     * 创建历史记录列表项HTML
     */
    createHistoryListItem(record) {
        const time = new Date(record.timestamp).toLocaleString('zh-CN');
        const modeNames = {
            'story': '爽文带背',
            'bilingual': '中英对照',
            'vocab': '单词列表',
            'test': '填空测试'
        };
        const modeName = modeNames[record.mode] || record.mode;
        
        const modeColors = {
            'story': 'bg-red-100 text-red-800',
            'bilingual': 'bg-blue-100 text-blue-800',
            'vocab': 'bg-green-100 text-green-800',
            'test': 'bg-purple-100 text-purple-800'
        };
        const modeColor = modeColors[record.mode] || 'bg-gray-100 text-gray-800';

        return `
            <div class="history-item cursor-pointer border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors" data-id="${record.id}">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <h4 class="font-medium text-gray-900 truncate">${record.filename}</h4>
                            <span class="px-2 py-1 text-xs rounded ${modeColor}">${modeName}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${time}</p>
                        <p class="text-sm text-gray-500 line-clamp-2">${record.thumbnail}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 选择历史记录项
     */
    selectHistoryItem(recordId) {
        const history = this.getHistory();
        const record = history.find(r => r.id === recordId);
        
        if (!record) return;

        this.currentSelectedHistory = record;
        
        // 更新选中状态
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('border-blue-500', 'bg-blue-50');
        });
        
        const selectedItem = document.querySelector(`[data-id="${recordId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('border-blue-500', 'bg-blue-50');
        }

        this.showHistoryDetail(record);
    }

    /**
     * 显示历史记录详情
     */
    showHistoryDetail(record) {
        const detailEmpty = document.getElementById('history-detail-empty');
        const detail = document.getElementById('history-detail');

        if (!detailEmpty || !detail) return;

        detailEmpty.classList.add('hidden');
        detail.classList.remove('hidden');

        // 填充详情信息
        const titleEl = document.getElementById('history-detail-title');
        const timeEl = document.getElementById('history-detail-time');
        const modeEl = document.getElementById('history-detail-mode');
        const configEl = document.getElementById('history-detail-config');

        if (titleEl) titleEl.textContent = record.filename;
        if (timeEl) timeEl.textContent = new Date(record.timestamp).toLocaleString('zh-CN');

        const modeNames = {
            'story': '爽文带背',
            'bilingual': '中英对照',
            'vocab': '单词列表',
            'test': '填空测试'
        };
        if (modeEl) modeEl.textContent = modeNames[record.mode] || record.mode;

        if (configEl) {
            const config = record.config;
            const configInfo = [];
            if (config.wordList) configInfo.push(`词库: ${config.wordList}`);
            if (config.theme) configInfo.push(`主题: ${config.theme}`);
            configInfo.push(`字数: ${config.charCount}字`);
            configInfo.push(`单词数: ${config.wordCount}个`);
            configEl.textContent = configInfo.join(' | ');
        }

        // 填充所有模式的内容
        this.fillAllModeContents(record);

        // 根据记录的模式设置默认激活的标签页
        this.switchHistoryTab(record.mode);
    }

    /**
     * 填充所有模式的内容
     */
    fillAllModeContents(record) {
        const content = record.content;

        // 爽文带背内容
        const storyContent = document.querySelector('.history-story-content');
        if (storyContent) {
            storyContent.innerHTML = content.storyOutput || '<div class="text-gray-500 text-center py-8">暂无爽文带背内容</div>';
        }

        // 中英对照内容
        const bilingualContent = document.querySelector('.history-bilingual-content');
        if (bilingualContent) {
            bilingualContent.innerHTML = content.studyOutput || '<div class="text-gray-500 text-center py-8">暂无中英对照内容</div>';
        }

        // 单词列表内容
        const vocabContent = document.querySelector('.history-vocab-content');
        if (vocabContent) {
            if (content.vocabOutput && content.vocabOutput.length > 0) {
                vocabContent.innerHTML = this.formatVocabList(content.vocabOutput);
            } else {
                vocabContent.innerHTML = '<div class="text-gray-500 text-center py-8">暂无单词列表内容</div>';
            }
        }

        // 填空测试内容
        const testContent = document.querySelector('.history-test-content');
        if (testContent) {
            testContent.innerHTML = content.testOutput || '<div class="text-gray-500 text-center py-8">暂无填空测试内容</div>';
        }
    }



    /**
     * 隐藏历史记录详情
     */
    hideHistoryDetail() {
        const detailEmpty = document.getElementById('history-detail-empty');
        const detail = document.getElementById('history-detail');
        
        if (detailEmpty) detailEmpty.classList.remove('hidden');
        if (detail) detail.classList.add('hidden');
    }

    /**
     * 应用历史配置到当前设置
     */
    applyHistoryConfig() {
        if (!this.currentSelectedHistory) return;

        const config = this.currentSelectedHistory.config;
        
        // 应用单词输入
        const customWordsInput = document.getElementById('custom-words');
        if (customWordsInput && config.words) {
            customWordsInput.value = config.words;
        }

        // 应用字数设置
        const charCountSlider = document.getElementById('char-count');
        const charCountDisplay = document.getElementById('char-count-display');
        if (charCountSlider && config.charCount) {
            charCountSlider.value = config.charCount;
            if (charCountDisplay) charCountDisplay.textContent = config.charCount;
        }

        // 应用单词数量设置
        const wordCountSlider = document.getElementById('word-count-slider');
        const wordCountDisplay = document.getElementById('word-count-display');
        if (wordCountSlider && config.wordCount) {
            wordCountSlider.value = config.wordCount;
            if (wordCountDisplay) wordCountDisplay.textContent = config.wordCount;
        }

        // 应用AI模型设置
        if (config.aiModel) {
            const aiModelInput = document.querySelector(`input[name="ai-model"][value="${config.aiModel}"]`);
            if (aiModelInput) {
                aiModelInput.checked = true;
            }
        }

        // 重新选择主题和词库（如果存在的话）
        this.selectThemeByName(config.theme);
        this.selectWordListByName(config.wordList);

        this.hideHistoryModal();
        
        // 显示成功提示
        this.showToast('配置已应用到当前设置', 'success');
    }

    /**
     * 根据名称选择主题
     */
    selectThemeByName(themeName) {
        if (!themeName) return;
        
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            if (btn.textContent.trim() === themeName) {
                // 清除其他选中状态
                themeButtons.forEach(b => b.classList.remove('selected'));
                // 设置当前选中
                btn.classList.add('selected');
            }
        });
    }

    /**
     * 根据名称选择词库
     */
    selectWordListByName(wordListName) {
        if (!wordListName) return;
        
        const wordListButtons = document.querySelectorAll('.word-list-btn');
        wordListButtons.forEach(btn => {
            if (btn.textContent.trim() === wordListName) {
                // 清除其他选中状态
                wordListButtons.forEach(b => b.classList.remove('selected'));
                // 设置当前选中
                btn.classList.add('selected');
            }
        });
    }

    /**
     * 重新下载历史记录
     */
    redownloadHistory() {
        if (!this.currentSelectedHistory) return;

        const record = this.currentSelectedHistory;
        
        // 根据模式重新触发下载
        const elementIds = {
            'story': 'card1-content',
            'bilingual': 'card2-content', 
            'vocab': 'card3-content',
            'test': 'card4-content'
        };
        
        const elementId = elementIds[record.mode];
        if (!elementId) return;

        // 暂时设置内容到对应的元素中
        this.restoreContentToElement(record, elementId);

        // 触发下载模态框
        const downloadData = {
            elementId: elementId,
            filename: record.filename,
            mode: record.mode
        };

        // 专业版下载功能已移除
        console.log('专业版下载功能已移除');

        this.hideHistoryModal();
    }

    /**
     * 恢复内容到对应元素
     */
    restoreContentToElement(record, elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const content = record.content;

        // 恢复所有模式的内容，而不仅仅是当前模式
        const storyOutput = document.getElementById('story-output');
        if (storyOutput && content.storyOutput) {
            storyOutput.innerHTML = content.storyOutput;
        }

        const studyOutput = document.getElementById('study-output');
        if (studyOutput && content.studyOutput) {
            studyOutput.innerHTML = content.studyOutput;
        }

        const vocabOutput = document.getElementById('vocab-output');
        if (vocabOutput && content.vocabOutput && content.vocabOutput.length > 0) {
            // 使用原始的词汇列表格式化函数
            if (window.formatVocabList) {
                window.formatVocabList(content.vocabOutput);
            } else {
                vocabOutput.innerHTML = this.formatVocabList(content.vocabOutput);
            }
        }

        const testOutput = document.getElementById('test-output');
        if (testOutput && content.testOutput) {
            testOutput.innerHTML = content.testOutput;
        }

        console.log('✅ 已恢复历史记录内容到主界面');
    }

    /**
     * 格式化词汇列表
     */
    formatVocabList(vocabList) {
        if (!Array.isArray(vocabList)) return '';

        return vocabList.map((item, index) => `
            <div class="vocab-item border border-gray-200 rounded-lg p-4 mb-3 bg-white hover:shadow-sm transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="font-bold text-lg text-gray-800 cursor-pointer hover:text-blue-600" onclick="pronounceWord('${item.word}')" title="点击发音">${item.word}</span>
                            ${item.phonetic ? `<span class="text-sm text-gray-500">${item.phonetic}</span>` : ''}
                            ${item.pos ? `<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">${item.pos}</span>` : ''}
                        </div>
                        <div class="text-gray-700 mb-1">
                            <strong>释义：</strong>${item.translation}
                        </div>
                        ${item.example ? `
                            <div class="text-sm text-gray-600 mt-2">
                                <strong>例句：</strong>${item.example}
                            </div>
                        ` : ''}
                    </div>
                    <div class="text-sm text-gray-400 ml-4">
                        ${index + 1}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 删除单条历史记录
     */
    deleteHistoryItem() {
        if (!this.currentSelectedHistory) return;

        if (!confirm('确定要删除这条历史记录吗？')) return;

        const history = this.getHistory();
        const filteredHistory = history.filter(record => record.id !== this.currentSelectedHistory.id);
        
        if (this.saveHistory(filteredHistory)) {
            this.showToast('历史记录已删除', 'success');
            this.loadHistoryList();
            this.hideHistoryDetail();
            this.currentSelectedHistory = null;
        } else {
            this.showToast('删除失败', 'error');
        }
    }

    /**
     * 清空所有历史记录
     */
    clearAllHistory() {
        if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return;

        if (this.saveHistory([])) {
            this.showToast('所有历史记录已清空', 'success');
            this.loadHistoryList();
            this.hideHistoryDetail();
            this.currentSelectedHistory = null;
        } else {
            this.showToast('清空失败', 'error');
        }
    }

    /**
     * 清理旧记录（当存储空间不足时）
     */
    cleanupOldRecords() {
        const history = this.getHistory();
        // 只保留最新的20条记录
        const cleanedHistory = history.slice(0, 20);
        localStorage.setItem(this.storageKey, JSON.stringify(cleanedHistory));
        console.log('清理旧记录，保留最新20条');
    }

    /**
     * 更新历史记录数量显示
     */
    updateHistoryCount() {
        const countEl = document.getElementById('history-count');
        if (countEl) {
            const count = this.getHistory().length;
            countEl.textContent = `(${count} 条记录)`;
        }
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[60] transition-all duration-300 transform translate-x-full`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        toast.className += ` ${colors[type] || colors.info}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 动画显示
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 获取历史记录统计信息
     */
    getHistoryStats() {
        const history = this.getHistory();
        const stats = {
            total: history.length,
            byMode: {},
            latest: null
        };

        history.forEach(record => {
            stats.byMode[record.mode] = (stats.byMode[record.mode] || 0) + 1;
        });

        if (history.length > 0) {
            stats.latest = history[0];
        }

        return stats;
    }

    /**
     * 测试历史记录功能
     */
    testHistoryFunction() {
        console.log('🧪 开始测试历史记录功能...');

        try {
            // 测试数据 - 包含所有四种模式的完整内容
            const testData = {
                storyOutput: `
                    <div class="story-content">
                        <h2>测试爽文故事</h2>
                        <p>这是一个包含<span class="highlight">test</span>单词的测试故事。</p>
                        <p>故事内容展示了如何在爽文中自然地融入英语单词学习。</p>
                    </div>
                `,
                studyOutput: `
                    <div class="bilingual-content">
                        <div class="sentence-pair">
                            <div class="english">This is a test sentence.</div>
                            <div class="chinese">这是一个测试句子。</div>
                        </div>
                        <div class="sentence-pair">
                            <div class="english">We are testing the history function.</div>
                            <div class="chinese">我们正在测试历史记录功能。</div>
                        </div>
                    </div>
                `,
                vocabOutput: [
                    {
                        word: 'test',
                        translation: '测试；考试',
                        phonetic: '/test/',
                        pos: 'n./v.',
                        example: 'This is a test sentence.'
                    },
                    {
                        word: 'history',
                        translation: '历史；历史记录',
                        phonetic: '/ˈhɪstəri/',
                        pos: 'n.',
                        example: 'We are studying history.'
                    },
                    {
                        word: 'function',
                        translation: '功能；函数',
                        phonetic: '/ˈfʌŋkʃən/',
                        pos: 'n./v.',
                        example: 'This function works well.'
                    }
                ],
                testOutput: `
                    <div class="test-content">
                        <p>请填入正确的单词：</p>
                        <p>This is a <input type="text" class="test-input" data-answer="test"> sentence.</p>
                        <p>We are studying <input type="text" class="test-input" data-answer="history"> records.</p>
                        <p>This <input type="text" class="test-input" data-answer="function"> works well.</p>
                    </div>
                `
            };

            // 尝试保存
            const saved = this.addHistory(testData, 'story');

            if (saved) {
                console.log('✅ 历史记录测试成功');

                // 获取并显示统计信息
                const stats = this.getHistoryStats();
                console.log('📊 历史记录统计:', stats);

                // 显示最新的历史记录内容
                const latestRecord = this.getHistory()[0];
                if (latestRecord) {
                    console.log('📝 最新历史记录内容:', latestRecord.content);
                }

                return true;
            } else {
                console.error('❌ 历史记录测试失败');
                return false;
            }
        } catch (error) {
            console.error('❌ 历史记录测试出错:', error);
            return false;
        }
    }
}

// 全局实例
let historyManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    try {
        historyManager = new HistoryManager();
        window.historyManager = historyManager;
        console.log('✅ 历史记录管理器已全局初始化');
    } catch (error) {
        console.error('❌ 历史记录管理器初始化失败:', error);
    }
});

// 确保在脚本加载时就有一个临时实例
if (!window.historyManager) {
    window.historyManager = null;
}

// 全局测试函数
window.testHistoryFunction = function() {
    if (window.historyManager) {
        return window.historyManager.testHistoryFunction();
    } else {
        console.error('❌ 历史记录管理器未初始化');
        return false;
    }
};

// 全局查看历史记录函数
window.viewHistoryData = function() {
    if (window.historyManager) {
        const history = window.historyManager.getHistory();
        console.log('📚 当前历史记录:', history);
        console.log('📊 历史记录统计:', window.historyManager.getHistoryStats());
        return history;
    } else {
        console.error('❌ 历史记录管理器未初始化');
        return [];
    }
};

// 全局测试历史记录标签页功能
window.testHistoryTabs = function() {
    console.log('🧪 开始测试历史记录标签页功能...');

    if (!window.historyManager) {
        console.error('❌ 历史记录管理器未初始化');
        return false;
    }

    try {
        // 首先创建测试数据
        const testResult = window.historyManager.testHistoryFunction();
        if (!testResult) {
            console.error('❌ 创建测试数据失败');
            return false;
        }

        // 打开历史记录模态框
        window.historyManager.showHistoryModal();

        // 等待一下让模态框完全加载
        setTimeout(() => {
            // 选择第一条历史记录
            const firstHistoryItem = document.querySelector('.history-item');
            if (firstHistoryItem) {
                firstHistoryItem.click();
                console.log('✅ 已选择第一条历史记录');

                // 测试标签页切换
                setTimeout(() => {
                    const tabs = ['story', 'bilingual', 'vocab', 'test'];
                    let currentTabIndex = 0;

                    function testNextTab() {
                        if (currentTabIndex >= tabs.length) {
                            console.log('✅ 所有标签页测试完成');
                            return;
                        }

                        const tabType = tabs[currentTabIndex];
                        const tabBtn = document.querySelector(`[data-history-tab="${tabType}"]`);
                        const tabPane = document.getElementById(`history-tab-${tabType}`);

                        if (tabBtn && tabPane) {
                            tabBtn.click();
                            console.log(`✅ 已切换到 ${tabType} 标签页`);

                            // 检查内容是否显示
                            setTimeout(() => {
                                const isVisible = !tabPane.classList.contains('hidden');
                                const hasContent = tabPane.querySelector('.history-story-content, .history-bilingual-content, .history-vocab-content, .history-test-content');

                                if (isVisible && hasContent) {
                                    console.log(`✅ ${tabType} 标签页内容正常显示`);
                                } else {
                                    console.warn(`⚠️ ${tabType} 标签页可能有显示问题`);
                                }

                                currentTabIndex++;
                                testNextTab();
                            }, 500);
                        } else {
                            console.error(`❌ 找不到 ${tabType} 标签页元素`);
                            currentTabIndex++;
                            testNextTab();
                        }
                    }

                    testNextTab();
                }, 1000);
            } else {
                console.error('❌ 找不到历史记录项');
                return false;
            }
        }, 1000);

        return true;
    } catch (error) {
        console.error('❌ 测试历史记录标签页功能时发生错误:', error);
        return false;
    }
};