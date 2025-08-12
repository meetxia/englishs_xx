// 高级Canvas渲染引擎
class AdvancedCanvasRenderer {
    constructor(width = 1200, height = 1600) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 2;

        // 设置画布尺寸
        this.width = width;
        this.height = height;
        this.canvas.width = width * this.dpr;
        this.canvas.height = height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        // 启用高质量渲染
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // 字体管理
        this.fontLoaded = false;
        this.availableFonts = [
            "'Noto Sans SC', sans-serif",
            "'Microsoft YaHei', sans-serif",
            "'PingFang SC', sans-serif",
            "'Source Han Sans', sans-serif"
        ];

        // 渲染配置
        this.renderConfig = {
            template: 'modern',
            colorTheme: 'blue',
            titleFont: this.availableFonts[0],
            bodyFont: this.availableFonts[0],
            fontSize: 16,
            spacing: 20,
            margin: 40
        };

        this.loadFonts();
    }

    async loadFonts() {
        try {
            await document.fonts.ready;
            this.fontLoaded = true;
            console.log('字体系统已就绪');
        } catch (error) {
            console.warn('字体加载失败，使用默认字体', error);
            this.fontLoaded = true;
        }
    }

    // 获取模板配置
    getTemplateConfig(template = 'modern') {
        const templates = {
            modern: {
                name: '现代简约',
                backgroundType: 'gradient',
                titleStyle: { fontSize: 32, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center' },
                contentStyle: { fontSize: 18, lineHeight: 1.8, textAlign: 'justify' },
                decorations: ['subtle-border', 'corner-accents']
            },
            academic: {
                name: '学术风格',
                backgroundType: 'subtle',
                titleStyle: { fontSize: 28, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
                contentStyle: { fontSize: 16, lineHeight: 2.0, textAlign: 'justify' },
                decorations: ['formal-border', 'header-line']
            },
            creative: {
                name: '创意活泼',
                backgroundType: 'artistic',
                titleStyle: { fontSize: 36, fontWeight: 'bold', letterSpacing: 3, textAlign: 'center' },
                contentStyle: { fontSize: 17, lineHeight: 1.9, textAlign: 'left' },
                decorations: ['artistic-elements']
            },
            business: {
                name: '商务正式',
                backgroundType: 'professional',
                titleStyle: { fontSize: 30, fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center' },
                contentStyle: { fontSize: 16, lineHeight: 1.8, textAlign: 'justify' },
                decorations: ['professional-border']
            }
        };
        return templates[template] || templates.modern;
    }

    // 获取颜色主题配置
    getColorTheme(theme = 'blue') {
        const themes = {
            blue: {
                primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa',
                background: ['#eff6ff', '#dbeafe'], text: '#1f2937', textSecondary: '#6b7280'
            },
            green: {
                primary: '#10b981', secondary: '#047857', accent: '#34d399',
                background: ['#ecfdf5', '#d1fae5'], text: '#1f2937', textSecondary: '#6b7280'
            },
            purple: {
                primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa',
                background: ['#f3e8ff', '#e9d5ff'], text: '#1f2937', textSecondary: '#6b7280'
            },
            orange: {
                primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24',
                background: ['#fffbeb', '#fef3c7'], text: '#1f2937', textSecondary: '#6b7280'
            },
            pink: {
                primary: '#ec4899', secondary: '#be185d', accent: '#f472b6',
                background: ['#fdf2f8', '#fce7f3'], text: '#1f2937', textSecondary: '#6b7280'
            },
            gray: {
                primary: '#6b7280', secondary: '#374151', accent: '#9ca3af',
                background: ['#f9fafb', '#f3f4f6'], text: '#1f2937', textSecondary: '#6b7280'
            }
        };
        return themes[theme] || themes.blue;
    }
    
    // 渲染高级背景
    renderAdvancedBackground(templateConfig, colorTheme) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        switch(templateConfig.backgroundType) {
            case 'gradient':
                this.renderGradientBackground(colorTheme);
                break;
            case 'subtle':
                this.renderSubtleBackground(colorTheme);
                break;
            case 'artistic':
                this.renderArtisticBackground(colorTheme);
                break;
            case 'professional':
                this.renderProfessionalBackground(colorTheme);
                break;
            default:
                this.renderGradientBackground(colorTheme);
        }

        this.renderDecorations(templateConfig.decorations, colorTheme);
    }

    // 渐变背景
    renderGradientBackground(colorTheme) {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, colorTheme.background[0]);
        gradient.addColorStop(1, colorTheme.background[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    // 微妙背景
    renderSubtleBackground(colorTheme) {
        const ctx = this.ctx;
        ctx.fillStyle = colorTheme.background[0];
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = colorTheme.primary;
        for (let x = 0; x < this.width; x += 30) {
            for (let y = 0; y < this.height; y += 30) {
                if (Math.random() > 0.7) {
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
        ctx.restore();
    }

    // 艺术背景
    renderArtisticBackground(colorTheme) {
        this.renderGradientBackground(colorTheme);
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.1;

        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = i % 2 === 0 ? colorTheme.primary : colorTheme.accent;
            ctx.beginPath();
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const radius = Math.random() * 100 + 30;
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 专业背景
    renderProfessionalBackground(colorTheme) {
        const ctx = this.ctx;
        ctx.fillStyle = colorTheme.background[0];
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.strokeStyle = colorTheme.primary;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.1;

        const gridSize = 50;
        for (let x = 0; x <= this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // 渲染装饰元素
    renderDecorations(decorations, colorTheme) {
        if (!decorations) return;

        decorations.forEach(decoration => {
            switch(decoration) {
                case 'subtle-border':
                    this.renderSubtleBorder(colorTheme);
                    break;
                case 'corner-accents':
                    this.renderCornerAccents(colorTheme);
                    break;
                case 'formal-border':
                    this.renderFormalBorder(colorTheme);
                    break;
                case 'header-line':
                    this.renderHeaderLine(colorTheme);
                    break;
                case 'professional-border':
                    this.renderProfessionalBorder(colorTheme);
                    break;
            }
        });
    }

    // 微妙边框
    renderSubtleBorder(colorTheme) {
        const ctx = this.ctx;
        const margin = this.renderConfig.margin;
        ctx.save();
        ctx.strokeStyle = colorTheme.accent;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(margin, margin, this.width - margin * 2, this.height - margin * 2);
        ctx.restore();
    }

    // 角落装饰
    renderCornerAccents(colorTheme) {
        const ctx = this.ctx;
        const size = 30;
        const margin = this.renderConfig.margin;
        ctx.save();
        ctx.fillStyle = colorTheme.accent;
        ctx.globalAlpha = 0.6;

        const corners = [
            [margin, margin], [this.width - margin - size, margin],
            [margin, this.height - margin - size], [this.width - margin - size, this.height - margin - size]
        ];

        corners.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.moveTo(x, y + size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x + size, y + size);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }

    // 正式边框
    renderFormalBorder(colorTheme) {
        const ctx = this.ctx;
        const margin = this.renderConfig.margin;
        ctx.save();
        ctx.strokeStyle = colorTheme.primary;
        ctx.lineWidth = 3;
        ctx.strokeRect(margin, margin, this.width - margin * 2, this.height - margin * 2);
        ctx.strokeRect(margin + 10, margin + 10, this.width - (margin + 10) * 2, this.height - (margin + 10) * 2);
        ctx.restore();
    }

    // 标题线
    renderHeaderLine(colorTheme) {
        const ctx = this.ctx;
        const y = this.renderConfig.margin + 80;
        ctx.save();
        ctx.strokeStyle = colorTheme.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.renderConfig.margin, y);
        ctx.lineTo(this.width - this.renderConfig.margin, y);
        ctx.stroke();
        ctx.restore();
    }

    // 专业边框
    renderProfessionalBorder(colorTheme) {
        const ctx = this.ctx;
        const margin = this.renderConfig.margin;
        ctx.save();
        ctx.strokeStyle = colorTheme.secondary;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(this.width - margin, margin);
        ctx.moveTo(margin, this.height - margin);
        ctx.lineTo(this.width - margin, this.height - margin);
        ctx.stroke();
        ctx.restore();
    }

    // 高级文本渲染
    renderAdvancedText(text, x, y, style, colorTheme) {
        const ctx = this.ctx;
        ctx.save();

        const fontWeight = style.fontWeight || 'normal';
        const fontSize = style.fontSize || this.renderConfig.fontSize;
        const fontFamily = style.fontFamily || this.renderConfig.bodyFont;

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = style.color || colorTheme.text;
        ctx.textAlign = style.textAlign || 'left';

        if (style.shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
        }

        if (Array.isArray(text)) {
            const lineHeight = fontSize * (style.lineHeight || 1.5);
            text.forEach((line, index) => {
                ctx.fillText(line, x, y + index * lineHeight);
            });
        } else {
            ctx.fillText(text, x, y);
        }

        ctx.restore();
    }
    
    // 主要渲染方法
    async renderCard(cardData, config = {}) {
        // 防止输入数据无效导致报错
        if (!cardData || typeof cardData !== 'object') {
            console.error('无效的卡片数据:', cardData);
            cardData = {
                title: '示例卡片',
                content: '无法渲染请求的内容。请检查输入数据格式。',
                mode: 'story'
            };
        }

        // 合并配置
        this.renderConfig = { ...this.renderConfig, ...config };

        if (!this.fontLoaded) {
            await this.loadFonts();
        }

        try {
            const templateConfig = this.getTemplateConfig(this.renderConfig.template);
            const colorTheme = this.getColorTheme(this.renderConfig.colorTheme);

            this.renderAdvancedBackground(templateConfig, colorTheme);
            this.renderTitle(cardData.title || '学习卡片', templateConfig, colorTheme);
            this.renderContent(cardData, templateConfig, colorTheme);
        } catch (error) {
            console.error('渲染卡片时出错:', error);
            
            // 在Canvas上显示错误信息
            this.ctx.fillStyle = '#fef2f2';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#dc2626';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('渲染出错', this.width / 2, this.height / 2 - 20);
            
            this.ctx.font = '16px Arial';
            this.ctx.fillText(error.message, this.width / 2, this.height / 2 + 20);
        }

        return this.canvas.toDataURL('image/png', 1.0);
    }

    // 渲染标题
    renderTitle(title, templateConfig, colorTheme) {
        const titleStyle = {
            ...templateConfig.titleStyle,
            fontFamily: this.renderConfig.titleFont,
            color: colorTheme.primary,
            shadow: true
        };

        const x = titleStyle.textAlign === 'center' ? this.width / 2 : this.renderConfig.margin;
        const y = this.renderConfig.margin + titleStyle.fontSize;

        this.renderAdvancedText(title, x, y, titleStyle, colorTheme);
    }

    // 渲染内容
    renderContent(cardData, templateConfig, colorTheme) {
        const contentStyle = {
            ...templateConfig.contentStyle,
            fontFamily: this.renderConfig.bodyFont,
            color: colorTheme.text
        };

        const startY = this.renderConfig.margin + 120;
        const contentWidth = this.width - this.renderConfig.margin * 2;

        try {
            switch(cardData.mode) {
                case 'vocab':
                    this.renderVocabContent(cardData.content, startY, contentWidth, contentStyle, colorTheme);
                    break;
                case 'test':
                    this.renderTestContent(cardData.content, startY, contentWidth, contentStyle, colorTheme);
                    break;
                default:
                    this.renderStoryContent(cardData.content || '', startY, contentWidth, contentStyle, colorTheme);
            }
        } catch (error) {
            console.error(`渲染${cardData.mode}内容时出错:`, error);
            
            // 显示简单的错误信息
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#dc2626';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`内容渲染失败: ${error.message}`, this.width / 2, startY + 50);
        }

        // 添加页脚
        this.renderFooter(colorTheme);
    }

    // 渲染故事内容
    renderStoryContent(content, startY, width, style, colorTheme) {
        const lines = this.wrapText(content, width, style);
        const lineHeight = style.fontSize * style.lineHeight;

        lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            if (line.includes('(') && line.includes(')')) {
                this.renderHighlightedLine(line, this.renderConfig.margin, y, style, colorTheme);
            } else {
                this.renderAdvancedText(line, this.renderConfig.margin, y, style, colorTheme);
            }
        });
    }

    // 渲染高亮行
    renderHighlightedLine(line, x, y, style, colorTheme) {
        const ctx = this.ctx;
        const parts = line.split(/(\([^)]+\))/);
        let currentX = x;

        ctx.save();
        ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily}`;

        parts.forEach(part => {
            if (part.startsWith('(') && part.endsWith(')')) {
                ctx.fillStyle = colorTheme.secondary;
                ctx.fillText(part, currentX, y);
                currentX += ctx.measureText(part).width;
            } else {
                ctx.fillStyle = style.color;
                ctx.fillText(part, currentX, y);
                currentX += ctx.measureText(part).width;
            }
        });

        ctx.restore();
    }
    
    // 渲染单词列表内容
    renderVocabContent(content, startY, width, style, colorTheme) {
        const vocabLines = content.split('\n').filter(line => line.trim());
        const lineHeight = style.fontSize + this.renderConfig.spacing + 10;

        vocabLines.forEach((line, index) => {
            const [word, meaning] = line.split(':').map(s => s.trim());
            const y = startY + index * lineHeight;

            // 绘制英文单词
            const ctx = this.ctx;
            ctx.save();
            ctx.font = `bold ${style.fontSize + 2}px ${style.fontFamily}`;
            ctx.fillStyle = colorTheme.primary;
            ctx.textAlign = 'left';
            ctx.fillText(word, this.renderConfig.margin, y);

            // 绘制中文释义
            ctx.font = `${style.fontSize}px ${style.fontFamily}`;
            ctx.fillStyle = colorTheme.textSecondary;
            ctx.fillText(meaning, this.renderConfig.margin + 150, y);

            // 绘制分隔线
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.renderConfig.margin, y + 10);
            ctx.lineTo(width - this.renderConfig.margin, y + 10);
            ctx.stroke();
            ctx.restore();
        });
    }

    // 渲染测试内容
    renderTestContent(content, startY, width, style, colorTheme) {
        // 将填空替换为下划线
        const testContent = content.replace(/\[.*?\]/g, '_______');
        const lines = this.wrapText(testContent, width, style);
        const lineHeight = style.fontSize * style.lineHeight;

        lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            this.renderAdvancedText(line, this.renderConfig.margin, y, style, colorTheme);
        });
    }

    // 文本换行
    wrapText(text, maxWidth, style) {
        const ctx = this.ctx;
        ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily}`;

        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        lines.push(currentLine);
        return lines;
    }

    // 添加页脚方法
    renderFooter(colorTheme) {
        const footerText = '爽文带背单词卡片生成器';
        const footerY = this.height - 40;
        
        this.ctx.font = '14px "Noto Sans SC", Arial, sans-serif';
        this.ctx.fillStyle = colorTheme.textSecondary || '#6b7280';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(footerText, this.width / 2, footerY);
        
        // 添加日期
        const date = new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        
        this.ctx.font = '12px Arial, sans-serif';
        this.ctx.fillText(date, this.width / 2, footerY + 20);
    }

    // 下载卡片
    async downloadCard(filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL('image/png', 1.0);
        link.click();
    }
}

// 保持向后兼容性
class CanvasCardRenderer extends AdvancedCanvasRenderer {
    constructor(width, height) {
        super(width, height);
    }

    // 保持原有接口
    async renderStoryCard(story, words, mode) {
        const cardData = {
            title: this.getModeTitle(mode),
            content: story,
            mode: mode,
            words: words
        };

        return await this.renderCard(cardData);
    }

    getModeTitle(mode) {
        const titles = {
            'story': '模式一：爽文带背',
            'bilingual': '模式二：中英对照',
            'vocab': '模式三：单词列表',
            'test': '模式四：填空测试'
        };
        return titles[mode] || '学习卡片';
    }
}

// 确保先加载字体再初始化实例
document.addEventListener('DOMContentLoaded', () => {
    // 确认字体加载完成
    document.fonts.ready.then(() => {
        console.log('字体已加载，初始化渲染器实例');
        // 全局实例
        window.canvasRenderer = new CanvasCardRenderer();
        window.advancedRenderer = new AdvancedCanvasRenderer();
    }).catch(error => {
        console.warn('字体加载出现问题，但仍继续初始化渲染器实例', error);
        // 即使字体加载失败，也创建实例
        window.canvasRenderer = new CanvasCardRenderer();
        window.advancedRenderer = new AdvancedCanvasRenderer();
    });
}); 