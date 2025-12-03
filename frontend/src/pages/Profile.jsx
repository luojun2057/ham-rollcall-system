import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Form, 
  Input, 
  message
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';
import AppLayout from '../components/Layout';

const { Title, Paragraph } = Typography;

const Profile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { user, logout, initAuth } = useAuthStore();

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        callsign: user.callsign || ''
      });
    }
  }, [user, form]);

  // 保存个人信息
  const handleSave = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.put(`/users/${user.id}`, values);
      message.success('个人信息更新成功');
      setIsEditing(false);
      // 重新初始化认证状态，获取最新的用户信息
      initAuth();
    } catch (error) {
      message.error('个人信息更新失败');
      console.error('更新个人信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>个人信息</Title>
        <Paragraph>查看和修改您的个人信息，包括用户名、呼号和密码。</Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              disabled={!isEditing}
            />
          </Form.Item>

          <Form.Item
            name="callsign"
            label="呼号"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="呼号"
              disabled={!isEditing}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ min: 6, message: '密码长度不能少于6位!' }]}
            tooltip="留空则不修改密码"
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="留空则不修改密码"
              disabled={!isEditing}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            {isEditing ? (
              <>
                <Button onClick={() => setIsEditing(false)} style={{ marginRight: 8 }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                编辑个人信息
              </Button>
            )}
          </Form.Item>
        </Form>
      </Card>
    </AppLayout>
  );
};

export default Profile;