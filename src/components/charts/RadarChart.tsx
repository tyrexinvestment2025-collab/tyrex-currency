import { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, PolarRadiusAxis, Tooltip
} from 'recharts';
import { 
    CircleDollarSign, Handshake, Coins, ShieldCheck, GraduationCap, Rocket 
} from 'lucide-react';

const metricInfo: Record<string, { label: string; icon: any }> = {
    'Потенциал': { label: 'РОСТ', icon: Rocket },
    'Доходность': { label: 'ДОХОД', icon: CircleDollarSign },
    'Ликвидность': { label: 'ЛИКВИД', icon: Handshake },
    'Вход': { label: 'ВХОД', icon: Coins },
    'Риск': { label: 'РИСК', icon: ShieldCheck },
    'Пассивность': { label: 'ПАССИВ', icon: GraduationCap }
};

// Тултип теперь адаптируется под цвет через payload
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const compareColor = payload[0].stroke; // Берем цвет из настроек Radar
        return (
            <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest border-b border-white/5 pb-1">
                    {payload[0].payload.subject}
                </p>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-[11px] font-bold text-[#FFB800]">TYREX</span>
                        <span className="text-[11px] font-black text-white">{payload[1].value}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-[11px] font-bold" style={{ color: compareColor }}>АКТИВ</span>
                        <span className="text-[11px] font-black text-white">{payload[0].value}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const CustomAngleTick = (props: any) => {
    const { x, y, payload, cx, cy } = props;
    const item = metricInfo[payload.value] || { label: payload.value, icon: Rocket };
    
    const angle = Math.atan2(y - cy, x - cx);
    const radius = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    const labelRadius = radius + 30; 
    const nx = cx + labelRadius * Math.cos(angle);
    const ny = cy + labelRadius * Math.sin(angle);

    const isRight = nx > cx + 10;
    const isLeft = nx < cx - 10;
    const textAnchor = isRight ? "start" : isLeft ? "end" : "middle";

    return (
        <g transform={`translate(${nx},${ny})`}>
            <item.icon 
                size={14} 
                strokeWidth={1.5}
                color="white"
                style={{ opacity: 0.3 }}
                x={textAnchor === "start" ? 0 : textAnchor === "end" ? -14 : -7} 
                y={-24} 
            />
            <text 
                fill="#FFFFFF" 
                fontSize="11px" 
                fontWeight="900" 
                textAnchor={textAnchor}
                dy={0}
                style={{ letterSpacing: '0.1em', opacity: 0.9 }}
            >
                {item.label}
            </text>
        </g>
    );
};

// Добавлен проп compareColor
const RadarChartComponent = memo(({ data, compareColor = '#00F0FF' }: any) => (
    <div className="w-full h-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
                cx="50%" cy="50%" 
                outerRadius="72%" 
                data={data} 
                margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
                style={{ outline: 'none', overflow: 'visible' }}
            >
                <defs>
                    <filter id="tyrexGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <PolarGrid stroke="#FFFFFF" strokeOpacity={0.06} />
                <PolarAngleAxis dataKey="subject" tick={<CustomAngleTick />} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

                <Tooltip content={<CustomTooltip />} cursor={false} trigger="click" />

                {/* ВТОРОЙ ГРАФИК (Динамический цвет через проп compareColor) */}
                <Radar
                    name="Asset"
                    dataKey="Compare"
                    stroke={compareColor}
                    fill={compareColor}
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                    animationDuration={1000}
                />

                {/* TYREX - Золотой Кристалл */}
                <Radar
                    name="Tyrex"
                    dataKey="Tyrex"
                    stroke="#FFB800"
                    fill="#FFB800"
                    fillOpacity={0.15}
                    strokeWidth={3}
                    style={{ filter: 'url(#tyrexGlow)' }}
                    dot={{
                        r: 4,
                        fill: '#080808',
                        stroke: '#FFB800',
                        strokeWidth: 2,
                        cursor: 'pointer'
                    }}
                    activeDot={{ r: 6, fill: '#FFB800', strokeWidth: 0 }}
                    animationBegin={200}
                    animationDuration={1500}
                />
            </RadarChart>
        </ResponsiveContainer>

        {/* Минималистичное ядро */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#fff]" />
        </div>
    </div>
));

export default RadarChartComponent;