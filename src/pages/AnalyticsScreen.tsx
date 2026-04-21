import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw, Lock } from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import StrategyComparisonChart from '../components/charts/StrategyComparisonChart';
import TimeSavingChart from '../components/charts/TimeSavingChart';
import InvestmentStructureChart from '../components/charts/InvestmentStructureChart';
import FloatingNav from '../components/navigation/FloatingNav';
import StaticInputPanel from './StaticInputPanel'; 

import { CATEGORY_ASSETS, TABS, PEDAL_DESCRIPTIONS, ASSET_CONCLUSIONS, LEGEND_DATA } from '../constants/AnalyticsConfig';
import { generateComparisonData } from '../utils/comparisonMath';

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
    const [hasInteracted, setHasInteracted] = useState(false);
    
    const [config, setConfig] = useState({
        principal: 0,
        reinvest: 0,
        goal: 10000,
        pedals: { yield: 15, boosters: 4, spec: 15, btc: 40, ref: 5, bonus: 0 }
    });

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

    const financialModel = useMemo(() => calculateCompoundData(config.principal, config.reinvest, config.pedals), [config]);
    const structureData = useMemo(() => {
        const totalApy = Object.values(config.pedals).reduce((a, b) => a + b, 0);
        const profit = financialModel.finalValue - financialModel.totalInvested;
        const getShare = (val: number) => (totalApy === 0 ? 0 : profit * (val / totalApy));
        return [
            { name: 'Власні кошти', value: financialModel.totalInvested, color: '#2A2A2E' },
            { name: 'Прибуток Tyrex', value: getShare(config.pedals.yield + config.pedals.spec), color: '#8B5CF6' },
            { name: 'Бонуси та Ріст', value: getShare(config.pedals.ref + config.pedals.btc + config.pedals.boosters), color: '#FDB931' },
        ];
    }, [config, financialModel]);

    const handleScroll = () => {
        if (isProgrammaticScroll.current || !sliderRef.current) return;
        const index = Math.round(sliderRef.current.scrollLeft / sliderRef.current.offsetWidth);
        if (TABS[index] && TABS[index].id !== activeChart) {
            setActiveChart(TABS[index].id);
        }
    };

    const handleTabChange = (tabId: string) => {
        const index = TABS.findIndex(t => t.id === tabId);
        if (index !== -1 && sliderRef.current) {
            isProgrammaticScroll.current = true;
            setActiveChart(tabId);
            sliderRef.current.scrollTo({
                left: index * sliderRef.current.offsetWidth,
                behavior: 'smooth'
            });
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
        <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans relative overflow-hidden">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            {/* ОСНОВНОЙ КОНТЕНТ */}
            <div className="flex-1 flex flex-col pt-16">
                <header className="px-5 mb-1 shrink-0">
                    <h1 className="text-xl font-black uppercase tracking-tighter leading-tight">{currentTab?.header}</h1>
                    <p className="text-[10px] text-white/40 leading-snug">{currentTab?.sub}</p>
                </header>

                <div 
                    ref={sliderRef} 
                    onScroll={handleScroll} 
                    className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar flex-1" 
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {/* СЛАЙД 1: RADAR (ОСТАВЛЕН ПРЕЖНИМ) */}
                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="space-y-3">
                            {(() => {
                                const isTradLocal = activeCategory === 'traditional';
                                const themeColor = isTradLocal ? '#00F0FF' : '#FF00E5'; 
                                const themeBg = isTradLocal ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 0, 229, 0.05)';
                                const themeBorder = themeColor;
                                return (
                                    <>
                                    <header className="space-y-1">
                                        <p className="text-[13px] text-white/60 leading-relaxed font-medium">
                                            Сравни эффективность Tyrex с рыночными альтернативами по 6 ключевым метрикам. 
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
                                            }} className={clsx("relative z-10 flex-1 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors", activeCategory === cat ? "text-white" : "text-white/20")}>
                                                {cat === 'traditional' ? 'Традиционные' : 'Крипто'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {CATEGORY_ASSETS[activeCategory].map((asset: any) => {
                                            const isSelected = selectedAsset === asset.id;
                                            return (
                                                <button key={asset.id} onClick={() => setSelectedAsset(asset.id)} style={{ borderColor: isSelected ? themeBorder : 'rgba(255,255,255,0.05)', backgroundColor: isSelected ? themeBg : 'rgba(255,255,255,0.01)', width: 'calc((100vw - 56px) / 3)' }} className={clsx("relative flex items-center justify-center gap-2 py-2 px-2 rounded-xl border transition-all duration-300 flex-shrink-0")}>
                                                    <div style={{ backgroundColor: isSelected ? themeColor : 'transparent' }} className={clsx("flex-shrink-0 w-1 h-1 rounded-full transition-all duration-700", isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                                                    <span style={{ color: isSelected ? themeColor : undefined }} className={clsx("text-[9px] font-black uppercase truncate", !isSelected && "text-white/20")}>{asset.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="px-1">
                                        <div className="bg-white/[0.02] border-l-2 p-3 rounded-r-2xl h-full shadow-inner" style={{ borderColor: themeColor }}>
                                            <p className="text-[12px] text-white/80 leading-relaxed"><TypewriterText text={ASSET_CONCLUSIONS[selectedAsset] || 'Выберите актив для анализа.'} /></p>
                                        </div>
                                    </div>

                                    <div className="relative aspect-square w-full max-w-[260px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-1 flex items-center justify-center mt-2 shadow-2xl">
                                        <RadarChartComponent key={`${selectedAsset}-${activeCategory}`} data={radarData} compareColor={themeColor} />
                                    </div>

                                    <div className="bg-[#121212]/50 border border-white/5 rounded-[2.5rem] p-5 shadow-xl">
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                            {Object.keys(LEGEND_DATA).map((key, idx) => (
                                                <button key={idx} onClick={() => setModalInfo({ label: key, ...LEGEND_DATA[key] })} className="text-left">
                                                    <h4 className="text-[10px] font-black text-white uppercase">{key}</h4>
                                                    <p className="text-[9px] text-white/50 leading-snug">{LEGEND_DATA[key].short}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* СЛАЙДЫ 2-5 (СТРАТЕГИЯ) */}
                    {[
                        <GrowthAreaChart data={financialModel.points} goal={config.goal} goalReached={financialModel.finalValue >= config.goal} pedals={config.pedals} setPedals={()=>{}} pedalDescriptions={PEDAL_DESCRIPTIONS} />,
                        <StrategyComparisonChart data={generateComparisonData('current')} />,
                        <TimeSavingChart principal={config.principal} goal={config.goal} pedals={config.pedals} />,
                        <InvestmentStructureChart data={structureData} totalValue={financialModel.finalValue} btcPrice={data?.btcPrice} />
                    ].map((component, idx) => (
                        <div key={idx} className="min-w-full snap-center px-5 pt-4 flex flex-col">
                            
                            {/* ЗОНА ГРАФИКА / LOCK */}
                            <div className="relative w-full aspect-[4/3] mb-4">
                                {!hasInteracted && (
                                    <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-6 shadow-2xl">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                                            <Lock className="w-8 h-8 text-[#FDB931]" />
                                        </div>
                                        <h2 className="text-lg font-black uppercase italic tracking-tighter mb-2">Прогноз заблоковано</h2>
                                        <p className="text-[11px] text-white/40 mb-6 text-center leading-relaxed">Налаштуйте стратегію для активації розрахунку</p>
                                        <button 
                                            onClick={() => setHasInteracted(true)}
                                            className="bg-white text-black px-10 py-4 rounded-full font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                                        >
                                            Розрахувати
                                        </button>
                                    </div>
                                )}
                                <div className={clsx("w-full h-full transition-all duration-700", !hasInteracted && "blur-2xl opacity-10")}>
                                    {component}
                                </div>
                            </div>

                            {/* ПАНЕЛЬ УПРАВЛЕНИЯ (ПРИЖАТА К ГРАФИКУ) */}
                            {hasInteracted && (
                                <div className="animate-in slide-in-from-bottom-5 duration-700">
                                    <StaticInputPanel config={config} setConfig={setConfig} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* МОДАЛКА ЛЕГЕНДЫ */}
            {modalInfo && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md" onClick={() => setModalInfo(null)}>
                    <div className="relative bg-[#111111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{modalInfo.label}</h3>
                        <p className="text-[16px] text-white/80 leading-relaxed font-medium italic">{modalInfo.full}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsScreen;