import type { ScenarioKey } from './types';

/**
 * Гипотетический расчёт по правилам продукта — без «ускорителей», бустеров и сети:
 *  - доход карты = ставка серии (APY) от вложенной суммы, начисляется в BTC,
 *    поэтому его долларовая сумма меняется вместе с курсом BTC относительно курса покупки;
 *  - цена покупки карты возвращается в USD (от курса не зависит);
 *  - доход и ежемесячное пополнение каждый месяц вкладываются в новые карты по текущему курсу.
 * Сценарий задаёт изменение курса BTC за год (%).
 */
export interface ForecastInput {
    principal: number;
    monthly: number;
    apy: number;
    goal: number;
    scenarios: Record<ScenarioKey, number>;
    horizon?: number; // месяцев, по умолчанию 120
}

export interface ForecastResult {
    series: Record<ScenarioKey, number[]>;
    goalMonth: Record<ScenarioKey, number | null>;
    horizon: number;
}

const simulate = (principal: number, monthly: number, apy: number, yearlyChangePct: number, horizon: number): number[] => {
    const r = apy / 100 / 12;
    const growth = Math.max(1 + yearlyChangePct / 100, 0.01);
    const price = (m: number) => Math.pow(growth, m / 12);
    const tranches: { usd: number; priceAtBuy: number }[] = principal > 0 ? [{ usd: principal, priceAtBuy: 1 }] : [];
    const out = [principal];
    let capital = principal;
    for (let m = 1; m <= horizon; m++) {
        const p = price(m);
        let profit = 0;
        for (const t of tranches) profit += t.usd * r * (p / t.priceAtBuy);
        const added = profit + monthly;
        if (added > 0) tranches.push({ usd: added, priceAtBuy: p });
        capital += added;
        out.push(capital);
    }
    return out;
};

export const runForecast = ({ principal, monthly, apy, goal, scenarios, horizon = 120 }: ForecastInput): ForecastResult => {
    const keys: ScenarioKey[] = ['bear', 'base', 'bull'];
    const series = {} as Record<ScenarioKey, number[]>;
    const goalMonth = {} as Record<ScenarioKey, number | null>;
    for (const k of keys) {
        series[k] = simulate(Math.max(0, principal), Math.max(0, monthly), Math.max(0, apy), scenarios[k] ?? 0, horizon);
        const idx = goal > 0 ? series[k].findIndex(v => v >= goal) : -1;
        goalMonth[k] = idx >= 0 ? idx : null;
    }
    return { series, goalMonth, horizon };
};

/**
 * «Сколько вложить»: сколько карт серии нужно для желаемого дохода в месяц при текущем курсе.
 * Доход карты в месяц = цена × ставка / 12.
 */
export const cardsForMonthlyIncome = (targetMonthlyUsd: number, priceUsd: number, apy: number) => {
    const perCard = priceUsd * (apy / 100) / 12;
    if (!(perCard > 0) || !(targetMonthlyUsd > 0)) return { count: 0, costUsd: 0, monthlyUsd: 0, perCardUsd: perCard };
    const count = Math.ceil(targetMonthlyUsd / perCard);
    return { count, costUsd: count * priceUsd, monthlyUsd: count * perCard, perCardUsd: perCard };
};

/** Первое число месяца через n месяцев от сегодня */
export const monthsFromNow = (n: number): Date => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    return d;
};
