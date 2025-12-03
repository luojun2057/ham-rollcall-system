const express = require('express');
const { NetSession, Control, Log, User, SessionOperator } = require('../models');
const { auth, isAdminOrSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// 创建点名活动
router.post('/', auth, async (req, res) => {
  try {
    const { external_id, title, date, net_callsign, tx_freq, rx_freq, mode, band, operators } = req.body;
    
    // 创建活动
    const session = await NetSession.create({
      external_id,
      title,
      date,
      net_callsign,
      tx_freq,
      rx_freq,
      mode,
      band,
      created_by: req.user.id
    });
    
    // 如果有操作员信息，创建操作员关联
    if (operators && operators.length > 0) {
      // 先查找所有用户，获取他们的id和callsign
      const users = await User.findAll({
        where: { username: operators }
      });
      
      // 创建操作员关联
      const sessionOperators = users.map(user => ({
        session_id: session.id,
        user_id: user.id,
        callsign: user.callsign || user.username
      }));
      
      await SessionOperator.bulkCreate(sessionOperators);
    }
    
    res.status(201).json({ message: 'Session created successfully', session });
  } catch (error) {
    console.error('Failed to create session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// 获取活动列表
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await NetSession.findAll({
      include: [
        { model: Control, as: 'controls' },
        { model: SessionOperator, as: 'operators', include: [{ model: User, as: 'user' }] }
      ],
      order: [['date', 'DESC']]
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// 获取活动详情
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await NetSession.findByPk(id, {
      include: [
        { model: Control, as: 'controls' },
        { model: Log, as: 'logs' },
        { model: SessionOperator, as: 'operators', include: [{ model: User, as: 'user' }] }
      ]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session details' });
  }
});

// 更新活动
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { external_id, title, date, net_callsign, tx_freq, rx_freq, mode, band, operators } = req.body;
    
    // 查找活动
    const session = await NetSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // 更新活动
    await session.update({
      external_id,
      title,
      date,
      net_callsign,
      tx_freq,
      rx_freq,
      mode,
      band
    });
    
    // 更新操作员关联
    if (operators) {
      // 删除现有操作员关联
      await SessionOperator.destroy({ where: { session_id: id } });
      
      // 如果有新的操作员信息，创建新的操作员关联
      if (operators.length > 0) {
        // 先查找所有用户，获取他们的id和callsign
        const users = await User.findAll({
          where: { username: operators }
        });
        
        // 创建操作员关联
        const sessionOperators = users.map(user => ({
          session_id: session.id,
          user_id: user.id,
          callsign: user.callsign || user.username
        }));
        
        await SessionOperator.bulkCreate(sessionOperators);
      }
    }
    
    res.json({ message: 'Session updated successfully', session });
  } catch (error) {
    console.error('Failed to update session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// 删除活动
router.delete('/:id', auth, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找活动
    const session = await NetSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // 删除相关记录
    await Control.destroy({ where: { session_id: id } });
    await Log.destroy({ where: { session_id: id } });
    await SessionOperator.destroy({ where: { session_id: id } });
    
    // 删除活动
    await session.destroy();
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// 导出活动列表为Excel
router.get('/export/excel', auth, async (req, res) => {
  try {
    // 获取所有活动信息，包含操作员信息
    const sessions = await NetSession.findAll({
      include: [
        { model: SessionOperator, as: 'operators', include: [{ model: User, as: 'user' }] }
      ],
      order: [['date', 'DESC']]
    });
    
    // 准备Excel数据
    const sessionData = sessions.map(session => {
      // 处理操作员数据
      const operators = session.operators ? session.operators.map(op => op.user?.callsign || op.user?.username || op.callsign).join(', ') : '-';
      
      return {
        '活动标题': session.title,
        '外部ID': session.external_id,
        '活动日期': session.date.toLocaleString(),
        '呼号': session.net_callsign,
        '发射频率': session.tx_freq,
        '接收频率': session.rx_freq || '',
        '模式': session.mode,
        '波段': session.band,
        '操作员呼号': operators
      };
    });
    
    // 创建Excel工作簿
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sessionData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '活动列表');
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // 设置响应头
    const fileName = `活动列表_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // 发送文件
    res.send(excelBuffer);
  } catch (error) {
    console.error('Failed to export sessions:', error);
    res.status(500).json({ error: 'Failed to export sessions' });
  }
});

// 添加主控信息
router.post('/:id/controls', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { callsign, radio, antenna, power, qth_text, qth_province, qth_city, qth_district } = req.body;
    
    // 检查活动是否存在
    const session = await NetSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // 创建主控信息
    const control = await Control.create({
      session_id: id,
      callsign,
      radio,
      antenna,
      power,
      qth_text,
      qth_province,
      qth_city,
      qth_district,
      operator_user_id: req.user.id
    });
    
    res.status(201).json({ message: 'Control info added successfully', control });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add control info' });
  }
});

module.exports = router;
