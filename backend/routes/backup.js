const express = require('express');
const fs = require('fs');
const path = require('path');
const { auth, isSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// 数据库备份 - 下载数据库文件
router.get('/download', auth, isSuperAdmin, (req, res) => {
  try {
    // 记录请求信息
    console.log('Backup request received:', req.method, req.url);
    console.log('Request headers:', req.headers);
    
    // 使用项目根目录下的data目录作为数据库文件路径
    const projectRoot = path.resolve(__dirname, '../..'); // 从backend/routes到项目根目录
    const dbPath = path.join(projectRoot, process.env.DB_NAME);
    
    console.log('Using absolute database path:', dbPath);
    
    // 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
      console.error('Database file not found at absolute path:', dbPath);
      return res.status(404).json({ error: 'Database file not found' });
    }
    
    console.log('Database file found, size:', fs.statSync(dbPath).size, 'bytes');
    
    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename=ham_rollcall.db`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', fs.statSync(dbPath).size);
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log('Response headers set, starting file stream');
    
    // 读取并发送数据库文件
    const fileStream = fs.createReadStream(dbPath);
    
    fileStream.on('open', () => {
      console.log('File stream opened successfully');
    });
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read database file' });
      }
    });
    
    fileStream.on('data', (chunk) => {
      console.log('Sent chunk of', chunk.length, 'bytes');
    });
    
    fileStream.on('end', () => {
      console.log('Database download completed successfully');
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Backup error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to backup database' });
    }
  }
});

// 数据库恢复 - 上传数据库文件
router.post('/restore', auth, isSuperAdmin, (req, res) => {
  try {
    // 由于没有使用multer等中间件处理文件上传，这里需要简化实现
    // 实际项目中应该使用multer或类似中间件处理文件上传
    res.status(501).json({ error: 'Database restore functionality not fully implemented' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore database' });
  }
});

module.exports = router;
