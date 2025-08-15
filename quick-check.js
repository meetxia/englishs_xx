/**
 * 快速检查脚本 - 验证 Puppeteer 是否正确安装
 */

async function quickCheck() {
    console.log('🔍 正在检查 Puppeteer 安装状态...\n');

    try {
        // 1. 检查 Puppeteer 是否已安装
        console.log('📦 检查 Puppeteer 模块...');
        const puppeteer = require('puppeteer');
        console.log('✅ Puppeteer 模块已安装');

        // 2. 检查版本
        const packageJson = require('puppeteer/package.json');
        console.log(`📋 版本: ${packageJson.version}`);

        // 3. 尝试启动浏览器
        console.log('\n🚀 测试浏览器启动...');
        const browser = await puppeteer.launch({ headless: true });
        console.log('✅ 浏览器启动成功');

        // 4. 创建页面并测试基本功能
        console.log('📄 测试页面创建...');
        const page = await browser.newPage();
        await page.setContent('<h1>测试页面</h1><p>Hello, Puppeteer!</p>');
        console.log('✅ 页面创建成功');

        // 5. 测试截图功能
        console.log('📸 测试截图功能...');
        const screenshot = await page.screenshot({ type: 'png' });
        console.log(`✅ 截图成功 (${screenshot.length} 字节)`);

        // 6. 测试PDF生成
        console.log('📄 测试PDF生成...');
        const pdf = await page.pdf({ format: 'A4' });
        console.log(`✅ PDF生成成功 (${pdf.length} 字节)`);

        // 清理
        await browser.close();
        
        console.log('\n🎉 所有检查通过！Puppeteer 工作正常。');
        console.log('👍 您现在可以使用专业版下载功能了。\n');

    } catch (error) {
        console.error('\n❌ 检查失败:', error.message);
        console.log('\n🛠️  解决方案:');
        
        if (error.message.includes('Cannot find module')) {
            console.log('1. 安装 Puppeteer: npm install puppeteer');
        } else if (error.message.includes('spawn')) {
            console.log('1. 检查系统依赖是否完整');
            console.log('2. Ubuntu/Debian: sudo apt-get install -y libx11-xcb1 libxcomposite1 libxrandr2');
            console.log('3. CentOS: sudo yum install -y libX11-xcb libXcomposite');
        } else {
            console.log('1. 确保有足够的内存和磁盘空间');
            console.log('2. 检查网络连接是否正常');
            console.log('3. 尝试重新安装: npm uninstall puppeteer && npm install puppeteer');
        }
        
        process.exit(1);
    }
}

// 运行快速检查
quickCheck();