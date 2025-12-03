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
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';
import AppLayout from '../components/Layout';

const { Title } = Typography;
const { Option } = Select;

const Users = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // 检查用户是否为超级管理员
  useEffect(() => {
    if (user?.role !== 'super_admin') {
      message.error('只有超级管理员可以访问用户管理页面');
      navigate('/');
    }
  }, [user, navigate]);

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchUsers();
    }
  }, [user]);

  // 打开创建/编辑模态框
  const handleOpenModal = (user = null) => {
    setCurrentUser(user);
    if (user) {
      // 复制用户对象，确保不包含密码相关字段
      const { password, password_hash, ...userData } = user;
      form.setFieldsValue(userData);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setCurrentUser(null);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (currentUser) {
        // 更新用户
        await axiosInstance.put(`/users/${currentUser.id}`, values);
        message.success('用户更新成功');
      } else {
        // 创建用户
        await axiosInstance.post('/users', values);
        message.success('用户创建成功');
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      message.error(currentUser ? '用户更新失败' : '用户创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/users/${id}`);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      message.error('用户删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username)
    },
    {
      title: '呼号',
      dataIndex: 'callsign',
      key: 'callsign',
      render: (callsign) => callsign || '-'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleMap = {
          'super_admin': '超级管理员',
          'admin': '管理员',
          'operator': '一般操作员'
        };
        return roleMap[role] || role;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => new Date(createdAt).toLocaleString()
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
          <Popconfirm
            title="确认删除"
            description="确定要删除这个用户吗？删除后不可恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="danger" 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <AppLayout>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>用户管理</Title>
        <Space style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => handleOpenModal()}
          >
            添加用户
          </Button>
        </Space>
        
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 创建/编辑用户模态框 */}
      <Modal
        title={currentUser ? '编辑用户' : '添加用户'}
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
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
            label="用户名"
          >
            <Input placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: !currentUser, message: '请输入密码!' }, { min: 6, message: '密码长度不能少于6位!' }]}
            label="密码"
            tooltip={currentUser ? '留空则不修改密码' : ''}
          >
            <Input.Password placeholder={currentUser ? '留空则不修改密码' : '密码'} />
          </Form.Item>

          <Form.Item
            name="callsign"
            label="呼号"
          >
            <Input placeholder="呼号" />
          </Form.Item>

          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择角色!' }]}
            label="角色"
          >
            <Select placeholder="请选择角色">
              <Option value="operator">一般操作员</Option>
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
};

export default Users;