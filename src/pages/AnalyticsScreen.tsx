import React, { useState, useMemo, useEffect } from 'react';
import { 
    Zap, Home, Landmark, LineChart, Star, Layers, Coins,
    RefreshCw, HelpCircle, ChevronRight, MousePointer2, Globe
} from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

// Импорт компонентов графиков
import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import StrategyComparisonChart from '../components/charts/StrategyComparisonChart';
import TimeSavingChart from '../components/charts/TimeSavingChart';
import InvestmentStructureChart from '../components/charts/InvestmentStructureChart';

// Импорт математических утилит
import { calculateGrowthPoints } from '../utils/growthMath';
import { generateComparisonData } from '../utils/comparisonMath';
import { calculateStructureData } from '../utils/structureMath';

const PEDAL_DESCRIPTIONS: Record<string, string> = {
    yield: 'Дохідність від стейкінгу активів.',
    ref: 'Бонус від партнерської мережі.',
    btc: 'Очікуваний річний ріст BTC.',
    boosters: 'Бонуси платформи за активність.',
    spec: 'Прибуток від торгових стратегій.'
};

const METRIC_LABELS: Record<string, string> = {
    yield: 'Доходність', liquidity: 'Ліквідність', entry: 'Поріг входу',
    safety: 'Безпека', passive: 'Пасивність', growth: 'Потенціал'
};

const ASSET_ICONS: Record<string, any> = {
    'Real Estate': Home, 'Bank Deposit': Landmark, 'S&P 500': LineChart, 
    'Gold': Star, 'Hold BTC': Coins, 'Staking': Layers, 
    'Altcoins': Zap, 'Trading Bots': MousePointer2, 'Signals': Globe
};

const AnalyticsScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeChart, setActiveChart] = useState<'radar' | 'growth' | 'assets' | 'time' | 'struct'>('radar');
    
    // Состояния для Радара
    const [activeCategory, setActiveCategory] = useState<'traditional' | 'crypto'>('traditional');
    const [selectedAsset, setSelectedAsset] = useState<string>('');
    
    // Состояния для Захисту
    const [compPeriod, setCompPeriod] = useState<'bear' | 'bull' | 'current'>('current');
    
    // Общие состояния для калькуляторов
    const [pedals, setPedals] = useState({ yield: 15, ref: 5, btc: 40, boosters: 4, spec: 15 });
    const [customBalance, setCustomBalance] = useState<string>('');
    const [customGoal, setCustomGoal] = useState<string>('');
    const [structYears, setStructYears] = useState(3); // Слайдер для таба "Склад"

    useEffect(() => {
        const load = async () => {
            try {
                const res = await analyticsApi.getDashboard();
                if (res.analytics) {
                    setData(res.analytics);
                    setSelectedAsset(res.analytics.benchmarks.traditional[0].subject);
                    const initialBal = Math.min(150000, Number(res.analytics.currentBalance || 0));
                    setCustomBalance(initialBal.toFixed(2));
                    setCustomGoal(Number(res.analytics.financialGoal || 50000).toString());
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, []);

    // --- МЕМОИЗАЦИЯ ДАННЫХ ДЛЯ ГРАФИКОВ ---

    const radarData = useMemo(() => {
        if (!data || !selectedAsset) return [];
        const benchmarks = activeCategory === 'traditional' ? data.benchmarks.traditional : data.benchmarks.crypto;
        const compareWith = benchmarks.find((b: any) => b.subject === selectedAsset);
        return Object.keys(METRIC_LABELS).map(key => ({
            subject: METRIC_LABELS[key],
            Tyrex: data.userScore[key],
            Compare: compareWith ? compareWith[key] : 0,
        }));
    }, [data, selectedAsset, activeCategory]);

    const growthData = useMemo(() => 
        calculateGrowthPoints(Number(customBalance) || 0, pedals, 5), 
    [pedals, customBalance]);

    const comparisonData = useMemo(() => generateComparisonData(compPeriod), [compPeriod]);

    const structureData = useMemo(() => 
        calculateStructureData(Number(customBalance) || 1, pedals, structYears),
    [customBalance, pedals, structYears]);

    // Расчетные значения
    const finalValue = growthData[growthData.length - 1].value;
    const numericGoal = Number(customGoal) || 1;
    const goalReached = finalValue >= numericGoal;

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-yellow-500" /></div>;

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 pt-6 overflow-x-hidden font-sans px-4">
            
            {/* ТАБЫ НАВИГАЦИИ */}
            <div className="mb-6">
                <div className="flex bg-[#121212] p-1.5 rounded-2xl space-x-1 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'radar', label: 'Радар' }, 
                        { id: 'growth', label: 'Прогноз' },
                        { id: 'assets', label: 'Захист' },
                        { id: 'time', label: 'Час' },
                        { id: 'struct', label: 'Склад' }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveChart(tab.id as any)}
                            className={clsx(
                                "flex-1 min-w-[70px] py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all",
                                activeChart === tab.id ? "bg-[#1C1C1C] text-white" : "text-white/30"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>

            {/* КОНТЕНТ В ЗАВИСИМОСТИ ОТ ТАБА */}
            
            {/* 1. РАДАР (СРАВНЕНИЕ С АКТИВАМИ) */}
            {activeChart === 'radar' && (
                <div className="animate-in fade-in duration-500">
                    <div className="bg-[#151517] rounded-[2.5rem] p-8 border border-white/5 mb-6">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-black italic uppercase tracking-tight">TYREX <span className="text-white/20 font-normal">vs</span> {selectedAsset}</h3>
                            <HelpCircle className="w-5 h-5 text-white/10" />
                        </div>
                        <div className="h-[280px] w-full">
                            <RadarChartComponent data={radarData} selectedAsset={selectedAsset} activeCategory={activeCategory} />
                        </div>
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                            {['traditional', 'crypto'].map(cat => (
                                <button key={cat} onClick={() => setActiveCategory(cat as any)} className={clsx("px-5 py-2 text-[9px] font-black uppercase rounded-full transition-all", activeCategory === cat ? "bg-[#FDB931] text-black" : "bg-[#1C1C1C] text-white/40")}>
                                    {cat === 'traditional' ? 'Фінанси' : 'Крипто'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {(activeCategory === 'traditional' ? data.benchmarks.traditional : data.benchmarks.crypto).map((asset: any) => {
                            const Icon = ASSET_ICONS[asset.subject] || Zap;
                            return (
                                <button key={asset.subject} onClick={() => setSelectedAsset(asset.subject)} className={clsx("flex flex-col items-center py-6 px-2 rounded-[1.8rem] transition-all border-2 min-h-[110px]", selectedAsset === asset.subject ? "bg-[#FDB931] border-[#FDB931] text-black" : "bg-[#151517] border-transparent text-white/40")}>
                                    <Icon className="w-5 h-5 mb-3" />
                                    <span className="text-[8px] font-black uppercase text-center leading-tight">{asset.subject}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2. ПРОГНОЗ (КАЛЬКУЛЯТОР ДОХОДНОСТИ) */}
            {activeChart === 'growth' && (
                <div className="animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-[#151517] p-5 rounded-[2rem] border border-white/5">
                            <p className="text-[9px] uppercase text-white/30 font-bold mb-1">Прогноз (5р)</p>
                            <h3 className="text-xl font-black">{finalValue.toLocaleString('ru-RU')} $</h3>
                        </div>
                        <div className="bg-[#151517] p-5 rounded-[2rem] border border-[#FDB931]/20">
                            <p className="text-[9px] uppercase text-white/30 font-bold mb-1">Ваша ціль ($)</p>
                            <input type="number" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} className="w-full bg-transparent text-xl font-black text-[#FDB931] focus:outline-none appearance-none" />
                        </div>
                    </div>

                    <div className="bg-[#1C1C1C] p-4 rounded-2xl mb-4 border border-white/5">
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-1">Початковий капітал ($) <span className="float-right text-white/20">Max 150k</span></p>
                        <input type="number" step="0.01" value={customBalance} onChange={(e) => setCustomBalance(e.target.value)} className="w-full bg-transparent text-xl font-black text-white focus:outline-none appearance-none" />
                    </div>

                    <GrowthAreaChart data={growthData} goal={numericGoal} goalReached={goalReached} pedals={pedals} setPedals={setPedals} pedalDescriptions={PEDAL_DESCRIPTIONS} />

                    <button className="w-full mt-6 py-4 bg-[#FDB931] rounded-2xl text-black font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_15px_30px_rgba(253,185,49,0.2)]">
                        Прискорити результат <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 3. ЗАХИСТ (СРАВНЕНИЕ С BTC) */}
            {activeChart === 'assets' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center px-4">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter">Захист капіталу</h2>
                        <div className="flex bg-[#151517] p-1 rounded-xl border border-white/5">
                            {['bear', 'bull', 'current'].map((p) => (
                                <button key={p} onClick={() => setCompPeriod(p as any)} className={clsx("px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all", compPeriod === p ? "bg-[#FDB931] text-black" : "text-white/30")}>
                                    {p === 'bear' ? 'Ведмідь 22' : p === 'bull' ? 'Булран' : 'Зараз'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <StrategyComparisonChart data={comparisonData} />
                    <div className="px-6 space-y-2">
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest underline decoration-[#FDB931]/40 underline-offset-4">Чому це працює?</p>
                        <p className="text-xs text-white/60 leading-relaxed font-medium">
                            Навіть якщо ринок падає, <span className="text-white font-bold">кількість ваших активів зростає</span>, що створює ефект фінансової подушки.
                        </p>
                    </div>
                </div>
            )}

            {/* 4. ЧАС (ЭКОНОМИЯ ЖИЗНИ) */}
            {activeChart === 'time' && (
                <div className="animate-in fade-in slide-in-from-bottom-5">
                    <TimeSavingChart principal={Number(customBalance) || 1} goal={numericGoal} pedals={pedals} />
                    <div className="mt-8 px-6 space-y-4">
                        <p className="text-xs text-white/40 leading-relaxed text-center italic font-medium">“Час — це єдиний актив, який неможливо купити. Але його можна зберегти.”</p>
                        <button className="w-full py-5 bg-[#FDB931] rounded-3xl text-black font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-[0_20px_40px_rgba(253,185,49,0.2)]">
                            ЗАБРАТИ СВОЇ {Math.max(0, Math.round(
                                (Math.log(numericGoal/Number(customBalance)) / Math.log(1 + 0.05)) - 
                                (Math.log(numericGoal/Number(customBalance)) / Math.log(1 + Object.values(pedals).reduce((a,b)=>a+b,0)/100))
                            ))} РОКІВ
                        </button>
                    </div>
                </div>
            )}

            {/* 5. СКЛАД (СТРУКТУРА КАПИТАЛА) */}
            {activeChart === 'struct' && (
                <div className="animate-in zoom-in fade-in">
                    <div className="bg-[#151517] rounded-[2.5rem] p-8 border border-white/5 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black italic uppercase">Склад капіталу</h3>
                            <div className="bg-[#FDB931] px-3 py-1 rounded-full"><span className="text-[10px] font-black text-black">{structYears} Р.</span></div>
                        </div>
                        <InvestmentStructureChart data={structureData} totalValue={structureData.reduce((acc, c) => acc + c.value, 0)} btcPrice={data?.btcPrice} />
                        <div className="mt-10 space-y-4">
                            <div className="flex justify-between text-[9px] font-black text-white/30 uppercase tracking-widest"><span>1 рік</span><span>3 роки</span><span>5 років</span></div>
                            <input type="range" min="1" max="5" step="1" value={structYears} onChange={(e) => setStructYears(Number(e.target.value))} className="w-full h-1.5 accent-[#FDB931] bg-white/5 rounded-full appearance-none cursor-pointer" />
                        </div>
                    </div>
                    <p className="px-6 text-[8px] leading-relaxed text-white/20 text-center uppercase font-bold tracking-tight">Розрахунок є орієнтовним. Не є фінансовою рекомендацією.</p>
                </div>
            )}
        </div>
    );
};

export default AnalyticsScreen;