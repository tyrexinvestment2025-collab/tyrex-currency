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
const [modalInfo, setModalInfo] = useState<any>(null);
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
    <div className="space-y-6 animate-in fade-in duration-700">
        
        {/* --- 1. УЛУЧШЕННЫЙ ХЕΔЕР (ЧИТАЕМОСТЬ 10/10) --- */}
        <header className="space-y-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                Сравнение <br /> активов
            </h1>
            <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-[#00F0FF]/50" />
                <span className="text-[10px] font-black text-[#00F0FF] uppercase tracking-[0.3em]">
                    Инструментарий
                </span>
            </div>
            <p className="text-[13px] text-white/60 leading-relaxed font-medium max-w-[90%]">
                Сравни эффективность Tyrex с рыночными альтернативами по 6 ключевым метрикам. 
                <span className="block text-white/30 mt-1 italic">Выбирай актив для сопоставления:</span>
            </p>
        </header>

        {/* --- 2. КАТЕГОРИИ (SLIDING TOGGLE) --- */}
        <div className="relative flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-full overflow-hidden">
            <div 
                className={clsx(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-xl transition-all duration-500 ease-out",
                    activeCategory === 'traditional' ? "left-1" : "left-[calc(50%+1px)]"
                )}
            />
            {['traditional', 'crypto'].map((cat: any) => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={clsx(
                        "relative z-10 flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300",
                        activeCategory === cat ? "text-white" : "text-white/20"
                    )}
                >
                    {cat === 'traditional' ? 'Традиционные' : 'Крипто'}
                </button>
            ))}
        </div>

<div className="grid grid-cols-2 gap-2.5">
    {CATEGORY_ASSETS[activeCategory].map((asset: any) => {
        const isSelected = selectedAsset === asset.id;
        return (
            <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={clsx(
                    "relative flex items-center justify-between py-3.5 px-4 rounded-xl border transition-all duration-300",
                    isSelected 
                        ? "border-[#00F0FF]/40 bg-[#00F0FF]/5 shadow-[inset_0_0_15px_rgba(0,240,255,0.05)] scale-[1.02]" 
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                )}
            >
                {/* Текст: уменьшил до 10px и чуть урезал tracking */}
                <span className={clsx(
                    "text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 truncate pr-2",
                    isSelected ? "text-white" : "text-white/20"
                )}>
                    {asset.label}
                </span>

                {/* Точка: тоже чуть уменьшил (w-1 h-1), чтобы была аккуратнее */}
                <div className={clsx(
                    "flex-shrink-0 w-1 h-1 rounded-full transition-all duration-700 shadow-[0_0_8px_#00F0FF]",
                    isSelected 
                        ? "bg-[#00F0FF] opacity-100 scale-100" 
                        : "bg-white/10 opacity-0 scale-50"
                )} />
            </button>
        );
    })}
</div>

        {/* --- 4. ГРАФИК --- */}
        <div className="relative aspect-square w-full max-w-[390px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-2 flex items-center justify-center shadow-2xl overflow-visible">
            <RadarChartComponent key={selectedAsset} data={radarData} />
        </div>

        {/* --- 5. ЛЕГЕНДА (КЛИКАБЕЛЬНАЯ С ИКОНКАМИ) --- */}
        <div className="bg-[#121212]/50 border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                {INFO_GRID.map((item, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setModalInfo(item)}
                        className="space-y-2 text-left active:scale-95 transition-transform group"
                    >
                        <div className="flex items-center gap-2">
                            {/* Здесь предполагается наличие иконок в INFO_GRID или их маппинг */}
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-[#00F0FF] transition-colors">
                                {item.label}
                            </h4>
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed font-medium italic group-hover:text-white/80 transition-colors">
                            {item.text}
                        </p>
                    </button>
                ))}
            </div>
        </div>

        {/* --- 6. МОДАЛЬНОЕ ОКНО --- */}
        {modalInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-[#111111] border border-[#00F0FF]/20 w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                    <h3 className="text-2xl font-black text-[#FFB800] uppercase mb-4 tracking-tighter">
                        {modalInfo.label}
                    </h3>
                    <p className="text-[15px] text-white/70 leading-relaxed mb-8 font-medium">
                        {modalInfo.text}
                    </p>
                    <button 
                        onClick={() => setModalInfo(null)}
                        className="w-full py-4 bg-[#00F0FF] text-black font-black uppercase rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-95 transition-transform"
                    >
                        Понятно
                    </button>
                </div>
            </div>
        )}
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