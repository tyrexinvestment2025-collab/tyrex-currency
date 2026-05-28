import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import FloatingNav from '../components/navigation/FloatingNav';
import { NumericalInputsHUD, PedalList } from './StaticInputPanel'; 
import { CATEGORY_ASSETS, TABS, ASSET_CONCLUSIONS, PEDAL_DESCRIPTIONS, LEGEND_DATA } from '../constants/AnalyticsConfig';

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
    const points = [{ month: 0, monthLabel: '0', dateLabel: startDate.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }), value: principal }];
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
        points.push({
            month: i, monthLabel: `${i}м`, value: Math.round(balance),
            dateLabel: ''
        });
        if (reached && i >= monthsToFreedom + 5) break;
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
        principal: 1000,
        reinvest: 100,
        goal: 5000,
        pedals: { yield: 15, boosters: 0, spec: 0, btc: 40, ref: 0, bonus: 0 }
    });

    const [selectorField, setSelectorField] = useState<string | null>(null);
    const [infoBooster, setInfoBooster] = useState<string | null>(null);
    const [selectedTrad, setSelectedTrad] = useState('Real Estate');
    const [selectedCrypto, setSelectedCrypto] = useState('Staking');
    const [_modalInfo, setModalInfo] = useState<any>(null);

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

    const handleTabChange = (tabId: string) => {
        const index = TABS.findIndex(t => t.id === tabId);
        if (index !== -1 && sliderRef.current) {
            setActiveChart(tabId);
            sliderRef.current.scrollTo({ left: index * sliderRef.current.offsetWidth, behavior: 'smooth' });
        }
    };

    const handleScroll = () => {
        if (!sliderRef.current) return;
        const index = Math.round(sliderRef.current.scrollLeft / sliderRef.current.offsetWidth);
        if (TABS[index] && TABS[index].id !== activeChart) setActiveChart(TABS[index].id);
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
        ? `Ваша точка фінансової свободи буде досягнута в: ${freedomDateLabel.toUpperCase()} (через ${monthsToFreedom} міс.). Використовуйте додаткові інструменти Tyrex по максимуму.`
        : `З поточною стратегією ціль за межами горизонту. Увімкніть більше інструментів!`;

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB800]" /></div>;

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans relative overflow-hidden">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            <div className="flex-1 flex flex-col pt-16">
                <header className="px-5 mb-1 shrink-0">
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-[#FFB800] leading-none">
                        {TABS.find(t => t.id === activeChart)?.header}
                    </h1>
                    <p className="text-[11px] text-white/60 leading-snug mt-1 max-w-[95%]">
                        {activeChart === 'radar_trad' && "Сравни эффективность Tyrex с рыночными альтернативами по 6 ключевым метрикам."}
                        {activeChart === 'radar_crypto' && "Сравни эффективность Tyrex с крипто инструментами по 6 ключевым метрикам."}
                        {activeChart === 'forecast' && "Введіть ваші дані, щоб побачити, коли ваш пасивний дохід досягне Цілі."}
                    </p>
                </header>

                <div ref={sliderRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar flex-1" style={{ scrollBehavior: 'smooth' }}>
                    
                    {/* (ЕКРАНИ 1 ТА 2 - РАДАР ЧАРТ) */}
                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="space-y-4">
                            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORY_ASSETS.traditional.map((asset: any) => {
                                    const isSelected = selectedTrad === asset.id;
                                    return (
                                        <button key={asset.id} onClick={() => setSelectedTrad(asset.id)} className={clsx("py-2.5 px-6 rounded-xl border-2 transition-all duration-300 text-[9px] font-black uppercase flex-shrink-0", isSelected ? "border-[#00F0FF] text-white bg-[#00F0FF]/20 shadow-[0_0_20px_rgba(0,240,255,0.4)]" : "border-white/20 text-white/60 bg-[#1A1A1E]")}>{asset.label}</button>
                                    );
                                })}
                            </div>
                            <div className="bg-[#1A1A1E] border-l-2 border-[#00F0FF] p-4 rounded-r-2xl min-h-[80px]"><p className="text-[13px] text-white/80 font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedTrad]} /></p></div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-white/10 rounded-[3rem] p-1 flex items-center justify-center shadow-2xl"><RadarChartComponent data={getRadarData(selectedTrad)} compareColor="#00F0FF" /></div>
                            <div className="bg-[#121212]/50 border border-white/5 rounded-[2.5rem] p-5 shadow-xl">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    {Object.keys(LEGEND_DATA).map((key, idx) => (
                                        <button key={idx} onClick={() => setModalInfo({ label: key, ...LEGEND_DATA[key] })} className="space-y-1 text-left active:scale-95 transition-transform"><h4 className="text-[10px] font-black text-white uppercase tracking-widest">{key}</h4><p className="text-[10px] text-white/50 font-medium italic">{LEGEND_DATA[key].short}</p></button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="space-y-4">
                            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORY_ASSETS.crypto.map((asset: any) => {
                                    const isSelected = selectedCrypto === asset.id;
                                    return (
                                        <button key={asset.id} onClick={() => setSelectedCrypto(asset.id)} className={clsx("py-2.5 px-6 rounded-xl border-2 transition-all duration-300 text-[9px] font-black uppercase flex-shrink-0", isSelected ? "border-[#FF00E5] text-white bg-[#FF00E5]/20 shadow-[0_0_20px_rgba(255,0,229,0.4)]" : "border-white/20 text-white/60 bg-[#1A1A1E]")}>{asset.label}</button>
                                    );
                                })}
                            </div>
                            <div className="bg-[#1A1A1E] border-l-2 border-[#FF00E5] p-4 rounded-r-2xl min-h-[80px]"><p className="text-[13px] text-white/80 font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedCrypto]} /></p></div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-white/10 rounded-[3rem] p-1 flex items-center justify-center shadow-2xl"><RadarChartComponent data={getRadarData(selectedCrypto)} compareColor="#FF00E5" /></div>
                            <div className="bg-[#121212]/50 border border-white/5 rounded-[2.5rem] p-5 shadow-xl">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    {Object.keys(LEGEND_DATA).map((key, idx) => (
                                        <button key={idx} onClick={() => setModalInfo({ label: key, ...LEGEND_DATA[key] })} className="space-y-1 text-left active:scale-95 transition-transform"><h4 className="text-[10px] font-black text-white uppercase tracking-widest">{key}</h4><p className="text-[10px] text-white/50 font-medium italic">{LEGEND_DATA[key].short}</p></button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ЕКРАН 3: ПРОГНОЗ (МАГІЯ) — НОВИЙ ПОРЯДОК БЛОКІВ */}
                    <div className="min-w-full snap-center px-5 pt-2 flex flex-col overflow-y-auto no-scrollbar pb-32">
                        
                        {/* 1. ВЕРХНІ 3 КАПСУЛИ (ВКЛАДАЮ / ДОДАЮ / ХОЧУ) */}
                        <div className="shrink-0">
                            <NumericalInputsHUD config={config} onOpenSelector={setSelectorField} />
                        </div>

                        {/* 2. БЕГУЩАЯ СТРОКА (РЕЗУЛЬТАТ) */}
                        <div className="bg-[#1A1A1E] border-l-4 border-[#FFB800] p-4 rounded-r-2xl my-4 shrink-0 shadow-lg">
                            <p className="text-[12px] font-black text-white italic leading-relaxed">
                                <TypewriterText key={monthsToFreedom} text={freedomText} />
                            </p>
                        </div>
                        
                        {/* 3. БЛОК ПЕДАЛЕЙ (ВЕРТИКАЛЬНИЙ СТЕК) */}
                        <div className="shrink-0 mb-6">
                            <PedalList config={config} setConfig={setConfig} onOpenInfo={setInfoBooster} />
                        </div>

                        {/* 4. ГРАФІК */}
                        <div className="relative min-h-[280px] shrink-0">
                            <GrowthAreaChart 
                                data={points} 
                                goal={config.goal} 
                                targetMonth={monthsToFreedom} 
                                pedals={config.pedals} 
                                setPedals={setConfig} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* (МОДАЛКИ SELECTOR, INFO, LEGEND — БЕЗ ЗМІН) */}
            <AnimatePresence>
                {selectorField && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectorField(null)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 z-[101] bg-[#0D0D0E] p-8 rounded-t-[3rem] border-t border-white/20 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <h3 className="text-xl font-black text-center mb-8 uppercase tracking-tight">{FIELD_LABELS[selectorField]}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {PRESETS[selectorField].map((val: number) => (
                                    <button key={val} onClick={() => { setConfig({...config, [selectorField]: val}); setSelectorField(null); }} className="bg-[#1A1A1E] border border-white/20 p-6 rounded-[2.5rem] flex justify-between items-center hover:bg-white/10 active:scale-95 shadow-xl transition-all">
                                        <span className="text-2xl font-black text-[#FFB800] tracking-tighter">${val.toLocaleString()}</span>
                                        <ChevronRight size={20} />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {infoBooster && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md" onClick={() => setInfoBooster(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1A1A1E] border border-white/20 p-10 rounded-[3rem] max-w-sm shadow-2xl text-center">
                            <div className="w-16 h-16 bg-[#FFB800]/10 rounded-full flex items-center justify-center mx-auto mb-6"><Info size={32} className="text-[#FFB800]" /></div>
                            <h3 className="text-[#FFB800] font-black uppercase text-xl mb-4 tracking-widest">Довідка</h3>
                            <p className="text-white font-medium leading-relaxed text-lg italic opacity-90">{PEDAL_DESCRIPTIONS[infoBooster]}</p>
                            <button className="mt-10 w-full py-5 bg-[#FFB800] text-black rounded-2xl font-black uppercase tracking-widest">Зрозуміло</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalyticsScreen;