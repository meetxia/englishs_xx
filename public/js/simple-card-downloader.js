// 简化版HTML2IMG功能 - 作为最终备用方案
(function() {
    'use strict';
    
    // 简化的卡片下载功能
    window.SimpleCardDownloader = {
        // 检查必要依赖
        checkDependencies() {
            return {
                html2canvas: !!window.html2canvas,
                allReady: !!window.html2canvas
            };
        },
        
        // 简单的卡片下载
        async downloadCard(elementId, filename, mode) {
            console.log('🔧 SimpleCardDownloader: 开始简单下载', elementId);
            
            try {
                // 检查依赖
                if (!window.html2canvas) {
                    throw new Error('html2canvas 未加载');
                }
                
                // 获取元素
                const element = document.getElementById(elementId);
                if (!element) {
                    throw new Error('找不到元素: ' + elementId);
                }
                
                console.log('📷 SimpleCardDownloader: 开始截图...');
                
                // 使用html2canvas截图
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: element.offsetWidth,
                    height: element.offsetHeight
                });
                
                console.log('✅ SimpleCardDownloader: 截图完成');
                
                // 下载图片
                const link = document.createElement('a');
                link.download = filename || '学习卡片.png';
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('✅ SimpleCardDownloader: 下载完成');
                return true;
                
            } catch (error) {
                console.error('❌ SimpleCardDownloader: 下载失败:', error);
                return false;
            }
        },
        
        // 提取卡片数据的简化版本
        extractCardData(elementId, mode, filename) {
            const element = document.getElementById(elementId);
            if (!element) return null;
            
            const titleElement = element.querySelector('h2');
            const title = titleElement ? titleElement.textContent.trim() : '学习卡片';
            
            let content = '';
            switch(mode) {
                case 'story':
                    const storyElement = element.querySelector('#story-output, p');
                    content = storyElement ? storyElement.textContent.trim() : '';
                    break;
                case 'bilingual':
                    const studyElement = element.querySelector('#study-output, p');
                    content = studyElement ? studyElement.textContent.trim() : '';
                    break;
                case 'vocab':
                    const vocabElement = element.querySelector('#vocab-output');
                    if (vocabElement) {
                        const items = vocabElement.querySelectorAll('div[class*="justify-between"], .flex.justify-between');
                        content = Array.from(items).map(item => {
                            const word = item.querySelector('strong, span[class*="font-semibold"], span:first-child');
                            const meaning = item.querySelector('span[class*="text-gray"], span:last-child');
                            const wordText = word ? word.textContent.trim() : '';
                            const meaningText = meaning ? meaning.textContent.trim() : '';
                            return `${wordText}: ${meaningText}`;
                        }).filter(line => line.trim() !== ': ').join('\n');
                    }
                    break;
                case 'test':
                    const testElement = element.querySelector('#test-output');
                    content = testElement ? testElement.textContent.trim() : '';
                    break;
                default:
                    content = element.textContent.trim();
            }
            
            return {
                title,
                content,
                mode,
                filename: filename || '学习卡片.png'
            };
        }
    };
    
    console.log('✅ SimpleCardDownloader: 简化下载器已加载');
})();