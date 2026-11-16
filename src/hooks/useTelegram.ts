// src/hooks/useTelegram.ts
import WebApp from '@twa-dev/sdk';
import { useSession } from '../store/useSession';

interface ITelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

/**
 * Доступ к Telegram WebApp и текущей сессии.
 * Хук БЕЗ побочных эффектов: логин выполняется один раз в App (useSession.init).
 */
export function useTelegram() {
    const tg = WebApp;
    const userProfile = useSession(s => s.user);
    const refreshAllData = useSession(s => s.refreshAllData);
    const status = useSession(s => s.status);

    return {
        tg,
        user: tg.initDataUnsafe?.user as ITelegramUser | undefined,
        queryId: tg.initDataUnsafe?.query_id,
        userProfile,
        status,
        refreshAllData,
        onClose: () => tg.close(),
    };
}
