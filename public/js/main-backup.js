// 移除硬编码的词汇分类和故事主题
const wordLists = {};
const storyThemes = [];

const customWordsInput = document.getElementById('custom-words');
const generateBtn = document.getElementById('generate-btn');
const loadingDiv = document.getElementById('loading');
const outputDiv = document.getElementById('output');
const errorMessageDiv = document.getElementById('error-message');
const charCountSlider = document.getElementById('char-count');
const charCountDisplay = document.getElementById('char-count-display');
const wordListContainer = document.getElementById('word-list-container');
const themeContainer = document.getElementById('theme-container');

let selectedWordList = '';
let selectedTheme = '';
let wordCount = 10;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 加载词汇分类
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            
            // 默认选择第一个分类
            selectedWordList = categories[0].id;
            
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
        const themesResponse = await fetch('/api/themes');
        if (themesResponse.ok) {
            const themes = await themesResponse.json();
            storyThemes.push(...themes);
            selectedTheme = themes[0].id;
        }
        
        renderControls();
        
        // 为第一个分类加载随机单词
        if (selectedWordList) {
            await loadRandomWordsForCategory(selectedWordList);
        }
        
    } catch (error) {
        console.error('初始化失败:', error);
        errorMessageDiv.textContent = '初始化失败，请刷新页面重试。';
        errorMessageDiv.classList.remove('hidden');
    }
});

// 字数滑块事件
charCountSlider.addEventListener('input', function() {
    charCountDisplay.textContent = this.value;
});

// 单词数量滑块事件
const wordCountSlider = document.getElementById('word-count');
const wordCountDisplay = document.getElementById('word-count-display');
if (wordCountSlider && wordCountDisplay) {
    wordCountSlider.addEventListener('input', function() {
        wordCount = parseInt(this.value);
        wordCountDisplay.textContent = wordCount;
        
        // 如果当前有选中的分类，重新加载随机单词
        if (selectedWordList) {
            loadRandomWordsForCategory(selectedWordList);
        }
    });
}

// 从分类中加载随机单词
async function loadRandomWordsForCategory(categoryId) {
    try {
        if (!wordLists[categoryId]) return;
        
        // 获取全部单词
        const wordsResponse = await fetch(`/api/words/category/${categoryId}`);
        if (!wordsResponse.ok) throw new Error('加载单词失败');
        const allWords = await wordsResponse.json();
        
        // 随机选择指定数量的单词
        const randomWords = getRandomWords(allWords, wordCount);
        wordLists[categoryId].words = randomWords;
        
        // 更新输入框
        customWordsInput.value = randomWords.map(w => w.en).join(', ');
    } catch (error) {
        console.error(`加载${categoryId}分类的单词失败:`, error);
        errorMessageDiv.textContent = `加载单词失败，请重试。`;
        errorMessageDiv.classList.remove('hidden');
    }
}

// 随机选择单词
function getRandomWords(words, count) {
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 渲染控制面板
function renderControls() {
    // 清空容器
    wordListContainer.innerHTML = '';
    themeContainer.innerHTML = '';
    
    // 词汇分类按钮
    for (const id in wordLists) {
        const button = document.createElement('button');
        button.textContent = wordLists[id].name;
        button.className = 'control-btn';
        button.dataset.listName = id;
        if (id === selectedWordList) button.classList.add('active');
        button.addEventListener('click', async () => {
            selectedWordList = id;
            document.querySelectorAll('[data-list-name]').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            await loadRandomWordsForCategory(id);
        });
        wordListContainer.appendChild(button);
    }
    
    // 故事主题按钮
    storyThemes.forEach(theme => {
        const button = document.createElement('button');
        button.textContent = theme.name;
        button.className = 'control-btn';
        button.dataset.themeName = theme.id;
        if (theme.id === selectedTheme) button.classList.add('active');
        button.addEventListener('click', () => {
            selectedTheme = theme.id;
            document.querySelectorAll('[data-theme-name]').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
        themeContainer.appendChild(button);
    });
}

// 生成按钮点击处理
async function handleGenerateClick() {
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
        console.error('生成失败:', error);
        errorMessageDiv.textContent = error.message || '生成失败，请重试。';
        errorMessageDiv.classList.remove('hidden');
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
        if (found) results.push(found);
        else wordsToFetch.push(word);
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
    }
}

async function callQwen(prompt, isJson = false) {
    const response = await fetch('/api/qwen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, isJson })
    });
    if (!response.ok) throw new Error('通义千问API调用失败');
    const data = await response.json();
    return isJson ? data.result : data.result;
}

async function callGemini(prompt, isJson = false) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, isJson })
    });
    if (!response.ok) throw new Error('Gemini API调用失败');
    const data = await response.json();
    return isJson ? data.result : data.result;
}

async function generateStory(words, theme, maxChars, model) {
    const prompt = `请根据以下单词创作一个${theme}风格的故事，字数控制在${maxChars}字左右。单词：${words.join(', ')}。要求：1. 故事情节生动有趣 2. 自然融入所有单词 3. 符合${theme}的风格特点`;
    return await callAIModel(prompt, false, model);
}

// 语音播放函数
function pronounceWord(word) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}

// 将函数暴露为全局函数
window.pronounceWord = pronounceWord;
window.handleGenerateClick = handleGenerateClick;

// 绑定生成按钮点击事件
if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateClick);
}
