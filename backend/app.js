const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const { User, NetSession, Control, Log, QthEntry, SessionOperator } = require('./models');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const logRoutes = require('./routes/logs');
const importExportRoutes = require('./routes/importExport');
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

// 测试路由
app.get('/', (req, res) => {
  res.send('Ham Rollcall System API');
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
