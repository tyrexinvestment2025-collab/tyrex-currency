import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { Loader2, ShieldAlert, Send, RefreshCw } from 'lucide-react';
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
import { socketService } from './api/tyrexApi';
import { useTyrexStore } from './store/useTyrexStore';
import { useSession } from './store/useSession';
import { tg } from './lib/telegram';

/** Админка: клиентская защита (реальная проверка роли — на бэкенде) */
const AdminRoute: React.FC = () => {
  const role = useSession(s => s.user?.role);
  return role === 'ADMIN' ? <AdminDashboardScreen /> : <Navigate to="/" replace />;
};

const StatusScreen: React.FC<{ icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }> = ({ icon, title, text, action }) => (
  <div className="h-screen flex flex-col items-center justify-center gap-4 bg-tyrex-dark-black text-white px-8 text-center">
    {icon}
    <h1 className="text-lg font-black uppercase tracking-wide">{title}</h1>
    {text && <p className="text-sm text-white/50 max-w-xs">{text}</p>}
    {action}
  </div>
);

const AppContent: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null!);

  const status = useSession(s => s.status);
  const init = useSession(s => s.init);
  const updateBtcPrice = useTyrexStore(s => s.updateBtcPrice);

  const {
    isOnboardingActive,
    currentOnboardingStep,
    isLastStep,
    nextOnboardingStep,
    finishOnboarding
  } = useOnboarding();

  // 1. Telegram WebApp + единственный логин на всё приложение
  useEffect(() => {
    try { tg.ready(); tg.expand(); } catch { /* вне Telegram */ }
    init();
  }, [init]);

  // 2. Цена в реальном времени
  useEffect(() => {
    socketService.connect((price) => {
      if (price > 0) updateBtcPrice(price);
    });
  }, [updateBtcPrice]);

  // 3. Онбординг ведёт по экранам
  useEffect(() => {
    if (isOnboardingActive && currentOnboardingStep?.path && location.pathname !== currentOnboardingStep.path) {
      navigate(currentOnboardingStep.path);
    }
  }, [isOnboardingActive, currentOnboardingStep, navigate, location.pathname]);

  if (status === 'idle' || status === 'loading') {
    return <StatusScreen icon={<Loader2 className="w-10 h-10 animate-spin text-tyrex-ultra-gold-glow" />} title={t('app.loading')} />;
  }
  if (status === 'no-telegram') {
    return <StatusScreen icon={<Send className="w-10 h-10 text-tyrex-ultra-gold-glow" />} title={t('app.openInTelegram.title')} text={t('app.openInTelegram.text')} />;
  }
  if (status === 'banned') {
    return <StatusScreen icon={<ShieldAlert className="w-10 h-10 text-red-500" />} title={t('app.banned.title')} text={t('app.banned.text')} />;
  }
  if (status === 'error') {
    return (
      <StatusScreen
        icon={<ShieldAlert className="w-10 h-10 text-red-500" />}
        title={t('app.error.title')}
        text={t('app.error.text')}
        action={
          <button onClick={() => init()} className="mt-2 flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl text-xs font-bold uppercase active:scale-95">
            <RefreshCw className="w-4 h-4" /> {t('actions.retry')}
          </button>
        }
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-tyrex-dark-black text-white overflow-hidden pt-safe">
        <main ref={scrollContainerRef} className="flex-grow overflow-y-auto overflow-x-hidden pb-24">
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/marketplace" element={<MarketplaceScreen />} />
            <Route path="/collection" element={<CollectionScreen />} />
            <Route path="/referral" element={<ReferralScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/analytics" element={<AnalyticsScreen scrollContainerRef={scrollContainerRef} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav />

        <Toaster
          position="top-center"
          containerStyle={{ top: 'calc(var(--safe-top) + 12px)' }}
          toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 } }}
        />

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

const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
