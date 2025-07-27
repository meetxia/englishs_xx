const wordLists = {
    '自定义': { words: [
        { en: 'elegant', phonetic: '/ˈel.ə.ɡənt/', pos: 'adj.', cn: '优雅的，优美的' }, { en: 'absorb', phonetic: '/əbˈsɔːrb/', pos: 'v.', cn: '吸引；吸收' }, { en: 'casualty', phonetic: '/ˈkæʒ.u.əl.ti/', pos: 'n.', cn: '受害者；伤亡者' }, { en: 'bare', phonetic: '/ber/', pos: 'adj.', cn: '赤裸的；光秃的' }, { en: 'cease', phonetic: '/siːs/', pos: 'v.', cn: '停止，终止' }, { en: 'cater', phonetic: '/ˈkeɪ.t̬ɚ/', pos: 'v.', cn: '迎合；提供饮食' }, { en: 'bargain', phonetic: '/ˈbɑːr.ɡɪn/', pos: 'n.', cn: '廉价货；交易' }, { en: 'dedicate', phonetic: '/ˈded.ə.keɪt/', pos: 'v.', cn: '奉献；致力于' }, { en: 'capital', phonetic: '/ˈkæp.ə.t̬əl/', pos: 'adj.', cn: '最重要的；首位的' }, { en: 'capture', phonetic: '/ˈkæp.tʃɚ/', pos: 'v.', cn: '俘虏；捕获' }, { en: 'careful', phonetic: '/ˈker.fəl/', pos: 'adj.', cn: '小心的，仔细的' }
    ]},
    '小学词汇': { words: [ { en: 'apple', phonetic: '/ˈæp.əl/', pos: 'n.', cn: '苹果' }, { en: 'book', phonetic: '/bʊk/', pos: 'n.', cn: '书' }, { en: 'cat', phonetic: '/kæt/', pos: 'n.', cn: '猫' }, { en: 'dog', phonetic: '/dɔːɡ/', pos: 'n.', cn: '狗' }, { en: 'eat', phonetic: '/iːt/', pos: 'v.', cn: '吃' } ]},
    '大学四级': { words: [ { en: 'abandon', phonetic: '/əˈbændən/', pos: 'v.', cn: '放弃；遗弃' }, { en: 'absolute', phonetic: '/ˈæbsəluːt/', pos: 'adj.', cn: '绝对的；完全的' }, { en: 'academic', phonetic: '/ˌækəˈdemɪk/', pos: 'adj.', cn: '学术的；学院的' } ]},
    '雅思核心': { words: [ { en: 'analyze', phonetic: '/ˈænəlaɪz/', pos: 'v.', cn: '分析' }, { en: 'approach', phonetic: '/əˈproʊtʃ/', pos: 'n./v.', cn: '方法；接近' }, { en: 'assess', phonetic: '/əˈses/', pos: 'v.', cn: '评估；评定' } ]},
};

const storyThemes = ['默认(爽文)', '玄幻修仙', '都市言情', '科幻废土', '悬疑推理', '霸道总裁'];

const customWordsInput = document.getElementById('custom-words');
const generateBtn = document.getElementById('generate-btn');
const loadingDiv = document.getElementById('loading');
const outputDiv = document.getElementById('output');
const errorMessageDiv = document.getElementById('error-message');
const charCountSlider = document.getElementById('char-count');
const charCountDisplay = document.getElementById('char-count-display');
const wordListContainer = document.getElementById('word-list-container');
const themeContainer = document.getElementById('theme-container');

let audioContext;
try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.error("Web Audio API is not supported in this browser"); }

let selectedWordList = '自定义';
let selectedTheme = '默认(爽文)';

function setupControls() {
    // Word list buttons
    for (const name in wordLists) {
        const button = document.createElement('button');
        button.textContent = name;
        button.className = 'control-btn';
        button.dataset.listName = name;
        if (name === selectedWordList) button.classList.add('active');
        button.addEventListener('click', () => {
            selectedWordList = name;
            updateActiveButton(wordListContainer, button);
            customWordsInput.value = wordLists[name].words.map(w => w.en).join(', ');
        });
        wordListContainer.appendChild(button);
    }

    // Theme buttons
    storyThemes.forEach(theme => {
        const button = document.createElement('button');
        button.textContent = theme;
        button.className = 'control-btn';
        button.dataset.themeName = theme;
        if (theme === selectedTheme) button.classList.add('active');
        button.addEventListener('click', () => {
            selectedTheme = theme;
            updateActiveButton(themeContainer, button);
        });
        themeContainer.appendChild(button);
    });
    
    // Initial state
    customWordsInput.value = wordLists[selectedWordList].words.map(w => w.en).join(', ');
}

function updateActiveButton(container, activeButton) {
    container.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');
}

charCountSlider.addEventListener('input', (e) => {
    charCountDisplay.textContent = e.target.value;
});

generateBtn.addEventListener('click', async () => {
    loadingDiv.classList.remove('hidden');
    outputDiv.classList.add('hidden');
    errorMessageDiv.classList.add('hidden');
    generateBtn.disabled = true;
    generateBtn.classList.add('opacity-50', 'cursor-not-allowed');

    const wordsText = customWordsInput.value.trim();
    if (!wordsText) { alert('请输入单词!'); resetState(); return; }
    const wordsArray = wordsText.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
    const maxChars = charCountSlider.value;
    
    try {
        const wordsWithDetails = await getWordDetails(wordsArray);
        const story = await generateStory(wordsWithDetails.map(w => w.en), selectedTheme, maxChars);
        renderCards(story, wordsWithDetails);
        outputDiv.classList.remove('hidden');
    } catch (error) {
        console.error('Error generating content:', error);
        errorMessageDiv.classList.remove('hidden');
    } finally {
        resetState();
    }
});

function resetState() {
    loadingDiv.classList.add('hidden');
    generateBtn.disabled = false;
    generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

async function getWordDetails(words) {
    const results = [];
    const wordsToFetch = [];
    words.forEach(word => {
        let found = null;
        for (const key in wordLists) {
            found = wordLists[key].words.find(item => item.en.toLowerCase() === word);
            if (found) break;
        }
        if (found && !results.some(r => r.en === found.en)) {
            results.push(found);
        } else if (!results.some(r => r.en === word)) {
            wordsToFetch.push(word);
        }
    });
    
    if(wordsToFetch.length > 0) {
         const prompt = `请为以下英文单词提供详细的词典信息。请严格按照以下JSON格式返回，不要添加任何额外说明或文字：[{"en": "word", "phonetic": "/phonetic/", "pos": "pos.", "cn": "中文释义"}]。单词列表：${wordsToFetch.join(', ')}`;
         const fetchedDetails = await callGemini(prompt, true);
         results.push(...fetchedDetails);
    }
    return words.map(word => results.find(r => r.en.toLowerCase() === word));
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

async function generateStory(words, theme, maxChars) {
    const prompt = `你是一位"${theme}"风格的作家。请用中文写一个情节夸张、有趣、易于记忆的短篇故事，并自然地、按顺序地把以下所有英文单词都用上。要求：1. 故事必须连贯。2. 故事总长度严格控制在${maxChars}个中文字符以内。3. 直接开始故事，不要有任何开场白或无关文字。4. 直接使用英文单词，不要添加任何 markdown 符号如星号。单词列表: ${words.join(', ')}`;
    return callGemini(prompt);
}

function pronounceWord(word) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    } else { alert('抱歉，您的浏览器不支持语音合成功能。'); }
}

function playSuccessSound() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

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
        inputElement.classList.add('incorrect');
    } else {
        inputElement.classList.remove('incorrect');
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

function downloadCard(elementId, filename) {
    const cardElement = document.getElementById(elementId);
    html2canvas(cardElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = filename;
        link.click();
    });
}

// 将pronounceWord函数暴露为全局函数，以便HTML中的onclick调用
window.pronounceWord = pronounceWord;
window.checkAnswer = checkAnswer;
window.downloadCard = downloadCard;

// Initialize the UI
document.addEventListener('DOMContentLoaded', setupControls); 