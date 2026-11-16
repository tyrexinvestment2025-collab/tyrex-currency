import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTgBackButton, useDisableVerticalSwipes, useTgMainButton } from '../lib/tgButtons';
import { Button } from './Button';
import { cn } from './cn';

export interface SheetAction {
    text: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
}

interface SheetProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    /** Главное действие листа — нативная MainButton Telegram (или кнопка внизу вне Telegram) */
    action?: SheetAction;
    /** Дополнительное содержимое закреплённой нижней панели (над главной кнопкой) */
    footer?: React.ReactNode;
    className?: string;
}

/** Главная кнопка листа: живёт, только пока лист открыт */
const SheetMainAction: React.FC<{ action: SheetAction }> = ({ action }) => {
    const native = useTgMainButton({ text: action.text, onClick: action.onClick, disabled: action.disabled, loading: action.loading });
    if (native) return null;
    return <Button block onClick={action.onClick} disabled={action.disabled} loading={action.loading}>{action.text}</Button>;
};

const SheetBody: React.FC<SheetProps> = ({ onClose, title, children, action, footer, className }) => {
    const { t } = useTranslation('ui');
    const reduce = useReducedMotion();
    const scrollRef = useRef<HTMLDivElement>(null);

    useTgBackButton(onClose);
    useDisableVerticalSwipes(true);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const onPanEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.y > 80 || info.velocity.y > 500) onClose();
    };

    const hasFooter = Boolean(footer || action);

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" role="dialog" aria-modal="true">
            <motion.div
                className="absolute inset-0 bg-black/50"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
                onClick={onClose}
            />
            <motion.div
                className={cn('relative w-full max-w-app bg-raised rounded-t-sheet flex flex-col', className)}
                style={{ maxHeight: 'calc(90vh - var(--safe-top))' }}
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={reduce ? { duration: 0 } : { type: 'spring', damping: 32, stiffness: 320, mass: 0.9 }}
            >
                {/* Ручка: за неё можно тянуть вниз */}
                <motion.div
                    className="pt-2 pb-1 flex justify-center cursor-grab touch-none"
                    onPanEnd={onPanEnd}
                    aria-hidden
                >
                    <span className="w-9 h-1 rounded-full bg-line" />
                </motion.div>

                <div className="flex items-center justify-between px-4 pb-2 min-h-[44px]">
                    <h2 className="text-headline text-fg">{title}</h2>
                    <button onClick={onClose} className="text-callout text-muted min-h-[44px] px-2 -mr-2 active:opacity-60">
                        {t('close')}
                    </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                    {children}
                </div>

                {hasFooter && (
                    <div className="px-4 pt-2 border-t border-line/60 flex flex-col gap-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}>
                        {footer}
                        {action && <SheetMainAction action={action} />}
                    </div>
                )}
                {!hasFooter && <div style={{ height: 'var(--safe-bottom)' }} />}
            </motion.div>
        </div>
    );
};

/**
 * Нижний лист: ручка, заголовок, прокручиваемое содержимое, главная кнопка внизу.
 * До 90% высоты; закрывается свайпом вниз за ручку, тапом по фону, BackButton Telegram и Esc.
 */
export const Sheet: React.FC<SheetProps> = (props) =>
    createPortal(
        <AnimatePresence>{props.open && <SheetBody key="sheet" {...props} />}</AnimatePresence>,
        document.body,
    );
