import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, Info, Edit2 } from 'lucide-react';
import clsx from 'clsx';

// --- БЛОК ВВОДУ: СТИСНУТИЙ СТЕК (#141414) ---
export const NumericalInputsHUD = ({ config, onOpenSelector }: any) => (
    <div className="bg-[#141414] border border-[#222222] rounded-xl overflow-hidden divide-y divide-[#222222] shadow-2xl">
        {[
            { label: 'Вкладаю відразу', key: 'principal', value: config.principal, color: 'text-white' },
            { label: 'Додаю в місяць', key: 'reinvest', value: config.reinvest, color: 'text-white' },
            { label: 'Хочу отримати', key: 'goal', value: config.goal, color: 'text-[#FFB700]' },
        ].map((item) => (
            <button 
                key={item.key}
                onClick={() => onOpenSelector(item.key)}
                className="w-full px-5 py-3.5 flex justify-between items-center active:bg-white/[0.02] transition-all"
            >
                <span className="text-[13px] font-medium text-[#808080] uppercase tracking-wide">{item.label}</span>
                <div className="flex items-center gap-3">
                    <span className={clsx("text-lg font-bold tracking-tight", item.color)}>
                        ${item.value.toLocaleString()}
                    </span>
                    <Edit2 size={14} className="text-[#FFB700] opacity-40" />
                </div>
            </button>
        ))}
    </div>
);

// --- ПЕДАЛІ: ІНСТРУМЕНТАЛЬНА ПАНЕЛЬ (52px) ---
export const PedalList = ({ config, setConfig, onOpenInfo }: any) => {
    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Прибуток', val: 15, icon: <Zap size={16} /> },
        { id: 'boosters', label: 'Бустери', val: 4, icon: <Rocket size={16} /> },
        { id: 'spec', label: 'Спекуляції', val: 15, icon: <BarChart3 size={16} /> },
        { id: 'btc', label: 'Ріст BTC', val: 40, icon: <TrendingUp size={16} /> },
        { id: 'ref', label: 'Мережа', val: 5, icon: <Users size={16} /> },
        { id: 'bonus', label: 'Бонус', val: 10, icon: <Target size={16} /> },
    ];

    const togglePedal = (id: string, value: number) => {
        const current = config.pedals[id];
        setConfig((prev: any) => ({
            ...prev,
            pedals: { ...prev.pedals, [id]: current === 0 ? value : 0 }
        }));
    };

    return (
        <div className="mt-4 space-y-2">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#808080] ml-1 mb-2">
                Параметри прискорення
            </p>
            {BOOSTER_DEFS.map((booster) => {
                const isActive = config.pedals[booster.id] > 0;
                return (
                    <div 
                        key={booster.id}
                        className={clsx(
                            "h-[52px] w-full rounded-xl border transition-all duration-500 flex items-center justify-between px-4",
                            isActive 
                                ? "bg-[#141414] border-[#FFB700] shadow-[0_0_15px_rgba(255,183,0,0.1)]" 
                                : "bg-[#141414] border-[#222222] opacity-60"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "transition-all duration-500",
                                isActive ? "text-[#FFB700] drop-shadow-[0_0_8px_#FFB700]" : "text-[#555555]"
                            )}>
                                {booster.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className={clsx("text-[13px] font-bold leading-none", isActive ? "text-white" : "text-[#555555]")}>
                                    {booster.label}
                                </span>
                                <span className={clsx("text-[11px] font-medium mt-0.5", isActive ? "text-[#FFB700]" : "text-[#555555]")}>
                                    {isActive ? `+${booster.val}%` : `${booster.val}%`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => onOpenInfo(booster.id)} className="p-1 text-[#555555] hover:text-white transition-colors">
                                <Info size={14} />
                            </button>
                            {/* TOGGLE SWITCH */}
                            <button 
                                onClick={() => togglePedal(booster.id, booster.val)}
                                className={clsx(
                                    "w-10 h-5 rounded-full relative transition-all duration-300 border",
                                    isActive ? "bg-[#FFB700] border-[#FFB700]" : "bg-[#222222] border-[#222222]"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all duration-300",
                                    isActive ? "left-[22px]" : "left-1"
                                )} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};