// 移除硬编码的词汇分类和故事主题
const wordLists = {};
const storyThemes = [];

// DOM元素将在页面加载后获取
let customWordsInput;
let generateBtn;
let loadingDiv;
let outputDiv;
let errorMessageDiv;
let charCountSlider;
let charCountDisplay;
let wordListContainer;
let themeContainer;

// 音频系统变量
let audioInitialized = false;
let speechSynthesis = null;
let audioContext = null;
let soundIndicator = null;
let userInteracted = false;

// 发音设置
let pronunciationSettings = {
    accent: 'gb', // 默认英式发音，可选 'gb' 或 'us'
    fallbackToTTS: true // 当本地音频不可用时是否使用TTS
};

// 获取本地音频文件路径
function getLocalAudioPath(word, accent = null) {
    const selectedAccent = accent || pronunciationSettings.accent;
    const fileName = `${word.toLowerCase()}_${selectedAccent}.mp3`;
    return `/audio/${fileName}`;
}

// 播放本地音频文件
function playLocalAudio(word, accent = null) {
    return new Promise((resolve, reject) => {
        const audioPath = getLocalAudioPath(word, accent);
        const audio = new Audio();
        
        // 直接设置音频源并尝试播放
        audio.src = audioPath;
        
        audio.onloadeddata = () => {
            showSoundIndicator(`🔊 ${word} (${accent || pronunciationSettings.accent})`);
            audio.play()
                .then(() => {
                    console.log(`本地音频播放成功: ${word} (${accent || pronunciationSettings.accent})`);
                    resolve();
                })
                .catch(error => {
                    console.error('本地音频播放失败:', error);
                    reject(error);
                });
        };
        
        // 简化错误处理
        audio.onerror = () => {
            console.error(`本地音频加载失败: ${audioPath}`);
            reject(new Error('音频加载失败'));
        };
        
        // 设置超时
        setTimeout(() => {
            if (audio.readyState === 0) {
                reject(new Error('音频加载超时'));
            }
        }, 3000);
    });
}

// 初始化音频系统
function initAudio() {
    if (audioInitialized) return;

    console.log('开始初始化音频系统...');

    try {
        // 初始化语音合成API
        if ('speechSynthesis' in window) {
            speechSynthesis = window.speechSynthesis;
            console.log('Web Speech API 可用');
        } else {
            console.warn('Web Speech API 不可用');
        }

        // 初始化Web Audio API（用于音效）
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Web Audio API 可用');
        } catch (e) {
            console.warn('Web Audio API 不可用:', e.message);
        }

        // 获取音频指示器元素
        soundIndicator = document.getElementById('sound-indicator');

        audioInitialized = true;
        showSoundIndicator("🔊 音频系统已启用");
        console.log('音频系统初始化成功');

    } catch (error) {
        console.error('音频系统初始化失败:', error);
        showSoundIndicator("🔇 音频系统初始化失败");
    }
}

// 显示音频指示器
function showSoundIndicator(text) {
    if (!soundIndicator) return;

    soundIndicator.textContent = text;
    soundIndicator.style.display = 'block';
    soundIndicator.style.opacity = '1';

    // 3秒后淡出
    setTimeout(() => {
        soundIndicator.style.transition = 'opacity 0.5s';
        soundIndicator.style.opacity = '0';
        setTimeout(() => {
            soundIndicator.style.display = 'none';
        }, 500);
    }, 3000);
}

// 确保用户交互后才能播放音频
function ensureUserInteraction() {
    if (!userInteracted) {
        try {
            // 创建一个静默的音频测试来激活音频上下文
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            utterance.onend = () => {
                userInteracted = true;
                console.log('用户交互已激活');
            };
            speechSynthesis.speak(utterance);
            speechSynthesis.cancel();
            userInteracted = true;
        } catch (error) {
            console.log('音频激活失败:', error);
        }
    }
}

// 语音队列管理
let speechQueue = [];
let isSpeaking = false;

// 单词发音功能（更新版）
async function pronounceWord(word) {
    if (!word) return;

    if (!audioInitialized) {
        initAudio();
    }

    // 确保用户已经与页面交互
    ensureUserInteraction();
    
    // 先播放点击音效
    playWordClickSound();

    try {
        // 直接尝试播放本地音频
        await playLocalAudio(word);
        // 播放成功就结束，不需要其他操作
    } catch (error) {
        console.log('本地音频播放失败，尝试备用方案');
        
        // 只有在本地播放失败时才尝试备用方案
        if (pronunciationSettings.fallbackToTTS) {
            try {
                addToSpeechQueue(word);
            } catch (ttsError) {
                console.log('TTS也失败了，尝试在线词典');
                try {
                    await playOnlineDictionaryAudio(word);
                } catch (onlineError) {
                    console.error('所有发音方案都失败了');
                    showSoundIndicator("🔇 发音不可用");
                    playErrorSound();
                }
            }
        } else {
            try {
                await playOnlineDictionaryAudio(word);
            } catch (onlineError) {
                console.error('在线发音也失败了');
                showSoundIndicator("🔇 发音不可用");
                playErrorSound();
            }
        }
    }
}

// 添加到语音队列
function addToSpeechQueue(word) {
    // 清空当前队列，只保留最新的请求
    speechQueue = [word];

    // 立即停止当前播放
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    // 等待一小段时间确保cancel完成，然后开始播放
    setTimeout(() => {
        processSpeechQueue();
    }, 100);
}

// 处理语音队列
function processSpeechQueue() {
    if (speechQueue.length === 0 || isSpeaking) {
        return;
    }

    const word = speechQueue.shift();
    isSpeaking = true;

    // 创建语音播放函数
    const speakWord = (retryCount = 0) => {
        try {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8; // 稍慢的语速
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            // 选择英语语音
            const voices = speechSynthesis.getVoices();
            const englishVoice = voices.find(voice =>
                voice.lang.startsWith('en') && voice.name.includes('US')
            ) || voices.find(voice => voice.lang.startsWith('en'));

            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            utterance.onstart = () => {
                console.log('开始播放:', word);
                showSoundIndicator(`🔊 ${word}`);
            };

            utterance.onend = () => {
                console.log('播放完成:', word);
                isSpeaking = false;
                // 继续处理队列中的下一个
                setTimeout(() => {
                    processSpeechQueue();
                }, 50);
            };

            utterance.onerror = (event) => {
                console.error('语音播放错误:', event.error, '重试次数:', retryCount);

                // 如果是interrupted错误且是第一次尝试，进行重试
                if (event.error === 'interrupted' && retryCount < 2) {
                    setTimeout(() => {
                        speakWord(retryCount + 1);
                    }, 200);
                    return;
                }

                showSoundIndicator("🔇 播放失败");
                isSpeaking = false;
                // 继续处理队列中的下一个
                setTimeout(() => {
                    processSpeechQueue();
                }, 50);
            };

            // 等待语音列表加载完成
            if (speechSynthesis.getVoices().length === 0) {
                speechSynthesis.addEventListener('voiceschanged', () => {
                    speechSynthesis.speak(utterance);
                }, { once: true });
            } else {
                speechSynthesis.speak(utterance);
            }

        } catch (error) {
            console.error('发音失败:', error);
            showSoundIndicator("🔇 发音失败");
            isSpeaking = false;
        }
    };

    // 开始播放
    speakWord();
}

// 播放点击音效
const playWordClickSound = () => {
    playBeepSound(800, 0.1, 0.1); // 高音，短促
};

// 播放成功音效
const playSuccessSound = () => {
    // 播放上升音调
    playBeepSound(600, 0.1, 0.1);
    setTimeout(() => playBeepSound(800, 0.1, 0.1), 100);
};

// 播放错误音效
const playErrorSound = () => {
    playBeepSound(300, 0.2, 0.3); // 低音，较长
};

// 使用Web Audio API播放简单音效
function playBeepSound(frequency, duration, volume = 0.1) {
    if (!audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);

    } catch (error) {
        console.error('播放音效失败:', error);
    }
}



let selectedWordList = '';
let selectedTheme = '';
// 默认单词数量
let wordCount = 15; // 按照500字/30比例，大约是16-17个单词，保守设置为15
let maxWordCount = 15;

// 从API加载词汇分类和故事主题
async function loadDataFromAPI() {
    try {
        console.log('开始加载词汇分类和故事主题...');

        // 加载词汇分类
        console.log('正在请求词汇分类API: /api/words/categories');
        const categoriesResponse = await fetch('/api/words/categories');
        console.log('词汇分类API响应状态:', categoriesResponse.status, categoriesResponse.statusText);
        if (!categoriesResponse.ok) {
            console.error('加载词汇分类失败，状态码:', categoriesResponse.status);
            throw new Error('加载词汇分类失败');
        }
        const categories = await categoriesResponse.json();
        console.log('成功加载词汇分类，数量:', categories.length);
        console.log('词汇分类数据:', categories);
        
        if (categories.length > 0) {
            // 默认选择第一个分类
            selectedWordList = categories[0].id;
            console.log('默认选择分类:', selectedWordList);
            
            // 为每个分类加载单词信息（不加载全部单词，只保存分类信息）
            for (const category of categories) {
                wordLists[category.id] = { 
                    name: category.name,
                    description: category.description || '',
                    words: [] // 初始为空数组，点击时才会加载
                };
            }
        }
        
        // 加载故事主题
        console.log('正在请求故事主题API: /api/theme-templates');
        const themesResponse = await fetch('/api/theme-templates');
        console.log('故事主题API响应状态:', themesResponse.status, themesResponse.statusText);
        if (!themesResponse.ok) {
            console.error('加载故事主题失败，状态码:', themesResponse.status);
            throw new Error('加载故事主题失败');
        }
        const themes = await themesResponse.json();
        console.log('成功加载故事主题，数量:', themes.length);
        console.log('故事主题数据:', themes);
        
        if (themes.length > 0) {
            storyThemes.length = 0; // 清空数组
            themes.forEach(theme => storyThemes.push(theme));
            // 默认选择第一个主题
            selectedTheme = themes[0].id;
            console.log('默认选择主题:', selectedTheme);
        } else {
            // 如果没有主题，添加一个默认的
            storyThemes.length = 0; // 清空数组
            storyThemes.push({ id: 'default', name: '默认(爽文)' });
            selectedTheme = 'default';
            console.log('未找到主题，使用默认主题');
        }
        
        // 设置控件
        setupControls();
        
        // 初始化单词数量控制
        updateMaxWordCount();
        
        // 初始化时加载一批随机单词
        if (selectedWordList) {
            console.log('开始加载随机单词...');
            await loadRandomWordsForCategory(selectedWordList);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        errorMessageDiv.textContent = '加载分类和主题数据失败，请刷新页面重试。';
        errorMessageDiv.classList.remove('hidden');
    }
}

// 根据故事字数更新最大单词数量
function updateMaxWordCount() {
    const charCount = parseInt(charCountSlider.value);
    
    // 实现新的字数-单词比例关系：300字/10个单词，600字/20个单词，线性增长
    maxWordCount = Math.floor(charCount / 30);
    
    // 限制最小和最大单词数量
    if (maxWordCount < 5) maxWordCount = 5; // 确保最少有5个单词
    if (maxWordCount > 50) maxWordCount = 50; // 最多50个单词
    
    console.log(`字数: ${charCount}, 最大单词数: ${maxWordCount}`);
    
    // 获取单词滑块元素
    const wordCountSlider = document.getElementById('word-count-slider');
    
    if (wordCountSlider) {
        // 更新最大值
        wordCountSlider.max = maxWordCount;
        
        // 如果当前设置值超过新的最大值，则调整为最大值
        if (wordCount > maxWordCount) {
            wordCount = maxWordCount;
            wordCountSlider.value = wordCount;
        }
        
        // 更新显示
        document.getElementById('word-count-display').textContent = wordCount;
        document.getElementById('max-word-count').textContent = maxWordCount;
    } else {
        console.error('未找到单词数量滑块元素');
    }
}

// 从分类中加载随机单词
async function loadRandomWordsForCategory(categoryId) {
    try {
        if (!wordLists[categoryId]) {
            console.error(`分类 ${categoryId} 不存在`);
            return;
        }
        
        console.log(`开始从分类 ${categoryId} 加载单词...`);
        
        // 获取全部单词
        const wordsResponse = await fetch(`/api/words/category/${categoryId}`);
        if (!wordsResponse.ok) {
            console.error(`加载分类 ${categoryId} 的单词失败，状态码:`, wordsResponse.status);
            throw new Error('加载单词失败');
        }
        const allWords = await wordsResponse.json();
        console.log(`成功加载分类 ${categoryId} 的单词，数量:`, allWords.length);
        
        if (allWords.length === 0) {
            console.warn(`分类 ${categoryId} 没有单词`);
            customWordsInput.value = '';
            return;
        }
        
        // 随机选择指定数量的单词
        const randomWords = getRandomWords(allWords, wordCount);
        wordLists[categoryId].words = randomWords;
        console.log(`已随机选择 ${randomWords.length} 个单词`);
        
        // 更新输入框
        if (randomWords.length > 0) {
            customWordsInput.value = randomWords.map(w => w.en).join(', ');
            console.log('已更新单词输入框');
        } else {
            console.warn('没有单词可供选择');
            customWordsInput.value = '';
        }
    } catch (error) {
        console.error(`加载${categoryId}分类的单词失败:`, error);
        errorMessageDiv.textContent = `加载单词失败，请重试。详细错误: ${error.message}`;
        errorMessageDiv.classList.remove('hidden');
    }
}

// 从数组中随机选择n个元素
function getRandomWords(array, n) {
    console.log(`尝试从${array?.length || 0}个单词中随机选择${n}个`);
    
    if (!array || !Array.isArray(array)) {
        console.error('getRandomWords: 输入不是有效数组');
        return [];
    }
    
    if (array.length === 0) {
        console.warn('getRandomWords: 输入数组为空');
        return [];
    }
    
    if (n >= array.length) {
        console.log(`请求的单词数量(${n})大于或等于可用单词数量(${array.length})，返回全部单词`);
        return array;
    }
    
    try {
        const result = [];
        const copy = [...array];
        
        for (let i = 0; i < n; i++) {
            const randomIndex = Math.floor(Math.random() * copy.length);
            result.push(copy[randomIndex]);
            copy.splice(randomIndex, 1);
        }
        
        console.log(`成功随机选择了${result.length}个单词`);
        return result;
    } catch (error) {
        console.error('随机选择单词时出错:', error);
        return array.slice(0, n); // 出错时简单返回前n个
    }
}

function setupControls() {
    console.log('=== 开始设置UI控件 ===');
    console.log('wordListContainer:', wordListContainer);
    console.log('themeContainer:', themeContainer);

    // 检查容器是否存在
    if (!wordListContainer) {
        console.error('错误：未找到词汇分类容器 #word-list-container');
        return;
    }
    if (!themeContainer) {
        console.error('错误：未找到故事主题容器 #theme-container');
        return;
    }

    // 清空容器
    wordListContainer.innerHTML = '';
    themeContainer.innerHTML = '';

    console.log('设置UI控件...');
    console.log('词汇分类数量:', Object.keys(wordLists).length);
    console.log('故事主题数量:', storyThemes.length);
    console.log('词汇分类数据:', wordLists);
    console.log('故事主题数据:', storyThemes);
    
    // 词汇分类按钮
    if (Object.keys(wordLists).length === 0) {
        console.warn('没有可用的词汇分类');
        const noDataMsg = document.createElement('div');
        noDataMsg.className = 'text-red-500 text-sm';
        noDataMsg.textContent = '未能加载词汇分类，请刷新页面重试';
        wordListContainer.appendChild(noDataMsg);
    } else {
        for (const id in wordLists) {
            const button = document.createElement('button');
            button.textContent = wordLists[id].name;
            button.className = 'control-btn';
            button.dataset.listName = id;
            if (id === selectedWordList) button.classList.add('active');
            button.addEventListener('click', async () => {
                try {
                    selectedWordList = id;
                    updateActiveButton(wordListContainer, button);
                    await loadRandomWordsForCategory(id);
                } catch (err) {
                    console.error('点击词汇分类按钮处理失败:', err);
                }
            });
            wordListContainer.appendChild(button);
        }
        
        // 添加随机切换按钮
        const randomButton = document.createElement('button');
        randomButton.innerHTML = '<i class="fas fa-random"></i> 随机切换';
        if (!randomButton.querySelector('i')) {
            // 如果无法使用FontAwesome，使用简单文本
            randomButton.textContent = '🔄 随机切换';
        }
        randomButton.className = 'control-btn bg-blue-500 text-white hover:bg-blue-600';
        randomButton.addEventListener('click', async () => {
            try {
                if (selectedWordList) {
                    await loadRandomWordsForCategory(selectedWordList);
                }
            } catch (err) {
                console.error('随机切换单词失败:', err);
            }
        });
        wordListContainer.appendChild(randomButton);
    }

    // 故事主题按钮
    if (storyThemes.length === 0) {
        console.warn('没有可用的故事主题');
        const noDataMsg = document.createElement('div');
        noDataMsg.className = 'text-red-500 text-sm';
        noDataMsg.textContent = '未能加载故事主题，请刷新页面重试';
        themeContainer.appendChild(noDataMsg);
    } else {
        storyThemes.forEach(theme => {
            const button = document.createElement('button');
            button.textContent = theme.name;
            button.className = 'control-btn';
            button.dataset.themeName = theme.id;
            if (theme.id === selectedTheme) button.classList.add('active');
            button.addEventListener('click', () => {
                try {
                    selectedTheme = theme.id;
                    updateActiveButton(themeContainer, button);
                } catch (err) {
                    console.error('点击故事主题按钮处理失败:', err);
                }
            });
            themeContainer.appendChild(button);
        });
    }
    
    console.log('UI控件设置完成');
}

function updateActiveButton(container, activeButton) {
    container.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');
}

// 字符数滑块事件监听器将在DOMContentLoaded中绑定

// 处理生成按钮点击事件
async function handleGenerateClick() {
    // 隐藏欢迎区域
    const welcomeSection = document.getElementById('welcome-section');
    if (welcomeSection) {
        welcomeSection.classList.add('hidden');
    }
    
    loadingDiv.classList.remove('hidden');
    outputDiv.classList.add('hidden');
    errorMessageDiv.classList.add('hidden');
    generateBtn.disabled = true;
    generateBtn.classList.add('opacity-50', 'cursor-not-allowed');

    const wordsText = customWordsInput.value.trim();
    if (!wordsText) { alert('请输入单词!'); resetState(); return; }
    const wordsArray = wordsText.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
    const maxChars = charCountSlider.value;
    
    // 获取选择的AI模型
    const selectedModel = document.querySelector('input[name="ai-model"]:checked').value;
    
    try {
        const wordsWithDetails = await getWordDetails(wordsArray, selectedModel);
        // 获取选中主题的名称
        const selectedThemeName = storyThemes.find(theme => theme.id === selectedTheme)?.name || '默认(爽文)';
        const story = await generateStory(wordsWithDetails.map(w => w.en), selectedThemeName, maxChars, selectedModel);
        renderCards(story, wordsWithDetails);
        outputDiv.classList.remove('hidden');
        
        // 滚动到输出区域
        outputDiv.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error generating content:', error);
        // 显示更详细的错误信息
        const errorElement = document.querySelector('#error-message span');
        if (errorElement) {
            errorElement.textContent = `错误详情: ${error.message || '未知错误'}. 请检查您的网络连接、单词输入或稍后重试。`;
        }
        errorMessageDiv.classList.remove('hidden');
        errorMessageDiv.scrollIntoView({ behavior: 'smooth' });
    } finally {
        resetState();
    }
}

function resetState() {
    loadingDiv.classList.add('hidden');
    generateBtn.disabled = false;
    generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

async function getWordDetails(words, model) {
    const results = [];
    const wordsToFetch = [];
    words.forEach(word => {
        let found = null;
        for (const key in wordLists) {
            const matchingWord = wordLists[key].words.find(item => item.en && item.en.toLowerCase() === word);
            if (matchingWord) {
                found = matchingWord;
                break;
            }
        }
        if (found && !results.some(r => r.en === found.en)) {
            results.push(found);
        } else if (!results.some(r => r.en === word)) {
            wordsToFetch.push(word);
        }
    });
    
    if(wordsToFetch.length > 0) {
         const prompt = `请为以下英文单词提供详细的词典信息。请严格按照以下JSON格式返回，不要添加任何额外说明或文字：[{"en": "word", "phonetic": "/phonetic/", "pos": "pos.", "cn": "中文释义"}]。单词列表：${wordsToFetch.join(', ')}`;
         const fetchedDetails = await callAIModel(prompt, true, model);
         results.push(...fetchedDetails);
    }
    return words.map(word => results.find(r => r.en && r.en.toLowerCase() === word));
}

async function callAIModel(prompt, isJson = false, model = 'qwen') {
    if (model === 'qwen') {
        return callQwen(prompt, isJson);
    } else if (model === 'gemini') {
        return callGemini(prompt, isJson);
    } else if (model === 'deepseek') {
        return callDeepSeek(prompt, isJson);
    } else {
        throw new Error(`不支持的模型: ${model}`);
    }
}

async function callGemini(prompt, isJson = false) {
    const apiKey = "AIzaSyDWGIGNF5Q7VwpkngCjd8zQ-tg1mRHxlGY"; // Leave empty
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6 }
    };
    if (isJson) payload.generationConfig.responseMimeType = "application/json";
    
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    const result = await response.json();
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = result.candidates[0].content.parts[0].text;
        return isJson ? JSON.parse(text) : text;
    } else {
        throw new Error('Invalid response from API');
    }
}

async function callDeepSeek(prompt, isJson = false) {
    const apiUrl = `/api/generate`;
    const payload = {
        prompt,
        isJson,
        model: 'deepseek'
    };
    
    try {
        const response = await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        if (!response.ok) {
            let errorMessage = `API调用失败: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMessage = `${errorData.error}: ${errorData.details || ''}`;
                }
            } catch (e) {
                // JSON解析失败，使用默认错误消息
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (result.text) {
            return isJson ? JSON.parse(result.text) : result.text;
        } else {
            throw new Error('API返回无效响应: 缺少text字段');
        }
    } catch (error) {
        console.error('调用API失败:', error);
        throw new Error(`调用DeepSeek API失败: ${error.message}`);
    }
}

async function callQwen(prompt, isJson = false) {
    const apiUrl = `/api/generate`;
    const payload = {
        prompt,
        isJson,
        model: 'qwen'
    };
    
    try {
        const response = await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        if (!response.ok) {
            // 尝试解析错误响应以获取更详细的错误信息
            let errorMessage = `API调用失败: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMessage = `${errorData.error}: ${errorData.details || ''}`;
                }
            } catch (e) {
                // JSON解析失败，使用默认错误消息
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (result.text) {
            return isJson ? JSON.parse(result.text) : result.text;
        } else {
            throw new Error('API返回无效响应: 缺少text字段');
        }
    } catch (error) {
        console.error('调用API失败:', error);
        throw new Error(`调用千问API失败: ${error.message}`);
    }
}

async function generateStory(words, theme, maxChars, model) {
    const prompt = `你是一位"${theme}"风格的作家。请用中文写一个情节夸张、有趣、易于记忆的短篇故事，并自然地、按顺序地把以下所有英文单词都用上。

严格要求：
1. 故事必须连贯完整，有开头、发展、高潮、结尾
2. 故事总长度必须达到${maxChars}个中文字符，不能少于${Math.floor(maxChars * 0.9)}字
3. 每个英文单词都必须在故事中自然出现，保持英文原形
4. 直接开始故事，不要有任何开场白、标题或无关文字
5. 不要添加任何markdown符号如星号、括号等
6. 故事要生动有趣，情节要有起伏变化
7. 适当增加细节描述和对话，确保达到字数要求

单词列表: ${words.join(', ')}

请开始创作故事：`;
    
    return callAIModel(prompt, false, model);
}

// 在线词典API发音方法
async function playOnlineDictionaryAudio(word) {
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

    showSoundIndicator("🔄 尝试在线发音...");

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data && Array.isArray(data) && data[0] && data[0].phonetics) {
            // 查找带有音频的音标
            const phonetic = data[0].phonetics.find(p => p.audio && p.audio.trim() !== '');

            if (phonetic && phonetic.audio) {
                return new Promise((resolve, reject) => {
                    showSoundIndicator("🔊 加载在线发音...");

                    const audio = new Audio(phonetic.audio);

                    audio.onloadeddata = () => {
                        audio.play()
                            .then(() => {
                                console.log('在线发音播放成功');
                                showSoundIndicator(`🔊 ${word} (在线)`);
                                resolve();
                            })
                            .catch(error => {
                                console.error('在线音频播放失败:', error);
                                reject(error);
                            });
                    };

                    audio.onerror = (error) => {
                        console.error('在线音频加载失败:', error);
                        reject(error);
                    };
                });
            } else {
                throw new Error('未找到音频文件');
            }
        } else {
            throw new Error('未找到单词数据');
        }
    } catch (error) {
        console.error('获取在线发音失败:', error);
        throw error;
    }
}

// 显示反馈消息
function showFeedback(message) {
    // 创建一个临时提示
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 1000;
    `;
    document.body.appendChild(feedback);
    
    // 3秒后自动消失
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            if (feedback.parentNode) {
                document.body.removeChild(feedback);
            }
        }, 500);
    }, 3000);
}

// 重复的音频函数已删除

function checkAnswer(inputElement) {
    const correctAnswer = inputElement.dataset.correctAnswer;
    const userAnswer = inputElement.value.trim();
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        playSuccessSound();
        const span = document.createElement('span');
        span.className = 'highlight-correct';
        span.textContent = correctAnswer;
        span.onclick = () => pronounceWord(correctAnswer);
        inputElement.parentNode.replaceChild(span, inputElement);
    } else if (userAnswer.length > 0) {
        playErrorSound();
        inputElement.classList.add('incorrect');
    } else {
        inputElement.classList.remove('incorrect');
    }
}

// 示例填空测试检查函数
function checkExampleAnswer(inputElement) {
    const correctAnswer = inputElement.dataset.correctAnswer;
    const userAnswer = inputElement.value.trim();
    
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        playSuccessSound();
        inputElement.style.backgroundColor = '#d1fae5'; // 浅绿色背景
        inputElement.style.borderColor = '#10b981'; // 绿色边框
        
        // 创建一个发音按钮
        const span = document.createElement('span');
        span.className = 'text-green-600 font-bold ml-1 cursor-pointer';
        span.textContent = '🔊';
        span.onclick = () => pronounceWord(correctAnswer);
        
        // 如果已经有发音按钮，则不再添加
        if (!inputElement.nextElementSibling || !inputElement.nextElementSibling.classList.contains('text-green-600')) {
            inputElement.parentNode.insertBefore(span, inputElement.nextSibling);
        }
    } else if (userAnswer.length > 0) {
        playErrorSound();
        inputElement.style.backgroundColor = '#fee2e2'; // 浅红色背景
        inputElement.style.borderColor = '#ef4444'; // 红色边框
    } else {
        inputElement.style.backgroundColor = '';
        inputElement.style.borderColor = '';
        
        // 移除发音按钮（如果有）
        if (inputElement.nextElementSibling && inputElement.nextElementSibling.classList.contains('text-green-600')) {
            inputElement.parentNode.removeChild(inputElement.nextElementSibling);
        }
    }
}

function renderCards(story, wordsWithDetails) {
    let cleanStory = story.replace(/[\*【】]/g, '').trim();
    const sortedWords = wordsWithDetails.slice().filter(Boolean).sort((a, b) => b.en.length - a.en.length);

    let storyHTML = cleanStory, studyHTML = cleanStory;
    sortedWords.forEach(word => {
        const regex = new RegExp(`\\b(${word.en})\\b`, 'gi');
        const mainCn = word.cn.split(';')[0].split('，')[0];
        storyHTML = storyHTML.replace(regex, `<span class="highlight" onclick="pronounceWord('$1')">$1</span>`);
        studyHTML = studyHTML.replace(regex, `<span class="highlight" onclick="pronounceWord('$1')">$1</span> <span class="text-blue-600 font-sans">(${mainCn})</span>`);
    });
    document.getElementById('story-output').innerHTML = storyHTML;
    document.getElementById('study-output').innerHTML = studyHTML;

    const vocabList = document.getElementById('vocab-output');
    vocabList.innerHTML = '';
    wordsWithDetails.forEach(word => {
        if (!word) return;
        const div = document.createElement('div');
        div.className = 'vocab-item text-sm';
        div.innerHTML = `<div class="flex items-baseline"><strong class="text-base text-green-700 font-sans w-1/3">${word.en}</strong><span class="ml-3 text-gray-500 font-sans">${word.phonetic || ''}</span><span class="speaker-icon" onclick="pronounceWord('${word.en}')"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></span></div><div class="ml-1 text-gray-600">${word.pos || ''} ${word.cn}</div>`;
        vocabList.appendChild(div);
    });

    const testContainer = document.getElementById('test-output');
    testContainer.innerHTML = '';
    const wordRegex = new RegExp(`(${sortedWords.map(w => w.en.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'gi');
    const parts = cleanStory.split(wordRegex);
    parts.forEach(part => {
        if (!part) return;
        const matchingWord = sortedWords.find(w => w.en.toLowerCase() === part.toLowerCase());
        if (matchingWord) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'test-input';
            input.style.width = `${matchingWord.en.length * 0.9 + 1}ch`;
            input.dataset.correctAnswer = matchingWord.en;
            input.setAttribute('oninput', 'checkAnswer(this)');
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('autocapitalize', 'off');
            testContainer.appendChild(input);
        } else {
            testContainer.appendChild(document.createTextNode(part));
        }
    });
}

// 修改downloadCard函数 - 使用新的html2img集成功能
function downloadCard(elementId, filename, mode) {
    console.log('准备下载卡片:', elementId, filename, mode);

    // 检查html2img集成是否可用
    if (!window.html2imgIntegration) {
        console.error('HTML2IMG集成模块未加载，使用传统下载方式');
        downloadCardLegacy(elementId, filename, mode);
        return;
    }

    // 获取卡片内容
    const cardElement = document.getElementById(elementId);
    if (!cardElement) {
        console.error('找不到元素:', elementId);
        return;
    }

    // 使用集成模块的提取函数
    const cardData = window.html2imgIntegration.extractCardData(cardElement, mode, filename);

    // 使用新的html2img集成功能打开模态框
    window.html2imgIntegration.openModal(cardData);
}

// 保留原始下载函数作为备用
function downloadCardLegacy(elementId, filename, mode) {
    console.log('使用传统方式下载卡片:', elementId, filename, mode);
    
    // 创建临时容器
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 800px;
        min-height: 600px;
        padding: 40px;
        background-color: white;
        z-index: -1;
    `;

    // 复制原始内容
    const originalContent = document.getElementById(elementId);
    if (!originalContent) {
        console.error('找不到元素:', elementId);
        return;
    }

    // 克隆内容
    tempContainer.innerHTML = originalContent.innerHTML;
    
    // 处理所有SVG图标和点击事件，替换为纯文本符号
    const allIcons = tempContainer.querySelectorAll('svg, i.fas, i.fa, i.fa-solid');
    allIcons.forEach(icon => {
        // 替换为音频图标符号
        const audioSymbol = document.createElement('span');
        audioSymbol.textContent = '🔊';
        audioSymbol.style.cssText = `
            display: inline-block;
            margin: 0 4px;
            color: #2563eb;
            font-size: 16px;
        `;
        if(icon.parentNode) {
            icon.parentNode.replaceChild(audioSymbol, icon);
        }
    });
    
    // 移除所有onclick属性，以防止JS代码影响渲染
    const allClickables = tempContainer.querySelectorAll('[onclick]');
    allClickables.forEach(element => {
        element.removeAttribute('onclick');
        element.style.cursor = 'default';
    });

    // 处理所有高亮单词
    const allHighlights = tempContainer.querySelectorAll('.highlight, .highlight-correct, span[class*="bg-"]');
    allHighlights.forEach(element => {
        // 确保高亮单词不会折叠
        element.style.cssText = `
            display: inline-block;
            white-space: nowrap;
            word-break: keep-all;
            overflow-wrap: normal;
            hyphens: none;
            padding: 2px 5px;
            border-radius: 4px;
            margin: 0 2px;
            font-weight: bold;
        `;
    });

    // 特殊处理不同模式的内容
    if (elementId === 'card3-content') {
        // 处理单词列表，确保布局正确
        const vocabItems = tempContainer.querySelectorAll('#vocab-output div');
        vocabItems.forEach(item => {
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 6px;
                border-bottom: 1px solid #e5e7eb;
            `;

            const wordElement = item.querySelector('strong, .text-green-700');
            if (wordElement) {
                wordElement.style.cssText = `
                    font-size: 18px;
                    font-weight: bold;
                    color: #059669;
                    display: inline-block;
                    width: 120px;
                `;
            }

            const meaningElement = item.querySelector('.text-gray-600, div:last-child');
            if (meaningElement) {
                meaningElement.style.cssText = `
                    font-size: 15px;
                    color: #6b7280;
                    margin-top: 4px;
                    line-height: 1.5;
                `;
            }
        });
    }

    // 处理填空测试
    if (elementId === 'card4-content') {
        const testInputs = tempContainer.querySelectorAll('input, .test-input');
        testInputs.forEach(input => {
            const underline = document.createElement('span');
            underline.textContent = '_______';
            underline.style.cssText = `
                border-bottom: 2px solid #374151;
                display: inline-block;
                margin: 0 4px;
                min-width: 60px;
                text-align: center;
                font-size: 16px;
            `;
            if (input.parentNode) {
                input.parentNode.replaceChild(underline, input);
            }
        });
    }

    document.body.appendChild(tempContainer);
    
    // 等待渲染完成
    setTimeout(() => {
        // 动态计算实际内容高度
        const actualHeight = Math.max(600, tempContainer.scrollHeight + 80);
        tempContainer.style.height = actualHeight + 'px';

        setTimeout(() => {
            html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 800,
                height: actualHeight,
                allowTaint: false,
                foreignObjectRendering: false,
                logging: false,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 800,
                windowHeight: actualHeight,
                onclone: function(clonedDoc, element) {
                    // 确保克隆的元素样式正确
                    element.style.position = 'static';
                    element.style.top = '0';
                    element.style.left = '0';
                    element.style.transform = 'none';
                }
            }).then(canvas => {
                // 创建下载链接
                const image = canvas.toDataURL('image/png', 1.0);
                const link = document.createElement('a');
                link.href = image;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 清理临时元素
                document.body.removeChild(tempContainer);
                console.log('图片下载完成:', filename);
            }).catch(error => {
                console.error('生成图片失败:', error);
                alert('生成图片失败，请重试');
                document.body.removeChild(tempContainer);
            });
        }, 200);
    }, 300);
}

// 从内容中提取高亮单词
function extractHighlightedWords(container) {
    const highlights = container.querySelectorAll('.highlight, .highlight-correct, span[style*="background"], span[onclick*="pronounceWord"]');
    const words = [];
    
    highlights.forEach(highlight => {
        // 提取单词文本和中文解释
        const word = highlight.textContent.trim();
        let meaning = '';
        
        // 尝试从周围元素找到中文解释
        const nextSpan = highlight.nextElementSibling;
        if (nextSpan && nextSpan.classList.contains('text-blue-600')) {
            meaning = nextSpan.textContent.replace(/[()]/g, '').trim();
        }
        
        // 如果找不到明确的解释，尝试从父元素文本中提取
        if (!meaning && highlight.parentElement) {
            const parentText = highlight.parentElement.textContent;
            const wordIndex = parentText.indexOf(word);
            if (wordIndex >= 0) {
                const afterWord = parentText.substring(wordIndex + word.length);
                const matches = afterWord.match(/[（(]([^)）]+)[)）]/);
                if (matches && matches[1]) {
                    meaning = matches[1].trim();
                }
            }
        }
        
        words.push({
            en: word,
            cn: meaning
        });
    });
    
    return words;
}

// 从单词列表中提取单词
function extractVocabList(container) {
    const items = container.querySelectorAll('.flex.justify-between, .border-b');
    const words = [];
    
    items.forEach(item => {
        const wordElement = item.querySelector('.font-semibold, strong');
        const meaningElement = item.querySelector('.text-gray-600');
        
        if (wordElement && meaningElement) {
            words.push({
                en: wordElement.textContent.trim(),
                cn: meaningElement.textContent.trim()
            });
        }
    });
    
    return words;
}

// 将pronounceWord函数暴露为全局函数，以便HTML中的onclick调用
window.pronounceWord = pronounceWord;
window.checkAnswer = checkAnswer;
window.checkExampleAnswer = checkExampleAnswer;
window.downloadCard = downloadCard;
window.initAudio = initAudio;

// 生成按钮事件监听器将在DOMContentLoaded中绑定

// 标签页切换功能
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    console.log('初始化标签页，找到', tabBtns.length, '个标签按钮');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = btn.dataset.tab;
            console.log('点击标签:', targetTab);
            
            // 移除所有活动状态
            tabBtns.forEach(b => {
                b.classList.remove('active', 'text-red-500', 'border-red-500');
                b.classList.add('text-gray-500');
            });
            
            tabPanes.forEach(p => {
                p.classList.remove('active');
                p.classList.add('hidden');
            });
            
            // 添加活动状态
            btn.classList.add('active', 'text-red-500', 'border-red-500');
            btn.classList.remove('text-gray-500');
            
            const targetPane = document.getElementById(targetTab);
            if (targetPane) {
                targetPane.classList.add('active');
                targetPane.classList.remove('hidden');
                console.log('显示标签页:', targetTab);
            }
        });
    });
    
    // 确保默认显示第一个标签页
    const firstTab = document.getElementById('card1');
    if (firstTab) {
        firstTab.classList.add('active');
        firstTab.classList.remove('hidden');
    }
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== 页面加载完成，开始初始化 ===');
    console.log('当前时间:', new Date().toLocaleString());

    // 获取DOM元素
    customWordsInput = document.getElementById('custom-words');
    generateBtn = document.getElementById('generate-btn');
    loadingDiv = document.getElementById('loading');
    outputDiv = document.getElementById('output');
    errorMessageDiv = document.getElementById('error-message');
    charCountSlider = document.getElementById('char-count');
    charCountDisplay = document.getElementById('char-count-display');
    wordListContainer = document.getElementById('word-list-container');
    themeContainer = document.getElementById('theme-container');

    console.log('DOM元素获取结果:');
    console.log('customWordsInput:', customWordsInput);
    console.log('generateBtn:', generateBtn);
    console.log('wordListContainer:', wordListContainer);
    console.log('themeContainer:', themeContainer);

    // 检查关键元素是否存在
    if (!wordListContainer) {
        console.error('错误：未找到词汇分类容器');
        return;
    }
    if (!themeContainer) {
        console.error('错误：未找到故事主题容器');
        return;
    }

    try {
        // 初始化音频系统
        try {
            // 添加用户交互事件监听器来初始化音频
            const initAudioOnInteraction = () => {
                initAudio();
                document.removeEventListener('click', initAudioOnInteraction);
                document.removeEventListener('touchstart', initAudioOnInteraction);
            };

            document.addEventListener('click', initAudioOnInteraction, { once: true });
            document.addEventListener('touchstart', initAudioOnInteraction, { once: true });
            console.log('音频初始化事件监听器已添加');
        } catch (e) {
            console.error("添加音频初始化事件失败:", e);
        }
        
        // 初始化音频信息面板切换功能
        try {
            const audioInfoToggle = document.getElementById('audio-info-toggle');
            const audioInfoPanel = document.getElementById('audio-info-panel');
            const toggleIcon = audioInfoToggle.querySelector('svg');
            
            if (audioInfoToggle && audioInfoPanel) {
                audioInfoToggle.addEventListener('click', () => {
                    audioInfoPanel.classList.toggle('hidden');
                    // 旋转箭头图标
                    if (audioInfoPanel.classList.contains('hidden')) {
                        toggleIcon.style.transform = 'rotate(0deg)';
                        audioInfoToggle.querySelector('span').textContent = '🔊 点击查看音频功能说明';
                    } else {
                        toggleIcon.style.transform = 'rotate(180deg)';
                        audioInfoToggle.querySelector('span').textContent = '🔊 点击隐藏音频功能说明';
                    }
                });
                console.log('音频信息面板切换功能已初始化');
            }
        } catch (e) {
            console.error("初始化音频信息面板切换功能失败:", e);
        }

        // 初始化发音设置事件监听器
        initPronunciationSettings();

// 初始化发音设置
function initPronunciationSettings() {
    // 发音类型选择事件监听器
    const accentRadios = document.querySelectorAll('input[name="pronunciation-accent"]');
    accentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                pronunciationSettings.accent = e.target.value;
                console.log('发音类型已切换为:', pronunciationSettings.accent === 'gb' ? '英式' : '美式');
                showSoundIndicator(`🔊 已切换为${pronunciationSettings.accent === 'gb' ? '英式' : '美式'}发音`);
            }
        });
    });

    // TTS备用选项事件监听器
    const fallbackCheckbox = document.getElementById('fallback-tts');
    if (fallbackCheckbox) {
        fallbackCheckbox.addEventListener('change', (e) => {
            pronunciationSettings.fallbackToTTS = e.target.checked;
            console.log('TTS备用选项:', pronunciationSettings.fallbackToTTS ? '已启用' : '已禁用');
            showSoundIndicator(`🔊 TTS备用${pronunciationSettings.fallbackToTTS ? '已启用' : '已禁用'}`);
        });
    }
}
        
        // 初始化标签页
        try {
            initTabs();
            console.log('标签页初始化完成');
        } catch (e) {
            console.error('初始化标签页失败:', e);
        }
        
        // 初始化示例标签页
        try {
            initExampleTabs();
            console.log('示例标签页初始化完成');
        } catch (e) {
            console.error('初始化示例标签页失败:', e);
        }
        
        // 加载API数据
        console.log('开始从API加载数据...');
        await loadDataFromAPI();
        console.log('API数据加载完成');

        // 验证数据是否正确加载
        console.log('词汇分类数量:', Object.keys(wordLists).length);
        console.log('故事主题数量:', storyThemes.length);
        console.log('当前选择的分类:', selectedWordList);
        console.log('当前选择的主题:', selectedTheme);

        // 绑定生成按钮点击事件
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerateClick);
            console.log('生成按钮事件监听器已绑定');
        } else {
            console.error('错误：未找到生成按钮');
        }

        // 绑定字符数滑块事件监听器
        if (charCountSlider && charCountDisplay) {
            charCountSlider.addEventListener('input', (e) => {
                charCountDisplay.textContent = e.target.value;
                updateMaxWordCount();
            });
            console.log('字符数滑块事件监听器已绑定');
        } else {
            console.error('错误：未找到字符数滑块或显示元素');
        }
        
        // 绑定单词数量滑块事件监听器
        const wordCountSlider = document.getElementById('word-count-slider');
        if (wordCountSlider) {
            wordCountSlider.addEventListener('input', (e) => {
                wordCount = parseInt(e.target.value);
                document.getElementById('word-count-display').textContent = wordCount;
                
                // 如果有选中的分类，重新加载随机单词
                if (selectedWordList) {
                    loadRandomWordsForCategory(selectedWordList);
                }
            });
            console.log('单词数量滑块事件监听器已绑定');
        } else {
            console.error('错误：未找到单词数量滑块元素');
        }
        
        // 初始化单词数量滑块的显示值和最大值
        updateMaxWordCount();
        console.log('单词数量滑块初始化完成');

        // 添加用户交互监听器，确保音频可以正常播放
        document.addEventListener('click', () => {
            if (!userInteracted) {
                ensureUserInteraction();
            }
        }, { once: true });

    } catch (error) {
        console.error('页面初始化失败:', error);
        // 显示错误信息
        errorMessageDiv.textContent = `初始化失败: ${error.message}。请刷新页面重试。`;
        errorMessageDiv.classList.remove('hidden');
    }
});

// 初始化示例标签页切换功能
function initExampleTabs() {
    const exampleTabBtns = document.querySelectorAll('.example-tab-btn');
    const exampleTabPanes = document.querySelectorAll('.example-tab-pane');
    
    console.log('初始化示例标签页，找到', exampleTabBtns.length, '个示例标签按钮');
    
    exampleTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = btn.dataset.exampleTab;
            console.log('点击示例标签:', targetTab);
            
            // 移除所有活动状态
            exampleTabBtns.forEach(b => {
                b.classList.remove('active', 'text-red-500', 'border-red-500');
                b.classList.add('text-gray-500');
            });
            
            exampleTabPanes.forEach(p => {
                p.classList.remove('active');
                p.classList.add('hidden');
            });
            
            // 添加活动状态
            btn.classList.add('active', 'text-red-500', 'border-red-500');
            btn.classList.remove('text-gray-500');
            
            const targetPane = document.getElementById(targetTab);
            if (targetPane) {
                targetPane.classList.add('active');
                targetPane.classList.remove('hidden');
                console.log('显示示例标签页:', targetTab);
            }
        });
    });
    
    // 确保默认显示第一个示例标签页
    const firstExampleTab = document.getElementById('example-tab1');
    if (firstExampleTab) {
        firstExampleTab.classList.add('active');
        firstExampleTab.classList.remove('hidden');
    }
} 






