import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../api/tyrexApi';
import { fmtUsd, fmtInt } from '../../lib/format';
import { Surface, InfoRow, Skeleton, Button, EmptyState, SectionHeader, notify } from '../../ui';

interface Stats {
    totalUsers: number; totalDepositedUsd: number; totalWithdrawnUsd: number; totalStakedUsd: number;
    totalWalletUsd: number; totalPendingUsd: number; totalLiabilityUsd: number;
    activeCardsCount: number; pendingDeposits: number; pendingWithdrawals: number;
}

const Tile: React.FC<{ label: string; value: string; onClick?: () => void; accent?: boolean }> = ({ label, value, onClick, accent }) => {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag onClick={onClick} className="bg-surface rounded-card p-3 text-left min-h-[72px] active:opacity-80">
            <span className="block text-caption text-muted">{label}</span>
            <span className={`block text-headline tabular-nums mt-1 ${accent ? 'text-link' : 'text-fg'}`}>{value}</span>
        </Tag>
    );
};

/** Обзор: цифры дня; число заявок ведёт в «Заявки» */
const OverviewTab: React.FC<{ onOpenRequests: (kind: 'DEPOSIT' | 'WITHDRAWAL') => void }> = ({ onOpenRequests }) => {
    const { t } = useTranslation('admin2');
    const [stats, setStats] = useState<Stats | null>(null);
    const [failed, setFailed] = useState(false);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let alive = true;
        adminApi.getStats()
            .then(d => { if (alive) { setStats(d as Stats); setFailed(false); } })
            .catch(e => { if (alive) { setFailed(true); notify.error(e); } });
        return () => { alive = false; };
    }, [reload]);

    if (failed && !stats) {
        return <EmptyState icon={<AlertTriangle className="w-6 h-6" aria-hidden />} text={t('loadError')} action={{ label: t('retry'), onClick: () => setReload(r => r + 1) }} />;
    }
    if (!stats) {
        return (
            <div className="grid grid-cols-2 gap-2" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-card" />)}
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-2 gap-2">
                <Tile label={t('overview.users')} value={fmtInt(stats.totalUsers)} />
                <Tile label={t('overview.activeCards')} value={fmtInt(stats.activeCardsCount)} />
                <Tile label={t('overview.pendingDeposits')} value={fmtInt(stats.pendingDeposits)} accent={stats.pendingDeposits > 0} onClick={() => onOpenRequests('DEPOSIT')} />
                <Tile label={t('overview.pendingWithdrawals')} value={fmtInt(stats.pendingWithdrawals)} accent={stats.pendingWithdrawals > 0} onClick={() => onOpenRequests('WITHDRAWAL')} />
                <Tile label={t('overview.deposited')} value={fmtUsd(stats.totalDepositedUsd)} />
                <Tile label={t('overview.withdrawn')} value={fmtUsd(stats.totalWithdrawnUsd)} />
            </div>

            <SectionHeader title={t('overview.liabilities')} />
            <Surface className="px-4 divide-y divide-line/60">
                <InfoRow label={t('overview.wallets')} value={fmtUsd(stats.totalWalletUsd)} />
                <InfoRow label={t('overview.staked')} value={fmtUsd(stats.totalStakedUsd)} />
                <InfoRow label={t('overview.pending')} value={fmtUsd(stats.totalPendingUsd)} />
                <InfoRow label={<span className="text-fg font-semibold">{t('overview.total')}</span>} value={<span className="font-semibold">{fmtUsd(stats.totalLiabilityUsd)}</span>} />
            </Surface>
            <p className="text-callout text-muted mt-2">{t('overview.liabilitiesNote')}</p>

            <Button variant="text" className="mt-3 px-0" icon={<RefreshCw className="w-4 h-4" aria-hidden />} onClick={() => setReload(r => r + 1)}>{t('refresh')}</Button>
        </div>
    );
};

export default OverviewTab;
