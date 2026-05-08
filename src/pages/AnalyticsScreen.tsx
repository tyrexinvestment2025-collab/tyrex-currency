import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

import RadarChartComponent from '../components/charts/RadarChart';
import GrowthAreaChart from '../components/charts/GrowthAreaChart';
import FloatingNav from '../components/navigation/FloatingNav';
import { NumericalInputsHUD, PedalButtons } from './StaticInputPanel'; 
import { CATEGORY_ASSETS, TABS, ASSET_CONCLUSIONS } from '../constants/AnalyticsConfig';

const PRESETS: any = {
    principal: [300, 500, 1000, 5000],
    reinvest: [50, 100, 200, 500],
    goal: [2000, 5000, 10000, 50000]
};

const FIELD_LABELS: any = {
    principal: 'Стартовий капітал',
    reinvest: 'Щомісячний внесок',
    goal: 'Фінансова ціль'
};

// ... (Функция calculateCompoundData остается без изменений из вашего кода) ...
const calculateCompoundData = (principal: number, reinvest: number, pedals: Record<string, number>, goal: number) => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const monthlyRate = (totalApy / 100) / 12 || 0.0001;
    let balance = principal;
    const startDate = new Date();
    const points = [{ 
        month: 0, monthLabel: 'Старт', 
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
            month: i, monthLabel: `${i}-й міс`, 
            dateLabel: currentMonthDate.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }),
            value: Math.round(balance) 
        });
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
        }, 15); 
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
        pedals: { yield: 0, boosters: 0, spec: 0, btc: 0, ref: 0, bonus: 0 }
    });

    const [selectorField, setSelectorField] = useState<string | null>(null);
    const [manualValue, setManualValue] = useState('');
    const [isManual, setIsManual] = useState(false);

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

    // ... (handleScroll и handleTabChange без изменений) ...
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

    const selectValue = (val: number) => {
        if (val <= 0) return;
        setConfig({ ...config, [selectorField!]: val });
        setSelectorField(null);
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
        ? `Ваша точка фінансової свободи буде досягнута в: ${freedomDateLabel.toUpperCase()} (через ${monthsToFreedom} міс.). Використовуйте інструменти Tyrex, щоб прискорити цей шлях.`
        : `З поточною стратегією ціль поки що за межами горизонту планування. Додайте інструменти Tyrex для прискорення!`;

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB800]" /></div>;

    const currentTab = TABS.find(t => t.id === activeChart);

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans relative overflow-hidden">
            <FloatingNav tabs={TABS} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            <div className="flex-1 flex flex-col pt-16">
                <header className="px-5 mb-1 shrink-0">
                    <h1 className="text-xl font-black uppercase tracking-tighter text-[#FFB800]">{currentTab?.header}</h1>
                    <p className="text-[11px] text-white/90 leading-snug max-w-[95%]">{currentTab?.sub}</p>
                </header>

                <div ref={sliderRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar flex-1" style={{ scrollBehavior: 'smooth' }}>
                    
                    {/* СЛАЙДЫ 1 и 2 (Оригинальные радары) */}
                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                            {CATEGORY_ASSETS.traditional.map((asset: any) => (
                                <button key={asset.id} onClick={() => setSelectedTrad(asset.id)} className={clsx("py-2 px-6 rounded-xl border transition-all text-[9px] font-black uppercase", selectedTrad === asset.id ? "border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.3)]" : "border-white/5 text-white/20")}>
                                    {asset.label}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white/[0.02] border-l-2 border-[#00F0FF] p-4 rounded-r-2xl my-4 min-h-[80px]">
                            <p className="text-[13px] text-white/80"><TypewriterText text={ASSET_CONCLUSIONS[selectedTrad]} /></p>
                        </div>
                        <div className="relative aspect-square w-full max-w-[280px] mx-auto">
                            <RadarChartComponent data={getRadarData(selectedTrad)} compareColor="#00F0FF" />
                        </div>
                    </div>

                    <div className="min-w-full snap-center px-5 py-2">
                        <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto no-scrollbar pb-1">
                            {CATEGORY_ASSETS.crypto.map((asset: any) => (
                                <button key={asset.id} onClick={() => setSelectedCrypto(asset.id)} className={clsx("py-2 px-6 rounded-xl border transition-all text-[9px] font-black uppercase", selectedCrypto === asset.id ? "border-[#FF00E5] text-[#FF00E5] bg-[#FF00E5]/10 shadow-[0_0_15px_rgba(255,0,229,0.3)]" : "border-white/5 text-white/20")}>
                                    {asset.label}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white/[0.02] border-l-2 border-[#FF00E5] p-4 rounded-r-2xl my-4 min-h-[80px]">
                            <p className="text-[13px] text-white/80"><TypewriterText text={ASSET_CONCLUSIONS[selectedCrypto]} /></p>
                        </div>
                        <div className="relative aspect-square w-full max-w-[280px] mx-auto">
                            <RadarChartComponent data={getRadarData(selectedCrypto)} compareColor="#FF00E5" />
                        </div>
                    </div>

                    {/* СЛАЙД 3: ПРОГНОЗ */}
                    <div className="min-w-full snap-center px-5 pt-2 flex flex-col overflow-y-auto no-scrollbar pb-20">
                        <div className="mb-4 shrink-0">
                            <NumericalInputsHUD config={config} onOpenSelector={(f: string) => { setSelectorField(f); setIsManual(false); setManualValue(''); }} />
                        </div>

                        <div className="bg-white/[0.03] border-l-4 border-[#FFB800] p-4 rounded-r-2xl mb-4 shrink-0 shadow-lg">
                            <p className="text-[12px] font-black text-white italic leading-relaxed">
                                <TypewriterText key={monthsToFreedom} text={freedomText} />
                            </p>
                        </div>
                        
                        <div className="relative flex-1 min-h-[260px] shrink-0 mb-4">
                            <GrowthAreaChart data={points} goal={config.goal} targetMonth={monthsToFreedom} goalReached={points[points.length-1].value >= config.goal} pedals={config.pedals} setPedals={()=>{}} pedalDescriptions={{}} />
                        </div>

                        <div className="shrink-0">
                            <PedalButtons config={config} setConfig={setConfig} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- СТИЛЬНЫЙ SELECTOR SHEET (PUSH NOTIFICATION) --- */}
            <AnimatePresence>
                {selectorField && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectorField(null)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-[#0D0D0E] border-t border-white/20 rounded-t-[3rem] z-[101] p-8 pb-12 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-8 text-center">{FIELD_LABELS[selectorField]}</h3>
                            
                            {!isManual ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {PRESETS[selectorField].map((val: number) => (
                                            <button key={val} onClick={() => selectValue(val)} className="bg-white/[0.03] border border-white/10 p-6 rounded-[1.8rem] flex justify-between items-center hover:bg-white/10 transition-all active:scale-95 shadow-xl">
                                                <span className="text-2xl font-black text-[#FFB800] tracking-tighter">${val.toLocaleString()}</span>
                                                <ChevronRight className="w-6 h-6 text-white/20" />
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setIsManual(true)} className="w-full py-5 text-white/40 font-black uppercase tracking-[0.2em] text-[10px] hover:text-[#FFB800] transition-colors mt-4">Ввести суму вручну</button>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-[#FFB800]">$</span>
                                        <input autoFocus type="number" value={manualValue} onChange={(e) => setManualValue(e.target.value)} className="w-full bg-white/[0.03] border-2 border-[#FFB800] rounded-[2rem] p-8 pl-14 text-4xl font-black outline-none shadow-[0_0_30px_rgba(255,184,0,0.15)]" placeholder="0" />
                                    </div>
                                    <button disabled={Number(manualValue) <= 0} onClick={() => selectValue(Number(manualValue))} className="w-full bg-[#FFB800] text-black py-6 rounded-[2rem] font-black uppercase text-lg tracking-widest disabled:opacity-30 disabled:grayscale transition-all active:scale-95 shadow-2xl">Підтвердити</button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalyticsScreen;