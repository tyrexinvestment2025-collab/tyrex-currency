import { useEffect, useRef } from 'react';
import WebApp from '@twa-dev/sdk';

/**
 * Хуки для нативных кнопок Telegram.
 * Вне Telegram (или в старом клиенте) хуки возвращают available=false —
 * компонент должен показать свою кнопку внутри страницы.
 */
const tg = WebApp;
const inTg = (): boolean => { try { return Boolean(tg?.initData); } catch { return false; } };
const atLeast = (v: string): boolean => { try { return inTg() && tg.isVersionAtLeast(v); } catch { return false; } };

export const nativeMainButtonAvailable = (): boolean => atLeast('6.0');
/** Нативная «Назад» есть с Bot API 6.1; иначе экран показывает свою кнопку */
export const nativeBackAvailable = (): boolean => atLeast('6.1');

interface MainButtonOpts {
    text: string;
    onClick: () => void;
    visible?: boolean;
    disabled?: boolean;
    loading?: boolean;
    /** secondary — вторичная кнопка Telegram (Bot API 7.10+) */
    variant?: 'main' | 'secondary';
}

/**
 * Стек владельцев кнопки: экран и открытый поверх него лист могут оба хотеть MainButton.
 * Кнопкой управляет последний зарегистрированный; после его размонтирования
 * кнопка возвращается предыдущему владельцу.
 */
type Entry = { id: number; opts: MainButtonOpts; handler: () => void };
const stacks: Record<'main' | 'secondary', Entry[]> = { main: [], secondary: [] };
const bound: Record<'main' | 'secondary', (() => void) | null> = { main: null, secondary: null };
let seq = 0;

const cssColor = (name: string): `#${string}` | undefined => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim().split(/\s+/).map(Number);
    return v.length === 3 && v.every(n => Number.isFinite(n))
        ? `#${v.map(n => n.toString(16).padStart(2, '0')).join('')}` as `#${string}`
        : undefined;
};

const render = (variant: 'main' | 'secondary') => {
    const btn = variant === 'secondary' ? tg.SecondaryButton : tg.MainButton;
    const top = stacks[variant][stacks[variant].length - 1];

    if (bound[variant]) { btn.offClick(bound[variant]!); bound[variant] = null; }
    if (!top || top.opts.visible === false) {
        btn.hideProgress();
        btn.hide();
        return;
    }
    const { text, disabled, loading } = top.opts;
    btn.setText(text);
    try {
        const color = variant === 'secondary' ? cssColor('surface') : cssColor('accent');
        const textColor = variant === 'secondary' ? cssColor('text') : cssColor('on-accent');
        btn.setParams({ ...(color ? { color } : {}), ...(textColor ? { text_color: textColor } : {}), is_active: !disabled });
    } catch { /* старый клиент */ }
    if (loading) btn.showProgress(false); else btn.hideProgress();
    btn.show();
    bound[variant] = top.handler;
    btn.onClick(top.handler);
};

/** Главная кнопка Telegram. Одна на экран, текст = результат действия. */
export function useTgMainButton(opts: MainButtonOpts): boolean {
    const variant = opts.variant || 'main';
    const available = variant === 'secondary' ? atLeast('7.10') : nativeMainButtonAvailable();
    const optsRef = useRef(opts);
    useEffect(() => { optsRef.current = opts; });
    const entryRef = useRef<Entry | null>(null);

    // Регистрация в стеке на время жизни компонента
    useEffect(() => {
        if (!available) return;
        const entry: Entry = {
            id: ++seq,
            opts: optsRef.current,
            handler: () => {
                const o = optsRef.current;
                if (!o.disabled && !o.loading) o.onClick();
            },
        };
        entryRef.current = entry;
        stacks[variant].push(entry);
        render(variant);
        return () => {
            stacks[variant] = stacks[variant].filter(e => e.id !== entry.id);
            entryRef.current = null;
            render(variant);
        };
    }, [available, variant]);

    // Обновление текста/состояния
    useEffect(() => {
        if (!available || !entryRef.current) return;
        entryRef.current.opts = opts;
        const stack = stacks[variant];
        if (stack[stack.length - 1]?.id === entryRef.current.id) render(variant);
    }, [available, variant, opts.text, opts.visible, opts.disabled, opts.loading]); // eslint-disable-line react-hooks/exhaustive-deps

    return available;
}

/** Нативная кнопка «Назад» Telegram */
export function useTgBackButton(onBack: (() => void) | null) {
    const ref = useRef(onBack);
    useEffect(() => { ref.current = onBack; });
    useEffect(() => {
        if (!atLeast('6.1') || !onBack) return;
        const handler = () => ref.current?.();
        tg.BackButton.onClick(handler);
        tg.BackButton.show();
        return () => {
            tg.BackButton.offClick(handler);
            tg.BackButton.hide();
        };
    }, [Boolean(onBack)]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Кнопка «Настройки» в меню «…» Telegram */
export function useTgSettingsButton(onOpen: () => void) {
    const ref = useRef(onOpen);
    useEffect(() => { ref.current = onOpen; });
    useEffect(() => {
        if (!atLeast('7.0')) return;
        const handler = () => ref.current();
        tg.SettingsButton.onClick(handler);
        tg.SettingsButton.show();
        return () => { tg.SettingsButton.offClick(handler); tg.SettingsButton.hide(); };
    }, []);
}

/** Подтверждение закрытия, пока заполнена форма */
export function useClosingConfirmation(enabled: boolean) {
    useEffect(() => {
        if (!atLeast('6.2')) return;
        if (enabled) tg.enableClosingConfirmation(); else tg.disableClosingConfirmation();
        return () => { try { tg.disableClosingConfirmation(); } catch { /* ignore */ } };
    }, [enabled]);
}

/** Пока открыт прокручиваемый лист — вертикальный свайп не закрывает приложение */
export function useDisableVerticalSwipes(active: boolean) {
    useEffect(() => {
        if (!atLeast('7.7') || !active) return;
        tg.disableVerticalSwipes();
        return () => { try { tg.enableVerticalSwipes(); } catch { /* ignore */ } };
    }, [active]);
}

/** Сканер QR Telegram; resolve(null), если недоступен или закрыт */
export const scanQr = (hint: string): Promise<string | null> => new Promise(resolve => {
    if (!atLeast('6.4')) return resolve(null);
    let done = false;
    try {
        tg.showScanQrPopup({ text: hint }, (value) => {
            if (done) return true;
            done = true;
            resolve(value);
            return true; // закрыть сканер
        });
        tg.onEvent('scanQrPopupClosed', () => { if (!done) { done = true; resolve(null); } });
    } catch { resolve(null); }
});

export const qrScanAvailable = (): boolean => atLeast('6.4');
