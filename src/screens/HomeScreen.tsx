import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, ArrowUpFromLine, History, Gift, X, Layers, Users, Receipt, Wallet, ChevronRight } from 'lucide-react';
import { Page, ActionButton, BalanceBlock, SectionHeader, List, SkeletonRows, EmptyState, Surface, Button, useMoney, cn } from '../ui';
import { usePortfolio } from '../features/portfolio/usePortfolio';
import ExplainSheet from '../features/portfolio/ExplainSheet';
import { OperationRow, type Operation } from '../features/operations/OperationRow';
import GiftSheet from '../features/gift/GiftSheet';
import { userApi } from '../api/tyrexApi';
import { useSession } from '../store/useSession';
import { usePrefs } from '../store/usePrefs';

/** Главная: сколько у меня и сколько это приносит */
const HomeScreen: React.FC = () => {
    const { t } = useTranslation('home');
    const navigate = useNavigate();
    const p = usePortfolio();
    const { primary } = useMoney();
    const sessionStatus = useSession(s => s.status);
    const isTrialActivated = useSession(s => Boolean(s.user?.isTrialActivated));
    const giftDismissed = usePrefs(s => s.giftBannerDismissed);
    const setPref = usePrefs(s => s.set);

    const [ops, setOps] = useState<Operation[] | null>(null);
    const [explainOpen, setExplainOpen] = useState(false);
    const [giftOpen, setGiftOpen] = useState(false);

    useEffect(() => {
        let alive = true;
        userApi.getHistory()
            .then(data => { if (alive) setOps(Array.isArray(data) ? (data as Operation[]).slice(0, 4) : []); })
            .catch(() => { if (alive) setOps([]); });
        return () => { alive = false; };
    }, []);

    const loading = sessionStatus !== 'ready';
    const showGift = !isTrialActivated && !giftDismissed;

    return (
        <Page>
            <div className="mt-3">
                <BalanceBlock
                    label={t('balance.label')}
                    valueUsd={p.totalUsd}
                    todayUsd={p.dailyUsd}
                    loading={loading}
                    onExplain={() => setExplainOpen(true)}
                />
            </div>

            {/* Деньги в один тап: «Пополнить» акцентом, остальные тише */}
            <div className="flex justify-around mt-5">
                <ActionButton accent icon={<ArrowDownToLine className="w-6 h-6" strokeWidth={1.75} aria-hidden />} label={t('actions.deposit')} onClick={() => navigate('/wallet?action=deposit')} />
                <ActionButton icon={<ArrowUpFromLine className="w-6 h-6" strokeWidth={1.75} aria-hidden />} label={t('actions.withdraw')} onClick={() => navigate('/wallet?action=withdraw')} />
                <ActionButton icon={<History className="w-6 h-6" strokeWidth={1.75} aria-hidden />} label={t('actions.history')} onClick={() => navigate('/wallet')} />
            </div>

            {/* Подарок новичку: спокойный баннер, который можно закрыть */}
            {showGift && (
                <Surface className="mt-5 p-4 flex items-start gap-3">
                    <span className="w-10 h-10 rounded-full bg-link/15 text-link flex items-center justify-center shrink-0"><Gift className="w-5 h-5" aria-hidden /></span>
                    <div className="flex-1 min-w-0">
                        <p className="text-headline text-fg">{t('gift.title')}</p>
                        <p className="text-callout text-muted mt-0.5">{t('gift.text')}</p>
                        <Button size="sm" variant="text" className="px-0 mt-1" onClick={() => setGiftOpen(true)}>{t('gift.cta')}</Button>
                    </div>
                    <button onClick={() => setPref('giftBannerDismissed', true)} aria-label={t('gift.dismiss')} className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-muted active:opacity-60">
                        <X className="w-5 h-5" aria-hidden />
                    </button>
                </Surface>
            )}

            {/* Кошелёк — отдельный экран, открывается отсюда */}
            <button onClick={() => navigate('/wallet')} className="mt-5 w-full bg-surface rounded-card p-4 flex items-center gap-3 text-left active:opacity-80">
                <span className="w-10 h-10 rounded-full bg-link/15 text-link flex items-center justify-center shrink-0"><Wallet className="w-5 h-5" strokeWidth={1.75} aria-hidden /></span>
                <span className="flex-1 min-w-0">
                    <span className="block text-headline text-fg">{t('summary.wallet')}</span>
                    <span className="block text-callout text-muted mt-0.5">{t('summary.walletAvailable', { amount: primary(p.walletUsd) })}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-muted shrink-0" aria-hidden />
            </button>

            {/* Сводка: карты и партнёры ведут в свои вкладки */}
            <div className="grid grid-cols-2 gap-3 mt-3">
                <button onClick={() => navigate('/cards')} className="bg-surface rounded-card p-4 text-left active:opacity-80">
                    <span className="flex items-center gap-2 text-headline text-fg"><Layers className="w-5 h-5" strokeWidth={1.75} aria-hidden />{t('summary.cards')}</span>
                    <span className="block text-callout text-muted mt-1">
                        {p.counts.total === 0 ? t('summary.noCards') : t('summary.working', { count: p.counts.active })}
                    </span>
                    {p.counts.needsStart > 0 && (
                        <span className="block text-callout text-link mt-0.5">{t('summary.needsStart', { count: p.counts.needsStart })}</span>
                    )}
                </button>
                <button onClick={() => navigate('/partners')} className="bg-surface rounded-card p-4 text-left active:opacity-80">
                    <span className="flex items-center gap-2 text-headline text-fg"><Users className="w-5 h-5" strokeWidth={1.75} aria-hidden />{t('summary.partners')}</span>
                    <span className={cn('block text-callout mt-1', p.referralUsd >= 0.01 ? 'text-positive' : 'text-muted')}>
                        {p.referralUsd >= 0.01 ? t('summary.available', { amount: primary(p.referralUsd) }) : t('summary.invite')}
                    </span>
                </button>
            </div>

            {!loading && p.counts.total === 0 && (
                <Surface className="mt-3">
                    <EmptyState
                        icon={<Layers className="w-6 h-6" aria-hidden />}
                        text={t('empty.text')}
                        action={{ label: t('empty.cta'), onClick: () => navigate('/shop') }}
                    />
                </Surface>
            )}

            <SectionHeader title={t('recent.title')} action={ops && ops.length ? { label: t('recent.all'), onClick: () => navigate('/wallet') } : undefined} />
            {ops === null ? (
                <SkeletonRows rows={2} />
            ) : ops.length === 0 ? (
                <Surface><EmptyState icon={<Receipt className="w-6 h-6" aria-hidden />} text={t('recent.empty')} /></Surface>
            ) : (
                <List>
                    {ops.map(op => <OperationRow key={op.id} op={op} onClick={() => navigate(`/wallet?op=${op.id}`)} />)}
                </List>
            )}

            <ExplainSheet open={explainOpen} onClose={() => setExplainOpen(false)} />
            <GiftSheet open={giftOpen} onClose={() => setGiftOpen(false)} />
        </Page>
    );
};

export default HomeScreen;
