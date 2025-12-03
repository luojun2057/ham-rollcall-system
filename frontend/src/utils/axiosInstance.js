import axios from 'axios';
import useAuthStore from '../store/authStore';

// 使用相对路径作为baseURL，让请求经过代理转发
const axiosInstance = axios.create({
  baseURL: '/api'
});

// 请求拦截器：添加认证令牌
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 未授权，清除本地存储并跳转到登录页
      const logout = useAuthStore.getState().logout;
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
