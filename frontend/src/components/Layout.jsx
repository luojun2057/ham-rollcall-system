import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  DatabaseOutlined, 
  SettingOutlined,
  LogoutOutlined,
  LockOutlined
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

  // 用户信息菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

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
    },
    {
      key: 'import-export',
      icon: <DatabaseOutlined />,
      label: '数据导入导出',
      onClick: () => navigate('/import-export')
    }
  ];

  // 根据角色显示不同菜单
  if (user?.role === 'super_admin') {
    // 超级管理员显示所有菜单
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
  } else if (user?.role === 'admin') {
    // 管理员显示用户管理，但不显示系统管理
    menuItems.push(
      {
        key: 'users',
        icon: <UserOutlined />,
        label: '用户管理',
        onClick: () => navigate('/users')
      }
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529' }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>业余无线电点名系统</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Menu 
            theme="dark" 
            mode="horizontal" 
            items={menuItems} 
            style={{ flex: 1, justifyContent: 'flex-end', background: '#001529' }}
          />
          {user && (
            <>
              <div style={{ color: '#fff', marginRight: 16, fontSize: 14 }}>
                {user.username} ({user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '一般操作员'})
              </div>
              <Menu 
                theme="dark" 
                mode="horizontal" 
                items={userMenuItems} 
                style={{ background: '#001529' }}
              />
            </>
          )}
        </div>
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