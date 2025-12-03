import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const { Title } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const onFinish = async (values) => {
    try {
      setError(null);
      // 固定角色为operator
      await register(values.username, values.password, 'operator');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
        <Title level={5} style={{ textAlign: 'center', marginBottom: 24 }}>用户注册</Title>
        
        {error && (
          <Alert title="注册失败" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}
        
        <Form
          form={form}
          name="register"
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
            rules={[{ required: true, message: '请输入密码!' }, { min: 6, message: '密码长度不能少于6位!' }]}
            label="密码"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
            label="确认密码"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>



          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              注册
            </Button>
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <span>已有账号？</span>
            <Button type="link" onClick={() => navigate('/login')}>
              立即登录
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
