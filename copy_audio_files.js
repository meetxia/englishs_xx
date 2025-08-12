const fs = require('fs');
const path = require('path');

// 要复制的单词列表
const commonWords = [
    "hello", "world", "beautiful", "pronunciation", "education", "technology", 
    "important", "development", "english", "language", "computer", "software", 
    "program", "internet", "website", "application", "mobile", "phone", "device",
    "book", "pencil", "pen", "paper", "notebook", "study", "learn", "teach",
    "school", "university", "college", "student", "teacher", "professor",
    "anxious", "interview", "rehearse", "intimidating", "overwhelm", "attire",
    "complex", "articulate", "perseverance", "comprehensive", "confident",
    "enhance", "enthusiasm", "dedication", "attitude", "opportunity", "success"
];

// 源目录和目标目录
const sourceDir = path.join(__dirname, 'data', 'yinpin');
const targetDir = path.join(__dirname, 'public', 'audio');

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 对每个单词，复制英式和美式发音文件
commonWords.forEach(word => {
    ['gb', 'us'].forEach(accent => {
        const fileName = `${word.toLowerCase()}_${accent}.mp3`;
        const sourcePath = path.join(sourceDir, fileName);
        const targetPath = path.join(targetDir, fileName);
        
        // 检查源文件是否存在
        if (fs.existsSync(sourcePath)) {
            try {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`已复制: ${fileName}`);
            } catch (error) {
                console.error(`复制 ${fileName} 失败: ${error.message}`);
            }
        } else {
            console.warn(`文件不存在: ${sourcePath}`);
        }
    });
});

console.log('音频文件复制完成!'); 