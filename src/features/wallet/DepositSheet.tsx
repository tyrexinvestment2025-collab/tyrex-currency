import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, CheckCircle2, Clock } from 'lucide-react';
import { Sheet, AmountInput, AddressInput, Surface, InfoRow, Button, notify, fmtBtcAmount, type SheetAction } from '../../ui';
import { useClosingConfirmation } from '../../lib/tgButtons';
import { copyText } from '../../lib/telegram';
import { errorText } from '../../lib/i18nHelpers';
import type { ApiError } from '../../api/tyrexApi';
import { fmtUsd } from '../../lib/format';
import { userApi } from '../../api/tyrexApi';
import { useSession } from '../../store/useSession';
import { useTyrexStore } from '../../store/useTyrexStore';
import { BTC_TXID_RE, parseAmount } from './validation';

const FALLBACK_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

type Step = 'amount' | 'send' | 'hash' | 'done';

/**
 * Пополнение в 3 шага: сумма → адрес, QR и сумма в BTC → хэш транзакции.
 * Зачисление подтверждает администратор вручную — так и пишем.
 */
const DepositSheet: React.FC<{ open: boolean; onClose: () => void; onSubmitted: () => void }> = ({ open, onClose, onSubmitted }) => {
    const { t } = useTranslation('wallet');
    const address = useSession(s => s.config.depositBtcAddress) || FALLBACK_ADDRESS;
    const btcPrice = useTyrexStore(s => s.btcPrice);

    const [step, setStep] = useState<Step>('amount');
    const [amount, setAmount] = useState('');
    const [hash, setHash] = useState('');
    const [loading, setLoading] = useState(false);
    // Ошибка сервера по хэшу (повтор, неверный формат) — прямо под полем, а не только во всплывающем уведомлении
    const [hashServerError, setHashServerError] = useState<string | null>(null);
    const [copied, setCopied] = useState<'address' | 'amount' | null>(null);

    const amountNum = parseAmount(amount);
    const amountValid = amountNum > 0;
    const btcToSend = btcPrice > 0 && amountValid ? amountNum / btcPrice : 0;
    const btcText = btcToSend > 0 ? btcToSend.toFixed(8) : '';
    const hashTrim = hash.trim();
    const hashValid = BTC_TXID_RE.test(hashTrim);

    const dirty = step !== 'done' && (amount !== '' || hash !== '');
    useClosingConfirmation(open && dirty);

    const close = () => {
        onClose();
        setStep('amount');
        setAmount('');
        setHash('');
        setHashServerError(null);
        setLoading(false);
    };

    const copy = async (text: string, which: 'address' | 'amount') => {
        if (await copyText(text)) {
            notify.success(t('common:actions.copied'));
            setCopied(which);
            setTimeout(() => setCopied(c => (c === which ? null : c)), 2000);
        }
    };

    const submit = async () => {
        if (!hashValid || !amountValid) return;
        setLoading(true);
        try {
            await userApi.requestDeposit(amountNum, hashTrim.toLowerCase());
            setStep('done');
            onSubmitted();
        } catch (e) {
            const code = (e as ApiError)?.code;
            if (code === 'DUPLICATE_TX' || code === 'INVALID_TX_HASH') setHashServerError(errorText(e));
            notify.error(e);
        } finally {
            setLoading(false);
        }
    };

    const action: SheetAction = (() => {
        switch (step) {
            case 'amount': return { text: t('deposit.next'), onClick: () => setStep('send'), disabled: !amountValid };
            case 'send': return { text: t('deposit.sent'), onClick: () => setStep('hash'), disabled: !(btcToSend > 0) };
            case 'hash': return { text: t('deposit.submit'), onClick: submit, disabled: !hashValid, loading };
            default: return { text: t('common:actions.done'), onClick: close };
        }
    })();

    const stepNo = step === 'amount' ? 1 : step === 'send' ? 2 : step === 'hash' ? 3 : null;

    return (
        <Sheet open={open} onClose={close} title={t('deposit.title')} action={action}>
            {stepNo && <p className="text-callout text-muted mb-3">{t('deposit.step', { current: stepNo, total: 3 })}</p>}

            {step === 'amount' && (
                <>
                    <AmountInput
                        label={t('deposit.amountLabel')}
                        value={amount}
                        onChange={setAmount}
                        autoFocus
                        error={amount !== '' && !amountValid ? t('errors:INVALID_AMOUNT') : null}
                        hint={t('deposit.amountHint')}
                    />
                    {btcToSend > 0 && (
                        <p className="text-callout text-muted mt-3 tabular-nums">{t('deposit.approx', { btc: fmtBtcAmount(btcToSend, 'detail') })}</p>
                    )}
                </>
            )}

            {step === 'send' && (
                <>
                    <p className="text-body text-fg">{t('deposit.sendText', { amount: fmtUsd(amountNum) })}</p>
                    <div className="flex justify-center my-4">
                        <div className="bg-white p-3 rounded-card">
                            <QRCodeSVG value={`bitcoin:${address}${btcText ? `?amount=${btcText}` : ''}`} size={176} level="M" />
                        </div>
                    </div>
                    <Surface className="px-4 divide-y divide-line/60">
                        <div className="py-3">
                            <p className="text-callout text-muted">{t('deposit.address')}</p>
                            <p className="font-mono text-callout text-fg break-all mt-1">{address}</p>
                            <Button size="sm" variant="text" className="px-0" icon={copied === 'address' ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />} onClick={() => copy(address, 'address')}>
                                {copied === 'address' ? t('common:actions.copied') : t('deposit.copyAddress')}
                            </Button>
                        </div>
                        <div className="py-3">
                            <p className="text-callout text-muted">{t('deposit.btcAmount')}</p>
                            <p className="text-headline text-fg tabular-nums mt-1">{btcText ? `${btcText} BTC` : '…'}</p>
                            {btcText && (
                                <Button size="sm" variant="text" className="px-0" icon={copied === 'amount' ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />} onClick={() => copy(btcText, 'amount')}>
                                    {copied === 'amount' ? t('common:actions.copied') : t('deposit.copyAmount')}
                                </Button>
                            )}
                        </div>
                    </Surface>
                    <p className="text-callout text-muted mt-3">{t('deposit.networkNote')}</p>
                    {btcPrice > 0 && <p className="text-callout text-muted mt-1">{t('deposit.rateNote', { rate: fmtUsd(btcPrice) })}</p>}
                </>
            )}

            {step === 'hash' && (
                <>
                    <AddressInput
                        label={t('deposit.hashLabel')}
                        value={hash}
                        onChange={(v) => { setHash(v); setHashServerError(null); }}
                        placeholder={t('deposit.hashPlaceholder')}
                        error={hash !== '' && !hashValid ? t('errors:INVALID_TX_HASH') : hashServerError}
                        hint={t('deposit.hashHint')}
                        scanHint={t('deposit.scanHint')}
                    />
                    <Surface className="px-4 mt-4 divide-y divide-line/60">
                        <InfoRow label={t('deposit.summaryAmount')} value={fmtUsd(amountNum)} />
                        {btcText && <InfoRow label={t('deposit.btcAmount')} value={`${btcText} BTC`} />}
                    </Surface>
                </>
            )}

            {step === 'done' && (
                <div className="flex flex-col items-center text-center py-6 gap-3">
                    <span className="w-14 h-14 rounded-full bg-positive/15 text-positive flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h3 className="text-headline text-fg">{t('deposit.doneTitle')}</h3>
                    <p className="text-body text-muted max-w-[300px]">{t('deposit.doneText', { amount: fmtUsd(amountNum) })}</p>
                    <p className="flex items-center gap-1.5 text-callout text-info"><Clock className="w-4 h-4" aria-hidden />{t('deposit.doneTerm')}</p>
                </div>
            )}
        </Sheet>
    );
};

export default DepositSheet;
