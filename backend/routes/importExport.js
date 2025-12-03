const express = require('express');
const { NetSession, Control, Log, QthEntry, User } = require('../models');
const { auth } = require('../middleware/auth');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage });

// 导出活动记录为Excel
router.get('/sessions/:id/export/excel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取活动信息，包含操作员用户名
    const session = await NetSession.findByPk(id, {
      include: [
        { model: Control, as: 'controls' },
        { 
          model: Log, 
          as: 'logs',
          include: [
            { 
              model: User, 
              as: 'operator',
              attributes: ['id', 'username', 'callsign']
            }
          ]
        }
      ]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // 调试日志
    console.log('Exporting session:', id, 'title:', session.title);
    
    // 准备Excel数据
    const logData = session.logs.map(log => ({
      '活动外部ID': session.external_id,
      '活动标题': session.title,
      '参与者呼号': log.participant_callsign,
      '接收信号报告': log.rst_rcvd,
      '发送信号报告': log.rst_sent,
      '设备': log.radio,
      '天线': log.antenna,
      '功率': log.power,
      '地理位置': log.qth_text,
      '省份': log.qth_province,
      '城市': log.qth_city,
      '区县': log.qth_district,
      '录入时间': log.timestamp.toLocaleString(),
      '操作员': log.operator?.callsign || log.operator?.username || log.operator_user_id
    }));
    
    // 创建Excel工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(logData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '活动记录');
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // 设置响应头，使用活动名称作为文件名
    // 移除所有特殊字符，只保留字母、数字、中文和下划线
    const safeFileName = session.title.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
    console.log('Safe filename:', safeFileName);
    
    // 使用标准的filename*=UTF-8''格式处理中文文件名
    const encodedFileName = encodeURIComponent(safeFileName);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}_export.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // 发送文件
    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
});

// 导出活动记录为ADIF
router.get('/sessions/:id/export/adif', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取活动信息
    const session = await NetSession.findByPk(id, {
      include: [
        { model: Control, as: 'controls' },
        { model: Log, as: 'logs' }
      ]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // 调试日志
    console.log('Exporting ADIF for session:', id, 'title:', session.title);
    
    // 生成ADIF内容
    let adifContent = "<ADIF_VER:5>3.1.4\r\n";
    adifContent += "<PROGRAMID:10>HamRollCall\r\n";
    adifContent += "<PROGRAMVERSION:1>1\r\n";
    adifContent += "<EOH>\r\n";
    
    // 添加每条记录
    session.logs.forEach(log => {
      adifContent += `<CALL:${log.participant_callsign.length}>${log.participant_callsign}\r\n`;
      adifContent += `<RST_RCVD:${log.rst_rcvd.length}>${log.rst_rcvd}\r\n`;
      adifContent += `<RST_SENT:${log.rst_sent.length}>${log.rst_sent}\r\n`;
      if (log.radio) adifContent += `<RIG:${log.radio.length}>${log.radio}\r\n`;
      if (log.antenna) adifContent += `<ANTENNA:${log.antenna.length}>${log.antenna}\r\n`;
      if (log.power) adifContent += `<PWR:${log.power.length}>${log.power}\r\n`;
      if (log.qth_text) adifContent += `<QTH:${log.qth_text.length}>${log.qth_text}\r\n`;
      adifContent += `<QSO_DATE:8>${log.timestamp.toISOString().split('T')[0].replace(/-/g, '')}\r\n`;
      adifContent += `<TIME_ON:6>${log.timestamp.toTimeString().substring(0, 8).replace(/:/g, '')}\r\n`;
      adifContent += `<BAND:${session.band.length}>${session.band}\r\n`;
      adifContent += `<MODE:${session.mode.length}>${session.mode}\r\n`;
      adifContent += `<FREQ:${session.tx_freq.length}>${session.tx_freq}\r\n`;
      adifContent += `<STATION_CALLSIGN:${session.net_callsign.length}>${session.net_callsign}\r\n`;
      adifContent += `<MY_RIG:${session.controls[0]?.radio?.length || 0}>${session.controls[0]?.radio || ''}\r\n`;
      adifContent += `<MY_ANTENNA:${session.controls[0]?.antenna?.length || 0}>${session.controls[0]?.antenna || ''}\r\n`;
      // 使用操作员呼号或用户名作为操作员信息
      const operatorInfo = log.operator?.callsign || log.operator?.username || log.operator_user_id;
      adifContent += `<OPERATOR:${operatorInfo.toString().length}>${operatorInfo}\r\n`;
      adifContent += `<EOV>\r\n\r\n`;
    });
    
    // 设置响应头，使用活动名称作为文件名
    // 移除所有特殊字符，只保留字母、数字、中文和下划线
    const safeFileName = session.title.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
    console.log('Safe ADIF filename:', safeFileName);
    
    // 使用标准的filename*=UTF-8''格式处理中文文件名
    const encodedFileName = encodeURIComponent(safeFileName);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}_export.adif`);
    res.setHeader('Content-Type', 'text/plain');
    
    // 发送文件
    res.send(adifContent);
  } catch (error) {
    console.error('ADIF export error:', error);
    res.status(500).json({ error: 'Failed to export ADIF' });
  }
});

// 下载导入模板
router.get('/import_template', auth, (req, res) => {
  try {
    // 创建模板数据
    const templateData = [
      {
        '参与者呼号': 'BG7NYL',
        '接收信号报告': '59',
        '发送信号报告': '59',
        '设备': 'IC-7300',
        '天线': ' dipole',
        '功率': '100W',
        '地理位置': '广东省深圳市南山区',
        '省份': '广东省',
        '城市': '深圳市',
        '区县': '南山区'
      }
    ];
    
    // 创建Excel工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '导入模板');
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // 设置响应头
    res.setHeader('Content-Disposition', 'attachment; filename=import_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // 发送文件
    res.send(excelBuffer);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ error: 'Failed to download template' });
  }
});

// 批量导入历史记录
router.post('/import_logs', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 读取Excel文件
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // 处理数据导入（这里简化处理，实际应该根据session_id关联）
    // 注意：实际应用中应该添加session_id参数来指定导入到哪个会话
    
    // 删除临时文件
    fs.unlinkSync(req.file.path);
    
    res.json({ message: 'Logs imported successfully', count: data.length });
  } catch (error) {
    console.error('Logs import error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to import logs' });
  }
});

// 导出所有活动记录
router.get('/all_sessions/export/excel', auth, async (req, res) => {
  try {
    // 获取所有活动信息，包含操作员信息和日志记录
    const sessions = await NetSession.findAll({
      include: [
        { 
          model: Log, 
          as: 'logs',
          include: [
            { 
              model: User, 
              as: 'operator',
              attributes: ['id', 'username', 'callsign']
            }
          ]
        }
      ],
      order: [['date', 'DESC']]
    });
    
    // 准备Excel数据，将所有活动的日志记录合并
    const allLogData = [];
    
    sessions.forEach(session => {
      // 确保session.logs是数组
      const logs = session.logs || [];
      
      if (logs.length > 0) {
        logs.forEach(log => {
          allLogData.push({
            '活动外部ID': session.external_id,
            '活动标题': session.title,
            '活动日期': session.date ? session.date.toLocaleString() : '',
            '呼号': session.net_callsign,
            '发射频率': session.tx_freq,
            '接收频率': session.rx_freq || '',
            '模式': session.mode,
            '波段': session.band,
            '参与者呼号': log.participant_callsign,
            '接收信号报告': log.rst_rcvd,
            '发送信号报告': log.rst_sent,
            '设备': log.radio,
            '天线': log.antenna,
            '功率': log.power,
            '地理位置': log.qth_text,
            '省份': log.qth_province,
            '城市': log.qth_city,
            '区县': log.qth_district,
            '录入时间': log.timestamp ? log.timestamp.toLocaleString() : '',
            '操作员': log.operator?.callsign || log.operator?.username || log.operator_user_id
          });
        });
      }
    });
    
    // 创建Excel工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(allLogData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '所有活动记录');
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // 设置响应头
    const fileName = `所有活动记录_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // 发送文件
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export all sessions error:', error);
    res.status(500).json({ error: 'Failed to export all sessions' });
  }
});

// 导出QTH数据
router.get('/qth/export', auth, async (req, res) => {
  try {
    // 准备QTH模板数据，包含结构化示例
    const qthTemplateData = [
      {
        '地理位置': '四川省成都市龙泉驿区',
        '省份': '四川省',
        '城市': '成都市',
        '区县': '龙泉驿区'
      },
      {
        '地理位置': '北京市朝阳区',
        '省份': '北京市',
        '城市': '北京市',
        '区县': '朝阳区'
      },
      {
        '地理位置': '上海市浦东新区张江高科技园区',
        '省份': '上海市',
        '城市': '上海市',
        '区县': '浦东新区'
      },
      {
        '地理位置': '广东省深圳市南山区科技园',
        '省份': '广东省',
        '城市': '深圳市',
        '区县': '南山区'
      },
      {
        '地理位置': '浙江省杭州市西湖区',
        '省份': '浙江省',
        '城市': '杭州市',
        '区县': '西湖区'
      },
      {
        '地理位置': '江苏省南京市玄武区',
        '省份': '江苏省',
        '城市': '南京市',
        '区县': '玄武区'
      },
      {
        '地理位置': '湖北省武汉市武昌区',
        '省份': '湖北省',
        '城市': '武汉市',
        '区县': '武昌区'
      },
      {
        '地理位置': '陕西省西安市雁塔区',
        '省份': '陕西省',
        '城市': '西安市',
        '区县': '雁塔区'
      }
    ];
    
    // 创建Excel工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(qthTemplateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'QTH数据模板');
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // 设置响应头
    res.setHeader('Content-Disposition', 'attachment; filename=qth_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // 发送文件
    res.send(excelBuffer);
  } catch (error) {
    console.error('QTH export error:', error);
    res.status(500).json({ error: 'Failed to export QTH data' });
  }
});

// 测试文件上传
router.post('/upload_test', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload test request received');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    if (!req.file) {
      console.error('No file uploaded in test');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File uploaded in test:', req.file.originalname);
    console.log('File details:', req.file);
    
    // 删除临时文件
    fs.unlinkSync(req.file.path);
    
    res.json({ message: 'File uploaded successfully', filename: req.file.originalname });
  } catch (error) {
    console.error('Upload test error:', error);
    console.error('Error stack:', error.stack);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Upload test failed', details: error.message });
  }
});

// 导入QTH数据
router.post('/qth/import', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('QTH import request received');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File uploaded:', req.file.originalname);
    console.log('File path:', req.file.path);
    
    // 读取Excel文件
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(req.file.path);
    console.log('Sheet names:', workbook.SheetNames);
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('Excel data:', data.length, 'rows');
    
    // 处理数据导入
    const qthEntries = data.map(item => ({
      text: item['地理位置'] || '',
      province: item['省份'] || '',
      city: item['城市'] || '',
      district: item['区县'] || ''
    }));
    
    console.log('QTH entries to create:', qthEntries.length);
    
    // 批量创建QTH记录
    await QthEntry.bulkCreate(qthEntries, { ignoreDuplicates: true });
    
    // 删除临时文件
    fs.unlinkSync(req.file.path);
    
    console.log('QTH import completed successfully');
    res.json({ message: 'QTH data imported successfully', count: qthEntries.length });
  } catch (error) {
    console.error('QTH import error:', error);
    console.error('Error stack:', error.stack);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to import QTH data', details: error.message });
  }
});

module.exports = router;