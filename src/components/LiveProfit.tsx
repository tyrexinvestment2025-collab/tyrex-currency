import React, { useState, useEffect, useRef } from 'react';

interface LiveProfitProps {
    nominalSats: number;
    apy: number;
    btcPrice: number;
    baseProfitUsd: number; // То, что пришло с БД
    status: string;
}

const LiveProfit: React.FC<LiveProfitProps> = ({ nominalSats, apy, btcPrice, baseProfitUsd, status }) => {
    const [displayProfit, setDisplayProfit] = useState(baseProfitUsd);
    const lastUpdateRef = useRef(Date.now());
    const baseProfitRef = useRef(baseProfitUsd);

    // Если с бэкенда пришли новые данные (прошла минута и cron обновил базу),
    // мы обновляем нашу опорную точку.
    useEffect(() => {
        baseProfitRef.current = baseProfitUsd;
        lastUpdateRef.current = Date.now();
        setDisplayProfit(baseProfitUsd);
    }, [baseProfitUsd]);

    useEffect(() => {
        if (status !== 'Active') {
            setDisplayProfit(baseProfitRef.current);
            return;
        }

        // 1. Считаем доход в секунду в USD
        // SATS_PER_YEAR = NOMINAL * (APY / 100)
        // SATS_PER_SEC = SATS_PER_YEAR / (365 * 24 * 60 * 60)
        // USD_PER_SEC = (SATS_PER_SEC / 100_000_000) * BTC_PRICE

        const secondsInYear = 365 * 24 * 60 * 60;
        const annualSatsProfit = nominalSats * (apy / 100);
        const satsPerSecond = annualSatsProfit / secondsInYear;
        const usdPerSecond = (satsPerSecond / 100000000) * btcPrice;

        // 2. Запускаем интервал для анимации (каждые 100мс)
        const interval = setInterval(() => {
            const now = Date.now();
            const secondsPassed = (now - lastUpdateRef.current) / 1000;
            const addedProfit = secondsPassed * usdPerSecond;
            
            setDisplayProfit(baseProfitRef.current + addedProfit);
        }, 100); // 10 FPS достаточно для цифр

        return () => clearInterval(interval);
    }, [nominalSats, apy, btcPrice, status]);

    return (
        <span className="tabular-nums tracking-tight">
            ${displayProfit.toFixed(6)}
        </span>
    );
};

export default LiveProfit;