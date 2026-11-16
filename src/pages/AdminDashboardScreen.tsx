import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Shield, Users, ArrowDownCircle, ArrowUpCircle,
    Loader2, RefreshCw, Wallet, LayoutGrid, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { adminApi } from '../api/tyrexApi';
import UsersTab from '../components/UsersTab';
import { showAlert, showConfirm, haptic } from '../lib/telegram';
import { errorText } from '../lib/i18nHelpers';
import { fmtUsd, fmtInt } from '../lib/format';

type TabType = 'STATS' | 'FINANCE' | 'USERS';

interface AdminStats {
    totalUsers: number;
    totalDepositedUsd: number;
    totalWithdrawnUsd: number;
    totalStakedUsd: number;
    totalWalletUsd: number;
    totalPendingUsd: number;
    totalLiabilityUsd: number;
    activeCardsCount: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
}

interface RequestUser { username?: string; tgId?: number | string; balance?: { walletUsd?: unknown } }
interface FinanceRequest {
    _id: string;
    amountUsd: unknown;
    txHash?: string;
    walletAddress?: string;
    userId?: RequestUser | null;
}

/** Decimal128 / строка / число → число */
const num = (v: unknown): number => {
    if (v && typeof v === 'object' && '$numberDecimal' in (v as Record<string, unknown>)) {
        return parseFloat(String((v as Record<string, unknown>).$numberDecimal)) || 0;
    }
    const n = parseFloat(String(v ?? ''));
    return Number.isFinite(n) ? n : 0;
};

const StatCard: React.FC<{ label: string; value: React.ReactNode; icon?: LucideIcon; accent?: string }> = ({ label, value, icon: Icon, accent }) => (
    <div className="bg-tyrex-graphite/50 p-3 rounded-xl border border-white/5 min-w-0">
        <div className="text-white/50 text-xs mb-1 flex items-center">{Icon && <Icon className="w-3.5 h-3.5 mr-1 shrink-0" />} <span className="truncate">{label}</span></div>
        <div className={clsx("text-lg font-bold truncate", accent || 'text-white')}>{value}</div>
    </div>
);

// =========================================================
// Модалка: причина отказа (window.prompt в Telegram не работает)
// =========================================================
const RejectModal: React.FC<{ onCancel: () => void; onSubmit: (reason: string) => void; busy: boolean }> = ({ onCancel, onSubmit, busy }) => {
    const { t } = useTranslation('admin');
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 z-[500] bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={busy ? undefined : onCancel}>
            <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-white">{t('finance.rejectTitle')}</h3>
                    <button onClick={onCancel} disabled={busy} aria-label={t('common:actions.close')} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <label className="text-xs text-white/60 block mb-1">{t('finance.rejectReason')}</label>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value.slice(0, 500))}
                    placeholder={t('finance.rejectPlaceholder')}
                    rows={3}
                    autoFocus
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-tyrex-ultra-gold-glow resize-none"
                />
                <div className="flex gap-2 mt-3">
                    <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 text-sm font-bold">
                        {t('common:actions.cancel')}
                    </button>
                    <button
                        onClick={() => onSubmit(reason.trim() || t('finance.rejectDefault'))}
                        disabled={busy}
                        className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-sm font-bold flex items-center justify-center disabled:opacity-60"
                    >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t('finance.rejectSubmit')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// =========================================================
// Вкладка: ФИНАНСЫ
// =========================================================
const FinanceTab: React.FC = () => {
    const { t } = useTranslation('admin');
    const [deposits, setDeposits] = useState<FinanceRequest[]>([]);
    const [withdrawals, setWithdrawals] = useState<FinanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<{ id: string; type: 'DEP' | 'WD' } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [deps, wds] = await Promise.all([
                adminApi.getPendingDeposits(),
                adminApi.getPendingWithdrawals()
            ]);
            setDeposits(Array.isArray(deps) ? deps : []);
            setWithdrawals(Array.isArray(wds) ? wds : []);
        } catch (e) {
            showAlert(errorText(e));
        } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const removeItem = (id: string, type: 'DEP' | 'WD') => {
        if (type === 'DEP') setDeposits(prev => prev.filter(d => d._id !== id));
        else setWithdrawals(prev => prev.filter(w => w._id !== id));
    };

    const handleApprove = async (item: FinanceRequest, type: 'DEP' | 'WD') => {
        if (processingId) return;
        const params = { amount: fmtUsd(num(item.amountUsd)), user: item.userId?.username || t('finance.unknownUser') };
        const ok = await showConfirm(type === 'DEP' ? t('finance.confirmAccept', params) : t('finance.confirmPaid', params));
        if (!ok) return;

        setProcessingId(item._id);
        try {
            if (type === 'DEP') await adminApi.confirmDeposit(item._id);
            else await adminApi.processWithdrawal(item._id);
            haptic.success();
            removeItem(item._id, type);
        } catch (e) {
            haptic.error();
            await showAlert(errorText(e));
            loadData(); // заявка могла уже обработаться — синхронизируемся
        } finally { setProcessingId(null); }
    };

    const handleReject = async (reason: string) => {
        if (!rejecting || processingId) return;
        const { id, type } = rejecting;
        setProcessingId(id);
        try {
            if (type === 'DEP') await adminApi.rejectDeposit(id, reason);
            else await adminApi.rejectWithdrawal(id, reason);
            haptic.success();
            removeItem(id, type);
            setRejecting(null);
        } catch (e) {
            haptic.error();
            await showAlert(errorText(e));
            setRejecting(null);
            loadData();
        } finally { setProcessingId(null); }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tyrex-ultra-gold-glow"/></div>;

    const renderItem = (item: FinanceRequest, type: 'DEP' | 'WD') => {
        const busy = processingId === item._id;
        return (
            <div key={item._id} className={clsx("bg-tyrex-graphite/40 p-3 rounded-lg flex justify-between items-center gap-2 border", type === 'DEP' ? 'border-green-500/10' : 'border-red-500/10')}>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">@{item.userId?.username || t('finance.unknownUser')}</p>
                    {type === 'DEP'
                        ? <p className="text-[10px] text-white/50">ID: {item.userId?.tgId ?? '—'}</p>
                        : <p className="text-[10px] text-white/50">{t('finance.balance', { amount: fmtUsd(num(item.userId?.balance?.walletUsd)) })}</p>}
                    <p className="text-xs text-white/50 w-32 truncate mt-1 font-mono" title={type === 'DEP' ? item.txHash : item.walletAddress}>
                        {type === 'DEP' ? item.txHash : item.walletAddress}
                    </p>
                </div>
                <div className="text-right flex flex-col items-end shrink-0">
                    <p className={clsx("font-mono text-sm font-bold", type === 'DEP' ? 'text-green-400' : 'text-red-400')}>
                        {type === 'DEP' ? '+' : '−'}{fmtUsd(num(item.amountUsd))}
                    </p>
                    <div className="flex space-x-1 mt-2">
                        <button
                            disabled={!!processingId}
                            onClick={() => handleApprove(item, type)}
                            className={clsx("text-[10px] px-3 py-1.5 rounded text-white font-bold disabled:opacity-50 min-w-[64px] flex justify-center", type === 'DEP' ? 'bg-green-700 hover:bg-green-600' : 'bg-blue-700 hover:bg-blue-600')}
                        >
                            {busy && !rejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : (type === 'DEP' ? t('finance.accept') : t('finance.paid'))}
                        </button>
                        <button
                            disabled={!!processingId}
                            onClick={() => setRejecting({ id: item._id, type })}
                            className="text-[10px] bg-red-900 px-3 py-1.5 rounded text-white hover:bg-red-800 font-bold disabled:opacity-50"
                        >
                            {t('finance.reject')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-green-400 font-bold mb-2 flex items-center"><ArrowDownCircle className="w-4 h-4 mr-2"/> {t('finance.incoming', { count: deposits.length })}</h3>
                <div className="space-y-2">
                    {deposits.length === 0 && <p className="text-white/30 text-sm">{t('finance.empty')}</p>}
                    {deposits.map(d => renderItem(d, 'DEP'))}
                </div>
            </div>

            <div>
                <h3 className="text-red-400 font-bold mb-2 flex items-center"><ArrowUpCircle className="w-4 h-4 mr-2"/> {t('finance.outgoing', { count: withdrawals.length })}</h3>
                <div className="space-y-2">
                    {withdrawals.length === 0 && <p className="text-white/30 text-sm">{t('finance.empty')}</p>}
                    {withdrawals.map(w => renderItem(w, 'WD'))}
                </div>
            </div>

            {rejecting && (
                <RejectModal
                    busy={processingId === rejecting.id}
                    onCancel={() => { if (!processingId) setRejecting(null); }}
                    onSubmit={handleReject}
                />
            )}
        </div>
    );
};

// =========================================================
// Вкладка: ОБЗОР
// =========================================================
const StatsTab: React.FC = () => {
    const { t } = useTranslation('admin');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setStats(await adminApi.getStats() as AdminStats);
        } catch (e) {
            setError(errorText(e));
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    if (loading && !stats) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tyrex-ultra-gold-glow"/></div>;
    if (error) {
        return (
            <div className="text-center p-6">
                <p className="text-white/60 text-sm mb-3">{t('stats.loadError')}: {error}</p>
                <button onClick={load} className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">{t('common:actions.retry')}</button>
            </div>
        );
    }
    if (!stats) return null;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <StatCard label={t('stats.totalUsers')} value={fmtInt(stats.totalUsers)} icon={Users} />
                <StatCard label={t('stats.activeCards')} value={fmtInt(stats.activeCardsCount)} icon={RefreshCw} />
                <StatCard label={t('stats.deposited')} value={fmtUsd(stats.totalDepositedUsd)} icon={ArrowDownCircle} accent="text-green-400" />
                <StatCard label={t('stats.withdrawn')} value={fmtUsd(stats.totalWithdrawnUsd)} icon={ArrowUpCircle} accent="text-red-400" />
                <StatCard label={t('stats.pendingDeposits')} value={fmtInt(stats.pendingDeposits)} />
                <StatCard label={t('stats.pendingWithdrawals')} value={fmtInt(stats.pendingWithdrawals)} />
            </div>
            <div className="bg-tyrex-graphite/30 rounded-xl border border-white/5 p-3 space-y-2 text-sm">
                {([
                    ['stats.wallets', stats.totalWalletUsd],
                    ['stats.staked', stats.totalStakedUsd],
                    ['stats.pending', stats.totalPendingUsd],
                ] as const).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                        <span className="text-white/60">{t(key)}</span>
                        <span className="font-mono text-white">{fmtUsd(val)}</span>
                    </div>
                ))}
                <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
                    <span className="text-white">{t('stats.liability')}</span>
                    <span className="font-mono text-tyrex-ultra-gold-glow">{fmtUsd(stats.totalLiabilityUsd)}</span>
                </div>
            </div>
            <button onClick={load} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-white/5 py-2 rounded-xl text-xs text-white/60 disabled:opacity-50">
                <RefreshCw className={clsx("w-3.5 h-3.5", loading && 'animate-spin')} /> {t('common:actions.retry')}
            </button>
        </div>
    );
};

// =========================================================
// ОСНОВНОЙ КОМПОНЕНТ
// =========================================================
const AdminDashboardScreen: React.FC = () => {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('STATS');

    const tabs: { id: TabType; label: string; icon: LucideIcon }[] = [
        { id: 'STATS', label: t('tabs.stats'), icon: LayoutGrid },
        { id: 'FINANCE', label: t('tabs.finance'), icon: Wallet },
        { id: 'USERS', label: t('tabs.users'), icon: Users },
    ];

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white p-4 pb-24">
            <div className="flex justify-between items-center mb-6 pt-4">
                <div className="flex items-center space-x-2">
                    <Shield className="text-tyrex-ultra-gold-glow w-6 h-6" />
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                </div>
                <button onClick={() => navigate('/profile')} className="text-sm text-white/50 hover:text-white">{t('exit')}</button>
            </div>

            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={clsx("flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                            activeTab === tab.id ? "bg-tyrex-ultra-gold-glow text-tyrex-dark-black" : "bg-tyrex-graphite/50 text-white/60 hover:bg-tyrex-graphite")}>
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="animate-fade-in">
                {activeTab === 'STATS' && <StatsTab />}
                {activeTab === 'FINANCE' && <FinanceTab />}
                {activeTab === 'USERS' && <UsersTab />}
            </div>
        </div>
    );
};

export default AdminDashboardScreen;
