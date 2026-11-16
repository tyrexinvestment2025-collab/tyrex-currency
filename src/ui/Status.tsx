import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Circle, CheckCircle2, PauseCircle, Tag, Clock, XCircle, Gift } from 'lucide-react';
import { cn } from './cn';
import { fmtDate } from '../lib/format';

/**
 * Единый словарь статусов приложения.
 * Статус всегда показывается тремя способами: цвет + иконка + слово.
 */
type Tone = 'positive' | 'negative' | 'info' | 'neutral' | 'accent';

const TONE: Record<Tone, string> = {
    positive: 'bg-positive/15 text-positive',
    negative: 'bg-negative/15 text-negative',
    info: 'bg-info/15 text-info',
    neutral: 'bg-muted/15 text-muted',
    accent: 'bg-accent/15 text-accent',
};

export const Badge: React.FC<{ tone: Tone; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ tone, icon, children, className }) => (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption whitespace-nowrap', TONE[tone], className)}>
        {icon}
        {children}
    </span>
);

const ic = 'w-3.5 h-3.5';

export type CardStatus = 'Inactive' | 'Active' | 'Cooling' | 'Finished' | 'OnSale';

/** Статус карты: Не запущена · Работает · Пауза до {дата} · Цикл завершён · На продаже */
export const CardStatusBadge: React.FC<{ status: CardStatus; unlockAt?: number | string; isTrial?: boolean }> = ({ status, unlockAt, isTrial }) => {
    const { t } = useTranslation('ui');
    const badge = (() => {
        switch (status) {
            case 'Active': return <Badge tone="positive" icon={<Play className={ic} aria-hidden />}>{t('cardStatus.Active')}</Badge>;
            case 'Cooling': return (
                <Badge tone="info" icon={<PauseCircle className={ic} aria-hidden />}>
                    {unlockAt ? t('cardStatus.CoolingUntil', { date: fmtDate(unlockAt, { day: 'numeric', month: 'short' }) }) : t('cardStatus.Cooling')}
                </Badge>
            );
            case 'Finished': return <Badge tone="neutral" icon={<CheckCircle2 className={ic} aria-hidden />}>{t('cardStatus.Finished')}</Badge>;
            case 'OnSale': return <Badge tone="accent" icon={<Tag className={ic} aria-hidden />}>{t('cardStatus.OnSale')}</Badge>;
            default: return <Badge tone="accent" icon={<Circle className={ic} aria-hidden />}>{t('cardStatus.Inactive')}</Badge>;
        }
    })();
    if (!isTrial) return badge;
    return (
        <span className="inline-flex items-center gap-1 flex-wrap">
            {badge}
            <Badge tone="neutral" icon={<Gift className={ic} aria-hidden />}>{t('gift')}</Badge>
        </span>
    );
};

export type OperationStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSED' | 'REJECTED';

/** Статус операции: В обработке · Зачислено / Выплачено · Отклонено */
export const OperationStatusBadge: React.FC<{ status: OperationStatus; kind: 'DEPOSIT' | 'WITHDRAWAL' | 'INCOME' }> = ({ status, kind }) => {
    const { t } = useTranslation('ui');
    if (status === 'PENDING') return <Badge tone="info" icon={<Clock className={ic} aria-hidden />}>{t('opStatus.pending')}</Badge>;
    if (status === 'REJECTED') return <Badge tone="negative" icon={<XCircle className={ic} aria-hidden />}>{t('opStatus.rejected')}</Badge>;
    return (
        <Badge tone="positive" icon={<CheckCircle2 className={ic} aria-hidden />}>
            {kind === 'WITHDRAWAL' ? t('opStatus.paid') : t('opStatus.credited')}
        </Badge>
    );
};
