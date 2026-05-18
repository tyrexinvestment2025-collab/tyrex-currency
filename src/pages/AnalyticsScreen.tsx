import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import FloatingNav from '../components/navigation/FloatingNav';
import { NumericalInputsHUD, PedalToggles } from './StaticInputPanel'; 
import { CATEGORY_ASSETS, TABS, ASSET_CONCLUSIONS, PEDAL_DESCRIPTIONS } from '../constants/AnalyticsConfig';

const PRESETS: any = {
    principal: [300, 500, 1000, 5000],
    reinvest: [50, 100, 200, 500],
    goal: [2000, 5000, 10000, 50000]
};

const FIELD_LABELS: any = {
    principal: 'Вкладаю відразу',
    reinvest: 'Додаю в місяць',
    goal: 'Хочу отримати'
};

const calculateCompoundData = (principal: number, reinvest: number, pedals: Record<string, number>, goal: number) => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const monthlyRate = (totalApy / 100) / 12 || 0.0001;
    let balance = principal;
    const startDate = new Date();
    const points = [{ month: 0, monthLabel: '0', value: principal }];
    let monthsToFreedom = 0;
    let freedomDateLabel = "";
    let reached = false;

    for (let i = 1; i <= 120; i++) {
        balance = balance * (1 + monthlyRate) + reinvest;
        if (!reached && balance >= goal) {
            monthsToFreedom = i;
            const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            freedomDateLabel = targetDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
            reached = true;
        }
        points.push({ month: i, monthLabel: `${i}-й міс`, value: Math.round(balance) });
        if (reached && i >= monthsToFreedom + 3) break;
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
        }, 10); 
        return () => clearInterval(interval);
    }, [text]);
    return <span>{displayedText}</span>;
};

const AnalyticsScreen: React.FC<{ scrollContainerRef?: React.RefObject<HTMLDivElement> }> = ({ scrollContainerRef }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeChart, setActiveChart] = useState('radar_trad');
    const [config, setConfig] = useState({
        principal: 500,
        reinvest: 50,
        goal: 2000,
        pedals: { yield: 15, boosters: 0, spec: 0, btc: 40, ref: 0, bonus: 0 }
    });

    const [selectorField, setSelectorField] = useState<string | null>(null);
    const [infoBooster, setInfoBooster] = useState<string | null>(null);
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

    const freedomText = freedomDateLabel 
        ? `Ваша точка фінансової свободи буде досягнута в: ${freedomDateLabel.toUpperCase()} (через ${monthsToFreedom} міс.). Використовуйте додаткові інструменти Tyrex по максимуму, щоб скоротити цей термін.`
        : `З поточною стратегією ціль за межами горизонту. Увімкніть більше педалей!`;

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB800]" /></div>;

    const currentTab = TABS.find(t => t.id === activeChart);

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans relative overflow-hidden">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            <div className="flex-1 flex flex-col pt-16">
                <header className="px-5 mb-2 shrink-0">
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-[#FFB800]">{currentTab?.header}</h1>
                    <p className="text-[11px] text-white/90 leading-snug max-w-[95%] whitespace-pre-line">{currentTab?.sub}</p>
                </header>

                <div ref={sliderRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar flex-1" style={{ scrollBehavior: 'smooth' }}>
                    
                    {/* ЭКРАН 1: ТРАДИЦИОННЫЕ */}
                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="space-y-4">
                            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
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
                                    <p className="text-[13px] text-white/80 font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedTrad]} /></p>
                                </div>
                            </div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-1 flex items-center justify-center shadow-2xl">
                                <RadarChartComponent data={getRadarData(selectedTrad)} compareColor="#00F0FF" />
                            </div>
                        </div>
                    </div>

                    {/* ЭКРАН 2: КРИПТО */}
                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="space-y-4">
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
                            <div className="px-1 min-h-[80px]">
                                <div className="bg-white/[0.02] border-l-2 border-[#FF00E5] p-4 rounded-r-2xl h-full shadow-inner">
                                    <p className="text-[13px] text-white/80 font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedCrypto]} /></p>
                                </div>
                            </div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-1 flex items-center justify-center shadow-2xl">
                                <RadarChartComponent data={getRadarData(selectedCrypto)} compareColor="#FF00E5" />
                            </div>
                        </div>
                    </div>

                    {/* ЭКРАН 3: ПРОГНОЗ (МАГИЯ) */}
                    <div className="min-w-full snap-center px-5 pt-2 flex flex-col overflow-y-auto no-scrollbar pb-24">
                        <NumericalInputsHUD config={config} onOpenSelector={setSelectorField} />

                        <div className="bg-white/[0.05] border-l-4 border-[#FFB800] p-4 rounded-r-2xl my-4 shrink-0 shadow-lg">
                            <p className="text-[12px] font-black text-white italic leading-relaxed">
                                <TypewriterText key={monthsToFreedom} text={freedomText} />
                            </p>
                        </div>
                        
                        <div className="relative min-h-[220px] mb-4 shrink-0">
                            <GrowthAreaChart data={points} goal={config.goal} targetMonth={monthsToFreedom} goalReached={points[points.length-1].value >= config.goal} pedals={config.pedals} setPedals={()=>{}} pedalDescriptions={{}} />
                        </div>

                        <PedalToggles config={config} setConfig={setConfig} onOpenInfo={setInfoBooster} />
                    </div>
                </div>
            </div>

            {/* --- SELECTOR SHEET (ВЫБОР ЧИСЕЛ) --- */}
            <AnimatePresence>
                {selectorField && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectorField(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 inset-x-0 z-[101] bg-[#0D0D0E] p-8 rounded-t-[3rem] border-t border-white/20">
                            <h3 className="text-xl font-black text-center mb-6">{FIELD_LABELS[selectorField]}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {PRESETS[selectorField].map((val: number) => (
                                    <button key={val} onClick={() => { setConfig({...config, [selectorField]: val}); setSelectorField(null); }} className="bg-white/5 p-4 rounded-2xl font-black text-lg border border-white/10 active:bg-[#FFB800] active:text-black">
                                        ${val.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- INFO POPUP (ИНФО ПЕДАЛЕЙ) --- */}
            <AnimatePresence>
                {infoBooster && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setInfoBooster(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111111] border border-white/10 p-8 rounded-[2.5rem] max-w-sm shadow-2xl">
                            <h3 className="text-[#FFB800] font-black uppercase text-xl mb-4">Довідка</h3>
                            <p className="text-white/80 leading-relaxed italic">{PEDAL_DESCRIPTIONS[infoBooster] || "Описание..."}</p>
                            <button className="mt-8 w-full py-4 bg-white/5 rounded-xl font-black uppercase text-xs">Зрозуміло</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalyticsScreen;