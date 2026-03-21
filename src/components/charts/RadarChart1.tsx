import { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, PolarRadiusAxis
} from 'recharts';
import { 
 DollarSign, Handshake, Coins, Vault, GraduationCap, Rocket
} from 'lucide-react';

const metricInfo: Record<string, { icon: any; label: string }> = {
    'Доходність': { icon: DollarSign, label: 'ДОХІД' },
    'Ліквідність': { icon: Handshake, label: 'ЛІКВІДНІСТЬ' },
    'Поріг входу': { icon: Coins, label: 'ВХІД' },
    'Безпека': { icon: Vault, label: 'БЕЗПЕКА' },
    'Пасивність': { icon: GraduationCap, label: 'ПАСИВНІСТЬ' },
    'Потенціал': { icon: Rocket, label: 'РІСТ' }
};

const CustomAngleTick = (props: any) => {
    const { x, y, payload, cx, cy } = props;
    const item = metricInfo[payload.value];
    if (!item) return null;
    const Icon = item.icon;

    // Збільшений офсет для запобігання накладання
    const radiusOffset = 25; 
    const angle = Math.atan2(y - cy, x - cx);
    const nx = x + Math.cos(angle) * radiusOffset;
    const ny = y + Math.sin(angle) * radiusOffset;

    return (
        <g transform={`translate(${nx - 12},${ny - 12})`}>
            <Icon size={16} color="#FFFFFF" opacity={0.8} strokeWidth={2} />
            <text 
                x="14" y="32" 
                textAnchor="middle" 
                fill="#FFFFFF" 
                fontSize="10px" 
                fontWeight="900" 
                className="uppercase opacity-60"
                style={{ letterSpacing: '0.05em' }}
            >
                {item.label}
            </text>
        </g>
    );
};

const RadarChart1 = memo(({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        {/* cy="45%" піднімає центр вище, щоб нижній напис мав місце */}
        <RadarChart 
            cx="50%" cy="45%" 
            outerRadius="58%" 
            data={data} 
            style={{ outline: 'none', overflow: 'visible' }}
        >
            <PolarGrid stroke="#FFFFFF" strokeOpacity={0.05} />
            <PolarAngleAxis dataKey="subject" tick={<CustomAngleTick />} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            
            <Radar 
                name="Asset" 
                dataKey="Compare" 
                stroke="#00F0FF" 
                fill="#00F0FF" 
                fillOpacity={0.1} 
                strokeWidth={1.5} 
            />
            <Radar 
                name="Tyrex" 
                dataKey="Tyrex" 
                stroke="#FFB800" 
                fill="#FFB800" 
                fillOpacity={0.15} 
                strokeWidth={2.5} 
            />
        </RadarChart>
    </ResponsiveContainer>
));

export default RadarChart1;