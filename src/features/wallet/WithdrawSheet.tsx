import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, AmountInput, AddressInput, Surface, InfoRow, notify } from '../../ui';
import { useClosingConfirmation } from '../../lib/tgButtons';
import { showConfirm } from '../../lib/telegram';
import { fmtUsd } from '../../lib/format';
import { userApi } from '../../api/tyrexApi';
import { useSession } from '../../store/useSession';
import { usePortfolio } from '../portfolio/usePortfolio';
import { parseAmount, shorten } from './validation';
import { isValidTronAddress } from '../../lib/tron';

/** Вывод USDT TRC20: сумма с «Макс.», адрес со сканером QR, комиссия и сумма к получению, подтверждение */
const WithdrawSheet: React.FC<{ open: boolean; onClose: () => void; onSubmitted: () => void }> = ({ open, onClose, onSubmitted }) => {
    const { t } = useTranslation('wallet');
    const { walletUsd } = usePortfolio();
    const minWithdrawal = useSession(s => s.config.minWithdrawalUsd) ?? 10;

    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const amountNum = parseAmount(amount);
    const addr = address.trim();

    const amountError = amount === '' ? null
        : !(amountNum > 0) ? t('errors:INVALID_AMOUNT')
        : amountNum < minWithdrawal ? t('errors:BELOW_MINIMUM', { min: minWithdrawal })
        : amountNum > walletUsd ? t('errors:INSUFFICIENT_BALANCE')
        : null;
    const addressError = addr !== '' && !isValidTronAddress(addr) ? t('errors:INVALID_ADDRESS') : null;
    const valid = amount !== '' && !amountError && isValidTronAddress(addr);

    useClosingConfirmation(open && (amount !== '' || address !== ''));

    const close = () => {
        onClose();
        setAmount('');
        setAddress('');
        setLoading(false);
    };

    const submit = async () => {
        if (!valid) return;
        const ok = await showConfirm(t('withdraw.confirm', { amount: fmtUsd(amountNum), address: shorten(addr) }));
        if (!ok) return;
        setLoading(true);
        try {
            await userApi.requestWithdrawal(amountNum, addr);
            notify.success(t('withdraw.success'));
            onSubmitted();
            close();
        } catch (e) {
            notify.error(e);
            setLoading(false);
        }
    };

    const receive = amountNum > 0 ? amountNum : 0;

    return (
        <Sheet
            open={open}
            onClose={close}
            title={t('withdraw.title')}
            action={{ text: t('withdraw.submit'), onClick: submit, disabled: !valid, loading }}
        >
            <div className="space-y-4">
                <AmountInput
                    label={t('withdraw.amountLabel')}
                    value={amount}
                    onChange={setAmount}
                    max={walletUsd}
                    error={amountError}
                    hint={t('withdraw.available', { amount: fmtUsd(walletUsd), min: fmtUsd(minWithdrawal) })}
                />
                <AddressInput
                    label={t('withdraw.addressLabel')}
                    value={address}
                    onChange={setAddress}
                    placeholder="T…"
                    error={addressError}
                    hint={t('withdraw.addressHint')}
                    scanHint={t('withdraw.scanHint')}
                />
                <Surface className="px-4 divide-y divide-line/60">
                    <InfoRow label={t('withdraw.network')} value="USDT · TRC20" />
                    <InfoRow label={t('withdraw.fee')} value={fmtUsd(0)} />
                    <InfoRow label={<span className="text-fg font-semibold">{t('withdraw.receive')}</span>} value={<span className="font-semibold">{fmtUsd(receive)}</span>} />
                </Surface>
                <p className="text-callout text-muted">{t('withdraw.term')}</p>
            </div>
        </Sheet>
    );
};

export default WithdrawSheet;
