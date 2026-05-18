import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, Edit2, Info } from 'lucide-react';
import clsx from 'clsx';

// --- РАЗГОВОРНЫЕ ИНПУТЫ (КАК НА РИСУНКЕ) ---
export const NumericalInputsHUD = ({ config, onOpenSelector }: any) => (
    <div className="space-y-3 w-full">
        {[
            { label: 'Вкладаю відразу', key: 'principal', value: config.principal },
            { label: 'Додаю в місяць', key: 'reinvest', value: config.reinvest },
            { label: 'Хочу отримати', key: 'goal', value: config.goal, isGoal: true },
        ].map((item) => (
            <button 
                key={item.key}
                onClick={() => onOpenSelector(item.key)}
                className="w-full bg-[#0D0D0E] border border-white/10 rounded-full px-6 py-4 flex justify-between items-center active:scale-[0.98] transition-all shadow-xl"
            >
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{item.label}</span>
                <div className="flex items-center gap-3">
                    <span className={clsx("text-xl font-black tracking-tighter", item.isGoal ? "text-[#FFB800]" : "text-white")}>
                        ${item.value.toLocaleString()}
                    </span>
                    <Edit2 size={14} className="opacity-20" />
                </div>
            </button>
        ))}
    </div>
);

// --- ПЕДАЛИ С ВКЛЮЧАЛКАМИ (2 СТОЛБЦА) ---
export const PedalToggles = ({ config, setConfig, onOpenInfo }: any) => {
    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Прибуток', val: 15, icon: <Zap /> },
        { id: 'boosters', label: 'Бустери', val: 4, icon: <Rocket /> },
        { id: 'spec', label: 'Спекуляції', val: 15, icon: <BarChart3 /> },
        { id: 'btc', label: 'Ріст BTC', val: 40, icon: <TrendingUp /> },
        { id: 'ref', label: 'Мережа', val: 5, icon: <Users /> },
        { id: 'bonus', label: 'Спец. Бонус', val: 10, icon: <Target /> },
    ];

    const togglePedal = (id: string, value: number) => {
        const current = config.pedals[id];
        setConfig({ ...config, pedals: { ...config.pedals, [id]: current === 0 ? value : 0 } });
    };

    return (
        <div className="grid grid-cols-2 gap-3 mt-6">
            {BOOSTER_DEFS.map((booster) => {
                const isActive = config.pedals[booster.id] > 0;
                return (
                    <div 
                        key={booster.id}
                        className={clsx(
                            "relative rounded-[1.8rem] border-2 p-4 transition-all duration-500 flex flex-col gap-3",
                            isActive 
                                ? "bg-[#FFB800] border-[#FFB800] shadow-[0_0_30px_rgba(255,184,0,0.3)]" 
                                : "bg-[#0D0D0E] border-white/5 opacity-60"
                        )}
                    >
                        {/* Кнопка Info для попапа */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onOpenInfo(booster.id); }}
                            className="absolute top-3 right-3 opacity-30 hover:opacity-100"
                        >
                            <Info size={14} className={isActive ? "text-black" : "text-white"} />
                        </button>

                        <div className="flex flex-col">
                            <span className={clsx("text-[9px] font-black uppercase mb-1", isActive ? "text-black/60" : "text-white/40")}>
                                {booster.label}
                            </span>
                            <span className={clsx("text-lg font-black leading-none", isActive ? "text-black" : "text-white")}>
                                {isActive ? `+${booster.val}%` : `${booster.val}%`}
                            </span>
                        </div>

                        {/* Тот самый переключатель ON/OFF */}
                        <button 
                            onClick={() => togglePedal(booster.id, booster.val)}
                            className={clsx(
                                "w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                isActive 
                                    ? "bg-black text-[#FFB800] border-black" 
                                    : "bg-white/5 text-white/40 border-white/10"
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