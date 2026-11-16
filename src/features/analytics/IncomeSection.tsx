import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Info, Share2, BellRing, CalendarClock, Gift } from 'lucide-react';
import { Surface, SectionHeader, Segmented, Sheet, InfoRow, Badge, Toggle, Button, notify, useMoney, cn } from '../../ui';
import { intlLocale } from '../../i18n';
import { fmtDate, fmtPct } from '../../lib/format';
import { analyticsApi } from '../../api/tyrexApi';
import { Bars, Heatmap, HeatLegend, Legend, type BarDatum } from './charts';
import { shareWithRefLink } from './share';
import type { Income, IncomeDay, Upcoming } from './types';

type Period = 'week' | 'month' | 'year' | 'all';

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Пример дохода для пустого состояния: «Так будет выглядеть ваш доход» */
const exampleIncome = (): Income => {
    const daily: IncomeDay[] = [];
    const today = new Date();
    for (let i = 182; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const base = 1.6 + Math.sin(i / 9) * 0.5 + ((i * 37) % 11) / 20;
        daily.push({ date: isoDay(d), cardsUsd: Math.round(base * 100) / 100, referralUsd: i % 3 === 0 ? 0.4 : 0 });
    }
    const byMonth = Array.from({ length: 12 }, (_, k) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (11 - k), 1);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const rows = daily.filter(x => x.date.startsWith(m));
        return { month: m, cardsUsd: rows.reduce((a, r) => a + r.cardsUsd, 0), referralUsd: rows.reduce((a, r) => a + r.referralUsd, 0) };
    });
    return {
        totalUsd: 412.3, cardsUsd: 371.1, partnersUsd: 41.2, receivedUsd: 280, pendingUsd: 132.3,
        investedUsd: 2600, returnPct: 15.86, daily, byMonth,
        bySeries: [{ name: 'Maxi', receivedUsd: 210, pendingUsd: 80 }, { name: 'Mini', receivedUsd: 70, pendingUsd: 52.3 }],
    };
};

/** «Доход»: сколько заработано, за период, по дням, по сериям, что будет скоро */
const IncomeSection: React.FC<{
    income: Income;
    upcoming: Upcoming[];
    hasCards: boolean;
    onUpcomingChange: (list: Upcoming[]) => void;
}> = ({ income: real, upcoming, hasCards, onUpcomingChange }) => {
    const { t } = useTranslation('analytics');
    const navigate = useNavigate();
    const { primary, usd } = useMoney();
    const [period, setPeriod] = useState<Period>('month');
    const [howOpen, setHowOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    const isExample = !hasCards && real.totalUsd <= 0 && real.daily.length === 0;
    const income = useMemo(() => (isExample ? exampleIncome() : real), [isExample, real]);
    const money = (v: number) => (isExample ? usd(v) : primary(v, { balance: true }));

    const dayMap = useMemo(() => new Map(income.daily.map(d => [d.date, d])), [income.daily]);

    const { bars, total, labelEvery } = useMemo(() => {
        const loc = intlLocale();
        const tipOf = (label: string, d: { cardsUsd: number; referralUsd: number }) =>
            `${label}: ${usd(d.cardsUsd + d.referralUsd)}`;
        if (period === 'week' || period === 'month') {
            const n = period === 'week' ? 7 : 30;
            const fmtLabel = new Intl.DateTimeFormat(loc, period === 'week' ? { weekday: 'short' } : { day: 'numeric' });
            const fmtTip = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' });
            const out: BarDatum[] = [];
            let sum = 0;
            for (let i = n - 1; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const row = dayMap.get(isoDay(d)) || { cardsUsd: 0, referralUsd: 0 };
                sum += row.cardsUsd + row.referralUsd;
                out.push({ label: fmtLabel.format(d).replace('.', ''), tip: tipOf(fmtTip.format(d), row), a: row.cardsUsd, b: row.referralUsd });
            }
            return { bars: out, total: sum, labelEvery: period === 'week' ? 1 : 5 };
        }
        const fmtM = new Intl.DateTimeFormat(loc, { month: 'short' });
        const fmtMY = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' });
        const out = income.byMonth.map(m => {
            const [y, mo] = m.month.split('-').map(Number);
            const d = new Date(y, mo - 1, 1);
            return { label: fmtM.format(d).replace('.', ''), tip: tipOf(fmtMY.format(d), m), a: m.cardsUsd, b: m.referralUsd };
        });
        const sum = period === 'all' ? income.totalUsd : out.reduce((a, b) => a + b.a + (b.b || 0), 0);
        return { bars: out, total: sum, labelEvery: 2 };
    }, [period, dayMap, income.byMonth, income.totalUsd, usd]);

    const heatValues = useMemo(() => new Map(income.daily.map(d => [d.date, d.cardsUsd + d.referralUsd])), [income.daily]);
    const seriesMax = Math.max(...income.bySeries.map(s => s.receivedUsd + s.pendingUsd), 0.01);

    const toggleRemind = async (u: Upcoming, on: boolean) => {
        setBusy(u.cardId);
        try {
            await analyticsApi.setReminder(u.cardId, on);
            onUpcomingChange(upcoming.map(x => (x.cardId === u.cardId ? { ...x, remind: on } : x)));
            if (on) notify.success(t('soon.reminderOn'));
        } catch (e) { notify.error(e); }
        finally { setBusy(null); }
    };

    const share = () => shareWithRefLink(t('income.shareText', { total: usd(income.totalUsd), pct: fmtPct(income.returnPct, 1) }));

    return (
        <div>
            {isExample && (
                <Surface className="p-4 mb-3 flex items-start gap-3">
                    <Badge tone="accent">{t('income.example')}</Badge>
                    <div className="flex-1 min-w-0">
                        <p className="text-callout text-fg">{t('income.exampleText')}</p>
                        <Button size="sm" variant="text" className="px-0 mt-1" onClick={() => navigate('/shop')}>{t('income.emptyCta')}</Button>
                    </div>
                </Surface>
            )}

            <div className={cn(isExample && 'opacity-80')}>
                <Surface className="p-4">
                    <button onClick={() => setHowOpen(true)} className="w-full text-left active:opacity-70">
                        <span className="flex items-center gap-1.5 text-callout text-muted">{t('income.total')}<Info className="w-4 h-4" aria-hidden /></span>
                        <span className="block text-display text-fg tabular-nums mt-1">{money(income.totalUsd)}</span>
                        {income.investedUsd > 0 && (
                            <span className="block text-callout text-positive mt-0.5">{t('income.returnPct', { pct: fmtPct(income.returnPct, 1) })}</span>
                        )}
                    </button>
                    <div className="mt-3 divide-y divide-line/60">
                        <InfoRow label={t('income.fromCards')} value={money(income.cardsUsd)} />
                        <InfoRow label={t('income.fromPartners')} value={money(income.partnersUsd)} />
                    </div>
                </Surface>

                <Segmented<Period>
                    value={period}
                    onChange={setPeriod}
                    options={(['week', 'month', 'year', 'all'] as Period[]).map(p => ({ value: p, label: t(`income.periods.${p}`) }))}
                    className="mt-4"
                />
                <Surface className="p-4 mt-3">
                    <div className="flex items-baseline justify-between gap-3 mb-4">
                        <span className="text-callout text-muted">{t(`income.periodTotal.${period}`)}</span>
                        <span className="text-headline text-fg tabular-nums">{money(total)}</span>
                    </div>
                    <Bars data={bars} ariaLabel={t('income.chartLabel')} labelEvery={labelEvery} />
                    <div className="mt-3">
                        <Legend items={[
                            { label: t('income.fromCards'), className: 'bg-chart' },
                            { label: t('income.fromPartners'), className: 'bg-violet' },
                        ]} />
                    </div>
                </Surface>

                <SectionHeader title={t('income.heatmap')} />
                <Surface className="p-4">
                    <Heatmap
                        values={heatValues}
                        tip={(d, v) => `${fmtDate(d, { day: 'numeric', month: 'short' })}: ${usd(v)}`}
                        ariaLabel={t('income.heatmap')}
                    />
                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-caption text-muted">{t('income.heatmapHint')}</span>
                        <HeatLegend less={t('income.less')} more={t('income.more')} />
                    </div>
                </Surface>
            </div>

            {upcoming.length > 0 && (
                <>
                    <SectionHeader title={t('soon.title')} />
                    <Surface className="divide-y divide-line/60">
                        {upcoming.map(u => (
                            <div key={u.cardId} className="p-4 flex items-start gap-3">
                                <span className="w-10 h-10 rounded-full bg-raised flex items-center justify-center shrink-0 text-fg">
                                    {u.kind === 'trialEnd' ? <Gift className="w-5 h-5" aria-hidden /> : <CalendarClock className="w-5 h-5" aria-hidden />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-body text-fg">{u.name} #{u.serial}</p>
                                    <p className="text-callout text-muted">
                                        {t(u.kind === 'trialEnd' ? 'soon.trialEnd' : 'soon.payout', { date: fmtDate(u.at, { day: 'numeric', month: 'long' }) })}
                                    </p>
                                    {u.kind === 'payout' && (
                                        <p className="text-callout text-fg tabular-nums mt-0.5">
                                            {t('soon.amount', { amount: primary(u.amountUsd, { balance: true }), profit: primary(u.profitUsd, { balance: true }) })}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <Toggle checked={u.remind} onChange={(v) => { if (busy !== u.cardId) toggleRemind(u, v); }} label={t('soon.remind')} />
                                    <span className="flex items-center gap-1 text-caption text-muted"><BellRing className="w-3.5 h-3.5" aria-hidden />{t('soon.remind')}</span>
                                </div>
                            </div>
                        ))}
                    </Surface>
                    <p className="text-caption text-muted mt-2 px-1">{t('soon.hint')}</p>
                </>
            )}

            {income.bySeries.length > 0 && (
                <div className={cn(isExample && 'opacity-80')}>
                    <SectionHeader title={t('income.bySeries')} />
                    <Surface className="p-4 space-y-4">
                        {income.bySeries.map(s => {
                            const sum = s.receivedUsd + s.pendingUsd;
                            return (
                                <div key={s.name}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="text-body text-fg truncate">{s.name}</span>
                                        <span className="text-body text-fg tabular-nums shrink-0">{money(sum)}</span>
                                    </div>
                                    <div className="mt-1.5 h-2 rounded-full bg-fg/10 overflow-hidden flex">
                                        <div className="h-full bg-chart" style={{ width: `${(s.receivedUsd / seriesMax) * 100}%` }} />
                                        <div className="h-full bg-chart/45" style={{ width: `${(s.pendingUsd / seriesMax) * 100}%` }} />
                                    </div>
                                    <p className="text-caption text-muted mt-1">
                                        {[s.receivedUsd > 0 && t('income.seriesReceived', { amount: money(s.receivedUsd) }),
                                          s.pendingUsd > 0 && t('income.seriesPending', { amount: money(s.pendingUsd) })].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                            );
                        })}
                    </Surface>
                </div>
            )}

            {!isExample && income.totalUsd > 0 && (
                <Button variant="secondary" block className="mt-4" icon={<Share2 className="w-4 h-4" aria-hidden />} onClick={share}>
                    {t('income.share')}
                </Button>
            )}

            <Sheet open={howOpen} onClose={() => setHowOpen(false)} title={t('income.howTitle')}>
                <p className="text-body text-fg">{t('income.howText')}</p>
                <div className="mt-3 divide-y divide-line/60">
                    <InfoRow label={t('income.received')} value={money(income.receivedUsd)} />
                    <InfoRow label={t('income.pending')} value={money(income.pendingUsd)} />
                    <InfoRow label={t('income.invested')} value={money(income.investedUsd)} />
                </div>
            </Sheet>
        </div>
    );
};

export default IncomeSection;
