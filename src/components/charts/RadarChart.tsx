import React, { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, PolarRadiusAxis
} from 'recharts';

const metricLabels: Record<string, string> = {
    'Доходность': 'ДОХОД',
    'Потенциал': 'РОСТ',
    'Пассивность': 'ПРОСТО',
    'Ликвидность': 'ЛИКВИД',
    'Вход': 'ВХОД',
    'Риск': 'РИСК'
};

const ORDER = [
    'Доходность', 
    'Потенциал', 
    'Пассивность', 
    'Ликвидность', 
    'Вход', 
    'Риск'
];

// const CustomTooltip = ({ active, payload }: any) => {
//     if (active && payload && payload.length) {
//         const compareColor = payload[0].stroke;
//         return (
//             <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
//                 <p className="text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest border-b border-white/5 pb-1">
//                     {metricLabels[payload[0].payload.subject] || payload[0].payload.subject}
//                 </p>
//                 <div className="space-y-1.5">
//                     <div className="flex items-center justify-between gap-6">
//                         <span className="text-[11px] font-bold text-[#FFB800]">TYREX</span>
//                         <span className="text-[11px] font-black text-white">{payload[1].value}%</span>
//                     </div>
//                     <div className="flex items-center justify-between gap-6">
//                         <span className="text-[11px] font-bold" style={{ color: compareColor }}>АКТИВ</span>
//                         <span className="text-[11px] font-black text-white">{payload[0].value}%</span>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
//     return null;
// };

const CustomAngleTick = (props: any) => {
    const { x, y, payload, cx, cy } = props;
    const label = metricLabels[payload.value] || payload.value;
    
    const angle = Math.atan2(y - cy, x - cx);
    const radius = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    const labelRadius = radius + 15;
    const nx = cx + labelRadius * Math.cos(angle);
    const ny = cy + labelRadius * Math.sin(angle);

    let textAnchor: "end" | "inherit" | "middle" | "start" | undefined = "middle";
    if (nx > cx + 20) textAnchor = "start";
    else if (nx < cx - 20) textAnchor = "end";
    const verticalAnchor = ny < cy - 20 ? "auto" : (ny > cy + 20 ? "hanging" : "middle");

 return (
        <g transform={`translate(${nx},${ny})`}>
            <text 
                fill="#FFFFFF" 
                fontSize="10px" 
                fontWeight="900" 
                textAnchor={textAnchor}
                dominantBaseline={verticalAnchor}
                style={{ letterSpacing: '0.05em', opacity: 0.9 }}
            >
                {label}
            </text>
        </g>
    );
};

const RadarChartComponent = memo(({ data, compareColor = '#00F0FF' }: any) => {
    const sortedData = React.useMemo(() => {
        return [...data].sort((a, b) => ORDER.indexOf(a.subject) - ORDER.indexOf(b.subject));
    }, [data]);

    return (
        <div className="w-full h-full relative flex items-center justify-center overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                    cx="50%" cy="50%" 
                    startAngle={90} 
                    endAngle={-270}
                    outerRadius="85%" 
                    data={sortedData} 
                    margin={{ top: 30, right: 40, bottom: 30, left: 40 }}
                    style={{ outline: 'none', overflow: 'visible' }}
                >
                    <defs>
                        <filter id="tyrexGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    <PolarGrid stroke="#FFFFFF" strokeOpacity={0.3} gridType="polygon" />
                    <PolarAngleAxis dataKey="subject" tick={<CustomAngleTick data={sortedData} compareColor={compareColor} />} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

                    {/* --- ШАР 1: TYREX (ЗОЛОТО) - МАЛЮЄТЬСЯ ПЕРШИМ (ЗНИЗУ) --- */}
                    <Radar
                        name="Tyrex"
                        dataKey="Tyrex"
                        stroke="#FFB800"
                        fill="#FFB800"
                        fillOpacity={0.2}
                        strokeWidth={3}
                        style={{ filter: 'url(#tyrexGlow)' }}
                        dot={{ r: 4, fill: '#FFB800', stroke: '#000', strokeWidth: 1.5 }}
                        animationDuration={1000}
                    />

                    {/* --- ШАР 2: АКТИВ (НЕОН) - МАЛЮЄТЬСЯ ДРУГИМ (ЗВЕРХУ) --- */}
                    <Radar
                        name="Asset"
                        dataKey="Compare"
                        stroke={compareColor}
                        fill={compareColor}
                        fillOpacity={0.12}
                        strokeWidth={2}
                        dot={{ r: 3, fill: compareColor, strokeWidth: 0 }}
                        animationBegin={300}
                        animationDuration={1000}
                    />
                </RadarChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_#fff]" />
            </div>
        </div>
    );
});

export default RadarChartComponent;