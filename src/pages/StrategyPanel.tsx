import { useRef, useMemo } from 'react';
import { X, Zap, TrendingUp, Target, Users, BarChart3, Rocket } from 'lucide-react';
import clsx from 'clsx';

const getQuickForecast = (p: number, r: number, goal: number, pedals: Record<string, number>) => {
    const apy = Object.values(pedals).reduce((a, b) => a + b, 0);
    if (p + r <= 0) return { years: '—', date: 'Дані...' };
    if (p >= goal) return { years: '0', date: 'Готово' };
    
    let balance = p;
    let months = 0;
    const monthlyRate = (apy / 100) / 12;
    while (balance < goal && months < 480) {
        balance = balance * (1 + monthlyRate) + r;
        months++;
    }
    const years = (months / 12).toFixed(1);
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);
    const dateString = targetDate.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }).replace('.', '');
    
    return { years, date: dateString };
};

const StrategyPanel = ({ config, setConfig, setIsOpen, setHasInteracted }: any) => {
    const timerRef = useRef<any>(null);
    const forecast = useMemo(() => 
        getQuickForecast(config.principal, config.reinvest, config.goal, config.pedals), 
    [config]);

    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Приб.', icon: <Zap className="w-3.5 h-3.5"/> },
        { id: 'boosters', label: 'Буст.', icon: <Rocket className="w-3.5 h-3.5"/> },
        { id: 'spec', label: 'Спек.', icon: <BarChart3 className="w-3.5 h-3.5"/> },
        { id: 'btc', label: 'BTC', icon: <TrendingUp className="w-3.5 h-3.5"/> },
        { id: 'ref', label: 'Мер.', icon: <Users className="w-3.5 h-3.5"/> },
        { id: 'bonus', label: 'Бонус', icon: <Target className="w-3.5 h-3.5"/> },
    ];

    const updateBoosterValue = (id: string, delta: number) => {
        setHasInteracted(true);
        setConfig((prev: any) => ({
            ...prev,
            pedals: { ...prev.pedals, [id]: Math.min(100, Math.max(0, prev.pedals[id] + delta)) }
        }));
    };

    const startAutoChange = (id: string, delta: number) => {
        updateBoosterValue(id, delta);
        timerRef.current = setInterval(() => updateBoosterValue(id, delta), 80);
    };

    const stopAutoChange = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const handleInputChange = (key: string, val: string) => {
        const num = parseInt(val.replace(/\D/g, '')) || 0;
        setConfig({ ...config, [key]: num });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsOpen(false)}>
            <style>{`
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
            
            <div 
                className="bg-[#0D0D0E] border-t border-white/10 w-full max-w-md rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ВЕРХНЯЯ СТРОКА (Плотная) */}
                <div className="flex justify-between items-center px-5 pt-4 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">Параметри</span>
                        <div className="h-2.5 w-[1px] bg-white/10" />
                        <span className="text-[10px] font-black text-[#FDB931] uppercase tracking-tight leading-none">
                            {forecast.date} <span className="opacity-50 ml-0.5">({forecast.years} р.)</span>
                        </span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ИНПУТЫ (Минимизированные) */}
                <div className="flex justify-between items-center px-5 py-2.5 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-bold text-white/20 uppercase">Старт $</span>
                        <input 
                            type="number" 
                            value={config.principal || ''} 
                            placeholder="0"
                            onChange={(e) => handleInputChange('principal', e.target.value)}
                            className="bg-transparent text-white text-[12px] font-black outline-none w-12" 
                        />
                    </div>
                    
                    <div className="h-5 w-[1px] bg-white/5" />

                    <div className="flex flex-col">
                        <span className="text-[7px] font-bold text-white/20 uppercase">Внесок $</span>
                        <input 
                            type="number" 
                            value={config.reinvest || ''} 
                            placeholder="0"
                            onChange={(e) => handleInputChange('reinvest', e.target.value)}
                            className="bg-transparent text-white text-[12px] font-black outline-none w-12" 
                        />
                    </div>

                    <div className="bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/5 flex flex-col items-end">
                        <span className="text-[7px] font-bold text-[#FDB931] uppercase tracking-wider">Мета $</span>
                        <input 
                            type="number" 
                            value={config.goal || ''} 
                            placeholder="0"
                            onChange={(e) => handleInputChange('goal', e.target.value)}
                            className="bg-transparent text-white text-[13px] font-black outline-none w-16 text-right" 
                        />
                    </div>
                </div>

                {/* СЕТКА БУСТЕРОВ (Компактная) */}
                <div className="px-4 py-4">
                    <div className="grid grid-cols-3 gap-2">
                        {BOOSTER_DEFS.map((booster) => {
                            const val = config.pedals[booster.id] || 0;
                            const active = val > 0;
                            return (
                                <button 
                                    key={booster.id}
                                    onMouseDown={() => startAutoChange(booster.id, 1)}
                                    onMouseUp={stopAutoChange} onMouseLeave={stopAutoChange}
                                    onTouchStart={() => startAutoChange(booster.id, 1)}
                                    onTouchEnd={stopAutoChange}
                                    className={clsx(
                                        "aspect-[1.3/1] rounded-2xl border transition-all duration-200 select-none active:scale-95 flex flex-col items-center justify-center p-1.5",
                                        active ? "bg-[#FDB931] border-[#FDB931] shadow-lg shadow-[#FDB931]/10" : "bg-white/[0.02] border-white/5 opacity-50"
                                    )}
                                >
                                    <div className={clsx("flex items-center gap-1 mb-0.5", active ? "text-black/70" : "text-white/30")}>
                                        {booster.icon}
                                        <span className="text-[7px] font-black uppercase tracking-tighter">{booster.label}</span>
                                    </div>
                                    <span className={clsx("text-sm font-black tracking-tighter leading-none", active ? "text-black" : "text-white/20")}>
                                        {val}%
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ПОДВАЛ */}
                <div className="text-center pb-5 opacity-20 text-[7px] font-black uppercase tracking-[0.2em]">
                    Затисніть плитку для росту
                </div>
            </div>
        </div>
    );
};

export default StrategyPanel;