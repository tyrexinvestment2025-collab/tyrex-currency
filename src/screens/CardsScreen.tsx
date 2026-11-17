import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import {
    Page, ScreenTitle, Segmented, Surface, EmptyState, Skeleton, Button, CardStatusBadge,
    ProgressBar, notify, cn,
} from '../ui';
import { useTyrexStore, type TyrexCard } from '../store/useTyrexStore';
import { useSession } from '../store/useSession';
import { usePortfolio, cardDailyUsd } from '../features/portfolio/usePortfolio';
import { useLiveProfit } from '../features/cards/useLiveProfit';
import { needsStart, sortCards, cycleProgress, daysLeft } from '../features/cards/cardRules';
import CardThumb from '../features/cards/CardThumb';
import CardSheet from '../features/cards/CardSheet';
import { cardsApi } from '../api/tyrexApi';
import { haptic } from '../lib/telegram';
import { fmtUsd } from '../lib/format';

type Filter = 'all' | 'active' | 'waiting' | 'paused' | 'finished';

const matches = (c: TyrexCard, f: Filter) => {
    if (f === 'active') return c.status === 'Active';
    if (f === 'waiting') return needsStart(c);
    if (f === 'paused') return c.status === 'Cooling';
    if (f === 'finished') return c.status === 'Finished';
    return true;
};

interface RowProps {
    card: TyrexCard;
    now: number;
    profit: number;
    dailyUsd: number;
    starting: boolean;
    onOpen: () => void;
    onStart: () => void;
}

/** Строка карты: картинка · название · статус · справа доход; у ждущих — «Запустить» прямо в строке */
const CardRow: React.FC<RowProps> = ({ card, now, profit, dailyUsd, starting, onOpen, onStart }) => {
    const { t } = useTranslation('cards');
    const progress = cycleProgress(card, now);
    const left = daysLeft(card, now);

    return (
        <div className="px-4 py-3">
            <div className="flex items-center gap-3">
                <button onClick={() => { haptic.tap(); onOpen(); }} className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70">
                    <CardThumb src={card.imageUrl} alt={card.name} className="w-12 h-12 rounded-control shrink-0" />
                    <span className="flex-1 min-w-0">
                        <span className="block text-body text-fg truncate">{card.name} <span className="text-muted tabular-nums">#{card.serialNumber}</span></span>
                        <span className="block mt-1"><CardStatusBadge status={card.status === 'OnSale' ? 'OnSale' : card.status} unlockAt={card.unlockTimestamp} isTrial={card.isTrial} /></span>
                    </span>
                    {card.status === 'Active' && (
                        <span className="flex flex-col items-end shrink-0 text-right">
                            <span className="text-headline text-positive tabular-nums">+{fmtUsd(profit)}</span>
                            {dailyUsd > 0 && <span className="text-caption text-muted tabular-nums">{t('row.perDay', { amount: fmtUsd(dailyUsd) })}</span>}
                        </span>
                    )}
                </button>
                {needsStart(card) && (
                    <Button size="sm" loading={starting} onClick={onStart} className="shrink-0">{t('actions.start')}</Button>
                )}
            </div>
            {progress !== null && left !== null && (
                <div className="mt-3">
                    <ProgressBar
                        value={progress}
                        tone={card.status === 'Cooling' ? 'info' : 'accent'}
                        label={t(card.status === 'Cooling' ? 'progress.payoutIn' : 'progress.trialLeft', { count: left })}
                    />
                </div>
            )}
        </div>
    );
};

/** «Мои карты»: как работают мои карты и что им нужно от меня */
const CardsScreen: React.FC = () => {
    const { t } = useTranslation('cards');
    const navigate = useNavigate();
    const cards = useTyrexStore(s => s.cards);
    const btcPrice = useTyrexStore(s => s.btcPrice);
    const status = useSession(s => s.status);
    const refreshAllData = useSession(s => s.refreshAllData);
    const p = usePortfolio();
    const { now, profitOf } = useLiveProfit(cards, btcPrice);

    const [filter, setFilter] = useState<Filter>('all');
    const [openId, setOpenId] = useState<string | null>(null);
    const [startingId, setStartingId] = useState<string | null>(null);

    const sorted = useMemo(() => sortCards(cards), [cards]);
    const visible = sorted.filter(c => matches(c, filter));
    const openCard = openId ? cards.find(c => c.id === openId) ?? null : null;

    const startInline = async (c: TyrexCard) => {
        setStartingId(c.id);
        try {
            await cardsApi.startCard(c.id);
            notify.success(t('toast.started', { name: c.name }));
        } catch (e) {
            notify.error(e);
        } finally {
            await refreshAllData();
            setStartingId(null);
        }
    };

    const loading = status !== 'ready' && cards.length === 0;

    return (
        <Page>
            <ScreenTitle subtitle={cards.length ? t('subtitle', { count: cards.length }) : undefined}>{t('title')}</ScreenTitle>

            {loading ? (
                <div className="space-y-3" aria-busy="true">
                    <Skeleton className="h-11 w-full" />
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flex items-center gap-3 bg-surface rounded-card p-4">
                            <Skeleton className="w-12 h-12" />
                            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
                        </div>
                    ))}
                </div>
            ) : cards.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={<Layers className="w-6 h-6" strokeWidth={1.75} aria-hidden />}
                        text={t('empty.text')}
                        action={{ label: t('empty.cta'), onClick: () => navigate('/shop') }}
                    />
                </Surface>
            ) : (
                <>
                    {/* Счётчики — они же фильтры */}
                    <Segmented
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { value: 'all', label: t('filters.all'), count: p.counts.total },
                            { value: 'active', label: t('filters.active'), count: p.counts.active },
                            { value: 'waiting', label: t('filters.waiting'), count: p.counts.needsStart },
                            { value: 'paused', label: t('filters.paused'), count: p.counts.cooling },
                            // «Завершённые» — только если такие карты есть, чтобы не тесно было на узком экране
                            ...(p.counts.finished > 0 ? [{ value: 'finished' as Filter, label: t('filters.finished'), count: p.counts.finished }] : []),
                        ]}
                    />

                    {p.counts.needsStart > 0 && filter !== 'waiting' && (
                        <p className="text-callout text-link mt-3">{t('needsStartHint', { count: p.counts.needsStart })}</p>
                    )}

                    {visible.length === 0 ? (
                        <Surface className="mt-3">
                            <EmptyState icon={<Layers className="w-6 h-6" strokeWidth={1.75} aria-hidden />} text={t(`emptyFilter.${filter}`)} />
                        </Surface>
                    ) : (
                        <div className={cn('mt-3 bg-surface rounded-card overflow-hidden divide-y divide-line/60')}>
                            {visible.map(c => (
                                <CardRow
                                    key={c.id}
                                    card={c}
                                    now={now}
                                    profit={profitOf(c)}
                                    dailyUsd={c.status === 'Active' ? cardDailyUsd(c, btcPrice) : 0}
                                    starting={startingId === c.id}
                                    onOpen={() => setOpenId(c.id)}
                                    onStart={() => startInline(c)}
                                />
                            ))}
                        </div>
                    )}

                    {p.counts.active > 0 && btcPrice > 0 && (
                        <p className="text-callout text-muted mt-3">{t('footerDaily', { amount: fmtUsd(p.dailyUsd) })}</p>
                    )}
                </>
            )}

            <CardSheet card={openCard} onClose={() => setOpenId(null)} now={now} profitOf={profitOf} />
        </Page>
    );
};

export default CardsScreen;
