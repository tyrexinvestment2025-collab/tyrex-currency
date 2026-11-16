import WebApp from '@twa-dev/sdk';
import { userApi } from '../api/tyrexApi';
import { showConfirm } from './telegram';

/**
 * Связь Mini App с ботом:
 *  - разрешение боту писать в личку (allows_write_to_pm / requestWriteAccess) — без него не будет уведомлений;
 *  - часовой пояс для тихих часов;
 *  - start_param из ссылки t.me/<бот>/app?startapp=… → нужный экран.
 */
const ASKED_KEY = 'tyrex_write_access_asked';

const inTg = (): boolean => Boolean(WebApp?.initData);
const timeZone = (): string => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Kyiv'; } catch { return 'Europe/Kyiv'; } };
const canRequest = (): boolean => { try { return inTg() && WebApp.isVersionAtLeast('6.9'); } catch { return false; } };
const allowedNow = (): boolean | undefined => {
    const u = WebApp?.initDataUnsafe?.user as { allows_write_to_pm?: boolean } | undefined;
    return typeof u?.allows_write_to_pm === 'boolean' ? u.allows_write_to_pm : undefined;
};

/** Запросить разрешение (нативный диалог Telegram). true — разрешил. */
export const requestWriteAccess = (): Promise<boolean> => new Promise(resolve => {
    if (!canRequest()) return resolve(false);
    try { WebApp.requestWriteAccess((granted) => resolve(Boolean(granted))); }
    catch { resolve(false); }
});

/**
 * При входе: сообщаем серверу часовой пояс и статус разрешения.
 * Если разрешения нет — один раз объясняем зачем и показываем запрос Telegram.
 * Возвращает итоговый статус (или undefined, если неизвестен).
 */
export async function syncBotAccess(explain: string): Promise<boolean | undefined> {
    if (!inTg()) return undefined;
    let allowed = allowedNow();
    if (allowed === false && canRequest()) {
        let asked = false;
        try { asked = localStorage.getItem(ASKED_KEY) === '1'; } catch { /* ignore */ }
        if (!asked) {
            try { localStorage.setItem(ASKED_KEY, '1'); } catch { /* ignore */ }
            if (await showConfirm(explain)) allowed = await requestWriteAccess();
        }
    }
    await userApi.updateBotAccess(allowed, timeZone()).catch(() => null);
    return allowed;
}

/** Включить уведомления по кнопке в профиле */
export async function enableNotifications(): Promise<boolean> {
    const granted = await requestWriteAccess();
    if (granted) await userApi.updateBotAccess(true, timeZone()).catch(() => null);
    return granted;
}

const ROUTES: Record<string, string> = {
    analytics: '/analytics', wallet: '/wallet', referral: '/partners', cards: '/cards', profile: '/profile', shop: '/shop', admin: '/admin',
};

/** Экран из start_param (один раз за запуск). Остальные payload (ref_, ch_) обрабатывает сервер. */
export function startRoute(isAdmin: boolean): string | null {
    const p = String(WebApp?.initDataUnsafe?.start_param || '');
    if (!p) return null;
    if (p.startsWith('p_')) {
        const r = ROUTES[p.slice(2)];
        if (!r || (r === '/admin' && !isAdmin)) return '/';
        return r;
    }
    if (/^adm_(dep|wd)_[a-f0-9]{24}$/i.test(p)) return isAdmin ? '/admin' : '/';
    return null;
}
