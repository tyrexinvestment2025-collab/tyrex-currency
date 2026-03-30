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

import { CATEGORY_ASSETS, TABS, PEDAL_DESCRIPTIONS } from '../constants/AnalyticsConfig';
import { calculateGrowthPoints } from '../utils/growthMath';
import { generateComparisonData } from '../utils/comparisonMath';
import { calculateStructureData } from '../utils/structureMath';

const LEGEND_DATA: any = {
    'ДОХОДНОСТЬ': { 
        short: 'Сколько актив приносит прибыли в год', 
        full: 'Демонстрирует, насколько вырастет ваш капитал за один год использования выбранного инструмента. Измеряется в % годовых.' 
    },
    'ПОТЕНЦИАЛ РОСТА': { 
        short: 'Вероятность многократного роста цены актива', 
        full: 'Оценка «иксов». Показывает долгосрочную ценность актива и его способность дорожать независимо от выплачиваемых дивидендов.' 
    },
    'ПРОСТОТА': { 
        short: 'Уровень сложности управления', 
        full: 'Порог необходимых знаний и усилий. Высокий балл означает, что актив не требует большой компетенции или вовлеченности, чтобы зарабатывать. Бизнес — сложен в управлении, а депозит наоборот.' 
    },
    'ЛИКВИДНОСТЬ': { 
        short: 'Насколько просто превратить актив в наличные', 
        full: 'Возможность быстро забрать средства без потери стоимости. Высокое значение означает мгновенный доступ к кэшу в любой момент. Например, у Недвижимости низкая ликвидность, т.к. её продажа требует времени.' 
    },
    'ПОРОГ ВХОДА': { 
        short: 'Сколько денег нужно для старта', 
        full: 'Финансовая доступность инструмента. Чем выше этот показатель на графике, тем МЕНЬШАЯ сумма требуется для начала инвестирования.' 
    },
    'БЕЗОПАСНОСТЬ': { 
        short: 'Насколько велик риск потерять деньги', 
        full: 'Комплексный показатель надежности. Высокое значение означает минимальную вероятность просадки и гарантированную сохранность вложенного капитала.' 
    }
};

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
        <div className="min-h-screen bg-[#080808] text-white pb-10 pt-24 px-5 font-sans overflow-x-hidden relative">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={setActiveChart} scrollContainerRef={scrollContainerRef} />

            <header className="mt-5 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-xl font-black mb-1 uppercase tracking-tighter">
                    {currentTab?.header}
                </h1>
                <p className="text-[12px] text-white/90 leading-snug max-w-[95%] whitespace-pre-line">
                    {currentTab?.sub}
                </p>
            </header>

            {activeChart === 'radar' && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    
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
                                <div 
                                    className={clsx(
                                        "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-xl transition-all duration-500 ease-out",
                                        isTradLocal ? "left-1" : "left-[calc(50%+1px)]"
                                    )}
                                />
                                {['traditional', 'crypto'].map((cat: any) => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            const currentIndex = CATEGORY_ASSETS[activeCategory].findIndex((a: { id: string; }) => a.id === selectedAsset);
                                            setActiveCategory(cat);
                                            const nextAsset = CATEGORY_ASSETS[cat][currentIndex]?.id || CATEGORY_ASSETS[cat][0].id;
                                            setSelectedAsset(nextAsset);
                                        }}
                                        className={clsx(
                                            "relative z-10 flex-1 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300",
                                            activeCategory === cat ? "text-white" : "text-white/20"
                                        )}
                                    >
                                        {cat === 'traditional' ? 'Традиционные' : 'Крипто'}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {CATEGORY_ASSETS[activeCategory].map((asset: any) => {
                                    const isSelected = selectedAsset === asset.id;
                                    return (
                                        <button
                                            key={asset.id}
                                            onClick={() => setSelectedAsset(asset.id)}
                                            style={{ 
                                                borderColor: isSelected ? themeBorder : 'rgba(255,255,255,0.05)',
                                                backgroundColor: isSelected ? themeBg : 'rgba(255,255,255,0.01)'
                                            }}
                                            className={clsx(
                                                "relative flex items-center justify-center gap-2 py-2 rounded-xl border transition-all duration-300",
                                                isSelected ? "scale-[1.02] shadow-lg" : "hover:bg-white/[0.03]"
                                            )}
                                        >
                                            <div 
                                                style={{ 
                                                    backgroundColor: isSelected ? themeColor : 'transparent',
                                                    boxShadow: isSelected ? `0 0 10px ${themeColor}` : 'none'
                                                }}
                                                className={clsx(
                                                    "flex-shrink-0 w-1 h-1 rounded-full transition-all duration-700",
                                                    isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                                )} 
                                            />
                                            <span 
                                                style={{ color: isSelected ? themeColor : undefined }}
                                                className={clsx(
                                                    "text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 truncate",
                                                    !isSelected && "text-white/20"
                                                )}
                                            >
                                                {asset.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative aspect-square w-full mx-auto flex items-center justify-center overflow-visible mt-4 mb-8">
                                <RadarChartComponent 
                                    key={`${selectedAsset}-${activeCategory}`} 
                                    data={radarData} 
                                    compareColor={themeColor} 
                                />
                            </div>

                            <div className="bg-[#121212]/50 border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                    {Object.keys(LEGEND_DATA).map((key, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => setModalInfo({ label: key, ...LEGEND_DATA[key] })}
                                            className="space-y-1 text-left active:scale-95 transition-transform"
                                        >
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
                                                {key}
                                            </h4>
                                            <p className="text-[10px] text-white/50 leading-snug font-medium italic">
                                                {LEGEND_DATA[key].short}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            </>
                        );
                    })()}

                    {modalInfo && (
                        <div 
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
                            onClick={() => setModalInfo(null)} 
                        >
                            <div 
                                className="relative bg-[#111111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200"
                                style={{ borderLeft: `4px solid ${activeCategory === 'traditional' ? '#00F0FF' : '#FF00E5'}` }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-[0.1em]">
                                        {modalInfo.label}
                                    </h3>
                                    <p className="text-[16px] text-white/80 leading-relaxed font-medium italic">
                                        {modalInfo.full}
                                    </p>
                                </div>
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