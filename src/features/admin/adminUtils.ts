import type { ApiJson } from '../../api/tyrexApi';

/** Decimal128 ({ $numberDecimal }) / строка / число → число */
export const num = (v: ApiJson): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'object' && v.$numberDecimal !== undefined) return parseFloat(v.$numberDecimal) || 0;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
};

export interface AdminUserRef { _id?: string; username?: string; tgId?: number | string; balance?: { walletUsd?: ApiJson } }

export interface AdminRequest {
    _id: string;
    kind: 'DEPOSIT' | 'WITHDRAWAL';
    user: AdminUserRef;
    amountUsd: number;
    createdAt: string;
    /** txHash для пополнения, адрес TRC20 для вывода */
    ref: string;
}

export const userLabel = (u?: AdminUserRef) =>
    u?.username ? `@${u.username}` : u?.tgId ? `ID ${u.tgId}` : '—';

export const explorerUrl = (kind: 'DEPOSIT' | 'WITHDRAWAL', ref: string): string | null => {
    if (!ref) return null;
    if (kind === 'DEPOSIT' && /^[a-f0-9]{64}$/i.test(ref)) return `https://mempool.space/tx/${ref}`;
    if (kind === 'WITHDRAWAL' && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(ref)) return `https://tronscan.org/#/address/${ref}`;
    return null;
};

export const shortRef = (ref: string) => (ref.length > 18 ? `${ref.slice(0, 8)}…${ref.slice(-8)}` : ref);
