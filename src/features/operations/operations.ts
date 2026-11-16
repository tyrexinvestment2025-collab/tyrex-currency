import { useTranslation } from 'react-i18next';
import type { OperationStatus } from '../../ui';

/** Элемент истории с бэка (/user/history) */
export interface Operation {
    id: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'INCOME';
    /** Для INCOME: CARD_PAYOUT | CARD_REFUND | REFERRAL_CLAIM */
    subtype?: 'CARD_PAYOUT' | 'CARD_REFUND' | 'REFERRAL_CLAIM';
    amount: number;
    status: OperationStatus;
    date: string;
    /** txHash для депозита, адрес для вывода */
    meta?: string | null;
    adminComment?: string | null;
    details?: { cardName?: string; serialNumber?: number; principalUsd?: number; profitUsd?: number; sats?: number; btcPrice?: number };
}

export const operationSign = (op: Operation): '+' | '-' => (op.type === 'WITHDRAWAL' ? '-' : '+');

/** Название операции на языке пользователя */
export const useOperationTitle = () => {
    const { t } = useTranslation('operations');
    return (op: Operation): string => {
        if (op.type === 'DEPOSIT') return t('type.deposit');
        if (op.type === 'WITHDRAWAL') return t('type.withdrawal');
        if (op.subtype === 'REFERRAL_CLAIM') return t('type.referral');
        if (op.subtype === 'CARD_REFUND') return op.details?.cardName ? t('type.refundCard', { card: op.details.cardName, serial: op.details.serialNumber }) : t('type.refund');
        return op.details?.cardName ? t('type.payoutCard', { card: op.details.cardName, serial: op.details.serialNumber }) : t('type.payout');
    };
};
