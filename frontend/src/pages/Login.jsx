import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const { Title } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const onFinish = async (values) => {
    try {
      setError(null);
      await login(values.username, values.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5' 
    }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>业余无线电点名系统</Title>
        <Title level={5} style={{ textAlign: 'center', marginBottom: 24 }}>用户登录</Title>
        
        {error && (
          <Alert title="登录失败" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}
        
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
            label="用户名"
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
            label="密码"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              登录
            </Button>
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <span>还没有账号？</span>
            <Button type="link" onClick={() => navigate('/register')}>
              立即注册
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
