/**
 * 卡片生成器模块 - 基于 Puppeteer 的服务器端渲染
 * 实现高质量的图片和PDF生成功能
 */

const puppeteer = require('puppeteer');
const path = require('path');

class CardGenerator {
    constructor() {
        this.browser = null;
        this.isInitialized = false;
    }

    /**
     * 初始化浏览器实例
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('🚀 正在启动 Puppeteer 浏览器...');
            
            this.browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080'
                ]
            });

            this.isInitialized = true;
            console.log('✅ Puppeteer 浏览器启动成功');
            
            // 设置优雅关闭
            process.on('SIGINT', () => this.cleanup());
            process.on('SIGTERM', () => this.cleanup());
            
        } catch (error) {
            console.error('❌ Puppeteer 浏览器启动失败:', error);
            throw new Error(`浏览器启动失败: ${error.message}`);
        }
    }

    /**
     * 清理资源
     */
    async cleanup() {
        if (this.browser) {
            console.log('🧹 正在关闭浏览器...');
            await this.browser.close();
            this.browser = null;
            this.isInitialized = false;
        }
    }

    /**
     * 确保浏览器可用
     */
    async ensureBrowser() {
        if (!this.isInitialized || !this.browser) {
            await this.initialize();
        }

        // 检查浏览器是否仍然连接
        try {
            await this.browser.version();
        } catch (error) {
            console.log('🔄 浏览器连接断开，重新初始化...');
            this.isInitialized = false;
            await this.initialize();
        }
    }

    /**
     * 生成图片或PDF
     * @param {string} htmlContent - 完整的HTML内容
     * @param {object} options - 生成选项
     * @returns {Buffer} - 文件缓冲区
     */
    async generateOutput(htmlContent, options) {
        let page = null;
        
        try {
            console.log('📄 开始渲染HTML内容...');
            console.log('📋 生成选项:', {
                output: options.output,
                format: options.format,
                width: options.width,
                height: options.height,
                preview: options.preview
            });

            // 验证HTML内容
            if (!htmlContent || typeof htmlContent !== 'string') {
                throw new Error('HTML内容无效或为空');
            }

            console.log('📏 HTML内容长度:', htmlContent.length);

            // 确保浏览器可用
            await this.ensureBrowser();
            console.log('✅ 浏览器实例已准备就绪');

            // 创建新页面
            page = await this.browser.newPage();
            console.log('✅ 新页面已创建');

            // 设置页面内容
            console.log('🔄 设置页面内容...');
            await page.setContent(htmlContent, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            console.log('✅ 页面内容设置完成');

            // 等待字体加载
            console.log('🔤 等待字体加载...');
            await page.evaluateHandle('document.fonts.ready');
            console.log('✅ 字体加载完成');

            let outputBuffer;

            if (options.output === 'pdf') {
                console.log('📄 生成PDF文件...');
                outputBuffer = await this.generatePDF(page, options);
            } else {
                console.log('🖼️ 生成图片...');
                outputBuffer = await this.generateImage(page, options);
            }

            console.log(`✅ 文件生成成功 (${outputBuffer.length} 字节)`);
            return outputBuffer;

        } catch (error) {
            console.error('❌ 文件生成失败:', error);
            console.error('📊 错误堆栈:', error.stack);
            
            // 提供更详细的错误信息
            let errorMessage = '生成失败';
            if (error.message.includes('timeout')) {
                errorMessage = '页面加载超时，请检查HTML内容或网络连接';
            } else if (error.message.includes('invalid')) {
                errorMessage = `无效的生成参数: ${error.message}`;
            } else if (error.message.includes('navigation')) {
                errorMessage = `页面导航失败: ${error.message}`;
            } else if (error.message.includes('browser')) {
                errorMessage = `浏览器错误: ${error.message}`;
            } else if (error.message.includes('HTML内容无效')) {
                errorMessage = 'HTML内容无效或为空';
            } else {
                errorMessage = `生成失败: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        } finally {
            if (page) {
                try {
                    console.log('🧹 关闭页面...');
                    await page.close();
                } catch (closeError) {
                    console.warn('⚠️ 关闭页面时出现警告:', closeError.message);
                }
            }
        }
    }

    /**
     * 生成PDF
     */
    async generatePDF(page, options) {
        const pdfOptions = {
            format: options.format || 'A4',
            printBackground: true,
            margin: {
                top: '2cm',
                right: '1cm',
                bottom: '2cm',
                left: '1cm'
            },
            preferCSSPageSize: true
        };

        return await page.pdf(pdfOptions);
    }

    /**
     * 生成图片
     */
    async generateImage(page, options) {
        // 设置视窗大小
        await page.setViewport({
            width: options.width || 1200,
            height: options.height || 1600,
            deviceScaleFactor: options.preview ? 1 : 2 // 预览模式使用1倍，正式下载使用2倍
        });

        // 等待一点时间确保渲染完成
        await page.waitForTimeout(1000);

        // 获取图像格式，统一处理格式名称
        let imageType = (options.format || 'png').toLowerCase();
        
        // 统一JPEG格式名称
        if (imageType === 'jpg') {
            imageType = 'jpeg';
        }
        
        // 验证格式是否支持
        if (!['png', 'jpeg', 'webp'].includes(imageType)) {
            console.warn(`⚠️ 不支持的图像格式: ${imageType}，回退到PNG格式`);
            imageType = 'png';
        }

        const screenshotOptions = {
            type: imageType,
            fullPage: true,
            omitBackground: false
        };

        // 只有JPEG和WebP格式才支持quality参数
        if (imageType === 'jpeg' || imageType === 'webp') {
            // 如果是预览模式，可以降低质量以提高速度
            if (options.preview) {
                screenshotOptions.quality = 80;
            } else {
                screenshotOptions.quality = options.quality || 90; // 默认高质量
            }
        }
        // PNG格式不支持quality参数，会自动使用无损压缩

        console.log(`📸 生成${imageType.toUpperCase()}图片，预览模式: ${options.preview || false}`);
        return await page.screenshot(screenshotOptions);
    }

    /**
     * 生成预览图片（低分辨率，快速）
     */
    async generatePreview(htmlContent, options) {
        const previewOptions = {
            ...options,
            preview: true,
            width: Math.floor((options.width || 1200) / 2),
            height: Math.floor((options.height || 1600) / 2)
        };

        return await this.generateOutput(htmlContent, previewOptions);
    }
}

// 单例实例
const cardGenerator = new CardGenerator();

module.exports = cardGenerator;