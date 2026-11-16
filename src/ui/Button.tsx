import React from 'react';
import { Loader2 } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'text' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    loading?: boolean;
    icon?: React.ReactNode;
    block?: boolean;
    size?: 'md' | 'sm';
}

const VARIANTS: Record<Variant, string> = {
    primary: 'bg-accent bg-gold text-on-accent',
    secondary: 'bg-surface text-fg',
    text: 'bg-transparent text-link',
    danger: 'bg-transparent text-negative',
};

/** Кнопка интерфейса: высота 48 (sm — 36, но зона нажатия ≥ 44), радиус 12 */
export const Button: React.FC<ButtonProps> = ({
    variant = 'primary', loading = false, icon, block = false, size = 'md',
    className, children, disabled, onClick, ...rest
}) => (
    <button
        {...rest}
        disabled={disabled || loading}
        onClick={(e) => { haptic.tap(); onClick?.(e); }}
        className={cn(
            'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-opacity duration-150 ease-out',
            'active:opacity-70 disabled:opacity-40 disabled:active:opacity-40 select-none',
            size === 'md' ? 'min-h-12 py-2 px-5 text-body' : 'min-h-[44px] px-3 text-callout',
            block && 'w-full',
            VARIANTS[variant],
            className,
        )}
    >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : icon}
        {children && <span className="text-center leading-tight">{children}</span>}
    </button>
);

/** Круглая кнопка-действие с подписью (Пополнить / Вывести / История) */
export const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }> = ({ icon, label, onClick, accent }) => (
    <button
        onClick={() => { haptic.tap(); onClick(); }}
        className="flex flex-col items-center gap-2 min-w-[72px] active:opacity-70 transition-opacity"
    >
        <span className={cn('w-14 h-14 rounded-full flex items-center justify-center', accent ? 'bg-accent bg-gold text-on-accent' : 'bg-surface text-fg')}>
            {icon}
        </span>
        <span className="text-callout text-fg text-center leading-tight">{label}</span>
    </button>
);

/** Кнопка-иконка с обязательной подписью для доступности */
export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }> = ({ label, className, children, onClick, ...rest }) => (
    <button
        {...rest}
        aria-label={label}
        title={label}
        onClick={(e) => { haptic.tap(); onClick?.(e); }}
        className={cn('relative w-11 h-11 rounded-full flex items-center justify-center text-fg active:opacity-60', className)}
    >
        {children}
    </button>
);
