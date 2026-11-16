import { create } from 'zustand';
import WebApp from '@twa-dev/sdk';
import { applyTheme, type ThemePreference } from '../theme/theme';
import { setLanguage, SUPPORTED_LANGUAGES, type AppLanguage } from '../i18n';
import i18n from '../i18n';
import { userApi } from '../api/tyrexApi';

/**
 * Настройки пользователя: язык, тема, главная валюта, скрытие баланса, онбординг.
 * Хранятся в Telegram CloudStorage (одинаково на всех устройствах) с запасным localStorage.
 */
export type MainCurrency = 'USD' | 'BTC';

export interface Prefs {
    language: AppLanguage;
    theme: ThemePreference;
    currency: MainCurrency;
    hideBalance: boolean;
    onboardingDone: boolean;
    termsAccepted: boolean;
    giftBannerDismissed: boolean;
}

interface PrefsState extends Prefs {
    loaded: boolean;
    load: () => Promise<void>;
    /** opts.sync=false — не отправлять язык на сервер (когда он пришёл с сервера) */
    set: <K extends keyof Prefs>(key: K, value: Prefs[K], opts?: { sync?: boolean }) => void;
}

const KEY = 'tyrex_prefs';

const defaults = (): Prefs => ({
    language: (i18n.language as AppLanguage) || 'en',
    theme: 'system',
    currency: 'USD',
    hideBalance: false,
    onboardingDone: false,
    termsAccepted: false,
    giftBannerDismissed: false,
});

const cloudAvailable = (): boolean => {
    try { return Boolean(WebApp?.initData) && WebApp.isVersionAtLeast('6.9'); } catch { return false; }
};

const readLocal = (): Partial<Prefs> => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
};
const writeLocal = (p: Prefs) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ } };

const readCloud = (): Promise<Partial<Prefs>> => new Promise(resolve => {
    if (!cloudAvailable()) return resolve({});
    // Клиент может не ответить (старая версия, веб-версия) — не ждём дольше 1.5 с
    setTimeout(() => resolve({}), 1500);
    try {
        WebApp.CloudStorage.getItem(KEY, (err, value) => {
            if (err || !value) return resolve({});
            try { resolve(JSON.parse(value)); } catch { resolve({}); }
        });
    } catch { resolve({}); }
});
const writeCloud = (p: Prefs) => {
    if (!cloudAvailable()) return;
    try { WebApp.CloudStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
};

const pickPrefs = (s: PrefsState): Prefs => ({
    language: s.language, theme: s.theme, currency: s.currency, hideBalance: s.hideBalance,
    onboardingDone: s.onboardingDone, termsAccepted: s.termsAccepted, giftBannerDismissed: s.giftBannerDismissed,
});

export const usePrefs = create<PrefsState>()((set, get) => ({
    ...defaults(),
    ...readLocal(),
    loaded: false,

    load: async () => {
        const cloud = await readCloud();
        const merged = { ...defaults(), ...readLocal(), ...cloud } as Prefs;
        if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(merged.language)) merged.language = 'en';
        set({ ...merged, loaded: true });
        applyTheme(merged.theme);
        if (merged.language !== i18n.language) setLanguage(merged.language);
        writeLocal(merged);
    },

    set: (key, value, opts) => {
        set({ [key]: value } as Partial<PrefsState>);
        const p = pickPrefs(get());
        writeLocal(p);
        writeCloud(p);
        if (key === 'theme') applyTheme(value as ThemePreference);
        if (key === 'language') {
            setLanguage(value as AppLanguage);
            // Язык общий для бота и приложения
            if (opts?.sync !== false) userApi.updatePrefs({ lang: value as string }).catch(() => null);
        }
    },
}));
