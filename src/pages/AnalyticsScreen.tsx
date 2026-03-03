import React, { useState, useMemo, useEffect } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer 
} from 'recharts';
import { 
    Zap, MousePointer2, Globe, Coins, 
    Home, Landmark, LineChart, Star,
    Layers, RefreshCw, HelpCircle, X 
} from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

const METRIC_LABELS: Record<string, string> = {
    yield: 'Доходність',
    liquidity: 'Ліквідність',
    entry: 'Поріг входу',
    safety: 'Безпека',
    passive: 'Пасивність',
    growth: 'Потенціал'
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
    const [showInfo, setShowInfo] = useState(false);

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
            
            {/* 1. ВЕРХНЯ ПОЯСНЮВАЛЬНА ПЛАШКА */}
            <div className="mx-4 mt-6 p-4 bg-[#151517] border border-white/5 rounded-2xl">
                <p className="text-[10px] font-bold text-white/50 uppercase leading-relaxed tracking-wide">
                    Оберіть актив нижче, щоб порівняти його з вашою стратегією <span className="text-[#FDB931]">Tyrex</span> за 6-ма ключовими метриками.
                </p>
            </div>

            {/* 2. КАТЕГОРИИ */}
            <div className="p-4">
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
                            {cat === 'traditional' ? 'Фінанси' : 'Крипто'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. ТЕКСТ БЕЗ ПЛАШКИ ПІД КНОПКАМИ */}
            <div className="px-6 mb-4">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em]">
                    Візуалізація ризиків та прибутковості в реальному часі:
                </p>
            </div>

            {/* 4. ГРАФИК */}
            <div className="mx-4 mb-8 relative">
                <div className="bg-[#151517] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
                    
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[9px] font-black text-sky-400 uppercase tracking-[0.2em] mb-1">Порівняльний аналіз</p>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight">
                                TYREX <span className="text-white/20 font-normal">vs</span> {selectedAsset}
                            </h3>
                        </div>
                        <button onClick={() => setShowInfo(true)} className="p-1">
                            <HelpCircle className="w-5 h-5 text-white/10" />
                        </button>
                    </div>

                    {showInfo && (
                        <div className="absolute inset-0 z-50 bg-[#0A0A0B]/98 backdrop-blur-md p-8 flex flex-col justify-center animate-in fade-in duration-200">
                            <button onClick={() => setShowInfo(false)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full"><X className="w-5 h-5 text-white/40" /></button>
                            <h4 className="text-sm font-black uppercase text-[#FDB931] mb-4 tracking-widest">Методологія</h4>
                            <div className="space-y-4 text-[10px] font-bold text-white/50 uppercase leading-relaxed">
                                <p><span className="text-[#FDB931]">● TYREX</span> базується на вашому поточному APY та рівні диверсифікації портфеля.</p>
                                <p><span className="text-white/40">● КОНКУРЕНТ</span> — середньоринкові дані за останні 5 років.</p>
                            </div>
                        </div>
                    )}

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {/* Перемальовуємо при кожній зміні через key */}
                            <RadarChart key={`${activeCategory}-${selectedAsset}`} cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                                <PolarGrid stroke="#ffffff10" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#555', fontSize: 10, fontWeight: 'bold' }} />
                                
                                {/* Область КОНКУРЕНТА з рамкою */}
                                <Radar 
                                    dataKey="Compare" 
                                    stroke="#444" 
                                    strokeWidth={1}
                                    fill="#333" 
                                    fillOpacity={0.3} 
                                    animationDuration={600}
                                />
                                
                                {/* Область TYREX з товстою рамкою */}
                                <Radar 
                                    dataKey="Tyrex" 
                                    stroke="#FDB931" 
                                    strokeWidth={2.5} 
                                    fill="#FDB931" 
                                    fillOpacity={0.4} 
                                    animationDuration={900}
                                    animationBegin={300}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex justify-center space-x-8 mt-4">
                        <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#FDB931]" /><span className="text-[9px] font-black uppercase text-white/80">Tyrex Score</span></div>
                        <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded-full bg-[#333]" /><span className="text-[9px] font-black uppercase text-white/30">{selectedAsset}</span></div>
                    </div>
                </div>
            </div>

            {/* 5. СЕТКА АКТИВОВ (3 колонки) */}
            <div className="px-4 grid grid-cols-3 gap-3">
                {currentBenchmarks.map((asset: any) => {
                    const Icon = ASSET_ICONS[asset.subject] || Zap;
                    const isActive = selectedAsset === asset.subject;
                    return (
                        <button
                            key={asset.subject}
                            onClick={() => setSelectedAsset(asset.subject)}
                            className={clsx(
                                "flex flex-col items-center justify-start py-6 px-2 rounded-[1.8rem] transition-all border-2 min-h-[130px]",
                                isActive 
                                    ? "bg-[#FDB931] border-[#FDB931] text-black shadow-[0_10px_25px_rgba(253,185,49,0.2)]" 
                                    : "bg-[#151517] border-transparent text-white/40"
                            )}
                        >
                            <Icon className={clsx("w-6 h-6 mb-4", isActive ? "text-black" : "text-white/40")} />
                            <span className="text-[8px] font-black uppercase text-center leading-[1.3] tracking-tighter break-words px-1">
                                {asset.subject === 'Signals' ? 'Торговать самому по сигналам' : asset.subject}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AnalyticsScreen;