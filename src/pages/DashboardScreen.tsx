import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram'; 
import { useTyrexStore } from '../store/useTyrexStore';
import { userApi } from '../api/tyrexApi';
import { 
    Copy, X, Loader2, Bell, Plus, 
    ArrowUpRight, History, Clock, CheckCircle, 
    XCircle, Info, MessageCircle, Bitcoin,
    QrCode, ArrowDown, Users, Zap
} from 'lucide-react';
import TyrexModal from '../components/common/TyrexModal';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_WALLET_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"; 
const SATS_IN_BTC = 100000000;

// --- 1. ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ: СТАТУС ТРАНЗАКЦИИ ---
const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'PENDING': return <Clock size={12} className="text-amber-500" />;
        case 'CONFIRMED': 
        case 'PROCESSED': return <CheckCircle size={12} className="text-emerald-500" />;
        case 'REJECTED': return <XCircle size={12} className="text-rose-500" />;
        default: return null;
    }
};

const DashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const { tg, refreshAllData, user } = useTelegram();
    const { simulateDailyInterest, balance, btcPrice, cards } = useTyrexStore();

    // Состояния
    const [isDepositOpen, setDepositOpen] = useState(false);
    const [isWithdrawOpen, setWithdrawOpen] = useState(false);
    const [isHistoryOpen, setHistoryOpen] = useState(false);
    const [isNotifOpen, setNotifOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
    const [amount, setAmount] = useState('');
    const [walletOrHash, setWalletOrHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [criticalAlert, setCriticalAlert] = useState<any>(null);
    const [resultModal, setResultModal] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        if (tg) tg.ready();
        fetchNotifications();
        loadHistorySilently();
        const intv = setInterval(() => { 
            simulateDailyInterest(); 
            fetchNotifications(); 
            loadHistorySilently();
        }, 30000); 
        return () => clearInterval(intv);
    }, []);

    const loadHistorySilently = async () => {
        try {
            const data = await userApi.getHistory();
            setHistory(data);
        } catch (e) { console.error(e); }
    };

    const fetchNotifications = async () => {
        try {
            const data = await userApi.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
            const alert = data.find((n: any) => !n.isRead && (n.title.includes('Rejected') || n.title.includes('Failed')));
            if (alert) setCriticalAlert(alert);
        } catch (e) { console.error(e); }
    };

    const handleAction = async (method: any) => {
        setLoading(true);
        try {
            await method();
            setDepositOpen(false); setWithdrawOpen(false);
            loadHistorySilently();
        } catch (error: any) {
            alert(error.message);
        } finally { setLoading(false); refreshAllData(); }
    };

    // --- РАСЧЕТЫ КОНЦЕПЦИИ "BTC KING" ---
    const btcStats = useMemo(() => {
        const activeCards = cards.filter(c => c.status === 'Active');
        const walletBtc = balance.walletUsd / btcPrice;
        const totalEquityBtc = balance.totalBTC + walletBtc;
        const totalEquityUsd = totalEquityBtc * btcPrice;
        const dailyProfitBtc = activeCards.reduce((acc, c) => acc + (c.nominalBtc * (c.clientAPY / 100) / 365), 0);
        const totalProfitBtc = balance.totalProfitUsd / btcPrice;
        const referralBtcTotal = balance.referralSats / SATS_IN_BTC;
        const dailyRefBtc = referralBtcTotal > 0 ? (referralBtcTotal / 30) : 0;

        const averageApy = activeCards.length > 0 
            ? (activeCards.reduce((a, b) => a + b.clientAPY, 0) / activeCards.length).toFixed(1) 
            : "25.0";

        return {
            totalEquityBtc, totalEquityUsd, dailyProfitBtc,
            totalProfitBtc, averageApy, activeCount: activeCards.length,
            referralBtcTotal, dailyRefBtc
        };
    }, [cards, balance, btcPrice]);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans pb-32 relative overflow-hidden">
            
            {/* Глубокое свечение */}
            <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[100%] h-[40%] bg-[#FDB931] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

            <AnimatePresence>
                {criticalAlert && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl">
                        <div className="relative z-10 bg-[#121212] border border-rose-500/20 w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl">
                            <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">{criticalAlert.title}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">{criticalAlert.message}</p>
                            <button onClick={() => { setCriticalAlert(null); userApi.markNotificationsRead(); refreshAllData(); }} 
                                className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-xs active:scale-95 transition-all">OK</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- 1. HEADER --- */}
            <header className="px-6 pt-8 flex justify-between items-center">
                <div onClick={() => navigate('/profile')} className="flex items-center space-x-3 cursor-pointer active:opacity-60">
                    <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.08] rounded-full flex items-center justify-center shadow-inner">
                        <span className="text-tyrex-ultra-gold-glow font-bold">{user?.username?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-200">@{user?.username || 'Miner'}</span>
                </div>
                <div className="flex space-x-3">
                    <button className="p-2.5 bg-white/[0.03] rounded-full border border-white/[0.08] active:scale-90 transition-all"><QrCode size={20} className="text-slate-400" /></button>
                    <button onClick={() => setNotifOpen(true)} className="relative p-2.5 bg-white/[0.03] rounded-full border border-white/[0.08] active:scale-90 transition-all">
                        <Bell size={20} className="text-white/70" />
                        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]" />}
                    </button>
                </div>
            </header>

            <main className="mt-10 space-y-10">
                
                {/* --- 2. HERO BALANCE SECTION --- */}
                <section className="px-8 flex flex-col items-center text-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Total Assets</p>
                    <h1 className="text-[42px] font-mono font-bold tracking-tighter leading-none mb-3 text-white flex items-center justify-center">
                        <span className="text-tyrex-ultra-gold-glow mr-3">₿</span>
                        {btcStats.totalEquityBtc.toFixed(8)}
                    </h1>
                    <p className="text-[17px] font-medium text-slate-500 mb-8 tabular-nums tracking-tight">
                        <span className="opacity-20 font-sans mr-1">≈</span>
                        <span className="opacity-20 font-sans">$</span>
                        {btcStats.totalEquityUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>

                    <div className="bg-white/[0.03] border border-white/[0.08] px-6 py-3 rounded-full flex items-center space-x-4 shadow-xl">
                        <div className="flex items-center space-x-2">
                            <span className="text-emerald-500 font-mono font-bold text-[13px]">+{btcStats.dailyProfitBtc.toFixed(8)}</span>
                            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">today</span>
                        </div>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <div className="flex items-center space-x-2">
                            <span className="text-slate-200 font-mono font-bold text-[13px]">{btcStats.totalProfitBtc.toFixed(6)}</span>
                            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">all time</span>
                        </div>
                    </div>
                </section>

                {/* --- 3. ACTION BAR --- */}
                <section className="px-8 flex justify-center space-x-10">
                    <QuickAction icon={ArrowDown} label="Add" onClick={() => setDepositOpen(true)} accent />
                    <QuickAction icon={ArrowUpRight} label="Send" onClick={() => setWithdrawOpen(true)} />
                    <QuickAction icon={History} label="History" onClick={() => setHistoryOpen(true)} />
                </section>

                {/* --- 4. ACTIVE INCOME GRID --- */}
                <section className="px-6 grid grid-cols-2 gap-4">
                    
                    {/* MINING CARD */}
                    <div 
                        onClick={() => navigate('/collection')}
                        className="bg-gradient-to-br from-[#111] to-[#080808] border border-white/[0.08] rounded-[2.2rem] p-5 shadow-xl active:scale-[0.98] transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Mining</h3>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center">
                                <Zap size={10} className="mr-1" /> {btcStats.averageApy}%
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Power</p>
                            <p className="text-lg font-bold text-white leading-none">{btcStats.activeCount} Nodes</p>
                            
                            <div className="pt-4">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Est. Revenue</p>
                                <p className="text-[10px] font-mono font-bold text-emerald-400">
                                    +{btcStats.dailyProfitBtc.toFixed(8)} <span className="opacity-50 font-sans text-[8px]">today</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* PARTNERS CARD */}
                    <div 
                        onClick={() => navigate('/referral')}
                        className="bg-gradient-to-br from-[#12111a] to-[#0a080f] border border-purple-500/10 rounded-[2.2rem] p-5 shadow-xl active:scale-[0.98] transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Partners</h3>
                            <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center">
                                <Users size={10} className="mr-1" /> 15%
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Earned</p>
                            <p className="text-lg font-bold text-white leading-none">₿ {btcStats.referralBtcTotal.toFixed(6)}</p>
                            
                            <div className="pt-4">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active</p>
                                <p className="text-[10px] font-mono font-bold text-purple-400">
                                    +{btcStats.dailyRefBtc.toFixed(8)} <span className="opacity-50 font-sans text-[8px]">today</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- 5. ACTIVITY FEED --- */}
                <section className="px-6 space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em]">Live Stream</h3>
                        <button onClick={() => setHistoryOpen(true)} className="text-[11px] font-bold text-tyrex-ultra-gold-glow hover:opacity-70 transition-opacity">Full History</button>
                    </div>

                    <div className="space-y-4">
                        {history.slice(0, 3).map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedTransaction(item)} 
                                className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-[2.2rem] flex justify-between items-center active:bg-white/[0.04] transition-all cursor-pointer"
                            >
                                <div className="flex items-center space-x-5">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
                                        item.type === 'DEPOSIT' ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"
                                    )}>
                                        {item.type === 'DEPOSIT' ? <Plus size={20} /> : <Bitcoin size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-bold text-white/90 uppercase tracking-tighter">
                                            {item.type === 'DEPOSIT' ? 'Bridge In' : 'Revenue'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase mt-1 tracking-widest">{new Date(item.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={clsx("text-[15px] font-mono font-bold mb-1", item.type === 'DEPOSIT' ? "text-emerald-400" : "text-white")}>
                                        {item.type === 'DEPOSIT' ? `+$${item.amount.toFixed(2)}` : `₿ ${(item.amount / btcPrice).toFixed(8)}`}
                                    </p>
                                    <StatusIcon status={item.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* --- MODALS (REUSED) --- */}
            {selectedTransaction && <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
            <AnimatePresence>{isNotifOpen && <NotifModal notifications={notifications} onClose={() => setNotifOpen(false)} />}</AnimatePresence>
            <HistoryModal isOpen={isHistoryOpen} history={history} onClose={() => setHistoryOpen(false)} onSelect={(tx:any) => {setSelectedTransaction(tx); setHistoryOpen(false);}} />
            <DepositModal isOpen={isDepositOpen} onClose={() => setDepositOpen(false)} amount={amount} setAmount={setAmount} walletOrHash={walletOrHash} setWalletOrHash={setWalletOrHash} handleAction={() => handleAction(() => userApi.requestDeposit(Number(amount), walletOrHash))} loading={loading} />
            <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setWithdrawOpen(false)} amount={amount} setAmount={setAmount} walletOrHash={walletOrHash} setWalletOrHash={setWalletOrHash} handleAction={() => handleAction(() => userApi.requestWithdrawal(Number(amount), walletOrHash))} balance={balance.walletUsd} loading={loading} />
            <TyrexModal isOpen={resultModal.isOpen} title={resultModal.title} message={resultModal.message} actionText="OK" onAction={() => setResultModal(prev => ({ ...prev, isOpen: false }))} onClose={function (): void {
                throw new Error('Function not implemented.');
            } } />
        </div>
    );
};

// --- SUB-COMPONENTS ---
const QuickAction = ({ icon: Icon, label, onClick, accent = false }: any) => (
    <div onClick={onClick} className="flex flex-col items-center space-y-2 cursor-pointer group active:opacity-60">
        <div className={clsx("w-14 h-14 rounded-full flex items-center justify-center border transition-all", accent ? "bg-tyrex-ultra-gold-glow text-black border-transparent shadow-lg shadow-amber-500/10" : "bg-white/[0.05] border-white/10 text-white/50")}>
            <Icon size={24} strokeWidth={accent ? 3 : 2} />
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
);

const NotifModal = ({ notifications, onClose }: any) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#121213] border border-white/10 w-full max-w-sm rounded-[3rem] flex flex-col max-h-[70vh] relative shadow-2xl p-8">
            <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-white/5 rounded-full"><X size={16} className="text-slate-500" /></button>
            <h3 className="text-xl font-bold uppercase mb-8 tracking-tight">Signals</h3>
            <div className="overflow-y-auto space-y-4">
                {notifications.length === 0 ? <p className="text-center py-10 opacity-30 text-xs font-bold uppercase">Signal lost</p> : notifications.map((n: any) => (
                    <div key={n._id} className="p-5 rounded-3xl border border-white/5 bg-white/[0.02]">
                        <div className="flex items-center space-x-2 mb-2"><Info size={14} className="text-tyrex-ultra-gold-glow" /><span className="text-[11px] font-bold uppercase text-white">{n.title}</span></div>
                        <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    </div>
);

const HistoryModal = ({ isOpen, history, onClose, onSelect }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
            <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[3rem] flex flex-col max-h-[85vh] shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-bold uppercase tracking-tighter font-sans">Full History</h3><button onClick={onClose} className="p-2 bg-white/5 rounded-full active:scale-90 transition-all"><X size={18}/></button></div>
                <div className="overflow-y-auto p-5 space-y-3">
                    {history.map((item:any) => (
                        <div key={item.id} onClick={() => onSelect(item)} className="bg-white/[0.03] p-5 rounded-[2rem] flex justify-between items-center active:bg-white/10 transition-all cursor-pointer border border-white/5">
                            <div className="flex items-center space-x-4"><div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-black", item.type === 'DEPOSIT' ? "text-green-500 bg-green-500/10" : "text-purple-500 bg-purple-500/10")}><History className="w-5 h-5"/></div><div><p className="text-[11px] font-bold uppercase tracking-tighter">{item.type}</p><p className="text-[8px] opacity-30 font-bold">{new Date(item.date).toLocaleString()}</p></div></div>
                            <div className="text-right font-bold italic text-sm tracking-tighter">${item.amount.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DepositModal = ({ isOpen, onClose, amount, setAmount, walletOrHash, setWalletOrHash, handleAction, loading }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/98 p-6 backdrop-blur-3xl">
            <div className="bg-[#0A0A0B] w-full max-w-sm rounded-[3.5rem] p-10 border border-white/[0.08] relative shadow-2xl">
                <button onClick={onClose} className="absolute top-10 right-10 p-2 bg-white/5 rounded-full"><X size={18} className="text-slate-500" /></button>
                <h3 className="text-2xl font-bold uppercase mb-10 tracking-tight text-white">Bridge In</h3>
                <div className="bg-black/60 p-7 rounded-[2.5rem] border border-white/[0.05] mb-10 text-center space-y-4 shadow-inner">
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em]">Network Address (BTC)</p>
                    <code className="text-xs text-tyrex-ultra-gold-glow block break-all font-mono opacity-90">{ADMIN_WALLET_ADDRESS}</code>
                    <button onClick={() => {navigator.clipboard.writeText(ADMIN_WALLET_ADDRESS); alert("Copied");}} className="mx-auto flex items-center space-x-2 bg-white/5 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase text-slate-400 active:scale-95 transition-all">
                        <Copy size={14}/><span>Copy Node</span>
                    </button>
                </div>
                <div className="space-y-5">
                    <input type="text" inputMode="decimal" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-black border border-white/10 rounded-2xl p-6 text-white font-black outline-none focus:border-tyrex-ultra-gold-glow transition-all text-lg shadow-inner" />
                    <input type="text" placeholder="Transaction ID (Hash)" value={walletOrHash} onChange={(e) => setWalletOrHash(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-6 text-white font-black outline-none focus:border-tyrex-ultra-gold-glow transition-all shadow-inner" />
                    <button onClick={handleAction} disabled={loading} className="w-full bg-tyrex-ultra-gold-glow text-black py-6 rounded-[2.2rem] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 shadow-yellow-500/10 border-t border-white/40">{loading ? <Loader2 className="animate-spin w-6 h-6 mx-auto"/> : 'Authorize Bridge'}</button>
                </div>
            </div>
        </div>
    );
};

const WithdrawModal = ({ isOpen, onClose, amount, setAmount, walletOrHash, setWalletOrHash, handleAction, balance, loading }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/98 p-6 backdrop-blur-3xl">
            <div className="bg-[#0A0A0B] w-full max-w-sm rounded-[3.5rem] p-10 border border-white/[0.08] relative shadow-2xl">
                <button onClick={onClose} className="absolute top-10 right-10 p-2 bg-white/5 rounded-full"><X size={18} className="text-slate-500" /></button>
                <h3 className="text-2xl font-bold uppercase mb-10 tracking-tight text-white italic">Withdraw</h3>
                <p className="text-center text-slate-500 text-xs mb-8">Available: <span className="text-emerald-400 font-bold">${balance.toFixed(2)}</span></p>
                <div className="space-y-5">
                    <input type="text" inputMode="decimal" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-black border border-white/10 rounded-2xl p-6 text-white font-bold outline-none focus:border-tyrex-ultra-gold-glow transition-all shadow-inner" />
                    <input type="text" placeholder="Wallet (TRC20)" value={walletOrHash} onChange={(e) => setWalletOrHash(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-6 text-white font-bold outline-none focus:border-tyrex-ultra-gold-glow transition-all shadow-inner" />
                    <button onClick={handleAction} disabled={loading} className="w-full bg-tyrex-ultra-gold-glow text-black py-6 rounded-[2.2rem] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 shadow-yellow-500/10 border-t border-white/40">{loading ? <Loader2 className="animate-spin w-6 h-6 mx-auto"/> : 'Execute Send'}</button>
                </div>
            </div>
        </div>
    );
};

// --- КОМПОНЕНТ ДЕТАЛЕЙ (ЧЕК) ---
const TransactionDetailModal = ({ tx, onClose }: { tx: any, onClose: () => void }) => {
    if (!tx) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-fade-in">
            <div className="bg-[#080808] border border-white/10 w-full max-w-sm rounded-[3.5rem] p-9 shadow-2xl relative shadow-[inset_0_1px_1px_rgba(255,215,0,0.1)]">
                <button onClick={onClose} className="absolute top-9 right-9 p-2 bg-white/5 rounded-full"><X className="w-4 h-4 text-white/30"/></button>
                <div className="text-center mb-10">
                    <div className={clsx("w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-2xl", tx.type === 'DEPOSIT' ? "bg-green-500/10 text-green-500 shadow-green-500/10" : "bg-purple-500/10 text-purple-500 shadow-purple-500/10")}>
                        <History size={36} />
                    </div>
                    <h3 className="text-[26px] font-black text-white uppercase italic tracking-tighter leading-none">{tx.type}</h3>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mt-3">Network Receipt</p>
                </div>
                <div className="space-y-5 font-mono">
                    <div className="bg-gradient-to-br from-[#1a1a1c] to-black rounded-[2.5rem] p-8 text-center border border-white/5 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <p className="text-[11px] text-white/30 uppercase font-black mb-2 tracking-widest">Status: <span className={tx.status === 'REJECTED' ? 'text-red-500' : 'text-green-500'}>{tx.status}</span></p>
                        <p className={clsx("text-[40px] font-black italic tracking-tighter", tx.type === 'DEPOSIT' ? "text-green-400" : "text-white")}>${tx.amount.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/[0.02] rounded-[1.8rem] p-5 border border-white/5 text-center">
                         <p className="text-[9px] text-white/20 font-black mb-2 uppercase tracking-widest">Operator Note</p>
                         <p className="text-[12px] leading-relaxed opacity-70 italic font-medium">"{tx.adminComment || "Verified automatic accrual through node protocol v.1.0.4"}"</p>
                    </div>
                    <button 
                        onClick={() => window.open('https://t.me/tyrex_support')}
                        className="w-full py-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all group font-sans"
                    >
                        <MessageCircle className="w-5 h-5 text-tyrex-ultra-gold-glow group-hover:scale-110 transition-transform"/><span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Contact Support</span>
                    </button>
                </div>
                <button onClick={onClose} className="w-full mt-10 py-5 bg-white/5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] text-white/20 active:text-white transition-all font-sans">Dismiss Receipt</button>
            </div>
        </div>
    );
};

export default DashboardScreen; 