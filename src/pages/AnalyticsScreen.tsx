import React, { useState, useMemo, useEffect } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell,
    ComposedChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
    Zap, TrendingUp, Rocket, 
    Smartphone, Watch, Plane, Crown, 
    AlertCircle, RefreshCw, ArrowRightLeft,
    HardDrive, Users, HelpCircle,
    BarChart3, PieChart as PieIcon, Activity, Layers, Hexagon, X
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useTyrexStore } from '../store/useTyrexStore';
import { analyticsApi, referralApi } from '../api/tyrexApi';

// --- КОНФИГУРАЦИЯ ЦВЕТОВ И ЦЕЛЕЙ ---
const COLORS = ['#333333', '#FDB931', '#10B981', '#3B82F6', '#EC4899']; // Grey, Gold, Green, Blue

const TARGETS = [
    { id: 1, name: 'iPhone 16 Pro', price: 1200, icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 2, name: 'Rolex Submariner', price: 10000, icon: Watch, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 3, name: 'Dubai Trip', price: 5000, icon: Plane, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 4, name: '1 BTC Club', price: 65000, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
];

// --- ОПИСАНИЕ ГРАФИКОВ (ДЛЯ ПОДСКАЗКИ) ---
const CHART_INFO: Record<string, { title: string, desc: string }> = {
    area: { 
        title: 'Рост Капитала', 
        desc: 'Желтая линия показывает экспоненциальный рост при реинвестировании. Серая — линейный рост при обычном накоплении.' 
    },
    bar: { 
        title: 'Источники Средств', 
        desc: 'Показывает состав вашего портфеля: Серый — ваши личные вложения, Цветной — чистая прибыль от майнинга и друзей.' 
    },
    pie: { 
        title: 'Структура Портфеля', 
        desc: 'Прогноз на 6 месяцев: какую часть капитала составят "бесплатные" деньги (прибыль) по сравнению с вложениями.' 
    },
    line: { 
        title: 'Сравнение Эффективности', 
        desc: 'Сравнение стратегии Tyrex (Желтая) с банковским депозитом 4% (Синяя) и хранением под матрасом (Серая).' 
    },
    composed: { 
        title: 'Денежный Поток', 
        desc: 'Столбцы показывают вашу чистую прибыль в конкретный месяц. Линия показывает рост общего капитала.' 
    },
    radar: { 
        title: 'Оценка Стратегии', 
        desc: 'Скоринг вашей текущей стратегии по 5 параметрам. Чем шире желтая зона — тем эффективнее ваши настройки.' 
    }
};

// Компоненты UI
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
                <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-white truncate">{target.name}</span><span className={clsx("text-[10px] font-black", isCompleted ? "text-green-400" : "text-white/30")}>{isCompleted ? 'ACHIEVED' : `${progress.toFixed(0)}%`}</span></div>
                <div className="text-[10px] text-white/40 font-mono">${profit.toFixed(0)} / ${target.price}</div>
            </div>
            {isCompleted && <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-[1px]"><div className="bg-green-500 text-black rounded-full p-1">✓</div></div>}
        </div>
    );
};

const ChartSelector = ({ current, onChange }: any) => {
    const types = [
        { id: 'area', icon: Activity, label: 'Growth' },
        { id: 'bar', icon: BarChart3, label: 'Sources' },
        { id: 'pie', icon: PieIcon, label: 'Struct' },
        { id: 'line', icon: TrendingUp, label: 'Compare' },
        { id: 'composed', icon: Layers, label: 'Flow' },
        { id: 'radar', icon: Hexagon, label: 'Score' },
    ];
    return (
        <div className="grid grid-cols-3 gap-2 mb-4 relative z-20">
            {types.map(t => (
                <button 
                    key={t.id} 
                    onClick={() => onChange(t.id)}
                    className={clsx(
                        "flex flex-col items-center justify-center py-2 rounded-lg border transition-all active:scale-95",
                        current === t.id 
                            ? "bg-tyrex-ultra-gold-glow text-black border-tyrex-ultra-gold-glow shadow-lg" 
                            : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                    )}
                >
                    <t.icon className="w-4 h-4 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                </button>
            ))}
        </div>
    );
};

// --- ОСНОВНОЙ ЭКРАН ---
const AnalyticsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { balance, btcPrice, cards } = useTyrexStore();

    // Настройки
    const [chartType, setChartType] = useState('area');
    const [currencyMode, setCurrencyMode] = useState<'USD' | 'BTC'>('USD');
    const [reinvest, setReinvest] = useState(true);
    const [bullRun, setBullRun] = useState(false);
    const [monthlyDeposit, setMonthlyDeposit] = useState<string>('100'); 
    
    const [showInfo, setShowInfo] = useState(false); // Показать подсказку

    // Данные с бека
    const [marketData, setMarketData] = useState<any>(null);
    const [referralStats, setReferralStats] = useState<{activeCount: number, estIncomeBtc: number}>({ activeCount: 0, estIncomeBtc: 0 });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const load = async () => {
            try {
                const [dash, refInfo] = await Promise.all([analyticsApi.getDashboard(), referralApi.getReferralInfo()]);
                if (dash) setMarketData(dash.marketSentiment);
                if (refInfo && refInfo.stats) setReferralStats({ activeCount: refInfo.stats.activeMiners, estIncomeBtc: refInfo.stats.estMonthlyIncomeBtc });
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        load();
    }, []);

    // --- 1. ТЕКУЩИЙ КАПИТАЛ ---
    const currentStats = useMemo(() => {
        const wallet = balance.walletUsd > 0 ? parseFloat(balance.walletUsd.toString()) : 0;
        const staked = cards.reduce((acc, c) => acc + (parseFloat(c.purchasePriceUsd?.toString()) || 0), 0);
        const activeCards = cards.filter(c => c.status === 'Active');
        const monthlyMiningIncome = activeCards.reduce((acc, c) => acc + (c.purchasePriceUsd * (parseFloat(c.clientAPY?.toString()) / 100) / 12), 0);
        return { totalEquity: wallet + staked, monthlyMiningIncome, activeCount: activeCards.length };
    }, [balance, cards]);

    // --- 2. РАСЧЕТ ДАННЫХ ---
    const { chartData, pieData, radarData, totalAccumulatedProfit } = useMemo(() => {
        const data = [];
        let strategyEquity = currentStats.totalEquity || 100;
        let cashEquity = currentStats.totalEquity || 100;

        let accDeposits = cashEquity; 
        let accMining = 0;
        let accRef = 0;
        let accGrowth = 0;

        const deposit = parseFloat(monthlyDeposit) || 0;
        const btcRate = btcPrice || 65000;
        let accumulatedProfit = 0;
        const today = new Date();
        
        for (let i = 0; i < 6; i++) {
            strategyEquity += deposit;
            cashEquity += deposit;
            accDeposits += deposit;

            const currentYieldRate = (strategyEquity > 0) ? (currentStats.monthlyMiningIncome / strategyEquity) : 0.05;
            let miningProfit = strategyEquity * (currentYieldRate || 0.05); 
            const refProfitUsd = referralStats.estIncomeBtc * btcRate;
            
            accMining += miningProfit;
            accRef += refProfitUsd;
            let totalMonthProfit = miningProfit + refProfitUsd;

            if (bullRun) {
                const growth = strategyEquity * 0.05;
                strategyEquity += growth;
                accumulatedProfit += growth; 
                accGrowth += growth;
            }

            accumulatedProfit += totalMonthProfit;
            if (reinvest) strategyEquity += totalMonthProfit;
            else strategyEquity += totalMonthProfit;

            const date = new Date(today);
            date.setMonth(today.getMonth() + i);
            const monthName = date.toLocaleString('default', { month: 'short' });

            data.push({
                name: monthName,
                Strategy: Math.round(strategyEquity),
                Cash: Math.round(cashEquity),
                Deposits: Math.round(accDeposits),
                Mining: Math.round(accMining),
                Referral: Math.round(accRef),
                Growth: Math.round(accGrowth),
                MonthProfit: Math.round(totalMonthProfit),
                Bank: Math.round(cashEquity * 1.02), // +2% за полгода
                valueBtc: strategyEquity / (btcRate * (bullRun ? Math.pow(1.05, i) : 1))
            });
        }

        const pie = [
            { name: 'Вложения', value: Math.round(accDeposits) },
            { name: 'Майнинг', value: Math.round(accMining) },
            { name: 'Рефералы', value: Math.round(accRef) },
            ...(accGrowth > 0 ? [{ name: 'Рост курса', value: Math.round(accGrowth) }] : [])
        ];

        const radar = [
            { subject: 'Доход', A: bullRun ? 140 : 90, fullMark: 150 },
            { subject: 'Риск', A: reinvest ? 110 : 60, fullMark: 150 },
            { subject: 'Скорость', A: deposit > 500 ? 130 : 80, fullMark: 150 },
            { subject: 'Пассив', A: referralStats.activeCount > 0 ? 140 : 50, fullMark: 150 },
            { subject: 'Ликвид.', A: 80, fullMark: 150 },
        ];

        return { chartData: data, pieData: pie, radarData: radar, totalAccumulatedProfit: accumulatedProfit };
    }, [reinvest, bullRun, monthlyDeposit, currentStats, btcPrice, referralStats]);

    // --- РЕНДЕР ГРАФИКОВ ---
    const renderChart = () => {
        const tooltipStyle = { backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' };
        const legendStyle = { fontSize: '10px', paddingTop: '10px', color: '#888' };

        switch (chartType) {
            case 'bar': // SOURCES
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 10}} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{fill: '#ffffff05'}} />
                            <Legend iconType="circle" wrapperStyle={legendStyle}/>
                            <Bar dataKey="Deposits" stackId="a" fill="#333" name="Мои деньги" />
                            <Bar dataKey="Mining" stackId="a" fill="#FDB931" name="Майнинг" />
                            <Bar dataKey="Referral" stackId="a" fill="#10B981" name="Рефка" />
                            {bullRun && <Bar dataKey="Growth" stackId="a" fill="#3B82F6" name="Рост курса" />}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'pie': // STRUCTURE
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                                {pieData.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px', right: 0}} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'radar': // SCORE
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar name="Strategy Score" dataKey="A" stroke="#FDB931" strokeWidth={2} fill="#FDB931" fillOpacity={0.3} />
                            <Tooltip contentStyle={tooltipStyle} />
                        </RadarChart>
                    </ResponsiveContainer>
                );
            case 'line': // COMPARE
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="name" tick={{fill: '#555', fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={legendStyle}/>
                            <Line type="monotone" dataKey="Strategy" stroke="#FDB931" strokeWidth={3} dot={false} name="Tyrex" />
                            <Line type="monotone" dataKey="Bank" stroke="#3B82F6" strokeWidth={2} dot={false} name="Банк (4%)" />
                            <Line type="monotone" dataKey="Cash" stroke="#333" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Кэш" />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'composed': // FLOW
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 10}} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={legendStyle}/>
                            <Bar dataKey="MonthProfit" fill="#10B981" name="Прибыль/мес" radius={[4,4,0,0]} barSize={20}/>
                            <Line type="monotone" dataKey="Strategy" stroke="#FDB931" strokeWidth={3} dot={false} name="Капитал" />
                        </ComposedChart>
                    </ResponsiveContainer>
                );
            case 'area':
            default: // GROWTH (Классика)
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FDB931" stopOpacity={0.3}/><stop offset="95%" stopColor="#FDB931" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 10}} dy={10}/>
                            <YAxis hide={false} axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 9}} tickFormatter={(val) => currencyMode === 'USD' ? `$${val/1000}k` : val.toFixed(2)}/>
                            <Tooltip contentStyle={tooltipStyle} itemStyle={{paddingBottom: 4}} formatter={(value: any, name: any) => [currencyMode === 'USD' ? `$${value.toLocaleString()}` : `${value.toFixed(4)}`, name === 'Strategy' ? '🚀 Майнинг' : '🏦 Копилка']}/>
                            <Area type="monotone" dataKey="Strategy" stroke="#FDB931" strokeWidth={4} fillOpacity={1} fill="url(#colorStrategy)" dot={{ r: 4, fill: "#FDB931", strokeWidth: 1, stroke: "#000" }} />
                            {currencyMode === 'USD' && <Area type="monotone" dataKey="Cash" stroke="#444" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />}
                        </AreaChart>
                    </ResponsiveContainer>
                );
        }
    };

    const finalValue = currencyMode === 'USD' 
        ? `$${chartData[chartData.length - 1]?.Strategy.toLocaleString()}`
        : `${chartData[chartData.length - 1]?.valueBtc.toFixed(4)} BTC`;

    const efficiency = (((chartData[5].Strategy - chartData[5].Cash) / chartData[5].Cash) * 100).toFixed(0);
    const sentimentValue = marketData?.value || 50;
    const sentimentText = marketData?.status || "Neutral";
    const sentimentColor = sentimentValue > 60 ? 'text-green-400' : sentimentValue < 40 ? 'text-red-400' : 'text-yellow-400';

    if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-white/20"/></div>;

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-28 font-sans selection:bg-purple-500">
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

            {/* --- БЛОК ГРАФИКОВ --- */}
            <div className="relative mx-4 mb-6">
                <div className="bg-[#121214] border border-white/10 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none"><Zap className="w-24 h-24 text-white"/></div>
                    
                    {/* Переключатель Типов Графиков */}
                    <ChartSelector current={chartType} onChange={setChartType} />

                    <div className="relative z-10 mb-2 flex justify-between items-start mt-4">
                        <div>
                            {/* ПОДСКАЗКА С ДИНАМИЧЕСКИМ ОПИСАНИЕМ */}
                            <div className="flex items-center space-x-2 mb-1 cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{CHART_INFO[chartType].title}</p>
                                <HelpCircle className="w-3 h-3 text-white/30" />
                            </div>
                            
                            {showInfo && (
                                <div className="absolute top-8 left-0 bg-[#222] border border-tyrex-ultra-gold-glow/30 p-4 rounded-xl z-30 w-64 text-[10px] text-white/90 shadow-2xl animate-fade-in-up">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-tyrex-ultra-gold-glow uppercase tracking-wider">{CHART_INFO[chartType].title}</p>
                                        <X className="w-3 h-3 text-white/50 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowInfo(false); }} />
                                    </div>
                                    <p className="leading-relaxed opacity-80">{CHART_INFO[chartType].desc}</p>
                                </div>
                            )}

                            <h3 className="text-3xl font-black text-white italic tracking-tighter mt-1">{finalValue}</h3>
                            <p className="text-[9px] text-green-400 mt-1 uppercase font-bold tracking-wider">Эффективность: +{efficiency}% vs Кэш</p>
                        </div>
                        <button onClick={() => setCurrencyMode(prev => prev === 'USD' ? 'BTC' : 'USD')} className="flex items-center space-x-1 bg-white/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                            <ArrowRightLeft className="w-3 h-3 text-tyrex-ultra-gold-glow" />
                            <span className="text-[10px] font-bold uppercase">{currencyMode}</span>
                        </button>
                    </div>

                    <div className="h-60 w-full mb-4 -ml-2">
                        {renderChart()}
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

            {/* 2. DREAM TARGETS */}
            <div className="px-5 mb-8">
                <div className="flex justify-between items-end mb-4"><h4 className="text-sm font-black text-white uppercase tracking-wider">Ваши цели</h4><span className="text-[10px] text-white/30">С чистой прибыли (6 мес)</span></div>
                <div className="space-y-3">{TARGETS.map(target => <TargetCard key={target.id} target={target} profit={totalAccumulatedProfit} />)}</div>
            </div>

            {/* 3. FOMO BLOCK */}
            <div className="mx-4 mb-8 bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div><p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Осторожно: Инфляция</p><p className="text-xs text-white/70 leading-tight">Просто хранить доллары — терять <span className="text-white font-bold">7%</span> покупательской способности в год.</p></div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>

            {/* CTA */}
            <div className="px-4 bottom-24 z-20">
                <button onClick={() => navigate('/marketplace')} className="w-full py-5 bg-tyrex-ultra-gold-glow text-black rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-[0_10px_40px_rgba(253,185,49,0.3)] active:scale-95 transition-all flex items-center justify-center space-x-2">
                    <Rocket className="w-5 h-5" /><span>Начать Стратегию</span>
                </button>
            </div>
        </div>
    );
};

export default AnalyticsScreen;