import { memo, useState } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, 
    ReferenceLine, Tooltip as RechartsTooltip, CartesianGrid, Label 
} from 'recharts';
import { Settings2, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const GrowthAreaChart = memo(({ data, goal, targetMonth, pedals, setPedals }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-full bg-[#151517] rounded-[2.5rem] p-6 border border-white/10 overflow-hidden min-h-[350px] shadow-2xl">
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="absolute top-4 right-4 z-20 p-3 bg-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,0.4)] active:scale-95 rounded-full transition-all"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            )}

            <div className={clsx("h-[280px] w-full transition-all duration-500", isOpen && "blur-md opacity-20")}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FFB800" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                        <XAxis dataKey="monthLabel" stroke="#888" fontSize={9} tickLine={false} axisLine={false} interval={Math.floor(data.length / 5)} />
                        <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                        
                        <RechartsTooltip content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-[#1C1C1C] p-3 rounded-xl border-2 border-[#FFB800] shadow-2xl">
                                        <p className="text-[10px] font-black text-[#FFB800] mb-1">{d.dateLabel}</p>
                                        <p className="text-base font-black text-white">${d.value.toLocaleString()}</p>
                                        <p className="text-[9px] text-white/30 uppercase">{d.monthLabel}</p>
                                    </div>
                                );
                            }
                            return null;
                        }} />

                        <ReferenceLine y={goal} stroke="#FFB800" strokeDasharray="5 5" strokeOpacity={0.5} />
                        {targetMonth > 0 && (
                            <ReferenceLine x={targetMonth} stroke="#FFB800" strokeWidth={3}>
                                <Label value="МЕТА" position="top" fill="#FFB800" fontSize={10} fontWeight="900" />
                            </ReferenceLine>
                        )}
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#FFB800" 
                            fill="url(#colorGrowth)" 
                            strokeWidth={4} 
                            animationDuration={1500} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className="absolute inset-0 z-30 bg-black/95 p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-sm font-black uppercase text-[#FFB800] tracking-widest">Тонке налаштування %</h4>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 rounded-full text-white"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                            {Object.entries(pedals).map(([key, val]: any) => (
                                <div key={key} className="space-y-3">
                                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                                        <span className="text-white/40">{key}</span>
                                        <span className="text-[#FFB800] bg-[#FFB800]/10 px-2 py-1 rounded-lg">{val}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" value={val} 
                                        onChange={(e) => setPedals((prev: any) => ({
                                            ...prev, 
                                            pedals: { ...prev.pedals, [key]: Number(e.target.value) }
                                        }))}
                                        className="w-full h-2 accent-[#FFB800] bg-white/10 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default GrowthAreaChart;