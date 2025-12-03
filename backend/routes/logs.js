const express = require('express');
const { Op } = require('sequelize');
const { Log, QthEntry } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 创建参与者记录
router.post('/sessions/:session_id/logs', auth, async (req, res) => {
  try {
    const { session_id } = req.params;
    const { participant_callsign, rst_rcvd, rst_sent, radio, antenna, power, qth_text, qth_province, qth_city, qth_district } = req.body;
    
    // 创建记录
    const log = await Log.create({
      session_id,
      operator_user_id: req.user.id,
      participant_callsign,
      rst_rcvd,
      rst_sent,
      radio,
      antenna,
      power,
      qth_text,
      qth_province,
      qth_city,
      qth_district
    });
    
    res.status(201).json({ message: 'Log created successfully', log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
});

// 修改参与者记录
router.put('/sessions/:session_id/logs/:log_id', auth, async (req, res) => {
  try {
    const { session_id, log_id } = req.params;
    const { participant_callsign, rst_rcvd, rst_sent, radio, antenna, power, qth_text, qth_province, qth_city, qth_district } = req.body;
    
    // 查找记录
    const log = await Log.findOne({ where: { id: log_id, session_id } });
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    // 更新记录
    await log.update({
      participant_callsign,
      rst_rcvd,
      rst_sent,
      radio,
      antenna,
      power,
      qth_text,
      qth_province,
      qth_city,
      qth_district
    });
    
    res.json({ message: 'Log updated successfully', log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update log' });
  }
});

// 删除参与者记录
router.delete('/sessions/:session_id/logs/:log_id', auth, async (req, res) => {
  try {
    const { session_id, log_id } = req.params;
    
    // 查找记录
    const log = await Log.findOne({ where: { id: log_id, session_id } });
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    // 删除记录
    await log.destroy();
    
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// 根据呼号获取最后记录（智能填充）
router.get('/last_by_callsign/:callsign', auth, async (req, res) => {
  try {
    const { callsign } = req.params;
    
    // 查找该呼号的最后一条记录
    const lastLog = await Log.findOne({
      where: { participant_callsign: callsign },
      order: [['timestamp', 'DESC']]
    });
    
    if (lastLog) {
      res.json({
        radio: lastLog.radio,
        antenna: lastLog.antenna,
        power: lastLog.power,
        qth_text: lastLog.qth_text,
        qth_province: lastLog.qth_province,
        qth_city: lastLog.qth_city,
        qth_district: lastLog.qth_district
      });
    } else {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get last log' });
  }
});

// QTH模糊搜索
router.get('/qth/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    // 搜索QTH记录
    const qthEntries = await QthEntry.findAll({
      where: {
        [Op.or]: [
          { text: { [Op.like]: `%${query}%` } },
          { province: { [Op.like]: `%${query}%` } },
          { city: { [Op.like]: `%${query}%` } },
          { district: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 10
    });
    
    res.json(qthEntries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search QTH' });
  }
});

module.exports = router;
