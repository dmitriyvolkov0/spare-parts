import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import 'antd/dist/reset.css';
import './app/styles/main.css';
import { AppRouter } from './app/router/AppRouter.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={ruRU}>
      <AppRouter />
    </ConfigProvider>
  </React.StrictMode>,
);
