import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, Info, Edit2 } from 'lucide-react';
import clsx from 'clsx';

// --- ЖОВТІ ІНПУТИ (ГОЛОВНИЙ АКЦЕНТ) ---
export const NumericalInputsHUD = ({ config, onOpenSelector }: any) => (
    <div className="space-y-1.5 w-full">
        {[
            { label: 'Вкладаю відразу', key: 'principal', value: config.principal },
            { label: 'Додаю в місяць', key: 'reinvest', value: config.reinvest },
            { label: 'Хочу отримати', key: 'goal', value: config.goal },
        ].map((item) => (
            <button 
                key={item.key}
                onClick={() => onOpenSelector(item.key)}
                className="w-full bg-[#FFB800] border border-[#FFB800] rounded-full px-6 py-2.5 flex justify-between items-center active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(255,184,0,0.2)]"
            >
                <span className="text-[10px] font-black uppercase tracking-tighter text-black/50">{item.label}</span>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black tracking-tighter text-black">
                        ${item.value.toLocaleString()}
                    </span>
                    <Edit2 size={14} className="text-black opacity-30" />
                </div>
            </button>
        ))}
    </div>
);

// --- СІРІ ПЕДАЛІ З ЖОВТОЮ РАМКОЮ (ПРИ НАТИСКАННІ) ---
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
        <div className="space-y-2.5 w-full">
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Інструменти прискорення</span>
            </div>
            
            {BOOSTER_DEFS.map((booster) => {
                const isActive = config.pedals[booster.id] > 0;
                return (
                    <div 
                        key={booster.id}
                        className={clsx(
                            "w-full rounded-full border-2 p-1.5 transition-all duration-300 flex items-center justify-between",
                            "bg-[#1A1A1E]", // Завжди сірий фон
                            isActive 
                                ? "border-[#FFB800] shadow-[0_5px_15px_rgba(255,184,0,0.1)]" 
                                : "border-white/5 opacity-80"
                        )}
                    >
                        <div className="flex items-center gap-3 pl-2">
                            <div className={clsx(
                                "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                                isActive ? "bg-[#FFB800] text-black" : "bg-white/5 text-white/30"
                            )}>
                                {booster.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className={clsx("text-[11px] font-black uppercase leading-none tracking-tight", isActive ? "text-white" : "text-white/40")}>
                                    {booster.label}
                                </span>
                                <span className={clsx("text-[10px] font-bold", isActive ? "text-[#FFB800]" : "text-white/20")}>
                                    {isActive ? `+${booster.val}%` : `${booster.val}%`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 pr-1">
                            <button 
                                onClick={() => onOpenInfo(booster.id)}
                                className={clsx("p-2 transition-colors", isActive ? "text-[#FFB800]" : "text-white/20")}
                            >
                                <Info size={16} />
                            </button>
                            <button 
                                onClick={() => togglePedal(booster.id, booster.val)}
                                className={clsx(
                                    "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                    isActive 
                                        ? "bg-[#FFB800] text-black border-[#FFB800]" 
                                        : "bg-white/5 text-white/40 border-white/10"
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