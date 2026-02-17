import React, { useState, useMemo, useEffect } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
    Zap, TrendingUp, Rocket, 
    Smartphone, Watch, Plane, Crown, 
    AlertCircle, RefreshCw, ArrowRightLeft,
    HardDrive, Users, HelpCircle
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useTyrexStore } from '../store/useTyrexStore';
import { analyticsApi, referralApi } from '../api/tyrexApi';

const TARGETS = [
    { id: 1, name: 'iPhone 16 Pro', price: 1200, icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 2, name: 'Rolex Submariner', price: 10000, icon: Watch, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 3, name: 'Dubai Trip', price: 5000, icon: Plane, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 4, name: '1 BTC Club', price: 65000, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
];

const StrategyToggle = ({ label, active, onClick, icon: Icon }: any) => (
    <button onClick={onClick} className={clsx("flex-1 flex items-center justify-center space-x-2 px-3 py-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wide", active ? "bg-tyrex-ultra-gold-glow/20 border-tyrex-ultra-gold-glow text-tyrex-ultra-gold-glow" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10")}>
        <Icon className="w-3.5 h-3.5" /><span>{label}</span>
    </button>
);

const TargetCard = ({ target, profit }: { target: any, profit: number }) => {
    const progress = Math.min(100, (profit / target.price) * 100);
    const isCompleted = progress >= 100;
    return (
        <div className="bg-[#121213] border border-white/5 rounded-2xl p-3 flex items-center space-x-3 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-tyrex-ultra-gold-glow transition-all duration-1000" style={{ width: `${progress}%` }} />
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", target.bg)}><target.icon className={clsx("w-5 h-5", target.color)} /></div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-white truncate">{target.name}</span><span className={clsx("text-[10px] font-black", isCompleted ? "text-green-400" : "text-white/30")}>{isCompleted ? 'ГОТОВО' : `${progress.toFixed(0)}%`}</span></div>
                <div className="text-[10px] text-white/40 font-mono">${profit.toFixed(0)} / ${target.price}</div>
            </div>
            {isCompleted && <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-[1px]"><div className="bg-green-500 text-black rounded-full p-1">✓</div></div>}
        </div>
    );
};

// --- ОСНОВНОЙ ЭКРАН ---
const AnalyticsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { balance, btcPrice, cards } = useTyrexStore();

    const [currencyMode, setCurrencyMode] = useState<'USD' | 'BTC'>('USD');
    const [reinvest, setReinvest] = useState(true);
    const [bullRun, setBullRun] = useState(false);
    const [monthlyDeposit, setMonthlyDeposit] = useState<string>('100'); 
    
    const [showInfo, setShowInfo] = useState(false);

    // Данные с бека
    const [marketData, setMarketData] = useState<any>(null);
    const [referralStats, setReferralStats] = useState<{activeCount: number, estIncomeBtc: number}>({ activeCount: 0, estIncomeBtc: 0 });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const load = async () => {
            try {
                const [dash, refInfo] = await Promise.all([
                    analyticsApi.getDashboard(),
                    referralApi.getReferralInfo()
                ]);
                if (dash) setMarketData(dash.marketSentiment);
                if (refInfo && refInfo.stats) {
                    setReferralStats({ activeCount: refInfo.stats.activeMiners, estIncomeBtc: refInfo.stats.estMonthlyIncomeBtc });
                }
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        load();
    }, []);

    // --- 1. СЧИТАЕМ ТЕКУЩИЙ КАПИТАЛ ---
    const currentStats = useMemo(() => {
        const wallet = balance.walletUsd > 0 ? parseFloat(balance.walletUsd.toString()) : 0;
        const staked = cards.reduce((acc, c) => acc + (parseFloat(c.purchasePriceUsd?.toString()) || 0), 0);
        
        const activeCards = cards.filter(c => c.status === 'Active');
        const monthlyMiningIncome = activeCards.reduce((acc, c) => {
            const apy = parseFloat(c.clientAPY?.toString() || '0');
            return acc + (c.purchasePriceUsd * (apy / 100) / 12);
        }, 0);

        return {
            totalEquity: wallet + staked,
            monthlyMiningIncome,
            activeCount: activeCards.length
        };
    }, [balance, cards]);

    // --- 2. ГЕНЕРАЦИЯ ГРАФИКА ---
    const { chartData, totalAccumulatedProfit } = useMemo(() => {
        const data = [];
        
        let strategyEquity = currentStats.totalEquity;
        let cashEquity = currentStats.totalEquity;

        if (strategyEquity === 0 && Number(monthlyDeposit) === 0) {
            strategyEquity = 100;
            cashEquity = 100;
        }

        const deposit = parseFloat(monthlyDeposit) || 0;
        const btcRate = btcPrice || 65000;
        let accumulatedProfit = 0;
        const today = new Date();
        
        for (let i = 0; i < 6; i++) {
            strategyEquity += deposit;
            cashEquity += deposit;

            const currentYieldRate = (strategyEquity > 0) ? (currentStats.monthlyMiningIncome / strategyEquity) : 0.05;
            let miningProfit = strategyEquity * (currentYieldRate || 0.05); 
            const refProfitUsd = referralStats.estIncomeBtc * btcRate;
            miningProfit += refProfitUsd;

            if (bullRun) {
                const growth = strategyEquity * 0.05;
                strategyEquity += growth;
                accumulatedProfit += growth; 
            }

            accumulatedProfit += miningProfit;

            if (reinvest) {
                strategyEquity += miningProfit;
            } else {
                strategyEquity += miningProfit;
            }

            const date = new Date(today);
            date.setMonth(today.getMonth() + i);
            const monthName = date.toLocaleString('default', { month: 'short' });

            data.push({
                name: monthName,
                Strategy: Math.round(strategyEquity),
                Cash: Math.round(cashEquity),
                Profit: Math.round(accumulatedProfit),
                valueBtc: strategyEquity / (btcRate * (bullRun ? Math.pow(1.05, i) : 1))
            });
        }
        return { chartData: data, totalAccumulatedProfit: accumulatedProfit };
    }, [reinvest, bullRun, monthlyDeposit, currentStats, btcPrice, referralStats]);

    const finalValue = currencyMode === 'USD' 
        ? `$${chartData[chartData.length - 1]?.Strategy.toLocaleString()}`
        : `${chartData[chartData.length - 1]?.valueBtc.toFixed(4)} BTC`;

    const efficiency = (((chartData[5].Strategy - chartData[5].Cash) / chartData[5].Cash) * 100).toFixed(0);

    const sentimentValue = marketData?.value || 50;
    const sentimentText = marketData?.status || "Neutral";
    const sentimentColor = sentimentValue > 60 ? 'text-green-400' : sentimentValue < 40 ? 'text-red-400' : 'text-yellow-400';

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-white/20"/></div>;

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-10 font-sans selection:bg-purple-500">
            {/* Header */}
            <div className="p-6 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tighter">Analytics</h2>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className={clsx("w-2 h-2 rounded-full animate-pulse", sentimentValue > 60 ? "bg-green-500" : "bg-yellow-500")}/>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            Рынок: <span className={sentimentColor}>{sentimentText} ({sentimentValue})</span>
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-1.5 opacity-80">
                        <HardDrive className="w-3 h-3 text-green-400" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Майнинг: ~${currentStats.monthlyMiningIncome.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 opacity-80">
                        <Users className="w-3 h-3 text-tyrex-ultra-gold-glow" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                            Реф: ~${(referralStats.estIncomeBtc * (btcPrice || 60000)).toFixed(0)}
                        </span>
                    </div>
                    <div className="h-px w-full bg-white/10 my-0.5"/>
                    <p className="text-[9px] font-black text-white/40 uppercase">Капитал: ${currentStats.totalEquity.toLocaleString()}</p>
                </div>
            </div>

            {/* --- ГРАФИК --- */}
            <div className="relative mx-4 mb-6">
                <div className="bg-[#121214] border border-white/10 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Zap className="w-24 h-24 text-white"/></div>
                    
                    <div className="relative z-10 mb-2 flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2 mb-1" onClick={() => setShowInfo(!showInfo)}>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Прогноз (6 мес)</p>
                                <HelpCircle className="w-3 h-3 text-white/30 cursor-pointer" />
                            </div>
                            
                            {showInfo && (
                                <div className="absolute top-6 left-0 bg-[#222] border border-white/10 p-3 rounded-xl z-20 w-64 text-[10px] text-white/70 shadow-xl">
                                    <p className="mb-2"><strong className="text-tyrex-ultra-gold-glow">Желтая:</strong> Ваш капитал с учетом майнинга и реинвеста.</p>
                                    <p><strong className="text-gray-400">Серая:</strong> Если просто копить деньги без вложений.</p>
                                    <button onClick={() => setShowInfo(false)} className="mt-2 text-white font-bold underline">Закрыть</button>
                                </div>
                            )}

                            <h3 className="text-3xl font-black text-white italic tracking-tighter mt-1">{finalValue}</h3>
                            <p className="text-[9px] text-green-400 mt-1 uppercase font-bold tracking-wider">
                                Эффективность: +{efficiency}% vs Кэш
                            </p>
                        </div>
                        
                        <button onClick={() => setCurrencyMode(prev => prev === 'USD' ? 'BTC' : 'USD')} className="flex items-center space-x-1 bg-white/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                            <ArrowRightLeft className="w-3 h-3 text-tyrex-ultra-gold-glow" />
                            <span className="text-[10px] font-bold uppercase">{currencyMode}</span>
                        </button>
                    </div>

                    <div className="h-48 w-full mb-4 -ml-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FDB931" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#FDB931" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 10}} dy={10}/>
                                <YAxis hide={false} axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 9}} tickFormatter={(val) => currencyMode === 'USD' ? `$${val/1000}k` : val.toFixed(2)}/>
                                
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '12px'}} 
                                    itemStyle={{paddingBottom: 4}}
                                    formatter={(value: any, name: any) => [
                                        currencyMode === 'USD' ? `$${value.toLocaleString()}` : `${value.toFixed(4)}`, 
                                        name === 'Strategy' ? '🚀 Майнинг' : '🏦 Копилка'
                                    ]}
                                />
                                
                                {/* ЖЕЛТАЯ ЛИНИЯ (СТРАТЕГИЯ) - ЖИРНАЯ И С ТОЧКАМИ */}
                                <Area 
                                    type="monotone" 
                                    dataKey="Strategy" 
                                    stroke="#FDB931" 
                                    strokeWidth={4} // Жирная
                                    fillOpacity={1} 
                                    fill="url(#colorStrategy)" 
                                    dot={{ r: 4, fill: "#FDB931", strokeWidth: 1, stroke: "#000" }} // Точки
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                
                                {/* СЕРАЯ ЛИНИЯ (БАЗА) - ПУНКТИР */}
                                {currencyMode === 'USD' && (
                                    <Area 
                                        type="monotone" 
                                        dataKey="Cash" 
                                        stroke="#666" 
                                        strokeWidth={3} // Видная
                                        strokeDasharray="6 6" // Пунктир
                                        fill="transparent" 
                                        dot={{ r: 3, fill: "#666", strokeWidth: 0 }}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/5">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                <span className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Ежем. Депозит ($)</span>
                            </div>
                            <input type="number" value={monthlyDeposit} onChange={(e) => setMonthlyDeposit(e.target.value)} className="bg-transparent text-right font-black text-white outline-none w-20 border-b border-white/20 focus:border-tyrex-ultra-gold-glow transition-colors placeholder:text-white/20" placeholder="0" />
                        </div>
                        <div className="flex gap-2">
                            <StrategyToggle label="Реинвест" icon={RefreshCw} active={reinvest} onClick={() => setReinvest(!reinvest)} />
                            <StrategyToggle label="Рост BTC" icon={Rocket} active={bullRun} onClick={() => setBullRun(!bullRun)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. DREAM TARGETS (На чистой прибыли) */}
            <div className="px-5 mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Ваши цели</h4>
                    <span className="text-[10px] text-white/30">С чистой прибыли (6 мес)</span>
                </div>
                <div className="space-y-3">
                    {TARGETS.map(target => <TargetCard key={target.id} target={target} profit={totalAccumulatedProfit} />)}
                </div>
            </div>

            {/* 3. FOMO BLOCK */}
            <div className="mx-4 mb-8 bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Осторожно: Инфляция</p>
                    <p className="text-xs text-white/70 leading-tight">Просто хранить доллары — терять <span className="text-white font-bold">7%</span> покупательской способности в год.</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>

            {/* CTA - КНОПКА ОТКЛЕЕНА И НАХОДИТСЯ ВНИЗУ ПОТОКА */}
            <div className="px-4 mb-10">
                <button onClick={() => navigate('/marketplace')} className="w-full py-5 bg-tyrex-ultra-gold-glow text-black rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-[0_10px_40px_rgba(253,185,49,0.3)] active:scale-95 transition-all flex items-center justify-center space-x-2">
                    <Rocket className="w-5 h-5" /><span>Начать Стратегию</span>
                </button>
            </div>
            
            <div className="px-4 pb-8">
                <button onClick={() => window.open('https://t.me/your_channel', '_blank')} className="w-full py-4 bg-white/5 rounded-[1.5rem] text-[10px] font-black text-white/60 uppercase tracking-[0.3em] hover:bg-white/10 transition-colors">Вступить в комьюнити</button>
            </div>
        </div>
    );
};

export default AnalyticsScreen;