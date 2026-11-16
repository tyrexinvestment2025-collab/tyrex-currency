import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Copy, Check, LifeBuoy, BookOpen, ShieldAlert, FileText, Lock, ShieldCheck } from 'lucide-react';
import { Page, ScreenTitle, SectionHeader, List, ListRow, Segmented, Toggle, Surface, notify } from '../ui';
import { useSession } from '../store/useSession';
import { useTelegram } from '../hooks/useTelegram';
import { usePrefs, type MainCurrency } from '../store/usePrefs';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type AppLanguage } from '../i18n';
import type { ThemePreference } from '../theme/theme';
import { useTgBackButton, nativeBackAvailable } from '../lib/tgButtons';
import { copyText, openLink } from '../lib/telegram';
import { InfoSheet, type InfoKind } from '../features/profile/InfoSheets';

const SUPPORT_URL = 'https://t.me/tyrex_support';
const APP_VERSION = '2.0.0';

/** Профиль и настройки: имя, ID, язык, тема, валюта, скрытие баланса, поддержка, условия */
const ProfileScreen: React.FC = () => {
    const { t } = useTranslation('profile2');
    const navigate = useNavigate();
    const sessionUser = useSession(s => s.user);
    const { user: tgUser } = useTelegram();
    const prefs = usePrefs();
    const [info, setInfo] = useState<InfoKind | null>(null);
    const [copied, setCopied] = useState(false);

    const goBack = () => navigate(-1);
    useTgBackButton(goBack);
    const nativeBack = nativeBackAvailable();

    const name = tgUser?.first_name || sessionUser?.username || '';
    const username = sessionUser?.username || tgUser?.username;
    const tgId = sessionUser?.tgId ?? tgUser?.id;
    const initial = (name || username || '?').slice(0, 1).toUpperCase();

    const copyId = async () => {
        if (!tgId) return;
        if (await copyText(String(tgId))) {
            setCopied(true);
            notify.success(t('idCopied'));
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Page>
            {!nativeBack && (
                <button onClick={goBack} className="flex items-center gap-1 text-body text-accent min-h-[44px] -ml-1 mt-1 active:opacity-60">
                    <ChevronLeft className="w-5 h-5" aria-hidden /> {t('back')}
                </button>
            )}
            <ScreenTitle>{t('title')}</ScreenTitle>

            <Surface className="p-4 flex items-center gap-4">
                {tgUser?.photo_url ? (
                    <img src={tgUser.photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                    <span className="w-14 h-14 rounded-full bg-raised text-fg flex items-center justify-center text-title">{initial}</span>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-headline text-fg truncate">{name || (username ? `@${username}` : '')}</p>
                    {username && name && <p className="text-callout text-muted truncate">@{username}</p>}
                    {tgId && (
                        <button onClick={copyId} className="flex items-center gap-1.5 text-callout text-muted min-h-[32px] active:opacity-60" aria-label={t('copyId')}>
                            <span className="tabular-nums">ID {tgId}</span>
                            {copied ? <Check className="w-4 h-4 text-positive" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
                        </button>
                    )}
                </div>
            </Surface>

            <SectionHeader title={t('sections.language')} />
            <List>
                {SUPPORTED_LANGUAGES.map(lang => (
                    <ListRow
                        key={lang}
                        title={LANGUAGE_LABELS[lang as AppLanguage]}
                        onClick={() => prefs.set('language', lang)}
                        value={prefs.language === lang ? <Check className="w-5 h-5 text-accent" aria-label={t('selected')} /> : undefined}
                    />
                ))}
            </List>

            <SectionHeader title={t('sections.appearance')} />
            <Surface className="p-4 space-y-4">
                <div>
                    <p className="text-callout text-muted mb-2">{t('theme.label')}</p>
                    <Segmented<ThemePreference>
                        value={prefs.theme}
                        onChange={(v) => prefs.set('theme', v)}
                        options={[
                            { value: 'system', label: t('theme.system') },
                            { value: 'light', label: t('theme.light') },
                            { value: 'dark', label: t('theme.dark') },
                        ]}
                    />
                </div>
                <div>
                    <p className="text-callout text-muted mb-2">{t('currency.label')}</p>
                    <Segmented<MainCurrency>
                        value={prefs.currency}
                        onChange={(v) => prefs.set('currency', v)}
                        options={[
                            { value: 'USD', label: t('currency.usd') },
                            { value: 'BTC', label: t('currency.btc') },
                        ]}
                    />
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-body text-fg">{t('hideBalance.label')}</p>
                        <p className="text-callout text-muted">{t('hideBalance.hint')}</p>
                    </div>
                    <Toggle checked={prefs.hideBalance} onChange={(v) => prefs.set('hideBalance', v)} label={t('hideBalance.label')} />
                </div>
            </Surface>

            <SectionHeader title={t('sections.help')} />
            <List>
                <ListRow icon={<LifeBuoy className="w-5 h-5" aria-hidden />} title={t('support')} onClick={() => openLink(SUPPORT_URL)} chevron />
                <ListRow icon={<BookOpen className="w-5 h-5" aria-hidden />} title={t('info.how.title')} onClick={() => setInfo('how')} chevron />
                <ListRow icon={<ShieldAlert className="w-5 h-5" aria-hidden />} title={t('info.risks.title')} onClick={() => setInfo('risks')} chevron />
                <ListRow icon={<FileText className="w-5 h-5" aria-hidden />} title={t('info.terms.title')} onClick={() => setInfo('terms')} chevron />
                <ListRow icon={<Lock className="w-5 h-5" aria-hidden />} title={t('info.privacy.title')} onClick={() => setInfo('privacy')} chevron />
            </List>

            {sessionUser?.role === 'ADMIN' && (
                <List className="mt-6">
                    <ListRow icon={<ShieldCheck className="w-5 h-5 text-accent" aria-hidden />} title={t('admin')} onClick={() => navigate('/admin')} chevron />
                </List>
            )}

            <p className="text-caption text-muted text-center mt-8">{t('version', { version: APP_VERSION })}</p>

            <InfoSheet kind={info} onClose={() => setInfo(null)} />
        </Page>
    );
};

export default ProfileScreen;
