/**
 * 专业版下载功能测试脚本
 * 用于验证 Puppeteer 集成是否正常工作
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    testOutputDir: './test-outputs',
    timeout: 30000
};

// 测试用的HTML内容
const TEST_HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试卡片</title>
    <style>
        body {
            font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
            margin: 0;
            padding: 40px;
            background: white;
            font-size: 20px;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .title {
            text-align: center;
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 30px;
            color: #2563eb;
        }
        .highlight {
            background: #fef3c7;
            color: #92400e;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">功能测试卡片</h1>
        <p>这是一个用于测试专业版下载功能的示例卡片。</p>
        <p>卡片中包含了一些<span class="highlight">高亮单词</span>来测试样式渲染效果。</p>
        <p>如果您能看到这个内容，说明 <span class="highlight">Puppeteer</span> 集成功能运行正常！</p>
        <p>测试时间: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
`;

class DownloadTester {
    constructor() {
        this.results = [];
        this.setupOutputDir();
    }

    setupOutputDir() {
        if (!fs.existsSync(TEST_CONFIG.testOutputDir)) {
            fs.mkdirSync(TEST_CONFIG.testOutputDir, { recursive: true });
        }
    }

    async runAllTests() {
        console.log('🧪 开始测试专业版下载功能...\n');

        const tests = [
            { name: 'PNG图片生成测试', test: () => this.testPNGGeneration() },
            { name: 'PDF文档生成测试', test: () => this.testPDFGeneration() },
            { name: 'API健康检查', test: () => this.testAPIHealth() },
            { name: '错误处理测试', test: () => this.testErrorHandling() }
        ];

        for (const { name, test } of tests) {
            try {
                console.log(`\n📋 ${name}...`);
                await test();
                console.log(`✅ ${name} - 通过`);
                this.results.push({ name, status: 'PASS' });
            } catch (error) {
                console.error(`❌ ${name} - 失败:`, error.message);
                this.results.push({ name, status: 'FAIL', error: error.message });
            }
        }

        this.printSummary();
    }

    async testAPIHealth() {
        const response = await axios.get(`${TEST_CONFIG.baseUrl}/api/health`, {
            timeout: 5000
        });

        if (response.status !== 200) {
            throw new Error(`API健康检查失败: ${response.status}`);
        }

        console.log('  ✓ API服务正常运行');
    }

    async testPNGGeneration() {
        const options = {
            output: 'png',
            width: 800,
            height: 600,
            filename: 'test-png'
        };

        const response = await axios.post(
            `${TEST_CONFIG.baseUrl}/api/generate-card`,
            {
                htmlContent: TEST_HTML_CONTENT,
                options: options
            },
            {
                responseType: 'arraybuffer',
                timeout: TEST_CONFIG.timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status !== 200) {
            throw new Error(`PNG生成失败: ${response.status}`);
        }

        // 保存测试文件
        const outputPath = path.join(TEST_CONFIG.testOutputDir, 'test-output.png');
        fs.writeFileSync(outputPath, response.data);

        // 验证文件
        const stats = fs.statSync(outputPath);
        if (stats.size < 1000) {
            throw new Error('生成的PNG文件太小，可能有问题');
        }

        console.log(`  ✓ PNG图片生成成功 (${(stats.size / 1024).toFixed(1)}KB)`);
        console.log(`  ✓ 测试文件保存至: ${outputPath}`);
    }

    async testPDFGeneration() {
        const options = {
            output: 'pdf',
            format: 'A4',
            filename: 'test-pdf'
        };

        const response = await axios.post(
            `${TEST_CONFIG.baseUrl}/api/generate-card`,
            {
                htmlContent: TEST_HTML_CONTENT,
                options: options
            },
            {
                responseType: 'arraybuffer',
                timeout: TEST_CONFIG.timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status !== 200) {
            throw new Error(`PDF生成失败: ${response.status}`);
        }

        // 保存测试文件
        const outputPath = path.join(TEST_CONFIG.testOutputDir, 'test-output.pdf');
        fs.writeFileSync(outputPath, response.data);

        // 验证文件
        const stats = fs.statSync(outputPath);
        if (stats.size < 1000) {
            throw new Error('生成的PDF文件太小，可能有问题');
        }

        console.log(`  ✓ PDF文档生成成功 (${(stats.size / 1024).toFixed(1)}KB)`);
        console.log(`  ✓ 测试文件保存至: ${outputPath}`);
    }

    async testErrorHandling() {
        try {
            // 测试缺少参数的情况
            await axios.post(
                `${TEST_CONFIG.baseUrl}/api/generate-card`,
                { htmlContent: null, options: null },
                { timeout: 5000 }
            );
            
            throw new Error('应该返回错误，但请求成功了');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('  ✓ 参数验证错误处理正常');
            } else {
                throw error;
            }
        }

        try {
            // 测试无效HTML的情况
            await axios.post(
                `${TEST_CONFIG.baseUrl}/api/generate-card`,
                { 
                    htmlContent: '<invalid html>', 
                    options: { output: 'png', width: 800, height: 600 }
                },
                { timeout: TEST_CONFIG.timeout }
            );
            
            console.log('  ✓ 无效HTML也能正常处理');
        } catch (error) {
            if (error.response && error.response.status >= 400) {
                console.log('  ✓ 无效HTML错误处理正常');
            } else {
                throw error;
            }
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 测试结果汇总');
        console.log('='.repeat(50));

        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;

        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${result.name}`);
            if (result.error) {
                console.log(`   错误: ${result.error}`);
            }
        });

        console.log(`\n总计: ${this.results.length} 个测试`);
        console.log(`通过: ${passed} 个`);
        console.log(`失败: ${failed} 个`);

        if (failed === 0) {
            console.log('\n🎉 所有测试通过！专业版下载功能运行正常。');
        } else {
            console.log('\n⚠️  部分测试失败，请检查错误信息并修复问题。');
        }

        console.log(`\n📁 测试输出文件保存在: ${path.resolve(TEST_CONFIG.testOutputDir)}`);
    }
}

// 运行测试
async function main() {
    const tester = new DownloadTester();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('\n💥 测试运行失败:', error.message);
        process.exit(1);
    }
}

// 检查是否作为主模块运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DownloadTester, TEST_HTML_CONTENT };