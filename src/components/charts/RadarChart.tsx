import { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, PolarRadiusAxis, Tooltip
} from 'recharts';

const metricInfo: Record<string, { label: string }> = {
    'Потенциал': { label: 'РОСТ' },
    'Доходность': { label: 'ДОХОД' },
    'Ликвидность': { label: 'ЛИКВИД' },
    'Вход': { label: 'ВХОД' },
    'Риск': { label: 'РИСК' },
    'Пассивность': { label: 'ПАССИВ' }
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 p-2.5 rounded-xl shadow-2xl">
                <p className="text-[9px] font-black text-white/40 mb-1.5 uppercase tracking-widest border-b border-white/5 pb-1">
                    {payload[0].payload.subject}
                </p>
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold text-[#FFB800]">TYREX</span>
                        <span className="text-[10px] font-black text-white">{payload[1].value}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold text-[#00F0FF]">АКТИВ</span>
                        <span className="text-[10px] font-black text-white">{payload[0].value}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const CustomAngleTick = (props: any) => {
    const { x, y, payload, cx, cy, index } = props;
    const item = metricInfo[payload.value] || { label: payload.value };

    const radius = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    const angle = Math.atan2(y - cy, x - cx);
    
    const labelRadius = radius + 18; 
    const nx = cx + labelRadius * Math.cos(angle);
    const ny = cy + labelRadius * Math.sin(angle);

    let textAnchor: "middle" | "start" | "end" = "middle";
    if (nx > cx + 10) textAnchor = "start";
    if (nx < cx - 10) textAnchor = "end";

    return (
        <g transform={`translate(${nx},${ny})`}>
            <text 
                fill="rgba(255,255,255,0.9)" 
                fontSize="10px" 
                fontWeight="900" 
                textAnchor={textAnchor}
                dy={index === 0 ? -5 : index === 3 ? 12 : 4}
                className="uppercase"
                style={{ letterSpacing: '0.05em' }}
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
            outerRadius="63%" 
            data={data} 
            style={{ outline: 'none', overflow: 'visible' }}
        >
            <defs>
                <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <PolarGrid stroke="#FFFFFF" strokeOpacity={0.06} />
            <PolarAngleAxis dataKey="subject" tick={<CustomAngleTick />} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            
            <Tooltip content={<CustomTooltip />} cursor={false} trigger="click" />
            
            <Radar 
                name="Asset" 
                dataKey="Compare" 
                stroke="#00F0FF" 
                fill="#00F0FF" 
                fillOpacity={0.05} 
                strokeWidth={1.5} 
            />
            
            <Radar 
                name="Tyrex" 
                dataKey="Tyrex" 
                stroke="#FFB800" 
                fill="#FFB800" 
                fillOpacity={0.15} 
                strokeWidth={2.5} 
                style={{ filter: 'url(#glowGold)' }}
            />
        </RadarChart>
    </ResponsiveContainer>
));

export default RadarChartComponent;