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

const calculateCompoundData = (principal: number, reinvest: number, pedals: Record<string, number>, goal: number, timeframe: number = 60) => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const monthlyRate = (totalApy / 100) / 12 || 0.0001;
    let balance = principal;
    const startDate = new Date();
    
    const points = [{ 
        month: 0, 
        monthLabel: '0', 
        dateLabel: startDate.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }),
        value: principal 
    }];
    
    let monthsToFreedom = 0;
    let freedomDateLabel = "";
    let reached = false;

    for (let i = 1; i <= 120; i++) {
        balance = balance * (1 + monthlyRate) + reinvest;
        const currentMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        
        if (!reached && balance >= goal) {
            monthsToFreedom = i;
            freedomDateLabel = currentMonthDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
            reached = true;
        }

        points.push({ 
            month: i, 
            monthLabel: `${i}м`, 
            dateLabel: currentMonthDate.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }),
            value: Math.round(balance) 
        });

        // Масштабування графіка згідно таймфрейму
        if (i >= timeframe && timeframe !== 120) break; 
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
        }, 12); 
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
    const [modalInfo, setModalInfo] = useState<any>(null);
    const [timeframe, setTimeframe] = useState(60); 

    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        analyticsApi.getDashboard().then(res => {
            if (res.analytics) setData(res.analytics);
            setLoading(false);
        });
    }, []);

    const { points, monthsToFreedom, freedomDateLabel } = useMemo(() => 
        calculateCompoundData(config.principal, config.reinvest, config.pedals, config.goal, timeframe), 
    [config, timeframe]);

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
        ? `Ціль буде досягнута: ${freedomDateLabel.toUpperCase()} (${monthsToFreedom} міс.). Використовуйте інструменти прискорення.`
        : `З поточною стратегією ціль за межами горизонту планування. Увімкніть педалі!`;

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB700]" /></div>;

    const currentTab = TABS.find(t => t.id === activeChart);

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans relative overflow-hidden">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            <div className="flex-1 flex flex-col pt-16">
                <header className="px-5 mb-1 shrink-0">
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none"
                        style={{ background: 'linear-gradient(to bottom, #FFD700, #B8860B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {currentTab?.header}
                    </h1>
                    <p className="text-[11px] text-[#808080] leading-snug mt-1 max-w-[95%]">
                        {activeChart === 'radar_trad' && "Сравни эффективность Tyrex с рыночными альтернативами по 6 ключевым метрикам."}
                        {activeChart === 'radar_crypto' && "Сравни эффективность Tyrex с крипто инструментами по 6 ключевым метрикам."}
                        {activeChart === 'forecast' && "Введіть ваші дані, щоб побачити майбутнє вашого капіталу."}
                    </p>
                </header>

                <div ref={sliderRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar flex-1" style={{ scrollBehavior: 'smooth' }}>
                    
                    {/* ЕКРАН 1: ТРАДИЦІЙНІ */}
                    <div className="min-w-full snap-center px-5 py-2 overflow-y-auto no-scrollbar pb-20">
                        <div className="space-y-4">
                            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORY_ASSETS.traditional.map((asset: any) => {
                                    const isSelected = selectedTrad === asset.id;
                                    return (
                                        <button key={asset.id} onClick={() => setSelectedTrad(asset.id)} className={clsx("py-2.5 px-6 rounded-xl border-2 transition-all duration-300 text-[9px] font-black uppercase flex-shrink-0", isSelected ? "border-[#00F0FF] text-white bg-[#00F0FF]/20 shadow-[0_0_20px_rgba(0,240,255,0.4)]" : "border-white/20 text-white/60 bg-[#1A1A1E] hover:border-white/40")}>{asset.label}</button>
                                    );
                                })}
                            </div>
                            <div className="bg-[#141414] border-l-2 border-[#00F0FF] p-4 rounded-r-2xl min-h-[80px] border border-[#222222]"><p className="text-[13px] text-white/80 font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedTrad]} /></p></div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-[#222222] rounded-[3rem] p-1 flex items-center justify-center shadow-2xl"><RadarChartComponent data={getRadarData(selectedTrad)} compareColor="#00F0FF" /></div>
                            <div className="bg-[#141414] border border-[#222222] rounded-[2rem] p-5 shadow-xl">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    {Object.keys(LEGEND_DATA).map((key, idx) => (
                                        <button key={idx} onClick={() => setModalInfo({ label: key, ...LEGEND_DATA[key] })} className="space-y-1 text-left active:scale-95 transition-transform"><h4 className="text-[10px] font-black text-white uppercase tracking-widest">{key}</h4><p className="text-[10px] text-white/50 font-medium italic">{LEGEND_DATA[key].short}</p></button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ЕКРАН 2: КРИПТО */}
                    <div className="min-w-full snap-center px-5 py-2 overflow-y-auto no-scrollbar pb-20">
                        <div className="space-y-4">
                            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORY_ASSETS.crypto.map((asset: any) => {
                                    const isSelected = selectedCrypto === asset.id;
                                    return (
                                        <button key={asset.id} onClick={() => setSelectedCrypto(asset.id)} className={clsx("py-2.5 px-6 rounded-xl border-2 transition-all duration-300 text-[9px] font-black uppercase flex-shrink-0", isSelected ? "border-[#FF00E5] text-white bg-[#FF00E5]/20 shadow-[0_0_20px_rgba(255,0,229,0.4)]" : "border-white/20 text-white/60 bg-[#1A1A1E] hover:border-white/40")}>{asset.label}</button>
                                    );
                                })}
                            </div>
                            <div className="bg-[#141414] border-l-2 border-[#FF00E5] p-4 rounded-r-2xl min-h-[80px] border border-[#222222]"><p className="text-[13px] text-white/80 font-medium"><TypewriterText text={ASSET_CONCLUSIONS[selectedCrypto]} /></p></div>
                            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-[#0D0D0D] border border-[#222222] rounded-[3rem] p-1 flex items-center justify-center shadow-2xl"><RadarChartComponent data={getRadarData(selectedCrypto)} compareColor="#FF00E5" /></div>
                            <div className="bg-[#141414] border border-[#222222] rounded-[2rem] p-5 shadow-xl">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    {Object.keys(LEGEND_DATA).map((key, idx) => (
                                        <button key={idx} onClick={() => setModalInfo({ label: key, ...LEGEND_DATA[key] })} className="space-y-1 text-left active:scale-95 transition-transform"><h4 className="text-[10px] font-black text-white uppercase tracking-widest">{key}</h4><p className="text-[10px] text-white/50 font-medium italic">{LEGEND_DATA[key].short}</p></button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ЕКРАН 3: ПРОГНОЗ */}
                    <div className="min-w-full snap-center px-5 pt-2 flex flex-col overflow-y-auto no-scrollbar pb-32">
                        <NumericalInputsHUD config={config} onOpenSelector={setSelectorField} />

                        <div className="bg-[#141414] border-l-4 border-[#FFB700] p-4 rounded-r-2xl my-4 shrink-0 shadow-lg border border-[#222222]">
                            <p className="text-[12px] font-black text-white italic leading-relaxed uppercase tracking-tight">
                                <TypewriterText key={monthsToFreedom} text={freedomText} />
                            </p>
                        </div>
                        
                        <PedalList config={config} setConfig={setConfig} onOpenInfo={setInfoBooster} />

                        {/* ТАЙМФРЕЙМИ З КРАПКОЮ */}
                        <div className="flex justify-center gap-8 my-6">
                            {[12, 36, 60, 120].map(v => (
                                <button key={v} onClick={() => setTimeframe(v)} className="flex flex-col items-center gap-1 group active:scale-90 transition-all">
                                    <span className={clsx("text-xs font-black transition-all", timeframe === v ? "text-white scale-110" : "text-[#808080]")}>
                                        {v / 12}Р
                                    </span>
                                    <div className={clsx("w-1 h-1 rounded-full transition-all", timeframe === v ? "bg-[#FFB700] opacity-100" : "bg-transparent opacity-0")} />
                                </button>
                            ))}
                        </div>

                        <div className="relative min-h-[250px] mb-4 shrink-0">
                            <GrowthAreaChart data={points} goal={config.goal} targetMonth={monthsToFreedom} pedals={config.pedals} setPedals={setConfig} />
                        </div>
                    </div>
                </div>
            </div>

            {/* SELECTOR SHEET */}
            <AnimatePresence>
                {selectorField && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectorField(null)} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 z-[101] bg-[#141414] p-8 rounded-t-[2.5rem] border-t border-[#222222]">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <h3 className="text-xl font-bold text-center mb-8 text-[#808080] uppercase tracking-widest">{FIELD_LABELS[selectorField]}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {PRESETS[selectorField].map((val: number) => (
                                    <button key={val} onClick={() => { setConfig({...config, [selectorField]: val}); setSelectorField(null); }} className="bg-[#080808] border border-[#222222] p-6 rounded-xl flex justify-between items-center hover:bg-white/5 active:border-[#FFB700] transition-all group">
                                        <span className="text-2xl font-black text-white group-active:text-[#FFB700] tracking-tighter">${val.toLocaleString()}</span>
                                        <ChevronRight size={20} className="text-[#808080]" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            
            {/* INFO POPUP */}
            <AnimatePresence>
                {infoBooster && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md" onClick={() => setInfoBooster(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#141414] border border-[#222222] p-10 rounded-[3rem] max-w-sm shadow-2xl text-center">
                            <div className="w-16 h-16 bg-[#FFB700]/10 rounded-full flex items-center justify-center mx-auto mb-6"><Info size={32} className="text-[#FFB700]" /></div>
                            <h3 className="text-[#FFB700] font-black uppercase text-xl mb-4 tracking-widest">Довідка</h3>
                            <p className="text-white font-medium leading-relaxed text-lg italic opacity-90">{PEDAL_DESCRIPTIONS[infoBooster]}</p>
                            <button className="mt-10 w-full py-5 bg-[#FFB700] text-black rounded-2xl font-black uppercase tracking-widest">Зрозуміло</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LEGEND MODAL */}
            <AnimatePresence>
                {modalInfo && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md" onClick={() => setModalInfo(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-[#141414] border border-[#222222] w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-2xl font-black text-[#FFB700] uppercase tracking-tight mb-4">{modalInfo.label}</h3>
                            <p className="text-[16px] text-white/80 leading-relaxed font-medium italic mb-8">{modalInfo.full}</p>
                            <button onClick={() => setModalInfo(null)} className="w-full py-4 bg-[#FFB700] text-black rounded-xl font-black uppercase text-xs">Закрити</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalyticsScreen;