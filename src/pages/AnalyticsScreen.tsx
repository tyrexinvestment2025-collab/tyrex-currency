import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

// Компоненты
import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import StrategyComparisonChart from '../components/charts/StrategyComparisonChart';
import TimeSavingChart from '../components/charts/TimeSavingChart';
import InvestmentStructureChart from '../components/charts/InvestmentStructureChart';
import FloatingNav from '../components/navigation/FloatingNav';

// Конфиг и Утилиты
import { CATEGORY_ASSETS, INFO_GRID, TABS, PEDAL_DESCRIPTIONS } from '../constants/AnalyticsConfig';
import { calculateGrowthPoints } from '../utils/growthMath';
import { generateComparisonData } from '../utils/comparisonMath';
import { calculateStructureData } from '../utils/structureMath';

const AnalyticsScreen: React.FC<{ scrollContainerRef?: React.RefObject<HTMLDivElement> }> = ({ scrollContainerRef }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeChart, setActiveChart] = useState('radar');
    const [selectedAsset, setSelectedAsset] = useState('Real Estate');
    const [activeCategory, setActiveCategory] = useState<'traditional' | 'crypto'>('traditional');

    useEffect(() => {
        analyticsApi.getDashboard().then(res => {
            if (res.analytics) setData(res.analytics);
            setLoading(false);
        });
    }, []);

    const radarData = useMemo(() => {
        if (!data) return [];
        const benchmarks = [...data.benchmarks.traditional, ...data.benchmarks.crypto];
        const compareWith = benchmarks.find((b: any) => b.subject === selectedAsset) || benchmarks[0];
        
        // Порядок вершин по часовой стрелке (Верх -> Право -> Низ -> Лево)
        return [
            { subject: 'Потенціал', Tyrex: data.userScore.growth, Compare: compareWith.growth },   // TOP
            { subject: 'Доходність', Tyrex: data.userScore.yield, Compare: compareWith.yield },   // RIGHT-TOP
            { subject: 'Ліквідність', Tyrex: data.userScore.liquidity, Compare: compareWith.liquidity }, // RIGHT-BOTTOM
            { subject: 'Поріг входу', Tyrex: data.userScore.entry, Compare: compareWith.entry },   // BOTTOM
            { subject: 'Безпека', Tyrex: data.userScore.safety, Compare: compareWith.safety },    // LEFT-BOTTOM
            { subject: 'Пасивність', Tyrex: data.userScore.passive, Compare: compareWith.passive }, // LEFT-TOP
        ];
    }, [data, selectedAsset]);

    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <RefreshCw className="animate-spin text-[#FDB931]" />
        </div>
    );

    const currentTab = TABS.find(t => t.id === activeChart);

    // Стандартные параметры для калькуляций (педали)
    const defaultPedals = { yield: 15, ref: 5, btc: 40, boosters: 4, spec: 15 };

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-10 pt-24 px-5 font-sans overflow-x-hidden">
            <FloatingNav 
                tabs={TABS} 
                activeTab={activeChart} 
                setActiveTab={setActiveChart} 
                scrollContainerRef={scrollContainerRef} 
            />

            <header className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700 text-left">
                <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">{currentTab?.header}</h1>
                <p className="text-[13px] text-white/40 leading-relaxed max-w-[90%]">{currentTab?.sub}</p>
            </header>

            {/* 1. RADAR CHART */}
            {activeChart === 'radar' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-full w-full">
                        {['traditional', 'crypto'].map((cat: any) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={clsx(
                                    "flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all",
                                    activeCategory === cat ? "bg-white/10 text-white shadow-lg" : "text-white/20"
                                )}
                            >
                                {cat === 'traditional' ? 'Традиційні' : 'Крипто'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {CATEGORY_ASSETS[activeCategory].map((asset: any) => {
                            const isSelected = selectedAsset === asset.id;
                            return (
                                <button
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset.id)}
                                    className={clsx(
                                        "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                                        isSelected 
                                            ? "border-[#00F0FF]/40 bg-[#00F0FF]/5 shadow-[0_0_20px_rgba(0,240,255,0.05)]" 
                                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                                    )}
                                >
                                    <asset.icon size={16} className={isSelected ? "text-[#00F0FF]" : "text-white/20"} />
                                    <span className={clsx("text-[10px] font-black uppercase tracking-tight", isSelected ? "text-white" : "text-white/30")}>
                                        {asset.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative aspect-square w-full max-w-[420px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-2 flex items-center justify-center shadow-2xl overflow-visible">
                        <div className="w-full h-full">
                            <RadarChartComponent data={radarData} />
                        </div>
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-[#FDB931] rounded-full shadow-[0_0_12px_#FDB931]" />
                        </div>
                    </div>

                    <div className="bg-[#121212]/50 border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                            {INFO_GRID.map((item, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <h4 className="text-[10px] font-black text-white/90 uppercase tracking-widest">{item.label}</h4>
                                    <p className="text-[10px] text-white/30 leading-relaxed font-medium">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. GROWTH CHART */}
            {activeChart === 'growth' && (
                <div className="h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GrowthAreaChart 
                        data={calculateGrowthPoints(Number(data?.currentBalance) || 0, defaultPedals, 5)} 
                        goal={50000} 
                        goalReached={true} 
                        pedals={defaultPedals} 
                        setPedals={() => {}} 
                        pedalDescriptions={PEDAL_DESCRIPTIONS} 
                    />
                </div>
            )}

            {/* 3. ASSETS COMPARISON */}
            {activeChart === 'assets' && (
                <div className="h-[450px] animate-in fade-in duration-500">
                    <StrategyComparisonChart data={generateComparisonData('current')} />
                </div>
            )}

            {/* 4. TIME SAVING */}
            {activeChart === 'time' && (
                <div className="animate-in fade-in duration-500">
                    <TimeSavingChart 
                        principal={Number(data?.currentBalance) || 0} 
                        goal={50000} 
                        pedals={defaultPedals} 
                    />
                </div>
            )}

            {/* 5. STRUCTURE */}
            {activeChart === 'struct' && (
                <div className="animate-in fade-in duration-500">
                    <InvestmentStructureChart 
                        data={calculateStructureData(Number(data?.currentBalance) || 1, defaultPedals, 3)} 
                        totalValue={Number(data?.currentBalance) || 1000} 
                        btcPrice={data?.btcPrice} 
                    />
                </div>
            )}
        </div>
    );
};

export default AnalyticsScreen;