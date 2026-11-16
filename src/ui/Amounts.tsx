import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMoney } from './money';
import { cn } from './cn';

/** Знаковая сумма для ленты операций: +$21.00 / −$333.00 */
export const SignedAmount: React.FC<{ value: number; sign: '+' | '-'; muted?: boolean; className?: string }> = ({ value, sign, muted, className }) => {
    const { primary } = useMoney();
    return (
        <span className={cn('tabular-nums', muted ? 'text-muted line-through' : sign === '+' ? 'text-positive' : 'text-fg', className)}>
            {sign === '+' ? '+' : '−'}{primary(Math.abs(value))}
        </span>
    );
};

/** Блок баланса: крупная сумма, вторая валюта, строка дохода за день. Нажатие — «Как считается». */
export const BalanceBlock: React.FC<{
    label: string;
    valueUsd: number;
    todayUsd?: number;
    loading?: boolean;
    onExplain?: () => void;
}> = ({ label, valueUsd, todayUsd, loading, onExplain }) => {
    const { t } = useTranslation('ui');
    const { primary, secondary, priceReady, hideBalance } = useMoney();
    const Tag = onExplain ? 'button' : 'div';
    return (
        <Tag onClick={onExplain} className="w-full text-center py-6 px-4 hero-card border border-line/60 rounded-card active:opacity-80 transition-opacity">
            <p className="text-callout text-muted">{label}</p>
            {loading ? (
                <div className="h-10 w-40 mx-auto my-1 bg-fg/10 rounded-control motion-safe:animate-pulse" />
            ) : (
                <p className="text-display text-fg tabular-nums mt-1 break-words">{primary(valueUsd, { balance: true })}</p>
            )}
            {!loading && secondary(valueUsd, { balance: true }) && (
                <p className="text-callout text-muted tabular-nums">{secondary(valueUsd, { balance: true })}</p>
            )}
            {!loading && !priceReady && <p className="text-caption text-muted mt-1">{t('priceSyncing')}</p>}
            {!loading && typeof todayUsd === 'number' && todayUsd > 0 && !hideBalance && (
                <p className="text-callout text-positive tabular-nums mt-1">{t('perDay', { amount: primary(todayUsd) })}</p>
            )}
        </Tag>
    );
};
