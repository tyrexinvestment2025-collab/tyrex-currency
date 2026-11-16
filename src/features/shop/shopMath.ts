import type { TyrexCardType } from '../../store/useTyrexStore';

const SATS_IN_BTC = 100_000_000;

/** В сторе ставки хранятся строкой «6%» — приводим к числу */
export const apyOf = (v: string | number | undefined): number => {
    const n = parseFloat(String(v ?? '').replace('%', '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};

export const nominalBtcOf = (type: TyrexCardType): number => (type.nominalSats || 0) / SATS_IN_BTC;

/** Цена карты в USD по текущему курсу (если курса нет — 0) */
export const priceUsdOf = (type: TyrexCardType, btcPrice: number): number =>
    btcPrice > 0 ? Math.round(nominalBtcOf(type) * btcPrice) : 0;

/** Оценка дохода за N дней при текущем курсе, без прогноза роста BTC */
export const incomeForDays = (type: TyrexCardType, btcPrice: number, days: number): number =>
    btcPrice > 0 ? nominalBtcOf(type) * (apyOf(type.clientAPY) / 100 / 365) * days * btcPrice : 0;

export interface CollectionItem {
    serialNumber: number;
    isSold: boolean;
}
