export interface GrowthPoint {
    month: number;
    value: number;
}

export const calculateGrowthPoints = (
    initialCapital: number,
    rates: Record<string, number>,
    years: number
): GrowthPoint[] => {
    const months = years * 12;
    // Суммируем все годовые проценты
    const annualRate = Object.values(rates).reduce((sum, val) => sum + val, 0) / 100;
    const monthlyRate = annualRate / 12;

    let current = initialCapital;
    const points: GrowthPoint[] = [{ month: 0, value: initialCapital }];

    for (let i = 1; i <= months; i++) {
        current += current * monthlyRate;
        points.push({
            month: i,
            value: Math.round(current)
        });
    }
    return points;
};