import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, currency }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1A1A1A] border border-[#FFB800]/30 p-2 rounded-lg shadow-2xl backdrop-blur-md">
                <p className="text-[10px] text-[#888] mb-1 font-black">{payload[0].payload.date}</p>
                <p className="text-[11px] text-white font-black italic">
                    {currency === 'BTC' 
                        ? payload[0].value.toFixed(8) 
                        : payload[0].value.toFixed(2)
                    } 
                    <span className="text-[#FFB800] not-italic ml-1">{currency}</span>
                </p>
            </div>
        );
    }
    return null;
};

const PartnerProfitChart = ({ data, partnerId, currency }: { data: any[], partnerId: string, currency: 'BTC' | 'USDT' }) => {
    const safeData = data && data.length >= 2 ? data : [{val: 0, date: ''}, {val: 0, date: ''}];

    return (
        <div className="h-24 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeData}>
                    <defs>
                        <linearGradient id={`grad-${partnerId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                        content={<CustomTooltip currency={currency} />} 
                        cursor={{ stroke: '#FFB800', strokeWidth: 1 }} 
                    />
                    <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke="#FFB800" 
                        fill={`url(#grad-${partnerId})`} 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PartnerProfitChart;