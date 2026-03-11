import { memo } from 'react';
import { 
    ComposedChart, Line, Area, XAxis, YAxis, 
    ResponsiveContainer, Tooltip, ReferenceDot 
} from 'recharts';
import { ShieldCheck } from 'lucide-react';

const StrategyComparisonChart = memo(({ data }: { data: any[] }) => {
    const startPoint = data[0];

    return (
        <div className="relative w-full bg-[#0F0F11] rounded-[2.5rem] p-6 border border-white/5 overflow-hidden">
            <div className="h-[300px] w-full pt-8">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>

                        <XAxis dataKey="month" hide />
                        {/* Добавим небольшой отступ снизу и сверху, чтобы линии не прижимались к краям */}
                        <YAxis hide domain={['dataMin * 0.9', 'dataMax * 1.1']} />

                        <Tooltip 
                            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-[#1C1C1C] p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md z-50">
                                            <p className="text-[10px] uppercase text-white/40 mb-2 font-black tracking-widest">Аналіз точки</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between gap-8 text-xs font-bold">
                                                    <span className="text-white/60">Ринок (BTC):</span>
                                                    <span className="text-white/90">${d.marketUsd.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between gap-8 text-xs font-bold">
                                                    <span className="text-[#FDB931]">Tyrex Strategy:</span>
                                                    <span className="text-[#FDB931]">${d.tyrexUsd.toLocaleString()}</span>
                                                </div>
                                                <div className="pt-2 border-t border-white/5 flex justify-between gap-8 text-[10px] text-purple-400 font-black">
                                                    <span>Баланс монет:</span>
                                                    <span>{d.quantity.toFixed(4)} BTC</span>
                                                </div>
                                            </div>
                                            {d.isDip && (
                                                <div className="mt-3 flex items-center gap-2 text-[9px] text-green-400 font-bold bg-green-400/10 p-2 rounded-lg border border-green-400/20">
                                                    <ShieldCheck className="w-3 h-3" /> ЗАХИСТ АКТИВОВАНО
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* 1. Накопление монет (фон) */}
                        <Area type="monotone" dataKey="tyrexUsd" fill="url(#colorQty)" stroke="none" />

                        {/* 2. Линия РЫНКА (BTC) - Сделали светлее (#777) и толще (1.5) */}
                        <Line 
                            type="monotone" 
                            dataKey="marketUsd" 
                            stroke="#777777" 
                            strokeWidth={1.5} 
                            strokeDasharray="6 4" 
                            dot={false} 
                            activeDot={{ r: 4, fill: "#fff", strokeWidth: 0 }}
                        />

                        {/* 3. Линия TYREX - Яркая и четкая */}
                        <Line 
                            type="monotone" 
                            dataKey="tyrexUsd" 
                            stroke="#FDB931" 
                            strokeWidth={3} 
                            dot={false} 
                            activeDot={{ r: 6, fill: "#FDB931", stroke: "#000", strokeWidth: 2 }}
                        />

                        {/* Анкор старта */}
                        <ReferenceDot 
                            x={startPoint.month} 
                            y={startPoint.marketUsd} 
                            r={5} 
                            fill="#FDB931" 
                            stroke="#000" 
                            strokeWidth={2}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Легенда */}
            <div className="mt-6 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-[2px] border-t-2 border-dashed border-[#777]" />
                    <span className="text-[10px] font-bold text-white/40 uppercase">Ринок (BTC)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-[#FDB931] rounded-full" />
                    <span className="text-[10px] font-bold text-white/80 uppercase">Стратегія Tyrex</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500/20 rounded-md border border-purple-500/30" />
                    <span className="text-[10px] font-bold text-purple-400/60 uppercase">Накопичення</span>
                </div>
            </div>
        </div>
    );
});

StrategyComparisonChart.displayName = 'StrategyComparisonChart';

export default StrategyComparisonChart;