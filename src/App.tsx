import { useEffect } from 'react';
import { ConfigProvider, Layout, message } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { initHPOValidator } from '@/services/hpoValidator';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SmartMatchPage } from '@/pages/SmartMatchPage';
import { ExactMatchPage } from '@/pages/ExactMatchPage';
import { HomePage } from '@/pages/HomePage';

const { Content } = Layout;

function App() {
  useEffect(() => {
    // 启动时初始化 HPO 验证器
    initHPOValidator().catch(() => {
      message.error('HPO 数据加载失败，部分功能可能不可用');
    });
  }, []);

  return (
    <BrowserRouter>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <Content style={{ flex: 1, overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<SmartMatchPage />} />
              <Route path="/exact-match" element={<ExactMatchPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
          <Footer />
        </Layout>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
