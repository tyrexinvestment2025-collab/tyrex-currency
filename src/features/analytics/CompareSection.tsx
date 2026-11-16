import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import {
    Info, ChevronRight, Building2, Landmark, LineChart, Coins, Briefcase, PieChart,
    Layers, Pickaxe, MousePointer2, Zap, LayoutGrid, Signal,
} from 'lucide-react';
import { Surface, SectionHeader, Sheet, cn } from '../../ui';
import { haptic } from '../../lib/telegram';
import { fmtDate } from '../../lib/format';
import { Legend, Radar } from './charts';
import { METRIC_KEYS, type AssetGroup, type Benchmark, type MetricKey, type Scores } from './types';

const ICONS: Record<string, LucideIcon> = {
    'Real Estate': Building2, 'Bank Deposit': Landmark, 'S&P 500': LineChart, Gold: Coins, Business: Briefcase, Funds: PieChart,
    Staking: Layers, Mining: Pickaxe, Trading: MousePointer2, Altcoins: Zap, Bots: LayoutGrid, Signals: Signal,
};
const GROUPS: AssetGroup[] = ['traditional', 'crypto'];

/** «Сравнение»: радар на 6 осей (Tyrex и выбранный актив) + где Tyrex сильнее и слабее */
const CompareSection: React.FC<{ benchmarks: Record<AssetGroup, Benchmark[]>; tyrex: Scores; updatedAt: string }> = ({ benchmarks, tyrex, updatedAt }) => {
    const { t } = useTranslation('analytics');
    const [subject, setSubject] = useState<string>(benchmarks.traditional[0]?.subject ?? '');
    const [metric, setMetric] = useState<MetricKey | null>(null);
    const [howOpen, setHowOpen] = useState(false);

    const asset = [...benchmarks.traditional, ...benchmarks.crypto].find(b => b.subject === subject) ?? benchmarks.traditional[0];
    const label = (id: string) => t(`assets.${id}.label`, { defaultValue: id });
    const title = (k: MetricKey) => t(`metrics.${k}.title`);

    const rows = asset ? METRIC_KEYS.map(k => ({ k, a: tyrex[k], b: asset[k], d: tyrex[k] - asset[k] })) : [];
    const sorted = [...rows].sort((x, y) => y.d - x.d);
    const stronger = rows.filter(r => r.d > 0).length;
    const weaker = rows.filter(r => r.d < 0).length;

    return (
        <div>
            {GROUPS.map(g => (
                <div key={g} className="mb-3">
                    <p className="text-callout text-muted mb-2">{t(`compare.groups.${g}`)}</p>
                    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar" role="radiogroup" aria-label={t(`compare.groups.${g}`)}>
                        {benchmarks[g].map(b => {
                            const Icon = ICONS[b.subject] ?? Info;
                            const active = asset?.subject === b.subject;
                            return (
                                <button
                                    key={b.subject}
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => { if (!active) { haptic.select(); setSubject(b.subject); } }}
                                    className={cn(
                                        'shrink-0 flex items-center gap-1.5 min-h-[40px] px-3 rounded-full text-callout border transition-colors',
                                        active ? 'bg-violet/15 text-link border-violet font-semibold' : 'bg-surface text-fg border-line',
                                    )}
                                >
                                    <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden />{label(b.subject)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {asset && (
                <>
                    <Surface className="p-4">
                        <Radar
                            axes={METRIC_KEYS.map(k => ({ key: k, label: t(`metrics.${k}.axis`) }))}
                            a={METRIC_KEYS.map(k => tyrex[k])}
                            b={METRIC_KEYS.map(k => asset[k])}
                            onAxis={(k) => setMetric(k as MetricKey)}
                            ariaLabel={t('compare.radarLabel', { asset: label(asset.subject) })}
                        />
                        <div className="mt-2 flex justify-center">
                            <Legend items={[
                                { label: 'Tyrex', className: 'bg-chart' },
                                { label: label(asset.subject), className: 'bg-violet' },
                            ]} />
                        </div>
                    </Surface>

                    <SectionHeader title={t('compare.diffTitle')} />
                    <Surface className="divide-y divide-line/60">
                        {sorted.map(r => (
                            <button key={r.k} onClick={() => setMetric(r.k)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-fg/5">
                                <span className="flex-1 min-w-0">
                                    <span className="block text-body text-fg">{title(r.k)}</span>
                                    <span className="block text-caption text-muted">{t(`metrics.${r.k}.short`)}</span>
                                </span>
                                <span className="text-callout tabular-nums text-fg shrink-0">
                                    <span className="inline-block w-6 text-right">{r.a}</span>
                                    <span className="text-muted"> / </span>
                                    <span className="inline-block w-6">{r.b}</span>
                                </span>
                                <span className={cn('w-10 text-right text-callout font-semibold tabular-nums shrink-0',
                                    r.d > 0 ? 'text-positive' : r.d < 0 ? 'text-negative' : 'text-muted')}>
                                    {r.d > 0 ? `+${r.d}` : r.d < 0 ? `−${Math.abs(r.d)}` : '='}
                                </span>
                                <ChevronRight className="w-4 h-4 text-muted shrink-0" aria-hidden />
                            </button>
                        ))}
                    </Surface>
                    <p className="text-caption text-muted mt-2 px-1">{t('compare.diffHint', { stronger, weaker, asset: label(asset.subject) })}</p>

                    <Surface className="p-4 mt-3">
                        <p className="text-headline text-fg mb-1">{t('compare.conclusion')}</p>
                        <p className="text-callout text-muted">{t(`assets.${asset.subject}.conclusion`, { defaultValue: '' })}</p>
                    </Surface>

                    <button onClick={() => setHowOpen(true)} className="mt-3 flex items-center gap-1.5 text-callout text-link min-h-[44px] active:opacity-60">
                        <Info className="w-4 h-4" aria-hidden />{t('compare.scoresAt', { date: fmtDate(updatedAt, { day: 'numeric', month: 'long', year: 'numeric' }) })}
                    </button>
                </>
            )}

            <Sheet open={metric !== null} onClose={() => setMetric(null)} title={metric ? title(metric) : ''}>
                {metric && asset && (
                    <>
                        <p className="text-body text-fg">{t(`metrics.${metric}.full`)}</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-control bg-surface p-3">
                                <p className="text-caption text-muted">Tyrex</p>
                                <p className="text-title text-fg tabular-nums">{tyrex[metric]}<span className="text-callout text-muted"> / 10</span></p>
                            </div>
                            <div className="rounded-control bg-surface p-3">
                                <p className="text-caption text-muted">{label(asset.subject)}</p>
                                <p className="text-title text-fg tabular-nums">{asset[metric]}<span className="text-callout text-muted"> / 10</span></p>
                            </div>
                        </div>
                    </>
                )}
            </Sheet>

            <Sheet open={howOpen} onClose={() => setHowOpen(false)} title={t('compare.howTitle')}>
                <p className="text-body text-fg">{t('compare.howText')}</p>
                <p className="text-callout text-muted mt-3">{t('compare.note')}</p>
            </Sheet>
        </div>
    );
};

export default CompareSection;
