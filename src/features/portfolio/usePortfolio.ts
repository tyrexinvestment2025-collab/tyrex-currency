import { useMemo } from 'react';
import { useTyrexStore, type TyrexCard } from '../../store/useTyrexStore';

const SATS_IN_BTC = 100_000_000;

export interface Portfolio {
    walletUsd: number;
    /** Заявки на вывод + тело/доход карт на паузе (придут после охлаждения) */
    pendingUsd: number;
    /** Купленные карты в работе или ждущие запуска — по цене покупки */
    cardsUsd: number;
    /** Доход текущего цикла у работающих карт */
    accruedUsd: number;
    totalUsd: number;
    /** Ожидаемый доход за день по работающим картам при текущем курсе */
    dailyUsd: number;
    /** Реферальная награда, которую можно забрать */
    referralUsd: number;
    referralSats: number;
    btcPrice: number;
    counts: { active: number; needsStart: number; cooling: number; finished: number; total: number };
}

/** Доход карты за день при текущем курсе */
export const cardDailyUsd = (c: TyrexCard, btcPrice: number) =>
    c.nominalBtc * (c.clientAPY / 100 / 365) * btcPrice;

/**
 * Единый расчёт портфеля — одна формула для Главной, «Моих карт» и листа «Как считается».
 * Пробные карты в стоимость активов не входят (за них не платили), но их доход учитывается.
 */
export function usePortfolio(): Portfolio {
    const balance = useTyrexStore(s => s.balance);
    const cards = useTyrexStore(s => s.cards);
    const btcPrice = useTyrexStore(s => s.btcPrice);

    return useMemo(() => {
        const paid = cards.filter(c => !c.isTrial);
        const active = cards.filter(c => c.status === 'Active');
        const cardsUsd = paid
            .filter(c => c.status === 'Inactive' || c.status === 'Active')
            .reduce((s, c) => s + c.purchasePriceUsd, 0);
        const accruedUsd = active.reduce((s, c) => s + c.currentProfitUsd, 0);
        const walletUsd = balance.walletUsd || 0;
        const pendingUsd = balance.pendingWithdrawalUsd || 0;
        const referralSats = (balance.referralSats || 0) + (balance.walletSats || 0);
        const referralUsd = btcPrice > 0 ? (referralSats / SATS_IN_BTC) * btcPrice : 0;

        return {
            walletUsd,
            pendingUsd,
            cardsUsd,
            accruedUsd,
            totalUsd: walletUsd + pendingUsd + cardsUsd + accruedUsd,
            dailyUsd: btcPrice > 0 ? active.reduce((s, c) => s + cardDailyUsd(c, btcPrice), 0) : 0,
            referralUsd,
            referralSats,
            btcPrice,
            counts: {
                active: active.length,
                needsStart: paid.filter(c => c.status === 'Inactive').length,
                cooling: cards.filter(c => c.status === 'Cooling').length,
                finished: cards.filter(c => c.status === 'Finished').length,
                total: cards.length,
            },
        };
    }, [balance, cards, btcPrice]);
}
