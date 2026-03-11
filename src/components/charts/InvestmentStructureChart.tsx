import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const InvestmentStructureChart = memo(({ data, totalValue, btcPrice }: any) => {
    const btcValue = totalValue / (btcPrice || 65000);

    return (
        <div className="relative w-full flex flex-col items-center">
            <div className="h-[280px] w-full relative">
                {/* ЦЕНТР БУБЛИКА */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Разом</p>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-black text-white">{btcValue.toFixed(4)}</span>
                        <span className="text-xs font-bold text-[#FDB931]">BTC</span>
                    </div>
                    <p className="text-sm font-bold text-white/60">${Math.round(totalValue).toLocaleString()}</p>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={800}
                            radius={10}
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1C1C1C', border: 'none', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value?: number) => [`$${Math.round(value || 0).toLocaleString()}`]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* ЛЕГЕНДА С ПРОЦЕНТАМИ */}
            <div className="grid grid-cols-1 gap-3 w-full mt-4 px-4">
                {data.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-bold text-white/60 uppercase">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-white">
                            {((item.value / totalValue) * 100).toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default InvestmentStructureChart;