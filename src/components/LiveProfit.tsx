import React, { useEffect, useState } from 'react';
import { fmtUsd } from '../lib/format';

interface LiveProfitProps {
    nominalSats: number;
    apy: number;
    btcPrice: number;
    baseProfitUsd: number; // значение из БД
    status: string;
    /** Если передан — счётчик монотонный в рамках карты, даже когда база с сервера обновилась */
    cardId?: string;
}

/**
 * Общая «опорная точка» для всех экземпляров счётчика одной карты.
 * Раньше каждый экземпляр (список, модалка) стартовал заново со значения из БД в момент монтирования,
 * поэтому в модалке и в списке были разные цифры, а при повторном открытии счётчик откатывался назад.
 */
interface Anchor { base: number; at: number; rate: number }
const anchors = new Map<string, Anchor>();

const usdPerSecond = (nominalSats: number, apy: number, btcPrice: number) =>
    btcPrice > 0 ? ((nominalSats * (apy / 100)) / (365 * 24 * 60 * 60) / 100_000_000) * btcPrice : 0;

const extrapolate = (a: Anchor, now: number) => a.base + Math.max(0, (now - a.at) / 1000) * a.rate;

const getAnchor = (key: string, base: number, rate: number, monotonic: boolean): Anchor => {
    const now = Date.now();
    const prev = anchors.get(key);
    if (prev && prev.rate === rate && (prev.base === base || monotonic)) {
        if (prev.base === base) return prev;
        // Пришла новая база с сервера: не даём значению уйти назад
        const next = { base: Math.max(base, extrapolate(prev, now)), at: now, rate };
        anchors.set(key, next);
        return next;
    }
    const fresh = { base: prev ? Math.max(base, monotonic ? extrapolate(prev, now) : base) : base, at: now, rate };
    anchors.set(key, fresh);
    return fresh;
};

const LiveProfit: React.FC<LiveProfitProps> = ({ nominalSats, apy, btcPrice, baseProfitUsd, status, cardId }) => {
    const isActive = status === 'Active';
    const rate = isActive ? usdPerSecond(nominalSats, apy, btcPrice) : 0;
    const key = cardId ?? `${nominalSats}:${apy}:${baseProfitUsd}`;
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isActive || rate <= 0) return;
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, [isActive, rate]);

    let value = baseProfitUsd;
    if (isActive && rate > 0) {
        value = extrapolate(getAnchor(key, baseProfitUsd, rate, Boolean(cardId)), now);
    } else if (cardId) {
        anchors.delete(cardId);
    }

    return <span className="tabular-nums tracking-tight">{fmtUsd(value, 6)}</span>;
};

export default LiveProfit;
