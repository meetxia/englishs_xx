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
                headless: true,
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
        await this.ensureBrowser();

        const page = await this.browser.newPage();

        try {
            console.log('📄 开始渲染HTML内容...');

            // 设置页面内容
            await page.setContent(htmlContent, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });

            // 等待字体加载
            await page.evaluateHandle('document.fonts.ready');

            let outputBuffer;

            if (options.output === 'pdf') {
                console.log('📄 生成PDF文件...');
                outputBuffer = await this.generatePDF(page, options);
            } else {
                console.log('🖼️ 生成PNG图片...');
                outputBuffer = await this.generateImage(page, options);
            }

            console.log('✅ 文件生成成功');
            return outputBuffer;

        } catch (error) {
            console.error('❌ 文件生成失败:', error);
            throw new Error(`生成失败: ${error.message}`);
        } finally {
            await page.close();
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

        const screenshotOptions = {
            type: 'png',
            fullPage: true,
            omitBackground: false
        };

        // 如果是预览模式，可以降低质量以提高速度
        if (options.preview) {
            screenshotOptions.quality = 80; // 仅对 jpeg 有效，但我们使用 png
        }

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