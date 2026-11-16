import WebApp from '@twa-dev/sdk';

/**
 * Палитра «Ночное золото».
 * Золото и фиолетовый на глубоком синем (тёмная тема) / на светлом сине-сером (светлая).
 * Правило: золото — только заливкой с тёмным текстом (кнопки, активные элементы, графики Tyrex).
 * Текстовый акцент (ссылки, иконки, активная вкладка) — токен link: золото в тёмной теме,
 * фиолетовый в светлой, чтобы золото на белом не превращалось в коричневый.
 * Графики: chart — золото, в светлой теме чуть темнее (контраст ≥ 3:1 к белому).
 *
 * Из Telegram берём только схему (светлая/тёмная), цвета — фирменные.
 * Всё пишется в CSS-переменные --c-<token> в формате "R G B",
 * Tailwind читает их через rgb(var(--c-x) / alpha).
 */
export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

type Tokens = Record<
    'bg' | 'surface' | 'raised' | 'border' | 'text' | 'text-secondary' |
    'accent' | 'on-accent' | 'link' | 'violet' | 'chart' | 'positive' | 'negative' | 'info',
    string
>;

export const PALETTE: Record<ColorScheme, Tokens> = {
    dark: {
        bg: '#0B1026', surface: '#151B3A', raised: '#1E2649', border: '#2A335E',
        text: '#EEF0FA', 'text-secondary': '#A0A7CC',
        accent: '#F5B94A', 'on-accent': '#1A1203',
        link: '#F5C463', violet: '#9D8CFF', chart: '#F5B94A',
        positive: '#3DD68C', negative: '#FF7A7A', info: '#6CB2FF',
    },
    light: {
        bg: '#F3F4FA', surface: '#FFFFFF', raised: '#E9ECF7', border: '#DDE0EE',
        text: '#121636', 'text-secondary': '#585E86',
        accent: '#F2B33D', 'on-accent': '#1A1203',
        link: '#5A43D1', violet: '#6E58E8', chart: '#C98A12',
        positive: '#0F7A46', negative: '#C42B2B', info: '#1D5FC4',
    },
};

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

const hexToRgb = (hex: string): string | null => {
    const m = hex.trim().match(HEX_RE);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/**
 * Схема Telegram. telegram-web-app.js отдаёт colorScheme = 'light' по умолчанию,
 * даже если клиент не передал тему (так бывает в Telegram Web) — тогда верим системе.
 */
const tgScheme = (): ColorScheme => {
    try {
        const passed = Boolean(WebApp?.themeParams?.bg_color);
        if (passed && (WebApp.colorScheme === 'light' || WebApp.colorScheme === 'dark')) return WebApp.colorScheme;
    } catch { /* вне Telegram */ }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

let preference: ThemePreference = 'system';

export const resolveScheme = (pref: ThemePreference = preference): ColorScheme =>
    pref === 'system' ? tgScheme() : pref;

/** Применить тему: токены в CSS-переменные + цвета шапки/низа Telegram */
export const applyTheme = (pref: ThemePreference = preference) => {
    preference = pref;
    const scheme = resolveScheme(pref);
    const tokens = PALETTE[scheme];

    const root = document.documentElement;
    for (const [k, v] of Object.entries(tokens)) {
        const rgb = hexToRgb(v);
        if (rgb) root.style.setProperty(`--c-${k}`, rgb);
    }
    root.dataset.theme = scheme;
    root.style.colorScheme = scheme;

    // Шапка и нижняя панель Telegram сливаются с экраном
    try {
        if (WebApp.isVersionAtLeast('6.1')) {
            WebApp.setHeaderColor(tokens.bg as `#${string}`);
            WebApp.setBackgroundColor(tokens.bg as `#${string}`);
        }
        if (WebApp.isVersionAtLeast('7.10')) WebApp.setBottomBarColor(tokens.bg as `#${string}`);
    } catch { /* старый клиент или вне Telegram */ }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tokens.bg);
    window.dispatchEvent(new Event('tyrex:theme'));
};

let listening = false;

/** Подписка на смену темы Telegram/системы — без перезапуска приложения */
export const initTheme = (pref: ThemePreference = 'system') => {
    applyTheme(pref);
    if (listening) return;
    listening = true;
    try { WebApp.onEvent('themeChanged', () => applyTheme()); } catch { /* ignore */ }
    window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => applyTheme());
};
