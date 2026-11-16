import WebApp from '@twa-dev/sdk';

/**
 * Палитра «Ночное золото» — токены из документа «Tyrex — концепция редизайна» (палитра A, уточнённая).
 * Золото и фиолетовый на глубоком синем (тёмная) / на тёплом светлом (светлая).
 * Правила:
 *  - золото (accent → accent-2) — только заливкой с тёмным текстом: главная кнопка, активная вкладка, Tyrex на графиках;
 *  - фиолетовый (violet, он же link) — второй акцент: ссылки, партнёры, сравниваемый актив;
 *  - бирюзовый (third) — рынок и курс BTC;
 *  - зелёный/красный — только знак изменения и статусы, не серии графиков;
 *  - градиент и свечение — только у карточки баланса (hero-*) и главной кнопки.
 *
 * Из Telegram берём только схему (светлая/тёмная), цвета — фирменные.
 * Всё пишется в CSS-переменные --c-<token> в формате "R G B",
 * Tailwind читает их через rgb(var(--c-x) / alpha).
 */
export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

type Tokens = Record<
    'bg' | 'surface' | 'raised' | 'border' | 'text' | 'text-secondary' |
    'accent' | 'accent-2' | 'on-accent' | 'link' | 'violet' | 'third' | 'chart' |
    'positive' | 'negative' | 'info' | 'hero-from' | 'hero-to' | 'hero-glow',
    string
>;

export const PALETTE: Record<ColorScheme, Tokens> = {
    dark: {
        bg: '#0B0E17', surface: '#141A29', raised: '#1C2336', border: '#262E44',
        text: '#F3F5FA', 'text-secondary': '#A3ACC2',
        accent: '#F5B83D', 'accent-2': '#FFD978', 'on-accent': '#1A1200',
        link: '#9686FF', violet: '#9686FF', third: '#3DD6F5', chart: '#F5B83D',
        positive: '#3DDC97', negative: '#FF5D73', info: '#6CB2FF',
        'hero-from': '#1F2740', 'hero-to': '#141A29', 'hero-glow': '#F5B83D',
    },
    light: {
        bg: '#F6F4EF', surface: '#FFFFFF', raised: '#F1EEE6', border: '#E7E2D6',
        text: '#14161F', 'text-secondary': '#5F6475',
        accent: '#F5B83D', 'accent-2': '#FFD978', 'on-accent': '#1A1200',
        link: '#5B4BD6', violet: '#5B4BD6', third: '#087E9C', chart: '#F5B83D',
        positive: '#0B7A53', negative: '#D6334A', info: '#1D5FC4',
        'hero-from': '#FFF8E6', 'hero-to': '#FFFFFF', 'hero-glow': '#F5B83D',
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
