import React, { useState, useMemo, useEffect } from 'react';
import { 
    Zap, Landmark, LineChart, Layers, Coins, RefreshCw, HelpCircle, 
    Building2, Briefcase, PieChart, Pickaxe, LayoutGrid, Signal,
    ChevronDown, MousePointer2,
} from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

// Імпорт графіків
import RadarChartComponent from '../components/charts/RadarChart'; // Старий (Неон)
import RadarChart1 from '../components/charts/RadarChart1'; // Новий (Професійний)
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import StrategyComparisonChart from '../components/charts/StrategyComparisonChart';
import TimeSavingChart from '../components/charts/TimeSavingChart';
import InvestmentStructureChart from '../components/charts/InvestmentStructureChart';
import InfoCard from '../components/common/InfoCard';

// Імпорт математики
import { calculateGrowthPoints } from '../utils/growthMath';
import { generateComparisonData } from '../utils/comparisonMath';
import { calculateStructureData } from '../utils/structureMath';

const CATEGORY_ASSETS = {
    traditional: [
        { id: 'Real Estate', label: 'Нерухомість', icon: Building2 },
        { id: 'Bank Deposit', label: 'Банк', icon: Landmark },
        { id: 'S&P 500', label: 'Акції', icon: LineChart },
        { id: 'Gold', label: 'Золото', icon: Coins },
        { id: 'Business', label: 'Бізнес', icon: Briefcase },
        { id: 'Funds', label: 'Фонди', icon: PieChart },
    ],
    crypto: [
        { id: 'Staking', label: 'Стейкінг', icon: Layers },
        { id: 'Mining', label: 'Майнінг', icon: Pickaxe },
        { id: 'Trading', label: 'Трейдинг', icon: MousePointer2 },
        { id: 'Altcoins', label: 'Альткоїни', icon: Zap },
        { id: 'Bots', label: 'Боти', icon: LayoutGrid },
        { id: 'Signals', label: 'Сигнали', icon: Signal },
    ]
};

const INFO_GRID = [
    { label: 'ДОХІД', text: 'Потенційна річна прибутковість активу у валютному еквіваленті.' },
    { label: 'ЛІКВІДНІСТЬ', text: 'Швидкість конвертації активу в готівку без втрати вартості.' },
    { label: 'ВХІД', text: 'Доступність інструменту (мінімальний поріг капіталу).' },
    { label: 'БЕЗПЕКА', text: 'Рівень захисту капіталу від маніпуляцій та просадок.' },
    { label: 'ПАСИВНІСТЬ', text: 'Ступінь автоматизації — скільки часу ви витрачаєте.' },
    { label: 'РІСТ (BTC)', text: 'Здатність стратегії накопичувати кількість монет.' }
];

const TABS = [
    { id: 'radar', label: 'ВИГОДА', header: 'Порівняння активів' },
    { id: 'radar_old', label: 'ВИГОДА 1', header: 'Порівняння (Неон)' },
    { id: 'growth', label: 'ЦІЛЬ', header: 'Прогноз доходності' },
    { id: 'assets', label: 'ЗАХИСТ', header: 'Захист капіталу' },
    { id: 'time', label: 'ШВИДКІСТЬ', header: 'Економія часу' },
    { id: 'struct', label: 'СКЛАД', header: 'Склад капіталу' }
];

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
    const [activeChart, setActiveChart] = useState('radar');
    
    // UI States
    const [selectedAsset, setSelectedAsset] = useState('Real Estate');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'traditional' | 'crypto'>('traditional');
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    
    // Data States
    const [customBalance, setCustomBalance] = useState<string>('');
    const [customGoal, setCustomGoal] = useState<string>('50000');
    const [pedals] = useState({ yield: 15, ref: 5, btc: 40, boosters: 4, spec: 15 });
    const [compPeriod, setCompPeriod] = useState<'bear' | 'bull' | 'current'>('current');
    const [structYears, setStructYears] = useState(3);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await analyticsApi.getDashboard();
                if (res.analytics) {
                    setData(res.analytics);
                    setCustomBalance(Number(res.analytics.currentBalance || 0).toFixed(2));
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

    const isRadarActive = activeChart === 'radar' || activeChart === 'radar_old';

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FDB931]" /></div>;

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-6 pt-4 px-4 font-sans uppercase overflow-x-hidden" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800;900&display=swap');
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>

            {/* 1. TABS (6 TABS NOW) */}
            <div className="bg-[#1A1D26] border border-[#FFFFFF10] p-1 rounded-xl flex mb-4 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveChart(tab.id as any)}
                        className={clsx("flex-1 min-w-[70px] py-2.5 rounded-lg text-[9px] font-extrabold tracking-[1px] transition-all relative z-10",
                        activeChart === tab.id ? "text-white" : "text-white/30")}>
                        {tab.label}
                        {activeChart === tab.id && <div className="absolute inset-0 bg-gradient-to-t from-[#FDB93120] to-transparent rounded-lg blur-[2px] -z-10" />}
                    </button>
                ))}
            </div>

            {/* 2. UNIFIED MAIN CARD */}
            <div className={clsx(
                "bg-[#151517] rounded-[2.5rem] p-6 border border-white/5 relative mb-4 flex flex-col transition-all duration-500",
                isRadarActive ? "min-h-[550px]" : "min-h-[460px]"
            )}>
                {/* Dynamic Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-xl font-black tracking-tight text-white uppercase">
                            {TABS.find(t => t.id === activeChart)?.header}
                        </h2>
                        <button onClick={() => setIsInfoOpen(true)}>
                            <HelpCircle className="w-5 h-5 text-white/40 hover:text-[#FDB931] transition-colors" />
                        </button>
                    </div>
                    <p className="text-[10px] text-white/20 lowercase font-medium tracking-wide">
                        {activeChart === 'radar' ? 'оцініть переваги tyrex відносно ринкових інструментів.' : 'детальна аналітика вашої фінансової стратегії.'}
                    </p>
                </div>

                {/* --- ТАБ: РАДАР 1 (НОВИЙ) --- */}
                {activeChart === 'radar' && (
                    <div className="animate-in fade-in duration-500 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex flex-col gap-2">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">ПОРІВНЯТИ З:</p>
                                <div className="relative">
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                                        <span className="text-[12px] font-black text-[#00F0FF]">{currentAssetLabel}</span>
                                        <ChevronDown size={14} className="text-white/20" />
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-[200px] bg-[#1A1D26] border border-white/10 rounded-2xl z-50 p-1 shadow-2xl overflow-hidden">
                                             <div className="flex p-1 bg-black/20 rounded-xl mb-1">
                                                {['traditional', 'crypto'].map((cat) => (
                                                    <button key={cat} onClick={() => setActiveCategory(cat as any)} className={clsx("flex-1 py-1.5 rounded-lg text-[8px] font-black", activeCategory === cat ? "bg-[#1C1C1C] text-[#FDB931]" : "text-white/20")}>{cat === 'traditional' ? 'TRAD' : 'CRYPTO'}</button>
                                                ))}
                                            </div>
                                            <div className="max-h-[180px] overflow-y-auto scrollbar-hide">
                                                {CATEGORY_ASSETS[activeCategory].map((asset) => (
                                                    <button key={asset.id} onClick={() => { setSelectedAsset(asset.id); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-[10px] font-bold text-white/40 hover:text-white uppercase">{asset.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 pt-1 text-right">
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#FFB800] shadow-[0_0_8px_#FFB800]" /><span className="text-[9px] font-black text-white/40">TYREX STRATEGY</span></div>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" /><span className="text-[9px] font-black text-white/40 uppercase tracking-tighter">ОБРАНИЙ АКТИВ</span></div>
                            </div>
                        </div>
                        <div className="h-[320px] w-full -mt-4"><RadarChart1 data={radarData} /></div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-2 pt-6 border-t border-white/5">
                            {INFO_GRID.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-0.5 text-left">
                                    <p className="text-[9px] font-black text-white/80 tracking-widest">{item.label}:</p>
                                    <p className="text-[8px] text-white/20 leading-tight normal-case font-medium">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- ТАБ: РАДАР 1 (СТАРИЙ НЕОН) --- */}
                {activeChart === 'radar_old' && (
                    <div className="animate-in fade-in duration-500 h-full flex flex-col items-center">
                        <div className="h-[320px] w-full mt-2">
                            <RadarChartComponent data={radarData} selectedAssetName={currentAssetLabel} />
                        </div>
                        <div className="flex justify-between w-full items-center mt-12 px-2">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-300 border border-[#00F0FF33] bg-[#00F0FF05] shadow-[0_0_15px_rgba(0,240,255,0.05)]"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                                    <span className="text-[10px] font-black text-white/80">{currentAssetLabel}</span>
                                    <ChevronDown size={14} className="text-[#00F0FF]" />
                                </button>
                                {/* Dropdown logic simplified for this view */}
                            </div>
                            <div className="flex items-center gap-2 pr-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                                <span className="text-[10px] font-black text-white/30 tracking-wider">Tyrex Strategy</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ТАБ: ЦІЛЬ --- */}
                {activeChart === 'growth' && (
                    <div className="animate-in fade-in duration-500 h-full flex flex-col">
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-[#1C1C1C] p-5 rounded-[2rem] border border-white/5 text-left">
                                <p className="text-[9px] text-white/30 font-bold mb-1 uppercase tracking-wider">Прогноз (5р)</p>
                                <h3 className="text-xl font-black text-white">${growthData[growthData.length-1].value.toLocaleString('ru-RU')}</h3>
                            </div>
                            <div className="bg-[#1C1C1C] p-5 rounded-[2rem] border border-[#FDB931]/20 text-left">
                                <p className="text-[9px] text-white/30 font-bold mb-1 uppercase tracking-wider">Ваша ціль</p>
                                <input type="number" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} className="w-full bg-transparent text-xl font-black text-[#FDB931] focus:outline-none appearance-none" />
                            </div>
                        </div>
                        <div className="flex-1"><GrowthAreaChart data={growthData} goal={Number(customGoal)} goalReached={growthData[growthData.length - 1].value >= Number(customGoal)} pedals={pedals} setPedals={function (_value: any): void {
                            throw new Error('Function not implemented.');
                        } } pedalDescriptions={PEDAL_DESCRIPTIONS} /></div>
                    </div>
                )}

                {/* --- ТАБ: ЗАХИСТ --- */}
                {activeChart === 'assets' && (
                    <div className="animate-in fade-in duration-500 h-full flex flex-col">
                        <div className="flex justify-end mb-4">
                            <div className="flex bg-[#1C1C1C] p-1 rounded-xl border border-white/5">
                                {['bear', 'bull', 'current'].map((p) => (
                                    <button key={p} onClick={() => setCompPeriod(p as any)} className={clsx("px-4 py-1.5 rounded-lg text-[9px] font-black transition-all", compPeriod === p ? "bg-[#FDB931] text-black" : "text-white/30")}>{p === 'bear' ? 'ВЕДМІДЬ' : p === 'bull' ? 'БУЛРАН' : 'ЗАРАЗ'}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1"><StrategyComparisonChart data={comparisonData} /></div>
                    </div>
                )}

                {/* --- ТАБ: ШВИДКІСТЬ --- */}
                {activeChart === 'time' && (
                    <div className="animate-in slide-in-from-bottom-5 duration-500 flex-1 flex flex-col justify-center">
                        <TimeSavingChart principal={Number(customBalance)} goal={Number(customGoal)} pedals={pedals} />
                    </div>
                )}

                {/* --- ТАБ: СКЛАД --- */}
                {activeChart === 'struct' && (
                    <div className="animate-in zoom-in duration-500 h-full flex flex-col items-center">
                        <InvestmentStructureChart data={structureData} totalValue={structureData.reduce((acc, c) => acc + c.value, 0)} btcPrice={data?.btcPrice} />
                        <div className="mt-8 space-y-4 px-2 w-full">
                            <div className="flex justify-between text-[9px] font-black text-white/30 tracking-widest uppercase"><span>1 рік</span><span>5 років</span></div>
                            <input type="range" min="1" max="5" step="1" value={structYears} onChange={(e) => setStructYears(Number(e.target.value))} className="w-full h-1.5 accent-[#FDB931] bg-white/5 rounded-full appearance-none cursor-pointer" />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. FOOTER (Hidden on Radar Tabs) */}
            {!isRadarActive && (
                <div className="animate-in slide-in-from-bottom-5 duration-700 space-y-3">
                    <div className="flex justify-between items-center p-5 bg-[#151517]/50 backdrop-blur-sm rounded-[2rem] border border-white/5 text-left">
                        <p className="text-[10px] font-black text-white/20 tracking-widest uppercase">ВАШ КАПІТАЛ ($)</p>
                        <input 
                            type="number" 
                            value={customBalance} 
                            onChange={(e) => {
                                let val = e.target.value;
                                if (Number(val) > 150000) val = "150000";
                                setCustomBalance(val);
                            }} 
                            className="bg-transparent text-right text-2xl font-black text-white focus:outline-none w-1/2" 
                        />
                    </div>
                    <button className="w-full py-5 bg-[#FDB931] rounded-[2rem] text-black font-black text-[11px] tracking-[2px] shadow-[0_20px_40px_rgba(253,185,49,0.25)] active:scale-95 transition-all uppercase">
                        Ускорити результат
                    </button>
                </div>
            )}

            <InfoCard 
                isOpen={isInfoOpen} 
                onClose={() => setIsInfoOpen(false)} 
                title="Методологія" 
                description="Порівняльний аналіз базується на реальних ринкових даних та алгоритмах Tyrex." 
                methodology={[
                    {label:'TYREX', text:'Поточні показники вашої активної стратегії.', color:'#FFB800'},
                    {label:'РИНОК', text:'Середньоринкові дані за останні 5 років.', color:'#00F0FF'}
                ]} 
            />
        </div>
    );
};

export default AnalyticsScreen;