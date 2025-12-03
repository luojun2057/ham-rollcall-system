import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  message, 
  Select, 
  Spin, 
  Table
} from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
  FileExcelOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';
import AppLayout from '../components/Layout';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const SessionEntry = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [qthSearchResults, setQthSearchResults] = useState([]);
  const [showQthSearch, setShowQthSearch] = useState(false);
  const [qthSearchQuery, setQthSearchQuery] = useState('');
  const qthSearchRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  // 表格列定义
  const columns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: (text) => {
      const date = new Date(text);
      return isNaN(date.getTime()) ? '-' : date.toLocaleString();
    } },
    { title: '呼号', dataIndex: 'participant_callsign', key: 'participant_callsign' },
    { title: '接收信号', dataIndex: 'rst_rcvd', key: 'rst_rcvd' },
    { title: '发送信号', dataIndex: 'rst_sent', key: 'rst_sent' },
    { title: '设备', dataIndex: 'radio', key: 'radio' },
    { title: '天线', dataIndex: 'antenna', key: 'antenna' },
    { title: '功率', dataIndex: 'power', key: 'power' },
    { title: 'QTH', dataIndex: 'qth_text', key: 'qth_text' }
  ];

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value);
    if (value) {
      const filtered = logs.filter(log => 
        log.participant_callsign.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  };

  // 根据呼号获取历史数据
  const fetchLastLogByCallsign = async (callsign) => {
    try {
      const response = await axiosInstance.get(`/last_by_callsign/${callsign}`);
      if (response.data) {
        form.setFieldsValue({
          radio: response.data.radio,
          antenna: response.data.antenna,
          power: response.data.power,
          qth_text: response.data.qth_text,
          qth_province: response.data.qth_province,
          qth_city: response.data.qth_city,
          qth_district: response.data.qth_district
        });
      }
    } catch {
      // 不显示错误信息，静默处理
    }
  };

  // QTH搜索
  const handleQthSearch = async (value) => {
    setQthSearchQuery(value);
    if (value.length > 1) {
      try {
        const response = await axiosInstance.get(`/qth/search?query=${encodeURIComponent(value)}`);
        setQthSearchResults(response.data);
        setShowQthSearch(true);
      } catch {
        message.error('QTH搜索失败');
      }
    } else {
      setQthSearchResults([]);
      setShowQthSearch(false);
    }
  };

  // 获取会话信息和参与者记录
  const fetchSession = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/sessions/${id}`);
      setSession(response.data);
      setLogs(response.data.logs || []);
      setFilteredLogs(response.data.logs || []);
    } catch {
      message.error('获取会话信息失败');
      // 即使获取失败，也要确保session有默认值，避免组件崩溃
      setSession({ title: '未知活动', external_id: id });
    }
  }, [id]);

  // 选择QTH结果
  const handleQthSelect = useCallback((qth) => {
    form.setFieldsValue({
      qth_text: qth.text,
      qth_province: qth.province,
      qth_city: qth.city,
      qth_district: qth.district
    });
    setShowQthSearch(false);
    setQthSearchQuery(qth.text);
  }, [form]);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await axiosInstance.post(`/sessions/${id}/logs`, values);
      
      message.success('记录添加成功');
      form.resetFields();
      
      // 重新获取参与者记录，更新表格
      fetchSession();
      
      // 聚焦呼号输入框，方便连续输入
      const callsignField = document.querySelector('input[name="participant_callsign"]');
      if (callsignField) {
        callsignField.focus();
      }
    } catch {
      message.error('记录添加失败');
    } finally {
      setLoading(false);
    }
  }, [form, id, fetchSession]);

  useEffect(() => {
    fetchSession();
    
    // 键盘事件监听
    const handleKeyDown = (e) => {
      // Ctrl + Enter 提交表单
      if (e.ctrlKey && e.key === 'Enter') {
        handleSubmit();
      }
      // Esc 清空表单
      if (e.key === 'Escape') {
        form.resetFields();
      }
      // F1 提交表单
      if (e.key === 'F1') {
        e.preventDefault();
        handleSubmit();
      }
      // F2 聚焦呼号输入框
      if (e.key === 'F2') {
        e.preventDefault();
        const callsignField = document.querySelector('input[name="participant_callsign"]');
        if (callsignField) {
          callsignField.focus();
        }
      }
      // QTH搜索时回车选择第一个
      if (e.key === 'Enter' && showQthSearch && qthSearchResults.length > 0) {
        e.preventDefault();
        handleQthSelect(qthSearchResults[0]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchSession, handleSubmit, handleQthSelect, showQthSearch, qthSearchResults, form]);
  
  // 导出为Excel
  const handleExportExcel = async () => {
    try {
      if (!session) {
        message.error('无法导出，活动信息未加载');
        return;
      }
      setLoading(true);
      const response = await axiosInstance.get(`/sessions/${id}/export/excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeFileName = (session.title || `活动${id}`).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
      link.setAttribute('download', `${safeFileName}_export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Excel导出成功');
    } catch {
      message.error('Excel导出失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 导出为ADIF
  const handleExportADIF = async () => {
    try {
      if (!session) {
        message.error('无法导出，活动信息未加载');
        return;
      }
      setLoading(true);
      const response = await axiosInstance.get(`/sessions/${id}/export/adif`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeFileName = (session.title || `活动${id}`).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
      link.setAttribute('download', `${safeFileName}_export.adif`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('ADIF导出成功');
    } catch {
      message.error('ADIF导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 监听呼号输入变化
  const handleCallsignChange = (value) => {
    if (value) {
      fetchLastLogByCallsign(value);
    }
  };

  if (!session) {
    return (
      <AppLayout>
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Card>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Title level={3} style={{ margin: 0 }}>
              <ArrowLeftOutlined onClick={handleBack} style={{ cursor: 'pointer', marginRight: 8 }} />
              {session.title} - 会话录入
            </Title>
            <Typography.Text type="secondary">活动ID: {session.external_id}</Typography.Text>
          </div>
          
          <Paragraph>
            欢迎回来，{user.username}！请使用表单录入参与者信息。
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              name="participant_callsign"
              label="参与者呼号"
              rules={[{ required: true, message: '请输入参与者呼号' }]}
            >
              <Input 
                placeholder="请输入参与者呼号" 
                onChange={(e) => handleCallsignChange(e.target.value)}
                onInput={(e) => {
                  // 自动转换为大写
                  e.target.value = e.target.value.toUpperCase();
                  // 更新表单值
                  form.setFieldsValue({ participant_callsign: e.target.value });
                  // 调用原有逻辑
                  handleCallsignChange(e.target.value);
                }}
                autoFocus
              />
            </Form.Item>

            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Form.Item
                name="rst_rcvd"
                label="接收信号报告"
                style={{ marginBottom: 0, marginRight: 8 }}
                rules={[{ required: true, message: '请输入接收信号报告' }]}
                initialValue="59"
              >
                <Input placeholder="59" style={{ width: 80 }} />
              </Form.Item>

              <Form.Item
                name="rst_sent"
                label="发送信号报告"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: '请输入发送信号报告' }]}
                initialValue="59"
              >
                <Input placeholder="59" style={{ width: 80 }} />
              </Form.Item>
            </Space.Compact>

            <Form.Item
              name="radio"
              label="设备"
            >
              <Input placeholder="请输入设备信息" />
            </Form.Item>

            <Form.Item
              name="antenna"
              label="天线"
            >
              <Input placeholder="请输入天线信息" />
            </Form.Item>

            <Form.Item
              name="power"
              label="功率"
            >
              <Input placeholder="请输入功率信息" />
            </Form.Item>

            <div style={{ position: 'relative' }}>
              <Form.Item
                name="qth_text"
                label="QTH"
              >
                <Search
                  placeholder="请输入QTH或搜索"
                  allowClear
                  enterButton={<SearchOutlined />}
                  onSearch={handleQthSearch}
                  onChange={(e) => handleQthSearch(e.target.value)}
                  value={qthSearchQuery}
                />
              </Form.Item>
              
              {showQthSearch && qthSearchResults.length > 0 && (
                <div 
                  ref={qthSearchRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  {qthSearchResults.map((qth, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        borderBottom: index < qthSearchResults.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                      onClick={() => handleQthSelect(qth)}
                    >
                      <div>{qth.text}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {qth.province} {qth.city} {qth.district}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ flex: 1 }}
                >
                  录入 (F1)
                </Button>
                <Button 
                  onClick={handleBack}
                >
                  返回
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {/* 导出按钮 */}
          <div style={{ marginTop: 24 }}>
            <Space style={{ width: '100%', maxWidth: 600 }}>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />} 
                onClick={handleExportExcel}
                loading={loading}
                style={{ flex: 1 }}
              >
                导出为Excel
              </Button>
              <Button 
                type="default" 
                icon={<FileTextOutlined />} 
                onClick={handleExportADIF}
                loading={loading}
                style={{ flex: 1 }}
              >
                导出为ADIF
              </Button>
            </Space>
          </div>

          {/* 参与者记录 */}
          <div style={{ marginTop: 24 }}>
            <Title level={4}>参与者记录</Title>
            <div style={{ marginBottom: 16 }}>
              <Search
                placeholder="通过呼号搜索参与者"
                allowClear
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                onSearch={handleSearch}
              />
            </div>
            <Table 
              columns={columns} 
              dataSource={filteredLogs} 
              rowKey="id"
              pagination={false}
              scroll={{ y: 400 }}
              style={{ maxWidth: '100%' }}
            />
          </div>
        </Space>
      </Card>
    </AppLayout>
  );
};

export default SessionEntry;