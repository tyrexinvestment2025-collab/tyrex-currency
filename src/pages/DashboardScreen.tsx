import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Copy, X, Loader2, Bell, Plus, Minus,
    ArrowUpRight, History, Clock, CheckCircle,
    XCircle, Info, MessageCircle,
    ArrowDown, Users, Zap
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { useTyrexStore } from '../store/useTyrexStore';
import { useSession } from '../store/useSession';
import { userApi } from '../api/tyrexApi';
import TyrexModal from '../components/common/TyrexModal';
import TrialActivationModal from '../components/onboarding/TrialActivationModal';
import { fmtUsd, fmtDate, fmtDateTime, usdToBtc, satsToBtc, fmtPct } from '../lib/format';
import { showAlert, copyText, haptic, openLink } from '../lib/telegram';
import { errorText, notificationText } from '../lib/i18nHelpers';

// Заглушка: реальный адрес приходит с бэка (config.depositBtcAddress) и задаётся в .env
const FALLBACK_DEPOSIT_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
const SUPPORT_URL = 'https://t.me/tyrex_support';
const TRC20_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const BTC_TXID_RE = /^[a-fA-F0-9]{64}$/;

type TxType = 'DEPOSIT' | 'WITHDRAWAL';
type TxStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSED' | 'REJECTED';

interface HistoryItem {
    id: string;
    type: TxType;
    amount: number;
    status: TxStatus;
    date: string;
    meta?: string;
    adminComment?: string | null;
}

interface NotificationItem {
    _id: string;
    key?: string;
    params?: Record<string, unknown>;
    title: string;
    message: string;
    isRead: boolean;
    createdAt?: string;
}

const CRITICAL_KEYS = ['deposit_rejected', 'withdrawal_rejected'];
const isCritical = (n: NotificationItem) =>
    !n.isRead && (n.key ? CRITICAL_KEYS.includes(n.key) : /Rejected|Failed/i.test(n.title || ''));

const parsePct = (v: unknown) => {
    const n = parseFloat(String(v ?? '').replace('%', ''));
    return Number.isFinite(n) ? n : 0;
};

// --- Статус транзакции ---
const StatusIcon = ({ status }: { status: TxStatus }) => {
    switch (status) {
        case 'PENDING': return <Clock size={12} className="text-amber-500" />;
        case 'CONFIRMED':
        case 'PROCESSED': return <CheckCircle size={12} className="text-emerald-500" />;
        case 'REJECTED': return <XCircle size={12} className="text-rose-500" />;
        default: return null;
    }
};

const useTxLabels = () => {
    const { t } = useTranslation('dashboard');
    return {
        typeLabel: (tx: HistoryItem) => t(`tx.type.${tx.type}`, { defaultValue: tx.type }),
        statusLabel: (s: TxStatus) => t(`tx.status.${s}`, { defaultValue: s }),
    };
};

/** Сумма со знаком: депозит +, вывод −, отклонённое — без знака и зачёркнуто */
const TxAmount = ({ tx, className }: { tx: HistoryItem; className?: string }) => {
    const rejected = tx.status === 'REJECTED';
    const sign = rejected ? '' : tx.type === 'DEPOSIT' ? '+' : '−';
    return (
        <span className={clsx(
            'font-mono font-bold tabular-nums',
            rejected ? 'text-white/30 line-through' : tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-white',
            className
        )}>
            {sign}{fmtUsd(tx.amount)}
        </span>
    );
};

const DashboardScreen: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();
    const { refreshAllData, user } = useTelegram();
    const { balance, btcPrice, cards, userProfile, isPriceLive, marketCardTypes } = useTyrexStore();
    const config = useSession(s => s.config);
    const depositAddress = config.depositBtcAddress || FALLBACK_DEPOSIT_ADDRESS;
    const minWithdrawal = config.minWithdrawalUsd ?? 10;

    const [isDepositOpen, setDepositOpen] = useState(false);
    const [isWithdrawOpen, setWithdrawOpen] = useState(false);
    const [isHistoryOpen, setHistoryOpen] = useState(false);
    const [isNotifOpen, setNotifOpen] = useState(false);
    const [isTrialOpen, setTrialOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<HistoryItem | null>(null);

    // Раздельные состояния: хэш депозита больше не подставляется в адрес вывода
    const [depositAmount, setDepositAmount] = useState('');
    const [depositHash, setDepositHash] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawWallet, setWithdrawWallet] = useState('');

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [criticalAlert, setCriticalAlert] = useState<NotificationItem | null>(null);
    const [resultModal, setResultModal] = useState({ isOpen: false, title: '', message: '' });

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const hasPrice = btcPrice > 0 && isPriceLive;

    const loadHistory = useCallback(async () => {
        try {
            const data = await userApi.getHistory();
            if (Array.isArray(data)) setHistory(data as HistoryItem[]);
        } catch (e) { console.error(e); }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await userApi.getNotifications();
            if (!Array.isArray(data)) return;
            const list = data as NotificationItem[];
            setNotifications(list);
            const alertItem = list.find(isCritical);
            if (alertItem) setCriticalAlert(alertItem);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        const tick = () => { fetchNotifications(); loadHistory(); };
        tick();
        const intv = setInterval(tick, 30000);
        return () => clearInterval(intv);
    }, [fetchNotifications, loadHistory]);

    const markAllRead = async () => {
        await userApi.markNotificationsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const submitDeposit = async () => {
        const amount = Number(depositAmount);
        const hash = depositHash.trim();
        if (!(amount > 0)) return showAlert(t('errors:INVALID_AMOUNT'));
        if (!BTC_TXID_RE.test(hash)) return showAlert(t('errors:INVALID_TX_HASH'));

        setLoading(true);
        try {
            await userApi.requestDeposit(amount, hash.toLowerCase());
            haptic.success();
            setDepositOpen(false);
            setDepositAmount(''); setDepositHash('');
            setResultModal({ isOpen: true, title: t('deposit.successTitle'), message: t('deposit.successText') });
            loadHistory();
        } catch (e) {
            haptic.error();
            showAlert(errorText(e));
        } finally { setLoading(false); }
    };

    const submitWithdraw = async () => {
        const amount = Number(withdrawAmount);
        const wallet = withdrawWallet.trim();
        if (!(amount > 0)) return showAlert(t('errors:INVALID_AMOUNT'));
        if (amount < minWithdrawal) return showAlert(t('errors:BELOW_MINIMUM', { min: minWithdrawal }));
        if (amount > balance.walletUsd) return showAlert(t('errors:INSUFFICIENT_BALANCE'));
        if (!TRC20_RE.test(wallet)) return showAlert(t('errors:INVALID_ADDRESS'));

        setLoading(true);
        try {
            await userApi.requestWithdrawal(amount, wallet);
            haptic.success();
            setWithdrawOpen(false);
            setWithdrawAmount(''); setWithdrawWallet('');
            setResultModal({ isOpen: true, title: t('withdraw.successTitle'), message: t('withdraw.successText') });
            loadHistory();
        } catch (e) {
            haptic.error();
            showAlert(errorText(e));
        } finally {
            setLoading(false);
            refreshAllData();
        }
    };

    const stats = useMemo(() => {
        const activeCards = cards.filter(c => c.status === 'Active');
        // Пробные карты не покупались (purchasePriceUsd = 0) — в активы не входят.
        // Cooling: тело уже лежит в pendingWithdrawalUsd; Finished: тело уже вернулось в кошелёк.
        const ownedCards = cards.filter(c => c.purchasePriceUsd > 0 && (c.status === 'Inactive' || c.status === 'Active'));
        const cardsUsd = ownedCards.reduce((acc, c) => acc + c.purchasePriceUsd + (c.status === 'Active' ? c.currentProfitUsd : 0), 0);
        const totalEquityUsd = balance.walletUsd + balance.pendingWithdrawalUsd + cardsUsd;
        const totalEquityBtc = usdToBtc(totalEquityUsd, btcPrice);
        const dailyProfitBtc = activeCards.reduce((acc, c) => acc + (c.nominalBtc * (c.clientAPY / 100) / 365), 0);

        const averageApy = activeCards.length > 0
            ? activeCards.reduce((a, b) => a + b.clientAPY, 0) / activeCards.length
            : null;

        const refApys = marketCardTypes.map(mt => parsePct(mt.referralAPY)).filter(v => v > 0);
        const refApyRange = refApys.length
            ? (Math.min(...refApys) === Math.max(...refApys)
                ? fmtPct(refApys[0], 1)
                : `${fmtPct(Math.min(...refApys), 1)}–${fmtPct(Math.max(...refApys), 1)}`)
            : null;

        return {
            totalEquityBtc, totalEquityUsd, dailyProfitBtc,
            averageApy, activeCount: activeCards.length,
            referralUnclaimedBtc: satsToBtc(balance.referralSats),
            refApyRange
        };
    }, [cards, balance, btcPrice, marketCardTypes]);

    const username = user?.username;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans pb-32 relative overflow-hidden">

            <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[100%] h-[40%] bg-[#FDB931] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

            <AnimatePresence>
                {criticalAlert && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl">
                        <div className="relative z-10 bg-[#121212] border border-rose-500/20 w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl">
                            <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">{notificationText(criticalAlert).title}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">{notificationText(criticalAlert).message}</p>
                            <button onClick={() => { setCriticalAlert(null); markAllRead(); refreshAllData(); }}
                                className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-xs active:scale-95 transition-all">OK</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Кнопка подарка (только для тех, кто ещё не получил) */}
            {userProfile && !userProfile.isTrialActivated && (
                <motion.button
                    initial={{ y: 0 }} animate={{ y: [-12, 0, -12] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    onClick={() => setTrialOpen(true)}
                    aria-label={t('gift')}
                    className="fixed bottom-28 right-6 z-[100] bg-gradient-to-r from-[#FFB700] to-[#FF7000] p-4 rounded-full shadow-[0_0_40px_rgba(255,183,0,0.4)] border-2 border-white/20 active:scale-90 transition-all"
                >
                    <Zap size={24} className="text-black fill-black" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-[8px] font-black px-2 py-1 rounded-full animate-pulse text-white uppercase tracking-tighter">{t('gift')}</span>
                </motion.button>
            )}

            <TrialActivationModal isOpen={isTrialOpen} onClose={() => setTrialOpen(false)} />

            {/* --- HEADER --- */}
            <header className="px-6 pt-8 flex justify-between items-center gap-3">
                <div onClick={() => navigate('/profile')} className="flex items-center space-x-3 cursor-pointer active:opacity-60 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-white/[0.03] border border-white/[0.08] rounded-full flex items-center justify-center shadow-inner">
                        <span className="text-tyrex-ultra-gold-glow font-bold">{(username?.[0] || user?.first_name?.[0] || 'T').toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-200 truncate">{username ? `@${username}` : (user?.first_name || t('defaultName'))}</span>
                </div>
                <button
                    onClick={() => { setNotifOpen(true); if (unreadCount > 0) markAllRead(); }}
                    aria-label={t('notifications.title')}
                    className="relative p-2.5 bg-white/[0.03] rounded-full border border-white/[0.08] active:scale-90 transition-all shrink-0"
                >
                    <Bell size={20} className="text-white/70" />
                    {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]" />}
                </button>
            </header>

            <main className="mt-10 space-y-10">

                {/* --- БАЛАНС --- */}
                <section className="px-8 flex flex-col items-center text-center relative">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">{t('totalAssets')}</p>

                    <div className={clsx("transition-all duration-700", !hasPrice && "blur-xl opacity-30 scale-90 pointer-events-none")}>
                        <h1 className="text-[42px] font-mono font-bold tracking-tighter leading-none mb-3 text-white flex items-center justify-center">
                            <span className="text-tyrex-ultra-gold-glow mr-3">₿</span>
                            {stats.totalEquityBtc.toFixed(8)}
                        </h1>
                        <p className="text-[17px] font-medium text-slate-500 mb-8 tabular-nums tracking-tight">
                            <span className="opacity-20 font-sans mr-1">≈</span>
                            {fmtUsd(stats.totalEquityUsd)}
                        </p>
                    </div>

                    {!hasPrice && (
                        <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center space-y-2">
                            <Loader2 className="animate-spin text-tyrex-ultra-gold-glow w-8 h-8" />
                            <span className="text-[10px] font-black text-[#FFB700] uppercase tracking-widest animate-pulse">{t('common:app.priceSyncing')}</span>
                        </div>
                    )}

                    <div className="bg-white/[0.03] border border-white/[0.08] px-6 py-3 rounded-full flex items-center space-x-4 shadow-xl">
                        <div className="flex items-center space-x-2">
                            <span className="text-emerald-500 font-mono font-bold text-[13px]">+{stats.dailyProfitBtc.toFixed(8)}</span>
                            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">{t('perDay')}</span>
                        </div>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <div className="flex items-center space-x-2">
                            <span className="text-slate-200 font-mono font-bold text-[13px]">{fmtUsd(balance.totalProfitUsd)}</span>
                            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">{t('allTime')}</span>
                        </div>
                    </div>
                </section>

                {/* --- ДЕЙСТВИЯ --- */}
                <section className="px-8 flex justify-center space-x-10">
                    <QuickAction icon={ArrowDown} label={t('actions.deposit')} onClick={() => setDepositOpen(true)} accent />
                    <QuickAction icon={ArrowUpRight} label={t('actions.withdraw')} onClick={() => setWithdrawOpen(true)} />
                    <QuickAction icon={History} label={t('actions.history')} onClick={() => setHistoryOpen(true)} />
                </section>

                {/* --- ДОХОД --- */}
                <section className="px-6 grid grid-cols-2 gap-4">
                    <div
                        onClick={() => navigate('/collection')}
                        className="bg-gradient-to-br from-[#111] to-[#080808] border border-white/[0.08] rounded-[2.2rem] p-5 shadow-xl active:scale-[0.98] transition-all cursor-pointer min-w-0"
                    >
                        <div className="flex justify-between items-center mb-6 gap-2">
                            <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest truncate">{t('mining.title')}</h3>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center shrink-0">
                                <Zap size={10} className="mr-1" /> {stats.averageApy !== null ? fmtPct(stats.averageApy, 1) : '—'}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t('mining.power')}</p>
                            <p className="text-lg font-bold text-white leading-none">{t('mining.nodes', { count: stats.activeCount })}</p>

                            <div className="pt-4">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('mining.estRevenue')}</p>
                                <p className="text-[10px] font-mono font-bold text-emerald-400">
                                    +{stats.dailyProfitBtc.toFixed(8)} <span className="opacity-50 font-sans text-[8px]">{t('perDay')}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/referral')}
                        className="bg-gradient-to-br from-[#12111a] to-[#0a080f] border border-purple-500/10 rounded-[2.2rem] p-5 shadow-xl active:scale-[0.98] transition-all cursor-pointer min-w-0"
                    >
                        <div className="flex justify-between items-center mb-6 gap-2">
                            <h3 className="text-[10px] font-bold text-purple-300 uppercase tracking-widest truncate">{t('partners.title')}</h3>
                            {stats.refApyRange && (
                                <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center shrink-0">
                                    <Users size={10} className="mr-1" /> {stats.refApyRange}
                                </span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t('partners.unclaimed')}</p>
                            <p className="text-lg font-bold text-white leading-none">₿ {stats.referralUnclaimedBtc.toFixed(6)}</p>
                            <div className="pt-4">
                                <p className="text-[10px] font-bold text-purple-400/80">{t('partners.open')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- ПОСЛЕДНИЕ ОПЕРАЦИИ --- */}
                <section className="px-6 space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('feed.title')}</h3>
                        <button onClick={() => setHistoryOpen(true)} className="text-[11px] font-bold text-tyrex-ultra-gold-glow hover:opacity-70 transition-opacity">{t('feed.all')}</button>
                    </div>

                    <div className="space-y-4">
                        {history.length === 0 && (
                            <p className="text-center text-[11px] text-white/30 font-bold uppercase py-6">{t('feed.empty')}</p>
                        )}
                        {history.slice(0, 3).map((item) => (
                            <TxRow key={item.id} tx={item} onClick={() => setSelectedTransaction(item)} />
                        ))}
                    </div>
                </section>
            </main>

            {/* --- МОДАЛКИ --- */}
            {selectedTransaction && <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
            <AnimatePresence>{isNotifOpen && <NotifModal notifications={notifications} onClose={() => setNotifOpen(false)} />}</AnimatePresence>

            <HistoryModal
                isOpen={isHistoryOpen}
                history={history}
                onClose={() => setHistoryOpen(false)}
                onSelect={(tx) => { setSelectedTransaction(tx); setHistoryOpen(false); }}
            />

            <DepositModal
                isOpen={isDepositOpen}
                onClose={() => setDepositOpen(false)}
                address={depositAddress}
                amount={depositAmount}
                setAmount={setDepositAmount}
                hash={depositHash}
                setHash={setDepositHash}
                onSubmit={submitDeposit}
                loading={loading}
            />

            <WithdrawModal
                isOpen={isWithdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                amount={withdrawAmount}
                setAmount={setWithdrawAmount}
                wallet={withdrawWallet}
                setWallet={setWithdrawWallet}
                onSubmit={submitWithdraw}
                balance={balance.walletUsd}
                minWithdrawal={minWithdrawal}
                loading={loading}
            />

            <TyrexModal
                isOpen={resultModal.isOpen}
                title={resultModal.title}
                message={resultModal.message}
                onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

// --- ПОДКОМПОНЕНТЫ ---

interface QuickActionProps { icon: React.ElementType; label: string; onClick: () => void; accent?: boolean }
const QuickAction = ({ icon: Icon, label, onClick, accent = false }: QuickActionProps) => (
    <button onClick={onClick} className="flex flex-col items-center space-y-2 cursor-pointer group active:opacity-60">
        <div className={clsx("w-14 h-14 rounded-full flex items-center justify-center border transition-all", accent ? "bg-tyrex-ultra-gold-glow text-black border-transparent shadow-lg shadow-amber-500/10" : "bg-white/[0.05] border-white/10 text-white/50")}>
            <Icon size={24} strokeWidth={accent ? 3 : 2} />
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </button>
);

const TxRow = ({ tx, onClick }: { tx: HistoryItem; onClick: () => void }) => {
    const { typeLabel, statusLabel } = useTxLabels();
    const isDeposit = tx.type === 'DEPOSIT';
    return (
        <div
            onClick={onClick}
            className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-[2.2rem] flex justify-between items-center gap-3 active:bg-white/[0.04] transition-all cursor-pointer"
        >
            <div className="flex items-center space-x-4 min-w-0">
                <div className={clsx(
                    "w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center shadow-lg",
                    tx.status === 'REJECTED' ? "text-rose-400 bg-rose-500/10" : isDeposit ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"
                )}>
                    {isDeposit ? <Plus size={20} /> : <Minus size={20} />}
                </div>
                <div className="min-w-0">
                    <p className="text-[14px] font-bold text-white/90 uppercase tracking-tighter truncate">{typeLabel(tx)}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-1 tracking-widest">{fmtDate(tx.date)}</p>
                </div>
            </div>
            <div className="text-right shrink-0">
                <TxAmount tx={tx} className="text-[15px] block mb-1" />
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-white/40">
                    <StatusIcon status={tx.status} /> {statusLabel(tx.status)}
                </span>
            </div>
        </div>
    );
};

const NotifModal = ({ notifications, onClose }: { notifications: NotificationItem[]; onClose: () => void }) => {
    const { t } = useTranslation('dashboard');
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#121213] border border-white/10 w-full max-w-sm rounded-[3rem] flex flex-col max-h-[70vh] relative shadow-2xl p-8">
                <button onClick={onClose} aria-label={t('common:actions.close')} className="absolute top-8 right-8 p-2 bg-white/5 rounded-full"><X size={16} className="text-slate-500" /></button>
                <h3 className="text-xl font-bold uppercase mb-8 tracking-tight pr-10">{t('notifications.title')}</h3>
                <div className="overflow-y-auto space-y-4">
                    {notifications.length === 0 ? <p className="text-center py-10 opacity-30 text-xs font-bold uppercase">{t('notifications.empty')}</p> : notifications.map((n) => {
                        const { title, message } = notificationText(n);
                        return (
                            <div key={n._id} className="p-5 rounded-3xl border border-white/5 bg-white/[0.02]">
                                <div className="flex items-center space-x-2 mb-2"><Info size={14} className="text-tyrex-ultra-gold-glow shrink-0" /><span className="text-[11px] font-bold uppercase text-white">{title}</span></div>
                                <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
                                {n.createdAt && <p className="text-[9px] text-white/20 mt-2">{fmtDateTime(n.createdAt)}</p>}
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

const HistoryModal = ({ isOpen, history, onClose, onSelect }: { isOpen: boolean; history: HistoryItem[]; onClose: () => void; onSelect: (tx: HistoryItem) => void }) => {
    const { t } = useTranslation('dashboard');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
            <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[3rem] flex flex-col max-h-[85vh] shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-bold uppercase tracking-tighter font-sans">{t('history.title')}</h3>
                    <button onClick={onClose} aria-label={t('common:actions.close')} className="p-2 bg-white/5 rounded-full active:scale-90 transition-all"><X size={18}/></button>
                </div>
                <div className="overflow-y-auto p-5 space-y-3">
                    {history.length === 0 && <p className="text-center py-10 opacity-30 text-xs font-bold uppercase">{t('feed.empty')}</p>}
                    {history.map((item) => <TxRow key={item.id} tx={item} onClick={() => onSelect(item)} />)}
                </div>
            </div>
        </div>
    );
};

interface DepositModalProps {
    isOpen: boolean; onClose: () => void; address: string;
    amount: string; setAmount: (v: string) => void;
    hash: string; setHash: (v: string) => void;
    onSubmit: () => void; loading: boolean;
}
const DepositModal = ({ isOpen, onClose, address, amount, setAmount, hash, setHash, onSubmit, loading }: DepositModalProps) => {
    const { t } = useTranslation('dashboard');
    const [copied, setCopied] = useState(false);
    if (!isOpen) return null;
    const hashInvalid = hash.length > 0 && !BTC_TXID_RE.test(hash.trim());
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/98 p-4 backdrop-blur-3xl">
            <div className="bg-[#0A0A0B] w-full max-w-sm rounded-[3rem] p-7 border border-white/[0.08] relative shadow-2xl max-h-[92vh] overflow-y-auto">
                <button onClick={onClose} aria-label={t('common:actions.close')} className="absolute top-7 right-7 p-2 bg-white/5 rounded-full"><X size={18} className="text-slate-500" /></button>
                <h3 className="text-2xl font-bold uppercase mb-3 tracking-tight text-white pr-10">{t('deposit.title')}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-6">{t('deposit.howTo')}</p>
                <div className="bg-black/60 p-6 rounded-[2rem] border border-white/[0.05] mb-6 text-center space-y-4 shadow-inner">
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em]">{t('deposit.address')}</p>
                    <code className="text-xs text-tyrex-ultra-gold-glow block break-all font-mono opacity-90 select-all">{address}</code>
                    <button
                        onClick={async () => { if (await copyText(address)) { haptic.tap(); setCopied(true); setTimeout(() => setCopied(false), 1500); } }}
                        className="mx-auto flex items-center space-x-2 bg-white/5 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase text-slate-400 active:scale-95 transition-all"
                    >
                        <Copy size={14}/><span>{copied ? t('common:actions.copied') : t('deposit.copyAddress')}</span>
                    </button>
                </div>
                <div className="space-y-4">
                    <input type="text" inputMode="decimal" placeholder={t('deposit.amountPlaceholder')} value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))} className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-black outline-none focus:border-tyrex-ultra-gold-glow transition-all text-lg shadow-inner" />
                    <div>
                        <input type="text" placeholder={t('deposit.hashPlaceholder')} value={hash} onChange={(e) => setHash(e.target.value.trim())} className={clsx("w-full bg-black border rounded-2xl p-5 text-white font-bold outline-none transition-all shadow-inner font-mono text-xs", hashInvalid ? "border-rose-500/60" : "border-white/10 focus:border-tyrex-ultra-gold-glow")} />
                        {hashInvalid && <p className="text-[10px] text-rose-400 mt-2 px-2">{t('errors:INVALID_TX_HASH')}</p>}
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed px-1">{t('deposit.manualNote')}</p>
                    <button onClick={onSubmit} disabled={loading} className="w-full bg-tyrex-ultra-gold-glow text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 shadow-yellow-500/10 border-t border-white/40 disabled:opacity-60">{loading ? <Loader2 className="animate-spin w-6 h-6 mx-auto"/> : t('deposit.submit')}</button>
                </div>
            </div>
        </div>
    );
};

interface WithdrawModalProps {
    isOpen: boolean; onClose: () => void;
    amount: string; setAmount: (v: string) => void;
    wallet: string; setWallet: (v: string) => void;
    onSubmit: () => void; balance: number; minWithdrawal: number; loading: boolean;
}
const WithdrawModal = ({ isOpen, onClose, amount, setAmount, wallet, setWallet, onSubmit, balance, minWithdrawal, loading }: WithdrawModalProps) => {
    const { t } = useTranslation('dashboard');
    if (!isOpen) return null;
    const amountNum = Number(amount);
    const amountError = amount === '' ? null
        : !(amountNum > 0) ? t('errors:INVALID_AMOUNT')
        : amountNum < minWithdrawal ? t('errors:BELOW_MINIMUM', { min: minWithdrawal })
        : amountNum > balance ? t('errors:INSUFFICIENT_BALANCE')
        : null;
    const walletError = wallet.length > 0 && !TRC20_RE.test(wallet.trim()) ? t('errors:INVALID_ADDRESS') : null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/98 p-4 backdrop-blur-3xl">
            <div className="bg-[#0A0A0B] w-full max-w-sm rounded-[3rem] p-7 border border-white/[0.08] relative shadow-2xl max-h-[92vh] overflow-y-auto">
                <button onClick={onClose} aria-label={t('common:actions.close')} className="absolute top-7 right-7 p-2 bg-white/5 rounded-full"><X size={18} className="text-slate-500" /></button>
                <h3 className="text-2xl font-bold uppercase mb-3 tracking-tight text-white pr-10">{t('withdraw.title')}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{t('withdraw.howTo')}</p>
                <div className="flex justify-between text-xs mb-6 px-1">
                    <span className="text-slate-500">{t('withdraw.available')}: <button onClick={() => setAmount(balance.toFixed(2))} className="text-emerald-400 font-bold underline decoration-dotted">{fmtUsd(balance)}</button></span>
                    <span className="text-slate-500">{t('withdraw.minimum')}: <span className="text-white/70 font-bold">{fmtUsd(minWithdrawal)}</span></span>
                </div>
                <div className="space-y-4">
                    <div>
                        <input type="text" inputMode="decimal" placeholder={t('withdraw.amountPlaceholder')} value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))} className={clsx("w-full bg-black border rounded-2xl p-5 text-white font-bold outline-none transition-all shadow-inner", amountError ? "border-rose-500/60" : "border-white/10 focus:border-tyrex-ultra-gold-glow")} />
                        {amountError && <p className="text-[10px] text-rose-400 mt-2 px-2">{amountError}</p>}
                    </div>
                    <div>
                        <input type="text" placeholder={t('withdraw.walletPlaceholder')} value={wallet} onChange={(e) => setWallet(e.target.value.trim())} className={clsx("w-full bg-black border rounded-2xl p-5 text-white font-bold outline-none transition-all shadow-inner font-mono text-xs", walletError ? "border-rose-500/60" : "border-white/10 focus:border-tyrex-ultra-gold-glow")} />
                        {walletError && <p className="text-[10px] text-rose-400 mt-2 px-2">{walletError}</p>}
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed px-1">{t('withdraw.manualNote')}</p>
                    <button onClick={onSubmit} disabled={loading} className="w-full bg-tyrex-ultra-gold-glow text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 shadow-yellow-500/10 border-t border-white/40 disabled:opacity-60">{loading ? <Loader2 className="animate-spin w-6 h-6 mx-auto"/> : t('withdraw.submit')}</button>
                </div>
            </div>
        </div>
    );
};

const TransactionDetailModal = ({ tx, onClose }: { tx: HistoryItem; onClose: () => void }) => {
    const { t } = useTranslation('dashboard');
    const { typeLabel, statusLabel } = useTxLabels();
    const isDeposit = tx.type === 'DEPOSIT';
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4">
            <div className="bg-[#080808] border border-white/10 w-full max-w-sm rounded-[3rem] p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
                <button onClick={onClose} aria-label={t('common:actions.close')} className="absolute top-7 right-7 p-2 bg-white/5 rounded-full"><X className="w-4 h-4 text-white/30"/></button>
                <div className="text-center mb-8">
                    <div className={clsx("w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-2xl", isDeposit ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500")}>
                        {isDeposit ? <Plus size={36} /> : <Minus size={36} />}
                    </div>
                    <h3 className="text-[26px] font-black text-white uppercase tracking-tighter leading-none">{typeLabel(tx)}</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-3">{fmtDateTime(tx.date)}</p>
                </div>
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-[#1a1a1c] to-black rounded-[2rem] p-6 text-center border border-white/5 shadow-inner">
                        <p className="text-[11px] text-white/30 uppercase font-black mb-2 tracking-widest inline-flex items-center gap-1.5">
                            <StatusIcon status={tx.status} />
                            <span className={tx.status === 'REJECTED' ? 'text-red-500' : tx.status === 'PENDING' ? 'text-amber-400' : 'text-green-500'}>{statusLabel(tx.status)}</span>
                        </p>
                        <p className="text-[36px] tracking-tighter"><TxAmount tx={tx} /></p>
                        {tx.status === 'PENDING' && <p className="text-[10px] text-white/40 mt-2">{t('tx.pendingNote')}</p>}
                    </div>
                    {tx.meta && (
                        <div className="bg-white/[0.02] rounded-[1.5rem] p-4 border border-white/5">
                            <p className="text-[9px] text-white/30 font-black mb-2 uppercase tracking-widest">{isDeposit ? t('tx.hash') : t('tx.wallet')}</p>
                            <p className="text-[11px] font-mono text-white/70 break-all select-all">{tx.meta}</p>
                        </div>
                    )}
                    {tx.adminComment && (
                        <div className="bg-white/[0.02] rounded-[1.5rem] p-4 border border-white/5">
                            <p className="text-[9px] text-white/30 font-black mb-2 uppercase tracking-widest">{t('tx.adminComment')}</p>
                            <p className="text-[12px] leading-relaxed text-white/70">{tx.adminComment}</p>
                        </div>
                    )}
                    <button
                        onClick={() => openLink(SUPPORT_URL)}
                        className="w-full py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all"
                    >
                        <MessageCircle className="w-5 h-5 text-tyrex-ultra-gold-glow"/><span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{t('tx.support')}</span>
                    </button>
                </div>
                <button onClick={onClose} className="w-full mt-6 py-4 bg-white/5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-white/40 active:text-white transition-all">{t('common:actions.close')}</button>
            </div>
        </div>
    );
};

export default DashboardScreen;
