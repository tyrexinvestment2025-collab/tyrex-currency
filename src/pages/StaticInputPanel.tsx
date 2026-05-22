import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, Info, Edit2 } from 'lucide-react';
import clsx from 'clsx';

// --- РОЗМОВНІ ІНПУТИ (КАПСУЛИ ВВОДУ) ---
export const NumericalInputsHUD = ({ config, onOpenSelector }: any) => (
    <div className="space-y-2 w-full">
        {[
            { label: 'Вкладаю відразу', key: 'principal', value: config.principal, color: 'text-white' },
            { label: 'Додаю в місяць', key: 'reinvest', value: config.reinvest, color: 'text-white' },
            { label: 'Хочу отримати', key: 'goal', value: config.goal, color: 'text-[#FFB800]' },
        ].map((item) => (
            <button 
                key={item.key}
                onClick={() => onOpenSelector(item.key)}
                className="w-full bg-[#161618] border border-white/10 rounded-2xl px-5 py-4 flex justify-between items-center active:scale-[0.98] transition-all"
            >
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.label}</span>
                <div className="flex items-center gap-3">
                    <span className={clsx("text-xl font-black tracking-tighter", item.color)}>
                        ${item.value.toLocaleString()}
                    </span>
                    <Edit2 size={14} className="text-[#FFB800] opacity-30" />
                </div>
            </button>
        ))}
    </div>
);

// --- ПЕДАЛІ-КАПСУЛИ (ГОРИЗОНТАЛЬНИЙ РЯД) ---
export const PedalCapsules = ({ config, setConfig, onOpenInfo }: any) => {
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
        <div className="w-full mt-4">
            <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Інструменти прискорення</span>
                <span className="text-[8px] font-medium text-white/20 italic text-right leading-tight">Гортайте горизонтально →</span>
            </div>
            
            {/* Горизонтальний контейнер зі скролом */}
            <div className="flex overflow-x-auto gap-3 no-scrollbar pb-6 pt-1 px-1">
                {BOOSTER_DEFS.map((booster) => {
                    const isActive = config.pedals[booster.id] > 0;
                    return (
                        <div 
                            key={booster.id}
                            className={clsx(
                                "relative flex-shrink-0 min-w-[180px] rounded-full border-2 p-1.5 transition-all duration-500 flex items-center justify-between",
                                isActive 
                                    ? "bg-[#FFB800] border-[#FFB800] shadow-[0_10px_25px_rgba(255,184,0,0.3)]" 
                                    : "bg-[#161618] border-white/10 opacity-80"
                            )}
                        >
                            {/* Текст та назва */}
                            <div className="flex items-center gap-3 pl-3">
                                <div className={clsx(
                                    "flex flex-col",
                                    isActive ? "text-black" : "text-white"
                                )}>
                                    <span className="text-[12px] font-black uppercase leading-none tracking-tight">
                                        {booster.label}
                                    </span>
                                    <span className={clsx(
                                        "text-[10px] font-bold mt-0.5",
                                        isActive ? "text-black/60" : "text-[#FFB800]"
                                    )}>
                                        {isActive ? `+${booster.val}%` : `${booster.val}%`}
                                    </span>
                                </div>
                            </div>

                            {/* Кнопка Info та перемикач */}
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => onOpenInfo(booster.id)}
                                    className={clsx(
                                        "p-2 rounded-full transition-colors",
                                        isActive ? "text-black/30 hover:text-black" : "text-white/20 hover:text-white"
                                    )}
                                >
                                    <Info size={16} />
                                </button>
                                
                                <button 
                                    onClick={() => togglePedal(booster.id, booster.val)}
                                    className={clsx(
                                        "px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        isActive 
                                            ? "bg-black text-[#FFB800]" 
                                            : "bg-white/10 text-white/40 border border-white/5"
                                    )}
                                >
                                    {isActive ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};