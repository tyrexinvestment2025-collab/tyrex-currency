import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Surface, SectionHeader, Segmented, Skeleton, InfoRow, cn } from '../../ui';
import { fmtUsd, fmtPct } from '../../lib/format';
import { intlLocale } from '../../i18n';
import { useTyrexStore } from '../../store/useTyrexStore';
import { analyticsApi } from '../../api/tyrexApi';
import { priceUsdOf, apyOf } from '../shop/shopMath';
import SeriesImage from '../shop/SeriesImage';
import { LineChart } from './charts';
import QuizCard from './QuizCard';
import type { Market } from './types';

type Range = '24h' | '7d' | '30d' | '1y';
const RANGES: Range[] = ['24h', '7d', '30d', '1y'];

const Change: React.FC<{ pct: number; className?: string }> = ({ pct, className }) => {
    const up = pct >= 0;
    const Icon = up ? TrendingUp : TrendingDown;
    return (
        <span className={cn('inline-flex items-center gap-1 tabular-nums', up ? 'text-positive' : 'text-negative', className)}>
            <Icon className="w-4 h-4" aria-hidden />{up ? '+' : '−'}{fmtPct(Math.abs(pct), 2)}
        </span>
    );
};

/** «Рынок»: курс BTC вживую, график за период, цены карт сегодня, вопрос дня */
const MarketSection: React.FC<{ sentiment?: { value: number; status: string } }> = ({ sentiment }) => {
    const { t } = useTranslation('analytics');
    const livePrice = useTyrexStore(s => s.btcPrice);
    const types = useTyrexStore(s => s.marketCardTypes);
    const [range, setRange] = useState<Range>('24h');
    const [data, setData] = useState<Record<string, Market>>({});
    const [failed, setFailed] = useState(false);
    const market = data[range];

    useEffect(() => {
        if (data[range]) return;
        let alive = true;
        analyticsApi.getMarket(range)
            .then(m => { if (alive) { setData(d => ({ ...d, [range]: m as Market })); setFailed(false); } })
            .catch(() => { if (alive) setFailed(true); });
        return () => { alive = false; };
    }, [range, data]);

    const change24 = data['24h']?.change24hPct ?? market?.change24hPct ?? 0;
    const values = useMemo(() => market?.points.map(p => p[1]) ?? [], [market]);
    const fmtTime = useMemo(() => new Intl.DateTimeFormat(intlLocale(),
        range === '24h' ? { hour: '2-digit', minute: '2-digit' } : range === '1y' ? { day: 'numeric', month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short', hour: range === '7d' ? '2-digit' : undefined }), [range]);
    const xLabels = market && market.points.length
        ? [market.points[0][0], market.points[Math.floor(market.points.length / 2)][0], market.points[market.points.length - 1][0]]
            .map(ts => new Intl.DateTimeFormat(intlLocale(), range === '24h' ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }).format(new Date(ts)))
        : [];

    const sorted = useMemo(() => [...types].sort((a, b) => a.nominalSats - b.nominalSats), [types]);
    const price = livePrice > 0 ? livePrice : market?.price ?? 0;

    return (
        <div>
            <Surface className="p-4">
                <p className="text-callout text-muted">{t('market.btc')}</p>
                <div className="flex items-baseline gap-3 flex-wrap mt-1">
                    <span className="text-display text-fg tabular-nums">{price > 0 ? fmtUsd(price) : '…'}</span>
                    {data['24h'] && <Change pct={change24} className="text-callout" />}
                </div>
                <p className="text-caption text-muted mt-0.5">{t('market.live')}</p>

                <Segmented<Range>
                    value={range}
                    onChange={setRange}
                    options={RANGES.map(r => ({ value: r, label: t(`market.ranges.${r}`) }))}
                    className="mt-4"
                />
                <div className="mt-6">
                    {failed && !market ? (
                        <p className="text-callout text-muted py-10 text-center">{t('market.unavailable')}</p>
                    ) : !market ? (
                        <Skeleton className="h-40" />
                    ) : (
                        <>
                            <LineChart
                                values={values}
                                tone="third"
                                fill={false}
                                tip={(i) => `${fmtTime.format(new Date(market.points[i][0]))}: ${fmtUsd(market.points[i][1])}`}
                                xLabels={xLabels}
                                ariaLabel={t('market.chartLabel')}
                            />
                            <div className="mt-3 divide-y divide-line/60">
                                <InfoRow label={t('market.change', { range: t(`market.ranges.${range}`) })} value={<Change pct={market.changePct} />} />
                                <InfoRow label={t('market.high')} value={fmtUsd(market.high)} />
                                <InfoRow label={t('market.low')} value={fmtUsd(market.low)} />
                            </div>
                        </>
                    )}
                </div>
            </Surface>

            {sentiment && (
                <Surface className="p-4 mt-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-callout text-muted">{t('market.sentiment')}</span>
                        <span className="text-headline text-fg tabular-nums">{sentiment.value} · {t(`market.status.${sentiment.status}`, { defaultValue: sentiment.status })}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-fg/10 relative">
                        <span className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-third ring-2 ring-surface" style={{ left: `${Math.max(0, Math.min(100, sentiment.value))}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-caption text-muted"><span>{t('market.fear')}</span><span>{t('market.greed')}</span></div>
                    <p className="text-caption text-muted mt-2">{t('market.sentimentSource')}</p>
                </Surface>
            )}

            {sorted.length > 0 && (
                <>
                    <SectionHeader title={t('market.cards')} />
                    <Surface className="divide-y divide-line/60">
                        {sorted.map(s => (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                                <SeriesImage src={s.imageUrl} alt={s.name} className="w-10 h-10 rounded-control shrink-0" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-body text-fg">{s.name}</span>
                                    <span className="block text-caption text-muted">{t('market.cardRate', { apy: fmtPct(apyOf(s.clientAPY), 0) })}</span>
                                </span>
                                <span className="text-right shrink-0">
                                    <span className="block text-body text-fg tabular-nums">{price > 0 ? fmtUsd(priceUsdOf(s, price)) : '…'}</span>
                                    {data['24h'] && <Change pct={change24} className="text-caption" />}
                                </span>
                            </div>
                        ))}
                    </Surface>
                    <p className="text-caption text-muted mt-2 px-1">{t('market.cardsHint')}</p>
                </>
            )}

            <SectionHeader title={t('quiz.section')} />
            <QuizCard />
        </div>
    );
};

export default MarketSection;
