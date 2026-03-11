//n=log(Goal/Principal)/log(1+r)
export const calculateTimeToGoal = (principal: number, goal: number, annualRate: number) => {
    if (principal >= goal) return 0;
    if (annualRate <= 0) return 50; // "Бесконечность" для HODL
    
    const r = annualRate / 100;
    const years = Math.log(goal / principal) / Math.log(1 + r);
    
    return Math.min(Math.max(years, 0.5), 25); // Ограничим от 0.5 до 25 лет для визуализации
};