import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { Loader2, ShieldAlert, Send, RefreshCw } from 'lucide-react';
import { socketService } from './api/tyrexApi';
import { useTyrexStore } from './store/useTyrexStore';
import { useSession } from './store/useSession';
import { usePrefs } from './store/usePrefs';
import { initTheme } from './theme/theme';
import { tg } from './lib/telegram';
import { useTgSettingsButton } from './lib/tgButtons';
import { syncBotAccess, startRoute } from './lib/botLink';
import { Button } from './ui';
import AppHeader from './shell/AppHeader';
import TabBar from './shell/TabBar';
import Onboarding from './features/onboarding/Onboarding';
import HomeScreen from './screens/HomeScreen';
import ShopScreen from './screens/ShopScreen';
import CardsScreen from './screens/CardsScreen';
import WalletScreen from './screens/WalletScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import PartnersScreen from './screens/PartnersScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';

/** Админка: клиентская защита (реальная проверка роли — на бэкенде) */
const AdminRoute: React.FC = () => {
  const role = useSession(s => s.user?.role);
  return role === 'ADMIN' ? <AdminScreen /> : <Navigate to="/" replace />;
};

const StatusScreen: React.FC<{ icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }> = ({ icon, title, text, action }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-bg text-fg px-8 text-center">
    {icon}
    <h1 className="text-title">{title}</h1>
    {text && <p className="text-body text-muted max-w-xs">{text}</p>}
    {action}
  </div>
);

/**
 * Связь с ботом при запуске (один раз):
 *  - экран из ссылки startapp=p_<раздел> / adm_…;
 *  - язык из профиля (его мог сменить /lang в боте);
 *  - после онбординга — часовой пояс и разрешение боту писать (с пояснением, один раз).
 */
let botLinkDone = false;
let startRouteDone = false;
const useBotLink = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('profile2');
  const user = useSession(s => s.user);
  const prefsLoaded = usePrefs(s => s.loaded);
  const onboardingDone = usePrefs(s => s.onboardingDone);

  useEffect(() => {
    if (!user || startRouteDone) return;
    startRouteDone = true;
    const route = startRoute(user.role === 'ADMIN');
    if (route) navigate(route, { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !prefsLoaded || botLinkDone) return;
    const serverLang = user.lang;
    if (serverLang && serverLang !== usePrefs.getState().language) usePrefs.getState().set('language', serverLang, { sync: false });
    if (!onboardingDone) return;
    botLinkDone = true;
    syncBotAccess(t('notifications.explain')).then(allowed => {
      if (typeof allowed === 'boolean') useSession.setState(s => (s.user ? { user: { ...s.user, canMessage: allowed || Boolean(s.user.canMessage) } } : s));
    });
  }, [user, prefsLoaded, onboardingDone, t]);
};

/** Вкладки показывают шапку и нижнюю навигацию; вложенные экраны (кошелёк, профиль, админка) — без вкладок */
const TAB_PATHS = ['/', '/shop', '/cards', '/analytics', '/partners'];

const Shell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTab = TAB_PATHS.includes(location.pathname);

  useTgSettingsButton(() => navigate('/profile'));
  useBotLink();

  // Наверх при смене экрана
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg text-fg pt-safe" style={{ ['--tabbar-h' as string]: isTab ? 'calc(57px + var(--safe-bottom))' : '0px' }}>
      {isTab && <AppHeader />}
      <main className={isTab ? 'pb-[calc(72px+var(--safe-bottom))]' : 'pb-[calc(16px+var(--safe-bottom))]'}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/cards" element={<CardsScreen />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/analytics" element={<AnalyticsScreen />} />
          <Route path="/partners" element={<PartnersScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/admin" element={<AdminRoute />} />
          {/* Старые адреса */}
          <Route path="/marketplace" element={<Navigate to="/shop" replace />} />
          <Route path="/collection" element={<Navigate to="/cards" replace />} />
          <Route path="/referral" element={<Navigate to="/partners" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {isTab && <TabBar />}
      <Onboarding />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { t } = useTranslation('common');
  const status = useSession(s => s.status);
  const init = useSession(s => s.init);
  const loadPrefs = usePrefs(s => s.load);
  const updateBtcPrice = useTyrexStore(s => s.updateBtcPrice);

  // Telegram + тема + настройки + единственный логин
  useEffect(() => {
    try { tg.ready(); tg.expand(); } catch { /* вне Telegram */ }
    initTheme(usePrefs.getState().theme);
    loadPrefs();
    init();
  }, [init, loadPrefs]);

  // Курс BTC в реальном времени
  useEffect(() => {
    socketService.connect((price) => { if (price > 0) updateBtcPrice(price); });
  }, [updateBtcPrice]);

  if (status === 'idle' || status === 'loading') {
    return <StatusScreen icon={<Loader2 className="w-8 h-8 animate-spin text-link" aria-hidden />} title={t('app.loading')} />;
  }
  if (status === 'no-telegram') {
    return <StatusScreen icon={<Send className="w-8 h-8 text-link" aria-hidden />} title={t('app.openInTelegram.title')} text={t('app.openInTelegram.text')} />;
  }
  if (status === 'banned') {
    return <StatusScreen icon={<ShieldAlert className="w-8 h-8 text-negative" aria-hidden />} title={t('app.banned.title')} text={t('app.banned.text')} />;
  }
  if (status === 'error') {
    return (
      <StatusScreen
        icon={<ShieldAlert className="w-8 h-8 text-negative" aria-hidden />}
        title={t('app.error.title')}
        text={t('app.error.text')}
        action={<Button variant="secondary" icon={<RefreshCw className="w-4 h-4" aria-hidden />} onClick={() => init()}>{t('actions.retry')}</Button>}
      />
    );
  }

  return <Shell />;
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
    <Toaster
      position="bottom-center"
      containerStyle={{ bottom: 'calc(84px + var(--safe-bottom))' }}
      toastOptions={{
        className: '!bg-raised !text-fg !rounded-control !text-callout !shadow-none border border-line',
      }}
    />
  </BrowserRouter>
);

export default App;
