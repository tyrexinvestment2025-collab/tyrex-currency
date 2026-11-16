import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';
import { haptic } from '../lib/telegram';

/** Контейнер экрана: не шире 480 px, по центру, поля 16 px */
export const Page: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn('mx-auto w-full max-w-app px-4 pb-6', className)}>{children}</div>
);

/** Поверхность-карточка (без теней — глубину даёт цвет поверхности) */
export const Surface: React.FC<React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' }> = ({ className, children, as = 'div', ...rest }) => {
    const Tag = as;
    return <Tag {...rest} className={cn('bg-surface rounded-card', className)}>{children}</Tag>;
};

export const SectionHeader: React.FC<{ title: string; action?: { label: string; onClick: () => void } }> = ({ title, action }) => (
    <div className="flex items-center justify-between mt-6 mb-2 min-h-[44px]">
        <h2 className="text-headline text-fg">{title}</h2>
        {action && (
            <button onClick={action.onClick} className="text-callout text-accent min-h-[44px] px-1 active:opacity-60">{action.label}</button>
        )}
    </div>
);

export const ScreenTitle: React.FC<{ children: React.ReactNode; subtitle?: React.ReactNode }> = ({ children, subtitle }) => (
    <div className="mt-2 mb-4">
        <h1 className="text-title text-fg">{children}</h1>
        {subtitle && <p className="text-callout text-muted mt-1">{subtitle}</p>}
    </div>
);

interface ListRowProps {
    icon?: React.ReactNode;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    value?: React.ReactNode;
    valueSub?: React.ReactNode;
    onClick?: () => void;
    chevron?: boolean;
    className?: string;
}

/** Строка списка: иконка 40 · название · подпись · сумма справа · статус. Нажимается вся строка. */
export const ListRow: React.FC<ListRowProps> = ({ icon, title, subtitle, value, valueSub, onClick, chevron, className }) => {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            onClick={onClick ? () => { haptic.tap(); onClick(); } : undefined}
            className={cn('w-full flex items-center gap-3 px-4 py-3 min-h-[60px] text-left', onClick && 'active:bg-fg/5 transition-colors', className)}
        >
            {icon && <span className="w-10 h-10 rounded-full bg-raised flex items-center justify-center shrink-0 text-fg overflow-hidden">{icon}</span>}
            <span className="flex-1 min-w-0">
                <span className="block text-body text-fg truncate">{title}</span>
                {subtitle && <span className="block text-callout text-muted mt-0.5">{subtitle}</span>}
            </span>
            {(value || valueSub) && (
                <span className="flex flex-col items-end shrink-0 gap-1 text-right">
                    {value && <span className="text-headline text-fg tabular-nums">{value}</span>}
                    {valueSub}
                </span>
            )}
            {chevron && <ChevronRight className="w-5 h-5 text-muted shrink-0" aria-hidden />}
        </Tag>
    );
};

/** Группа строк на поверхности с разделителями */
export const List: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn('bg-surface rounded-card overflow-hidden divide-y divide-line/60', className)}>{children}</div>
);

/** Пустое состояние: иконка, одна фраза, одна кнопка */
export const EmptyState: React.FC<{ icon: React.ReactNode; text: string; action?: { label: string; onClick: () => void } }> = ({ icon, text, action }) => (
    <div className="flex flex-col items-center text-center gap-3 py-10 px-6">
        <span className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-muted">{icon}</span>
        <p className="text-body text-muted max-w-[260px]">{text}</p>
        {action && <Button variant="secondary" onClick={action.onClick}>{action.label}</Button>}
    </div>
);

/** Скелетон: серые плашки по форме контента (вместо размытия и «Live Syncing») */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('bg-fg/10 rounded-control motion-safe:animate-pulse', className)} aria-hidden />
);

export const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
    <div className="bg-surface rounded-card divide-y divide-line/60" aria-busy="true">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
                <Skeleton className="h-4 w-16" />
            </div>
        ))}
    </div>
);

/** Сегменты/фильтры. Подписи переносятся, а не обрезаются. */
export function Segmented<T extends string>({ value, onChange, options, className }: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string; count?: number }[];
    className?: string;
}) {
    return (
        <div className={cn('flex gap-1 p-1 bg-surface rounded-control', className)} role="tablist">
            {options.map(o => (
                <button
                    key={o.value}
                    role="tab"
                    aria-selected={o.value === value}
                    onClick={() => { if (o.value !== value) { haptic.tap(); onChange(o.value); } }}
                    className={cn(
                        'flex-1 min-h-[36px] px-2 py-1 rounded-[9px] text-callout leading-tight transition-colors duration-150',
                        o.value === value ? 'bg-raised text-fg font-semibold' : 'text-muted',
                    )}
                >
                    {o.label}{typeof o.count === 'number' && <span className="ml-1 tabular-nums opacity-70">{o.count}</span>}
                </button>
            ))}
        </div>
    );
}

/** Прогресс цикла: полоса + «осталось N дн.» */
export const ProgressBar: React.FC<{ value: number; label?: React.ReactNode; tone?: 'accent' | 'info' | 'positive' }> = ({ value, label, tone = 'accent' }) => {
    const pct = Math.max(0, Math.min(100, value * 100));
    const color = tone === 'info' ? 'bg-info' : tone === 'positive' ? 'bg-positive' : 'bg-accent';
    return (
        <div>
            <div className="h-1.5 rounded-full bg-fg/10 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <div className={cn('h-full rounded-full transition-[width] duration-300 ease-out', color)} style={{ width: `${pct}%` }} />
            </div>
            {label && <p className="text-caption text-muted mt-1">{label}</p>}
        </div>
    );
};

/** Пара «подпись — значение» для блоков условий и деталей */
export const InfoRow: React.FC<{ label: React.ReactNode; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
        <span className="text-callout text-muted">{label}</span>
        <span className={cn('text-body text-fg text-right tabular-nums break-all', mono && 'font-mono text-callout')}>{value}</span>
    </div>
);
