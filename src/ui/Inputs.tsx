import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardPaste, ScanLine } from 'lucide-react';
import { cn } from './cn';
import { scanQr, qrScanAvailable } from '../lib/tgButtons';
import { haptic } from '../lib/telegram';

interface AmountInputProps {
    value: string;
    onChange: (v: string) => void;
    label: string;
    currency?: string;
    max?: number;
    error?: string | null;
    hint?: React.ReactNode;
    autoFocus?: boolean;
}

/** Поле суммы: крупное число, валюта справа, кнопка «Макс.», ошибка под полем */
export const AmountInput: React.FC<AmountInputProps> = ({ value, onChange, label, currency = 'USD', max, error, hint, autoFocus }) => {
    const { t } = useTranslation('ui');
    const id = useId();
    const sanitize = (raw: string) => {
        let v = raw.replace(',', '.').replace(/[^\d.]/g, '');
        const [int, ...rest] = v.split('.');
        if (rest.length) v = `${int}.${rest.join('').slice(0, 2)}`;
        return v;
    };
    return (
        <div>
            <label htmlFor={id} className="text-callout text-muted">{label}</label>
            <div className={cn('mt-1.5 flex items-center gap-2 bg-surface rounded-control px-4 h-16 border', error ? 'border-negative' : 'border-transparent focus-within:border-link')}>
                <input
                    id={id}
                    inputMode="decimal"
                    autoComplete="off"
                    autoFocus={autoFocus}
                    value={value}
                    onChange={(e) => onChange(sanitize(e.target.value))}
                    placeholder="0"
                    className="flex-1 min-w-0 bg-transparent outline-none text-title text-fg tabular-nums placeholder:text-muted/50"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-err` : undefined}
                />
                <span className="text-body text-muted">{currency}</span>
                {typeof max === 'number' && max > 0 && (
                    <button
                        type="button"
                        onClick={() => { haptic.tap(); onChange((Math.floor(max * 100) / 100).toFixed(2)); }}
                        className="text-callout font-semibold text-link min-h-[44px] px-2 active:opacity-60"
                    >
                        {t('max')}
                    </button>
                )}
            </div>
            {error ? <p id={`${id}-err`} className="text-callout text-negative mt-1.5">{error}</p> : hint && <p className="text-callout text-muted mt-1.5">{hint}</p>}
        </div>
    );
};

interface AddressInputProps {
    value: string;
    onChange: (v: string) => void;
    label: string;
    placeholder?: string;
    error?: string | null;
    hint?: React.ReactNode;
    scanHint?: string;
}

/** Поле адреса/хэша: моноширинный текст, «Вставить», «Сканировать QR» (если доступно) */
export const AddressInput: React.FC<AddressInputProps> = ({ value, onChange, label, placeholder, error, hint, scanHint }) => {
    const { t } = useTranslation('ui');
    const id = useId();

    const paste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) { haptic.tap(); onChange(text.trim()); }
        } catch { /* буфер недоступен в этом клиенте */ }
    };
    const scan = async () => {
        const v = await scanQr(scanHint || t('scanHint'));
        if (v) { haptic.success(); onChange(v.replace(/^[a-z]+:/i, '').split('?')[0].trim()); }
    };

    return (
        <div>
            <label htmlFor={id} className="text-callout text-muted">{label}</label>
            <div className={cn('mt-1.5 bg-surface rounded-control border', error ? 'border-negative' : 'border-transparent focus-within:border-link')}>
                <textarea
                    id={id}
                    rows={2}
                    value={value}
                    onChange={(e) => onChange(e.target.value.trim())}
                    placeholder={placeholder}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="w-full resize-none bg-transparent outline-none px-4 pt-3 font-mono text-callout text-fg break-all placeholder:text-muted/60"
                    aria-invalid={Boolean(error)}
                />
                <div className="flex gap-1 px-2 pb-1">
                    <button type="button" onClick={paste} className="flex items-center gap-1.5 text-callout text-link min-h-[44px] px-2 active:opacity-60">
                        <ClipboardPaste className="w-4 h-4" aria-hidden /> {t('paste')}
                    </button>
                    {qrScanAvailable() && (
                        <button type="button" onClick={scan} className="flex items-center gap-1.5 text-callout text-link min-h-[44px] px-2 active:opacity-60">
                            <ScanLine className="w-4 h-4" aria-hidden /> {t('scanQr')}
                        </button>
                    )}
                </div>
            </div>
            {error ? <p className="text-callout text-negative mt-1.5">{error}</p> : hint && <p className="text-callout text-muted mt-1.5">{hint}</p>}
        </div>
    );
};

/** Переключатель (для настроек) */
export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => { haptic.tap(); onChange(!checked); }}
        className={cn('relative w-12 h-7 rounded-full transition-colors duration-150 shrink-0', checked ? 'bg-accent' : 'bg-fg/20')}
    >
        <span className={cn('absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform duration-150 ease-out', checked && 'translate-x-5')} />
    </button>
);
