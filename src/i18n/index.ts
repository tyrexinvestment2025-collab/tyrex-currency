import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import WebApp from '@twa-dev/sdk';

/**
 * Локализация: en / uk / ru.
 * Переводы лежат в src/locales/<lang>/<namespace>.json — по namespace на экран/модуль.
 * Новый файл подхватывается автоматически (import.meta.glob).
 */
export const SUPPORTED_LANGUAGES = ['en', 'uk', 'ru'] as const;
export type AppLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
    en: 'English',
    uk: 'Українська',
    ru: 'Русский',
};

const STORAGE_KEY = 'tyrex-lang';

const files = import.meta.glob('../locales/*/*.json', { eager: true }) as Record<string, { default: Record<string, unknown> }>;

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, mod] of Object.entries(files)) {
    const m = path.match(/locales\/([^/]+)\/([^/]+)\.json$/);
    if (!m) continue;
    const [, lang, ns] = m;
    (resources[lang] ||= {})[ns] = mod.default;
}

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

/** Выбор языка: сохранённый → язык Telegram → браузер → en */
const detectLanguage = (): AppLanguage => {
    const saved = safeGet(STORAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) return saved as AppLanguage;

    const candidates = [WebApp?.initDataUnsafe?.user?.language_code, navigator.language]
        .filter(Boolean)
        .map(l => String(l).toLowerCase().slice(0, 2));

    for (const c of candidates) {
        if (c === 'uk') return 'uk';
        if (c === 'ru' || c === 'be' || c === 'kk') return 'ru';
        if (c === 'en') return 'en';
    }
    return 'en';
};

i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    ns: Object.keys(resources.en || { common: {} }),
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
});

export const setLanguage = (lang: AppLanguage) => {
    safeSet(STORAGE_KEY, lang);
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
};

document.documentElement.lang = i18n.language;

/** Локаль для Intl (форматирование чисел и дат) */
export const intlLocale = (): string => {
    switch (i18n.language) {
        case 'uk': return 'uk-UA';
        case 'ru': return 'ru-RU';
        default: return 'en-US';
    }
};

export default i18n;
