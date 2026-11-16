import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, Copy, ExternalLink, Inbox, AlertTriangle } from 'lucide-react';
import { adminApi, type ApiJson } from '../../api/tyrexApi';
import { fmtUsd, fmtDateTime } from '../../lib/format';
import { showConfirm, copyText, openLink, haptic } from '../../lib/telegram';
import { Segmented, Surface, Button, Sheet, EmptyState, SkeletonRows, notify, cn } from '../../ui';
import { num, userLabel, explorerUrl, shortRef, type AdminRequest } from './adminUtils';

type Filter = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL';

const toRequests = (deps: ApiJson[], wds: ApiJson[]): AdminRequest[] => [
    ...deps.map(d => ({ _id: d._id, kind: 'DEPOSIT' as const, user: d.userId || {}, amountUsd: num(d.amountUsd), createdAt: d.createdAt, ref: d.txHash || '' })),
    ...wds.map(w => ({ _id: w._id, kind: 'WITHDRAWAL' as const, user: w.userId || {}, amountUsd: num(w.amountUsd), createdAt: w.createdAt, ref: w.walletAddress || '' })),
].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

/** Заявки на пополнение и вывод: подтверждение через showConfirm, отказ — с обязательной причиной */
const RequestsTab: React.FC<{ initialFilter?: Filter; onChanged?: () => void }> = ({ initialFilter = 'ALL', onChanged }) => {
    const { t } = useTranslation('admin2');
    const [filter, setFilter] = useState<Filter>(initialFilter);
    const [items, setItems] = useState<AdminRequest[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<AdminRequest | null>(null);
    const [reason, setReason] = useState('');
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let alive = true;
        Promise.all([adminApi.getPendingDeposits(), adminApi.getPendingWithdrawals()])
            .then(([d, w]) => { if (alive) { setItems(toRequests(Array.isArray(d) ? d : [], Array.isArray(w) ? w : [])); setFailed(false); } })
            .catch(e => { if (alive) { setFailed(true); notify.error(e); } });
        return () => { alive = false; };
    }, [reload]);

    const refresh = useCallback(() => { setReload(r => r + 1); onChanged?.(); }, [onChanged]);

    const approve = async (r: AdminRequest) => {
        const text = r.kind === 'DEPOSIT'
            ? t('requests.confirmDeposit', { amount: fmtUsd(r.amountUsd), user: userLabel(r.user) })
            : t('requests.confirmPayout', { amount: fmtUsd(r.amountUsd), user: userLabel(r.user) });
        if (!(await showConfirm(text))) return;
        setBusyId(r._id);
        try {
            if (r.kind === 'DEPOSIT') await adminApi.confirmDeposit(r._id);
            else await adminApi.processWithdrawal(r._id);
            notify.success(r.kind === 'DEPOSIT' ? t('requests.depositDone') : t('requests.payoutDone'));
        } catch (e) {
            notify.error(e);
        } finally {
            setBusyId(null);
            refresh();
        }
    };

    const submitReject = async () => {
        if (!rejecting || !reason.trim()) return;
        const r = rejecting;
        if (!(await showConfirm(t('requests.confirmReject', { amount: fmtUsd(r.amountUsd), user: userLabel(r.user) })))) return;
        setBusyId(r._id);
        try {
            if (r.kind === 'DEPOSIT') await adminApi.rejectDeposit(r._id, reason.trim());
            else await adminApi.rejectWithdrawal(r._id, reason.trim());
            notify.success(t('requests.rejected'));
            setRejecting(null);
            setReason('');
        } catch (e) {
            notify.error(e);
        } finally {
            setBusyId(null);
            refresh();
        }
    };

    const all = items || [];
    const visible = all.filter(r => filter === 'ALL' || r.kind === filter);
    const count = (k: Filter) => all.filter(r => k === 'ALL' || r.kind === k).length;

    return (
        <div>
            <Segmented<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                    { value: 'ALL', label: t('requests.all'), count: items ? count('ALL') : undefined },
                    { value: 'DEPOSIT', label: t('requests.deposits'), count: items ? count('DEPOSIT') : undefined },
                    { value: 'WITHDRAWAL', label: t('requests.withdrawals'), count: items ? count('WITHDRAWAL') : undefined },
                ]}
                className="mb-3"
            />

            {failed && !items ? (
                <EmptyState icon={<AlertTriangle className="w-6 h-6" aria-hidden />} text={t('loadError')} action={{ label: t('retry'), onClick: () => setReload(r => r + 1) }} />
            ) : !items ? (
                <SkeletonRows rows={3} />
            ) : visible.length === 0 ? (
                <Surface><EmptyState icon={<Inbox className="w-6 h-6" aria-hidden />} text={t('requests.empty')} /></Surface>
            ) : (
                <div className="space-y-2">
                    {visible.map(r => {
                        const url = explorerUrl(r.kind, r.ref);
                        const busy = busyId === r._id;
                        const walletUsd = r.kind === 'WITHDRAWAL' ? num(r.user.balance?.walletUsd) : null;
                        return (
                            <Surface key={r._id} className="p-3">
                                <div className="flex items-start gap-3">
                                    <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', r.kind === 'DEPOSIT' ? 'bg-positive/15 text-positive' : 'bg-info/15 text-info')}>
                                        {r.kind === 'DEPOSIT' ? <ArrowDownLeft className="w-5 h-5" aria-hidden /> : <ArrowUpRight className="w-5 h-5" aria-hidden />}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="text-body text-fg truncate">{userLabel(r.user)}</span>
                                            <span className="text-headline text-fg tabular-nums shrink-0">{fmtUsd(r.amountUsd)}</span>
                                        </div>
                                        <p className="text-caption text-muted mt-0.5">
                                            {r.kind === 'DEPOSIT' ? t('requests.deposit') : t('requests.withdrawal')} · {fmtDateTime(r.createdAt)}
                                            {walletUsd !== null && <> · {t('requests.walletBalance', { amount: fmtUsd(walletUsd) })}</>}
                                        </p>
                                        {r.ref && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="font-mono text-caption text-muted truncate" title={r.ref}>{shortRef(r.ref)}</span>
                                                <button
                                                    onClick={async () => { if (await copyText(r.ref)) { haptic.success(); notify.success(t('copied')); } }}
                                                    aria-label={t('copy')}
                                                    className="w-9 h-9 flex items-center justify-center text-muted active:opacity-60"
                                                >
                                                    <Copy className="w-4 h-4" aria-hidden />
                                                </button>
                                                {url && (
                                                    <button onClick={() => openLink(url)} aria-label={t('openExplorer')} className="w-9 h-9 flex items-center justify-center text-muted active:opacity-60">
                                                        <ExternalLink className="w-4 h-4" aria-hidden />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button size="sm" variant="danger" disabled={busyId !== null} onClick={() => { setReason(''); setRejecting(r); }}>{t('requests.reject')}</Button>
                                    <Button size="sm" loading={busy} disabled={busyId !== null && !busy} onClick={() => approve(r)}>
                                        {r.kind === 'DEPOSIT' ? t('requests.approve') : t('requests.markPaid')}
                                    </Button>
                                </div>
                            </Surface>
                        );
                    })}
                </div>
            )}

            <Sheet
                open={Boolean(rejecting)}
                onClose={() => { if (!busyId) setRejecting(null); }}
                title={rejecting?.kind === 'DEPOSIT' ? t('requests.rejectDepositTitle') : t('requests.rejectWithdrawalTitle')}
                action={{ text: t('requests.rejectAction'), onClick: submitReject, disabled: !reason.trim(), loading: Boolean(busyId) }}
            >
                {rejecting && (
                    <>
                        <p className="text-body text-fg">{userLabel(rejecting.user)} · <span className="tabular-nums">{fmtUsd(rejecting.amountUsd)}</span></p>
                        {rejecting.kind === 'WITHDRAWAL' && <p className="text-callout text-muted mt-1">{t('requests.rejectWithdrawalNote')}</p>}
                        <label htmlFor="reject-reason" className="block text-callout text-muted mt-4">{t('requests.reason')}</label>
                        <textarea
                            id="reject-reason"
                            rows={4}
                            maxLength={500}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('requests.reasonPlaceholder')}
                            className="mt-1.5 w-full bg-surface rounded-control px-4 py-3 text-body text-fg outline-none border border-transparent focus:border-accent resize-none placeholder:text-muted/60"
                        />
                        <p className="text-caption text-muted mt-1">{t('requests.reasonHint')}</p>
                    </>
                )}
            </Sheet>
        </div>
    );
};

export default RequestsTab;
