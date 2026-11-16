import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, ArrowUpFromLine, Receipt } from 'lucide-react';
import { Page, ScreenTitle, Surface, Button, Segmented, List, SkeletonRows, EmptyState, BackLink, useMoney } from '../ui';
import { OperationRow, type Operation } from '../features/operations/OperationRow';
import { usePortfolio } from '../features/portfolio/usePortfolio';
import DepositSheet from '../features/wallet/DepositSheet';
import WithdrawSheet from '../features/wallet/WithdrawSheet';
import OperationDetailsSheet from '../features/wallet/OperationDetailsSheet';
import { userApi } from '../api/tyrexApi';
import { useSession } from '../store/useSession';
import { fmtDate } from '../lib/format';

type Filter = 'all' | 'deposit' | 'withdrawal' | 'income';

const FILTER_TYPE: Record<Exclude<Filter, 'all'>, Operation['type']> = {
    deposit: 'DEPOSIT',
    withdrawal: 'WITHDRAWAL',
    income: 'INCOME',
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Кошелёк: где мои деньги и как их двигать */
const WalletScreen: React.FC = () => {
    const { t } = useTranslation('wallet');
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const { primary } = useMoney();
    const { walletUsd, pendingUsd } = usePortfolio();
    const refreshAllData = useSession(s => s.refreshAllData);

    const [ops, setOps] = useState<Operation[] | null>(null);
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');
    const [reloadKey, setReloadKey] = useState(0);

    // Листы управляются query-параметрами: ?action=deposit|withdraw, ?op=<id>
    const action = params.get('action');
    const opId = params.get('op');
    const openParam = (key: 'action' | 'op', value: string) => setParams({ [key]: value }, { replace: true });
    const closeParams = () => setParams({}, { replace: true });

    useEffect(() => {
        let alive = true;
        userApi.getHistory()
            .then(data => { if (alive) { setOps(Array.isArray(data) ? (data as Operation[]) : []); setError(false); } })
            .catch(() => { if (alive) { setError(true); setOps(prev => prev ?? []); } });
        return () => { alive = false; };
    }, [reloadKey]);

    const reload = () => {
        setReloadKey(k => k + 1);
        refreshAllData();
    };

    const filtered = useMemo(
        () => (ops || []).filter(o => filter === 'all' || o.type === FILTER_TYPE[filter]),
        [ops, filter],
    );

    // Группировка по датам: Сегодня / Вчера / дата
    const groups = useMemo(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const map = new Map<string, { label: string; items: Operation[] }>();
        for (const op of filtered) {
            const d = new Date(op.date);
            const key = dayKey(d);
            if (!map.has(key)) {
                const label = key === dayKey(today) ? t('history.today')
                    : key === dayKey(yesterday) ? t('history.yesterday')
                    : fmtDate(d, d.getFullYear() === today.getFullYear()
                        ? { day: 'numeric', month: 'long' }
                        : { day: 'numeric', month: 'long', year: 'numeric' });
                map.set(key, { label, items: [] });
            }
            map.get(key)!.items.push(op);
        }
        return [...map.values()];
    }, [filtered, t]);

    const counts = useMemo(() => {
        const list = ops || [];
        return {
            deposit: list.filter(o => o.type === 'DEPOSIT').length,
            withdrawal: list.filter(o => o.type === 'WITHDRAWAL').length,
            income: list.filter(o => o.type === 'INCOME').length,
        };
    }, [ops]);

    const selectedOp = opId && ops ? ops.find(o => String(o.id) === opId) || null : null;

    return (
        <Page>
            <BackLink onBack={() => navigate('/')} />
            <ScreenTitle>{t('title')}</ScreenTitle>

            <Surface className="p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                        <p className="text-callout text-muted">{t('balance.available')}</p>
                        <p className="text-title text-fg tabular-nums mt-1 break-words">{primary(walletUsd, { balance: true })}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-callout text-muted">{t('balance.pending')}</p>
                        <p className="text-title text-muted tabular-nums mt-1 break-words">{primary(pendingUsd, { balance: true })}</p>
                    </div>
                </div>
                {pendingUsd > 0 && <p className="text-caption text-muted mt-2">{t('balance.pendingHint')}</p>}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button icon={<ArrowDownToLine className="w-5 h-5" strokeWidth={1.75} aria-hidden />} onClick={() => openParam('action', 'deposit')}>
                        {t('actions.deposit')}
                    </Button>
                    <Button variant="secondary" icon={<ArrowUpFromLine className="w-5 h-5" strokeWidth={1.75} aria-hidden />} onClick={() => openParam('action', 'withdraw')}>
                        {t('actions.withdraw')}
                    </Button>
                </div>
            </Surface>

            <h2 className="text-headline text-fg mt-6 mb-2">{t('history.title')}</h2>
            <Segmented<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                    { value: 'all', label: t('history.filters.all') },
                    { value: 'deposit', label: t('history.filters.deposit'), count: counts.deposit || undefined },
                    { value: 'withdrawal', label: t('history.filters.withdrawal'), count: counts.withdrawal || undefined },
                    { value: 'income', label: t('history.filters.income'), count: counts.income || undefined },
                ]}
            />

            <div className="mt-3">
                {ops === null ? (
                    <SkeletonRows rows={4} />
                ) : error && ops.length === 0 ? (
                    <Surface>
                        <EmptyState
                            icon={<Receipt className="w-6 h-6" aria-hidden />}
                            text={t('history.error')}
                            action={{ label: t('common:actions.retry'), onClick: () => setReloadKey(k => k + 1) }}
                        />
                    </Surface>
                ) : groups.length === 0 ? (
                    <Surface>
                        <EmptyState
                            icon={<Receipt className="w-6 h-6" aria-hidden />}
                            text={filter === 'all' ? t('history.empty') : t('history.emptyFiltered')}
                            action={filter === 'all' ? { label: t('actions.deposit'), onClick: () => openParam('action', 'deposit') } : undefined}
                        />
                    </Surface>
                ) : (
                    <div className="space-y-4">
                        {groups.map(g => (
                            <section key={g.label}>
                                <h3 className="text-callout text-muted mb-1.5 px-1">{g.label}</h3>
                                <List>
                                    {g.items.map(op => <OperationRow key={op.id} op={op} onClick={() => openParam('op', String(op.id))} />)}
                                </List>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <DepositSheet open={action === 'deposit'} onClose={closeParams} onSubmitted={reload} />
            <WithdrawSheet open={action === 'withdraw'} onClose={closeParams} onSubmitted={reload} />
            <OperationDetailsSheet op={selectedOp} onClose={closeParams} />
        </Page>
    );
};

export default WalletScreen;
