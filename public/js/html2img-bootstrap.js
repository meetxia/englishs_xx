// HTML2IMG 强化启动器 - 确保模块100%加载成功
(function() {
    'use strict';
    
    console.log('🚀 HTML2IMG Bootstrap: 开始强化加载...');
    
    // 全局状态管理
    window.HTML2IMGBootstrap = {
        loaded: false,
        retries: 0,
        maxRetries: 10,
        dependencies: [
            { name: 'html2canvas', url: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js' },
            { name: 'JSZip', url: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js' },
            { name: 'marked', url: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js' },
            { name: 'DOMPurify', url: 'https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js' }
        ],
        
        // 检查依赖是否加载完成
        checkDependencies() {
            const missing = this.dependencies.filter(dep => !window[dep.name]);
            return {
                allLoaded: missing.length === 0,
                missing: missing
            };
        },
        
        // 动态加载缺失的依赖
        async loadMissingDependencies() {
            const { missing } = this.checkDependencies();
            
            if (missing.length === 0) {
                console.log('✅ HTML2IMG Bootstrap: 所有依赖已加载');
                return true;
            }
            
            console.log(`🔄 HTML2IMG Bootstrap: 正在加载缺失的依赖: ${missing.map(d => d.name).join(', ')}`);
            
            for (const dep of missing) {
                try {
                    await this.loadScript(dep.url);
                    console.log(`✅ HTML2IMG Bootstrap: ${dep.name} 加载成功`);
                } catch (error) {
                    console.error(`❌ HTML2IMG Bootstrap: ${dep.name} 加载失败:`, error);
                    return false;
                }
            }
            
            return true;
        },
        
        // 动态加载脚本
        loadScript(url) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },
        
        // 强化初始化HTML2IMG集成
        async initializeIntegration() {
            try {
                console.log(`🔧 HTML2IMG Bootstrap: 尝试初始化 (第${this.retries + 1}次)`);
                
                // 检查并加载依赖
                const depsLoaded = await this.loadMissingDependencies();
                if (!depsLoaded) {
                    throw new Error('依赖加载失败');
                }
                
                // 检查HTML2IMG类是否存在 - 等待类定义
                let classCheckRetries = 0;
                while (typeof HTML2IMGIntegration === 'undefined' && classCheckRetries < 20) {
                    console.log(`🔍 HTML2IMG Bootstrap: 等待 HTML2IMGIntegration 类定义... (${classCheckRetries + 1}/20)`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    classCheckRetries++;
                }
                
                if (typeof HTML2IMGIntegration === 'undefined') {
                    throw new Error('HTML2IMGIntegration 类未定义，可能脚本加载失败');
                }
                
                console.log('✅ HTML2IMG Bootstrap: HTML2IMGIntegration 类已找到');
                
                // 创建或重新创建实例
                if (window.html2imgIntegration) {
                    console.log('🔄 HTML2IMG Bootstrap: 重新创建实例');
                    delete window.html2imgIntegration;
                }
                
                window.html2imgIntegration = new HTML2IMGIntegration();
                console.log('✅ HTML2IMG Bootstrap: 实例创建成功');
                
                // 等待初始化完成
                await this.waitForInitialization();
                
                this.loaded = true;
                console.log('🎉 HTML2IMG Bootstrap: 初始化完全成功！');
                
                // 触发成功事件
                window.dispatchEvent(new CustomEvent('html2imgBootstrapSuccess', {
                    detail: { integration: window.html2imgIntegration }
                }));
                
                return true;
                
            } catch (error) {
                console.error(`❌ HTML2IMG Bootstrap: 初始化失败 (第${this.retries + 1}次):`, error);
                
                this.retries++;
                if (this.retries < this.maxRetries) {
                    const delay = Math.min(2000 * this.retries, 15000);
                    console.log(`🔄 HTML2IMG Bootstrap: ${delay}ms后重试...`);
                    setTimeout(() => this.initializeIntegration(), delay);
                } else {
                    console.error('💥 HTML2IMG Bootstrap: 达到最大重试次数，初始化失败');
                    window.dispatchEvent(new CustomEvent('html2imgBootstrapFailed', {
                        detail: { error: error.message }
                    }));
                }
                
                return false;
            }
        },
        
        // 等待HTML2IMG实例初始化完成
        waitForInitialization() {
            return new Promise((resolve, reject) => {
                const checkInitialized = () => {
                    if (window.html2imgIntegration && window.html2imgIntegration.modalInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInitialized, 100);
                    }
                };
                
                // 监听初始化成功事件
                const onReady = () => {
                    window.removeEventListener('html2imgIntegrationReady', onReady);
                    resolve();
                };
                window.addEventListener('html2imgIntegrationReady', onReady);
                
                // 开始检查
                checkInitialized();
                
                // 30秒超时
                setTimeout(() => {
                    window.removeEventListener('html2imgIntegrationReady', onReady);
                    reject(new Error('初始化超时'));
                }, 30000);
            });
        }
    };
    
    // 页面加载完成后开始初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // 延迟更长时间确保所有脚本都已加载完成
            setTimeout(() => window.HTML2IMGBootstrap.initializeIntegration(), 1000);
        });
    } else {
        // 如果页面已经加载，立即延迟启动
        setTimeout(() => window.HTML2IMGBootstrap.initializeIntegration(), 1000);
    }
    
    // 提供全局测试函数
    window.forceHTML2IMGInit = function() {
        console.log('🔧 HTML2IMG Bootstrap: 强制重新初始化');
        window.HTML2IMGBootstrap.retries = 0;
        window.HTML2IMGBootstrap.loaded = false;
        window.HTML2IMGBootstrap.initializeIntegration();
    };
    
    // 提供状态检查函数
    window.checkHTML2IMGStatus = function() {
        const status = {
            bootstrap: window.HTML2IMGBootstrap.loaded,
            integration: !!(window.html2imgIntegration && window.html2imgIntegration.modalInitialized),
            dependencies: window.HTML2IMGBootstrap.checkDependencies()
        };
        
        console.log('📊 HTML2IMG状态检查:', status);
        return status;
    };
    
})();