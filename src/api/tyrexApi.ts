// src/api/tyrexApi.ts
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'); 
const TOKEN_STORAGE_KEY = 'authToken';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const authApi = {
    login: async (initData: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData }),
            });
            if (!response.ok) throw new Error(`Login failed: ${response.status}`);
            const data = await response.json();
            if (data.token) {
                localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
            }
            return data;
        } catch (e) {
            console.error(e);
            return { error: true, message: 'Login Error' };
        }
    }
};

export const cardsApi = {
    // Получить список коллекций
    getMarketTypes: async () => {
        try {
            const response = await fetch(`${API_URL}/cards/types`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Market fetch error", e);
            return [];
        }
    },

    // Получить статус всех номеров в коллекции
    getCollectionItems: async (typeId: string) => {
        try {
            const response = await fetch(`${API_URL}/cards/types/${typeId}/items`);
            if (!response.ok) throw new Error('Failed to fetch items');
            return await response.json();
        } catch (e) {
            console.error("Collection items fetch error", e);
            throw e;
        }
    },
    
    getMyCards: async () => {
        try {
            const headers = getAuthHeader();
            const response = await fetch(`${API_URL}/cards/my`, { headers });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("My Cards fetch error", e);
            return [];
        }
    },

    // ОБНОВЛЕНО: Теперь передаем serialNumber
    buyCard: async (cardTypeId: string, serialNumber: number) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/cards/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ cardTypeId, serialNumber }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error buying card');
        return data;
    },

    startCard: async (cardId: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/cards/${cardId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error starting card');
        return data;
    },

    stopCard: async (cardId: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/cards/${cardId}/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error stopping card');
        return data;
    },

sellCardBack: async (cardId: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/cards/${cardId}/sell-back`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error selling card');
        return data;
    },

    // Получить историю по номеру
    getHistoryBySerial: async (typeId: string, serial: number) => {
        try {
             // Можно без хедера, если история публичная, или с хедером если приватная
            const response = await fetch(`${API_URL}/cards/history/${typeId}/${serial}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            return [];
        }
    }
};

export const userApi = {
    getProfile: async () => {
        try {
            const headers = getAuthHeader();
            const response = await fetch(`${API_URL}/user/me`, { headers });
            if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error("Profile fetch error", e);
            return null;
        }
    },

    requestWithdrawal: async (amountSats: number, walletAddress: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/user/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ amountSats, walletAddress }),
        });
        return response.json();
    },
    
    requestDeposit: async (amountSats: number, txHash: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/user/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ amountSats, txHash }),
        });
        return response.json();
    }
};

export const referralApi = {
    getReferralInfo: async () => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/referrals/info`, { headers });
        return response.json();
    },
    getReferralList: async () => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/referrals/list`, { headers });
        return response.json();
    },
};

export const adminApi = {
    getStats: async () => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/admin/stats`, { headers });
        return response.json();
    },
    getPendingDeposits: async () => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/admin/deposits/pending`, { headers });
        return response.json();
    },
    getPendingWithdrawals: async () => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/admin/withdrawals/pending`, { headers });
        return response.json();
    },
    confirmDeposit: async (depositId: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/admin/deposit/${depositId}/confirm`, {
            method: 'POST',
            headers: { ...headers }
        });
        return response.json();
    },
    processWithdrawal: async (withdrawalId: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/admin/withdrawal/${withdrawalId}/process`, {
            method: 'POST',
            headers: { ...headers }
        });
        return response.json();
    },
    getUsers: async (page = 1, search = '') => {
        const headers = getAuthHeader();
        const query = new URLSearchParams({ page: page.toString(), limit: '10' });
        if (search) query.append('search', search);
        const response = await fetch(`${API_URL}/admin/users?${query.toString()}`, { headers });
        return response.json();
    },
    getUserFullReport: async (userId: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/admin/users/${userId}/full-report`, { headers });
        return response.json();
    },
    banUser: async (userId: string) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
            method: 'POST',
            headers: { ...headers }
        });
        return response.json();
    },
    updateCardType: async (typeId: string, data: any) => {
        const headers = getAuthHeader();
        const response = await fetch(`${API_URL}/admin/card-types/${typeId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                ...headers 
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }
};