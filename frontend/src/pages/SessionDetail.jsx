import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  message, 
  Table, 
  Progress, 
  Input,
  Modal,
  Form,
  Select
} from 'antd';
import { 
  ArrowLeftOutlined, 
  FileExcelOutlined, 
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AppLayout from '../components/Layout';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const SessionDetail = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 参与者记录表格列配置
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? '-' : date.toLocaleString();
      }
    },
    {
      title: '参与者呼号',
      dataIndex: 'participant_callsign',
      key: 'participant_callsign'
    },
    {
      title: '对方信号',
      dataIndex: 'rst_rcvd',
      key: 'rst_rcvd'
    },
    {
      title: '主控信号',
      dataIndex: 'rst_sent',
      key: 'rst_sent'
    },
    {
      title: '设备',
      dataIndex: 'radio',
      key: 'radio'
    },
    {
      title: '天线',
      dataIndex: 'antenna',
      key: 'antenna'
    },
    {
      title: '功率(W)',
      dataIndex: 'power',
      key: 'power'
    },
    {
      title: 'QTH',
      dataIndex: 'qth_text',
      key: 'qth_text'
    },
    {
      title: '录入者',
      dataIndex: 'operator_user_id',
      key: 'operator_user_id'
    },
    { title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  // 获取活动详情
  const fetchSessionDetail = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/sessions/${id}`);
      setSession(response.data);
      const logsData = response.data.logs || [];
      setLogs(logsData);
      setFilteredLogs(logsData);
    } catch {
      message.error('获取活动详情失败');
    } finally {
      setLoading(false);
    }
  };

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

  // 打开编辑模态框
  const handleEdit = (record) => {
    setCurrentLog(record);
    form.setFieldsValue(record);
    setEditModalVisible(true);
  };

  // 关闭编辑模态框
  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setCurrentLog(null);
    form.resetFields();
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await axiosInstance.put(`/sessions/${id}/logs/${currentLog.id}`, values);
      message.success('记录更新成功');
      handleEditModalClose();
      fetchSessionDetail();
    } catch (error) {
      message.error('记录更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除记录
  const handleDelete = async (logId) => {
    try {
      setDeleteLoading(true);
      await axiosInstance.delete(`/sessions/${id}/logs/${logId}`);
      message.success('记录删除成功');
      fetchSessionDetail();
    } catch (error) {
      message.error('记录删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 导出为Excel
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/sessions/${id}/export/excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeFileName = session.title.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
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
      setLoading(true);
      const response = await axiosInstance.get(`/sessions/${id}/export/adif`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeFileName = session.title.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
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

  useEffect(() => {
    fetchSessionDetail();
  }, [id]);

  if (loading && !session) {
    return <AppLayout><div>加载中...</div></AppLayout>;
  }

  if (!session) {
    return <AppLayout><div>活动不存在</div></AppLayout>;
  }

  return (
    <AppLayout>
      <Card>
        {/* 活动标题和基本信息 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/sessions')}
                style={{ marginRight: 16 }}
              >
                返回
              </Button>
              <Title level={3} style={{ margin: 0 }}>{session.title}</Title>
            </div>
            <Typography.Text type="secondary">活动ID: {session.external_id}</Typography.Text>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <strong>日期：</strong>{new Date(session.date).toLocaleDateString()}
            </div>
            <div>
              <strong>时间：</strong>{session.date.split('T')[1].substring(0, 5)}
            </div>
            <div>
              <strong>呼号：</strong>{session.net_callsign}
            </div>
            <div>
              <strong>频率：</strong>{session.tx_freq} MHz (TX) / {session.rx_freq || session.tx_freq} MHz (RX)
            </div>
          </div>
          
          {/* 进度条 */}
          <Progress percent={75} status="active" strokeColor="#108ee9" />
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>活动进度</Paragraph>
        </div>

        {/* 导出按钮 */}
        <div style={{ marginBottom: 24 }}>
          <Space style={{ width: '100%' }}>
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

        {/* 参与者记录列表 */}
        <Card title="参与者记录" size="small">
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
          />
        </Card>

        {/* 编辑记录模态框 */}
        <Modal
          title="编辑参与者记录"
          open={editModalVisible}
          onOk={handleSaveEdit}
          onCancel={handleEditModalClose}
          confirmLoading={loading}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="participant_callsign"
              label="参与者呼号"
              rules={[{ required: true, message: '请输入参与者呼号' }]}
            >
              <Input placeholder="请输入参与者呼号" />
            </Form.Item>
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Form.Item
                name="rst_rcvd"
                label="接收信号报告"
                style={{ marginBottom: 0, marginRight: 8 }}
                rules={[{ required: true, message: '请输入接收信号报告' }]}
              >
                <Input placeholder="接收信号报告" />
              </Form.Item>
              <Form.Item
                name="rst_sent"
                label="发送信号报告"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: '请输入发送信号报告' }]}
              >
                <Input placeholder="发送信号报告" />
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
            <Form.Item
              name="qth_text"
              label="QTH"
            >
              <Input placeholder="请输入QTH信息" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </AppLayout>
  );
};

export default SessionDetail;
