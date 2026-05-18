import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, Info, Edit2 } from 'lucide-react';
import clsx from 'clsx';

// --- РОЗМОВНІ ІНПУТИ ---
export const NumericalInputsHUD = ({ config, onOpenSelector }: any) => (
    <div className="space-y-2.5 w-full">
        {[
            { label: 'Вкладаю відразу', key: 'principal', value: config.principal, color: 'text-white' },
            { label: 'Додаю в місяць', key: 'reinvest', value: config.reinvest, color: 'text-white' },
            { label: 'Хочу отримати', key: 'goal', value: config.goal, color: 'text-[#FFB800]' },
        ].map((item) => (
            <button 
                key={item.key}
                onClick={() => onOpenSelector(item.key)}
                className="w-full bg-[#1A1A1E] border border-white/20 rounded-full px-6 py-4 flex justify-between items-center active:scale-[0.98] transition-all shadow-xl"
            >
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{item.label}</span>
                <div className="flex items-center gap-3">
                    <span className={clsx("text-xl font-black tracking-tighter", item.color)}>
                        ${item.value.toLocaleString()}
                    </span>
                    <Edit2 size={14} className="text-[#FFB800] opacity-40" />
                </div>
            </button>
        ))}
    </div>
);

// --- ПЕДАЛІ ON/OFF (З ПОКРАЩЕНОЮ ВИДИМІСТЮ СІРОГО) ---
export const PedalToggles = ({ config, setConfig, onOpenInfo }: any) => {
    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Прибуток', val: 15, icon: <Zap /> },
        { id: 'boosters', label: 'Бустери', val: 4, icon: <Rocket /> },
        { id: 'spec', label: 'Спекуляції', val: 15, icon: <BarChart3 /> },
        { id: 'btc', label: 'Ріст BTC', val: 40, icon: <TrendingUp /> },
        { id: 'ref', label: 'Мережа', val: 5, icon: <Users /> },
        { id: 'bonus', label: 'Бонус', val: 10, icon: <Target /> },
    ];

    const togglePedal = (id: string, value: number) => {
        const current = config.pedals[id];
        setConfig((prev: any) => ({
            ...prev,
            pedals: { ...prev.pedals, [id]: current === 0 ? value : 0 }
        }));
    };

    return (
        <div className="grid grid-cols-2 gap-3 mt-4 pb-10">
            {BOOSTER_DEFS.map((booster) => {
                const isActive = config.pedals[booster.id] > 0;
                return (
                    <div 
                        key={booster.id}
                        className={clsx(
                            "relative rounded-[1.8rem] border-2 p-4 transition-all duration-500 flex flex-col gap-3",
                            isActive 
                                ? "bg-[#FFB800] border-[#FFB800] shadow-[0_0_25px_rgba(255,184,0,0.4)]" 
                                : "bg-[#1A1A1E] border-white/10" // Зроблено світліше і з рамкою
                        )}
                    >
                        <button onClick={() => onOpenInfo(booster.id)} className="absolute top-3 right-3">
                            <Info size={18} className={isActive ? "text-black/40" : "text-white/30"} />
                        </button>

                        <div className="flex flex-col">
                            <span className={clsx("text-[9px] font-black uppercase mb-1 tracking-tight", isActive ? "text-black/70" : "text-white/60")}>
                                {booster.label}
                            </span>
                            <span className={clsx("text-lg font-black leading-none tracking-tighter", isActive ? "text-black" : "text-white")}>
                                {isActive ? `+${booster.val}%` : `${booster.val}%`}
                            </span>
                        </div>

                        <button 
                            onClick={() => togglePedal(booster.id, booster.val)}
                            className={clsx(
                                "w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                isActive 
                                    ? "bg-black text-[#FFB800] border-black" 
                                    : "bg-white/5 text-white/70 border-white/20" // Кнопка OFF тепер чітка
                            )}
                        >
                            {isActive ? 'ON' : 'OFF'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};