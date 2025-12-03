const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { auth, isSuperAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 获取用户列表（所有角色都可以访问，但根据角色返回不同数据）
router.get('/', auth, async (req, res) => {
  try {
    let users;
    
    if (req.user.role === 'super_admin') {
      // 超级管理员可以查看所有用户
      users = await User.findAll({ attributes: ['id', 'username', 'role', 'callsign', 'createdAt'] });
    } else if (req.user.role === 'admin') {
      // 管理员可以查看操作员和自己
      users = await User.findAll({ 
        where: { 
          [Op.or]: [
            { role: 'operator' },
            { id: req.user.id }
          ]
        },
        attributes: ['id', 'username', 'role', 'callsign', 'createdAt'] 
      });
    } else {
      // 普通操作员只能查看自己
      users = await User.findAll({ 
        where: { id: req.user.id },
        attributes: ['id', 'username', 'role', 'callsign', 'createdAt'] 
      });
    }
    
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

// 修改用户信息（根据角色判断权限）
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, callsign } = req.body;
    
    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 权限检查
    const isSelf = req.user.id == id;
    const isSuperAdmin = req.user.role === 'super_admin';
    const isAdmin = req.user.role === 'admin';
    
    // 更新用户信息
    const updates = {};
    
    // 普通用户只能更新自己的信息，不能修改角色
    if (isSelf || isSuperAdmin || (isAdmin && user.role === 'operator')) {
      if (username) updates.username = username;
      if (password) updates.password_hash = await bcrypt.hash(password, 10);
      if (req.body.callsign !== undefined) updates.callsign = req.body.callsign;
      
      // 只有超级管理员可以修改角色
      if (role && isSuperAdmin) {
        updates.role = role;
      }
      
      await user.update(updates);
      res.json({ message: 'User updated successfully', user: { id: user.id, username: user.username, role: user.role } });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 删除用户（根据角色判断权限）
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 权限检查
    const isSuperAdmin = req.user.role === 'super_admin';
    const isAdmin = req.user.role === 'admin';
    
    // 只有超级管理员可以删除所有用户，管理员只能删除普通操作员
    if (isSuperAdmin || (isAdmin && user.role === 'operator')) {
      // 删除用户
      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
