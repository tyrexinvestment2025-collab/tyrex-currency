import { Zap, TrendingUp, Target, Users, BarChart3, Rocket } from 'lucide-react';
import clsx from 'clsx';

const StaticInputPanel = ({ config, setConfig }: any) => {
    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Приб.', icon: <Zap className="w-3 h-3"/>, val: 15 },
        { id: 'boosters', label: 'Буст.', icon: <Rocket className="w-3 h-3"/>, val: 4 },
        { id: 'spec', label: 'Спек.', icon: <BarChart3 className="w-3 h-3"/>, val: 15 },
        { id: 'btc', label: 'BTC', icon: <TrendingUp className="w-3 h-3"/>, val: 40 },
        { id: 'ref', label: 'Мер.', icon: <Users className="w-3 h-3"/>, val: 5 },
        { id: 'bonus', label: 'Бонус', icon: <Target className="w-3 h-3"/>, val: 10 },
    ];

    const togglePedal = (id: string, value: number) => {
        const current = config.pedals[id];
        setConfig({
            ...config,
            pedals: { ...config.pedals, [id]: current === 0 ? value : 0 }
        });
    };

    const handleInput = (key: string, val: string) => {
        const num = parseInt(val.replace(/\D/g, '')) || 0;
        setConfig({ ...config, [key]: Math.max(0, num) });
    };

    return (
        <div className="bg-[#0D0D0E]/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {/* INPUTS HUD */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-tighter mb-1">Старт $</span>
                    <input type="number" value={config.principal || ''} placeholder="500" onChange={(e) => handleInput('principal', e.target.value)} className="bg-transparent text-white text-[15px] font-black outline-none w-14" />
                </div>
                <div className="h-6 w-[1px] bg-white/10" />
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-tighter mb-1">Доінвест $</span>
                    <input type="number" value={config.reinvest || ''} placeholder="50" onChange={(e) => handleInput('reinvest', e.target.value)} className="bg-transparent text-white text-[15px] font-black outline-none w-14" />
                </div>
                <div className="bg-[#FDB931] px-5 py-2.5 rounded-2xl flex flex-col items-end">
                    <span className="text-[7px] font-black text-black/40 uppercase tracking-widest mb-0.5">ЦІЛЬ $</span>
                    <input type="number" value={config.goal || ''} placeholder="2000" onChange={(e) => handleInput('goal', e.target.value)} className="bg-transparent text-black text-[15px] font-black outline-none w-20 text-right" />
                </div>
            </div>

            {/* PEDALS GRID */}
            <div className="grid grid-cols-3 gap-2.5 p-4 pb-5">
                {BOOSTER_DEFS.map((booster) => {
                    const isActive = config.pedals[booster.id] > 0;
                    return (
                        <button 
                            key={booster.id}
                            onClick={() => togglePedal(booster.id, booster.val)}
                            className={clsx(
                                "relative aspect-[1.4/1] rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center p-1.5",
                                isActive ? "border-[#FDB931] bg-white/5" : "border-white/5 opacity-40 grayscale"
                            )}
                        >
                            <div className="absolute inset-y-0 left-0 bg-white/10 transition-all duration-300 ease-out z-0" style={{ width: isActive ? '100%' : '0%' }} />
                            <div className={clsx("relative z-10 flex items-center gap-1.5 mb-1 transition-colors", isActive ? "text-white" : "text-white/20")}>
                                {booster.icon}
                                <span className="text-[8px] font-black uppercase truncate leading-none tracking-tight">{booster.label}</span>
                            </div>
                            <span className={clsx("relative z-10 text-[14px] font-black leading-none transition-colors", isActive ? "text-[#FDB931]" : "text-white/10")}>
                                {isActive ? booster.val : 0}%
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StaticInputPanel;