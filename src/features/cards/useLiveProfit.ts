import { useEffect, useState } from 'react';
import type { TyrexCard } from '../../store/useTyrexStore';
import { cardDailyUsd } from '../portfolio/usePortfolio';

const DAY_MS = 86_400_000;

interface Anchor {
    cards: TyrexCard[];
    at: number;
    base: Record<string, number>;
}

/** Момент, после которого карта перестаёт зарабатывать (пробная — по сроку) */
const accrualEnd = (c: TyrexCard): number => (c.isTrial && c.unlockTimestamp ? c.unlockTimestamp : Infinity);

const estimate = (a: Anchor, c: TyrexCard, now: number, btcPrice: number): number => {
    const base = a.base[c.id] ?? c.currentProfitUsd;
    if (c.status !== 'Active') return base;
    const until = Math.min(now, accrualEnd(c));
    return base + cardDailyUsd(c, btcPrice) * Math.max(0, until - a.at) / DAY_MS;
};

/**
 * Живой доход текущего цикла: обновляется раз в секунду и никогда не идёт назад.
 * Вызывается ОДИН раз на экран — список и лист карты получают одну и ту же функцию,
 * поэтому цифры в них совпадают. При обновлении данных с сервера база берётся как
 * максимум из серверного значения и текущей оценки.
 */
export function useLiveProfit(cards: TyrexCard[], btcPrice: number) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const [anchor, setAnchor] = useState<Anchor>(() => ({
        cards,
        at: now,
        base: Object.fromEntries(cards.map(c => [c.id, c.currentProfitUsd])),
    }));

    // Новые данные из стора: пересчитываем базу без отката назад (обновление состояния во время рендера — штатный приём React)
    if (anchor.cards !== cards) {
        const base: Record<string, number> = {};
        for (const c of cards) {
            const prev = anchor.base[c.id] !== undefined ? estimate(anchor, c, now, btcPrice) : 0;
            base[c.id] = Math.max(c.currentProfitUsd, prev);
        }
        setAnchor({ cards, at: now, base });
    }

    return {
        now,
        profitOf: (c: TyrexCard) => estimate(anchor, c, now, btcPrice),
    };
}
