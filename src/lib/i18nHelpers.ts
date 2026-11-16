import i18n from '../i18n';
import { ApiError } from '../api/tyrexApi';

/** Переводит ошибку API (по коду с бэка) в текст на языке пользователя */
export const errorText = (e: unknown): string => {
    const err = e as ApiError;
    const code = err?.code;
    if (code && i18n.exists(`errors:${code}`)) return String(i18n.t(`errors:${code}`, { ...(err.data || {}) }));
    if (err?.status && err.status >= 500) return i18n.t('errors:SERVER_ERROR');
    return i18n.t('errors:UNKNOWN');
};

interface NotificationLike { key?: string; params?: Record<string, unknown>; title?: string; message?: string }

/** Уведомление: если есть key — перевод, иначе текст как пришёл с сервера */
export const notificationText = (n: NotificationLike): { title: string; message: string } => {
    if (n.key && i18n.exists(`notifications:${n.key}.title`)) {
        const params = { ...(n.params || {}) } as Record<string, unknown>;
        if (typeof params.amount === 'number') params.amount = (params.amount as number).toFixed(2);
        return {
            title: i18n.t(`notifications:${n.key}.title`, params),
            message: i18n.t(`notifications:${n.key}.message`, params),
        };
    }
    return { title: n.title || '', message: n.message || '' };
};
