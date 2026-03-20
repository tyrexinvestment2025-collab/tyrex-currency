import { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, PolarRadiusAxis, Tooltip
} from 'recharts';
import { 
    TrendingUp, Droplets, ArrowDownToLine, 
    ShieldCheck, UserCheck, Zap 
} from 'lucide-react';

const metricInfo: Record<string, { icon: any; label: string }> = {
    'Доходність': { icon: TrendingUp, label: 'ДОХОД' },
    'Ліквідність': { icon: Droplets, label: 'ЛИКВИД' },
    'Поріг входу': { icon: ArrowDownToLine, label: 'ВХОД' },
    'Безпека': { icon: ShieldCheck, label: 'РИСК' },
    'Пасивність': { icon: UserCheck, label: 'ПАССИВ' },
    'Потенціал': { icon: Zap, label: 'РОСТ' }
};

// Кастомный рендер меток осей (иконка в круге + текст)
const CustomAngleTick = (props: any) => {
    const { x, y, payload, cx, cy } = props;
    const item = metricInfo[payload.value];
    if (!item) return null;
    const Icon = item.icon;

    // Вычисляем смещение от центра, чтобы отдалить иконки от паутины
    const radius = 35; 
    const dx = x > cx ? radius : x < cx ? -radius : 0;
    const dy = y > cy ? radius : y < cy ? -radius : 0;

    return (
        <g transform={`translate(${x + dx - 14},${y + dy - 20})`}>
            {/* Круглый контейнер для иконки */}
            <circle cx="14" cy="14" r="14" fill="#FFFFFF10" stroke="#FFFFFF05" strokeWidth="1" />
            <Icon size={16} color="#FFFFFF" opacity={0.8} x={6} y={6} />
            
            {/* Текстовая подпись под иконкой */}
            <text 
                x="14" 
                y="38" 
                textAnchor="middle" 
                fill="#FFFFFF" 
                fontSize="8px" 
                fontWeight="900" 
                letterSpacing="1px"
                className="uppercase opacity-50"
            >
                {item.label}
            </text>
        </g>
    );
};

// Светящиеся точки на углах
const CustomDot = (props: any) => {
    const { cx, cy, color } = props;
    return (
        <svg x={cx - 10} y={cy - 10} width={20} height={20} className="overflow-visible">
            <defs>
                <filter id={`glow-${color}`} x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <circle cx="10" cy="10" r="4.5" fill={color} filter={`url(#glow-${color})`} />
            <circle cx="10" cy="10" r="6" fill="transparent" stroke={color} strokeWidth="1" opacity="0.2" />
        </svg>
    );
};

const RadarChartComponent = memo(({ data, selectedAssetName }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#FFFFFF08" />
            <PolarAngleAxis dataKey="subject" tick={<CustomAngleTick />} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip 
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                            <div className="bg-[#1A1D26] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                                <p className="text-[10px] font-black text-white/30 uppercase mb-3 tracking-widest border-b border-white/5 pb-2">
                                    {payload[0].payload.subject}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between gap-10 items-center">
                                        <span className="text-[10px] text-[#A0FBFF] font-black uppercase tracking-wider">{selectedAssetName}:</span>
                                        <span className="text-sm font-black text-white">{payload[0].value}%</span>
                                    </div>
                                    <div className="flex justify-between gap-10 items-center">
                                        <span className="text-[10px] text-[#FDB931] font-black uppercase tracking-wider">Tyrex Strategy:</span>
                                        <span className="text-sm font-black text-white">{payload[1].value}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
            />
            <Radar name="Asset" dataKey="Compare" stroke="#A0FBFF" fill="#A0FBFF" fillOpacity={0.1} strokeWidth={2} dot={<CustomDot color="#A0FBFF" />} />
            <Radar name="Tyrex" dataKey="Tyrex" stroke="#FDB931" fill="#FDB931" fillOpacity={0.15} strokeWidth={3} dot={<CustomDot color="#FDB931" />} />
        </RadarChart>
    </ResponsiveContainer>
));

export default RadarChartComponent;