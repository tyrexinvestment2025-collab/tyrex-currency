import { intlLocale } from '../i18n';

const SATS_IN_BTC = 100_000_000;

const finite = (n: unknown): number => {
    const v = typeof n === 'number' ? n : parseFloat(String(n ?? ''));
    return Number.isFinite(v) ? v : 0;
};

/** $1,234.56 — всегда 2 знака (или задать digits) */
export const fmtUsd = (n: unknown, digits = 2): string =>
    new Intl.NumberFormat(intlLocale(), {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(finite(n));

/** Число без валюты с фиксированным числом знаков */
export const fmtNum = (n: unknown, digits = 2): string =>
    new Intl.NumberFormat(intlLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(finite(n));

/** Целое с разделителями */
export const fmtInt = (n: unknown): string =>
    new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 0 }).format(Math.round(finite(n)));

/** 0.00123456 BTC (8 знаков по умолчанию) */
export const fmtBtc = (n: unknown, digits = 8): string => `${finite(n).toFixed(digits)} BTC`;

export const satsToBtc = (sats: unknown): number => finite(sats) / SATS_IN_BTC;

/** USD → BTC; если курса нет — 0 (никаких NaN/Infinity) */
export const usdToBtc = (usd: unknown, btcPrice: unknown): number => {
    const p = finite(btcPrice);
    return p > 0 ? finite(usd) / p : 0;
};

export const btcToUsd = (btc: unknown, btcPrice: unknown): number => finite(btc) * finite(btcPrice);

/** Проценты: 6 → «6%», 12.5 → «12.5%» */
export const fmtPct = (n: unknown, digits = 0): string =>
    `${new Intl.NumberFormat(intlLocale(), { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(finite(n))}%`;

export const fmtDate = (d: string | number | Date, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }) =>
    new Intl.DateTimeFormat(intlLocale(), opts).format(new Date(d));

export const fmtDateTime = (d: string | number | Date) =>
    fmtDate(d, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
