import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, Info, Edit2 } from 'lucide-react';
import clsx from 'clsx';

// --- КОМПАКТНИЙ БЛОК ВВОДУ (3 РЯДКИ В ОДНОМУ) ---
export const NumericalInputsHUD = ({ config, onOpenSelector }: any) => (
    <div className="bg-[#161618] border border-white/10 rounded-[1.5rem] overflow-hidden divide-y divide-white/5 shadow-2xl">
        {[
            { label: 'Вкладаю відразу', key: 'principal', value: config.principal, color: 'text-white' },
            { label: 'Додаю в місяць', key: 'reinvest', value: config.reinvest, color: 'text-white' },
            { label: 'Фінансова ціль', key: 'goal', value: config.goal, color: 'text-[#FFB800]' },
        ].map((item) => (
            <button 
                key={item.key}
                onClick={() => onOpenSelector(item.key)}
                className="w-full px-5 py-3 flex justify-between items-center active:bg-white/[0.02] transition-all"
            >
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{item.label}</span>
                <div className="flex items-center gap-3">
                    <span className={clsx("text-base font-black tracking-tighter", item.color)}>
                        ${item.value.toLocaleString()}
                    </span>
                    <Edit2 size={12} className="text-[#FFB800] opacity-40" />
                </div>
            </button>
        ))}
    </div>
);

// --- ПЕДАЛІ-РЯДКИ (ВЕРТИКАЛЬНИЙ СТЕК) ---
export const PedalList = ({ config, setConfig, onOpenInfo }: any) => {
    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Прибуток', val: 15, icon: <Zap size={14} /> },
        { id: 'boosters', label: 'Бустери', val: 4, icon: <Rocket size={14} /> },
        { id: 'spec', label: 'Спекуляції', val: 15, icon: <BarChart3 size={14} /> },
        { id: 'btc', label: 'Ріст BTC', val: 40, icon: <TrendingUp size={14} /> },
        { id: 'ref', label: 'Мережа', val: 5, icon: <Users size={14} /> },
        { id: 'bonus', label: 'Бонус', val: 10, icon: <Target size={14} /> },
    ];

    const togglePedal = (id: string, value: number) => {
        const current = config.pedals[id];
        setConfig((prev: any) => ({
            ...prev,
            pedals: { ...prev.pedals, [id]: current === 0 ? value : 0 }
        }));
    };

    return (
        <div className="mt-4 space-y-2 pb-6">
            <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Інструменти прискорення</span>
            </div>
            
            {BOOSTER_DEFS.map((booster) => {
                const isActive = config.pedals[booster.id] > 0;
                return (
                    <div 
                        key={booster.id}
                        className={clsx(
                            "relative w-full rounded-full border-2 p-1.5 transition-all duration-500 flex items-center justify-between",
                            isActive 
                                ? "bg-[#FFB800] border-[#FFB800] shadow-[0_5px_15px_rgba(255,184,0,0.2)]" 
                                : "bg-[#161618] border-white/5 opacity-60"
                        )}
                    >
                        <div className="flex items-center gap-3 pl-2">
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                isActive ? "bg-black/10 text-black" : "bg-white/5 text-[#FFB800]"
                            )}>
                                {booster.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className={clsx("text-[11px] font-black uppercase leading-none", isActive ? "text-black" : "text-white/80")}>
                                    {booster.label}
                                </span>
                                <span className={clsx("text-[10px] font-bold", isActive ? "text-black/60" : "text-[#FFB800]")}>
                                    {isActive ? `+${booster.val}%` : `${booster.val}%`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 pr-1">
                            <button 
                                onClick={() => onOpenInfo(booster.id)}
                                className={clsx("p-2 transition-colors", isActive ? "text-black/40" : "text-white/20")}
                            >
                                <Info size={16} />
                            </button>
                            <button 
                                onClick={() => togglePedal(booster.id, booster.val)}
                                className={clsx(
                                    "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                    isActive ? "bg-black text-[#FFB800]" : "bg-white/10 text-white/40"
                                )}
                            >
                                {isActive ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};