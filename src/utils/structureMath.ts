export const calculateStructureData = (principal: number, pedals: Record<string, number>, years: number) => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const months = years * 12;
    const monthlyRate = (totalApy / 100) / 12;
    
    const finalValue = principal * Math.pow(1 + monthlyRate, months);
    const totalProfit = finalValue - principal;

    // Распределяем прибыль пропорционально вкладу каждой "педали"
    const getShare = (val: number) => (totalProfit * (val / totalApy));

    return [
        { name: 'Власні кошти', value: principal, color: '#2A2A2E' },
        { name: 'Прибуток Tyrex', value: getShare(pedals.yield + pedals.spec), color: '#8B5CF6' },
        { name: 'Бонуси та Ріст', value: getShare(pedals.ref + pedals.btc + pedals.boosters), color: '#FDB931' },
    ];
};