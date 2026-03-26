import { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, PolarRadiusAxis 
} from 'recharts';

const metricInfo: any = {
    'Потенціал': { label: 'PICT' },
    'Доходність': { label: 'ДОХІД' },
    'Ліквідність': { label: 'ЛІКВІД' },
    'Поріг входу': { label: 'ВХІД' },
    'Безпека': { label: 'РИЗИК' },
    'Пасивність': { label: 'ПАСИВ' },
};

const CustomAngleTick = (props: any) => {
    const { x, y, payload, cx, cy, index } = props;
    const item = metricInfo[payload.value] || { label: payload.value };

    // Вычисляем вектор от центра
    const radius = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    const angle = Math.atan2(y - cy, x - cx);
    
    // Смещение текста от края сетки (35px — оптимально для мобилок и десктопа)
    const labelRadius = radius + 22; 
    const nx = cx + labelRadius * Math.cos(angle);
    const ny = cy + labelRadius * Math.sin(angle);

    // Умное выравнивание (anchor) в зависимости от позиции точки
    // 0 - верх, 1 - право-верх, 2 - право-низ, 3 - низ, 4 - лево-низ, 5 - лево-верх
    let textAnchor: "middle" | "start" | "end" = "middle";
    if (index === 1 || index === 2) textAnchor = "start";
    if (index === 4 || index === 5) textAnchor = "end";

    // Дополнительная корректировка по высоте для верхней и нижней точки
    const dy = index === 0 ? -8 : index === 3 ? 12 : 4;

    return (
        <g transform={`translate(${nx},${ny})`}>
            <text 
                fill="#FFFFFF" 
                fontSize="10px" // Уменьшили размер текста
                fontWeight="900" 
                textAnchor={textAnchor}
                dy={dy}
                style={{ 
                    letterSpacing: '0.08em', 
                    textTransform: 'uppercase',
                    filter: 'drop-shadow(0px 0px 5px rgba(255,255,255,0.2))' 
                }}
            >
                {item.label}
            </text>
        </g>
    );
};

const RadarChartComponent = memo(({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
            cx="50%" cy="50%" 
            outerRadius="75%" // Увеличили саму паутину на ~40%
            data={data}
            margin={{ top: 25, right: 25, bottom: 25, left: 25 }} // Ужали поля
        >
            <defs>
                <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <PolarGrid 
                stroke="#FFFFFF" 
                strokeOpacity={0.1} 
                gridType="polygon" 
            />
            
            <PolarAngleAxis 
                dataKey="subject" 
                tick={<CustomAngleTick />} 
            />
            
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            
            {/* Бирюзовая линия (Сравнение) */}
            <Radar 
                name="Compare" 
                dataKey="Compare" 
                stroke="#00F0FF" 
                fill="#00F0FF" 
                fillOpacity={0.1} 
                strokeWidth={2} 
            />
            
            {/* Золотая линия (Tyrex) + Свечение */}
            <Radar 
                name="Tyrex" 
                dataKey="Tyrex" 
                stroke="#FDB931" 
                fill="#FDB931" 
                fillOpacity={0.2} 
                strokeWidth={3} 
                style={{ filter: 'url(#goldGlow)' }}
            />
        </RadarChart>
    </ResponsiveContainer>
));

export default RadarChartComponent;