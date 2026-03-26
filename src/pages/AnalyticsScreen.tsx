import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import StrategyComparisonChart from '../components/charts/StrategyComparisonChart';
import TimeSavingChart from '../components/charts/TimeSavingChart';
import InvestmentStructureChart from '../components/charts/InvestmentStructureChart';
import FloatingNav from '../components/navigation/FloatingNav';

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
        
        return [
            { subject: 'Потенциал', Tyrex: data.userScore.growth, Compare: compareWith.growth },   
            { subject: 'Доходность', Tyrex: data.userScore.yield, Compare: compareWith.yield },   
            { subject: 'Ликвидность', Tyrex: data.userScore.liquidity, Compare: compareWith.liquidity }, 
            { subject: 'Вход', Tyrex: data.userScore.entry, Compare: compareWith.entry },   
            { subject: 'Риск', Tyrex: data.userScore.safety, Compare: compareWith.safety },    
            { subject: 'Пассивность', Tyrex: data.userScore.passive, Compare: compareWith.passive }, 
        ];
    }, [data, selectedAsset]);

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB800]" /></div>;

    const currentTab = TABS.find(t => t.id === activeChart);
    const defaultPedals = { yield: 15, ref: 5, btc: 40, boosters: 4, spec: 15 };

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-10 pt-24 px-5 font-sans overflow-x-hidden">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={setActiveChart} scrollContainerRef={scrollContainerRef} />

            <header className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter">{currentTab?.header}</h1>
                {/* whitespace-pre-line реализует перенос строки из конфига */}
                <p className="text-[12px] text-white/90 leading-snug max-w-[95%] whitespace-pre-line">
                    {currentTab?.sub}
                </p>
            </header>

            {activeChart === 'radar' && (
                <div className="space-y-5 animate-in fade-in duration-500">
                    
                    <div className="flex p-0.5 bg-white/[0.03] border border-white/5 rounded-full w-full">
                        {['traditional', 'crypto'].map((cat: any) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={clsx(
                                    "flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeCategory === cat ? "bg-white/10 text-white shadow-lg" : "text-white/20"
                                )}
                            >
                                {cat === 'traditional' ? 'Традиционные' : 'Крипто'}
                            </button>
                        ))}
                    </div>

                    {/* Сжатые кнопки без иконок */}
                    <div className="grid grid-cols-2 gap-2">
                        {CATEGORY_ASSETS[activeCategory].map((asset: any) => {
                            const isSelected = selectedAsset === asset.id;
                            return (
                                <button
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset.id)}
                                    className={clsx(
                                        "flex items-center justify-center py-2 px-2 rounded-xl border transition-all duration-300",
                                        isSelected 
                                            ? "border-[#00F0FF]/40 bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.05)]" 
                                            : "border-white/5 bg-white/[0.02]"
                                    )}
                                >
                                    <span className={clsx("text-[9px] font-black uppercase tracking-wide", isSelected ? "text-white" : "text-white/25")}>
                                        {asset.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Увеличенная паутина */}
                    <div className="relative aspect-square w-full max-w-[390px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] p-2 flex items-center justify-center shadow-2xl overflow-visible">
                        <div className="w-full h-full">
                            <RadarChartComponent data={radarData} />
                        </div>
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-1 h-1 bg-[#FFB800] rounded-full shadow-[0_0_8px_#FFB800]" />
                        </div>
                    </div>

                    {/* Инфо-блок с ярким текстом */}
                    <div className="bg-[#121212]/50 border border-white/5 rounded-[2rem] p-6">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                            {INFO_GRID.map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <h4 className="text-[10px] font-black text-white/95 uppercase tracking-wider">{item.label}</h4>
                                    <p className="text-[10px] text-white/90 leading-relaxed font-medium">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeChart === 'growth' && <div className="h-[480px] animate-in fade-in duration-500"><GrowthAreaChart data={calculateGrowthPoints(Number(data?.currentBalance) || 0, defaultPedals, 5)} goal={50000} goalReached={true} pedals={defaultPedals} setPedals={() => {}} pedalDescriptions={PEDAL_DESCRIPTIONS} /></div>}
            {activeChart === 'assets' && <div className="h-[400px] animate-in fade-in duration-500"><StrategyComparisonChart data={generateComparisonData('current')} /></div>}
            {activeChart === 'time' && <div className="animate-in fade-in duration-500"><TimeSavingChart principal={Number(data?.currentBalance) || 0} goal={50000} pedals={defaultPedals} /></div>}
            {activeChart === 'struct' && <div className="animate-in fade-in duration-500"><InvestmentStructureChart data={calculateStructureData(Number(data?.currentBalance) || 1, defaultPedals, 3)} totalValue={Number(data?.currentBalance) || 1000} btcPrice={data?.btcPrice} /></div>}
        </div>
    );
};

export default AnalyticsScreen;