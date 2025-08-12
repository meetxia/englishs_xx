// 图片格式调整模态框功能
class ImageFormatModal {
    constructor() {
        this.currentCardData = null;
        this.currentSettings = {
            template: 'modern',
            colorTheme: 'blue',
            titleFont: "'Noto Sans SC', sans-serif",
            bodyFont: "'Noto Sans SC', sans-serif",
            fontSize: 16,
            spacing: 20,
            margin: 40
        };
        this.previewCanvas = null;
        this.previewCtx = null;
        this.initializeCanvas();
    }

    initializeCanvas() {
        // 延迟初始化，确保DOM元素已经存在
        setTimeout(() => {
            this.previewCanvas = document.getElementById('previewCanvas');
            if (this.previewCanvas) {
                this.previewCtx = this.previewCanvas.getContext('2d');
                // 设置固定尺寸
                this.previewCanvas.width = 400;
                this.previewCanvas.height = 533;
                console.log('预览Canvas初始化成功');
            } else {
                console.error('预览Canvas元素未找到');
            }
        }, 100);
    }

    // 打开模态框
    open(cardData) {
        this.currentCardData = cardData;
        const modal = document.getElementById('imageFormatModal');
        if (modal) {
            modal.classList.remove('hidden');

            // 确保Canvas已初始化
            setTimeout(() => {
                if (!this.previewCanvas) {
                    this.initializeCanvas();
                }
                // 延迟一点时间确保Canvas完全准备好
                setTimeout(() => {
                    this.updatePreview();
                }, 200);
            }, 100);
        }
    }

    // 关闭模态框
    close() {
        const modal = document.getElementById('imageFormatModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // 选择模板
    selectTemplate(template) {
        this.currentSettings.template = template;
        
        // 更新UI状态
        document.querySelectorAll('.template-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-template="${template}"]`).classList.add('active');
        
        this.updatePreview();
    }

    // 选择颜色主题
    selectColorTheme(theme) {
        this.currentSettings.colorTheme = theme;
        
        // 更新UI状态
        document.querySelectorAll('.color-theme').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
        
        this.updatePreview();
    }

    // 更新预览
    updatePreview() {
        console.log('更新预览被调用');

        if (!this.currentCardData) {
            console.error('没有卡片数据，无法更新预览');
            return;
        }

        // 获取当前设置 - 实时同步UI控件的值
        const titleFontSelect = document.getElementById('titleFontSelect');
        const bodyFontSelect = document.getElementById('bodyFontSelect');
        const fontSizeSlider = document.getElementById('fontSizeSlider');
        const spacingSlider = document.getElementById('spacingSlider');
        const marginSlider = document.getElementById('marginSlider');

        // 强制同步所有设置值
        if (titleFontSelect) {
            this.currentSettings.titleFont = titleFontSelect.value;
        }
        if (bodyFontSelect) {
            this.currentSettings.bodyFont = bodyFontSelect.value;
        }
        if (fontSizeSlider) {
            const fontSize = parseInt(fontSizeSlider.value);
            this.currentSettings.fontSize = fontSize;
            console.log('字体大小滑块值:', fontSize);
        }
        if (spacingSlider) {
            this.currentSettings.spacing = parseInt(spacingSlider.value);
        }
        if (marginSlider) {
            this.currentSettings.margin = parseInt(marginSlider.value);
        }

        console.log('当前设置:', this.currentSettings);

        // 减少延迟以提高实时性
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }

        this.previewTimeout = setTimeout(() => {
            this.renderPreview();
        }, 50); // 进一步减少到50ms提高响应性
    }

    // 渲染预览
    async renderPreview() {
        console.log('开始渲染预览...');

        // 检查必要条件
        if (!this.currentCardData) {
            console.error('没有卡片数据');
            return;
        }

        // 确保Canvas已初始化
        if (!this.previewCanvas) {
            this.previewCanvas = document.getElementById('previewCanvas');
            if (this.previewCanvas) {
                this.previewCtx = this.previewCanvas.getContext('2d');
            }
        }

        if (!this.previewCanvas || !this.previewCtx) {
            console.error('预览Canvas未初始化');
            return;
        }

        try {
            // 显示加载状态
            this.previewCtx.clearRect(0, 0, 400, 533);
            this.previewCtx.fillStyle = '#f9fafb';
            this.previewCtx.fillRect(0, 0, 400, 533);
            this.previewCtx.fillStyle = '#6b7280';
            this.previewCtx.font = '16px Arial';
            this.previewCtx.textAlign = 'center';
            this.previewCtx.fillText('生成预览中...', 200, 266);

            // 检查AdvancedCanvasRenderer是否存在
            if (typeof AdvancedCanvasRenderer === 'undefined' || !window.advancedRenderer) {
                console.error('AdvancedCanvasRenderer未定义或实例不存在');
                throw new Error('渲染器未准备就绪，请刷新页面重试');
            }

            // 使用现有的实例而不是创建新实例
            const previewRenderer = window.advancedRenderer;
            
            // 重设预览渲染器的尺寸
            previewRenderer.width = 400;
            previewRenderer.height = 533;
            previewRenderer.canvas.width = 400 * (window.devicePixelRatio || 2);
            previewRenderer.canvas.height = 533 * (window.devicePixelRatio || 2);
            previewRenderer.ctx.scale(window.devicePixelRatio || 2, window.devicePixelRatio || 2);

            // 配置预览设置 - 使用与下载相同的配置确保一致性
            const previewConfig = {
                template: this.currentSettings.template,
                colorTheme: this.currentSettings.colorTheme,
                titleFont: this.currentSettings.titleFont,
                bodyFont: this.currentSettings.bodyFont,
                fontSize: this.currentSettings.fontSize, // 使用相同的字体大小
                spacing: this.currentSettings.spacing, // 使用相同的行间距
                margin: this.currentSettings.margin, // 使用相同的边距
                isPreview: true, // 标记为预览模式
                compactLayout: false // 禁用紧凑布局保证一致性
            };

            console.log('预览配置:', previewConfig);

            // 准备卡片数据副本，避免修改原始数据
            const cardDataCopy = { ...this.currentCardData };

            // 确保内容不为空
            if (!cardDataCopy.content) {
                cardDataCopy.content = '预览示例内容';
            }

            // 渲染预览
            const imageData = await previewRenderer.renderCard(cardDataCopy, previewConfig);

            // 将结果绘制到预览画布
            const img = new Image();
            img.onload = () => {
                this.previewCtx.clearRect(0, 0, 400, 533);
                this.previewCtx.drawImage(img, 0, 0, 400, 533);
                console.log('预览渲染完成');
            };
            img.onerror = (error) => {
                console.error('预览图片加载失败:', error);
                this.showPreviewError('预览图片加载失败');
            };
            img.src = imageData;

        } catch (error) {
            console.error('预览渲染失败:', error);
            this.showPreviewError('预览生成失败: ' + error.message);
            
            // 重试一次初始化渲染器
            if (error.message.includes('渲染器未准备就绪')) {
                try {
                    console.log('尝试重新初始化渲染器...');
                    window.canvasRenderer = new CanvasCardRenderer();
                    window.advancedRenderer = new AdvancedCanvasRenderer();
                    
                    // 延迟后再次尝试渲染
                    setTimeout(() => {
                        this.renderPreview();
                    }, 500);
                } catch (initError) {
                    console.error('渲染器初始化失败:', initError);
                }
            }
        }
    }

    // 显示预览错误
    showPreviewError(message) {
        if (!this.previewCtx) return;

        this.previewCtx.clearRect(0, 0, 400, 533);
        this.previewCtx.fillStyle = '#fef2f2';
        this.previewCtx.fillRect(0, 0, 400, 533);
        this.previewCtx.fillStyle = '#dc2626';
        this.previewCtx.font = '14px Arial';
        this.previewCtx.textAlign = 'center';
        this.previewCtx.fillText(message, 200, 266);
    }

    // 模板配置现在由AdvancedCanvasRenderer处理

    // 重置为默认设置
    resetToDefault() {
        this.currentSettings = {
            template: 'modern',
            colorTheme: 'blue',
            titleFont: "'Noto Sans SC', sans-serif",
            bodyFont: "'Noto Sans SC', sans-serif",
            fontSize: 16,
            spacing: 20,
            margin: 40
        };

        // 更新UI控件
        document.getElementById('titleFontSelect').value = this.currentSettings.titleFont;
        document.getElementById('bodyFontSelect').value = this.currentSettings.bodyFont;
        document.getElementById('fontSizeSlider').value = this.currentSettings.fontSize;
        document.getElementById('spacingSlider').value = this.currentSettings.spacing;
        document.getElementById('marginSlider').value = this.currentSettings.margin;

        // 更新选择状态
        this.selectTemplate('modern');
        this.selectColorTheme('blue');
        
        this.updatePreview();
    }

    // 下载格式化图片
    async downloadFormattedImage() {
        try {
            // 检查必要数据
            if (!this.currentCardData) {
                alert('没有卡片数据，请重新打开格式调整界面');
                return;
            }

            // 显示加载状态
            const downloadBtn = document.querySelector('button[onclick="downloadFormattedImage()"]');
            if (!downloadBtn) {
                console.error('下载按钮未找到');
                return;
            }

            const originalText = downloadBtn.textContent;
            downloadBtn.innerHTML = '🔄 生成中...';
            downloadBtn.disabled = true;

            console.log('开始生成高质量图片...');

            // 使用高级渲染引擎
            const renderer = new AdvancedCanvasRenderer(1200, 1600);

            // 配置渲染设置 - 确保与预览使用相同参数
            const renderConfig = {
                template: this.currentSettings.template,
                colorTheme: this.currentSettings.colorTheme,
                titleFont: this.currentSettings.titleFont,
                bodyFont: this.currentSettings.bodyFont,
                fontSize: this.currentSettings.fontSize, // 与预览使用相同字体大小
                spacing: this.currentSettings.spacing, // 与预览使用相同行间距
                margin: this.currentSettings.margin // 与预览使用相同边距
            };

            console.log('渲染配置:', renderConfig);

            // 渲染高质量图片
            const imageData = await renderer.renderCard(this.currentCardData, renderConfig);

            // 下载图片
            const link = document.createElement('a');
            const filename = this.currentCardData.filename || '学习卡片';
            const templateName = this.currentSettings.template;
            const colorName = this.currentSettings.colorTheme;

            link.download = `${filename.replace('.png', '')}_${templateName}_${colorName}.png`;
            link.href = imageData;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('图片下载完成');

            // 恢复按钮状态
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;

            // 显示成功消息
            this.showSuccessMessage('🎉 图片已成功下载！');

            // 延迟关闭模态框
            setTimeout(() => {
                this.close();
            }, 2000);

        } catch (error) {
            console.error('下载图片失败:', error);

            // 显示详细错误信息
            const errorMsg = `下载失败: ${error.message}`;
            alert(errorMsg);

            // 恢复按钮状态
            const downloadBtn = document.querySelector('button[onclick="downloadFormattedImage()"]');
            if (downloadBtn) {
                downloadBtn.innerHTML = '🎨 生成并下载图片';
                downloadBtn.disabled = false;
            }
        }
    }

    // 显示成功消息
    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] transform transition-all duration-300 translate-x-full';
        successDiv.innerHTML = message;
        document.body.appendChild(successDiv);

        // 动画进入
        setTimeout(() => {
            successDiv.classList.remove('translate-x-full');
        }, 100);

        // 动画退出并移除
        setTimeout(() => {
            successDiv.classList.add('translate-x-full');
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove();
                }
            }, 300);
        }, 3000);
    }
}

// 全局实例
window.imageFormatModal = new ImageFormatModal();

// 全局函数
function openImageFormatModal(cardData) {
    // 确保渲染器已经初始化
    if (typeof AdvancedCanvasRenderer === 'undefined' || !window.advancedRenderer) {
        try {
            console.log('在打开模态框时初始化渲染器');
            window.canvasRenderer = new CanvasCardRenderer();
            window.advancedRenderer = new AdvancedCanvasRenderer();
        } catch (error) {
            console.error('无法初始化渲染器:', error);
            alert('初始化渲染器失败，请刷新页面后重试');
            return;
        }
    }
    
    window.imageFormatModal.open(cardData);
}

function closeImageFormatModal() {
    window.imageFormatModal.close();
}

function selectTemplate(template) {
    window.imageFormatModal.selectTemplate(template);
}

function selectColorTheme(theme) {
    window.imageFormatModal.selectColorTheme(theme);
}

function updatePreview() {
    window.imageFormatModal.updatePreview();
}

function resetToDefault() {
    window.imageFormatModal.resetToDefault();
}

function downloadFormattedImage() {
    window.imageFormatModal.downloadFormattedImage();
}
