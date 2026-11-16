import React from 'react';
import { useTgMainButton } from '../lib/tgButtons';
import { Button } from './Button';

/**
 * Главное действие экрана: нативная MainButton Telegram,
 * вне Telegram — закреплённая кнопка над навигацией.
 */
export const MainAction: React.FC<{ text: string; onClick: () => void; disabled?: boolean; loading?: boolean; visible?: boolean }> = (p) => {
    const native = useTgMainButton({ text: p.text, onClick: p.onClick, disabled: p.disabled, loading: p.loading, visible: p.visible });
    if (native || p.visible === false) return null;
    return (
        <div className="sticky pt-3 pb-2 bg-bg z-30" style={{ bottom: 'var(--tabbar-h, 0px)' }}>
            <Button block onClick={p.onClick} disabled={p.disabled} loading={p.loading}>{p.text}</Button>
        </div>
    );
};
