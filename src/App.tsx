import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'; // Добавил useNavigate, useLocation
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

// Создаем отдельный компонент для логики роутинга внутри BrowserRouter
const AppContent: React.FC = () => {
  const { tg } = useTelegram();
  const navigate = useNavigate(); // Хук навигации
  const location = useLocation(); // Хук текущего пути

  const { 
    isOnboardingActive, 
    currentOnboardingStep, 
    isLastStep, 
    nextOnboardingStep, 
    finishOnboarding 
  } = useOnboarding();

  useEffect(() => {
    if (tg) {
      tg.ready();
      try { tg.expand(); } catch (e) {}
    }
  }, [tg]);

  // --- МАГИЯ ОНБОРДИНГА ---
  // Следим за текущим шагом. Если шаг требует другой страницы, переходим.
  useEffect(() => {
    if (isOnboardingActive && currentOnboardingStep) {
        // Если путь шага отличается от текущего пути
        if (currentOnboardingStep.path && location.pathname !== currentOnboardingStep.path) {
            navigate(currentOnboardingStep.path);
        }
    }
  }, [isOnboardingActive, currentOnboardingStep, navigate, location.pathname]);
  // -------------------------

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