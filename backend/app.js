const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const { User, NetSession, Control, Log, QthEntry, SessionOperator } = require('./models');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const logRoutes = require('./routes/logs');
const importExportRoutes = require('./routes/importExport');
const backupRoutes = require('./routes/backup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', importExportRoutes);
app.use('/api', logRoutes);
app.use('/api/backup', backupRoutes);

// 配置静态文件服务
const path = require('path');
// 后端运行时，前端构建产物位于 /app/frontend/dist 目录
// 本地开发时，前端构建产物位于 ../frontend/dist 目录
const frontendDistPath = path.join(__dirname, '../frontend/dist');

// 静态文件服务 - 先检查请求是否匹配静态文件
app.use(express.static(frontendDistPath));

// 处理 SPA 路由 - 对于所有非 API 请求，返回 index.html
app.use((req, res, next) => {
  // 检查是否是 API 请求
  if (req.path.startsWith('/api')) {
    return next(); // 继续处理 API 请求
  }
  // 对于非 API 请求，返回 index.html
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// 初始化数据库并启动服务器
sequelize.sync({ force: true })
  .then(() => {
    console.log('Database connected and synced');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });
