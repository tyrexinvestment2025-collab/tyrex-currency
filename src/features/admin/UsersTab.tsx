import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, User, Users, AlertTriangle, ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import { adminApi, type ApiJson } from '../../api/tyrexApi';
import { fmtUsd, fmtDate, fmtDateTime } from '../../lib/format';
import { showConfirm } from '../../lib/telegram';
import { List, ListRow, Surface, Sheet, InfoRow, Badge, CardStatusBadge, OperationStatusBadge, EmptyState, SkeletonRows, Button, SectionHeader, notify, type CardStatus, type OperationStatus } from '../../ui';
import { num } from './adminUtils';

interface AdminUser {
    _id: string; username?: string; tgId: number; role: string; isBanned?: boolean; createdAt: string;
    accountStatus?: string; balance?: Record<string, ApiJson>;
}
interface Report { profile: ApiJson; cards: ApiJson[]; transactions: ApiJson[]; referrals: { count: number } }

const label = (u: { username?: string; tgId?: number }) => (u.username ? `@${u.username}` : `ID ${u.tgId}`);

/** Лист пользователя: балансы, карты, транзакции; бан/разбан */
const UserSheet: React.FC<{ userId: string | null; onClose: () => void; onChanged: () => void }> = ({ userId, onClose, onChanged }) => {
    const { t } = useTranslation('admin2');
    const [report, setReport] = useState<Report | null>(null);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        if (!userId) return;
        let alive = true;
        adminApi.getUserFullReport(userId)
            .then(d => { if (alive) { setReport(d as Report); setFailed(false); } })
            .catch(e => { if (alive) { setFailed(true); notify.error(e); } });
        return () => { alive = false; setReport(null); };
    }, [userId, reload]);

    const p = report?.profile;
    const toggleBan = async () => {
        if (!p) return;
        const text = p.isBanned ? t('users.confirmUnban', { user: label(p) }) : t('users.confirmBan', { user: label(p) });
        if (!(await showConfirm(text))) return;
        setBusy(true);
        try {
            const r = await adminApi.banUser(p._id);
            notify.success(r?.isBanned ? t('users.banned') : t('users.unbanned'));
            setReload(x => x + 1);
            onChanged();
        } catch (e) {
            notify.error(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Sheet open={Boolean(userId)} onClose={onClose} title={p ? label(p) : t('users.title')}>
            {failed && !report ? (
                <EmptyState icon={<AlertTriangle className="w-6 h-6" aria-hidden />} text={t('loadError')} action={{ label: t('retry'), onClick: () => setReload(x => x + 1) }} />
            ) : !report || !p ? (
                <SkeletonRows rows={4} />
            ) : (
                <>
                    <div className="flex flex-wrap gap-1.5">
                        <Badge tone="neutral">ID {p.tgId}</Badge>
                        {p.role === 'ADMIN' && <Badge tone="accent">{t('users.admin')}</Badge>}
                        {p.isBanned && <Badge tone="negative" icon={<Ban className="w-3.5 h-3.5" aria-hidden />}>{t('users.bannedBadge')}</Badge>}
                        {p.accountStatus && <Badge tone="info">{t(`users.status.${p.accountStatus}`, { defaultValue: p.accountStatus })}</Badge>}
                    </div>

                    <Surface className="px-4 mt-3 divide-y divide-line/60">
                        <InfoRow label={t('users.wallet')} value={fmtUsd(num(p.balance?.walletUsd))} />
                        <InfoRow label={t('users.staking')} value={fmtUsd(num(p.balance?.stakingUsd))} />
                        <InfoRow label={t('users.pending')} value={fmtUsd(num(p.balance?.pendingWithdrawalUsd))} />
                        <InfoRow label={t('users.totalProfit')} value={fmtUsd(num(p.balance?.totalProfitUsd))} />
                        <InfoRow label={t('users.deposited')} value={fmtUsd(num(p.totalDepositedUsd))} />
                        <InfoRow label={t('users.referralSats')} value={`${(num(p.balance?.referralSats) + num(p.balance?.walletSats)).toLocaleString()} sat`} />
                        <InfoRow label={t('users.referrals')} value={report.referrals?.count ?? 0} />
                        <InfoRow label={t('users.registered')} value={fmtDate(p.createdAt)} />
                    </Surface>

                    <SectionHeader title={t('users.cards', { count: report.cards.length })} />
                    {report.cards.length === 0 ? (
                        <p className="text-callout text-muted">{t('users.noCards')}</p>
                    ) : (
                        <List>
                            {report.cards.map(c => (
                                <ListRow
                                    key={c._id}
                                    title={`${c.cardTypeId?.name || '—'} #${c.serialNumber}`}
                                    subtitle={fmtDate(c.createdAt)}
                                    value={c.isTrial ? t('users.gift') : fmtUsd(num(c.purchasePriceUsd))}
                                    valueSub={<CardStatusBadge status={c.status as CardStatus} unlockAt={c.unlockAt} isTrial={c.isTrial} />}
                                />
                            ))}
                        </List>
                    )}

                    <SectionHeader title={t('users.transactions')} />
                    {report.transactions.length === 0 ? (
                        <p className="text-callout text-muted">{t('users.noTransactions')}</p>
                    ) : (
                        <List>
                            {report.transactions.map(tx => {
                                const isDeposit = Boolean(tx.txHash) || !tx.walletAddress;
                                return (
                                    <ListRow
                                        key={tx._id}
                                        title={isDeposit ? t('requests.deposit') : t('requests.withdrawal')}
                                        subtitle={<>{fmtDateTime(tx.createdAt)}{tx.adminComment && <span className="block">{tx.adminComment}</span>}</>}
                                        value={`${isDeposit ? '+' : '−'}${fmtUsd(num(tx.amountUsd))}`}
                                        valueSub={<OperationStatusBadge status={tx.status as OperationStatus} kind={isDeposit ? 'DEPOSIT' : 'WITHDRAWAL'} />}
                                    />
                                );
                            })}
                        </List>
                    )}

                    <div className="mt-6 flex justify-center">
                        <Button variant={p.isBanned ? 'text' : 'danger'} loading={busy} onClick={toggleBan}>
                            {p.isBanned ? t('users.unban') : t('users.ban')}
                        </Button>
                    </div>
                </>
            )}
        </Sheet>
    );
};

/** Пользователи: поиск по нику/ID, пагинация */
const UsersTab: React.FC = () => {
    const { t } = useTranslation('admin2');
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<{ users: AdminUser[]; pages: number; total: number } | null>(null);
    const [failed, setFailed] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let alive = true;
        adminApi.getUsers(page, search)
            .then(r => { if (alive) { setData({ users: r?.data || [], pages: r?.pagination?.pages || 1, total: r?.pagination?.total || 0 }); setFailed(false); } })
            .catch(e => { if (alive) { setFailed(true); notify.error(e); } });
        return () => { alive = false; };
    }, [page, search, reload]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setSearch(query.trim());
    };

    return (
        <div>
            <form onSubmit={submit} className="flex items-center gap-2 bg-surface rounded-control px-3 h-12 mb-3">
                <Search className="w-5 h-5 text-muted shrink-0" aria-hidden />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('users.searchPlaceholder')}
                    aria-label={t('users.searchPlaceholder')}
                    enterKeyHint="search"
                    className="flex-1 min-w-0 bg-transparent outline-none text-body text-fg placeholder:text-muted/60"
                />
                <Button size="sm" variant="text" type="submit">{t('users.find')}</Button>
            </form>

            {failed && !data ? (
                <EmptyState icon={<AlertTriangle className="w-6 h-6" aria-hidden />} text={t('loadError')} action={{ label: t('retry'), onClick: () => setReload(x => x + 1) }} />
            ) : !data ? (
                <SkeletonRows rows={5} />
            ) : data.users.length === 0 ? (
                <Surface><EmptyState icon={<Users className="w-6 h-6" aria-hidden />} text={t('users.empty')} /></Surface>
            ) : (
                <>
                    <p className="text-caption text-muted mb-2">{t('users.total', { count: data.total })}</p>
                    <List>
                        {data.users.map(u => (
                            <ListRow
                                key={u._id}
                                icon={<User className="w-5 h-5" aria-hidden />}
                                title={label(u)}
                                subtitle={`ID ${u.tgId} · ${fmtDate(u.createdAt)}`}
                                value={fmtUsd(num(u.balance?.walletUsd))}
                                valueSub={u.isBanned
                                    ? <Badge tone="negative">{t('users.bannedBadge')}</Badge>
                                    : u.role === 'ADMIN' ? <Badge tone="accent">{t('users.admin')}</Badge> : undefined}
                                onClick={() => setOpenId(u._id)}
                            />
                        ))}
                    </List>
                    {data.pages > 1 && (
                        <div className="flex items-center justify-between mt-3">
                            <Button size="sm" variant="secondary" disabled={page <= 1} icon={<ChevronLeft className="w-4 h-4" aria-hidden />} onClick={() => setPage(p => p - 1)}>{t('users.prev')}</Button>
                            <span className="text-callout text-muted tabular-nums">{t('users.page', { page, pages: data.pages })}</span>
                            <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>
                                {t('users.next')} <ChevronRight className="w-4 h-4 inline" aria-hidden />
                            </Button>
                        </div>
                    )}
                </>
            )}

            <UserSheet userId={openId} onClose={() => setOpenId(null)} onChanged={() => setReload(x => x + 1)} />
        </div>
    );
};

export default UsersTab;
