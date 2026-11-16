import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, Gift, CheckCircle2, AlertCircle } from 'lucide-react';
import { Sheet, Surface, InfoRow, Button, notify } from '../../ui';
import { userApi, cardsApi, ApiError, type ApiJson } from '../../api/tyrexApi';
import { useSession } from '../../store/useSession';
import { useTyrexStore } from '../../store/useTyrexStore';
import { openLink } from '../../lib/telegram';
import { errorText } from '../../lib/i18nHelpers';
import { fmtDate } from '../../lib/format';

const CHANNEL_URL = 'https://t.me/TYREXcompany';
const TRIAL_DAYS = 30;

type Result = { serial: number; unlockAt?: string };

/** Содержимое листа: монтируется при открытии, поэтому состояние каждый раз начинается заново */
const GiftContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation('gift');
    const navigate = useNavigate();
    const alreadyClaimed = useSession(s => Boolean(s.user?.isTrialActivated));
    const refreshAllData = useSession(s => s.refreshAllData);
    const miniApy = useTyrexStore(s => s.marketCardTypes.find(c => /mini/i.test(c.name))?.clientAPY);

    const [opened, setOpened] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Result | null>(null);

    const openChannel = () => { setOpened(true); openLink(CHANNEL_URL); };

    const claim = async () => {
        setBusy(true);
        setError(null);
        try {
            const sub = await userApi.checkSubscription();
            if (!sub?.success) {
                setError(errorText(new ApiError(400, sub?.code || 'NOT_SUBSCRIBED', '')));
                return;
            }
            const res: ApiJson = await cardsApi.activateTrialCard();
            setResult({ serial: res?.serialNumber ?? res?.card?.serialNumber, unlockAt: res?.card?.unlockAt });
            notify.success(t('done.toast', { serial: res?.serialNumber ?? '' }));
            refreshAllData();
        } catch (e) {
            const code = (e as ApiError)?.code;
            if (code === 'ALREADY_CLAIMED') refreshAllData();
            setError(errorText(e));
            notify.error(e);
        } finally {
            setBusy(false);
        }
    };

    if (result) {
        return (
            <div className="text-center">
                <span className="mx-auto w-16 h-16 rounded-full bg-positive/15 text-positive flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" aria-hidden />
                </span>
                <h3 className="text-title text-fg mt-4">{t('done.title', { serial: result.serial })}</h3>
                <p className="text-body text-muted mt-2">{t('done.text')}</p>
                <Surface className="px-4 mt-4 text-left divide-y divide-line/60">
                    <InfoRow label={t('done.rate')} value={miniApy ? t('done.rateValue', { apy: miniApy }) : '—'} />
                    <InfoRow label={t('done.term')} value={t('done.termValue', { count: TRIAL_DAYS })} />
                    {result.unlockAt && <InfoRow label={t('done.until')} value={fmtDate(result.unlockAt)} />}
                </Surface>
                <p className="text-callout text-muted mt-3 text-left">{t('done.note')}</p>
                <Button block className="mt-5" onClick={() => { onClose(); navigate('/cards'); }}>{t('done.cta')}</Button>
            </div>
        );
    }

    if (alreadyClaimed) {
        return (
            <div className="text-center py-4">
                <span className="mx-auto w-14 h-14 rounded-full bg-surface text-muted flex items-center justify-center"><Gift className="w-7 h-7" aria-hidden /></span>
                <p className="text-headline text-fg mt-4">{t('claimed.title')}</p>
                <p className="text-body text-muted mt-1">{t('claimed.text')}</p>
                <Button variant="secondary" className="mt-5" onClick={() => { onClose(); navigate('/cards'); }}>{t('done.cta')}</Button>
            </div>
        );
    }

    return (
        <div>
            <p className="text-body text-muted">{t('task.intro', { count: TRIAL_DAYS })}</p>

            <ol className="mt-4 space-y-3">
                <li>
                    <Surface className="p-4">
                        <p className="text-caption text-muted">{t('task.step', { n: 1 })}</p>
                        <p className="text-headline text-fg mt-0.5">{t('task.subscribe')}</p>
                        <Button variant="secondary" size="sm" className="mt-3" icon={<Send className="w-4 h-4" aria-hidden />} onClick={openChannel}>
                            {t('task.openChannel')}
                        </Button>
                    </Surface>
                </li>
                <li>
                    <Surface className="p-4">
                        <p className="text-caption text-muted">{t('task.step', { n: 2 })}</p>
                        <p className="text-headline text-fg mt-0.5">{t('task.confirm')}</p>
                        <p className="text-callout text-muted mt-1">{t('task.confirmHint')}</p>
                        <Button className="mt-3" block loading={busy} onClick={claim} variant={opened ? 'primary' : 'secondary'}>
                            {t('task.check')}
                        </Button>
                    </Surface>
                </li>
            </ol>

            {error && (
                <p className="flex items-start gap-2 text-callout text-negative mt-3" role="alert">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /> {error}
                </p>
            )}

            <p className="text-callout text-muted mt-4">{t('task.note')}</p>
        </div>
    );
};

/** Подарок новичку: задание → проверка подписки → «Карта Mini ваша» → к моим картам */
const GiftSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const { t } = useTranslation('gift');
    return (
        <Sheet open={open} onClose={onClose} title={t('title')}>
            <GiftContent onClose={onClose} />
        </Sheet>
    );
};

export default GiftSheet;
