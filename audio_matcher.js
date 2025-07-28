const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 配置路径
const SOURCE_AUDIO_PATH = 'E:\\BaiduNetdiskDownload\\牛津高阶英汉双解词典第10版完美版\\extracted_audio';
const TARGET_AUDIO_PATH = 'H:\\momo-ruanjiansheji\\englishs_xx\\data\\yinpin';
const DB_PATH = path.join(__dirname, 'data', 'words.db');

/**
 * 从数据库获取所有唯一单词
 */
function getWordsFromDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.all("SELECT DISTINCT en FROM words WHERE en IS NOT NULL AND en != '' ORDER BY en", (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            const words = rows.map(row => row.en.toLowerCase().trim()).filter(word => word);
            console.log(`从数据库获取到 ${words.length} 个唯一单词`);
            resolve(words);
        });
        
        db.close();
    });
}

/**
 * 获取源音频目录中的所有文件
 */
function getAudioFiles() {
    try {
        const files = fs.readdirSync(SOURCE_AUDIO_PATH);
        const audioFiles = files.filter(file => file.endsWith('.mp3'));
        console.log(`源音频目录中找到 ${audioFiles.length} 个音频文件`);
        return audioFiles;
    } catch (error) {
        console.error('读取源音频目录失败:', error);
        return [];
    }
}

/**
 * 解析音频文件名，提取单词和发音类型
 */
function parseAudioFileName(fileName) {
    // 移除.mp3扩展名
    const nameWithoutExt = fileName.replace('.mp3', '');
    
    // 匹配英式发音 (_gb_) 或美式发音 (_us_)
    const gbMatch = nameWithoutExt.match(/^(.+?)_+gb_/);
    const usMatch = nameWithoutExt.match(/^(.+?)_+us_/);
    
    if (gbMatch) {
        return {
            word: gbMatch[1].toLowerCase().replace(/_+$/, ''),
            accent: 'gb',
            fileName: fileName
        };
    } else if (usMatch) {
        return {
            word: usMatch[1].toLowerCase().replace(/_+$/, ''),
            accent: 'us', 
            fileName: fileName
        };
    }
    
    return null;
}

/**
 * 精确匹配单词与音频文件
 */
function matchWordsWithAudio(words, audioFiles) {
    const matches = new Map();
    const parsedAudioFiles = [];
    
    // 解析所有音频文件
    audioFiles.forEach(fileName => {
        const parsed = parseAudioFileName(fileName);
        if (parsed) {
            parsedAudioFiles.push(parsed);
        }
    });
    
    console.log(`成功解析 ${parsedAudioFiles.length} 个音频文件`);
    
    // 为每个单词查找匹配的音频文件
    words.forEach(word => {
        const wordMatches = parsedAudioFiles.filter(audio => audio.word === word);
        
        if (wordMatches.length > 0) {
            matches.set(word, wordMatches);
        }
    });
    
    return matches;
}

/**
 * 确保目标目录存在
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`创建目录: ${dirPath}`);
    }
}

/**
 * 复制音频文件到目标目录
 */
function copyAudioFiles(matches) {
    ensureDirectoryExists(TARGET_AUDIO_PATH);
    
    let copiedCount = 0;
    let skippedCount = 0;
    const copyResults = [];
    
    matches.forEach((audioFiles, word) => {
        audioFiles.forEach(audioFile => {
            const sourcePath = path.join(SOURCE_AUDIO_PATH, audioFile.fileName);
            const targetFileName = `${word}_${audioFile.accent}.mp3`;
            const targetPath = path.join(TARGET_AUDIO_PATH, targetFileName);
            
            try {
                // 检查目标文件是否已存在
                if (fs.existsSync(targetPath)) {
                    console.log(`跳过已存在的文件: ${targetFileName}`);
                    skippedCount++;
                    return;
                }
                
                // 复制文件
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`复制成功: ${audioFile.fileName} -> ${targetFileName}`);
                copiedCount++;
                
                copyResults.push({
                    word: word,
                    accent: audioFile.accent,
                    sourceFile: audioFile.fileName,
                    targetFile: targetFileName,
                    status: 'success'
                });
                
            } catch (error) {
                console.error(`复制文件失败 ${audioFile.fileName}:`, error.message);
                copyResults.push({
                    word: word,
                    accent: audioFile.accent,
                    sourceFile: audioFile.fileName,
                    targetFile: targetFileName,
                    status: 'error',
                    error: error.message
                });
            }
        });
    });
    
    return {
        copiedCount,
        skippedCount,
        results: copyResults
    };
}

/**
 * 生成匹配报告
 */
function generateReport(words, matches, copyResults) {
    const matchedWords = Array.from(matches.keys());
    const unmatchedWords = words.filter(word => !matches.has(word));
    
    console.log('\n=== 匹配报告 ===');
    console.log(`总单词数: ${words.length}`);
    console.log(`匹配成功: ${matchedWords.length}`);
    console.log(`未匹配: ${unmatchedWords.length}`);
    console.log(`复制成功: ${copyResults.copiedCount}`);
    console.log(`跳过文件: ${copyResults.skippedCount}`);
    
    // 统计发音类型
    let gbCount = 0;
    let usCount = 0;
    matches.forEach(audioFiles => {
        audioFiles.forEach(audio => {
            if (audio.accent === 'gb') gbCount++;
            if (audio.accent === 'us') usCount++;
        });
    });
    
    console.log(`英式发音文件: ${gbCount}`);
    console.log(`美式发音文件: ${usCount}`);
    
    // 显示部分未匹配的单词（最多显示20个）
    if (unmatchedWords.length > 0) {
        console.log('\n未匹配的单词示例（前20个）:');
        unmatchedWords.slice(0, 20).forEach(word => {
            console.log(`  - ${word}`);
        });
        if (unmatchedWords.length > 20) {
            console.log(`  ... 还有 ${unmatchedWords.length - 20} 个未匹配的单词`);
        }
    }
    
    // 保存详细报告到文件
    const reportPath = path.join(__dirname, 'audio_match_report.json');
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalWords: words.length,
            matchedWords: matchedWords.length,
            unmatchedWords: unmatchedWords.length,
            copiedFiles: copyResults.copiedCount,
            skippedFiles: copyResults.skippedCount,
            gbFiles: gbCount,
            usFiles: usCount
        },
        matchedWords: matchedWords,
        unmatchedWords: unmatchedWords,
        copyResults: copyResults.results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n详细报告已保存到: ${reportPath}`);
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('开始音频文件匹配和复制任务...\n');
        
        // 1. 从数据库获取单词列表
        console.log('1. 从数据库获取单词列表...');
        const words = await getWordsFromDatabase();
        
        // 2. 获取源音频文件列表
        console.log('\n2. 扫描源音频目录...');
        const audioFiles = getAudioFiles();
        
        if (audioFiles.length === 0) {
            console.error('未找到音频文件，请检查源路径是否正确');
            return;
        }
        
        // 3. 匹配单词与音频文件
        console.log('\n3. 匹配单词与音频文件...');
        const matches = matchWordsWithAudio(words, audioFiles);
        
        // 4. 复制匹配的音频文件
        console.log('\n4. 复制音频文件...');
        const copyResults = copyAudioFiles(matches);
        
        // 5. 生成报告
        console.log('\n5. 生成匹配报告...');
        generateReport(words, matches, copyResults);
        
        console.log('\n任务完成！');
        
    } catch (error) {
        console.error('任务执行失败:', error);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    getWordsFromDatabase,
    getAudioFiles,
    parseAudioFileName,
    matchWordsWithAudio,
    copyAudioFiles,
    generateReport
};
