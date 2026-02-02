// src/App.tsx (или создайте Router.tsx и импортируйте его в App.tsx)
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import DashboardScreen from './pages/DashboardScreen';
import MarketplaceScreen from './pages/MarketplaceScreen';
import CollectionScreen from './pages/CollectionScreen';
import ReferralScreen  from './pages/ReferralScreen';
import ProfileScreen  from './pages/ProfileScreen';
import BottomNav from './components/layout/BottomNav'; // Создадим его позже
import AdminDashboardScreen from './pages/AdminDashboardScreen'; // <-- Импорт

const AppContent: React.FC = () => {
  // Инициализация Telegram SDK (например, для настройки кнопки "Назад" или заголовка)
  const { tg } = useTelegram();

  useEffect(() => {
    if (tg) {
      tg.ready();
      // Здесь можно настроить заголовок приложения
      // tg.setHeaderColor(tg.themeParams.bg_color); 
    }
  }, [tg]);

  return (
    <>
      <div className="h-screen flex flex-col">
        <main className="flex-grow overflow-y-auto pb-20"> {/* pb-20 для отступа под навигацией */}
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/marketplace" element={<MarketplaceScreen />} />
            <Route path="/collection" element={<CollectionScreen />} />
            <Route path="/referral" element={<ReferralScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/admin" element={<AdminDashboardScreen />} />
          </Routes>
        </main>
        <BottomNav /> {/* Наш компонент навигации */}
      </div>
    </>
  );
};


const App: React.FC = () => {
  // Для TWA часто лучше HashRouter, если не настраивается сервер
  return (
    <BrowserRouter> 
      <AppContent />
    </BrowserRouter>
  );
}

export default App;