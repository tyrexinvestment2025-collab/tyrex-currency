import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import DashboardScreen from './pages/DashboardScreen';
import MarketplaceScreen from './pages/MarketplaceScreen';
import CollectionScreen from './pages/CollectionScreen';
import ReferralScreen  from './pages/ReferralScreen';
import ProfileScreen  from './pages/ProfileScreen';
import AnalyticsScreen  from './pages/AnalyticsScreen';
import BottomNav from './components/layout/BottomNav';
import AdminDashboardScreen from './pages/AdminDashboardScreen';
import { useOnboarding } from './hooks/useOnboarding';
import OnboardingGuide from './components/onboarding/OnboardingGuide';

// Импортируем Сокет и Стор
import { socketService } from './api/tyrexApi';
import { useTyrexStore } from './store/useTyrexStore';

const AppContent: React.FC = () => {
  const { tg } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Достаем метод обновления цены из стора
  const updateBtcPrice = useTyrexStore(s => s.updateBtcPrice);

  const { 
    isOnboardingActive, 
    currentOnboardingStep, 
    isLastStep, 
    nextOnboardingStep, 
    finishOnboarding 
  } = useOnboarding();

  // 1. Инициализация Telegram WebApp
  useEffect(() => {
    if (tg) {
      tg.ready();
      try { tg.expand(); } catch (e) {}
    }
  }, [tg]);

  // 2. РЕАЛТАЙМ ЦЕНА: Подключаем WebSocket при старте приложения
  useEffect(() => {
    console.log("🔌 Инициализация WebSocket соединения...");
    socketService.connect((price) => {
        if (price > 0) {
            updateBtcPrice(price);
        }
    });

    // Отключаемся при закрытии приложения (опционально)
    return () => {
        // socketService.disconnect(); 
    };
  }, [updateBtcPrice]);

  // --- МАГИЯ ОНБОРДИНГА ---
  useEffect(() => {
    if (isOnboardingActive && currentOnboardingStep) {
        if (currentOnboardingStep.path && location.pathname !== currentOnboardingStep.path) {
            navigate(currentOnboardingStep.path);
        }
    }
  }, [isOnboardingActive, currentOnboardingStep, navigate, location.pathname]);

  return (
    <div className="h-screen flex flex-col bg-tyrex-dark-black text-white">
        <main className="flex-grow overflow-y-auto pb-20"> 
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/marketplace" element={<MarketplaceScreen />} />
            <Route path="/collection" element={<CollectionScreen />} />
            <Route path="/referral" element={<ReferralScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/admin" element={<AdminDashboardScreen />} />
            <Route path="/analytics" element={<AnalyticsScreen />} />
          </Routes>
        </main>
        
        <BottomNav />

        {isOnboardingActive && currentOnboardingStep && (
          <OnboardingGuide 
            step={currentOnboardingStep}
            isLastStep={isLastStep}
            onNext={nextOnboardingStep}
            onFinish={finishOnboarding}
          />
        )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter> 
      <AppContent />
    </BrowserRouter>
  );
}

export default App;