import React from 'react';
import { Typography, Card, Row, Col, Button } from 'antd';
import {
  CalendarOutlined,
  DatabaseOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/Layout';

const { Title, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: '活动管理',
      description: '创建和管理业余无线电点名活动，包括活动信息、主控设备等。',
      icon: <CalendarOutlined />,
      onClick: () => navigate('/sessions')
    },
    {
      title: '数据导入导出',
      description: '支持Excel和ADIF格式的数据导入导出，方便数据管理。',
      icon: <DatabaseOutlined />,
      onClick: () => navigate('/import-export')
    },
    {
      title: '用户管理',
      description: '管理系统用户，设置不同角色和权限。',
      icon: <UserOutlined />,
      onClick: () => navigate('/users')
    },
    {
      title: '系统管理',
      description: '管理系统设置，包括备份恢复、系统配置等。',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <AppLayout>
      <Title level={2}>欢迎使用业余无线电点名记录系统</Title>
      <Paragraph>
        本系统用于管理和记录业余无线电点名活动中的参与者信息、设备信息、QTH位置等数据，
        支持活动管理、数据导入导出、用户管理和系统管理等功能。
      </Paragraph>
      
      <Title level={3} style={{ marginTop: 32 }}>功能模块</Title>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {features.map((feature, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6}>
            <Card 
              hoverable 
              title={feature.title} 
              variant="outlined"
              style={{ height: '100%', cursor: 'pointer' }}
              onClick={feature.onClick}
            >
              <div style={{ fontSize: 48, marginBottom: 16, color: '#1890ff' }}>
                {feature.icon}
              </div>
              <Paragraph>{feature.description}</Paragraph>
              <Button type="primary" onClick={(e) => {
                e.stopPropagation(); // 防止事件冒泡
                feature.onClick();
              }}>进入</Button>
            </Card>
          </Col>
        ))}
      </Row>
    </AppLayout>
  );
};

export default Home;
