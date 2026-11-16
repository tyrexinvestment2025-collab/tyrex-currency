// src/pages/ProfileScreen.tsx
import React from 'react';
import { Settings, MessageSquare, LogOut, Copy, ChevronRight, Shield, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { useTelegram } from '../hooks/useTelegram';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, setLanguage, type AppLanguage } from '../i18n';
import { copyText, haptic, openLink } from '../lib/telegram';

// Ссылка на чат поддержки (например https://t.me/your_support). Без неё кнопка не показывается.
const SUPPORT_URL = (import.meta.env.VITE_SUPPORT_URL as string | undefined) || 'https://t.me/tyrex_support';

// --- Настройки: язык интерфейса ---
const SettingsBlock: React.FC = () => {
    const { t, i18n } = useTranslation('profile');
    const current = (i18n.resolvedLanguage || i18n.language) as AppLanguage;

    return (
        <div className="bg-tyrex-graphite/50 p-4 rounded-xl mb-5 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-tyrex-ultra-gold-glow"/> {t('settings.title')}
            </h3>
            <p className="text-xs text-white/60 mb-2">{t('settings.language')}</p>
            <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                        key={lang}
                        onClick={() => { haptic.tap(); setLanguage(lang); }}
                        className={clsx(
                            "flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold border transition-colors",
                            current === lang
                                ? "bg-tyrex-ultra-gold-glow text-tyrex-dark-black border-tyrex-ultra-gold-glow"
                                : "bg-tyrex-graphite/40 text-white/80 border-white/5"
                        )}
                    >
                        {current === lang && <Check className="w-3.5 h-3.5" />}
                        {LANGUAGE_LABELS[lang]}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Блок Поддержки ---
const SupportBlock: React.FC<{ tgId: string | number }> = ({ tgId }) => {
    const { t } = useTranslation('profile');

    const handleCopyCode = async () => {
        if (await copyText(String(tgId))) {
            haptic.success();
            toast.success(t('support.idCopied', { id: tgId }));
        }
    };

    return (
        <div className="bg-tyrex-graphite/50 p-4 rounded-xl mb-5 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-tyrex-ultra-gold-glow"/> {t('support.title')}
            </h3>

            <div className="space-y-3">
                <div className="text-sm text-white/80 p-3 bg-tyrex-graphite/40 rounded-lg">
                    <p>{t('support.yourId')}</p>
                    <code className="text-white font-mono break-all flex justify-between items-center mt-1">
                        {tgId}
                        <button onClick={handleCopyCode} aria-label={t('common:actions.copy')} className='text-tyrex-ultra-gold-glow ml-2 p-1 hover:bg-white/10 rounded'>
                            <Copy className='w-4 h-4'/>
                        </button>
                    </code>
                    <p className="text-xs text-white/60 mt-1">{t('support.hint')}</p>
                </div>

                {SUPPORT_URL && (
                    <button
                        onClick={() => openLink(SUPPORT_URL)}
                        className="w-full bg-purple-700 text-white py-3 rounded-lg font-bold hover:bg-purple-600 transition-colors"
                    >
                        {t('support.write')}
                    </button>
                )}
            </div>
        </div>
    );
};

const ProfileScreen: React.FC = () => {
    const { t } = useTranslation('profile');
    const { user, userProfile, onClose } = useTelegram();
    const navigate = useNavigate();

    // userProfile — с бэкенда, user — из Telegram initData
    const displayUsername = userProfile?.username || user?.username || t('unknownUser');
    const displayTgId = user?.id || userProfile?.tgId || '—';
    const displayReferralCode = userProfile?.referralCode || '—';
    const isAdmin = userProfile?.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white p-4">

            <h1 className="text-2xl font-bold mb-6 text-white pt-4">{t('title')}</h1>

            <div className="flex items-center space-x-4 bg-tyrex-graphite/50 p-4 rounded-xl mb-6 shadow-lg border border-tyrex-graphite/50">
                <div className="w-14 h-14 shrink-0 bg-tyrex-ultra-gold-glow rounded-full flex items-center justify-center text-tyrex-dark-black font-bold text-xl border-2 border-purple-700">
                    {String(displayUsername)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-lg font-bold text-tyrex-ultra-gold-glow leading-tight truncate">
                        @{displayUsername}
                    </p>
                    <p className="text-sm text-white/70 mt-1">{t('id', { id: displayTgId })}</p>
                    <div className="flex items-center mt-1">
                        <span className="text-xs text-white/50 mr-2">{t('refCode')}</span>
                        <span className="text-xs font-mono bg-white/10 px-1 rounded text-white/80">
                            {displayReferralCode}
                        </span>
                    </div>
                </div>
            </div>

            {/* Админ-панель: только для роли ADMIN (права проверяет и бэкенд) */}
            {isAdmin && (
                <div className="mb-6 animate-fade-in">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-full bg-gradient-to-r from-red-900 to-red-700 p-4 rounded-xl flex items-center justify-between shadow-lg border border-red-500/30 hover:scale-[1.02] transition-transform"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-black/30 p-2 rounded-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white text-lg">{t('admin.title')}</h3>
                                <p className="text-xs text-white/70">{t('admin.subtitle')}</p>
                            </div>
                        </div>
                        <div className="bg-white/10 p-1 rounded-full">
                           <ChevronRight className="w-5 h-5 text-white" />
                        </div>
                    </button>
                </div>
            )}

            <SettingsBlock />
            <SupportBlock tgId={displayTgId} />

            <button
                onClick={onClose}
                className="w-full bg-red-800/20 text-red-400 py-3 rounded-lg font-bold hover:bg-red-800/40 transition-colors flex items-center justify-center mt-8 border border-red-800/30"
            >
                <LogOut className="w-5 h-5 mr-2"/>
                {t('closeApp')}
            </button>

            <div className="h-24"></div>
        </div>
    );
};

export default ProfileScreen;
