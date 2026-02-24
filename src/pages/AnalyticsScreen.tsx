import React, { useState, useMemo, useEffect } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
    Zap, TrendingUp, Shield, MousePointer2, BarChart3, Globe, Coins, 
    Home, Landmark, LineChart, Star,
    Layers, RefreshCw, Rocket, HelpCircle, X
} from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi } from '../api/tyrexApi';

// Маппинг ключей бекенда на человеческие названия
const METRIC_LABELS: Record<string, string> = {
    yield: 'Доходность',
    liquidity: 'Ликвидность',
    entry: 'Порог входа',
    safety: 'Безопасность',
    passive: 'Пассивность',
    growth: 'Рост'
};

// Иконки для активов
const ASSET_ICONS: Record<string, any> = {
    'Real Estate': Home,
    'Bank Deposit': Landmark,
    'S&P 500': LineChart,
    'Gold': Star,
    'Hold BTC': Coins,
    'Staking': Layers,
    'Altcoins': Zap,
    'Trading Bots': MousePointer2,
    'Signals': Globe
};

const AnalyticsScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'traditional' | 'crypto'>('traditional');
    const [selectedAsset, setSelectedAsset] = useState<string>('');
    const [showInfo, setShowInfo] = useState(false);

    // Загрузка данных
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await analyticsApi.getDashboard();
                if (res.analytics) {
                    setData(res.analytics);
                    // По умолчанию выбираем первый актив из списка
                    setSelectedAsset(res.analytics.benchmarks.traditional[0].subject);
                }
            } catch (e) {
                console.error("Fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Подготовка данных для графика
    const chartData = useMemo(() => {
        if (!data || !selectedAsset) return [];
        
        const benchmarks = activeTab === 'traditional' ? data.benchmarks.traditional : data.benchmarks.crypto;
        const compareWith = benchmarks.find((b: any) => b.subject === selectedAsset);
        const tyrex = data.userScore;

        return Object.keys(METRIC_LABELS).map(key => ({
            subject: METRIC_LABELS[key],
            Tyrex: tyrex[key],
            Compare: compareWith ? compareWith[key] : 0,
            fullMark: 100
        }));
    }, [data, selectedAsset, activeTab]);

    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-tyrex-ultra-gold-glow" />
        </div>
    );

    const currentBenchmarks = activeTab === 'traditional' ? data.benchmarks.traditional : data.benchmarks.crypto;

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-28 font-sans">
            {/* Header */}
            <div className="p-6">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Сравнение Стратегий</h2>
                <div className="flex space-x-2 mt-4">
                    <button 
                        onClick={() => { setActiveTab('traditional'); setSelectedAsset(data.benchmarks.traditional[0].subject); }}
                        className={clsx("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", 
                        activeTab === 'traditional' ? "bg-white/10 text-white" : "bg-transparent text-white/30")}
                    >
                        Финансы
                    </button>
                    <button 
                        onClick={() => { setActiveTab('crypto'); setSelectedAsset(data.benchmarks.crypto[0].subject); }}
                        className={clsx("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", 
                        activeTab === 'crypto' ? "bg-white/10 text-white" : "bg-transparent text-white/30")}
                    >
                        Крипто
                    </button>
                </div>
            </div>

            {/* 1. СЕТКА ВЫБОРА (Top Selector) */}
            <div className="px-4 grid grid-cols-3 gap-2 mb-6">
                {currentBenchmarks.map((asset: any) => {
                    const Icon = ASSET_ICONS[asset.subject] || BarChart3;
                    return (
                        <button
                            key={asset.subject}
                            onClick={() => setSelectedAsset(asset.subject)}
                            className={clsx(
                                "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all",
                                selectedAsset === asset.subject 
                                    ? "bg-tyrex-ultra-gold-glow border-tyrex-ultra-gold-glow text-black shadow-[0_0_20px_rgba(253,185,49,0.2)]" 
                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                            )}
                        >
                            <Icon className="w-5 h-5 mb-2" />
                            <span className="text-[8px] font-black uppercase text-center leading-tight">
                                {asset.subject}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* 2. ЦЕНТРАЛЬНЫЙ ГРАФИК (Spiderweb) */}
            <div className="mx-4 relative">
                <div className="bg-[#121214] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden min-h-[400px]">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Анализ Эффективности</p>
                            <h3 className="text-xl font-black italic">TYREX vs {selectedAsset.toUpperCase()}</h3>
                        </div>
                        <HelpCircle 
                            className="w-5 h-5 text-white/20 cursor-pointer" 
                            onClick={() => setShowInfo(!showInfo)}
                        />
                    </div>

                    {showInfo && (
                        <div className="absolute inset-x-6 top-20 bg-[#1a1a1c] border border-tyrex-ultra-gold-glow/50 p-5 rounded-3xl z-30 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-tyrex-ultra-gold-glow uppercase">Как читать график?</span>
                                <X className="w-4 h-4" onClick={() => setShowInfo(false)}/>
                            </div>
                            <p className="text-[10px] text-white/60 leading-relaxed">
                                Чем шире область покрытия — тем лучше инструмент. <br/><br/>
                                <span className="text-tyrex-ultra-gold-glow font-bold">Золотая зона</span> — это ваш текущий потенциал в Tyrex. <br/>
                                <span className="text-white/30 font-bold">Серая зона</span> — показатели классического актива.
                            </p>
                        </div>
                    )}

                    <div className="h-[280px] w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#ffffff10" />
                                <PolarAngleAxis 
                                    dataKey="subject" 
                                    tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                                />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                
                                {/* Слой сравнения */}
                                <Radar
                                    name={selectedAsset}
                                    dataKey="Compare"
                                    stroke="#888"
                                    fill="#888"
                                    fillOpacity={0.2}
                                />
                                
                                {/* Слой Tyrex */}
                                <Radar
                                    name="Tyrex"
                                    dataKey="Tyrex"
                                    stroke="#FDB931"
                                    strokeWidth={3}
                                    fill="#FDB931"
                                    fillOpacity={0.4}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center space-x-6 mt-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-tyrex-ultra-gold-glow" />
                            <span className="text-[10px] font-bold uppercase text-white/60">Tyrex Score</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-white/20" />
                            <span className="text-[10px] font-bold uppercase text-white/40">{selectedAsset}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. УПРАВЛЕНИЕ ГРАФИКОМ (Bottom Controls) */}
            <div className="px-6 mt-8">
                <h4 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-4">Настройки симуляции</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span className="text-[9px] font-bold uppercase text-white/40">Реинвест</span>
                        </div>
                        <div className="text-xs font-black">ВКЛЮЧЕН</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-3 h-3 text-blue-400" />
                            <span className="text-[9px] font-bold uppercase text-white/40">Риск-профиль</span>
                        </div>
                        <div className="text-xs font-black text-green-400">LOW RISK</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl col-span-2 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <Rocket className="w-4 h-4 text-tyrex-ultra-gold-glow" />
                            <div>
                                <p className="text-[9px] font-bold uppercase text-white/40">Прогноз роста портфеля</p>
                                <p className="text-sm font-black italic">+142% за 12 мес.</p>
                            </div>
                        </div>
                        <button className="bg-tyrex-ultra-gold-glow text-black p-2 rounded-xl">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsScreen;