import React, { useState, useMemo, useEffect } from 'react';
import { 
    Zap, Landmark, LineChart, Layers, Coins,
    RefreshCw, HelpCircle, MousePointer2,
    Building2, Briefcase, PieChart, Pickaxe, LayoutGrid, Signal,
    ChevronDown, ChevronRight, X
} from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

// Импорт компонентов графиков
import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import StrategyComparisonChart from '../components/charts/StrategyComparisonChart';
import TimeSavingChart from '../components/charts/TimeSavingChart';
import InvestmentStructureChart from '../components/charts/InvestmentStructureChart';
import InfoCard from '../components/common/InfoCard';

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
    growth: { top: 'ЦЕЛЬ', main: 'ПРОГНОЗ ДОХОДНОСТИ', desc: 'Рассчитай свой путь к финансовой свободе' },
    assets: { top: 'ЗАЩИТА', main: 'ЗАЩИТА КАПИТАЛА', desc: 'Узнай, как алгоритм защищает тебя от волатильности' },
    time: { top: 'ЗАЩИТА', main: 'ЭКОНОМИЯ ВРЕМЕНИ', desc: 'Посмотри, сколько лет жизни тебе сбережет автоматизация' },
    struct: { top: 'ЗАЩИТА', main: 'СОСТАВ КАПИТАЛА', desc: 'Увидь, как проценты превращаются в основной объем средств' }
};

const PEDAL_DESCRIPTIONS: Record<string, string> = {
    yield: 'Дохідність від стейкінгу активів.',
    ref: 'Бонус від партнерської мережі.',
    btc: 'Очікуваний річний ріст BTC.',
    boosters: 'Бонуси платформи за активність.',
    spec: 'Прибуток від торгових стратегій.'
};

const AnalyticsScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeChart, setActiveChart] = useState<'radar' | 'growth' | 'assets' | 'time' | 'struct'>('radar');
    
    // Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'traditional' | 'crypto'>('traditional');
    const [selectedAsset, setSelectedAsset] = useState<string>('Real Estate');
    
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [compPeriod, setCompPeriod] = useState<'bear' | 'bull' | 'current'>('current');
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
                    setSelectedAsset(CATEGORY_ASSETS[activeCategory][0].id);
                    const initialBal = Math.min(150000, Number(res.analytics.currentBalance || 0));
                    setCustomBalance(initialBal.toFixed(2));
                    setCustomGoal(Number(res.analytics.financialGoal || 50000).toString());
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, []);

    const radarData = useMemo(() => {
        if (!data) return [];
        const benchmarks = [...data.benchmarks.traditional, ...data.benchmarks.crypto];
        const compareWith = benchmarks.find((b: any) => b.subject === selectedAsset) || benchmarks[0];
        return [
            { subject: 'Доходність', Tyrex: data.userScore.yield, Compare: compareWith.yield },
            { subject: 'Ліквідність', Tyrex: data.userScore.liquidity, Compare: compareWith.liquidity },
            { subject: 'Поріг входу', Tyrex: data.userScore.entry, Compare: compareWith.entry },
            { subject: 'Безпека', Tyrex: data.userScore.safety, Compare: compareWith.safety },
            { subject: 'Пасивність', Tyrex: data.userScore.passive, Compare: compareWith.passive },
            { subject: 'Потенціал', Tyrex: data.userScore.growth, Compare: compareWith.growth },
        ];
    }, [data, selectedAsset]);

    const growthData = useMemo(() => calculateGrowthPoints(Number(customBalance) || 0, pedals, 5), [pedals, customBalance]);
    const comparisonData = useMemo(() => generateComparisonData(compPeriod), [compPeriod]);
    const structureData = useMemo(() => calculateStructureData(Number(customBalance) || 1, pedals, structYears), [customBalance, pedals, structYears]);

    const currentAssetLabel = useMemo(() => {
        const all = [...CATEGORY_ASSETS.traditional, ...CATEGORY_ASSETS.crypto];
        return all.find(a => a.id === selectedAsset)?.label || selectedAsset;
    }, [selectedAsset]);

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FDB931]" /></div>;

    function handleBalanceChange(val: string) {
        if (val === '') { setCustomBalance(''); return; }
        let num = parseFloat(val);
        if (num < 0) num = 0;
        if (num > 150000) num = 150000;
        setCustomBalance(val.includes('.') ? val : num.toString());
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 pt-8 px-4 font-sans uppercase overflow-x-hidden" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
            
            {/* 1. SEGMENTED CONTROL (ВЕРХНИЕ КНОПКИ) */}
            <div className="bg-[#1A1D26] border border-[#FFFFFF10] p-1 rounded-2xl flex mb-10 relative">
                {Object.keys(CHART_HEADERS).map((id) => (
                    <button key={id} onClick={() => setActiveChart(id as any)}
                        className={clsx("flex-1 py-3.5 rounded-xl text-[11px] font-bold tracking-[1.2px] transition-all relative z-10",
                        activeChart === id ? "text-white" : "text-white/30")}>
                        {CHART_HEADERS[id as keyof typeof CHART_HEADERS].top}
                        {activeChart === id && <div className="absolute inset-0 bg-gradient-to-t from-[#FDB93130] to-transparent rounded-xl blur-[4px] -z-10 shadow-[0_4px_12px_rgba(253,185,49,0.15)]" />}
                    </button>
                ))}
            </div>

            {/* 2. ЗАГОЛОВКИ */}
            <div className="text-center mb-10 px-2">
                <p className="text-[#FDB931] text-[10px] font-black tracking-[2.5px] mb-2">{CHART_HEADERS[activeChart].top}</p>
                <h2 className="text-2xl font-black italic tracking-tight mb-3">{CHART_HEADERS[activeChart].main}</h2>
                <p className="text-white text-[11px] font-medium leading-relaxed normal-case mx-auto max-w-[300px]">
                    {CHART_HEADERS[activeChart].desc}
                </p>
            </div>

            {/* 3. ОБЛАСТЬ ГРАФИКА */}
            <div className="bg-[#151517] rounded-[2.5rem] p-8 relative mb-8 min-h-[420px]">
                {activeChart === 'radar' && (
                    <div className="animate-in fade-in duration-500 h-full flex flex-col relative">
                        <button onClick={() => setIsInfoOpen(true)} className="absolute top-0 right-0 z-20"><HelpCircle className="w-5 h-5 text-white/20 hover:text-[#FDB931]" /></button>
                        
                        <div className="h-[300px] w-full mt-4">
                            <RadarChartComponent data={radarData} selectedAssetName={currentAssetLabel} />
                        </div>
                        
                        {/* 4. DROPDOWN LEGEND */}
                        <div className="flex justify-center items-center gap-6 mt-12 relative">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={clsx(
                                        "flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-300 border",
                                        isDropdownOpen 
                                            ? "bg-[#2A2A2A] border-[#A0FBFF] shadow-[0_0_15px_rgba(160,251,255,0.2)]" 
                                            : "bg-[#FFFFFF05] border-[#A0FBFF4D] hover:border-[#A0FBFF]"
                                    )}
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#A0FBFF] shadow-[0_0_8px_#A0FBFF]" />
                                    <span className="text-[10px] font-black text-white tracking-[1.5px] uppercase">
                                        {currentAssetLabel}
                                    </span>
                                    <ChevronDown size={16} className={clsx("text-[#A0FBFF] transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[260px] bg-[#1A1D26] border border-[#FFFFFF10] rounded-[2rem] shadow-2xl z-50 backdrop-blur-xl p-2 overflow-hidden">
                                            <div className="flex p-1 bg-black/20 rounded-xl mb-2">
                                                {['traditional', 'crypto'].map((cat) => (
                                                    <button key={cat} onClick={(e) => { e.stopPropagation(); setActiveCategory(cat as any); }}
                                                        className={clsx("flex-1 py-3 rounded-lg text-[9px] font-black tracking-widest transition-all",
                                                        activeCategory === cat ? "bg-[#1C1C1C] text-[#FDB931]" : "text-white/40 hover:text-white/70")}>
                                                        {cat === 'traditional' ? 'TRAD' : 'CRYPTO'}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="max-h-[250px] overflow-y-auto scrollbar-hide px-1">
                                                {CATEGORY_ASSETS[activeCategory].map((asset) => (
                                                    <button key={asset.id} 
                                                        onClick={() => { setSelectedAsset(asset.id); setIsDropdownOpen(false); }}
                                                        className={clsx("w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all mb-1",
                                                        selectedAsset === asset.id ? "bg-[#FDB93110] text-white" : "text-white/30 hover:bg-white/5")}>
                                                        <asset.icon size={14} className={selectedAsset === asset.id ? "text-[#FDB931]" : "text-white/20"} />
                                                        <span className="text-[11px] font-black tracking-tight">{asset.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2 px-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FDB931] shadow-[0_0_8px_#FDB931]" />
                                <span className="text-[10px] font-black text-white/40 tracking-[1.5px] uppercase">Tyrex Strategy</span>
                            </div>
                        </div>

                        <InfoCard isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} title="Методологія" description="Порівняльний аналіз активів." methodology={[{label: 'TYREX', text: 'Алгоритм Tyrex.', color: '#FDB931'}, {label: 'АКТИВ', text: 'Середньоринкові дані.', color: '#A0FBFF'}]} />
                    </div>
                )}

                {/* 5. ВКЛАДКА ПРОГНОЗ РОСТА */}
                {activeChart === 'growth' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-[#1C1C1C] p-5 rounded-[2rem] border border-white/5">
                                <p className="text-[9px] text-white/30 font-bold mb-1 uppercase tracking-wider">Прогноз (5р)</p>
                                <h3 className="text-xl font-black">{growthData[growthData.length-1].value.toLocaleString('ru-RU')} $</h3>
                            </div>
                            <div className="bg-[#1C1C1C] p-5 rounded-[2rem] border border-[#FDB931]/20">
                                <p className="text-[9px] text-white/30 font-bold mb-1 uppercase tracking-wider">Ваша ціль</p>
                                <input type="number" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} className="w-full bg-transparent text-xl font-black text-[#FDB931] focus:outline-none appearance-none" />
                            </div>
                        </div>
                        <GrowthAreaChart data={growthData} goal={Number(customGoal)} goalReached={growthData[growthData.length-1].value >= Number(customGoal)} pedals={pedals} setPedals={setPedals} pedalDescriptions={PEDAL_DESCRIPTIONS} />
                    </div>
                )}

                {/* 6. ВКЛАДКА ЗАЩИТА (Assets) */}
                {activeChart === 'assets' && (
                    <div className="animate-in fade-in h-full flex flex-col">
                         <div className="flex justify-end mb-6">
                            <div className="flex bg-[#1C1C1C] p-1 rounded-xl border border-white/5">
                                {['bear', 'bull', 'current'].map((p) => (
                                    <button key={p} onClick={() => setCompPeriod(p as any)} className={clsx("px-3 py-1.5 rounded-lg text-[8px] font-black transition-all", compPeriod === p ? "bg-[#FDB931] text-black" : "text-white/30")}>{p}</button>
                                ))}
                            </div>
                        </div>
                        <StrategyComparisonChart data={comparisonData} />
                    </div>
                )}

                {/* 7. ВКЛАДКА ВРЕМЯ (Time) */}
                {activeChart === 'time' && (
                    <div className="animate-in slide-in-from-bottom-5 h-full">
                        <TimeSavingChart principal={Number(customBalance) || 1} goal={Number(customGoal)} pedals={pedals} />
                    </div>
                )}

                {/* 8. ВКЛАДКА СОСТАВ (Struct) */}
                {activeChart === 'struct' && (
                    <div className="animate-in zoom-in h-full">
                        <InvestmentStructureChart data={structureData} totalValue={structureData.reduce((acc, c) => acc + c.value, 0)} btcPrice={data?.btcPrice} />
                        <div className="mt-8 space-y-4">
                            <div className="flex justify-between text-[9px] font-bold text-white/20 tracking-widest"><span>1 РІК</span><span>5 РОКІВ</span></div>
                            <input type="range" min="1" max="5" step="1" value={structYears} onChange={(e) => setStructYears(Number(e.target.value))} className="w-full h-1 accent-[#FDB931] bg-white/5 rounded-full appearance-none cursor-pointer" />
                        </div>
                    </div>
                )}
            </div>

            {/* 9. НИЖНЯЯ ПАНЕЛЬ (ВВОД И КНОПКА) */}
            <div className="animate-in slide-in-from-bottom-5">
                <div className="bg-[#151517] p-6 rounded-[2.5rem] border border-white/5 mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-black text-white/30 tracking-widest uppercase">Ваш капітал ($)</p>
                        <span className="text-[8px] text-white/10 tracking-[1.5px]">MAX 150K</span>
                    </div>
                    <input 
                        type="number" 
                        value={customBalance} 
                        onChange={(e) => handleBalanceChange(e.target.value)} 
                        className="w-full bg-transparent text-3xl font-black text-white focus:outline-none appearance-none" 
                    />
                </div>
                <button className="w-full py-5 bg-[#FDB931] rounded-3xl text-black font-black text-[11px] tracking-[1.5px] shadow-[0_15px_30px_rgba(253,185,49,0.25)] active:scale-95 transition-all">
                    УСКОРИТЬ РЕЗУЛЬТАТ
                </button>
            </div>
        </div>
    );
};

export default AnalyticsScreen;