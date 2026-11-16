import { useCallback } from 'react';
import { usePrefs } from '../store/usePrefs';
import { useTyrexStore } from '../store/useTyrexStore';
import { fmtUsd, usdToBtc } from '../lib/format';
import { intlLocale } from '../i18n';

/** BTC: 4 знака в списках, 8 в деталях */
export const fmtBtcAmount = (btc: number, precision: 'list' | 'detail' = 'list') =>
    `${new Intl.NumberFormat(intlLocale(), {
        minimumFractionDigits: precision === 'list' ? 4 : 8,
        maximumFractionDigits: precision === 'list' ? 4 : 8,
    }).format(Number.isFinite(btc) ? btc : 0)} BTC`;

export const MASK = '•••';

/**
 * Форматирование сумм в главной валюте пользователя (USD или BTC).
 * - primary(usd): главная валюта
 * - secondary(usd): вторая валюта (для подписи под суммой)
 * - { balance: true }: сумма скрывается, если включено «Скрывать баланс» (для балансов, не для цен)
 */
export function useMoney() {
    const currency = usePrefs(s => s.currency);
    const hideBalance = usePrefs(s => s.hideBalance);
    const btcPrice = useTyrexStore(s => s.btcPrice);
    const priceReady = btcPrice > 0;

    const usd = useCallback((v: number) => fmtUsd(v), []);
    const btc = useCallback((v: number, p: 'list' | 'detail' = 'list') => fmtBtcAmount(usdToBtc(v, btcPrice), p), [btcPrice]);

    const primary = useCallback((v: number, opts: { balance?: boolean; precision?: 'list' | 'detail' } = {}) => {
        if (opts.balance && hideBalance) return MASK;
        if (currency === 'BTC') return priceReady ? btc(v, opts.precision) : '…';
        return usd(v);
    }, [currency, hideBalance, priceReady, btc, usd]);

    const secondary = useCallback((v: number, opts: { balance?: boolean } = {}) => {
        if (opts.balance && hideBalance) return MASK;
        if (currency === 'BTC') return usd(v);
        return priceReady ? `≈ ${btc(v)}` : '';
    }, [currency, hideBalance, priceReady, btc, usd]);

    return { currency, hideBalance, btcPrice, priceReady, primary, secondary, usd, btc };
}
