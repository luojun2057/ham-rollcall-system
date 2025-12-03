import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  Space, 
  message,
  Card,
  Typography
} from 'antd';
import dayjs from 'dayjs';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';
import AppLayout from '../components/Layout';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Sessions = () => {
  const [form] = Form.useForm();
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // 获取活动列表
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/sessions');
      setSessions(response.data);
    } catch (error) {
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data);
    } catch (error) {
      // 根据角色不同，获取用户列表可能会失败，这是预期的权限行为，不需要显示错误信息
      console.log('获取用户列表失败，可能是权限限制:', error.message);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchUsers();
  }, []);

  // 打开创建/编辑模态框
  const handleOpenModal = (session = null) => {
    setCurrentSession(session);
    if (session) {
      // 将日期字符串转换为dayjs对象，确保DatePicker组件可以正确处理
      // 处理操作员数据，从operators数组中提取用户名
      const operators = session.operators ? session.operators.map(op => op.user.username) : [];
      const sessionData = {
        ...session,
        date: session.date ? dayjs(session.date) : null,
        operators
      };
      form.setFieldsValue(sessionData);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setCurrentSession(null);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 将dayjs日期对象转换为ISO格式字符串，确保后端能正确处理
      const formattedValues = {
        ...values,
        date: values.date ? values.date.toISOString() : null
      };
      
      console.log('请求URL:', `/sessions/${currentSession?.id || ''}`);
      console.log('请求数据:', formattedValues);
      
      if (currentSession) {
        // 更新活动
        await axiosInstance.put(`/sessions/${currentSession.id}`, formattedValues);
        message.success('活动更新成功');
      } else {
        // 创建活动
        await axiosInstance.post('/sessions', formattedValues);
        message.success('活动创建成功');
      }
      handleCloseModal();
      fetchSessions();
    } catch (error) {
      message.error(currentSession ? '活动更新失败' : '活动创建失败');
      // 打印详细的错误信息，方便调试
      console.error('提交表单失败:', error);
      if (error.response) {
        // 服务器响应了错误
        console.error('错误状态码:', error.response.status);
        console.error('错误响应数据:', error.response.data);
        console.error('错误响应头:', error.response.headers);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('没有收到响应:', error.request);
      } else {
        // 请求配置出错
        console.error('请求配置出错:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 删除活动
  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个活动吗？删除后不可恢复。',
      onOk: async () => {
        setLoading(true);
        try {
          await axiosInstance.delete(`/sessions/${id}`);
          message.success('活动删除成功');
          fetchSessions();
        } catch (error) {
          message.error('活动删除失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 查看活动详情
  const handleViewDetails = (id) => {
    navigate(`/sessions/${id}`);
  };

  // 下载活动列表
  const handleDownloadSessions = async () => {
    try {
      const response = await axiosInstance.get('/sessions/export/excel', { 
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `活动列表_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('活动列表下载成功');
    } catch (error) {
      console.error('下载活动列表失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      message.error(`下载活动列表失败: ${error.response?.data?.error || error.message}`);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '活动标题',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      width: 200
    },
    {
      title: '外部ID',
      dataIndex: 'external_id',
      key: 'external_id',
      width: 100
    },
    {
      title: '活动日期',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleString(),
      width: 180
    },
    {
      title: '呼号',
      dataIndex: 'net_callsign',
      key: 'net_callsign',
      width: 100
    },
    {
      title: '频率',
      dataIndex: 'tx_freq',
      key: 'tx_freq',
      width: 100
    },
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      width: 80
    },
    {
      title: '波段',
      dataIndex: 'band',
      key: 'band',
      width: 80
    },
    {
      title: '操作员',
      dataIndex: 'operators',
      key: 'operators',
      render: (operators) => {
        // 检查operators是否存在，并且是数组
        if (!operators || !Array.isArray(operators) || operators.length === 0) {
          return '-';
        }
        
        // 处理操作员数据，获取呼号
        const operatorCallsigns = operators.map(op => {
          // 检查op是否有user属性
          if (op.user) {
            return op.user.callsign || op.user.username || op.callsign;
          } else {
            return op.callsign || '-';
          }
        }).filter(callsign => callsign !== '-').join(', ');
        
        return operatorCallsigns || '-';
      },
      width: 150
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record.id)}
            size="small"
          >
            查看
          </Button>
          <Button 
            type="default" 
            icon={<PlusOutlined />} 
            onClick={() => navigate(`/sessions/${record.id}/entry`)}
            size="small"
          >
            开始活动
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Button 
            type="danger" 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <AppLayout>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>活动管理</Title>
        <Space style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => handleOpenModal()}
          >
            创建活动
          </Button>
          <Button 
            type="default" 
            icon={<DownloadOutlined />} 
            onClick={handleDownloadSessions}
          >
            下载活动列表
          </Button>
        </Space>
        
        <Table 
          columns={columns} 
          dataSource={sessions} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 创建/编辑活动模态框 */}
      <Modal
        title={currentSession ? '编辑活动' : '创建活动'}
        open={modalVisible}
        onOk={form.submit}
        onCancel={handleCloseModal}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="external_id"
            rules={[{ required: true, message: '请输入外部ID!' }]}
            label="外部ID"
          >
            <Input placeholder="外部ID" />
          </Form.Item>

          <Form.Item
            name="title"
            rules={[{ required: true, message: '请输入活动标题!' }]}
            label="活动标题"
          >
            <Input placeholder="活动标题" />
          </Form.Item>

          <Form.Item
            name="date"
            rules={[{ required: true, message: '请选择活动日期!' }]}
            label="活动日期"
          >
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>

          <Form.Item
            name="net_callsign"
            rules={[{ required: true, message: '请输入呼号!' }]}
            label="呼号"
          >
            <Input placeholder="呼号" />
          </Form.Item>

          <Form.Item
            name="tx_freq"
            rules={[{ required: true, message: '请输入发射频率!' }]}
            label="发射频率"
          >
            <Input placeholder="发射频率" />
          </Form.Item>

          <Form.Item
            name="rx_freq"
            label="接收频率"
          >
            <Input placeholder="接收频率" />
          </Form.Item>

          <Form.Item
            name="mode"
            rules={[{ required: true, message: '请选择模式!' }]}
            label="模式"
          >
            <Select placeholder="请选择模式">
              <Option value="SSB">SSB</Option>
              <Option value="CW">CW</Option>
              <Option value="FM">FM</Option>
              <Option value="AM">AM</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="band"
            rules={[{ required: true, message: '请选择波段!' }]}
            label="波段"
          >
            <Select placeholder="请选择波段">
              <Option value="160m">160m</Option>
              <Option value="80m">80m</Option>
              <Option value="40m">40m</Option>
              <Option value="20m">20m</Option>
              <Option value="15m">15m</Option>
              <Option value="10m">10m</Option>
              <Option value="6m">6m</Option>
              <Option value="2m">2m</Option>
              <Option value="70cm">70cm</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="operators"
            label="操作员"
            rules={[{ required: true, message: '请至少选择一个操作员!' }]}
          >
            <Select
              placeholder="请选择操作员"
              mode="multiple"
              style={{ width: '100%' }}
            >
              {users.map(user => (
                <Option key={user.username} value={user.username}>
                  {user.callsign || user.username} ({user.username})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
};

export default Sessions;
