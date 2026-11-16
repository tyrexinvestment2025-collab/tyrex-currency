import React, { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Info, Share2, ShoppingBag } from 'lucide-react';
import { Surface, SectionHeader, Segmented, Sheet, InfoRow, Button, cn } from '../../ui';
import { fmtUsd, fmtPct, fmtInt } from '../../lib/format';
import { intlLocale } from '../../i18n';
import { useTyrexStore } from '../../store/useTyrexStore';
import { haptic } from '../../lib/telegram';
import { apyOf, priceUsdOf } from '../shop/shopMath';
import { LineChart, Legend } from './charts';
import { runForecast, monthsFromNow, cardsForMonthlyIncome } from './forecast';
import { shareWithRefLink } from './share';
import { SCENARIO_KEYS, type Dashboard, type ScenarioKey } from './types';

type Mode = 'save' | 'invest';
const GOAL_PRESETS = [5_000, 10_000, 50_000, 100_000];
const INCOME_PRESETS = [50, 100, 300, 1_000];
const HORIZONS = ['12', '36', '60', '120'] as const;
type Horizon = typeof HORIZONS[number];
const MINE = '__mine__';

/** Поле суммы в USD для калькулятора */
const UsdField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => {
    const id = useId();
    return (
        <div className="flex-1 min-w-0">
            <label htmlFor={id} className="text-caption text-muted">{label}</label>
            <div className="mt-1 flex items-center gap-1 bg-raised rounded-control px-3 h-12 border border-transparent focus-within:border-link">
                <span className="text-body text-muted">$</span>
                <input
                    id={id}
                    inputMode="numeric"
                    autoComplete="off"
                    value={value}
                    onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="0"
                    className="flex-1 min-w-0 bg-transparent outline-none text-headline text-fg tabular-nums placeholder:text-muted/50"
                />
            </div>
        </div>
    );
};

const Chips: React.FC<{ items: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label: string }> = ({ items, value, onChange, label }) => (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar" role="radiogroup" aria-label={label}>
        {items.map(i => (
            <button
                key={i.value}
                role="radio"
                aria-checked={value === i.value}
                onClick={() => { if (value !== i.value) { haptic.select(); onChange(i.value); } }}
                className={cn('shrink-0 min-h-[36px] px-3 rounded-full text-callout border tabular-nums',
                    value === i.value ? 'bg-violet/15 text-link border-violet font-semibold' : 'bg-surface text-fg border-line')}
            >
                {i.label}
            </button>
        ))}
    </div>
);

/** «Прогноз»: сценарии курса BTC и дата цели; обратный калькулятор «Сколько вложить» */
const ForecastSection: React.FC<{ data: Dashboard }> = ({ data }) => {
    const { t } = useTranslation('analytics');
    const navigate = useNavigate();
    const a = data.analytics;
    const types = useTyrexStore(s => s.marketCardTypes);
    const btcPrice = useTyrexStore(s => s.btcPrice);
    const series = useMemo(() => [...types].sort((x, y) => x.nominalSats - y.nominalSats), [types]);

    const [mode, setMode] = useState<Mode>('save');
    const hasMine = a.activeNodes > 0 && a.baseApy > 0;
    const [seriesId, setSeriesId] = useState<string>(hasMine ? MINE : '');
    const chosen = series.find(s => String(s.id) === seriesId) ?? (seriesId === MINE ? null : series[series.length - 1] ?? null);
    const apy = seriesId === MINE ? a.baseApy : chosen ? apyOf(chosen.clientAPY) : 0;

    const [principal, setPrincipal] = useState(String(Math.round(a.currentBalance) || 1000));
    const [monthly, setMonthly] = useState('100');
    const [goal, setGoal] = useState(String(a.financialGoal || 50_000));
    const [horizon, setHorizon] = useState<Horizon | null>(null);
    const [target, setTarget] = useState('100');
    const [howOpen, setHowOpen] = useState(false);

    const goalNum = Number(goal) || 0;
    // Расчёт дешёвый (3 сценария × 120 мес.), мемоизация не нужна
    const result = runForecast({
        principal: Number(principal) || 0, monthly: Number(monthly) || 0, apy, goal: goalNum, scenarios: a.scenarios,
    });

    const dateFmt = useMemo(() => new Intl.DateTimeFormat(intlLocale(), { month: 'long', year: 'numeric' }), []);
    const shortFmt = useMemo(() => new Intl.DateTimeFormat(intlLocale(), { month: 'short', year: 'numeric' }), []);
    const monthDate = (m: number) => dateFmt.format(monthsFromNow(m));
    const usd0 = (v: number) => fmtUsd(v, 0);
    const yearsLabel = (m: number) => t('forecast.years', { count: Math.round((m / 12) * 10) / 10 });

    const g = result.goalMonth;
    const autoHorizon: Horizon = HORIZONS.find(h => g.base !== null && Number(h) >= g.base) ?? '120';
    const months = Number(horizon ?? autoHorizon);

    let headline: string;
    let sub = '';
    if (goalNum > 0 && g.base === 0) headline = t('forecast.already');
    else if (g.base === null && g.bull === null) headline = t('forecast.notReached');
    else {
        const baseM = g.base ?? g.bull!;
        headline = t('forecast.reachDate', { date: monthDate(baseM) });
        const early = g.bull ?? baseM;
        if (g.bear === null) sub = t('forecast.reachRangeOpen', { from: monthDate(early) });
        else if (g.bear !== early) sub = t('forecast.reachRange', { from: monthDate(early), to: monthDate(g.bear) });
    }

    const pct = (k: ScenarioKey) => a.scenarios[k] === 0
        ? t('forecast.noChange')
        : t('forecast.perYear', { value: `${a.scenarios[k] > 0 ? '+' : '−'}${Math.abs(a.scenarios[k])}%` });

    const slice = (arr: number[]) => arr.slice(0, months + 1);
    const baseEnd = result.series.base[months] ?? 0;

    const seriesChips = [
        ...(hasMine ? [{ value: MINE, label: t('forecast.mine', { apy: fmtPct(a.baseApy, 1) }) }] : []),
        ...series.map(s => ({ value: String(s.id), label: `${s.name} · ${fmtPct(apyOf(s.clientAPY), 0)}` })),
    ];
    const pickSeries = (id?: string) => navigate(id ? `/shop?series=${encodeURIComponent(id)}` : '/shop');

    const share = () => shareWithRefLink(t('forecast.shareText', { goal: usd0(goalNum), date: headline }));

    const targetNum = Number(target) || 0;

    return (
        <div>
            <Segmented<Mode>
                value={mode}
                onChange={setMode}
                options={[{ value: 'save', label: t('forecast.modes.save') }, { value: 'invest', label: t('forecast.modes.invest') }]}
                className="mb-4"
            />

            {mode === 'save' ? (
                <>
                    <p className="text-callout text-muted mb-2">{t('forecast.series')}</p>
                    <Chips items={seriesChips} value={seriesId || String(chosen?.id ?? '')} onChange={setSeriesId} label={t('forecast.series')} />

                    <Surface className="p-4 mt-3">
                        <p className="text-callout text-muted">{t('forecast.reach', { goal: usd0(goalNum) })}</p>
                        <p className="text-title text-fg mt-1">{headline}</p>
                        {sub && <p className="text-callout text-muted mt-1">{sub}</p>}
                        <div className="mt-6">
                            <LineChart
                                values={slice(result.series.base)}
                                band={{ lo: slice(result.series.bear), hi: slice(result.series.bull) }}
                                goal={goalNum}
                                goalLabel={usd0(goalNum)}
                                clampTo={Math.max(baseEnd * 1.8, goalNum * 1.15)}
                                tip={(i) => `${shortFmt.format(monthsFromNow(i))}: ${usd0(result.series.base[i])} (${usd0(result.series.bear[i])}–${usd0(result.series.bull[i])})`}
                                xLabels={[t('forecast.now'), yearsLabel(Math.round(months / 2)), yearsLabel(months)]}
                                ariaLabel={t('forecast.chartLabel')}
                            />
                        </div>
                        <div className="mt-3">
                            <Legend items={[
                                { label: t('forecast.legendBase'), className: 'bg-chart' },
                                { label: t('forecast.legendBand'), className: 'bg-violet/30 ring-1 ring-inset ring-violet' },
                            ]} />
                        </div>
                        <Segmented<Horizon>
                            value={horizon ?? autoHorizon}
                            onChange={setHorizon}
                            options={HORIZONS.map(h => ({ value: h, label: yearsLabel(Number(h)) }))}
                            className="mt-3"
                        />
                    </Surface>

                    <SectionHeader title={t('forecast.scenarios')} />
                    <div className="grid grid-cols-3 gap-2">
                        {SCENARIO_KEYS.map(k => (
                            <Surface key={k} className={cn('p-3', k === 'base' && 'ring-1 ring-chart')}>
                                <p className="text-callout text-fg font-semibold">{t(`forecast.scenario.${k}`)}</p>
                                <p className="text-caption text-muted mt-0.5">{pct(k)}</p>
                                <p className="text-callout text-fg tabular-nums mt-2">{usd0(result.series[k][months])}</p>
                                <p className="text-caption text-muted">{t('forecast.capitalIn', { years: yearsLabel(months) })}</p>
                                <p className="text-caption text-muted mt-1">{g[k] === null ? t('forecast.goalNever') : t('forecast.goalAt', { date: shortFmt.format(monthsFromNow(g[k]!)) })}</p>
                            </Surface>
                        ))}
                    </div>

                    <SectionHeader title={t('forecast.inputs')} />
                    <Surface className="p-4">
                        <div className="flex gap-3">
                            <UsdField label={t('forecast.principal')} value={principal} onChange={setPrincipal} />
                            <UsdField label={t('forecast.monthly')} value={monthly} onChange={setMonthly} />
                        </div>
                        <div className="mt-3">
                            <UsdField label={t('forecast.goal')} value={goal} onChange={setGoal} />
                            <div className="mt-2">
                                <Chips items={GOAL_PRESETS.map(p => ({ value: String(p), label: usd0(p) }))} value={goal} onChange={setGoal} label={t('forecast.goal')} />
                            </div>
                        </div>
                        <div className="mt-2 divide-y divide-line/60">
                            <InfoRow label={t('forecast.rate')} value={apy > 0 ? t('forecast.rateValue', { value: fmtPct(apy, 1) }) : '—'} />
                        </div>
                    </Surface>

                    {chosen && seriesId !== MINE && (
                        <Button block className="mt-4" icon={<ShoppingBag className="w-5 h-5" aria-hidden />} onClick={() => pickSeries(String(chosen.id))}>
                            {t('forecast.choose', { name: chosen.name })}
                        </Button>
                    )}
                    <Button variant="secondary" block className="mt-3" icon={<Share2 className="w-4 h-4" aria-hidden />} onClick={share}>
                        {t('forecast.share')}
                    </Button>
                </>
            ) : (
                <>
                    <Surface className="p-4">
                        <UsdField label={t('invest.target')} value={target} onChange={setTarget} />
                        <div className="mt-2">
                            <Chips items={INCOME_PRESETS.map(p => ({ value: String(p), label: usd0(p) }))} value={target} onChange={setTarget} label={t('invest.target')} />
                        </div>
                        <p className="text-caption text-muted mt-2">{t('invest.hint')}</p>
                    </Surface>

                    <SectionHeader title={t('invest.options')} />
                    {btcPrice <= 0 || series.length === 0 ? (
                        <p className="text-callout text-muted">{t('invest.noPrice')}</p>
                    ) : (
                        <div className="space-y-3">
                            {series.map(s => {
                                const price = priceUsdOf(s, btcPrice);
                                const r = cardsForMonthlyIncome(targetNum, price, apyOf(s.clientAPY));
                                const short = r.count > s.available;
                                return (
                                    <Surface key={s.id} className="p-4">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="text-headline text-fg">{s.name}</span>
                                            <span className="text-callout text-muted">{t('invest.rate', { apy: fmtPct(apyOf(s.clientAPY), 0) })}</span>
                                        </div>
                                        <div className="mt-2 divide-y divide-line/60">
                                            <InfoRow label={t('invest.cards')} value={fmtInt(r.count)} />
                                            <InfoRow label={t('invest.cost')} value={usd0(r.costUsd)} />
                                            <InfoRow label={t('invest.monthly')} value={fmtUsd(r.monthlyUsd)} />
                                            <InfoRow label={t('invest.perCard')} value={`${usd0(price)} → ${fmtUsd(r.perCardUsd)}`} />
                                        </div>
                                        {short && <p className="text-caption text-negative mt-1">{t('invest.short', { count: s.available })}</p>}
                                        <Button size="sm" variant="secondary" block className="mt-2" onClick={() => pickSeries(String(s.id))}>
                                            {t('forecast.choose', { name: s.name })}
                                        </Button>
                                    </Surface>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            <button onClick={() => setHowOpen(true)} className="mt-3 flex items-center gap-1.5 text-callout text-link min-h-[44px] active:opacity-60">
                <Info className="w-4 h-4" aria-hidden />{t('forecast.how')}
            </button>
            <p className="text-caption text-muted px-1">{t('forecast.disclaimer')}</p>

            <Sheet open={howOpen} onClose={() => setHowOpen(false)} title={t('forecast.how')}>
                <p className="text-body text-fg">{t('forecast.howText')}</p>
                <div className="mt-3 divide-y divide-line/60">
                    {SCENARIO_KEYS.map(k => <InfoRow key={k} label={t(`forecast.scenario.${k}`)} value={pct(k)} />)}
                </div>
            </Sheet>
        </div>
    );
};

export default ForecastSection;
