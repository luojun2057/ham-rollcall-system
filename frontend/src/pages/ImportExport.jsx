import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  message,
  Upload, 
  Select,
  Row, 
  Col
} from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined,
  FileExcelOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';
import AppLayout from '../components/Layout';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const ImportExport = () => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // 获取活动列表
  const fetchSessions = async () => {
    try {
      const response = await axiosInstance.get('/sessions');
      setSessions(response.data);
    } catch (error) {
      message.error('获取活动列表失败');
    }
  };

  React.useEffect(() => {
    fetchSessions();
  }, []);

  // 导出活动记录为Excel
  const handleExportExcel = async () => {
    if (!sessionId) {
      message.error('请选择活动');
      return;
    }
    setLoading(true);
    try {
      const session = sessions.find(s => s.id === sessionId);
      const safeTitle = session.title.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
      
      const response = await axiosInstance.get(`/sessions/${sessionId}/export/excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${safeTitle}_export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Excel导出成功');
    } catch (error) {
      message.error('Excel导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出活动记录为ADIF
  const handleExportADIF = async () => {
    if (!sessionId) {
      message.error('请选择活动');
      return;
    }
    setLoading(true);
    try {
      const session = sessions.find(s => s.id === sessionId);
      const safeTitle = session.title.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
      
      const response = await axiosInstance.get(`/sessions/${sessionId}/export/adif`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${safeTitle}_export.adif`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('ADIF导出成功');
    } catch (error) {
      message.error('ADIF导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 下载导入模板
  const handleDownloadTemplate = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/import_template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('模板下载成功');
    } catch (error) {
      message.error('模板下载失败');
    } finally {
      setLoading(false);
    }
  };

  // 批量导入历史记录
  const handleImportLogs = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      // Ant Design的beforeUpload钩子直接传入file对象，不是file.file
      formData.append('file', file);
      console.log('Uploading file:', file.name);
      // 移除手动设置的Content-Type，让浏览器自动处理
      await axiosInstance.post('/import_logs', formData);
      message.success('历史记录导入成功');
      return false; // 阻止自动上传
    } catch (error) {
      message.error('历史记录导入失败');
      console.error('历史记录导入错误:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 导出QTH数据
  const handleExportQTH = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/qth/export', { 
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'qth_data.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('QTH数据导出成功');
    } catch (error) {
      message.error('QTH数据导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出所有活动记录
  const handleExportAllSessions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/all_sessions/export/excel', { 
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `所有活动记录_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('所有活动记录导出成功');
    } catch (error) {
      message.error('所有活动记录导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 导入QTH数据
  const handleImportQTH = async () => {
    if (!uploadFile) {
      message.error('请先选择文件');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      console.log('Uploading file:', uploadFile.name);
      
      // 移除手动设置的Content-Type，让浏览器自动处理
      const response = await axiosInstance.post('/qth/import', formData);
      message.success(`QTH数据导入成功，共导入${response.data.count}条记录`);
      setUploadFile(null);
    } catch (error) {
      message.error('QTH数据导入失败');
      console.error('QTH导入错误:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理文件选择
  const handleFileSelect = (file) => {
    setUploadFile(file);
    message.info(`已选择文件: ${file.name}`);
    return false; // 阻止自动上传
  };

  return (
    <AppLayout>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>数据导入导出</Title>
        <Paragraph>支持活动记录导出为Excel和ADIF格式，历史记录批量导入，QTH数据导入导出，以及导入模板下载功能。</Paragraph>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {/* 活动记录导出 */}
          <Col xs={24} md={12}>
            <Card title="活动记录导出" variant="outlined">
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Select
                  placeholder="请选择活动"
                  style={{ width: '100%' }}
                  value={sessionId}
                  onChange={setSessionId}
                >
                  {sessions.map((session) => (
                    <Option key={session.id} value={session.id}>
                      {session.title} ({session.external_id})
                    </Option>
                  ))}
                </Select>
                <Space style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    icon={<FileExcelOutlined />} 
                    onClick={handleExportExcel}
                    loading={loading}
                    disabled={!sessionId}
                    style={{ flex: 1 }}
                  >
                    导出为Excel
                  </Button>
                  <Button 
                    type="default" 
                    icon={<FileTextOutlined />} 
                    onClick={handleExportADIF}
                    loading={loading}
                    disabled={!sessionId}
                    style={{ flex: 1 }}
                  >
                    导出为ADIF
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* 历史记录批量导入 */}
          <Col xs={24} md={12}>
            <Card title="历史记录批量导入" variant="outlined">
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Dragger
                  name="file"
                  multiple={false}
                  beforeUpload={handleImportLogs}
                  accept=".xlsx, .xls"
                  showUploadList={false}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                  <p className="ant-upload-hint">
                    支持上传 .xlsx, .xls 格式文件
                  </p>
                </Dragger>
                <Button 
                  type="default" 
                  icon={<DownloadOutlined />} 
                  onClick={handleDownloadTemplate}
                  loading={loading}
                  block
                >
                  下载导入模板
                </Button>
              </Space>
            </Card>
          </Col>

          {/* QTH数据导入导出 */}
          <Col xs={24} md={12}>
            <Card title="QTH数据导入导出" variant="outlined">
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Dragger
                  name="file"
                  multiple={false}
                  beforeUpload={handleFileSelect}
                  accept=".xlsx, .xls"
                  showUploadList={false}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                  <p className="ant-upload-hint">
                    支持上传 .xlsx, .xls 格式文件
                  </p>
                  {uploadFile && (
                    <p style={{ color: '#52c41a', marginTop: 16 }}>
                      已选择文件: {uploadFile.name}
                    </p>
                  )}
                </Dragger>
                <Space style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    icon={<UploadOutlined />} 
                    onClick={handleImportQTH}
                    loading={loading}
                    disabled={!uploadFile}
                    style={{ flex: 1 }}
                  >
                    导入QTH数据
                  </Button>
                  <Button 
                    type="default" 
                    icon={<DownloadOutlined />} 
                    onClick={handleExportQTH}
                    loading={loading}
                    style={{ flex: 1 }}
                  >
                    导出QTH数据
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* 所有活动记录导出 */}
          <Col xs={24} md={12}>
            <Card title="所有活动记录导出" variant="outlined">
              <Space orientation="vertical" style={{ width: '100%' }}>
                <p>导出系统中所有活动的完整记录，包括活动基本信息和参与者详情。</p>
                <Button 
                  type="primary" 
                  icon={<FileExcelOutlined />} 
                  onClick={handleExportAllSessions}
                  loading={loading}
                  block
                >
                  导出所有活动记录
                </Button>
                <p style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
                  导出的Excel文件将包含所有活动的完整记录，包括活动外部ID、标题、日期、呼号、频率、模式、波段，以及每个参与者的呼号、信号报告、设备、天线、功率和地理位置信息。
                </p>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </AppLayout>
  );
};

export default ImportExport;