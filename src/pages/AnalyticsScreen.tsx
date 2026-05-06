import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import FloatingNav from '../components/navigation/FloatingNav';
import StaticInputPanel from './StaticInputPanel'; 

import { CATEGORY_ASSETS, TABS, ASSET_CONCLUSIONS, LEGEND_DATA } from '../constants/AnalyticsConfig';

// --- МАТЕМАТИКА (СЛОЖНЫЙ ПРОЦЕНТ + ПОИСК МЕСЯЦА ЦЕЛИ) ---
const calculateCompoundData = (principal: number, reinvest: number, pedals: Record<string, number>, goal: number) => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const monthlyRate = (totalApy / 100) / 12;
    let balance = principal;
    const points = [{ month: 0, value: principal }];
    let monthsToFreedom = 0;
    let reached = false;

    for (let i = 1; i <= 120; i++) { // Расчет на 10 лет
        balance = balance * (1 + monthlyRate) + reinvest;
        if (!reached && balance >= goal) {
            monthsToFreedom = i;
            reached = true;
        }
        points.push({ month: i, value: Math.round(balance) });
    }
    return { points, monthsToFreedom };
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
        }, 15); 
        return () => clearInterval(interval);
    }, [text]);
    return <span>{displayedText}</span>;
};

const AnalyticsScreen: React.FC<{ scrollContainerRef?: React.RefObject<HTMLDivElement> }> = ({ scrollContainerRef }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeChart, setActiveChart] = useState('radar_trad');
    
    // ДАННЫЕ ПО УМОЛЧАНИЮ ДЛЯ ПРОГНОЗА
    const [config, setConfig] = useState({
        principal: 500,
        reinvest: 50,
        goal: 2000,
        pedals: { yield: 0, boosters: 0, spec: 0, btc: 0, ref: 0, bonus: 0 }
    });

    const [selectedTrad, setSelectedTrad] = useState('Real Estate');
    const [selectedCrypto, setSelectedCrypto] = useState('Staking');
    const [modalInfo, setModalInfo] = useState<any>(null);

    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        analyticsApi.getDashboard().then(res => {
            if (res.analytics) setData(res.analytics);
            setLoading(false);
        });
    }, []);

    // РАСЧЕТ ПРОГНОЗА
    const { points, monthsToFreedom } = useMemo(() => 
        calculateCompoundData(config.principal, config.reinvest, config.pedals, config.goal), 
    [config]);

    const handleScroll = () => {
        if (!sliderRef.current) return;
        const index = Math.round(sliderRef.current.scrollLeft / sliderRef.current.offsetWidth);
        if (TABS[index] && TABS[index].id !== activeChart) setActiveChart(TABS[index].id);
    };

    const handleTabChange = (tabId: string) => {
        const index = TABS.findIndex(t => t.id === tabId);
        if (index !== -1 && sliderRef.current) {
            setActiveChart(tabId);
            sliderRef.current.scrollTo({ left: index * sliderRef.current.offsetWidth, behavior: 'smooth' });
        }
    };

    const getRadarData = (assetId: string) => {
        if (!data) return [];
        const benchmarks = [...data.benchmarks.traditional, ...data.benchmarks.crypto];
        const compareWith = benchmarks.find((b: any) => b.subject === assetId) || benchmarks[0];
        return [
            { subject: 'Доходность', Tyrex: 90, Compare: compareWith.yield },   
            { subject: 'Потенциал', Tyrex: 80, Compare: compareWith.growth },   
            { subject: 'Пассивность', Tyrex: 90, Compare: compareWith.passive }, 
            { subject: 'Ликвидность', Tyrex: 100, Compare: compareWith.liquidity }, 
            { subject: 'Вход', Tyrex: 100, Compare: compareWith.entry },   
            { subject: 'Риск', Tyrex: 90, Compare: compareWith.safety },    
        ];
    };

    const freedomText = `Ваша точка финансовой свободы будет достигнута через ${monthsToFreedom || '>120'} месяцев. Используйте дополнительные инструменты Tyrex по максимуму, чтобы сократить этот срок и увеличить темпы генерации вашего пассивного дохода.`;

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB800]" /></div>;

    const currentTab = TABS.find(t => t.id === activeChart);

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans relative overflow-hidden">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            <div className="flex-1 flex flex-col pt-16">
                <header className="px-5 mb-2 shrink-0">
                    <h1 className="text-xl font-black uppercase tracking-tighter text-[#FDB931]">{currentTab?.header}</h1>
                    <p className="text-[11px] text-white/90 leading-snug max-w-[95%] whitespace-pre-line">{currentTab?.sub}</p>
                </header>

                <div 
                    ref={sliderRef} 
                    onScroll={handleScroll} 
                    className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar flex-1" 
                    style={{ scrollBehavior: 'smooth' }}
                >
                    
                    {/* ЭКРАН 1: СРАВНЕНИЕ (ТРАДИЦИОННЫЕ) */}
                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="space-y-4">
                            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1" style={{ scrollSnapType: 'x mandatory' }}>
                                {CATEGORY_ASSETS.traditional.map((asset: any) => {
                                    const isSelected = selectedTrad === asset.id;
                                    return (
                                        <button key={asset.id} onClick={() => setSelectedTrad(asset.id)} style={{ borderColor: isSelected ? '#00F0FF' : 'rgba(255,255,255,0.05)', backgroundColor: isSelected ? 'rgba(0,240,255,0.05)' : 'rgba(255,255,255,0.01)', width: '100px' }} className="relative flex items-center justify-center gap-2 py-2 rounded-xl border transition-all duration-300 flex-shrink-0">
                                            <span style={{ color: isSelected ? '#00F0FF' : undefined }} className={clsx("text-[9px] font-black uppercase tracking-tight truncate", !isSelected && "text-white/20")}>{asset.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="px-1 min-h-[80px]">
                                <div className="bg-white/[0.02] border-l-2 border-[#00F0FF] p-4 rounded-r-2xl h-full shadow-inner">
                                    <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                                        <TypewriterText text={ASSET_CONCLUSIONS[selectedTrad]} />
                                    </p>
                                </div>
                            </div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-1 flex items-center justify-center mt-2 shadow-2xl">
                                <RadarChartComponent data={getRadarData(selectedTrad)} compareColor="#00F0FF" />
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
                        </div>
                    </div>

                    {/* ЭКРАН 2: КРИПТО */}
                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="space-y-4">
                            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1" style={{ scrollSnapType: 'x mandatory' }}>
                                {CATEGORY_ASSETS.crypto.map((asset: any) => {
                                    const isSelected = selectedCrypto === asset.id;
                                    return (
                                        <button key={asset.id} onClick={() => setSelectedCrypto(asset.id)} style={{ borderColor: isSelected ? '#FF00E5' : 'rgba(255,255,255,0.05)', backgroundColor: isSelected ? 'rgba(255,0,229,0.05)' : 'rgba(255,255,255,0.01)', width: '100px' }} className="relative flex items-center justify-center gap-2 py-2 rounded-xl border transition-all duration-300 flex-shrink-0">
                                            <span style={{ color: isSelected ? '#FF00E5' : undefined }} className={clsx("text-[9px] font-black uppercase tracking-tight truncate", !isSelected && "text-white/20")}>{asset.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="px-1 min-h-[80px]">
                                <div className="bg-white/[0.02] border-l-2 border-[#FF00E5] p-4 rounded-r-2xl h-full shadow-inner">
                                    <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                                        <TypewriterText text={ASSET_CONCLUSIONS[selectedCrypto]} />
                                    </p>
                                </div>
                            </div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-1 flex items-center justify-center mt-2 shadow-2xl">
                                <RadarChartComponent data={getRadarData(selectedCrypto)} compareColor="#FF00E5" />
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
                        </div>
                    </div>

                    {/* ЭКРАН 3: ПРОГНОЗ */}
                    <div className="min-w-full snap-center px-5 pt-2 flex flex-col">
                        <div className="bg-white/[0.03] border-l-2 border-[#FDB931] p-4 rounded-r-2xl mb-4">
                            <p className="text-[12px] font-bold text-white/90 italic leading-relaxed">
                                <TypewriterText key={monthsToFreedom} text={freedomText} />
                            </p>
                        </div>
                        
                        <div className="relative flex-1 min-h-[220px] mb-4">
                            <GrowthAreaChart 
                                data={points} 
                                goal={config.goal} 
                                goalReached={points[points.length-1].value >= config.goal} 
                                pedals={config.pedals} 
                                setPedals={()=>{}} 
                                pedalDescriptions={{}} 
                            />
                        </div>

                        <div className="pb-4">
                            <StaticInputPanel config={config} setConfig={setConfig} />
                        </div>
                    </div>
                </div>
            </div>

            {/* МОДАЛКА ЛЕГЕНДЫ */}
            {modalInfo && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md" onClick={() => setModalInfo(null)}>
                    <div className="relative bg-[#111111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{modalInfo.label}</h3>
                        <p className="text-[16px] text-white/80 leading-relaxed font-medium italic">{modalInfo.full}</p>
                        <p className="mt-8 text-[10px] text-white/20 uppercase tracking-widest text-center">Нажмите для закрытия</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsScreen;