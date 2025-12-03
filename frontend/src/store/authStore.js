import { create } from 'zustand';
import axiosInstance from '../utils/axiosInstance';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  // 注册
  register: async (username, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post('/register', {
        username, 
        password, 
        role
      });
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error || 'Registration failed' });
      throw error;
    }
  },

  // 登录
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post('/login', {
        username, 
        password
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error || 'Login failed' });
      throw error;
    }
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  // 初始化认证状态
  initAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      set({ token, user: JSON.parse(user) });
    }
  }
}));

export default useAuthStore;
