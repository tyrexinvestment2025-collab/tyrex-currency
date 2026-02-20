import { io, Socket } from 'socket.io-client';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'); 
const TOKEN_STORAGE_KEY = 'authToken';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
};

// --- WebSocket Service ---
const SOCKET_URL = API_URL.replace('/api/v1', '');
let socket: Socket | null = null;

export const socketService = {
    connect: (onPriceUpdate: (price: number) => void) => {
        if (socket) return;
        socket = io(SOCKET_URL, {
            transports: ['websocket'],
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
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData }),
            });
            if (!response.ok) throw new Error(`Login failed`);
            const data = await response.json();
            if (data.token) localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
            return data;
        } catch (e) { return { error: true, message: 'Login Error' }; }
    }
};

export const cardsApi = {
    getMarketTypes: async () => {
        const response = await fetch(`${API_URL}/cards/types`);
        return response.ok ? await response.json() : [];
    },
    getCollectionItems: async (typeId: string) => {
        const response = await fetch(`${API_URL}/cards/types/${typeId}/items`);
        if (!response.ok) throw new Error('Failed');
        return await response.json();
    },
    getMyCards: async () => {
        const response = await fetch(`${API_URL}/cards/my`, { headers: getAuthHeader() });
        return response.ok ? await response.json() : [];
    },
    buyCard: async (cardTypeId: string, serialNumber: number) => {
        const response = await fetch(`${API_URL}/cards/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ cardTypeId, serialNumber }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error');
        return data;
    },
    startCard: async (cardId: string) => {
        const response = await fetch(`${API_URL}/cards/${cardId}/start`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!response.ok) throw new Error('Error');
        return await response.json();
    },
    stopCard: async (cardId: string) => {
        const response = await fetch(`${API_URL}/cards/${cardId}/stop`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!response.ok) throw new Error('Error');
        return await response.json();
    },
    sellCardBack: async (cardId: string) => {
        const response = await fetch(`${API_URL}/cards/${cardId}/sell-back`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!response.ok) throw new Error('Error');
        return await response.json();
    },
    getHistoryBySerial: async (typeId: string, serial: number) => {
        const response = await fetch(`${API_URL}/cards/history/${typeId}/${serial}`);
        return response.ok ? await response.json() : [];
    }
};

export const userApi = {
    getProfile: async () => {
        const response = await fetch(`${API_URL}/user/me`, { headers: getAuthHeader() });
        if (!response.ok) throw new Error(`Profile error`);
        return await response.json();
    },
    requestWithdrawal: async (amountUsd: number, walletAddress: string) => {
        const response = await fetch(`${API_URL}/user/withdraw`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ amountUsd, walletAddress }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error');
        return data;
    },
    requestDeposit: async (amountUsd: number, txHash: string) => {
        const response = await fetch(`${API_URL}/user/deposit`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ amountUsd, txHash }), 
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error');
        return data;
    },
    getHistory: async () => {
        const response = await fetch(`${API_URL}/user/history`, { headers: getAuthHeader() });
        return await response.json();
    },
    getNotifications: async () => {
        const response = await fetch(`${API_URL}/user/notifications`, { headers: getAuthHeader() });
        return response.json();
    },
    markNotificationsRead: async () => {
        await fetch(`${API_URL}/user/notifications/read`, { method: 'POST', headers: getAuthHeader() });
    }
};

export const referralApi = {
    getReferralInfo: async () => {
        const response = await fetch(`${API_URL}/referrals/info`, { headers: getAuthHeader() });
        return response.json();
    },
    getReferralList: async () => {
        const response = await fetch(`${API_URL}/referrals/list`, { headers: getAuthHeader() });
        return response.json();
    },
};

export const adminApi = {
    getStats: async () => {
        const response = await fetch(`${API_URL}/admin/stats`, { headers: getAuthHeader() });
        return response.json();
    },
    getPendingDeposits: async () => {
        const response = await fetch(`${API_URL}/admin/deposits/pending`, { headers: getAuthHeader() });
        return response.json();
    },
    getPendingWithdrawals: async () => {
        const response = await fetch(`${API_URL}/admin/withdrawals/pending`, { headers: getAuthHeader() });
        return response.json();
    },
    confirmDeposit: async (id: string) => {
        const response = await fetch(`${API_URL}/admin/deposit/${id}/confirm`, { method: 'POST', headers: getAuthHeader() });
        return response.json();
    },
    processWithdrawal: async (id: string) => {
        const response = await fetch(`${API_URL}/admin/withdrawal/${id}/process`, { method: 'POST', headers: getAuthHeader() });
        return response.json();
    },
    getUsers: async (page = 1, search = '') => {
        const query = new URLSearchParams({ page: page.toString(), limit: '10' });
        if (search) query.append('search', search);
        const response = await fetch(`${API_URL}/admin/users?${query.toString()}`, { headers: getAuthHeader() });
        return response.json();
    },
    getUserFullReport: async (userId: string) => {
        const response = await fetch(`${API_URL}/admin/users/${userId}/full-report`, { headers: getAuthHeader() });
        return response.json();
    },
    banUser: async (userId: string) => {
        const response = await fetch(`${API_URL}/admin/users/${userId}/ban`, { method: 'POST', headers: getAuthHeader() });
        return response.json();
    },
    updateCardType: async (typeId: string, data: any) => {
        const response = await fetch(`${API_URL}/admin/card-types/${typeId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    rejectDeposit: async (id: string, adminComment: string) => {
        const response = await fetch(`${API_URL}/admin/deposit/${id}/reject`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ adminComment })
        });
        return response.json();
    },
    rejectWithdrawal: async (id: string, adminComment: string) => {
        const response = await fetch(`${API_URL}/admin/withdrawal/${id}/reject`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ adminComment })
        });
        return response.json();
    },
};

export const analyticsApi = {
    getDashboard: async () => {
        const response = await fetch(`${API_URL}/analytics/dashboard`, { headers: getAuthHeader() });
        return response.json();
    },
    submitQuiz: async (questionId: number, answerIndex: number) => {
        const response = await fetch(`${API_URL}/analytics/quiz/submit`, { 
            method: 'POST', headers: getAuthHeader(),
            body: JSON.stringify({ questionId, answerIndex })
        });
        return response.json();
    }
};