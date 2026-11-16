import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, Surface } from '../../ui';

/**
 * Информационные листы: «Как это работает», «Откуда доход и риски», «Условия», «Конфиденциальность».
 * TODO(legal): финальные формулировки про доходность, риски и условия согласовать с юристом.
 */
export type InfoKind = 'how' | 'risks' | 'terms' | 'privacy';

const SECTIONS: Record<InfoKind, string[]> = {
    how: ['card', 'start', 'cycle', 'pause', 'sell', 'wallet'],
    risks: ['source', 'rate', 'btc', 'manual', 'loss'],
    terms: ['cards', 'cycle', 'sell', 'rate', 'deposits', 'withdrawals', 'risk', 'changes'],
    privacy: ['data', 'use', 'share', 'delete'],
};

export const InfoSheet: React.FC<{ kind: InfoKind | null; onClose: () => void }> = ({ kind, onClose }) => {
    const { t } = useTranslation('profile2');
    return (
        <Sheet open={kind !== null} onClose={onClose} title={kind ? t(`info.${kind}.title`) : ''}>
            {kind && (
                <div className="space-y-3">
                    {t(`info.${kind}.intro`, { defaultValue: '' }) && (
                        <p className="text-body text-muted">{t(`info.${kind}.intro`)}</p>
                    )}
                    {SECTIONS[kind].map(s => (
                        <Surface key={s} className="p-4">
                            <h3 className="text-headline text-fg">{t(`info.${kind}.${s}.title`)}</h3>
                            <p className="text-body text-muted mt-1 whitespace-pre-line">{t(`info.${kind}.${s}.text`)}</p>
                        </Surface>
                    ))}
                    {kind !== 'privacy' && <p className="text-callout text-muted">{t('info.disclaimer')}</p>}
                </div>
            )}
        </Sheet>
    );
};
