import { Zap, TrendingUp, Target, Users, BarChart3, Rocket } from 'lucide-react';
import clsx from 'clsx';

// Часть 1: Поля ввода (вызывается в верхней части экрана)
export const NumericalInputs = ({ config, handleInput }: any) => (
    <div className="grid grid-cols-3 gap-2 bg-[#0D0D0E] border border-white/10 rounded-2xl p-3 shadow-xl">
        <div className="flex flex-col">
            <span className="text-[7px] font-black text-white/30 uppercase mb-1">Старт $</span>
            <input type="number" value={config.principal || ''} placeholder="500" onChange={(e) => handleInput('principal', e.target.value)} className="bg-transparent text-white text-base font-black outline-none w-full" />
        </div>
        <div className="flex flex-col border-x border-white/10 px-2">
            <span className="text-[7px] font-black text-white/30 uppercase mb-1">Доінвест $</span>
            <input type="number" value={config.reinvest || ''} placeholder="50" onChange={(e) => handleInput('reinvest', e.target.value)} className="bg-transparent text-white text-base font-black outline-none w-full" />
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-[#FDB931] uppercase mb-1">ЦІЛЬ $</span>
            <input type="number" value={config.goal || ''} placeholder="2000" onChange={(e) => handleInput('goal', e.target.value)} className="bg-transparent text-[#FDB931] text-base font-black outline-none w-full text-right" />
        </div>
    </div>
);

// Часть 2: Педали (вызывается в нижней части экрана)
export const PedalButtons = ({ config, setConfig }: any) => {
    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Приб.', icon: <Zap className="w-4 h-4"/>, val: 15 },
        { id: 'boosters', label: 'Буст.', icon: <Rocket className="w-4 h-4"/>, val: 4 },
        { id: 'spec', label: 'Спек.', icon: <BarChart3 className="w-4 h-4"/>, val: 15 },
        { id: 'btc', label: 'BTC', icon: <TrendingUp className="w-4 h-4"/>, val: 40 },
        { id: 'ref', label: 'Мер.', icon: <Users className="w-4 h-4"/>, val: 5 },
        { id: 'bonus', label: 'Бонус', icon: <Target className="w-4 h-4"/>, val: 10 },
    ];

    const togglePedal = (id: string, value: number) => {
        const current = config.pedals[id];
        setConfig({
            ...config,
            pedals: { ...config.pedals, [id]: current === 0 ? value : 0 }
        });
    };

    return (
        <div className="grid grid-cols-3 gap-2 mt-4">
            {BOOSTER_DEFS.map((booster) => {
                const isActive = config.pedals[booster.id] > 0;
                return (
                    <button 
                        key={booster.id}
                        onClick={() => togglePedal(booster.id, booster.val)}
                        className={clsx(
                            "relative aspect-[1.3/1] rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-2 shadow-lg active:scale-90",
                            isActive 
                                ? "border-[#FDB931] bg-[#FDB931] text-black" 
                                : "border-white/10 bg-white/5 text-white/40"
                        )}
                    >
                        <div className={clsx("mb-1", isActive ? "text-black" : "text-[#FDB931]")}>
                            {booster.icon}
                        </div>
                        <span className="text-[8px] font-black uppercase leading-none mb-1">{booster.label}</span>
                        <span className="text-[12px] font-black leading-none">
                            {isActive ? `+${booster.val}%` : `${booster.val}%`}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};