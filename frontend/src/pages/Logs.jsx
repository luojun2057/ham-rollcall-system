import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  message,
  Card,
  Typography,
  DatePicker,
  AutoComplete
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AppLayout from '../components/Layout';

const { Title } = Typography;
const { Option } = Select;

const Logs = () => {
  const [form] = Form.useForm();
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const navigate = useNavigate();

  // 获取记录列表
  const fetchLogs = async () => {
    setLoading(true);
    try {
      // 这里需要根据实际API调整，目前API还没有实现获取所有记录的接口
      // 暂时使用模拟数据
      setLogs([]);
    } catch (error) {
      message.error('获取记录列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取活动列表
  const fetchSessions = async () => {
    try {
      const response = await axiosInstance.get('/sessions');
      setSessions(response.data);
    } catch (error) {
      message.error('获取活动列表失败');
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchSessions();
  }, []);

  // 打开创建/编辑模态框
  const handleOpenModal = (log = null) => {
    setCurrentLog(log);
    if (log) {
      form.setFieldsValue(log);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setCurrentLog(null);
  };

  // 智能填充：根据呼号获取历史记录
  const handleCallsignChange = async (callsign) => {
    if (!callsign) return;
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
    } catch (error) {
      console.error('智能填充失败:', error);
    }
  };

  // QTH搜索
  const handleQthSearch = async (value) => {
    if (!value) return [];
    try {
      const response = await axiosInstance.get(`/qth/search?query=${value}`);
      return response.data.map(item => ({
        value: item.text,
        label: item.text,
        province: item.province,
        city: item.city,
        district: item.district
      }));
    } catch (error) {
      console.error('QTH搜索失败:', error);
      return [];
    }
  };

  // QTH选择处理
  const handleQthSelect = (value, option) => {
    form.setFieldsValue({
      qth_text: value,
      qth_province: option.province,
      qth_city: option.city,
      qth_district: option.district
    });
  };

  // 提交表单
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (currentLog) {
        // 更新记录
        // await axiosInstance.put(`/sessions/${values.session_id}/logs/${currentLog.id}`, values);
        message.success('记录更新成功');
      } else {
        // 创建记录
        // await axiosInstance.post(`/sessions/${values.session_id}/logs`, values);
        message.success('记录创建成功');
      }
      handleCloseModal();
      fetchLogs();
    } catch (error) {
      message.error(currentLog ? '记录更新失败' : '记录创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除记录
  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后不可恢复。',
      onOk: async () => {
        setLoading(true);
        try {
          // await axiosInstance.delete(`/logs/${id}`);
          message.success('记录删除成功');
          fetchLogs();
        } catch (error) {
          message.error('记录删除失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '活动名称',
      dataIndex: 'session_title',
      key: 'session_title',
      sorter: (a, b) => a.session_title.localeCompare(b.session_title)
    },
    {
      title: '参与者呼号',
      dataIndex: 'participant_callsign',
      key: 'participant_callsign'
    },
    {
      title: '收到的信号报告',
      dataIndex: 'rst_rcvd',
      key: 'rst_rcvd'
    },
    {
      title: '发出的信号报告',
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
      title: '功率',
      dataIndex: 'power',
      key: 'power'
    },
    {
      title: 'QTH',
      dataIndex: 'qth_text',
      key: 'qth_text'
    },
    {
      title: '记录时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button 
            type="danger" 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
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
        <Title level={3} style={{ marginBottom: 24 }}>记录管理</Title>
        <Space style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => handleOpenModal()}
          >
            添加记录
          </Button>
        </Space>
        
        <Table 
          columns={columns} 
          dataSource={logs} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 创建/编辑记录模态框 */}
      <Modal
        title={currentLog ? '编辑记录' : '添加记录'}
        open={modalVisible}
        onOk={form.submit}
        onCancel={handleCloseModal}
        confirmLoading={loading}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="session_id"
            rules={[{ required: true, message: '请选择活动!' }]}
            label="活动"
          >
            <Select placeholder="请选择活动">
              {sessions.map((session) => (
                <Option key={session.id} value={session.id}>
                  {session.title} ({session.external_id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="participant_callsign"
            rules={[{ required: true, message: '请输入参与者呼号!' }]}
            label="参与者呼号"
          >
            <Input 
              placeholder="参与者呼号" 
              onChange={(e) => handleCallsignChange(e.target.value)} 
            />
          </Form.Item>

          <Form.Item
            name="rst_rcvd"
            rules={[{ required: true, message: '请输入收到的信号报告!' }]}
            label="收到的信号报告"
          >
            <Input placeholder="收到的信号报告" />
          </Form.Item>

          <Form.Item
            name="rst_sent"
            rules={[{ required: true, message: '请输入发出的信号报告!' }]}
            label="发出的信号报告"
          >
            <Input placeholder="发出的信号报告" />
          </Form.Item>

          <Form.Item
            name="radio"
            label="设备"
          >
            <Input placeholder="设备" />
          </Form.Item>

          <Form.Item
            name="antenna"
            label="天线"
          >
            <Input placeholder="天线" />
          </Form.Item>

          <Form.Item
            name="power"
            label="功率"
          >
            <Input placeholder="功率" />
          </Form.Item>

          <Form.Item
            name="qth_text"
            label="QTH"
          >
            <AutoComplete
              placeholder="输入QTH地址"
              options={[]}
              onSearch={handleQthSearch}
              onSelect={handleQthSelect}
              style={{ width: '100%' }}
            >
              <Input placeholder="QTH" />
            </AutoComplete>
          </Form.Item>

          <Form.Item
            name="qth_province"
            label="省"
          >
            <Input placeholder="省" />
          </Form.Item>

          <Form.Item
            name="qth_city"
            label="市"
          >
            <Input placeholder="市" />
          </Form.Item>

          <Form.Item
            name="qth_district"
            label="区县"
          >
            <Input placeholder="区县" />
          </Form.Item>

          <Form.Item
            name="timestamp"
            label="记录时间"
          >
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
};

export default Logs;