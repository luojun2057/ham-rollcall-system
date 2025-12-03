import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import useAuthStore from './store/authStore';
import './App.css';

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    // 初始化认证状态，从localStorage恢复登录信息
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
