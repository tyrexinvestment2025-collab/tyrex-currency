import { create } from 'zustand';
import WebApp from '@twa-dev/sdk';
import { authApi, userApi, cardsApi, ApiError, setUnauthorizedHandler, type ApiJson } from '../api/tyrexApi';
import { useTyrexStore } from './useTyrexStore';

/**
 * Сессия приложения: ОДИН логин на всё приложение и дедуплицированная загрузка данных.
 * Раньше каждый компонент с useTelegram() логинился и перезагружал всё сам (8–9 раз на старте).
 */
export type SessionStatus = 'idle' | 'loading' | 'ready' | 'no-telegram' | 'banned' | 'error';

export interface SessionUser {
    _id: string;
    tgId: number;
    username?: string;
    role: 'USER' | 'ADMIN';
    isTrialActivated?: boolean;
    trialActivatedAt?: string;
    referralCode?: string;
    accountStatus?: string;
    lang?: 'ru' | 'uk' | 'en' | null;
    canMessage?: boolean;
    notifPrefs?: Partial<Record<'cards' | 'partners' | 'news' | 'digest' | 'btc', boolean>>;
    [key: string]: unknown;
}

interface SessionState {
    status: SessionStatus;
    user: SessionUser | null;
    config: { depositBtcAddress?: string; minWithdrawalUsd?: number };
    error: string | null;
    init: () => Promise<void>;
    refreshAllData: () => Promise<void>;
}

let initPromise: Promise<void> | null = null;
let refreshPromise: Promise<void> | null = null;
let reloginPromise: Promise<boolean> | null = null;

const login = async (): Promise<SessionUser | null> => {
    const initData = WebApp?.initData;
    if (!initData) return null;
    const data = await authApi.login(initData);
    return (data?.user as SessionUser) || null;
};

export const useSession = create<SessionState>()((set, get) => ({
    status: 'idle',
    user: null,
    config: {},
    error: null,

    init: () => {
        if (initPromise) return initPromise;
        initPromise = (async () => {
            set({ status: 'loading', error: null });
            try {
                const user = await login();
                if (!user) {
                    set({ status: 'no-telegram' });
                    return;
                }
                set({ user });
                await get().refreshAllData();
                set({ status: 'ready' });
            } catch (e) {
                const err = e as ApiError;
                if (err?.code === 'BANNED') set({ status: 'banned' });
                else set({ status: 'error', error: err?.code || 'UNKNOWN' });
                initPromise = null; // разрешаем повторить
            }
        })();
        return initPromise;
    },

    refreshAllData: () => {
        if (refreshPromise) return refreshPromise;
        refreshPromise = (async () => {
            const store = useTyrexStore.getState();
            let btcPrice: number | undefined;

            try {
                const profile: ApiJson = await userApi.getProfile();
                if (profile) {
                    if (profile.btcPrice) btcPrice = profile.btcPrice;
                    let cards = profile.cards;
                    if (!Array.isArray(cards)) cards = await cardsApi.getMyCards().catch(() => []);
                    store.setInitialData({ ...profile, cards }, btcPrice);
                    const { config, ...rest } = profile;
                    delete rest.cards;
                    const user = rest;
                    set({ user: { ...(get().user || {}), ...user } as SessionUser, config: config || {} });
                }
            } catch (e) {
                const err = e as ApiError;
                if (err?.code === 'BANNED') set({ status: 'banned' });
                console.error('Profile load error:', err?.code || e);
            }

            try {
                const market = await cardsApi.getMarketTypes();
                if (Array.isArray(market)) useTyrexStore.getState().loadCardTypes(market, btcPrice ?? 0);
            } catch (e) {
                console.error('Market load error:', (e as ApiError)?.code || e);
            }
        })().finally(() => { refreshPromise = null; });
        return refreshPromise;
    },
}));

// Истёк токен → тихо перелогиниваемся по initData (один раз на все параллельные запросы)
setUnauthorizedHandler(() => {
    if (!reloginPromise) {
        reloginPromise = login()
            .then(user => {
                if (user) useSession.setState({ user });
                return Boolean(user);
            })
            .catch(() => false)
            .finally(() => { setTimeout(() => { reloginPromise = null; }, 0); });
    }
    return reloginPromise;
});
