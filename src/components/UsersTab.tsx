// src/components/UsersTab.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, User, Ban, CheckCircle, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { adminApi } from '../api/tyrexApi';
import { showAlert, showConfirm, haptic } from '../lib/telegram';
import { errorText } from '../lib/i18nHelpers';
import { fmtUsd, fmtDate, fmtDateTime } from '../lib/format';

/** Decimal128 ({$numberDecimal}) / строка / число → число */
const num = (v: unknown): number => {
    if (v && typeof v === 'object' && '$numberDecimal' in (v as Record<string, unknown>)) {
        return parseFloat(String((v as Record<string, unknown>).$numberDecimal)) || 0;
    }
    const n = parseFloat(String(v ?? ''));
    return Number.isFinite(n) ? n : 0;
};

type Balance = Partial<Record<'walletUsd' | 'stakingUsd' | 'pendingWithdrawalUsd' | 'totalProfitUsd', unknown>>;

interface AdminUser {
    _id: string;
    username?: string;
    tgId: number;
    role?: string;
    accountStatus?: string;
    isBanned?: boolean;
    createdAt: string;
    balance?: Balance;
}

interface UserReport {
    profile?: AdminUser & { referralCode?: string; uplineUserId?: { tgId?: number } | string | null };
    cards?: { _id: string; cardTypeId?: { name?: string }; purchasePriceUsd?: unknown; status: string; isTrial?: boolean; serialNumber?: number; createdAt: string }[];
    transactions?: { _id: string; amountUsd?: unknown; txHash?: string; walletAddress?: string; status: string; createdAt: string }[];
    referrals?: { count?: number };
}

const UsersTab: React.FC = () => {
    const { t } = useTranslation('admin');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [banningUserId, setBanningUserId] = useState<string | null>(null);
    const [viewingUserReport, setViewingUserReport] = useState<string | null>(null);
    const [userReport, setUserReport] = useState<UserReport | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(currentPage, searchQuery) as { data?: AdminUser[]; pagination?: { pages?: number } };
            setUsers(data.data || []);
            setTotalPages(Math.max(1, data.pagination?.pages || 1));
        } catch (e) {
            showAlert(errorText(e));
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setSearchQuery(searchInput.trim());
    };

    const handleBanToggle = async (user: AdminUser) => {
        if (banningUserId) return;
        const ok = await showConfirm(user.isBanned ? t('users.confirmUnban') : t('users.confirmBan'));
        if (!ok) return;
        setBanningUserId(user._id);
        try {
            const response = await adminApi.banUser(user._id) as { isBanned?: boolean };
            if (typeof response.isBanned === 'boolean') {
                haptic.success();
                setUsers(prev => prev.map(u => (u._id === user._id ? { ...u, isBanned: response.isBanned } : u)));
            }
        } catch (e) {
            haptic.error();
            showAlert(errorText(e));
        } finally {
            setBanningUserId(null);
        }
    };

    const handleViewFullReport = async (userId: string) => {
        setViewingUserReport(userId);
        setUserReport(null);
        try {
            setUserReport(await adminApi.getUserFullReport(userId) as UserReport);
        } catch (e) {
            showAlert(errorText(e));
            setViewingUserReport(null);
        }
    };

    const closeUserReport = () => {
        setViewingUserReport(null);
        setUserReport(null);
    };

    const spinner = <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tyrex-ultra-gold-glow"/></div>;

    if (viewingUserReport) {
        const p = userReport?.profile;
        const upline = p?.uplineUserId;
        const uplineLabel = upline && typeof upline === 'object' ? upline.tgId ?? '—' : (upline || '—');
        const row = (label: string, value: React.ReactNode) => (
            <p className="flex justify-between gap-3"><span className="text-white/50">{label}</span><span className="text-white text-right break-all">{value}</span></p>
        );

        return (
            <div className="bg-tyrex-graphite/40 p-4 rounded-xl border border-white/5 space-y-4">
                <button onClick={closeUserReport} className="text-white/60 hover:text-white mb-2 flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1"/> {t('users.back')}
                </button>
                {!userReport ? spinner : (
                    <>
                        <h3 className="text-lg font-bold text-white mb-3 break-words">
                            {t('users.reportTitle', { user: p?.username || '—', id: p?.tgId ?? '—' })}
                        </h3>

                        <div className="space-y-1.5 text-sm">
                            {row(t('users.role'), p?.role || '—')}
                            {row(t('users.accountStatus'), p?.accountStatus || '—')}
                            {row(t('users.wallet'), fmtUsd(num(p?.balance?.walletUsd)))}
                            {row(t('users.staking'), fmtUsd(num(p?.balance?.stakingUsd)))}
                            {row(t('users.pendingPayout'), fmtUsd(num(p?.balance?.pendingWithdrawalUsd)))}
                            {row(t('users.totalProfit'), fmtUsd(num(p?.balance?.totalProfitUsd)))}
                            {row(t('users.isBanned'), p?.isBanned ? t('users.yes') : t('users.no'))}
                            {row(t('users.refCode'), p?.referralCode || '—')}
                            {row(t('users.invitedBy'), String(uplineLabel))}
                            {row(t('users.invitedCount'), userReport.referrals?.count || 0)}
                        </div>

                        <h4 className="text-md font-bold text-white mt-6 mb-2">{t('users.cards', { count: userReport.cards?.length || 0 })}</h4>
                        {!userReport.cards?.length ? (
                            <p className="text-white/50 text-sm">{t('users.noCards')}</p>
                        ) : (
                            <div className="space-y-2">
                                {userReport.cards.map(card => (
                                    <div key={card._id} className="bg-tyrex-dark-black p-2 rounded text-sm space-y-0.5">
                                        {row(t('users.cardType'), `${card.cardTypeId?.name || '—'}${card.serialNumber ? ` #${card.serialNumber}` : ''}${card.isTrial ? ` (${t('users.trial')})` : ''}`)}
                                        {row(t('users.cardPrice'), fmtUsd(num(card.purchasePriceUsd)))}
                                        {row(t('users.cardStatus'), t(`common:cardStatus.${card.status}`, { defaultValue: card.status }))}
                                        {row(t('users.cardDate'), fmtDate(card.createdAt))}
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 className="text-md font-bold text-white mt-6 mb-2">{t('users.transactions', { count: userReport.transactions?.length || 0 })}</h4>
                        {!userReport.transactions?.length ? (
                            <p className="text-white/50 text-sm">{t('users.noTransactions')}</p>
                        ) : (
                            <div className="space-y-2">
                                {userReport.transactions.map(tx => {
                                    // Депозит отличается наличием txHash, вывод — walletAddress
                                    const isDeposit = Boolean(tx.txHash);
                                    return (
                                        <div key={tx._id} className={clsx("p-2 rounded text-sm space-y-0.5", isDeposit ? "bg-green-700/20" : "bg-red-700/20")}>
                                            {row(t('users.txType'), isDeposit ? t('users.deposit') : t('users.withdrawal'))}
                                            {row(t('users.amount'), `${isDeposit ? '+' : '−'}${fmtUsd(num(tx.amountUsd))}`)}
                                            {row(t('users.status'), t(`common:status.${String(tx.status).toLowerCase()}`, { defaultValue: tx.status }))}
                                            {row(t('users.date'), fmtDateTime(tx.createdAt))}
                                            {tx.txHash && <p className="truncate text-white/50 font-mono text-xs">TxHash: {tx.txHash}</p>}
                                            {tx.walletAddress && <p className="truncate text-white/50 font-mono text-xs">{t('users.wallet_address')}: {tx.walletAddress}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
                <input
                    type="text"
                    placeholder={t('users.search')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="flex-grow min-w-0 bg-tyrex-graphite/50 text-white border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-tyrex-ultra-gold-glow"
                />
                <button type="submit" aria-label={t('users.search')} className="bg-tyrex-ultra-gold-glow text-tyrex-dark-black p-2 rounded-lg hover:opacity-90 transition-opacity">
                    <Search className="w-4 h-4" />
                </button>
            </form>

            <h3 className="text-white font-bold mb-2 flex items-center"><User className="w-4 h-4 mr-2"/> {t('users.title', { count: users.length })}</h3>
            {loading ? spinner : (
                <div className="space-y-3">
                    {users.length === 0 && <p className="text-white/30 text-sm">{t('users.empty')}</p>}
                    {users.map(user => (
                        <div key={user._id} className="bg-tyrex-graphite/40 p-3 rounded-lg flex justify-between items-center gap-2 border border-white/5">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">@{user.username || '—'}</p>
                                <p className="text-[10px] text-white/50">{t('users.rowInfo', { id: user.tgId, balance: fmtUsd(num(user.balance?.walletUsd)) })}</p>
                                <p className="text-[10px] text-white/50">{t('users.registered', { date: fmtDate(user.createdAt) })}</p>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                                <span className={clsx("text-[10px] font-bold", user.isBanned ? 'text-red-500' : 'text-green-500')}>
                                    {user.isBanned ? t('users.banned') : t('users.active')}
                                </span>
                                <button
                                    disabled={!!banningUserId}
                                    onClick={() => handleBanToggle(user)}
                                    aria-label={user.isBanned ? t('users.confirmUnban') : t('users.confirmBan')}
                                    className={clsx(
                                        "p-1.5 rounded-full text-white transition-colors disabled:opacity-50",
                                        user.isBanned ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
                                    )}
                                >
                                    {banningUserId === user._id ? <Loader2 className="w-4 h-4 animate-spin"/> : (user.isBanned ? <CheckCircle className="w-4 h-4"/> : <Ban className="w-4 h-4"/>)}
                                </button>
                                <button
                                    onClick={() => handleViewFullReport(user._id)}
                                    className="text-[10px] bg-blue-700 px-3 py-1.5 rounded text-white hover:bg-blue-600 font-bold"
                                >
                                    {t('users.report')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                        aria-label={t('common:actions.back')}
                        className="p-2 rounded-full bg-tyrex-graphite/50 text-white/60 hover:text-white disabled:opacity-50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-white/70">{t('users.page', { page: currentPage, pages: totalPages })}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || loading}
                        aria-label={t('common:actions.next')}
                        className="p-2 rounded-full bg-tyrex-graphite/50 text-white/60 hover:text-white disabled:opacity-50"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default UsersTab;
