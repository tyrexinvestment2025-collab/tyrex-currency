import { memo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

// const metricLabels: Record<string, string> = {
//     'Доходность': 'ДОХОД',
//     'Потенциал': 'РОСТ',
//     'Пассивность': 'ПРОСТО',
//     'Ликвидность': 'ЛИКВИД',
//     'Вход': 'ВХОД',
//     'Риск': 'РИСК'
// };

const RadarChartComponent = memo(({ data, compareColor = '#00F0FF' }: any) => {
    return (
        <div className="w-full h-full relative flex items-center justify-center overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#FFFFFF" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#fff', fontSize: 10, fontWeight: 900 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Tyrex" dataKey="Tyrex" stroke="#FFB800" fill="#FFB800" fillOpacity={0.2} strokeWidth={3} />
                    <Radar name="Asset" dataKey="Compare" stroke={compareColor} fill={compareColor} fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
});

export default RadarChartComponent;