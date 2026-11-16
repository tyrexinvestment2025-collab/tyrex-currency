import type { TyrexCard } from '../../store/useTyrexStore';

/** Длительность паузы после остановки и срок пробной карты (как на бэке: COOLING_DAYS / TRIAL_DAYS) */
export const COOLING_DAYS = 30;
export const TRIAL_DAYS = 30;

const DAY_MS = 86_400_000;

/** Карта, которой нужен запуск: купленная и ещё не запускалась */
export const needsStart = (c: TyrexCard) => !c.isTrial && c.status === 'Inactive';

/** Порядок в списке: ждут запуска → работают → на паузе → завершённые */
const ORDER: Record<string, number> = { Inactive: 0, Active: 1, Cooling: 2, OnSale: 3, Finished: 4 };
export const sortCards = (cards: TyrexCard[]) =>
    [...cards].sort((a, b) => {
        const oa = a.isTrial && a.status === 'Inactive' ? 5 : ORDER[a.status] ?? 9;
        const ob = b.isTrial && b.status === 'Inactive' ? 5 : ORDER[b.status] ?? 9;
        return oa - ob || (a.serialNumber ?? 0) - (b.serialNumber ?? 0);
    });

/** Прогресс цикла 0..1: пауза — до выплаты, пробная — до конца срока; иначе null */
export const cycleProgress = (c: TyrexCard, now: number): number | null => {
    if (!c.unlockTimestamp) return null;
    if (c.status === 'Cooling') return 1 - (c.unlockTimestamp - now) / (COOLING_DAYS * DAY_MS);
    if (c.status === 'Active' && c.isTrial) return 1 - (c.unlockTimestamp - now) / (TRIAL_DAYS * DAY_MS);
    return null;
};

/** Осталось дней (целых, вверх) до выплаты/конца пробного срока */
export const daysLeft = (c: TyrexCard, now: number): number | null => {
    if (cycleProgress(c, now) === null || !c.unlockTimestamp) return null;
    return Math.max(0, Math.ceil((c.unlockTimestamp - now) / DAY_MS));
};
