import React from 'react';
import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, Edit2 } from 'lucide-react';
import clsx from 'clsx';

// --- ИНТЕРАКТИВНЫЙ HUD ВВОДА ---
export const NumericalInputsHUD = ({ config, onOpenSelector }: any) => (
    <div className="bg-[#0D0D0E] border border-white/20 rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center">
            {/* СТАРТ */}
            <button 
                onClick={() => onOpenSelector('principal')}
                className="flex flex-col flex-1 items-start group active:scale-95 transition-all"
            >
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Старт $</span>
                <div className="flex items-center gap-2">
                    <span className="text-white text-2xl font-black tracking-tighter">{config.principal.toLocaleString()}</span>
                    <Edit2 className="w-3.5 h-3.5 text-[#FFB800] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </button>
            
            <div className="h-10 w-[1px] bg-white/10 mx-2" />

            {/* ВНЕСОК */}
            <button 
                onClick={() => onOpenSelector('reinvest')}
                className="flex flex-col flex-1 items-start group active:scale-95 transition-all px-2"
            >
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Внесок $</span>
                <div className="flex items-center gap-2">
                    <span className="text-white text-2xl font-black tracking-tighter">{config.reinvest.toLocaleString()}</span>
                    <Edit2 className="w-3.5 h-3.5 text-[#FFB800] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </button>

            {/* МЕТА (АКЦЕНТ) */}
            <button 
                onClick={() => onOpenSelector('goal')}
                className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2 flex flex-col items-end group active:scale-95 transition-all shadow-inner"
            >
                <span className="text-[8px] font-black text-[#FFB800] uppercase tracking-[0.2em] mb-1">Мета $</span>
                <div className="flex items-center gap-2">
                    <span className="text-[#FFB800] text-2xl font-black tracking-tighter">{config.goal.toLocaleString()}</span>
                    <Edit2 className="w-3.5 h-3.5 text-[#FFB800] opacity-40" />
                </div>
            </button>
        </div>
    </div>
);

// --- КНОПКИ-ПЕДАЛИ В СТИЛЕ ЭНЕРГО-ЯЧЕЕК ---
export const PedalButtons = ({ config, setConfig }: any) => {
    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Прибуток', icon: Zap, val: 15 },
        { id: 'boosters', label: 'Бустери', icon: Rocket, val: 4 },
        { id: 'spec', label: 'Спекуляції', icon: BarChart3, val: 15 },
        { id: 'btc', label: 'Ріст BTC', icon: TrendingUp, val: 40 },
        { id: 'ref', label: 'Мережа', icon: Users, val: 5 },
        { id: 'bonus', label: 'Бонус', icon: Target, val: 10 },
    ];

    const togglePedal = (id: string, value: number) => {
        const current = config.pedals[id];
        setConfig({ ...config, pedals: { ...config.pedals, [id]: current === 0 ? value : 0 } });
    };

    return (
        <div className="grid grid-cols-3 gap-3.5 mt-6">
            {BOOSTER_DEFS.map((booster) => {
                const isActive = config.pedals[booster.id] > 0;
                return (
                    <button 
                        key={booster.id} 
                        onClick={() => togglePedal(booster.id, booster.val)}
                        className={clsx(
                            "relative aspect-square rounded-[2.2rem] border-2 transition-all duration-500 flex flex-col items-center justify-center p-4 overflow-hidden active:scale-90",
                            isActive 
                                ? "bg-[#FFB800] border-[#FFB800] shadow-[0_0_35px_rgba(255,184,0,0.45)]" 
                                : "bg-[#121214] border-white/10 shadow-none"
                        )}
                    >
                        {/* Внутренний блик для эффекта стекла */}
                        {isActive && <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 blur-xl rounded-full -translate-y-full animate-pulse" />}

                        <div className={clsx(
                            "mb-1 transition-colors duration-300", 
                            isActive ? "text-black" : "text-[#FFB800]"
                        )}>
                            {React.createElement(booster.icon, { size: 20, strokeWidth: 2.5 })}
                        </div>
                        
                        <span className={clsx(
                            "text-[8px] font-black uppercase mb-1 tracking-tighter transition-colors duration-300", 
                            isActive ? "text-black/60" : "text-white/40"
                        )}>
                            {booster.label}
                        </span>

                        <span className={clsx(
                            "text-xl font-black leading-none transition-colors duration-300", 
                            isActive ? "text-black" : "text-white"
                        )}>
                            {isActive ? `+${booster.val}%` : `${booster.val}%`}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};