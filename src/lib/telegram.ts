import WebApp from '@twa-dev/sdk';

/**
 * Обёртки над нативными диалогами Telegram (вместо alert/confirm/prompt браузера).
 * Вне Telegram (или в старом клиенте) — фолбэк на window.*.
 */
const tg = WebApp;

const inTelegram = (): boolean => Boolean(tg?.initData);
const supports = (version: string): boolean => {
    try { return inTelegram() && tg.isVersionAtLeast(version); } catch { return false; }
};

/** Telegram ограничивает текст попапа 256 символами */
const clip = (s: string, max = 256) => (s.length > max ? s.slice(0, max - 1) + '…' : s);

export const showAlert = (message: string): Promise<void> =>
    new Promise(resolve => {
        if (supports('6.2')) tg.showAlert(clip(message), () => resolve());
        else { window.alert(message); resolve(); }
    });

export const showConfirm = (message: string): Promise<boolean> =>
    new Promise(resolve => {
        if (supports('6.2')) tg.showConfirm(clip(message), ok => resolve(Boolean(ok)));
        else resolve(window.confirm(message));
    });

/** Короткое тактильное подтверждение действия */
export const haptic = {
    success: () => { try { if (supports('6.1')) tg.HapticFeedback.notificationOccurred('success'); } catch { /* ignore */ } },
    error: () => { try { if (supports('6.1')) tg.HapticFeedback.notificationOccurred('error'); } catch { /* ignore */ } },
    tap: () => { try { if (supports('6.1')) tg.HapticFeedback.impactOccurred('light'); } catch { /* ignore */ } },
    select: () => { try { if (supports('6.1')) tg.HapticFeedback.selectionChanged(); } catch { /* ignore */ } },
};

/** Копирование с фолбэком для WebView, где clipboard API недоступен */
export const copyText = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }
};

/** Открыть ссылку t.me внутри Telegram, остальные — во внешнем браузере */
export const openLink = (url: string) => {
    try {
        if (inTelegram() && /^https:\/\/t\.me\//.test(url)) tg.openTelegramLink(url);
        else if (inTelegram()) tg.openLink(url);
        else window.open(url, '_blank', 'noopener');
    } catch {
        window.open(url, '_blank', 'noopener');
    }
};

export { tg, inTelegram };
