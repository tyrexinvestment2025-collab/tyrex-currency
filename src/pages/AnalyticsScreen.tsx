import React, { useState, useMemo, useEffect } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer 
} from 'recharts';
import { 
    Zap, MousePointer2, Globe, Coins, 
    Home, Landmark, LineChart, Star,
    Layers, RefreshCw, HelpCircle, X // Добавил X для закрытия
} from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

const METRIC_LABELS: Record<string, string> = {
    yield: 'Доходность',
    liquidity: 'Ликвидность',
    entry: 'Порог входа',
    safety: 'Безопасность',
    passive: 'Пассивность',
    growth: 'Рост'
};

const ASSET_ICONS: Record<string, any> = {
    'Real Estate': Home, 'Bank Deposit': Landmark, 'S&P 500': LineChart, 'Gold': Star,
    'Hold BTC': Coins, 'Staking': Layers, 'Altcoins': Zap, 'Trading Bots': MousePointer2, 'Signals': Globe
};

const AnalyticsScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState<string>('traditional');
    const [selectedAsset, setSelectedAsset] = useState<string>('');
    const [showInfo, setShowInfo] = useState(false); // Состояние для работы кнопки ?

    useEffect(() => {
        const load = async () => {
            try {
                const res = await analyticsApi.getDashboard();
                if (res.analytics) {
                    setData(res.analytics);
                    const initialAsset = activeCategory === 'traditional' 
                        ? res.analytics.benchmarks.traditional[0].subject 
                        : res.analytics.benchmarks.crypto[0].subject;
                    setSelectedAsset(initialAsset);
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, [activeCategory]);

    const chartData = useMemo(() => {
        if (!data || !selectedAsset) return [];
        const benchmarks = activeCategory === 'traditional' ? data.benchmarks.traditional : data.benchmarks.crypto;
        const compareWith = benchmarks.find((b: any) => b.subject === selectedAsset);
        const tyrex = data.userScore;

        return Object.keys(METRIC_LABELS).map(key => ({
            subject: METRIC_LABELS[key],
            Tyrex: tyrex[key],
            Compare: compareWith ? compareWith[key] : 0,
        }));
    }, [data, selectedAsset, activeCategory]);

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="animate-spin text-tyrex-ultra-gold-glow" /></div>;

    const currentBenchmarks = activeCategory === 'traditional' ? data.benchmarks.traditional : data.benchmarks.crypto;

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 font-sans overflow-x-hidden">
            {/* 1. КАТЕГОРИИ */}
            <div className="p-4">
                <h2 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-center">Аналитика</h2>
                <div className="flex bg-[#121212] p-1.5 rounded-2xl space-x-1">
                    {['traditional', 'crypto'].map((cat) => (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={clsx(
                                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeCategory === cat ? "bg-[#1C1C1C] text-white" : "text-white/30"
                            )}
                        >
                            {cat === 'traditional' ? 'Финансы' : 'Крипто'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. ГРАФИК */}
            <div className="mx-4 mb-6 relative">
                <div className="bg-[#151517] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
                    
                    {/* КНОПКА ? ТЕПЕРЬ РАБОТАЕТ */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] mb-1">Сравнение стратегий</p>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight">
                                TYREX <span className="text-white/20 font-normal">vs</span> {selectedAsset}
                            </h3>
                        </div>
                        <button 
                            onClick={() => setShowInfo(true)}
                            className="p-1 active:scale-90 transition-transform"
                        >
                            <HelpCircle className="w-5 h-5 text-white/10 hover:text-white/30" />
                        </button>
                    </div>

                    {/* ОКНО ПОДСКАЗКИ */}
                    {showInfo && (
                        <div className="absolute inset-0 z-50 bg-[#0A0A0B]/95 backdrop-blur-md p-8 flex flex-col justify-center animate-in fade-in duration-200">
                            <button 
                                onClick={() => setShowInfo(false)}
                                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full"
                            >
                                <X className="w-5 h-5 text-white/40" />
                            </button>
                            <h4 className="text-sm font-black uppercase text-[#FDB931] mb-4 tracking-widest">Как читать график?</h4>
                            <div className="space-y-4 text-[11px] font-bold text-white/60 uppercase leading-relaxed tracking-tight">
                                <p><span className="text-[#FDB931]">● ЗОЛОТАЯ ЗОНА</span> — ЭТО ПОКАЗАТЕЛИ ВАШЕГО ПОРТФЕЛЯ TYREX.</p>
                                <p><span className="text-white/20">● СЕРАЯ ЗОНА</span> — СРЕДНИЕ ПОКАЗАТЕЛИ ВЫБРАННОГО АКТИВА.</p>
                                <p>ЧЕМ БОЛЬШЕ ОБЛАСТЬ ПОКРЫТИЯ — ТЕМ ВЫШЕ ЭФФЕКТИВНОСТЬ СТРАТЕГИИ ПО ЭТОМУ ПАРАМЕТРУ.</p>
                            </div>
                        </div>
                    )}

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                                <PolarGrid stroke="#ffffff10" />
                                <PolarAngleAxis 
                                    dataKey="subject" 
                                    tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                                />
                                <Radar dataKey="Compare" stroke="#333" fill="#333" fillOpacity={0.6} />
                                <Radar dataKey="Tyrex" stroke="#FDB931" strokeWidth={3} fill="#FDB931" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex justify-center space-x-8 mt-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FDB931]" />
                            <span className="text-[10px] font-black uppercase text-white/80">Tyrex Score</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                            <span className="text-[10px] font-black uppercase text-white/30">{selectedAsset}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. СЕТКА АКТИВОВ ПОД ГРАФИКОМ */}
            <div className="px-4 grid grid-cols-3 gap-3">
                {currentBenchmarks.map((asset: any) => {
                    const Icon = ASSET_ICONS[asset.subject] || Zap;
                    const isActive = selectedAsset === asset.subject;
                    return (
                        <button
                            key={asset.subject}
                            onClick={() => setSelectedAsset(asset.subject)}
                            className={clsx(
                                "flex flex-col items-center justify-center py-6 px-2 rounded-[1.8rem] transition-all border-2",
                                isActive 
                                    ? "bg-[#FDB931] border-[#FDB931] text-black shadow-[0_10px_25px_rgba(253,185,49,0.25)]" 
                                    : "bg-[#151517] border-transparent text-white/40"
                            )}
                        >
                            <Icon className={clsx("w-6 h-6 mb-3", isActive ? "text-black" : "text-white/50")} />
                            <span className="text-[9px] font-black uppercase text-center leading-none tracking-tighter">
                                {asset.subject}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AnalyticsScreen;