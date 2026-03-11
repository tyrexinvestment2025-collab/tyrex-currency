import { useMemo } from 'react';
import { calculateGrowthPoints } from '../utils/growthMath';

export const useGrowthProjection = (
    initialCapital: number,
    financialGoal: number,
    rates: Record<string, number>,
    years: number
) => {
    return useMemo(() => {
        const data = calculateGrowthPoints(initialCapital, rates, years);
        
        // Находим точку достижения цели
        const goalPointIndex = data.findIndex(p => p.value >= financialGoal);
        const goalReached = goalPointIndex !== -1;
        
        return {
            data,
            goalReached,
            monthsToGoal: goalReached ? goalPointIndex : null,
            finalValue: data[data.length - 1].value
        };
    }, [initialCapital, financialGoal, rates, years]);
};