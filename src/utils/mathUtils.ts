// Математика по модели Excel: Капитал + Доинвест + %
export const calculateCompoundGrowth = (
    principal: number,
    reinvest: number,
    pedals: Record<string, number>,
    years: number = 5
) => {
    const months = years * 12;
    const totalApy = Object.values(pedals).reduce((sum, v) => sum + v, 0);
    const monthlyRate = (totalApy / 100) / 12;

    let balance = principal;
    const points = [{ month: 0, value: principal, invested: principal }];

    for (let i = 1; i <= months; i++) {
        // Сначала начисляем процент на остаток, потом добавляем доинвест (как в Excel)
        const profit = balance * monthlyRate;
        balance += profit + reinvest;
        
        points.push({
            month: i,
            value: Math.round(balance),
            invested: principal + (reinvest * i)
        });
    }
    return points;
};

export const calculateTimeToGoal = (principal: number, reinvest: number, goal: number, pedals: Record<string, number>) => {
    const totalApy = Object.values(pedals).reduce((sum, v) => sum + v, 0);
    if (principal >= goal) return 0;
    
    const monthlyRate = (totalApy / 100) / 12;
    let balance = principal;
    let months = 0;

    // Симуляция по месяцам до достижения цели (макс 30 лет)
    while (balance < goal && months < 360) {
        balance += (balance * monthlyRate) + reinvest;
        months++;
    }
    return months / 12;
};