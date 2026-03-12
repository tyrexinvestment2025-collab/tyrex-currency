import React, { useState, useMemo, useEffect } from 'react';
import { 
    Zap, Landmark, LineChart, Layers, Coins,
    RefreshCw, HelpCircle, MousePointer2,
    Building2, Briefcase, PieChart, Pickaxe, LayoutGrid, Signal
} from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

// Импорт компонентов графиков
import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import StrategyComparisonChart from '../components/charts/StrategyComparisonChart';
import TimeSavingChart from '../components/charts/TimeSavingChart';
import InvestmentStructureChart from '../components/charts/InvestmentStructureChart';
import InfoCard from '../components/common/InfoCard'; // Компонент подсказки

// Импорт математических утилит
import { calculateGrowthPoints } from '../utils/growthMath';
import { generateComparisonData } from '../utils/comparisonMath';
import { calculateStructureData } from '../utils/structureMath';

const CATEGORY_ASSETS = {
    traditional: [
        { id: 'Real Estate', label: 'Недвижимость', icon: Building2 },
        { id: 'Bank Deposit', label: 'Банк', icon: Landmark },
        { id: 'S&P 500', label: 'Акции', icon: LineChart },
        { id: 'Gold', label: 'Золото', icon: Coins },
        { id: 'Business', label: 'Свой бизнес', icon: Briefcase },
        { id: 'Funds', label: 'Инвестфонды', icon: PieChart },
    ],
    crypto: [
        { id: 'Staking', label: 'Стейкинг', icon: Layers },
        { id: 'Mining', label: 'Майнинг', icon: Pickaxe },
        { id: 'Trading', label: 'Трейдинг', icon: MousePointer2 },
        { id: 'Altcoins', label: 'Альткоины', icon: Zap },
        { id: 'Bots', label: 'Боты', icon: LayoutGrid },
        { id: 'Signals', label: 'Сигналы', icon: Signal },
    ]
};

const CHART_HEADERS = {
    radar: { top: 'ВЫГОДА', main: 'СРАВНЕНИЕ АКТИВОВ', desc: 'Смотри, почему классические активы проигрывают твоему алгоритму' },
    growth: { top: 'РОСТ', main: 'ПРОГНОЗ ДОХОДНОСТИ', desc: 'Рассчитай свой путь к финансовой свободе' },
    assets: { top: 'БЕЗОПАСНОСТЬ', main: 'ЗАЩИТА КАПИТАЛА', desc: 'Узнай, как алгоритм защищает тебя от волатильности' },
    time: { top: 'СКОРОСТЬ', main: 'ЭКОНОМИЯ ВРЕМЕНИ', desc: 'Посмотри, сколько лет жизни тебе сбережет автоматизация' },
    struct: { top: 'МАГИЯ', main: 'СОСТАВ КАПИТАЛА', desc: 'Увидь, как проценты превращаются в основной объем средств' }
};

const PEDAL_DESCRIPTIONS: Record<string, string> = {
    yield: 'Base return percentage',
    ref: 'Referral bonus percentage',
    btc: 'BTC allocation percentage',
    boosters: 'Number of active boosters',
    spec: 'Special programs percentage'
};

const AnalyticsScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeChart, setActiveChart] = useState<'radar' | 'growth' | 'assets' | 'time' | 'struct'>('radar');
    
    // Состояния для Радара
    const [activeCategory, setActiveCategory] = useState<'traditional' | 'crypto'>('traditional');
    const [selectedAsset, setSelectedAsset] = useState<string>('Real Estate');
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    
    // Состояния для Захисту
    const [compPeriod, setCompPeriod] = useState<'bear' | 'bull' | 'current'>('current');
    
    // Общие состояния для калькуляторов
    const [pedals, setPedals] = useState({ yield: 15, ref: 5, btc: 40, boosters: 4, spec: 15 });
    const [customBalance, setCustomBalance] = useState<string>('');
    const [customGoal, setCustomGoal] = useState<string>('');
    const [structYears, setStructYears] = useState(3);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await analyticsApi.getDashboard();
                if (res.analytics) {
                    setData(res.analytics);
                    const initialBal = Math.min(150000, Number(res.analytics.currentBalance || 0));
                    setCustomBalance(initialBal.toFixed(2));
                    setCustomGoal(Number(res.analytics.financialGoal || 50000).toString());
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, []);

    // --- ПОДГОТОВКА ДАННЫХ ---
    const radarData = useMemo(() => {
        if (!data) return [];
        const benchmarks = [...data.benchmarks.traditional, ...data.benchmarks.crypto];
        const compareWith = benchmarks.find((b: any) => b.subject === selectedAsset) || benchmarks[0];
        return [
            { subject: 'Доходність', Tyrex: data.userScore.yield, Compare: compareWith.yield || 20 },
            { subject: 'Ліквідність', Tyrex: data.userScore.liquidity, Compare: compareWith.liquidity || 30 },
            { subject: 'Поріг входу', Tyrex: data.userScore.entry, Compare: compareWith.entry || 10 },
            { subject: 'Безпека', Tyrex: data.userScore.safety, Compare: compareWith.safety || 50 },
            { subject: 'Пасивність', Tyrex: data.userScore.passive, Compare: compareWith.passive || 20 },
            { subject: 'Потенціал', Tyrex: data.userScore.growth, Compare: compareWith.growth || 40 },
        ];
    }, [data, selectedAsset]);

    const growthData = useMemo(() => calculateGrowthPoints(Number(customBalance) || 0, pedals, 5), [pedals, customBalance]);
    const comparisonData = useMemo(() => generateComparisonData(compPeriod), [compPeriod]);
    const structureData = useMemo(() => calculateStructureData(Number(customBalance) || 1, pedals, structYears), [customBalance, pedals, structYears]);

    const finalValue = growthData[growthData.length - 1].value;
    const numericGoal = Number(customGoal) || 1;
    const goalReached = finalValue >= numericGoal;

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FDB931]" /></div>;

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 pt-8 px-4 font-['Montserrat',sans-serif] uppercase overflow-x-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
            
            {/* 1. ПРЕМИАЛЬНЫЙ SEGMENTED CONTROL */}
            <div className="bg-[#1A1D26] border border-[#FFFFFF10] p-1 rounded-2xl flex mb-10 relative">
                {Object.keys(CHART_HEADERS).map((id) => {
                    const isActive = activeChart === id;
                    return (
                        <button key={id} onClick={() => setActiveChart(id as any)}
                            className={clsx("flex-1 py-3 rounded-xl text-[10px] font-bold tracking-[1.2px] transition-all relative z-10",
                            isActive ? "text-white" : "text-white/30")}>
                            {id === 'assets' ? 'ЗАЩИТА' : id === 'struct' ? 'СКЛАД' : id === 'growth' ? 'ПРОГНОЗ' : id === 'radar' ? 'РАДАР' : 'ЧАС'}
                            {isActive && <div className="absolute inset-0 bg-gradient-to-t from-[#FDB93130] to-transparent rounded-xl blur-[4px] -z-10" />}
                        </button>
                    );
                })}
            </div>

            {/* 2. ДИНАМИЧЕСКИЕ ЗАГОЛОВКИ */}
            <div className="text-center mb-8">
                <p className="text-[#FDB931] text-[10px] font-black tracking-[2px] mb-2">{CHART_HEADERS[activeChart].top}</p>
                <h2 className="text-2xl font-black italic tracking-tight mb-3">{CHART_HEADERS[activeChart].main}</h2>
                <p className="text-white/40 text-[11px] font-medium leading-relaxed normal-case mx-auto max-w-[300px]">
                    {CHART_HEADERS[activeChart].desc}
                </p>
            </div>

            {/* 3. ОБЛАСТЬ ГРАФИКА */}
            <div className="bg-[#151517] rounded-[2.5rem] p-8 border border-[#FFFFFF05] relative mb-10 overflow-hidden min-h-[400px]">
                {activeChart === 'radar' && (
                    <div className="animate-in fade-in duration-500 h-full">
                        <button onClick={() => setIsInfoOpen(true)} className="absolute top-6 right-8 z-20"><HelpCircle className="w-5 h-5 text-white/10 hover:text-[#FDB931]" /></button>
                        <div className="h-[280px] w-full"><RadarChartComponent data={radarData} onIconClick={() => {}} /></div>
                        <div className="flex justify-center gap-8 mt-10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#40E0D0] shadow-[0_0_8px_#40E0D0]" />
                                <span className="text-[9px] font-bold text-white/40 tracking-widest">{selectedAsset}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#FDB931] shadow-[0_0_8px_#FDB931]" />
                                <span className="text-[9px] font-bold text-white/90 tracking-widest">Tyrex Strategy</span>
                            </div>
                        </div>
                        <InfoCard isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} title="Методологія" description="Порівняльний аналіз активів за 6 ключовими метриками." methodology={[{label: 'TYREX', text: 'Поточні показники алгоритму.', color: '#FDB931'}, {label: 'АКТИВ', text: 'Середньоринкові дані за 5 років.', color: '#40E0D0'}]} />
                    </div>
                )}

                {activeChart === 'growth' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-[#1C1C1C] p-4 rounded-3xl border border-white/5">
                                <p className="text-[9px] text-white/30 font-bold mb-1">Прогноз</p>
                                <h3 className="text-lg font-black">{finalValue.toLocaleString('ru-RU')} $</h3>
                            </div>
                            <div className="bg-[#1C1C1C] p-4 rounded-3xl border border-[#FDB931]/20">
                                <p className="text-[9px] text-white/30 font-bold mb-1">Цель</p>
                                <input type="number" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} className="w-full bg-transparent text-lg font-black text-[#FDB931] focus:outline-none" />
                            </div>
                        </div>
                        <GrowthAreaChart data={growthData} goal={numericGoal} goalReached={goalReached} pedals={pedals} setPedals={setPedals} pedalDescriptions={PEDAL_DESCRIPTIONS} />
                    </div>
                )}

                {activeChart === 'assets' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex justify-end mb-6">
                            <div className="flex bg-[#1C1C1C] p-1 rounded-xl border border-white/5">
                                {['bear', 'bull', 'current'].map((p) => (
                                    <button key={p} onClick={() => setCompPeriod(p as any)} className={clsx("px-3 py-1.5 rounded-lg text-[8px] font-black transition-all", compPeriod === p ? "bg-[#FDB931] text-black" : "text-white/30")}>
                                        {p === 'bear' ? 'BEAR' : p === 'bull' ? 'BULL' : 'NOW'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <StrategyComparisonChart data={comparisonData} />
                    </div>
                )}

                {activeChart === 'time' && (
                    <div className="animate-in slide-in-from-bottom-5 duration-500 h-full flex flex-col">
                        <TimeSavingChart principal={Number(customBalance) || 1} goal={numericGoal} pedals={pedals} />
                    </div>
                )}

                {activeChart === 'struct' && (
                    <div className="animate-in zoom-in duration-500">
                        <InvestmentStructureChart data={structureData} totalValue={structureData.reduce((acc, c) => acc + c.value, 0)} btcPrice={data?.btcPrice} />
                        <div className="mt-8 space-y-3">
                            <div className="flex justify-between text-[9px] font-bold text-white/20"><span>1 ГОД</span><span>5 ЛЕТ</span></div>
                            <input type="range" min="1" max="5" step="1" value={structYears} onChange={(e) => setStructYears(Number(e.target.value))} className="w-full h-1 accent-[#FDB931] bg-white/5 rounded-full appearance-none" />
                        </div>
                    </div>
                )}
            </div>

            {/* 4. НИЖНЯЯ ПАНЕЛЬ ВВОДА И ВЫБОРА (ОБЩАЯ) */}
            <div className="space-y-6">
                {activeChart === 'radar' ? (
                    <div className="animate-in slide-in-from-bottom-5 duration-500">
                        <div className="flex justify-center mb-6">
                            <div className="bg-[#121212] p-1 rounded-xl flex border border-white/5">
                                {['traditional', 'crypto'].map((cat) => (
                                    <button key={cat} onClick={() => setActiveCategory(cat as any)}
                                        className={clsx("px-6 py-2 rounded-lg text-[9px] font-black transition-all",
                                        activeCategory === cat ? "bg-[#1C1C1C] text-white" : "text-white/20")}>
                                        {cat === 'traditional' ? 'Традиционные' : 'Крипто-активы'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORY_ASSETS[activeCategory].map((asset) => (
                                <button key={asset.id} onClick={() => setSelectedAsset(asset.id)}
                                    className={clsx("flex items-center p-4 rounded-2xl border transition-all duration-300 relative",
                                    selectedAsset === asset.id ? "bg-[#1C1C1C] border-[#40E0D030]" : "bg-[#151517] border-white/5")}>
                                    <div className={clsx("w-1.5 h-1.5 rounded-full mr-3 transition-all",
                                        selectedAsset === asset.id ? "bg-[#40E0D0] shadow-[0_0_10px_#40E0D0]" : "bg-white/5")} />
                                    <asset.icon className={clsx("w-4 h-4 mr-3", selectedAsset === asset.id ? "text-white" : "text-white/10")} />
                                    <span className={clsx("text-[10px] font-black tracking-tight", selectedAsset === asset.id ? "text-white" : "text-white/20")}>
                                        {asset.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-5 duration-500">
                        <div className="bg-[#151517] p-5 rounded-[2rem] border border-white/5 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[9px] font-black text-white/30 tracking-widest">ВАШ КАПИТАЛ ($)</p>
                                <span className="text-[8px] text-white/10">LIMIT 150K</span>
                            </div>
                            <input type="number" value={customBalance} onChange={(e) => handleBalanceChange(e.target.value)} 
                                className="w-full bg-transparent text-2xl font-black text-white focus:outline-none" />
                        </div>
                        <button className="w-full py-5 bg-[#FDB931] rounded-3xl text-black font-black text-xs tracking-[1.5px] shadow-[0_15px_30px_rgba(253,185,49,0.2)] active:scale-95 transition-all">
                            УСКОРИТЬ РЕЗУЛЬТАТ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    function handleBalanceChange(val: string) {
        if (val === '') { setCustomBalance(''); return; }
        let num = parseFloat(val);
        if (num < 0) num = 0;
        if (num > 150000) num = 150000;
        setCustomBalance(val.includes('.') ? val : num.toString());
    }
};

export default AnalyticsScreen;