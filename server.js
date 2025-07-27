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

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 数据库初始化
dbModule.initDb();

// API路由
app.use('/api', require('./routes/api'));

// 所有其他请求都返回index.html (SPA支持)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，访问地址: http://localhost:${PORT}`);
}); 