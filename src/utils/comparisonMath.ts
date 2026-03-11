export const generateComparisonData = (period: 'bear' | 'bull' | 'current') => {
    const points = 30; // 30 точек (например, месяцев)
    let btcPrice = 64000;
    let myQuantity = 1.0; // Стартуем с 1 BTC
    const data = [];

    // Настройки в зависимости от периода
    const volatility = period === 'bear' ? -0.05 : 0.03;
    const accumulationRate = 0.02; // +2% монет в месяц

    for (let i = 0; i <= points; i++) {
        // Имитируем "шум" рынка (случайные колебания +- 10%)
        const noise = (Math.random() - 0.5) * 0.2;
        const marketTrend = 1 + volatility + noise;
        btcPrice *= marketTrend;

        // Tyrex плавно копит монеты
        myQuantity *= (1 + accumulationRate);

        data.push({
            month: i,
            marketUsd: Math.round(btcPrice), // Линия А
            tyrexUsd: Math.round(btcPrice * myQuantity), // Линия Б
            quantity: Number(myQuantity.toFixed(4)), // Область (фон)
            isDip: noise < -0.08 // Метка для "щита", если рынок резко упал
        });
    }
    return data;
};