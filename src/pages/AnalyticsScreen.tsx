import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw, Settings2, X, Calculator, TrendingUp, Target } from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import StrategyComparisonChart from '../components/charts/StrategyComparisonChart';
import TimeSavingChart from '../components/charts/TimeSavingChart';
import InvestmentStructureChart from '../components/charts/InvestmentStructureChart';
import FloatingNav from '../components/navigation/FloatingNav';

import { CATEGORY_ASSETS, TABS, PEDAL_DESCRIPTIONS, ASSET_CONCLUSIONS, LEGEND_DATA } from '../constants/AnalyticsConfig';
import { generateComparisonData } from '../utils/comparisonMath';

// --- МАТЕМАТИКА (ЦИФРОВИЙ КОЛОДЯЗЬ) ---
const calculateCompoundData = (principal: number, reinvest: number, pedals: Record<string, number>, years: number = 5) => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const monthlyRate = (totalApy / 100) / 12;
    const months = years * 12;
    let balance = principal;
    let totalInvested = principal;
    const points = [{ month: 0, value: principal, invested: principal }];
    for (let i = 1; i <= months; i++) {
        balance = balance * (1 + monthlyRate) + reinvest;
        totalInvested += reinvest;
        points.push({ month: i, value: Math.round(balance), invested: totalInvested });
    }
    return { points, finalValue: balance, totalInvested };
};

// const calculateYearsToGoal = (principal: number, reinvest: number, goal: number, apy: number) => {
//     if (principal >= goal) return 0.5;
//     let balance = principal;
//     let months = 0;
//     const monthlyRate = (apy / 100) / 12;
//     while (balance < goal && months < 360) {
//         balance = balance * (1 + monthlyRate) + reinvest;
//         months++;
//     }
//     return Math.max(months / 12, 0.5);
// };

// --- КОМПОНЕНТ ЕФЕКТУ ДРУКУ ---
const TypewriterText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
        setDisplayedText(""); 
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(interval);
        }, 20); 
        return () => clearInterval(interval);
    }, [text]);
    return <span>{displayedText}</span>;
};

const AnalyticsScreen: React.FC<{ scrollContainerRef?: React.RefObject<HTMLDivElement> }> = ({ scrollContainerRef }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeChart, setActiveChart] = useState('radar');
    
    // Единый стейт для расчетов
    const [config, setConfig] = useState({
        principal: 500,
        reinvest: 50,
        goal: 50000,
        pedals: { yield: 15, boosters: 4, spec: 15, btc: 40, ref: 5 }
    });

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState('Real Estate');
    const [activeCategory, setActiveCategory] = useState<'traditional' | 'crypto'>('traditional');
    const [modalInfo, setModalInfo] = useState<any>(null);

    const sliderRef = useRef<HTMLDivElement>(null);
    const isProgrammaticScroll = useRef(false);

    useEffect(() => {
        analyticsApi.getDashboard().then(res => {
            if (res.analytics) setData(res.analytics);
            setLoading(false);
        });
    }, []);

    // Расчеты
    const financialModel = useMemo(() => calculateCompoundData(config.principal, config.reinvest, config.pedals), [config]);
    
    const structureData = useMemo(() => {
        const totalApy = Object.values(config.pedals).reduce((a, b) => a + b, 0);
        const profit = financialModel.finalValue - financialModel.totalInvested;
        const getShare = (val: number) => (profit * (val / (totalApy || 1)));
        return [
            { name: 'Власні кошти', value: financialModel.totalInvested, color: '#2A2A2E' },
            { name: 'Прибуток Tyrex', value: getShare(config.pedals.yield + config.pedals.spec), color: '#8B5CF6' },
            { name: 'Бонуси та Ріст', value: getShare(config.pedals.ref + config.pedals.btc + config.pedals.boosters), color: '#FDB931' },
        ];
    }, [config, financialModel]);

    const handleScroll = () => {
        if (isProgrammaticScroll.current || !sliderRef.current) return;
        const index = Math.round(sliderRef.current.scrollLeft / sliderRef.current.offsetWidth);
        if (TABS[index] && TABS[index].id !== activeChart) setActiveChart(TABS[index].id);
    };

    const handleTabChange = (tabId: string) => {
        const index = TABS.findIndex(t => t.id === tabId);
        if (index !== -1 && sliderRef.current) {
            isProgrammaticScroll.current = true;
            setActiveChart(tabId);
            sliderRef.current.scrollTo({ left: index * sliderRef.current.offsetWidth, behavior: 'smooth' });
            setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
        }
    };

    const radarData = useMemo(() => {
        if (!data) return [];
        const benchmarks = [...data.benchmarks.traditional, ...data.benchmarks.crypto];
        const compareWith = benchmarks.find((b: any) => b.subject === selectedAsset) || benchmarks[0];
        return [
            { subject: 'Доходность', Tyrex: 90, Compare: compareWith.yield },   
            { subject: 'Потенциал', Tyrex: 80, Compare: compareWith.growth },   
            { subject: 'Пассивность', Tyrex: 90, Compare: compareWith.passive }, 
            { subject: 'Ликвидность', Tyrex: 100, Compare: compareWith.liquidity }, 
            { subject: 'Вход', Tyrex: 100, Compare: compareWith.entry },   
            { subject: 'Риск', Tyrex: 90, Compare: compareWith.safety },    
        ];
    }, [data, selectedAsset]);

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB800]" /></div>;

    const currentTab = TABS.find(t => t.id === activeChart);

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-10 pt-20 px-0 font-sans overflow-hidden relative">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            <header className="px-5 mb-2 animate-in fade-in duration-700">
                <h1 className="text-xl font-black mb-0.5 uppercase tracking-tighter">{currentTab?.header}</h1>
                <p className="text-[12px] text-white/90 leading-snug max-w-[95%] min-h-[32px] whitespace-pre-line">{currentTab?.sub}</p>
            </header>

            <div ref={sliderRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-y" style={{ scrollBehavior: 'smooth' }}>
                
                {/* --- СЛАЙД 1: RADAR (ПОЛНОСТЬЮ ТВОЙ КОД) --- */}
                <div className="min-w-full snap-center px-5">
                    <div className="space-y-3 animate-in fade-in duration-500">
                        {(() => {
                            const isTradLocal = activeCategory === 'traditional';
                            const themeColor = isTradLocal ? '#00F0FF' : '#FF00E5'; 
                            const themeBg = isTradLocal ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 0, 229, 0.05)';
                            const themeBorder = themeColor;
                            return (
                                <>
                                <header className="space-y-1">
                                    <p className="text-[13px] text-white/60 leading-relaxed font-medium max-w-[90%]">
                                        Сравни эффективность Tyrex с рыночными альтернативами по 6 ключевым метрикам. 
                                        <span className="block text-white/30 mt-0.5 italic text-[12px]">Выбирай актив для сопоставления:</span>
                                    </p>
                                </header>

                                <div className="relative flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-full overflow-hidden">
                                    <div className={clsx("absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-xl transition-all duration-500", isTradLocal ? "left-1" : "left-[calc(50%+1px)]")} />
                                    {['traditional', 'crypto'].map((cat: any) => (
                                        <button key={cat} onClick={() => {
                                            const currentIndex = CATEGORY_ASSETS[activeCategory].findIndex((a: any) => a.id === selectedAsset);
                                            setActiveCategory(cat as 'traditional' | 'crypto');
                                            const nextAsset = CATEGORY_ASSETS[cat][currentIndex]?.id || CATEGORY_ASSETS[cat][0].id;
                                            setSelectedAsset(nextAsset);
                                        }} className={clsx("relative z-10 flex-1 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300", activeCategory === cat ? "text-white" : "text-white/20")}>
                                            {cat === 'traditional' ? 'Традиционные' : 'Крипто'}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1" style={{ scrollSnapType: 'x mandatory' }}>
                                    {CATEGORY_ASSETS[activeCategory].map((asset: any) => {
                                        const isSelected = selectedAsset === asset.id;
                                        return (
                                            <button key={asset.id} onClick={() => setSelectedAsset(asset.id)} style={{ borderColor: isSelected ? themeBorder : 'rgba(255,255,255,0.05)', backgroundColor: isSelected ? themeBg : 'rgba(255,255,255,0.01)', width: 'calc((100vw - 56px) / 3)' }} className={clsx("relative flex items-center justify-center gap-2 py-2 px-2 rounded-xl border transition-all duration-300 flex-shrink-0 scroll-snap-align-start", isSelected ? "scale-[1.02] shadow-lg" : "hover:bg-white/[0.03]")}>
                                                <div style={{ backgroundColor: isSelected ? themeColor : 'transparent', boxShadow: isSelected ? `0 0 10px ${themeColor}` : 'none' }} className={clsx("flex-shrink-0 w-1 h-1 rounded-full transition-all duration-700", isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                                                <span style={{ color: isSelected ? themeColor : undefined }} className={clsx("text-[9px] font-black uppercase tracking-tight transition-all duration-300 truncate", !isSelected && "text-white/20")}>{asset.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="px-1 min-h-[80px]">
                                    <div className="bg-white/[0.02] border-l-2 p-4 rounded-r-2xl h-full shadow-inner" style={{ borderColor: themeColor }}>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-0.5" style={{ color: themeColor }}>Вывод</span>
                                        <p className="text-[13px] text-white/80 leading-relaxed font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedAsset] || 'Выберите актив для анализа.'} /></p>
                                    </div>
                                </div>

                                <div className="relative aspect-square w-full max-w-[300px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-1 flex items-center justify-center shadow-2xl overflow-visible mt-2">
                                    <RadarChartComponent key={`${selectedAsset}-${activeCategory}`} data={radarData} compareColor={themeColor} />
                                </div>

                                <div className="bg-[#121212]/50 border border-white/5 rounded-[2.5rem] p-5 shadow-xl">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                        {Object.keys(LEGEND_DATA).map((key, idx) => (
                                            <button key={idx} onClick={() => setModalInfo({ label: key, ...LEGEND_DATA[key] })} className="space-y-1 text-left active:scale-95 transition-transform">
                                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{key}</h4>
                                                <p className="text-[10px] text-white/50 leading-snug font-medium italic">{LEGEND_DATA[key].short}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* СЛАЙДЫ 2-5 (ИСПОЛЬЗУЮТ ЦИФРОВОЙ КОЛОДЕЦ) */}
                <div className="min-w-full snap-center px-5">
                    <GrowthAreaChart data={financialModel.points} goal={config.goal} goalReached={financialModel.finalValue >= config.goal} pedals={config.pedals} setPedals={()=>{}} pedalDescriptions={PEDAL_DESCRIPTIONS} />
                </div>

                <div className="min-w-full snap-center px-5">
                    <StrategyComparisonChart data={generateComparisonData('current')} />
                </div>

                <div className="min-w-full snap-center px-5">
                    <TimeSavingChart principal={config.principal} goal={config.goal} pedals={config.pedals} />
                </div>

                <div className="min-w-full snap-center px-5">
                    <InvestmentStructureChart data={structureData} totalValue={financialModel.finalValue} btcPrice={data?.btcPrice} />
                </div>
            </div>

            {/* --- КНОПКА НАСТРОЕК (СКРЫТА НА RADAR) --- */}
            {activeChart !== 'radar' && (
                <button 
                    onClick={() => setIsPanelOpen(true)}
                    className="fixed bottom-24 right-6 z-[70] bg-[#FDB931] text-black p-4 rounded-full shadow-[0_10px_30px_rgba(253,185,49,0.4)] active:scale-90 transition-all flex items-center gap-2"
                >
                    <Settings2 className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest pr-1">Стратегія</span>
                </button>
            )}

            {/* --- ВЫЕЗЖАЮЩАЯ ПАНЕЛЬ УПРАВЛЕНИЯ --- */}
            {isPanelOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsPanelOpen(false)}>
                    <div className="bg-[#0D0D0E] border-t border-white/10 w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Налаштування плану</h3>
                            <button onClick={() => setIsPanelOpen(false)} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1 text-[9px] uppercase font-black text-white/30"><Calculator className="w-2.5 h-2.5"/> Старт</div>
                                    <input type="number" value={config.principal} onChange={(e)=>setConfig({...config, principal: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-black text-[#FDB931] outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1 text-[9px] uppercase font-black text-white/30"><TrendingUp className="w-2.5 h-2.5"/> Доінвест</div>
                                    <input type="number" value={config.reinvest} onChange={(e)=>setConfig({...config, reinvest: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-black text-[#FDB931] outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1 text-[9px] uppercase font-black text-white/30"><Target className="w-2.5 h-2.5"/> Мета</div>
                                    <input type="number" value={config.goal} onChange={(e)=>setConfig({...config, goal: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-black text-[#FDB931] outline-none" />
                                </div>
                            </div>

                            <div className="space-y-6 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                                {Object.entries(config.pedals).map(([key, val]) => (
                                    <div key={key} className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                            <span className="text-white/60">{key}</span>
                                            <span className="text-[#FDB931]">{val}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={val} onChange={(e)=>setConfig({...config, pedals: {...config.pedals, [key]: Number(e.target.value)}})} className="w-full h-1 accent-[#FDB931] bg-white/10 rounded-full appearance-none cursor-pointer" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* МОДАЛКА ЛЕГЕНДЫ */}
            {modalInfo && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md" onClick={() => setModalInfo(null)}>
                    <div className="relative bg-[#111111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-white uppercase tracking-[0.1em]">{modalInfo.label}</h3>
                            <p className="text-[16px] text-white/80 leading-relaxed font-medium italic">{modalInfo.full}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsScreen;