const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const dbModule = require('./db');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());                          // 启用CORS
app.use(morgan('dev'));                   // 日志记录
app.use(express.json());                  // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析表单数据

// 设置正确的MIME类型
const mimeTypes = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
// 添加音频文件静态服务，并设置正确的MIME类型
app.use('/data', express.static(path.join(__dirname, 'data'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

// API路由
app.use('/api', require('./routes/api'));

// 所有其他请求都返回index.html (SPA支持)
app.get('*', (req, res) => {
  // 确保不拦截API路由
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: '未找到API路径' });
  }
});

// 启动服务器
async function startServer() {
  try {
    // 先初始化数据库
    await dbModule.initDb();
    console.log('数据库初始化完成');
    
    // 然后启动服务器
    app.listen(PORT, () => {
      console.log(`服务器已启动，访问地址: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 调用启动函数
startServer(); 