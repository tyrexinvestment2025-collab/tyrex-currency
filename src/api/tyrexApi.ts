import { io, Socket } from 'socket.io-client';

/** JSON-ответ сервера: граница без строгой схемы, экраны сами приводят нужные поля */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiJson = any;

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');
const TOKEN_STORAGE_KEY = 'authToken';

const getToken = (): string | null => { try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; } };
const setToken = (t: string | null) => {
    try { if (t) localStorage.setItem(TOKEN_STORAGE_KEY, t); else localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
};

/** Ошибка API: code — машинный код с бэка (переводится через namespace errors) */
export class ApiError extends Error {
    status: number;
    code: string;
    data: ApiJson;
    constructor(status: number, code: string, message: string, data?: ApiJson) {
        super(message);
        this.status = status;
        this.code = code;
        this.data = data;
    }
}

/** Вызывается при 401 — сессия перелогинивается (устанавливается из useSession) */
let onUnauthorized: (() => Promise<boolean>) | null = null;
export const setUnauthorizedHandler = (fn: () => Promise<boolean>) => { onUnauthorized = fn; };

type Opts = { method?: string; body?: unknown; auth?: boolean; retry?: boolean };

async function request<T = ApiJson>(path: string, { method = 'GET', body, auth = true, retry = true }: Opts = {}): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = auth ? getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch {
        throw new ApiError(0, 'NETWORK_ERROR', 'Network error');
    }

    if (res.status === 401 && auth && retry && onUnauthorized) {
        if (await onUnauthorized()) return request<T>(path, { method, body, auth, retry: false });
    }

    let data: ApiJson = null;
    try { data = await res.json(); } catch { /* пустое тело */ }

    if (!res.ok) {
        const code = data?.code || (res.status === 503 ? 'PRICE_UNAVAILABLE' : res.status === 403 && data?.code ? data.code : `HTTP_${res.status}`);
        throw new ApiError(res.status, code, data?.message || `HTTP ${res.status}`, data);
    }
    return data as T;
}

// --- WebSocket Service ---
// Если API_URL относительный (/api/v1) — сокет подключается к текущему origin
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '') || undefined;
let socket: Socket | null = null;

export const socketService = {
    connect: (onPriceUpdate: (price: number) => void) => {
        if (socket) return;
        socket = io(SOCKET_URL as string, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });
        socket.on('priceUpdate', (data: { price: number }) => {
            if (data?.price) onPriceUpdate(data.price);
        });
    },
    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }
};

export const authApi = {
    login: async (initData: string) => {
        const data = await request<{ token: string; user: ApiJson }>('/auth/login', { method: 'POST', body: { initData }, auth: false });
        if (data?.token) setToken(data.token);
        return data;
    },
    logout: () => setToken(null),
    hasToken: () => Boolean(getToken()),
};

export const cardsApi = {
    getMarketTypes: () => request<ApiJson[]>('/cards/types', { auth: false }),
    getCollectionItems: (typeId: string) => request(`/cards/types/${typeId}/items`, { auth: false }),
    getMyCards: () => request<ApiJson[]>('/cards/my'),
    buyCard: (cardTypeId: string, serialNumber: number) => request('/cards/buy', { method: 'POST', body: { cardTypeId, serialNumber } }),
    startCard: (cardId: string) => request(`/cards/${cardId}/start`, { method: 'POST' }),
    stopCard: (cardId: string) => request(`/cards/${cardId}/stop`, { method: 'POST' }),
    sellCardBack: (cardId: string) => request(`/cards/${cardId}/sell-back`, { method: 'POST' }),
    getHistoryBySerial: (typeId: string, serial: number) => request<ApiJson[]>(`/cards/history/${typeId}/${serial}`, { auth: false }).catch(() => []),
    activateTrialCard: () => request('/cards/activate-trial', { method: 'POST' }),
};

export const userApi = {
    getProfile: () => request('/user/me'),
    requestWithdrawal: (amountUsd: number, walletAddress: string) => request('/user/withdraw', { method: 'POST', body: { amountUsd, walletAddress } }),
    requestDeposit: (amountUsd: number, txHash: string) => request('/user/deposit', { method: 'POST', body: { amountUsd, txHash } }),
    getHistory: () => request<ApiJson[]>('/user/history'),
    getNotifications: () => request<ApiJson[]>('/user/notifications'),
    markNotificationsRead: () => request('/user/notifications/read', { method: 'POST' }).catch(() => null),
    checkSubscription: () => request<{ success: boolean; code?: string }>('/user/check-subscription', { method: 'POST' }),
    updateBotAccess: (allowed: boolean | undefined, timezone: string) => request('/user/bot-access', { method: 'POST', body: { allowed, timezone } }),
    updatePrefs: (body: { lang?: string; notifPrefs?: Partial<Record<'cards' | 'partners' | 'news' | 'digest' | 'btc', boolean>> }) =>
        request<{ success: boolean; lang: string; notifPrefs: Record<string, boolean> }>('/user/prefs', { method: 'PATCH', body }),
};

export const referralApi = {
    getReferralInfo: () => request('/referrals/info'),
    getReferralList: () => request<ApiJson[]>('/referrals/list'),
    claimRewards: () => request('/referrals/claim', { method: 'POST' }),
};

export const adminApi = {
    getStats: () => request('/admin/stats'),
    getPendingDeposits: () => request<ApiJson[]>('/admin/deposits/pending'),
    getPendingWithdrawals: () => request<ApiJson[]>('/admin/withdrawals/pending'),
    confirmDeposit: (id: string) => request(`/admin/deposit/${id}/confirm`, { method: 'POST' }),
    processWithdrawal: (id: string) => request(`/admin/withdrawal/${id}/process`, { method: 'POST' }),
    getUsers: (page = 1, search = '') => {
        const query = new URLSearchParams({ page: page.toString(), limit: '10' });
        if (search) query.append('search', search);
        return request(`/admin/users?${query.toString()}`);
    },
    getUserFullReport: (userId: string) => request(`/admin/users/${userId}/full-report`),
    banUser: (userId: string) => request(`/admin/users/${userId}/ban`, { method: 'POST' }),
    getCardTypes: () => request<ApiJson[]>('/admin/card-types'),
    updateCardType: (typeId: string, data: Record<string, unknown>) => request(`/admin/card-types/${typeId}`, { method: 'PUT', body: data }),
    rejectDeposit: (id: string, adminComment: string) => request(`/admin/deposit/${id}/reject`, { method: 'POST', body: { adminComment } }),
    rejectWithdrawal: (id: string, adminComment: string) => request(`/admin/withdrawal/${id}/reject`, { method: 'POST', body: { adminComment } }),
};

export const analyticsApi = {
    getDashboard: () => request('/analytics/dashboard'),
    getMarket: (range: string) => request(`/analytics/market?range=${encodeURIComponent(range)}`),
    getQuiz: (lang: string) => request(`/analytics/quiz?lang=${encodeURIComponent(lang)}`),
    submitQuiz: (questionId: string, answer: number, lang: string) =>
        request('/analytics/quiz/submit', { method: 'POST', body: { questionId, answer, lang } }),
    setReminder: (cardId: string, on: boolean) =>
        request('/analytics/remind', { method: 'POST', body: { cardId, on } }),
};
