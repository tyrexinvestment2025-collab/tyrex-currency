import React, { useCallback, useId, useRef, useState } from 'react';
import { cn } from '../../ui';
import { haptic } from '../../lib/telegram';

/**
 * Графики аналитики (SVG, токены палитры). Цвета смыслов одинаковые везде:
 * золото (chart) — Tyrex и карты, фиолетовый (violet) — сравниваемый актив и партнёры,
 * бирюзовый (third) — рынок и курс BTC. Касание показывает значение во всплывающей плашке.
 */

/** Легенда — только когда серий больше одной */
export const Legend: React.FC<{ items: { label: string; className: string }[] }> = ({ items }) => (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
        {items.map(i => (
            <span key={i.label} className="flex items-center gap-1.5 text-caption text-muted">
                <span className={cn('w-2.5 h-2.5 rounded-[3px] shrink-0', i.className)} aria-hidden />{i.label}
            </span>
        ))}
    </div>
);

/** Плашка со значением над графиком */
const Tip: React.FC<{ leftPct: number; children: React.ReactNode }> = ({ leftPct, children }) => (
    <div
        className="absolute -top-1 -translate-y-full z-10 pointer-events-none whitespace-nowrap rounded-control bg-raised border border-line px-2.5 py-1.5 text-caption text-fg shadow-sm"
        style={{ left: `clamp(0px, calc(${leftPct}% - 60px), calc(100% - 120px))` }}
    >
        {children}
    </div>
);

/** Индекс точки под пальцем + вибрация при смене точки */
function useScrub(count: number) {
    const ref = useRef<HTMLDivElement>(null);
    const [idx, setIdx] = useState<number | null>(null);
    const last = useRef<number | null>(null);
    const pick = useCallback((clientX: number) => {
        const el = ref.current;
        if (!el || count <= 0) return;
        const r = el.getBoundingClientRect();
        const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        const i = Math.round(f * (count - 1));
        if (i !== last.current) { last.current = i; haptic.select(); }
        setIdx(i);
    }, [count]);
    const handlers = {
        onPointerDown: (e: React.PointerEvent) => { pick(e.clientX); },
        onPointerMove: (e: React.PointerEvent) => { if (e.buttons || e.pointerType !== 'mouse' || idx !== null) pick(e.clientX); },
        onPointerLeave: () => { last.current = null; setIdx(null); },
        onPointerUp: (e: React.PointerEvent) => { if (e.pointerType !== 'mouse') setTimeout(() => setIdx(null), 1500); },
    };
    return { ref, idx, handlers };
}

/* ---------------- Радар ---------------- */

export const Radar: React.FC<{
    axes: { key: string; label: string }[];
    a: number[];
    b?: number[];
    max?: number;
    onAxis?: (key: string) => void;
    ariaLabel: string;
}> = ({ axes, a, b, max = 10, onAxis, ariaLabel }) => {
    const S = 300, C = S / 2, R = 92;
    const n = axes.length;
    const pt = (i: number, v: number) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const r = (Math.max(0, Math.min(max, v)) / max) * R;
        return [C + r * Math.cos(ang), C + r * Math.sin(ang)] as const;
    };
    const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(',')).join(' ');
    const rings = [0.2, 0.4, 0.6, 0.8, 1];

    return (
        <svg viewBox={`-56 -6 ${S + 112} ${S + 12}`} className="w-full max-w-[380px] mx-auto h-auto block overflow-visible" role="img" aria-label={ariaLabel}>
            {rings.map(f => <polygon key={f} points={poly(axes.map(() => f * max))} className="fill-none stroke-line" strokeWidth={1} />)}
            {axes.map((_, i) => { const [x, y] = pt(i, max); return <line key={i} x1={C} y1={C} x2={x} y2={y} className="stroke-line" strokeWidth={1} />; })}
            {b && <polygon points={poly(b)} className="fill-violet/20 stroke-violet" strokeWidth={2} strokeLinejoin="round" />}
            <polygon points={poly(a)} className="fill-chart/25 stroke-chart" strokeWidth={2.5} strokeLinejoin="round" />
            {a.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} cx={x} cy={y} r={3.5} className="fill-chart" />; })}
            {axes.map((ax, i) => {
                const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
                const lx = C + (R + 22) * Math.cos(ang);
                const ly = C + (R + 22) * Math.sin(ang);
                const anchor = Math.abs(Math.cos(ang)) < 0.2 ? 'middle' : Math.cos(ang) > 0 ? 'start' : 'end';
                return (
                    <text
                        key={ax.key}
                        x={lx} y={ly + 4}
                        textAnchor={anchor}
                        className={cn('fill-fg text-[12px] font-medium', onAxis && 'cursor-pointer')}
                        onClick={onAxis ? () => { haptic.select(); onAxis(ax.key); } : undefined}
                    >
                        {ax.label}
                    </text>
                );
            })}
        </svg>
    );
};

/* ---------------- Столбики ---------------- */

export interface BarDatum { label: string; tip: string; a: number; b?: number }

/** Столбики в стопке (карты + партнёры). Текущий (последний) — яркий, прошлые — на 60%. */
export const Bars: React.FC<{ data: BarDatum[]; ariaLabel: string; height?: number; labelEvery?: number }> = ({ data, ariaLabel, height = 128, labelEvery = 1 }) => {
    const max = Math.max(...data.map(d => d.a + (d.b || 0)), 0.0001);
    const { ref, idx, handlers } = useScrub(data.length);
    const active = idx ?? null;
    return (
        <div role="img" aria-label={ariaLabel} className="select-none">
            <div ref={ref} {...handlers} className="relative flex items-end gap-[3px] touch-none" style={{ height }}>
                {active !== null && data[active] && <Tip leftPct={((active + 0.5) / data.length) * 100}>{data[active].tip}</Tip>}
                {data.map((d, i) => {
                    const hA = (d.a / max) * height;
                    const hB = ((d.b || 0) / max) * height;
                    const dim = active !== null ? i !== active : i !== data.length - 1;
                    return (
                        <div key={i} className={cn('flex-1 flex flex-col justify-end h-full transition-opacity duration-150', dim && 'opacity-60')}>
                            {d.a + (d.b || 0) <= 0 && <div className="h-[2px] rounded-full bg-fg/10" />}
                            {hB > 0 && <div className={cn('bg-violet', hA > 0 ? 'rounded-t-[3px]' : 'rounded-[3px]')} style={{ height: Math.max(hB, 2) }} />}
                            {hA > 0 && <div className={cn('bg-chart', hB > 0 ? 'rounded-b-[3px]' : 'rounded-[3px]')} style={{ height: Math.max(hA, 2) }} />}
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-[3px] mt-1.5">
                {data.map((d, i) => (
                    <span key={i} className="flex-1 text-center text-caption text-muted leading-none overflow-visible whitespace-nowrap">
                        {(data.length - 1 - i) % labelEvery === 0 ? d.label : ''}
                    </span>
                ))}
            </div>
        </div>
    );
};

/* ---------------- Тепловая карта ---------------- */

const HEAT = ['bg-raised', 'bg-accent/25', 'bg-accent/45', 'bg-accent/70', 'bg-accent'];

/** Доход по дням: недели — колонки, дни недели — строки, 5 ступеней от surface-raised к золоту */
export const Heatmap: React.FC<{
    values: Map<string, number>;
    weeks?: number;
    tip: (date: Date, value: number) => string;
    ariaLabel: string;
}> = ({ values, weeks = 26, tip, ariaLabel }) => {
    const [sel, setSel] = useState<{ key: string; col: number } | null>(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = (today.getDay() + 6) % 7; // пн = 0
    const start = new Date(today);
    start.setDate(today.getDate() - dow - (weeks - 1) * 7);
    const max = Math.max(...values.values(), 0);
    const level = (v: number) => (v <= 0 || max <= 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, r) => {
        const d = new Date(start);
        d.setDate(start.getDate() + w * 7 + r);
        return d;
    }));

    return (
        <div role="img" aria-label={ariaLabel} className="relative select-none">
            {sel && (() => {
                const d = new Date(`${sel.key}T00:00:00`);
                return <Tip leftPct={((sel.col + 0.5) / weeks) * 100}>{tip(d, values.get(sel.key) || 0)}</Tip>;
            })()}
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
                {cols.map((col, w) => (
                    <div key={w} className="grid gap-[3px]" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                        {col.map(d => {
                            const k = key(d);
                            const future = d > today;
                            return (
                                <button
                                    key={k}
                                    disabled={future}
                                    onClick={() => { haptic.select(); setSel(s => (s?.key === k ? null : { key: k, col: w })); }}
                                    className={cn('aspect-square rounded-[3px]', future ? 'opacity-0' : HEAT[level(values.get(k) || 0)], sel?.key === k && 'ring-2 ring-fg')}
                                    aria-label={tip(d, values.get(k) || 0)}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const HeatLegend: React.FC<{ less: string; more: string }> = ({ less, more }) => (
    <div className="flex items-center gap-1 text-caption text-muted">
        <span className="mr-1">{less}</span>
        {HEAT.map(c => <span key={c} className={cn('w-3 h-3 rounded-[3px]', c)} aria-hidden />)}
        <span className="ml-1">{more}</span>
    </div>
);

/* ---------------- Линия ---------------- */

/**
 * Линия с касанием. tone: chart (золото, прогноз) или third (бирюза, рынок).
 * band — коридор (например, осторожный—смелый сценарий), goal — пунктир цели.
 */
export const LineChart: React.FC<{
    values: number[];
    band?: { lo: number[]; hi: number[] };
    goal?: number;
    tone?: 'chart' | 'third';
    tip: (i: number) => string;
    xLabels: string[];
    goalLabel?: string;
    ariaLabel: string;
    fill?: boolean;
    clampTo?: number; // верх шкалы (коридор может уходить за него)
}> = ({ values, band, goal, tone = 'chart', tip, xLabels, goalLabel, ariaLabel, fill, clampTo }) => {
    const clipId = `lc${useId().replace(/:/g, '')}`;
    const W = 320, H = 160, PT = 8, PB = 8;
    const n = values.length;
    const all = [...values, ...(band ? [...band.lo, ...band.hi] : []), ...(goal ? [goal] : [])];
    let maxV = Math.max(...all);
    if (clampTo) maxV = Math.min(maxV, clampTo);
    let minV = Math.min(...values, ...(band ? band.lo : []));
    if (fill === false || tone === 'third') { const pad = (maxV - minV) * 0.08 || maxV * 0.01; maxV += pad; minV -= pad; }
    else { minV = Math.min(0, minV); maxV *= 1.05; }
    const x = (i: number) => (i / Math.max(n - 1, 1)) * W;
    const y = (v: number) => PT + (1 - (v - minV) / (maxV - minV || 1)) * (H - PT - PB);
    const path = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${path(values)} L${W},${H} L0,${H} Z`;
    const bandPath = band ? `${path(band.hi)} ${[...band.lo].reverse().map((v, j) => `L${x(n - 1 - j).toFixed(1)},${y(v).toFixed(1)}`).join(' ')} Z` : '';
    const { ref, idx, handlers } = useScrub(n);
    const stroke = tone === 'third' ? 'stroke-third' : 'stroke-chart';
    const fillCls = tone === 'third' ? 'fill-third/15' : 'fill-chart/15';
    const dotBg = tone === 'third' ? 'bg-third' : 'bg-chart';
    const goalY = goal ? y(goal) : 0;
    const showGoal = goal !== undefined && goal > 0 && goal <= maxV;

    return (
        <div role="img" aria-label={ariaLabel} className="select-none">
            <div ref={ref} {...handlers} className="relative touch-none">
                {idx !== null && <Tip leftPct={(idx / Math.max(n - 1, 1)) * 100}>{tip(idx)}</Tip>}
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-40 block" aria-hidden>
                    <defs><clipPath id={clipId}><rect x={0} y={0} width={W} height={H} /></clipPath></defs>
                    {[0.25, 0.5, 0.75].map(f => <line key={f} x1={0} x2={W} y1={PT + f * (H - PT - PB)} y2={PT + f * (H - PT - PB)} className="stroke-line" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
                    <g clipPath={`url(#${clipId})`}>
                        {band && <path d={bandPath} className="fill-violet/[0.18]" />}
                        {band && <path d={path(band.hi)} className="stroke-violet/70 fill-none" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />}
                        {band && <path d={path(band.lo)} className="stroke-violet/70 fill-none" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />}
                        {fill !== false && !band && <path d={area} className={fillCls} />}
                        <path d={path(values)} className={cn(stroke, 'fill-none')} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    </g>
                    {showGoal && <line x1={0} x2={W} y1={goalY} y2={goalY} className="stroke-fg/60" strokeWidth={1.25} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
                    {idx !== null && <line x1={x(idx)} x2={x(idx)} y1={0} y2={H} className="stroke-fg/40" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
                </svg>
                {idx !== null && (
                    <span
                        className={cn('absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full ring-2 ring-surface pointer-events-none', dotBg)}
                        style={{ left: `${(x(idx) / W) * 100}%`, top: `${(y(values[idx]) / H) * 100}%` }}
                    />
                )}
                {showGoal && goalLabel && (
                    <span className="absolute right-1 text-caption text-fg bg-surface/90 px-1 rounded pointer-events-none" style={{ top: `calc(${(goalY / H) * 100}% - 18px)` }}>
                        {goalLabel}
                    </span>
                )}
            </div>
            <div className="flex justify-between mt-1">
                {xLabels.map((l, i) => <span key={i} className="text-caption text-muted">{l}</span>)}
            </div>
        </div>
    );
};
