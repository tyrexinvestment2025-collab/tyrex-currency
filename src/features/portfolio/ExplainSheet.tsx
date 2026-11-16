import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, InfoRow, Surface, useMoney } from '../../ui';
import { usePortfolio } from './usePortfolio';
import { fmtUsd, fmtDateTime } from '../../lib/format';

/** «Как считается»: из чего состоит сумма активов и доход за день */
const ExplainSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const { t } = useTranslation('home');
    const p = usePortfolio();
    const { usd } = useMoney();
    const [openedAt] = useState(() => Date.now());

    return (
        <Sheet open={open} onClose={onClose} title={t('explain.title')}>
            <Surface className="px-4 divide-y divide-line/60">
                <InfoRow label={t('explain.wallet')} value={usd(p.walletUsd)} />
                <InfoRow label={t('explain.pending')} value={usd(p.pendingUsd)} />
                <InfoRow label={t('explain.cards')} value={usd(p.cardsUsd)} />
                <InfoRow label={t('explain.accrued')} value={usd(p.accruedUsd)} />
                <InfoRow label={<span className="text-fg font-semibold">{t('explain.total')}</span>} value={<span className="font-semibold">{usd(p.totalUsd)}</span>} />
            </Surface>

            <p className="text-callout text-muted mt-3">{t('explain.cardsNote')}</p>

            <h3 className="text-headline text-fg mt-6 mb-2">{t('explain.dailyTitle')}</h3>
            <Surface className="px-4 py-3">
                <p className="text-body text-fg">{t('explain.dailyFormula')}</p>
                <p className="text-callout text-muted mt-2">{t('explain.dailyNote')}</p>
            </Surface>

            <Surface className="px-4 mt-3 divide-y divide-line/60">
                <InfoRow label={t('explain.btcRate')} value={p.btcPrice > 0 ? fmtUsd(p.btcPrice) : '—'} />
                <InfoRow label={t('explain.updated')} value={fmtDateTime(openedAt)} />
            </Surface>
            <p className="text-callout text-muted mt-3">{t('explain.rateNote')}</p>
        </Sheet>
    );
};

export default ExplainSheet;
