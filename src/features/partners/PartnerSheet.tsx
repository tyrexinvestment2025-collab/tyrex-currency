import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, Surface, InfoRow, Segmented, useMoney } from '../../ui';
import { openLink, copyText, haptic } from '../../lib/telegram';
import { fmtDate } from '../../lib/format';
import { simpleStatus, type PartnerItem } from './types';

type Tone = 'friendly' | 'short';

/** Лист партнёра: детали + «Написать» с нейтральными текстами-подсказками */
const PartnerSheet: React.FC<{ partner: PartnerItem | null; onClose: () => void }> = ({ partner, onClose }) => {
    const { t } = useTranslation('partners');
    const { primary, btcPrice } = useMoney();
    const satsToUsd = (s: number) => (btcPrice > 0 ? (s / 100_000_000) * btcPrice : 0);
    const [tone, setTone] = useState<Tone>('friendly');

    const status = simpleStatus(partner?.status);
    const sats = partner?.myProfitFromHimSats || 0;
    const message = partner ? t(`scripts.${status}.${tone}`) : '';
    const tg = partner?.tgUsername?.replace(/^@/, '') || null;

    const write = async () => {
        if (!tg) return;
        await copyText(message);
        haptic.success();
        openLink(`https://t.me/${tg}`);
    };

    return (
        <Sheet
            open={Boolean(partner)}
            onClose={onClose}
            title={partner?.username || t('list.anonymous')}
            action={tg ? { text: t('sheet.write'), onClick: write } : undefined}
        >
            {partner && (
                <>
                    <Surface className="px-4 divide-y divide-line/60">
                        <InfoRow label={t('sheet.status')} value={t(`status.${status}`)} />
                        <InfoRow label={t('sheet.registered')} value={fmtDate(partner.registrationDate)} />
                        <InfoRow
                            label={t('sheet.yourIncome')}
                            value={<>{primary(satsToUsd(sats))}<span className="block text-caption text-muted">{t('sheet.sats', { count: sats })}</span></>}
                        />
                        <InfoRow label={t('sheet.lastReward')} value={partner.lastRewardDate ? fmtDate(partner.lastRewardDate) : '—'} />
                    </Surface>

                    <h3 className="text-headline text-fg mt-6 mb-2">{t('sheet.messageTitle')}</h3>
                    <Segmented<Tone>
                        value={tone}
                        onChange={setTone}
                        options={[{ value: 'friendly', label: t('sheet.toneFriendly') }, { value: 'short', label: t('sheet.toneShort') }]}
                    />
                    <Surface className="px-4 py-3 mt-2">
                        <p className="text-body text-fg whitespace-pre-line">{message}</p>
                    </Surface>
                    <p className="text-callout text-muted mt-2">{tg ? t('sheet.writeHint') : t('sheet.noUsername')}</p>
                </>
            )}
        </Sheet>
    );
};

export default PartnerSheet;
