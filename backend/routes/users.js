const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { auth, isSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取用户列表（超级管理员）
router.get('/', auth, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'role', 'callsign', 'createdAt'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// 创建用户（超级管理员）
router.post('/', auth, isSuperAdmin, async (req, res) => {
  try {
    const { username, password, role, callsign } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await User.create({
      username,
      password_hash: hashedPassword,
      role,
      callsign: req.body.callsign || null
    });
    
    res.status(201).json({ message: 'User created successfully', user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 修改用户信息（超级管理员）
router.put('/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, callsign } = req.body;
    
    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 更新用户信息
    const updates = {};
    if (username) updates.username = username;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);
    if (role) updates.role = role;
    if (req.body.callsign !== undefined) updates.callsign = req.body.callsign;
    
    await user.update(updates);
    
    res.json({ message: 'User updated successfully', user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 删除用户（超级管理员）
router.delete('/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 删除用户
    await user.destroy();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
