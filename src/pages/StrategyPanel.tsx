import { X, Calculator, TrendingUp, Target, Info, Calendar, Rocket } from 'lucide-react';

const getQuickForecast = (p: number, r: number, goal: number, pedals: Record<string, number>) => {
    const apy = Object.values(pedals).reduce((a, b) => a + b, 0);
    if (p + r <= 0) return { years: 0, status: 'input_needed' };
    if (p >= goal) return { years: 0, status: 'reached' };
    
    let balance = p;
    let months = 0;
    const monthlyRate = (apy / 100) / 12;

    while (balance < goal && months < 480) {
        balance = balance * (1 + monthlyRate) + r;
        months++;
    }
    return { years: (months / 12).toFixed(1), status: 'calculating' };
};

const StrategyPanel = ({ config, setConfig, setIsOpen, setHasInteracted }: any) => {
    const forecast = getQuickForecast(config.principal, config.reinvest, config.goal, config.pedals);

    const pedalLabels: Record<string, { label: string, sub: string }> = {
        yield: { label: 'Базова прибутковість', sub: 'Стабільний дохід від стейкінгу Tyrex' },
        boosters: { label: 'Бустери (Boosters)', sub: 'Множник від активності в пулах' },
        spec: { label: 'Спекулятивний дохід', sub: 'Прибуток від торгових операцій' },
        btc: { label: 'Ріст ринку BTC', sub: 'Очікувана зміна капіталізації BTC' },
        ref: { label: 'Партнерська програма', sub: 'Бонуси за розвиток ком’юніті' }
    };

    const updateValue = (key: string, val: number) => {
        setHasInteracted(true);
        setConfig((prev: any) => ({ ...prev, [key]: val }));
    };

    const updatePedal = (key: string, val: number) => {
        setHasInteracted(true);
        setConfig((prev: any) => ({
            ...prev,
            pedals: { ...prev.pedals, [key]: val }
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsOpen(false)}>
            <div 
                className="bg-[#0D0D0E] border-t border-white/10 w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[90vh] no-scrollbar" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 px-2">
                    <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-[#FDB931]" />
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Стратегія росту</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="bg-gradient-to-br from-[#FDB931] to-[#FF9500] p-5 rounded-[2rem] mb-8 shadow-xl text-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest">Твій результат</p>
                            {forecast.status === 'input_needed' ? (
                                <h2 className="text-xl font-black uppercase italic tracking-tighter">Чекаю на дані...</h2>
                            ) : (
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                                    {forecast.years} років <span className="text-xs opacity-70">до цілі</span>
                                </h2>
                            )}
                        </div>
                        <Calendar className="w-8 h-8 opacity-20" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-black/10">
                        <p className="text-[11px] font-bold leading-tight opacity-80 italic">
                            {forecast.status === 'input_needed' 
                                ? 'Вкажи суму старту та доінвесту, щоб активувати прогноз.' 
                                : `З поточною стратегією капітал у $${config.goal.toLocaleString()} буде сформовано до ${2026 + Math.ceil(Number(forecast.years))} року.`}
                        </p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Основні вкладення</p>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Старт', key: 'principal', icon: <Calculator className="w-3 h-3"/> },
                            { label: 'Доінвест', key: 'reinvest', icon: <TrendingUp className="w-3 h-3"/> },
                            { label: 'Мета', key: 'goal', icon: <Target className="w-3 h-3"/> }
                        ].map((item) => (
                            <div key={item.key} className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl">
                                <label className="flex items-center gap-1.5 text-[9px] font-black text-white/40 uppercase mb-2">
                                    {item.icon} {item.label}
                                </label>
                                <div className="flex items-center gap-1">
                                    <span className="text-white/20 text-[10px] font-bold">$</span>
                                    <input 
                                        type="number" 
                                        value={config[item.key as keyof typeof config] as number} 
                                        onChange={(e) => updateValue(item.key, Number(e.target.value))} 
                                        className="w-full bg-transparent text-sm font-black text-white outline-none focus:text-[#FDB931]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Педалі прискорення</p>
                    {Object.entries(config.pedals as Record<string, number>).map(([key, val]) => (
                        <div key={key} className="bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem]">
                            <div className="flex justify-between items-start mb-1">
                                <div className="space-y-0.5">
                                    <h4 className="text-[11px] font-black uppercase text-white/80 flex items-center gap-2">
                                        {pedalLabels[key].label}
                                        <Info className="w-3 h-3 text-white/20" />
                                    </h4>
                                    <p className="text-[9px] text-white/30 font-medium italic">
                                        {pedalLabels[key].sub}
                                    </p>
                                </div>
                                <span className="text-[12px] font-black text-[#FDB931] bg-[#FDB931]/10 px-2 py-0.5 rounded-lg">
                                    {val}%
                                </span>
                            </div>
                            <input 
                                type="range" min="0" max="100" value={val as number} 
                                onChange={(e) => updatePedal(key, Number(e.target.value))} 
                                className="w-full h-1.5 accent-[#FDB931] bg-white/5 rounded-full appearance-none cursor-pointer mt-4" 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StrategyPanel;