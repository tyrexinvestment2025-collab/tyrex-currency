import { memo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

export interface RadarDatum {
    subject: string;
    Tyrex: number;
    Compare: number;
}

interface RadarChartProps {
    data: RadarDatum[];
    compareColor?: string;
    tyrexName?: string;
    compareName?: string;
}

interface TickProps {
    x?: number | string;
    y?: number | string;
    cx?: number | string;
    payload?: { value: string };
    textAnchor?: string;
}

/** Подпись оси без обрезки: длинные слова уменьшаются, а не режутся */
const AxisTick = ({ x = 0, y = 0, cx = 0, payload, textAnchor }: TickProps) => {
    const label = payload?.value ?? '';
    const fontSize = label.length > 10 ? 8 : 9;
    const nx = Number(x), ny = Number(y), ncx = Number(cx);
    // Небольшой сдвиг наружу, чтобы подпись не наезжала на сетку
    const dx = nx > ncx + 1 ? 2 : nx < ncx - 1 ? -2 : 0;
    return (
        <text x={nx + dx} y={ny} textAnchor={textAnchor as 'start' | 'middle' | 'end'} dominantBaseline="central"
            fill="#fff" fontSize={fontSize} fontWeight={900} opacity={0.9}>
            {label}
        </text>
    );
};

const RadarChartComponent = memo(({ data, compareColor = '#00F0FF', tyrexName = 'Tyrex', compareName = 'Asset' }: RadarChartProps) => {
    return (
        <div className="w-full h-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                {/* outerRadius уменьшен, чтобы подписи помещались по краям */}
                <RadarChart cx="50%" cy="50%" outerRadius="62%" data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} style={{ outline: 'none' }}>
                    <PolarGrid stroke="#FFFFFF" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="subject" tick={<AxisTick />} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={tyrexName} dataKey="Tyrex" stroke="#FFB800" fill="#FFB800" fillOpacity={0.2} strokeWidth={3} />
                    <Radar name={compareName} dataKey="Compare" stroke={compareColor} fill={compareColor} fillOpacity={0.15} strokeWidth={2.5} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
});

RadarChartComponent.displayName = 'RadarChartComponent';

export default RadarChartComponent;
