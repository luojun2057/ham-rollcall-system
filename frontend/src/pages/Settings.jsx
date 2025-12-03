import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  message,
  Upload,
  Row, 
  Col
} from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined,
  DatabaseOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';
import AppLayout from '../components/Layout';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // 检查用户是否为超级管理员
  React.useEffect(() => {
    if (user?.role !== 'super_admin') {
      message.error('只有超级管理员可以访问系统管理页面');
      navigate('/');
    }
  }, [user, navigate]);

  // 数据库备份
  const handleBackup = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/backup/download', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${new Date().toISOString().slice(0, 10)}.db`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('数据库备份成功');
    } catch (error) {
      message.error('数据库备份失败');
    } finally {
      setLoading(false);
    }
  };

  // 数据库恢复
  const handleRestore = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      await axiosInstance.post('/backup/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      message.success('数据库恢复成功');
      return false; // 阻止自动上传
    } catch (error) {
      message.error('数据库恢复失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>系统管理</Title>
        <Paragraph>系统管理功能包括数据库备份与恢复、系统权限控制等。</Paragraph>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {/* 数据库备份与恢复 */}
          <Col xs={24} md={12}>
            <Card title="数据库备份与恢复" variant="outlined" icon={<DatabaseOutlined />}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  onClick={handleBackup}
                  loading={loading}
                  block
                >
                  备份数据库
                </Button>
                <Paragraph style={{ margin: '16px 0 0 0' }}>将数据库备份到本地文件</Paragraph>
                
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                  <Title level={5} style={{ margin: 0 }}>恢复数据库</Title>
                  <Paragraph style={{ margin: '8px 0' }}>从本地文件恢复数据库</Paragraph>
                  <Dragger
                    name="file"
                    multiple={false}
                    beforeUpload={handleRestore}
                    accept=".db"
                    showUploadList={false}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽数据库文件到此处上传</p>
                    <p className="ant-upload-hint">
                      支持上传 .db 格式文件
                    </p>
                  </Dragger>
                </div>
              </Space>
            </Card>
          </Col>

          {/* 系统权限控制 */}
          <Col xs={24} md={12}>
            <Card title="系统权限控制" variant="outlined" icon={<LockOutlined />}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Paragraph>系统权限控制功能包括：</Paragraph>
                <ul>
                  <li>用户角色管理（已在用户管理页面实现）</li>
                  <li>接口权限控制（基于JWT令牌实现）</li>
                  <li>页面访问权限控制（基于角色实现）</li>
                </ul>
                <Button 
                  type="default" 
                  icon={<LockOutlined />} 
                  onClick={() => navigate('/users')}
                  style={{ width: '100%' }}
                >
                  前往用户管理
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </AppLayout>
  );
};

export default Settings;