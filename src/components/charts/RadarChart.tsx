import { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, PolarRadiusAxis, Tooltip
} from 'recharts';

const metricInfo: Record<string, { icon: any; label: string }> = {
    'Доходність': { icon: DollarSign, label: 'ДОХІД' },
    'Ліквідність': { icon: Handshake, label: 'ЛІКВІД' },
    'Поріг входу': { icon: Coins, label: 'ВХІД' },
    'Безпека': { icon: Vault, label: 'РИЗИК' },
    'Пасивність': { icon: GraduationCap, label: 'ПАСИВ' },
    'Потенціал': { icon: Rocket, label: 'РІСТ' }
};
import { 
    DollarSign, 
    Handshake, 
    Coins, 
    Vault, 
    GraduationCap, 
    Rocket 
} from 'lucide-react';

const CustomAngleTick = (props: any) => {
    const { x, y, payload, cx, cy } = props;
    const item = metricInfo[payload.value];
    if (!item) return null;
    const Icon = item.icon;

    const angle = Math.atan2(y - cy, x - cx);
    const radiusOffset = 20; 
    const nx = x + Math.cos(angle) * radiusOffset;
    const ny = y + Math.sin(angle) * radiusOffset;

    return (
        <g transform={`translate(${nx - 20},${ny - 10})`}>
            <Icon size={14} color="#FFFFFF" opacity={0.9} strokeWidth={2.5} />
            <text 
                x="18" 
                y="11" 
                fill="#FFFFFF" 
                fontSize="9px" 
                fontWeight="800" 
                style={{ letterSpacing: '0.05em', opacity: 0.6 }}
            >
                {item.label}
            </text>
        </g>
    );
};

const CustomDot = (props: any) => {
    const { cx, cy, color } = props;
    return (
        <g>
            <circle cx={cx} cy={cy} r={6} fill={color} opacity="0.2">
                <animate attributeName="r" from="4" to="10" dur="1.5s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
            </circle>
            <circle 
                cx={cx} cy={cy} r={4} 
                fill={color} 
                style={{ filter: `drop-shadow(0px 0px 8px ${color})` }} 
            />
        </g>
    );
};

const RadarChartComponent = memo(({ data, selectedAssetName }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        {/* Добавлен стиль outline: 'none' для самого чарта */}
        <RadarChart 
            cx="50%" cy="50%" 
            outerRadius="75%" 
            data={data} 
            style={{ overflow: 'visible', outline: 'none' }}
        >
            <PolarGrid stroke="#FFFFFF" strokeOpacity={0.03} />
            <PolarAngleAxis dataKey="subject" tick={<CustomAngleTick />} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            
            <Tooltip 
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                            <div className="bg-[#1A1D26]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                                <div className="space-y-1">
                                    <div className="flex justify-between gap-6">
                                        <span className="text-[9px] text-[#00F0FF] font-black uppercase">{selectedAssetName}:</span>
                                        <span className="text-[11px] font-black text-white">{payload[0].value}%</span>
                                    </div>
                                    <div className="flex justify-between gap-6">
                                        <span className="text-[9px] text-[#FFB800] font-black uppercase">Tyrex:</span>
                                        <span className="text-[11px] font-black text-white">{payload[1].value}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
            />

            <Radar 
                name="Compare"
                dataKey="Compare" 
                stroke="#00F0FF" 
                fill="#00F0FF" 
                fillOpacity={0.12} 
                strokeWidth={2} 
                dot={<CustomDot color="#00F0FF" />}
                isAnimationActive={true}
                animationDuration={1200}
            />
            
            <Radar 
                name="Tyrex"
                dataKey="Tyrex" 
                stroke="#FFB800" 
                fill="#FFB800" 
                fillOpacity={0.18} 
                strokeWidth={3} 
                dot={<CustomDot color="#FFB800" />}
                isAnimationActive={true}
                animationBegin={300}
                animationDuration={1200}
            />
        </RadarChart>
    </ResponsiveContainer>
));

export default RadarChartComponent;