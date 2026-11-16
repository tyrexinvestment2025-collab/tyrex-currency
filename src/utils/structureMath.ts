import i18n from '../i18n';

export interface StructureSlice {
    name: string;
    value: number;
    color: string;
}

export const calculateStructureData = (principal: number, pedals: Record<string, number>, years: number): StructureSlice[] => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const months = years * 12;
    const monthlyRate = (totalApy / 100) / 12;
    
    const finalValue = principal * Math.pow(1 + monthlyRate, months);
    const totalProfit = finalValue - principal;

    // Распределяем прибыль пропорционально вкладу каждой "педали"
    const getShare = (val: number) => (totalApy > 0 ? totalProfit * (val / totalApy) : 0);

    return [
        { name: i18n.t('analytics:structure.own'), value: principal, color: '#2A2A2E' },
        { name: i18n.t('analytics:structure.profit'), value: getShare(pedals.yield + pedals.spec), color: '#8B5CF6' },
        { name: i18n.t('analytics:structure.bonuses'), value: getShare(pedals.ref + pedals.btc + pedals.boosters), color: '#FDB931' },
    ];
};