import React from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { Sheet, Surface, InfoRow, OperationStatusBadge, SignedAmount, Button, notify } from '../../ui';
import { type Operation, operationSign, useOperationTitle } from '../operations/operations';
import { copyText, openLink } from '../../lib/telegram';
import { fmtUsd, fmtDateTime, fmtInt } from '../../lib/format';
import { SUPPORT_URL, btcTxUrl, tronAddressUrl } from './validation';

/** Детали операции: статус, сумма, дата, хэш/адрес, расшифровка дохода, комментарий админа, поддержка */
const OperationDetailsSheet: React.FC<{ op: Operation | null; onClose: () => void }> = ({ op, onClose }) => {
    const { t } = useTranslation('wallet');
    const title = useOperationTitle();

    const copy = async (text: string) => {
        if (await copyText(text)) notify.success(t('common:actions.copied'));
    };

    const ref = op?.meta || '';
    const explorerUrl = !ref ? null : op?.type === 'DEPOSIT' ? btcTxUrl(ref) : op?.type === 'WITHDRAWAL' ? tronAddressUrl(ref) : null;
    const d = op?.details || {};

    return (
        <Sheet open={Boolean(op)} onClose={onClose} title={t('details.title')}>
            {op && (
                <>
                    <div className="text-center py-4">
                        <p className="text-callout text-muted">{title(op)}</p>
                        <p className="text-display mt-1">
                            <SignedAmount value={op.amount} sign={operationSign(op)} muted={op.status === 'REJECTED'} />
                        </p>
                        <div className="mt-2 flex justify-center"><OperationStatusBadge status={op.status} kind={op.type} /></div>
                    </div>

                    <Surface className="px-4 divide-y divide-line/60">
                        <InfoRow label={t('details.date')} value={fmtDateTime(op.date)} />
                        <InfoRow label={t('details.amount')} value={fmtUsd(op.amount)} />
                        {op.type === 'INCOME' && op.subtype === 'CARD_PAYOUT' && (
                            <>
                                {typeof d.principalUsd === 'number' && <InfoRow label={t('details.principal')} value={fmtUsd(d.principalUsd)} />}
                                {typeof d.profitUsd === 'number' && <InfoRow label={t('details.profit')} value={fmtUsd(d.profitUsd)} />}
                            </>
                        )}
                        {op.type === 'INCOME' && op.subtype === 'REFERRAL_CLAIM' && (
                            <>
                                {typeof d.sats === 'number' && <InfoRow label={t('details.sats')} value={t('details.satsValue', { sats: fmtInt(d.sats) })} />}
                                {typeof d.btcPrice === 'number' && <InfoRow label={t('details.rate')} value={fmtUsd(d.btcPrice)} />}
                            </>
                        )}
                        {op.type === 'INCOME' && op.subtype === 'CARD_REFUND' && (
                            <InfoRow label={t('details.refundNote')} value={t('details.refundValue')} />
                        )}
                        {op.type === 'DEPOSIT' && <InfoRow label={t('details.network')} value="Bitcoin" />}
                        {op.type === 'WITHDRAWAL' && <InfoRow label={t('details.network')} value="USDT · TRC20" />}
                    </Surface>

                    {ref && (
                        <Surface className="px-4 py-3 mt-3">
                            <p className="text-callout text-muted">{op.type === 'DEPOSIT' ? t('details.hash') : t('details.address')}</p>
                            <p className="font-mono text-callout text-fg break-all mt-1">{ref}</p>
                            <div className="flex flex-wrap gap-x-4">
                                <Button size="sm" variant="text" className="px-0" icon={<Copy className="w-4 h-4" aria-hidden />} onClick={() => copy(ref)}>
                                    {t('common:actions.copy')}
                                </Button>
                                {explorerUrl && (
                                    <Button size="sm" variant="text" className="px-0" icon={<ExternalLink className="w-4 h-4" aria-hidden />} onClick={() => openLink(explorerUrl)}>
                                        {t('details.explorer')}
                                    </Button>
                                )}
                            </div>
                        </Surface>
                    )}

                    {op.status === 'PENDING' && (
                        <p className="text-callout text-info mt-3">
                            {op.type === 'DEPOSIT' ? t('details.pendingDeposit') : t('details.pendingWithdrawal')}
                        </p>
                    )}

                    {op.adminComment && (
                        <Surface className="px-4 py-3 mt-3">
                            <p className="text-callout text-muted">{t('details.adminComment')}</p>
                            <p className="text-body text-fg mt-1 whitespace-pre-line">{op.adminComment}</p>
                        </Surface>
                    )}

                    <Button
                        block
                        variant="secondary"
                        className="mt-4"
                        icon={<MessageCircle className="w-5 h-5" strokeWidth={1.75} aria-hidden />}
                        onClick={() => openLink(SUPPORT_URL)}
                    >
                        {t('details.support')}
                    </Button>
                </>
            )}
        </Sheet>
    );
};

export default OperationDetailsSheet;
