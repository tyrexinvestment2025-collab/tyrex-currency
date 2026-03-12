import { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, PolarRadiusAxis, Tooltip
} from 'recharts';
import { 
    TrendingUp, Droplets, ArrowDownToLine, 
    ShieldCheck, UserCheck, Zap 
} from 'lucide-react';

const metricIcons: Record<string, any> = {
    'Доходність': TrendingUp,
    'Ліквідність': Droplets,
    'Поріг входу': ArrowDownToLine,
    'Безпека': ShieldCheck,
    'Пасивність': UserCheck,
    'Потенціал': Zap
};

const CustomAngleTick = (props: any) => {
    const { x, y, payload, onIconClick } = props;
    const Icon = metricIcons[payload.value];
    return (
        <g transform={`translate(${x - 12},${y - 12})`} className="cursor-pointer" onClick={() => onIconClick(payload.value)}>
            <circle cx="12" cy="12" r="14" fill="transparent" />
            {Icon && <Icon size={22} color="#444" strokeWidth={1.5} />}
        </g>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1A1D26] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-black text-white/40 uppercase mb-2 tracking-widest border-b border-white/5 pb-1">
                    {payload[0].payload.subject}
                </p>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold text-[#40E0D0] uppercase">Актив:</span>
                        <span className="text-xs font-black text-white">{payload[0].value}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold text-[#FDB931] uppercase">Tyrex:</span>
                        <span className="text-xs font-black text-white">{payload[1].value}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const CustomDot = (props: any) => {
    const { cx, cy, color } = props;
    return (
        <svg x={cx - 6} y={cy - 6} width={12} height={12} className="overflow-visible">
            <circle cx="6" cy="6" r="3" fill={color} filter="drop-shadow(0 0 4px rgba(255,255,255,0.5))" />
            <circle cx="6" cy="6" r="5" fill="transparent" stroke={color} strokeWidth="1" opacity="0.3" className="animate-pulse" />
        </svg>
    );
};

const RadarChartComponent = memo(({ data, onIconClick }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#FFFFFF08" />
            <PolarAngleAxis 
                dataKey="subject" 
                tick={<CustomAngleTick onIconClick={onIconClick} />} 
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            
            <Radar
                name="Compare"
                dataKey="Compare"
                stroke="#40E0D0"
                fill="#40E0D0"
                fillOpacity={0.15}
                strokeWidth={1}
                dot={<CustomDot color="#40E0D0" />}
            />
            <Radar
                name="Tyrex"
                dataKey="Tyrex"
                stroke="#FDB931"
                fill="#FDB931"
                fillOpacity={0.2}
                strokeWidth={3}
                dot={<CustomDot color="#FDB931" />}
            />
        </RadarChart>
    </ResponsiveContainer>
));

export default RadarChartComponent;