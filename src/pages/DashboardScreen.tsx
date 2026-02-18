import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram'; 
import { useTyrexStore } from '../store/useTyrexStore';
import { userApi } from '../api/tyrexApi';
import { 
    Copy, X, Loader2, Bell, Plus, 
    ArrowUpRight, ArrowRightLeft, History, 
    Clock, CheckCircle, XCircle, Info, MessageCircle, ChevronRight
} from 'lucide-react';
import TyrexModal from '../components/common/TyrexModal';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_WALLET_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; 
const SATS_IN_BTC = 100000000;

// --- Вспомогательные иконки для истории ---
const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
        case 'CONFIRMED': 
        case 'PROCESSED': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return null;
    }
};

// --- КОМПОНЕНТ: ДЕТАЛЬНОЕ ОКНО ТРАНЗАКЦИИ (ЧЕК) ---
const TransactionDetailModal = ({ tx, onClose }: { tx: any, onClose: () => void }) => {
    if (!tx) return null;
    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Скопировано!");
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#1a1a1b] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/5 rounded-full"><X className="w-4 h-4 text-white/50"/></button>
                <div className="text-center mb-6">
                    <div className={clsx("w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4", 
                        tx.type === 'DEPOSIT' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                        {tx.type === 'DEPOSIT' ? <Plus className="w-8 h-8" /> : <ArrowUpRight className="w-8 h-8" />}
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic">{tx.type === 'DEPOSIT' ? 'Депозит' : 'Вывод'}</h3>
                </div>
                <div className="space-y-4">
                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase font-black mb-1">Сумма</p>
                        <p className={clsx("text-2xl font-black italic", tx.type === 'DEPOSIT' ? "text-green-400" : "text-white")}>
                            {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </p>
                    </div>

                    {/* ОПИСАНИЕ (КОММЕНТАРИЙ АДМИНА) */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                         <p className="text-[8px] text-white/30 uppercase font-black mb-1">Описание / Статус</p>
                         <p className={clsx("text-xs font-bold", tx.status === 'REJECTED' ? "text-red-400" : "text-white/70")}>
                            {tx.adminComment || (tx.status === 'PENDING' ? "Ожидает проверки" : "Операция успешно завершена")}
                         </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <p className="text-[8px] text-white/30 uppercase font-black mb-1">Статус</p>
                            <div className="flex items-center space-x-1">
                                <StatusIcon status={tx.status} />
                                <span className="text-[9px] text-white font-bold">{tx.status}</span>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <p className="text-[8px] text-white/30 uppercase font-black mb-1">Дата</p>
                            <p className="text-[9px] text-white font-bold">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* КНОПКА ПОДДЕРЖКИ ПРИ ОТКАЗЕ */}
                    {tx.status === 'REJECTED' && (
                        <button 
                            onClick={() => window.open('https://t.me/tyrex_support')}
                            className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center space-x-2 text-red-400 font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Поддержка</span>
                        </button>
                    )}

                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-[8px] text-white/30 uppercase font-black mb-1">{tx.type === 'DEPOSIT' ? 'TxHash (ID)' : 'Адрес кошелька'}</p>
                        <div onClick={() => copyText(tx.meta)} className="flex items-center justify-between cursor-pointer active:opacity-50 overflow-hidden">
                            <p className="text-[9px] text-tyrex-ultra-gold-glow font-mono truncate mr-2">{tx.meta}</p>
                            <Copy className="w-3 h-3 text-white/30 shrink-0"/>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="w-full mt-6 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white/40">Закрыть</button>
            </div>
        </div>
    );
};

// --- КОМПОНЕНТ ШАПКИ ---
const UserHeader = ({ onNotifClick, unreadCount }: { onNotifClick: () => void, unreadCount: number }) => {
    const { user } = useTelegram();
    const navigate = useNavigate();
    const userName = user?.username || 'MINER'; 

    return (
        <div className="p-4 pt-6 flex justify-between items-center bg-tyrex-dark-black">
            <div className="flex items-center space-x-3 cursor-pointer active:opacity-70 transition-opacity" onClick={() => navigate('/profile')}>
                <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold border border-white/10">
                    {userName[0]?.toUpperCase()}
                </div>
                <div>
                    <p className="text-xs text-white/60 leading-none mb-1">Welcome back,</p>
                    <p className="text-lg font-bold text-tyrex-ultra-gold-glow leading-tight tracking-wide">@{userName}</p>
                </div>
            </div>
            <button onClick={onNotifClick} className="p-2 bg-tyrex-graphite/40 rounded-full relative active:scale-90 transition-all">
                <Bell className="w-5 h-5 text-white/70" />
                {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-tyrex-dark-black animate-pulse" />}
            </button>
        </div>
    );
};

// --- КАРТОЧКА БАЛАНСА ---
const TotalBalanceCard: React.FC = () => {
    const { balance } = useTyrexStore();
    const { totalBTC, walletUsd, referralSats, stakingBTC } = balance;
    return (
        <div id="balance-card" className="p-4 pt-2">
            <div className="bg-gradient-to-br from-[#FFD700] to-[#E6B800] p-5 rounded-[24px] shadow-2xl relative overflow-hidden ring-1 ring-white/20">
                <div className="flex justify-between items-start mb-5 relative z-10 text-black">
                    <div><p className="text-[11px] font-extrabold opacity-70 uppercase tracking-widest">Общий капитал (BTC)</p></div>
                    <div className="flex flex-col items-end">
                         <div className="bg-black/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                            <span className="text-sm font-extrabold tabular-nums">${walletUsd.toFixed(2)}</span>
                         </div>
                         <span className="text-[10px] font-semibold opacity-60 mt-1 uppercase">Доступно USD</span>
                    </div>
                </div>
                <h2 className="text-[40px] font-black text-black leading-none mb-6 tracking-tighter relative z-10">{totalBTC.toFixed(8)}</h2>
                <div className="flex gap-3 relative z-10 text-black font-bold">
                    <div className="flex-1 bg-black/10 p-3 rounded-xl border border-black/5"><p className="text-[10px] opacity-70 uppercase mb-1">В майнинге</p><p className="text-sm">{stakingBTC.toFixed(8)}</p></div>
                    <div className="flex-1 bg-black/10 p-3 rounded-xl border border-black/5"><p className="text-[10px] opacity-70 uppercase mb-1">Рефералы</p><p className="text-sm">{(referralSats / SATS_IN_BTC).toFixed(8)}</p></div>
                </div>
            </div>
        </div>
    );
};

// --- ГЛАВНЫЙ ЭКРАН ---
const DashboardScreen: React.FC = () => {
    const { tg, refreshAllData } = useTelegram();
    const { simulateDailyInterest, balance } = useTyrexStore();
    
    // Состояния модалок
    const [isDepositOpen, setDepositOpen] = useState(false);
    const [isWithdrawOpen, setWithdrawOpen] = useState(false);
    const [isHistoryOpen, setHistoryOpen] = useState(false);
    const [isNotifOpen, setNotifOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

    // Данные
    const [amount, setAmount] = useState('');
    const [walletOrHash, setWalletOrHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // Уведомления
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [criticalAlert, setCriticalAlert] = useState<any>(null);

    const [resultModal, setResultModal] = useState({ isOpen: false, title: '', message: '', isError: false });

    useEffect(() => {
        if (tg) tg.ready();
        initDashboard();
        const intv = setInterval(() => { 
            simulateDailyInterest(); 
            fetchNotifications(); 
            loadHistorySilently();
        }, 30000); 
        return () => clearInterval(intv);
    }, []);

    const initDashboard = async () => {
        fetchNotifications();
        loadHistorySilently();
    };

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
            
            const badNews = data.find((n: any) => !n.isRead && (n.title.includes('Rejected') || n.title.includes('Failed')));
            if (badNews) setCriticalAlert(badNews);
        } catch (e) { console.error(e); }
    };

    const handleOpenNotif = async () => {
        setNotifOpen(true);
        if (unreadCount > 0) {
            await userApi.markNotificationsRead();
            setUnreadCount(0);
        }
    };

    const onAmountChange = (val: string) => {
        const filtered = val.replace(/[^0-9.]/g, '');
        if ((filtered.match(/\./g) || []).length > 1) return;
        setAmount(filtered);
    };

    const handleAction = async (method: any) => {
        setLoading(true);
        try {
            await method();
            setDepositOpen(false); setWithdrawOpen(false);
            setResultModal({ isOpen: true, title: 'Успех', message: 'Заявка отправлена на модерацию.', isError: false });
            setAmount(''); setWalletOrHash('');
            loadHistorySilently();
        } catch (error: any) {
            setResultModal({ isOpen: true, title: 'Ошибка', message: error.message, isError: true });
        } finally { setLoading(false); refreshAllData(); }
    };

    return (
        <div className="min-h-screen bg-tyrex-dark-black font-sans pb-28 relative text-white">
            
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

            <UserHeader onNotifClick={handleOpenNotif} unreadCount={unreadCount} />

            <TotalBalanceCard />
            
            <div className="flex justify-around px-4 pt-2 pb-6">
                <button onClick={() => setDepositOpen(true)} className="flex flex-col items-center space-y-2 w-1/4 active:scale-95 transition-transform group">
                    <div className="p-3.5 rounded-2xl shadow-lg border border-white/5 bg-[#6D28D9] flex items-center justify-center group-active:bg-[#5b21b6]"><Plus className="w-6 h-6 text-white"/></div>
                    <span className="text-[11px] font-medium text-white/70 uppercase">Пополнить</span>
                </button>
                <button onClick={() => setWithdrawOpen(true)} className="flex flex-col items-center space-y-2 w-1/4 active:scale-95 transition-transform group">
                    <div className="p-3.5 rounded-2xl shadow-lg border border-white/5 bg-[#6D28D9] flex items-center justify-center group-active:bg-[#5b21b6]"><ArrowUpRight className="w-6 h-6 text-white"/></div>
                    <span className="text-[11px] font-medium text-white/70 uppercase">Вывести</span>
                </button>
                <button className="flex flex-col items-center space-y-2 w-1/4 opacity-30 cursor-not-allowed">
                    <div className="p-3.5 rounded-2xl shadow-lg border border-white/5 bg-[#6D28D9] flex items-center justify-center"><ArrowRightLeft className="w-6 h-6 text-white"/></div>
                    <span className="text-[11px] font-medium text-white/70 uppercase">Перевод</span>
                </button>
                <button onClick={() => setHistoryOpen(true)} className="flex flex-col items-center space-y-2 w-1/4 active:scale-95 transition-transform group">
                    <div className="p-3.5 rounded-2xl shadow-lg border border-white/5 bg-[#6D28D9] flex items-center justify-center group-active:bg-[#5b21b6]"><History className="w-6 h-6 text-white"/></div>
                    <span className="text-[11px] font-medium text-white/70 uppercase">История</span>
                </button>
            </div>

            <div className="px-5 mb-4 flex justify-between items-end">
                <h3 className="text-sm font-black uppercase italic tracking-widest text-white/80">Последние операции</h3>
                <button onClick={() => setHistoryOpen(true)} className="text-[10px] font-bold text-tyrex-ultra-gold-glow uppercase flex items-center">
                    Все <ChevronRight className="w-3 h-3 ml-0.5"/>
                </button>
            </div>
            
            <div className="px-4 space-y-2 mb-10">
                {history.length === 0 ? (
                    <div className="p-8 text-center bg-white/[0.02] rounded-3xl border border-white/5">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Нет недавних транзакций</p>
                    </div>
                ) : (
                    history.slice(0, 3).map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedTransaction(item)}
                            className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center active:bg-white/10 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center space-x-3">
                                <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center", 
                                    item.type === 'DEPOSIT' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                    {item.type === 'DEPOSIT' ? <Plus className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">{item.type === 'DEPOSIT' ? 'Пополнение' : 'Вывод'}</p>
                                    <p className="text-[10px] text-white/40">{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={clsx("text-sm font-black", item.type === 'DEPOSIT' ? "text-green-400" : "text-white")}>
                                    {item.type === 'DEPOSIT' ? '+' : '-'}${item.amount.toFixed(2)}
                                </p>
                                <div className="flex items-center justify-end space-x-1 mt-0.5">
                                    <StatusIcon status={item.status} />
                                    <span className="text-[8px] font-bold text-white/30 uppercase">{item.status}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {isNotifOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#121213] border border-white/10 w-full max-w-sm rounded-[2rem] flex flex-col max-h-[70vh] relative shadow-2xl">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-lg font-black uppercase italic tracking-widest text-tyrex-ultra-gold-glow">Уведомления</h3>
                                <button onClick={() => setNotifOpen(false)} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="overflow-y-auto p-4 space-y-3">
                                {notifications.length === 0 ? <p className="text-center py-10 opacity-30 text-xs">Нет сообщений</p> : notifications.map((n: any) => (
                                    <div key={n._id} className={clsx("p-4 rounded-2xl border", n.isRead ? "bg-white/[0.02] border-white/5 opacity-40" : "bg-white/[0.05] border-white/10 shadow-lg")}>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Info className="w-3 h-3 text-tyrex-ultra-gold-glow" />
                                            <span className="text-[10px] font-black uppercase text-white">{n.title}</span>
                                        </div>
                                        <p className="text-[11px] text-white/50 leading-relaxed">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {isHistoryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-tyrex-graphite w-full max-w-sm rounded-2xl flex flex-col max-h-[80vh] border border-white/10 shadow-2xl relative">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">История транзакций</h3>
                            <button onClick={() => setHistoryOpen(false)} className="text-white/50 p-2"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {history.length === 0 ? <p className="text-center py-10 opacity-30 text-xs">Транзакций нет</p> : history.map((item) => (
                                <div key={item.id} onClick={() => setSelectedTransaction(item)} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center active:bg-white/10 transition-colors cursor-pointer">
                                    <div><p className="text-sm font-bold text-white">{item.type === 'DEPOSIT' ? 'Пополнение' : 'Вывод'}</p><p className="text-[10px] text-white/40">{new Date(item.date).toLocaleDateString()}</p></div>
                                    <div className="text-right"><p className={clsx("text-sm font-black", item.type === 'DEPOSIT' ? "text-green-400" : "text-red-400")}>${item.amount.toFixed(2)}</p><StatusIcon status={item.status} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectedTransaction && <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}

            {isDepositOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-tyrex-graphite w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative">
                        <button onClick={() => setDepositOpen(false)} className="absolute top-4 right-4 text-white/50"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2"><Plus className="text-green-500" /> <span>Пополнение</span></h3>
                        <div className="mb-4 bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                            <p className="text-xs text-white/50 mb-1 font-bold">Адрес (USDT TRC20):</p>
                            <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg" onClick={() => {navigator.clipboard.writeText(ADMIN_WALLET_ADDRESS); alert("Copied!");}}>
                                <code className="text-[10px] text-tyrex-ultra-gold-glow break-all mr-2">{ADMIN_WALLET_ADDRESS}</code>
                                <Copy className="w-4 h-4 text-white"/>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <input type="text" inputMode="decimal" placeholder="Сумма (USD)" value={amount} onChange={(e) => onAmountChange(e.target.value)} className="w-full bg-tyrex-dark-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-tyrex-ultra-gold-glow"/>
                            <input type="text" placeholder="TxHash" value={walletOrHash} onChange={(e) => setWalletOrHash(e.target.value)} className="w-full bg-tyrex-dark-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-tyrex-ultra-gold-glow"/>
                            <button onClick={() => handleAction(() => userApi.requestDeposit(Number(amount), walletOrHash))} disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl flex justify-center active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Я перевел средства'}</button>
                        </div>
                    </div>
                </div>
            )}

            {isWithdrawOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-tyrex-graphite w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative">
                        <button onClick={() => setWithdrawOpen(false)} className="absolute top-4 right-4 text-white/50"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2"><ArrowUpRight className="text-red-500" /> <span>Вывод средств</span></h3>
                        <p className="text-center text-sm text-white/50 mb-4 font-bold uppercase tracking-widest">Баланс: <span className="text-green-400">${balance.walletUsd.toFixed(2)}</span></p>
                        <div className="space-y-4">
                            <input type="text" inputMode="decimal" placeholder="Сумма (USD)" value={amount} onChange={(e) => onAmountChange(e.target.value)} className="w-full bg-tyrex-dark-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-tyrex-ultra-gold-glow"/>
                            <input type="text" placeholder="Адрес (TRC20)" value={walletOrHash} onChange={(e) => setWalletOrHash(e.target.value)} className="w-full bg-tyrex-dark-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-tyrex-ultra-gold-glow"/>
                            <button onClick={() => handleAction(() => userApi.requestWithdrawal(Number(amount), walletOrHash))} disabled={loading} className="w-full bg-tyrex-ultra-gold-glow text-black font-black py-3 rounded-xl flex justify-center active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Запросить вывод'}</button>
                        </div>
                    </div>
                </div>
            )}

            <TyrexModal isOpen={resultModal.isOpen} title={resultModal.title} message={resultModal.message} actionText="OK" onAction={() => setResultModal(prev => ({ ...prev, isOpen: false }))} onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
};

export default DashboardScreen;