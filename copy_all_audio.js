const fs = require('fs');
const path = require('path');

// 源目录和目标目录
const sourceDir = path.join(__dirname, 'data', 'yinpin');
const targetDir = path.join(__dirname, 'public', 'audio');

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 获取源目录中的所有文件
try {
    const files = fs.readdirSync(sourceDir);
    
    // 只复制MP3文件
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
    
    console.log(`找到 ${mp3Files.length} 个MP3文件`);
    
    // 复制文件
    let successCount = 0;
    let failCount = 0;
    
    mp3Files.forEach(file => {
        try {
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);
            
            fs.copyFileSync(sourcePath, targetPath);
            successCount++;
            
            // 每100个文件输出一次进度
            if (successCount % 100 === 0) {
                console.log(`已复制 ${successCount} 个文件...`);
            }
        } catch (error) {
            console.error(`复制文件 ${file} 失败: ${error.message}`);
            failCount++;
        }
    });
    
    console.log(`\n复制完成! 成功: ${successCount} 个文件, 失败: ${failCount} 个文件`);
    
} catch (error) {
    console.error(`读取源目录失败: ${error.message}`);
} 