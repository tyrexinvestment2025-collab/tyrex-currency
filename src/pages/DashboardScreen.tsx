import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram'; 
import { useTyrexStore } from '../store/useTyrexStore';
import { userApi } from '../api/tyrexApi';
import { 
    Copy, X, Loader2, Bell, Plus, 
    ArrowUpRight, 
    Clock, CheckCircle, XCircle, Info, MessageCircle, ChevronRight, Bitcoin,
    Users
} from 'lucide-react';
import TyrexModal from '../components/common/TyrexModal';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_WALLET_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; 
const SATS_IN_BTC = 100000000;

// --- 1. ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ: СТАТУС ТРАНЗАКЦИИ ---
const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'PENDING': return <Clock className="w-3 h-3 text-yellow-500" />;
        case 'CONFIRMED': 
        case 'PROCESSED': return <CheckCircle className="w-3 h-3 text-green-500" />;
        case 'REJECTED': return <XCircle className="w-3 h-3 text-red-500" />;
        default: return null;
    }
};

// --- 2. КОМПОНЕНТ: ДЕТАЛЬНЫЙ ОБЗОР ТРАНЗАКЦИИ (ЧЕК) ---
const TransactionDetailModal = ({ tx, onClose }: { tx: any, onClose: () => void }) => {
    if (!tx) return null;
    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Скопировано!");
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
            <div className="bg-[#0D0D0E] border border-white/10 w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-white/5 rounded-full border border-white/10 active:scale-90 transition-all">
                    <X className="w-4 h-4 text-white/50"/>
                </button>
                
                <div className="text-center mb-8">
                    <div className={clsx("w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4", 
                        tx.type === 'DEPOSIT' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                        {tx.type === 'DEPOSIT' ? <Plus className="w-8 h-8" /> : <ArrowUpRight className="w-8 h-8" />}
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                        {tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                    </h3>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/5 rounded-3xl p-6 text-center border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase font-black mb-1">Total Amount</p>
                        <p className={clsx("text-3xl font-black italic", tx.type === 'DEPOSIT' ? "text-green-400" : "text-white")}>
                            ${tx.amount.toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                         <p className="text-[8px] text-white/30 uppercase font-black mb-1">Status Report</p>
                         <p className={clsx("text-xs font-bold", tx.status === 'REJECTED' ? "text-red-400" : "text-white/70")}>
                            {tx.adminComment || (tx.status === 'PENDING' ? "Ожидает подтверждения" : "Успешно завершено")}
                         </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                            <p className="text-[8px] text-white/30 uppercase font-black mb-1">Status</p>
                            <div className="flex items-center space-x-1">
                                <StatusIcon status={tx.status} />
                                <span className={clsx("text-[10px] font-black uppercase", tx.status === 'REJECTED' ? 'text-red-500' : 'text-green-500')}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                            <p className="text-[8px] text-white/30 uppercase font-black mb-1">Date</p>
                            <p className="text-[10px] text-white font-bold">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {tx.status === 'REJECTED' && (
                        <button 
                            onClick={() => window.open('https://t.me/tyrex_support')}
                            className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center space-x-2 text-red-400 font-black text-xs uppercase active:scale-95 transition-all"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Написать в поддержку</span>
                        </button>
                    )}

                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[8px] text-white/30 uppercase font-black mb-1">{tx.type === 'DEPOSIT' ? 'TxHash' : 'Wallet'}</p>
                        <div onClick={() => copyText(tx.meta)} className="flex items-center justify-between cursor-pointer active:opacity-50">
                            <p className="text-[9px] text-tyrex-ultra-gold-glow font-mono truncate mr-2">{tx.meta}</p>
                            <Copy className="w-3.5 h-3.5 text-white/30 shrink-0"/>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="w-full mt-8 py-5 bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-white/40 active:text-white transition-colors">Close Receipt</button>
            </div>
        </div>
    );
};

// --- 3. ГЛАВНЫЙ ЭКРАН ---
const DashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const { tg, refreshAllData, user } = useTelegram();
    const { simulateDailyInterest, balance, btcPrice } = useTyrexStore();

    // Состояния
    const [isDepositOpen, setDepositOpen] = useState(false);
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
    const [resultModal, setResultModal] = useState({ isOpen: false, title: '', message: '', isError: false });

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

    const inWorkPercent = balance.totalBTC > 0 
        ? Math.min(100, Math.round((balance.stakingBTC / balance.totalBTC) * 100)) 
        : 0;

    const handleDepositSubmit = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return alert("Enter valid amount");
        if (!walletOrHash) return alert("Enter Hash");
        setLoading(true);
        try {
            await userApi.requestDeposit(Number(amount), walletOrHash);
            setDepositOpen(false);
            setResultModal({ isOpen: true, title: 'Success', message: 'Request submitted.', isError: false });
            setAmount(''); setWalletOrHash('');
            loadHistorySilently();
        } catch (error: any) {
            setResultModal({ isOpen: true, title: 'Error', message: error.message, isError: true });
        } finally { setLoading(false); refreshAllData(); }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans pb-32">
            
            {/* КРИТИЧЕСКИЙ АЛЕРТ */}
            <AnimatePresence>
                {criticalAlert && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xl" />
                        <div className="relative z-10 bg-[#121213] border border-red-500/20 w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl">
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                            <h2 className="text-2xl font-black uppercase italic text-white mb-2">{criticalAlert.title}</h2>
                            <p className="text-white/60 text-sm leading-relaxed mb-8">{criticalAlert.message}</p>
                            <div className="space-y-3">
                                <button onClick={() => { setCriticalAlert(null); userApi.markNotificationsRead(); refreshAllData(); }} 
                                    className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-xs active:scale-95 transition-all">Попробовать снова</button>
                                <button onClick={() => window.open('https://t.me/tyrex_support')} 
                                    className="w-full py-4 bg-white/5 text-white/40 rounded-2xl font-bold uppercase text-[10px] flex items-center justify-center space-x-2"><MessageCircle className="w-4 h-4"/> <span>Поддержка</span></button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ШАПКА */}
            <header className="p-6 pt-8 flex justify-between items-center">
                <div onClick={() => navigate('/profile')} className="flex items-center space-x-3 cursor-pointer active:opacity-60 transition-opacity">
                    <div className="w-10 h-10 bg-tyrex-ultra-gold-glow rounded-full flex items-center justify-center text-black font-black text-sm shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none mb-1">Welcome back,</p>
                        <h2 className="text-base font-black tracking-tight">@{user?.username || 'Miner'}</h2>
                    </div>
                </div>
                <button onClick={() => setNotifOpen(true)} className="relative p-2 bg-white/5 rounded-full border border-white/10 active:scale-90 transition-all">
                    <Bell className="w-5 h-5 text-white/70" />
                    {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />}
                </button>
            </header>

            <main className="px-5 space-y-6">
                
                {/* 1. BTC ПОРТФЕЛЬ (КНОПКА) */}
                <div 
                    onClick={() => navigate('/collection')}
                    className="bg-[#111112] border border-white/5 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-active:opacity-[0.08] transition-opacity"><Bitcoin className="w-32 h-32" /></div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">BTC ПОРТФЕЛЬ</p>
                    <h1 className="text-[40px] font-black italic tracking-tighter leading-none mb-6">
                        {balance.totalBTC.toFixed(8)} <span className="text-sm not-italic opacity-20 uppercase font-sans">BTC</span>
                    </h1>
                    <div className="space-y-3">
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${inWorkPercent}%` }} className="h-full bg-tyrex-ultra-gold-glow shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
                            <span className="text-tyrex-ultra-gold-glow">В работе: {inWorkPercent}%</span>
                            <span className="text-white/20">На кошельке: {100 - inWorkPercent}%</span>
                        </div>
                    </div>
                </div>

                {/* 2. USD КОШЕЛЕК (КЛИКАБЕЛЬНАЯ ЦИФРА) */}
                <section className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 flex items-center justify-between">
                    <div 
                        onClick={() => setHistoryOpen(true)}
                        className="active:opacity-50 transition-opacity cursor-pointer pr-4"
                    >
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Баланс для покупок</p>
                        <h3 className="text-xl font-black tabular-nums tracking-tight">
                            ${balance.walletUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                    <button 
                        onClick={() => setDepositOpen(true)}
                        className="bg-tyrex-ultra-gold-glow text-black p-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Пополнить</span>
                    </button>
                </section>

                {/* 3. ДОХОД ОТ ПАРТНЕРОВ (КНОПКА) */}
                <div 
                    onClick={() => navigate('/referral')}
                    className="bg-orange-500/5 border border-orange-500/10 rounded-[2rem] p-5 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-tyrex-ultra-gold-glow/10 rounded-2xl flex items-center justify-center group-active:bg-tyrex-ultra-gold-glow/20 transition-colors">
                            <Users className="w-6 h-6 text-tyrex-ultra-gold-glow" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Доход с партнеров (всего)</p>
                            <div className="flex items-baseline space-x-1.5">
                                <span className="text-lg font-black text-tyrex-ultra-gold-glow italic">{(balance.referralSats / SATS_IN_BTC).toFixed(8)}</span>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter font-sans">≈ ${( (balance.referralSats / SATS_IN_BTC) * btcPrice ).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-tyrex-ultra-gold-glow" />
                </div>

                {/* 4. ПОСЛЕДНИЕ ОПЕРАЦИИ */}
                <section className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Последние операции</h3>
                        <button onClick={() => setHistoryOpen(true)} className="text-[10px] font-bold text-tyrex-ultra-gold-glow uppercase flex items-center">
                            Смотреть все <ChevronRight className="w-3 h-3 ml-1" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {history.length === 0 ? (
                            <div className="py-8 text-center bg-white/[0.01] border border-white/5 rounded-[2rem] italic text-white/20 text-[10px] uppercase font-bold">Пусто</div>
                        ) : (
                            history.slice(0, 3).map((item) => (
                                <div key={item.id} onClick={() => setSelectedTransaction(item)} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-center active:bg-white/5 transition-all cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", item.type === 'DEPOSIT' ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10")}>
                                            {item.type === 'DEPOSIT' ? <Plus className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4"/>}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white/90">{item.type}</p>
                                            <p className="text-[9px] text-white/30 font-bold uppercase">{new Date(item.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={clsx("text-sm font-black italic", item.type === 'DEPOSIT' ? "text-green-400" : "text-white")}>
                                            ${item.amount.toFixed(2)}
                                        </p>
                                        <div className="flex justify-end opacity-50"><StatusIcon status={item.status} /></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            {/* МОДАЛКА УВЕДОМЛЕНИЙ */}
            <AnimatePresence>
                {isNotifOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#121213] border border-white/10 w-full max-w-sm rounded-[2rem] flex flex-col max-h-[70vh] relative shadow-2xl">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center"><h3 className="text-lg font-black uppercase italic tracking-widest text-tyrex-ultra-gold-glow">Notifications</h3><button onClick={() => setNotifOpen(false)} className="p-2 bg-white/5 rounded-full active:scale-90 transition-all"><X className="w-4 h-4" /></button></div>
                            <div className="overflow-y-auto p-4 space-y-3 font-sans">
                                {notifications.length === 0 ? <p className="text-center py-10 opacity-30 text-xs font-bold uppercase">No messages</p> : notifications.map((n: any) => (
                                    <div key={n._id} className={clsx("p-4 rounded-2xl border transition-all", n.isRead ? "bg-white/[0.02] border-white/5 opacity-40" : "bg-white/[0.05] border-white/10 shadow-lg")}>
                                        <div className="flex items-center space-x-2 mb-1"><Info className="w-3 h-3 text-tyrex-ultra-gold-glow" /><span className="text-[10px] font-black uppercase text-white">{n.title}</span></div>
                                        <p className="text-[11px] text-white/50 leading-relaxed font-medium">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* МОДАЛКА ПОЛНОЙ ИСТОРИИ */}
            {isHistoryOpen && (
                <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
                    <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2rem] flex flex-col max-h-[80vh] shadow-2xl">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-bold italic uppercase tracking-tighter">Full History</h3><button onClick={() => setHistoryOpen(false)} className="p-2 bg-white/5 rounded-full active:scale-90 transition-all"><X className="w-4 h-4"/></button></div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {history.map(item => (
                                <div key={item.id} onClick={() => { setSelectedTransaction(item); setHistoryOpen(false); }} className="bg-white/5 p-4 rounded-xl flex justify-between items-center active:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", item.type === 'DEPOSIT' ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10")}>
                                            {item.type === 'DEPOSIT' ? <Plus className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4"/>}
                                        </div>
                                        <div className="text-xs font-bold uppercase">{item.type}</div>
                                    </div>
                                    <div className="text-right"><div className="font-black italic">${item.amount.toFixed(2)}</div><StatusIcon status={item.status} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectedTransaction && <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}

            {/* МОДАЛКА ПОПОЛНЕНИЯ */}
            {isDepositOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4 animate-fade-in backdrop-blur-md">
                    <div className="bg-[#121213] w-full max-w-sm rounded-[3rem] p-8 border border-white/10 relative shadow-2xl">
                        <button onClick={() => setDepositOpen(false)} className="absolute top-8 right-8 p-2 bg-white/5 rounded-full active:scale-90 transition-all"><X className="w-4 h-4 text-white/30" /></button>
                        <h3 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">Add Funds</h3>
                        <div className="bg-black/40 p-5 rounded-3xl border border-white/5 mb-8 text-center space-y-3">
                            <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">USDT TRC20 Address</p>
                            <code className="text-xs text-tyrex-ultra-gold-glow block break-all font-mono">{ADMIN_WALLET_ADDRESS}</code>
                            <button onClick={() => {navigator.clipboard.writeText(ADMIN_WALLET_ADDRESS); alert("Copied!");}} className="mx-auto flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white/50 active:scale-95"><Copy className="w-3.5 h-3.5"/><span>Copy Address</span></button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" inputMode="decimal" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-black outline-none focus:border-tyrex-ultra-gold-glow transition-all" />
                            <input type="text" placeholder="Transaction Hash" value={walletOrHash} onChange={(e) => setWalletOrHash(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-black outline-none focus:border-tyrex-ultra-gold-glow transition-all" />
                            <button onClick={handleDepositSubmit} disabled={loading} className="w-full bg-tyrex-ultra-gold-glow text-black py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : 'Confirm Payment'}</button>
                        </div>
                    </div>
                </div>
            )}
            
            <TyrexModal isOpen={resultModal.isOpen} title={resultModal.title} message={resultModal.message} actionText="OK" onAction={() => setResultModal(prev => ({ ...prev, isOpen: false }))} onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
};

export default DashboardScreen;