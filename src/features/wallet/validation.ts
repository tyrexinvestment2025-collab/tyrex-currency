export const TRC20_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
export const BTC_TXID_RE = /^[a-fA-F0-9]{64}$/;

export const SUPPORT_URL = 'https://t.me/tyrex_support';
export const btcTxUrl = (hash: string) => `https://mempool.space/tx/${hash}`;
export const tronAddressUrl = (addr: string) => `https://tronscan.org/#/address/${addr}`;

/** Сумма из поля ввода: NaN, если пусто/некорректно */
export const parseAmount = (v: string): number => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};

/** Сокращение длинного адреса/хэша для подтверждений: TXYZ…AeBf */
export const shorten = (s: string, head = 6, tail = 4) => (s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s);
