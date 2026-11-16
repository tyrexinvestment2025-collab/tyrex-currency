import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, ChevronRight, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';
import { useTyrexStore } from '../store/useTyrexStore';
import { intlLocale } from '../i18n';
import { fmtUsd, fmtPct } from '../lib/format';
import { errorText } from '../lib/i18nHelpers';

import RadarChartComponent, { type RadarDatum } from '../components/charts/RadarChart';
import GrowthAreaChart, { type GrowthPointDatum } from '../components/charts/GrowthAreaChart';
import FloatingNav from '../components/navigation/FloatingNav';
import { NumericalInputsHUD, PedalList, type ForecastConfig, type InputField } from './StaticInputPanel';
import { CATEGORY_ASSETS, METRIC_KEYS, TAB_IDS, type MetricKey, type PedalId, type TabId } from '../constants/AnalyticsConfig';

type Benchmark = { subject: string } & Record<MetricKey, number>;

interface AnalyticsData {
    currentBalance: number;
    financialGoal: number;
    baseApy: number;
    activeNodes?: number;
    benchmarks: { traditional: Benchmark[]; crypto: Benchmark[] };
    userScore: Partial<Record<MetricKey, number>>;
}

interface DashboardResponse {
    analytics?: AnalyticsData;
}

const PRESETS: Record<InputField, number[]> = {
    principal: [300, 500, 1000, 5000],
    reinvest: [0, 50, 100, 500],
    goal: [2000, 5000, 10000, 50000]
};

const TIMEFRAMES = [12, 36, 60, 120];
const MAX_MONTHS = 120;

const calculateCompoundData = (
    principal: number,
    reinvest: number,
    pedals: ForecastConfig['pedals'],
    goal: number,
    timeframe: number,
    monthLabel: (n: number) => string
) => {
    const totalApy = Object.values(pedals).reduce((a, b) => a + b, 0);
    const monthlyRate = totalApy / 100 / 12;
    const locale = intlLocale();
    const shortDate = (d: Date) => d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    let balance = principal;
    const startDate = new Date();

    const points: GrowthPointDatum[] = [{ month: 0, monthLabel: monthLabel(0), dateLabel: shortDate(startDate), value: principal }];

    let monthsToGoal = principal >= goal ? 0 : -1;
    let goalDateLabel = principal >= goal ? shortDate(startDate) : '';

    for (let i = 1; i <= MAX_MONTHS; i++) {
        balance = balance * (1 + monthlyRate) + reinvest;
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);

        if (monthsToGoal < 0 && balance >= goal) {
            monthsToGoal = i;
            goalDateLabel = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
        }
        if (i <= timeframe) {
            points.push({ month: i, monthLabel: monthLabel(i), dateLabel: shortDate(date), value: Math.round(balance) });
        }
    }
    return { points, monthsToGoal, goalDateLabel, totalApy };
};

const TypewriterText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState('');
    useEffect(() => {
        setDisplayedText('');
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
    const { t, i18n } = useTranslation('analytics');
    const marketCardTypes = useTyrexStore(s => s.marketCardTypes);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [activeChart, setActiveChart] = useState<TabId>('radar_trad');
    const [config, setConfig] = useState<ForecastConfig>({
        principal: 1000,
        reinvest: 100,
        goal: 5000,
        // Гипотетические параметры выключены по умолчанию; доход нод подставляется после загрузки
        pedals: { yield: 0, boosters: 0, spec: 0, btc: 0, ref: 0, bonus: 0 }
    });

    const [selectorField, setSelectorField] = useState<InputField | null>(null);
    const [infoBooster, setInfoBooster] = useState<PedalId | null>(null);
    const [selectedTrad, setSelectedTrad] = useState('Real Estate');
    const [selectedCrypto, setSelectedCrypto] = useState('Staking');
    const [modalMetric, setModalMetric] = useState<MetricKey | null>(null);
    const [timeframe, setTimeframe] = useState(60);

    const sliderRef = useRef<HTMLDivElement>(null);
    const paneRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [sliderHeight, setSliderHeight] = useState<number | undefined>(undefined);

    const activeNodes = data?.activeNodes ?? 0;
    const hasNodes = activeNodes > 0 && (data?.baseApy ?? 0) > 0;

    // Минимальная ставка тарифа из маркета (если нод нет) — реальная цифра, а не выдуманная
    const minTariffApy = useMemo(() => {
        const apys = marketCardTypes.map(c => parseFloat(c.clientAPY)).filter(n => Number.isFinite(n) && n > 0);
        return apys.length ? Math.min(...apys) : 0;
    }, [marketCardTypes]);

    const yieldValue = hasNodes ? Math.round((data?.baseApy ?? 0) * 10) / 10 : minTariffApy;

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        analyticsApi.getDashboard()
            .then((res: DashboardResponse) => {
                if (res?.analytics) setData(res.analytics);
            })
            .catch(e => setError(errorText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    // Подставляем доход нод, когда известны данные (только если пользователь ещё не трогал параметр)
    const yieldInitialized = useRef(false);
    useEffect(() => {
        if (yieldInitialized.current || loading || yieldValue <= 0) return;
        yieldInitialized.current = true;
        setConfig(prev => ({ ...prev, pedals: { ...prev.pedals, yield: yieldValue } }));
    }, [loading, yieldValue]);

    const monthLabel = useCallback((n: number) => t('forecast.monthShort', { count: n }), [t]);

    const { points, monthsToGoal, goalDateLabel, totalApy } = useMemo(
        () => calculateCompoundData(config.principal, config.reinvest, config.pedals, config.goal, timeframe, monthLabel),
        // i18n.language: даты пересчитываются при смене языка
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [config, timeframe, monthLabel, i18n.language]
    );

    const tabs = useMemo(() => TAB_IDS.map(id => ({ id, label: t(`tabs.${id}.label`) })), [t]);

    const handleTabChange = (tabId: string) => {
        const index = TAB_IDS.findIndex(id => id === tabId);
        if (index !== -1 && sliderRef.current) {
            setActiveChart(TAB_IDS[index]);
            sliderRef.current.scrollTo({ left: index * sliderRef.current.offsetWidth, behavior: 'smooth' });
        }
    };

    const handleScroll = () => {
        if (!sliderRef.current) return;
        const index = Math.round(sliderRef.current.scrollLeft / sliderRef.current.offsetWidth);
        const id = TAB_IDS[index];
        if (id && id !== activeChart) setActiveChart(id);
    };

    // Высота слайдера = высота активного экрана (иначе короткие экраны получают пустое место снизу)
    useLayoutEffect(() => {
        const index = TAB_IDS.indexOf(activeChart);
        const pane = paneRefs.current[index];
        if (!pane) return;
        const update = () => setSliderHeight(pane.offsetHeight);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(pane);
        return () => ro.disconnect();
    }, [activeChart, loading, data]);

    const getRadarData = (assetId: string): RadarDatum[] => {
        if (!data) return [];
        const benchmarks = [...data.benchmarks.traditional, ...data.benchmarks.crypto];
        const compareWith = benchmarks.find(b => b.subject === assetId) || benchmarks[0];
        return METRIC_KEYS.map(key => ({
            subject: t(`metrics.${key}.axis`),
            Tyrex: data.userScore?.[key] ?? 0,
            Compare: compareWith?.[key] ?? 0,
        }));
    };

    const goalText = monthsToGoal >= 0
        ? t('forecast.reached', { date: goalDateLabel.toUpperCase(), count: monthsToGoal })
        : t('forecast.notReached');

    if (loading) {
        return <div className="min-h-[60vh] bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-[#FFB700]" /></div>;
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] bg-[#080808] flex flex-col items-center justify-center gap-4 px-8 text-center">
                <AlertTriangle className="w-10 h-10 text-[#FFB700]" />
                <p className="text-sm font-bold text-white">{t('error.title')}</p>
                {error && <p className="text-xs text-white/50">{error}</p>}
                <button onClick={load} className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl text-xs font-bold uppercase active:scale-95">
                    <RefreshCw className="w-4 h-4" /> {t('error.retry')}
                </button>
            </div>
        );
    }

    const renderComparePane = (category: 'traditional' | 'crypto', selected: string, setSelected: (id: string) => void, color: string, glow: string) => (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                {CATEGORY_ASSETS[category].map(asset => {
                    const isSelected = selected === asset.id;
                    return (
                        <button
                            key={asset.id}
                            onClick={() => setSelected(asset.id)}
                            style={isSelected ? { borderColor: color, backgroundColor: `${color}33`, boxShadow: `0 0 20px ${glow}` } : undefined}
                            className={clsx(
                                'py-2.5 px-1 rounded-xl border-2 transition-all duration-300 text-[10px] leading-tight font-black uppercase break-words',
                                isSelected ? 'text-white' : 'border-white/20 text-white/60 bg-[#1A1A1E]'
                            )}
                        >
                            {t(`assets.${asset.id}.label`)}
                        </button>
                    );
                })}
            </div>
            <div className="bg-[#141414] p-4 rounded-r-2xl min-h-[80px] border border-[#222222] border-l-2" style={{ borderLeftColor: color }}>
                <p className="text-[13px] text-white/80 font-medium"><TypewriterText text={t(`assets.${selected}.conclusion`)} /></p>
            </div>
            <div className="relative aspect-square w-full max-w-[300px] mx-auto bg-[#0D0D0D] border border-[#222222] rounded-[2.5rem] p-1 flex items-center justify-center shadow-2xl">
                <RadarChartComponent data={getRadarData(selected)} compareColor={color} tyrexName={t('radar.tyrex')} compareName={t(`assets.${selected}.label`)} />
            </div>
            <div className="flex justify-center gap-5 text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1.5 text-white/70"><span className="w-3 h-1 rounded-full bg-[#FFB800]" />{t('radar.tyrex')}</span>
                <span className="flex items-center gap-1.5 text-white/70"><span className="w-3 h-1 rounded-full" style={{ backgroundColor: color }} />{t(`assets.${selected}.label`)}</span>
            </div>
            <div className="bg-[#141414] border border-[#222222] rounded-[2rem] p-5 shadow-xl">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {METRIC_KEYS.map(key => (
                        <button key={key} onClick={() => setModalMetric(key)} className="space-y-1 text-left active:scale-95 transition-transform">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{t(`metrics.${key}.title`)}</h4>
                            <p className="text-[10px] text-white/50 font-medium italic">{t(`metrics.${key}.short`)}</p>
                        </button>
                    ))}
                </div>
                <p className="mt-4 text-[10px] text-white/30 italic">{t('radar.scoreNote')}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-[#080808] text-white flex flex-col font-sans relative overflow-x-hidden">
            <FloatingNav tabs={tabs} activeTab={activeChart} setActiveTab={handleTabChange} scrollContainerRef={scrollContainerRef} />

            <div className="flex flex-col pt-16">
                <header className="px-5 mb-1 shrink-0">
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none"
                        style={{ background: 'linear-gradient(to bottom, #FFD700, #B8860B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t(`tabs.${activeChart}.header`)}
                    </h1>
                    <p className="text-[11px] text-[#808080] leading-snug mt-1 max-w-[95%]">
                        {t(`tabs.${activeChart}.description`, { count: METRIC_KEYS.length })}
                    </p>
                </header>

                <div
                    ref={sliderRef}
                    onScroll={handleScroll}
                    className="flex items-start overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar transition-[height] duration-300"
                    style={{ scrollBehavior: 'smooth', height: sliderHeight }}
                >
                    {/* ЭКРАН 1: ТРАДИЦИОННЫЕ */}
                    <div ref={el => { paneRefs.current[0] = el; }} className="min-w-full w-full snap-center px-5 py-2 pb-6">
                        {renderComparePane('traditional', selectedTrad, setSelectedTrad, '#00F0FF', 'rgba(0,240,255,0.4)')}
                    </div>

                    {/* ЭКРАН 2: КРИПТО */}
                    <div ref={el => { paneRefs.current[1] = el; }} className="min-w-full w-full snap-center px-5 py-2 pb-6">
                        {renderComparePane('crypto', selectedCrypto, setSelectedCrypto, '#FF00E5', 'rgba(255,0,229,0.4)')}
                    </div>

                    {/* ЭКРАН 3: ПРОГНОЗ */}
                    <div ref={el => { paneRefs.current[2] = el; }} className="min-w-full w-full snap-center px-5 pt-2 pb-6 flex flex-col">
                        <NumericalInputsHUD config={config} onOpenSelector={setSelectorField} />

                        <div className="mt-3 bg-[#141414] border border-[#222222] rounded-xl px-5 py-3 flex justify-between items-center gap-3">
                            <span className="text-[12px] font-medium text-[#808080] uppercase tracking-wide">{t('forecast.avgApy')}</span>
                            {hasNodes
                                ? <span className="text-lg font-bold text-[#FFB700]">{fmtPct(data.baseApy, 1)}</span>
                                : <span className="text-right"><span className="block text-lg font-bold text-white/60">—</span><span className="block text-[10px] text-white/40">{t('forecast.avgApyNone')}</span></span>}
                        </div>

                        <div className="bg-[#141414] border-l-4 border-[#FFB700] p-4 rounded-r-2xl my-4 shrink-0 shadow-lg border border-[#222222]">
                            <p className="text-[12px] font-black text-white italic leading-relaxed uppercase tracking-tight">
                                <TypewriterText key={`${monthsToGoal}-${i18n.language}`} text={goalText} />
                            </p>
                            <p className="mt-2 text-[10px] font-bold text-[#FFB700]/80 uppercase">{t('forecast.totalApy', { value: fmtPct(totalApy, 1) })}</p>
                        </div>

                        <PedalList config={config} setConfig={setConfig} onOpenInfo={setInfoBooster} yieldValue={yieldValue || 1} />

                        <div className="flex justify-center gap-8 my-6">
                            {TIMEFRAMES.map(v => (
                                <button key={v} onClick={() => setTimeframe(v)} className="flex flex-col items-center gap-1 active:scale-90 transition-all">
                                    <span className={clsx('text-xs font-black transition-all', timeframe === v ? 'text-white scale-110' : 'text-[#808080]')}>
                                        {t('forecast.yearsShort', { count: v / 12 })}
                                    </span>
                                    <div className={clsx('w-1 h-1 rounded-full transition-all', timeframe === v ? 'bg-[#FFB700] opacity-100' : 'bg-transparent opacity-0')} />
                                </button>
                            ))}
                        </div>

                        <div className="relative mb-3 shrink-0">
                            <GrowthAreaChart data={points} goal={config.goal} targetMonth={monthsToGoal} pedals={config.pedals} setPedals={setConfig} />
                        </div>

                        <p className="text-[10px] leading-snug text-white/40 italic">{t('forecast.disclaimer')}</p>
                    </div>
                </div>
            </div>

            {/* SELECTOR SHEET */}
            <AnimatePresence>
                {selectorField && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectorField(null)} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 inset-x-0 z-[101] bg-[#141414] p-6 rounded-t-[2.5rem] border-t border-[#222222]"
                            style={{ paddingBottom: 'calc(var(--safe-bottom, 0px) + 24px)' }}>
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
                            <h3 className="text-lg font-bold text-center mb-6 text-[#808080] uppercase tracking-widest">{t(`fields.${selectorField}`)}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {PRESETS[selectorField].map(val => (
                                    <button key={val} onClick={() => { setConfig(prev => ({ ...prev, [selectorField]: val })); setSelectorField(null); }}
                                        className="bg-[#080808] border border-[#222222] p-5 rounded-xl flex justify-between items-center gap-2 hover:bg-white/5 active:border-[#FFB700] transition-all group">
                                        <span className="text-xl font-black text-white group-active:text-[#FFB700] tracking-tighter">{fmtUsd(val, 0)}</span>
                                        <ChevronRight size={18} className="text-[#808080] shrink-0" />
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
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#141414] border border-[#222222] p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl text-center">
                            <div className="w-14 h-14 bg-[#FFB700]/10 rounded-full flex items-center justify-center mx-auto mb-5"><Info size={28} className="text-[#FFB700]" /></div>
                            <h3 className="text-[#FFB700] font-black uppercase text-lg mb-3 tracking-widest">{t(`pedals.${infoBooster}.label`)}</h3>
                            <p className="text-white font-medium leading-relaxed text-base italic opacity-90">{t(`pedals.${infoBooster}.description`)}</p>
                            <button className="mt-8 w-full py-4 bg-[#FFB700] text-black rounded-2xl font-black uppercase tracking-widest">{t('info.gotIt')}</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LEGEND MODAL */}
            <AnimatePresence>
                {modalMetric && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md" onClick={() => setModalMetric(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-[#141414] border border-[#222222] w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-xl font-black text-[#FFB700] uppercase tracking-tight mb-4">{t(`metrics.${modalMetric}.title`)}</h3>
                            <p className="text-[15px] text-white/80 leading-relaxed font-medium italic mb-8">{t(`metrics.${modalMetric}.full`)}</p>
                            <button onClick={() => setModalMetric(null)} className="w-full py-4 bg-[#FFB700] text-black rounded-xl font-black uppercase text-xs">{t('info.close')}</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnalyticsScreen;
