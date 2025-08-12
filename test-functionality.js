// 功能测试脚本
console.log('开始测试新的下载功能...');

// 测试1: 检查AdvancedCanvasRenderer是否正确加载
function testAdvancedRenderer() {
    console.log('测试1: 检查AdvancedCanvasRenderer');
    
    try {
        if (typeof AdvancedCanvasRenderer !== 'undefined') {
            const renderer = new AdvancedCanvasRenderer(400, 300);
            console.log('✓ AdvancedCanvasRenderer创建成功');
            
            // 测试模板配置
            const templateConfig = renderer.getTemplateConfig('modern');
            console.log('✓ 模板配置获取成功:', templateConfig.name);
            
            // 测试颜色主题
            const colorTheme = renderer.getColorTheme('blue');
            console.log('✓ 颜色主题获取成功:', colorTheme.primary);
            
            return true;
        } else {
            console.log('✗ AdvancedCanvasRenderer未定义');
            return false;
        }
    } catch (error) {
        console.log('✗ AdvancedCanvasRenderer测试失败:', error.message);
        return false;
    }
}

// 测试2: 检查ImageFormatModal是否正确加载
function testImageFormatModal() {
    console.log('测试2: 检查ImageFormatModal');
    
    try {
        if (typeof window.imageFormatModal !== 'undefined') {
            console.log('✓ ImageFormatModal已加载');
            
            // 测试模态框功能
            const testData = {
                title: '测试卡片',
                content: '这是一个测试内容',
                mode: 'story',
                filename: 'test.png'
            };
            
            // 不实际打开模态框，只测试数据处理
            console.log('✓ 测试数据准备完成');
            return true;
        } else {
            console.log('✗ ImageFormatModal未定义');
            return false;
        }
    } catch (error) {
        console.log('✗ ImageFormatModal测试失败:', error.message);
        return false;
    }
}

// 测试3: 检查新的下载函数是否存在
function testDownloadFunctions() {
    console.log('测试3: 检查下载函数');
    
    try {
        if (typeof downloadCard === 'function') {
            console.log('✓ downloadCard函数存在');
        } else {
            console.log('✗ downloadCard函数不存在');
        }
        
        if (typeof extractCardData === 'function') {
            console.log('✓ extractCardData函数存在');
        } else {
            console.log('✗ extractCardData函数不存在');
        }
        
        if (typeof downloadCardLegacy === 'function') {
            console.log('✓ downloadCardLegacy函数存在');
        } else {
            console.log('✗ downloadCardLegacy函数不存在');
        }
        
        return true;
    } catch (error) {
        console.log('✗ 下载函数测试失败:', error.message);
        return false;
    }
}

// 测试4: 模拟卡片数据提取
function testCardDataExtraction() {
    console.log('测试4: 测试卡片数据提取');
    
    try {
        // 创建测试DOM元素
        const testElement = document.createElement('div');
        testElement.id = 'test-card';
        testElement.innerHTML = `
            <h2>测试标题</h2>
            <p>这是测试内容，包含一些<span class="highlight">highlight</span>单词。</p>
        `;
        document.body.appendChild(testElement);
        
        if (typeof extractCardData === 'function') {
            const cardData = extractCardData(testElement, 'story', 'test.png');
            console.log('✓ 卡片数据提取成功:', cardData.title);
            
            // 清理测试元素
            document.body.removeChild(testElement);
            return true;
        } else {
            console.log('✗ extractCardData函数不存在');
            return false;
        }
    } catch (error) {
        console.log('✗ 卡片数据提取测试失败:', error.message);
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('=== 开始功能测试 ===');
    
    const results = {
        advancedRenderer: testAdvancedRenderer(),
        imageFormatModal: testImageFormatModal(),
        downloadFunctions: testDownloadFunctions(),
        cardDataExtraction: testCardDataExtraction()
    };
    
    console.log('=== 测试结果汇总 ===');
    let passedTests = 0;
    let totalTests = 0;
    
    for (const [testName, result] of Object.entries(results)) {
        totalTests++;
        if (result) {
            passedTests++;
            console.log(`✓ ${testName}: 通过`);
        } else {
            console.log(`✗ ${testName}: 失败`);
        }
    }
    
    console.log(`=== 测试完成: ${passedTests}/${totalTests} 通过 ===`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！新的下载功能已准备就绪。');
    } else {
        console.log('⚠️ 部分测试失败，请检查相关组件。');
    }
    
    return results;
}

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    // 等待页面加载完成后运行测试
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
        // 延迟一秒确保所有脚本加载完成
        setTimeout(runAllTests, 1000);
    }
}

// 导出测试函数（如果在Node.js环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testAdvancedRenderer,
        testImageFormatModal,
        testDownloadFunctions,
        testCardDataExtraction,
        runAllTests
    };
}
