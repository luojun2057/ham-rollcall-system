import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  DatabaseOutlined, 
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    {
      key: 'sessions',
      icon: <CalendarOutlined />,
      label: '活动管理',
      onClick: () => navigate('/sessions')
    }
  ];

  // 管理员和超级管理员显示用户管理和系统管理
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    menuItems.push(
      {
        key: 'users',
        icon: <UserOutlined />,
        label: '用户管理',
        onClick: () => navigate('/users')
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '系统管理',
        onClick: () => navigate('/settings')
      }
    );
  }

  menuItems.push(
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529' }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>业余无线电点名系统</div>
        <Menu 
          theme="dark" 
          mode="horizontal" 
          items={menuItems} 
          style={{ flex: 1, justifyContent: 'flex-end', background: '#001529' }}
        />
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 24, marginBottom: 24 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: 280 }}>
          {children}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        业余无线电点名记录系统 ©{new Date().getFullYear()} Created by BG8AMG
      </Footer>
    </Layout>
  );
};

export default AppLayout;