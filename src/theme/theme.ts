import WebApp from '@twa-dev/sdk';

/**
 * Токены дизайн-системы.
 * Базовые цвета берём из темы Telegram (themeParams), остальное — фирменные значения
 * для светлой/тёмной схемы. Всё пишется в CSS-переменные --c-<token> в формате "R G B",
 * Tailwind читает их через rgb(var(--c-x) / alpha).
 */
export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

type Tokens = Record<
    'bg' | 'surface' | 'raised' | 'border' | 'text' | 'text-secondary' |
    'accent' | 'on-accent' | 'positive' | 'negative' | 'info',
    string
>;

const FALLBACK: Record<ColorScheme, Tokens> = {
    dark: {
        bg: '#101012', surface: '#1B1B1E', raised: '#26262A', border: '#2F2F34',
        text: '#F4F4F6', 'text-secondary': '#9C9CA6',
        accent: '#F2B33D', 'on-accent': '#1E1500',
        positive: '#34C77B', negative: '#FF6464', info: '#4DA3FF',
    },
    light: {
        bg: '#FFFFFF', surface: '#F2F2F5', raised: '#FFFFFF', border: '#E2E2E8',
        text: '#111114', 'text-secondary': '#6B6B76',
        accent: '#9A6200', 'on-accent': '#FFFFFF',
        positive: '#13804A', negative: '#C62828', info: '#1565C0',
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

/** Яркость цвета 0..1 — чтобы понять, светлая ли тема Telegram на самом деле */
const luminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const [r, g, b] = rgb.split(' ').map(Number);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

const tgScheme = (): ColorScheme => {
    try {
        if (WebApp?.colorScheme) return WebApp.colorScheme;
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
    const tokens: Tokens = { ...FALLBACK[scheme] };

    // Цвета Telegram используем, только если пользователь не форсировал другую схему
    const tp = (() => { try { return WebApp?.themeParams || {}; } catch { return {}; } })() as Record<string, string | undefined>;
    const useTg = pref === 'system' && tp.bg_color && (luminance(tp.bg_color) > 0.5) === (scheme === 'light');
    if (useTg) {
        if (tp.bg_color) tokens.bg = tp.bg_color;
        const surface = scheme === 'dark' ? tp.section_bg_color : tp.secondary_bg_color;
        if (surface) tokens.surface = surface;
        if (tp.text_color) tokens.text = tp.text_color;
        if (tp.hint_color) tokens['text-secondary'] = tp.hint_color;
    }

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
