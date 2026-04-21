import { useRef } from 'react';
import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, X } from 'lucide-react';
import clsx from 'clsx';

const StaticInputPanel = ({ config, setConfig }: any) => {
    const timerRef = useRef<any>(null);

    const BOOSTER_DEFS = [
        { id: 'yield', label: 'Профіт', icon: <Zap className="w-3.5 h-3.5"/> },
        { id: 'boosters', label: 'Буст.', icon: <Rocket className="w-3.5 h-3.5"/> },
        { id: 'spec', label: 'Спек.', icon: <BarChart3 className="w-3.5 h-3.5"/> },
        { id: 'btc', label: 'BTC', icon: <TrendingUp className="w-3.5 h-3.5"/> },
        { id: 'ref', label: 'Мер.', icon: <Users className="w-3.5 h-3.5"/> },
        { id: 'bonus', label: 'Бонус', icon: <Target className="w-3.5 h-3.5"/> },
    ];

    const updatePedal = (id: string, delta: number) => {
        setConfig((prev: any) => ({
            ...prev,
            pedals: { 
                ...prev.pedals, 
                [id]: Math.min(100, Math.max(0, prev.pedals[id] + delta)) 
            }
        }));
    };

    const startAuto = (id: string) => {
        updatePedal(id, 1);
        timerRef.current = setInterval(() => updatePedal(id, 1), 80);
    };
    const stopAuto = () => { if (timerRef.current) clearInterval(timerRef.current); };

    // Умная очистка и защита от отрицательных чисел
    const handleSafeInput = (key: string, val: string) => {
        const num = parseInt(val.replace(/\D/g, '')) || 0;
        setConfig({ ...config, [key]: Math.max(0, num) });
    };

    return (
        <div className="bg-[#0D0D0E]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <style>{`
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            {/* ИНПУТЫ: СТРОГИЙ КОНТРОЛЬ */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Старт $</span>
                    <input 
                        type="number" 
                        value={config.principal || ''} 
                        placeholder="0" 
                        onChange={(e) => handleSafeInput('principal', e.target.value)} 
                        className="bg-transparent text-white text-[15px] font-black outline-none w-14" 
                    />
                </div>
                <div className="h-6 w-[1px] bg-white/10" />
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Внесок $</span>
                    <input 
                        type="number" 
                        value={config.reinvest || ''} 
                        placeholder="0" 
                        onChange={(e) => handleSafeInput('reinvest', e.target.value)} 
                        className="bg-transparent text-white text-[15px] font-black outline-none w-14" 
                    />
                </div>
                <div className="bg-[#FDB931] px-5 py-2.5 rounded-2xl flex flex-col items-end shadow-lg shadow-[#FDB931]/10">
                    <span className="text-[7px] font-black text-black/40 uppercase tracking-widest mb-0.5">Мета $</span>
                    <input 
                        type="number" 
                        value={config.goal || ''} 
                        placeholder="0" 
                        onChange={(e) => handleSafeInput('goal', e.target.value)} 
                        className="bg-transparent text-black text-[15px] font-black outline-none w-20 text-right" 
                    />
                </div>
            </div>

            {/* БУСТЕРЫ: СВЕТЛО-СЕРОЕ ЗАПОЛНЕНИЕ */}
            <div className="grid grid-cols-3 gap-2.5 p-4 pb-5">
                {BOOSTER_DEFS.map((booster) => {
                    const currentVal = config.pedals[booster.id] || 0;
                    const active = currentVal > 0;
                    
                    return (
                        <button 
                            key={booster.id}
                            onMouseDown={() => startAuto(booster.id)} onMouseUp={stopAuto} onMouseLeave={stopAuto}
                            onTouchStart={() => startAuto(booster.id)} onTouchEnd={stopAuto}
                            className={clsx(
                                "relative aspect-[1.4/1] rounded-2xl border overflow-hidden transition-all duration-300 select-none active:scale-95 flex flex-col items-center justify-center p-1.5",
                                active ? "border-[#FDB931]/40 bg-white/[0.03]" : "border-white/5 bg-transparent"
                            )}
                        >
                            {/* ЖИДКОЕ ЗАПОЛНЕНИЕ (Светло-серый градиент) */}
                            <div 
                                className="absolute inset-y-0 left-0 bg-white/10 transition-all duration-300 ease-out z-0"
                                style={{ width: `${currentVal}%` }}
                            />

                            {/* КОНТЕНТ (Поверх заливки) */}
                            <div className={clsx("relative z-10 flex items-center gap-1.5 mb-1 transition-colors", active ? "text-white" : "text-white/20")}>
                                {booster.icon}
                                <span className="text-[8px] font-black uppercase truncate leading-none tracking-tight">{booster.label}</span>
                            </div>
                            <span className={clsx("relative z-10 text-[14px] font-black leading-none transition-colors", active ? "text-[#FDB931]" : "text-white/10")}>
                                {currentVal}%
                            </span>

                            {/* Быстрый сброс */}
                            {active && (
                                <div 
                                    onClick={(e) => { e.stopPropagation(); setConfig({...config, pedals: {...config.pedals, [booster.id]: 0}}); }} 
                                    className="absolute top-1 right-1 z-20 text-white/10 hover:text-white/40 p-1"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <p className="text-center pb-4 text-[7px] font-black text-white/10 uppercase tracking-[0.4em]">Затисніть для росту доходності</p>
        </div>
    );
};

export default StaticInputPanel;