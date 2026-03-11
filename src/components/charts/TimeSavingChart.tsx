import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Rocket, Turtle, Zap } from 'lucide-react';

interface TimeSavingChartProps {
    principal: number;
    goal: number;
    pedals: Record<string, number>;
}

// Умная формула расчета времени достижения цели
const calculateYears = (p: number, g: number, annualRate: number) => {
    if (p <= 0 || g <= 0 || p >= g) return 0.5;
    const r = annualRate / 100;
    if (r <= 0) return 20; // Если доходности нет, ждать "вечно"
    // Формула: t = ln(G/P) / ln(1 + r)
    const t = Math.log(g / p) / Math.log(1 + r);
    return Math.min(Math.max(t, 0.5), 25); // Ограничение для визуала от 0.5 до 25 лет
};

const TimeSavingChart = memo(({ principal, goal, pedals }: TimeSavingChartProps) => {
    // Рассчитываем суммарный APY для Turbo (все педали)
    const turboAPY = Object.values(pedals).reduce((sum, v) => sum + v, 0);
    
    // Сценарии
    const scenarios = [
        { name: 'HODL', apy: 5, color: '#333', icon: <Turtle className="w-4 h-4"/> },
        { name: 'Basic', apy: 20, color: '#8B5CF6', icon: <Zap className="w-4 h-4"/> },
        { name: 'Turbo', apy: turboAPY, color: '#FDB931', icon: <Rocket className="w-4 h-4"/> }
    ];

    const data = scenarios.map(s => ({
        name: s.name,
        years: calculateYears(principal, goal, s.apy),
        color: s.color,
        icon: s.icon
    }));

    // Экономия времени: разница между HODL (самый длинный) и Turbo (самый короткий)
    const timeSaved = Math.max(0, Math.round(data[0].years - data[2].years));

    return (
        <div className="relative w-full bg-[#151517] rounded-[2.5rem] p-8 border border-white/5 overflow-hidden shadow-2xl">
            <div className="flex justify-between items-start mb-12">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em]">Економія часу</p>
                    <h3 className="text-xl font-black italic uppercase text-white">Гонка до свободи</h3>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-[#FDB931] uppercase tracking-tighter">Мета: {goal.toLocaleString()} $</span>
                </div>
            </div>

            <div className="h-[240px] w-full relative">
                {/* SVG Фигурная скобка (The Bracket) */}
                <div className="absolute top-0 left-[15%] right-[15%] h-[40px] pointer-events-none z-20">
                    <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path 
                            d="M 5,30 Q 5,5 50,5 Q 95,5 95,30" 
                            fill="none" 
                            stroke="#FDB931" 
                            strokeWidth="1.5" 
                            strokeDasharray="4 3"
                            opacity="0.6"
                        />
                    </svg>
                    <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 bg-[#FDB931] px-4 py-2 rounded-full shadow-[0_10px_20px_rgba(253,185,49,0.4)] border border-black/10">
                        <span className="text-[11px] font-black text-black whitespace-nowrap italic uppercase">
                            − {timeSaved} РОКІВ ЖИТТЯ
                        </span>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 30, right: 20, left: 20, bottom: 0 }}>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#555', fontSize: 10, fontWeight: 'bold', dy: 10 }}
                        />
                        <YAxis hide domain={[0, 'dataMax + 5']} />
                        <Bar dataKey="years" radius={[12, 12, 12, 12]} barSize={55}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList 
                                dataKey="years" 
                                position="top" 
                                formatter={(v: any) => typeof v === 'number' ? `${v.toFixed(1)} р.` : ''}
                                style={{ fill: '#fff', fontSize: 12, fontWeight: '900' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Легенда */}
            <div className="flex justify-around mt-8 border-t border-white/5 pt-6">
                {data.map(s => (
                    <div key={s.name} className="flex flex-col items-center gap-1">
                        <div style={{ color: s.color }} className="mb-1 opacity-80">{s.icon}</div>
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{s.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

TimeSavingChart.displayName = 'TimeSavingChart';
export default TimeSavingChart;