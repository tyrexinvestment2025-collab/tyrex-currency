import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import FloatingNav from '../components/navigation/FloatingNav';
import { NumericalInputs, PedalButtons } from './StaticInputPanel'; 

import { CATEGORY_ASSETS, TABS, ASSET_CONCLUSIONS } from '../constants/AnalyticsConfig';

// --- МАТЕМАТИКА С ДАТАМИ ---
const calculateCompoundData = (principal: number, reinvest: number, pedals: Record<string, number>, goal: number) => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const monthlyRate = (totalApy / 100) / 12 || 0.0001;
    let balance = principal;
    
    const startDate = new Date();
    const points = [{ 
        month: 0, 
        monthLabel: 'Старт', 
        dateLabel: startDate.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }),
        value: principal 
    }];
    
    let monthsToFreedom = 0;
    let freedomDateLabel = "";
    let reached = false;

    for (let i = 1; i <= 120; i++) {
        balance = balance * (1 + monthlyRate) + reinvest;
        
        const currentMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const dateStr = currentMonthDate.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' });

        if (!reached && balance >= goal) {
            monthsToFreedom = i;
            freedomDateLabel = currentMonthDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
            reached = true;
        }

        points.push({ 
            month: i, 
            monthLabel: `${i}-й міс`, 
            dateLabel: dateStr,
            value: Math.round(balance) 
        });

        if (reached && i >= monthsToFreedom + 3) break;
        if (i === 120) break; // Ограничение 10 лет
    }
    return { points, monthsToFreedom, freedomDateLabel };
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
    // const [hasInteracted, setHasInteracted] = useState(false);
    
    const [config, setConfig] = useState({
        principal: 500,
        reinvest: 50,
        goal: 2000,
        pedals: { yield: 0, boosters: 0, spec: 0, btc: 0, ref: 0, bonus: 0 }
    });

    const [selectedTrad, setSelectedTrad] = useState('Real Estate');
    const [selectedCrypto, setSelectedCrypto] = useState('Staking');

    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        analyticsApi.getDashboard().then(res => {
            if (res.analytics) setData(res.analytics);
            setLoading(false);
        });
    }, []);

    const { points, monthsToFreedom, freedomDateLabel } = useMemo(() => 
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

    const handleNumericalInput = (key: string, val: string) => {
        const num = parseInt(val.replace(/\D/g, '')) || 0;
        setConfig({ ...config, [key]: Math.max(0, num) });
    };

    const getRadarData = (assetId: string) => {
        if (!data) return [];
        const benchmarks = [...data.benchmarks.traditional, ...data.benchmarks.crypto];
        const compareWith = benchmarks.find((b: any) => b.subject === assetId) || benchmarks[0];
        return [
            { subject: 'Доходность', Tyrex: 90, Compare: compareWith.yield },   
            { subject: 'Потенциал', Tyrex: 80, Compare: compareWith.growth },   
            { subject: 'Ликвидность', Tyrex: 100, Compare: compareWith.liquidity }, 
            { subject: 'Вход', Tyrex: 100, Compare: compareWith.entry },   
            { subject: 'Риск', Tyrex: 90, Compare: compareWith.safety },    
        ];
    };

    // Текст с датой
    const freedomText = freedomDateLabel 
        ? `Ваша точка фінансової свободи буде досягнута в: ${freedomDateLabel.toUpperCase()} (через ${monthsToFreedom} міс.). Використовуйте інструменти Tyrex, щоб прискорити цей шлях.`
        : `З поточною стратегією ціль поки що за межами горизонту планування. Додайте інструменти Tyrex для прискорення!`;

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB800]" /></div>;

    const currentTab = TABS.find(t => t.id === activeChart);

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans relative overflow-hidden">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            <div className="flex-1 flex flex-col pt-16">
                <header className="px-5 mb-1 shrink-0">
                    <h1 className="text-xl font-black uppercase tracking-tighter text-[#FDB931]">{currentTab?.header}</h1>
                    <p className="text-[11px] text-white/90 leading-snug max-w-[95%]">{currentTab?.sub}</p>
                </header>

                <div ref={sliderRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar flex-1" style={{ scrollBehavior: 'smooth' }}>
                    
                    {/* СЛАЙД 1 & 2 ОСТАЮТСЯ ПРЕЖНИМИ... */}
                    <div className="min-w-full snap-center px-5 py-2">
                         <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORY_ASSETS.traditional.map((asset: any) => {
                                    const isSelected = selectedTrad === asset.id;
                                    return (
                                        <button key={asset.id} onClick={() => setSelectedTrad(asset.id)} style={{ borderColor: isSelected ? '#00F0FF' : 'rgba(255,255,255,0.05)', backgroundColor: isSelected ? 'rgba(0,240,255,0.05)' : 'rgba(255,255,255,0.01)', width: '100px' }} className="relative flex items-center justify-center gap-2 py-2 rounded-xl border transition-all duration-300 flex-shrink-0">
                                            <span style={{ color: isSelected ? '#00F0FF' : undefined }} className={clsx("text-[9px] font-black uppercase truncate", !isSelected && "text-white/20")}>{asset.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="px-1 min-h-[80px] my-4">
                                <div className="bg-white/[0.02] border-l-2 border-[#00F0FF] p-4 rounded-r-2xl h-full">
                                    <p className="text-[13px] text-white/80 leading-relaxed font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedTrad]} /></p>
                                </div>
                            </div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-1 flex items-center justify-center mt-2 shadow-2xl">
                                <RadarChartComponent data={getRadarData(selectedTrad)} compareColor="#00F0FF" />
                            </div>
                    </div>

                    <div className="min-w-full snap-center px-5 py-2">
                         <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORY_ASSETS.crypto.map((asset: any) => {
                                    const isSelected = selectedCrypto === asset.id;
                                    return (
                                        <button key={asset.id} onClick={() => setSelectedCrypto(asset.id)} style={{ borderColor: isSelected ? '#FF00E5' : 'rgba(255,255,255,0.05)', backgroundColor: isSelected ? 'rgba(255,0,229,0.05)' : 'rgba(255,255,255,0.01)', width: '100px' }} className="relative flex items-center justify-center gap-2 py-2 rounded-xl border transition-all duration-300 flex-shrink-0">
                                            <span style={{ color: isSelected ? '#FF00E5' : undefined }} className={clsx("text-[9px] font-black uppercase tracking-tight truncate", !isSelected && "text-white/20")}>{asset.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="px-1 min-h-[80px] my-4">
                                <div className="bg-white/[0.02] border-l-2 border-[#FF00E5] p-4 rounded-r-2xl h-full shadow-inner">
                                    <p className="text-[13px] text-white/80 leading-relaxed font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedCrypto]} /></p>
                                </div>
                            </div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-1 flex items-center justify-center mt-2 shadow-2xl">
                                <RadarChartComponent data={getRadarData(selectedCrypto)} compareColor="#FF00E5" />
                            </div>
                    </div>

                    {/* СЛАЙД 3: ПРОГНОЗ */}
                    <div className="min-w-full snap-center px-5 pt-2 flex flex-col overflow-y-auto no-scrollbar pb-20">
                        <div className="mb-4 shrink-0">
                            <NumericalInputs config={config} handleInput={handleNumericalInput} />
                        </div>

                        <div className="bg-white/[0.03] border-l-2 border-[#FDB931] p-3 rounded-r-xl mb-4 min-h-[70px] shrink-0">
                            <p className="text-[12px] font-bold text-white/90 italic leading-relaxed">
                                <TypewriterText key={monthsToFreedom} text={freedomText} />
                            </p>
                        </div>
                        
                        <div className="relative flex-1 min-h-[260px] shrink-0">
                            <GrowthAreaChart 
                                data={points} 
                                goal={config.goal} 
                                // Передаем номер месяца достижения цели для отрисовки линии
                                targetMonth={monthsToFreedom}
                                goalReached={points[points.length-1].value >= config.goal} 
                                pedals={config.pedals} 
                                setPedals={()=>{}} 
                                pedalDescriptions={{}} 
                            />
                        </div>

                        <div className="mt-4 shrink-0">
                            <PedalButtons config={config} setConfig={setConfig} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsScreen;