import React, { memo, useState } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, 
    ReferenceLine, Tooltip as RechartsTooltip, CartesianGrid 
} from 'recharts';
import { Settings2, X, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface GrowthAreaChartProps {
    data: any[];
    goal: number;
    goalReached: boolean;
    pedals: Record<string, number>;
    setPedals: React.Dispatch<React.SetStateAction<any>>;
    pedalDescriptions: Record<string, string>;
}

const GrowthAreaChart = memo(({ data, goal, goalReached, pedals, setPedals, pedalDescriptions }: GrowthAreaChartProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-full bg-[#151517] rounded-[2.5rem] p-6 border border-white/5 overflow-hidden min-h-[320px]">
            
            {/* ШЕСТЕРЕНКА (открыть) */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="absolute top-6 right-6 z-20 p-2 bg-white/5 hover:bg-white/10 active:scale-95 rounded-full transition-all border border-white/5"
                >
                    <Settings2 className="w-5 h-5 text-white/50" />
                </button>
            )}

            {/* ГРАФИК */}
            <div className={clsx("h-[250px] w-full pt-4 transition-all duration-500", isOpen && "blur-sm scale-95 opacity-20")}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -15, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={goalReached ? "#10b981" : "#FDB931"} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={goalReached ? "#10b981" : "#FDB931"} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="month" hide />
                        <YAxis 
                            stroke="#444" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} 
                        />
                        <RechartsTooltip 
    cursor={{ stroke: '#ffffff10', strokeWidth: 1 }}
    content={({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-[#1C1C1C] p-3 rounded-xl border border-white/10 shadow-2xl">
                    <p className="text-[9px] uppercase text-white/50 mb-1 font-bold">Місяць {d.month}</p>
                    <p className="text-sm font-black text-[#FDB931]">
                        {/* Округляем до 2 знаков для точности */}
                        {Number(d.value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                    </p>
                </div>
            );
        }
        return null;
    }}
/>
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={goalReached ? "#10b981" : "#FDB931"} 
                            fill="url(#colorGrowth)" 
                            strokeWidth={3}
                        />
                        <ReferenceLine 
                            y={goal} 
                            stroke={goalReached ? "#10b981" : "#FDB931"} 
                            strokeDasharray="4 4" 
                            strokeOpacity={0.5}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* ОВЕРЛЕЙ НАСТРОЕК (появляется на фоне графика) */}
            {isOpen && (
                <div className="absolute inset-0 z-30 bg-[#0A0A0B]/80 backdrop-blur-md p-6 flex flex-col animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Налаштування бустерів</h4>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 bg-white/5 rounded-full hover:bg-white/10"
                        >
                            <X className="w-4 h-4 text-white/60" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar">
                        {Object.entries(pedals).map(([key, val]) => (
                            <div key={key} className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] uppercase font-black text-white/80">{key}</span>
                                        <div className="group relative">
                                            <HelpCircle className="w-3 h-3 text-white/20" />
                                            {/* Tooltip */}
                                            <div className="absolute left-0 bottom-full mb-2 w-40 p-2 bg-black border border-white/10 rounded-lg text-[8px] leading-tight text-white/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                {pedalDescriptions[key]}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[#FDB931] font-black text-[10px]">{val}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={val} 
                                    onChange={(e) => setPedals((p: any) => ({...p, [key]: Number(e.target.value)}))} 
                                    className="w-full h-1 accent-[#FDB931] cursor-pointer bg-white/10 rounded-full appearance-none" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

GrowthAreaChart.displayName = 'GrowthAreaChart';
export default GrowthAreaChart;