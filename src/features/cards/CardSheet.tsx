import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Play, PauseCircle, Undo2, History as HistoryIcon } from 'lucide-react';
import {
    Sheet, Segmented, Surface, InfoRow, CardStatusBadge, ProgressBar, List, ListRow,
    EmptyState, SkeletonRows, Button, notify, fmtBtcAmount, type SheetAction,
} from '../../ui';
import type { TyrexCard } from '../../store/useTyrexStore';
import { useTyrexStore } from '../../store/useTyrexStore';
import { useSession } from '../../store/useSession';
import { cardsApi } from '../../api/tyrexApi';
import { showConfirm } from '../../lib/telegram';
import { fmtUsd, fmtDate, fmtPct } from '../../lib/format';
import { cardDailyUsd } from '../portfolio/usePortfolio';
import CardThumb from './CardThumb';
import { COOLING_DAYS, cycleProgress, daysLeft } from './cardRules';

interface HistoryRecord {
    _id: string;
    eventType: 'MINING_SESSION' | 'PURCHASE' | 'SOLD_BACK';
    profitUsd?: unknown;
    priceUsd?: unknown;
    createdAt: string;
    userId?: { username?: string } | null;
}

const num = (v: unknown): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && v && '$numberDecimal' in v) return parseFloat(String((v as { $numberDecimal: string }).$numberDecimal)) || 0;
    return parseFloat(String(v)) || 0;
};

type Tab = 'manage' | 'history';

const HistoryTab: React.FC<{ card: TyrexCard }> = ({ card }) => {
    const { t } = useTranslation('cards');
    const [items, setItems] = useState<HistoryRecord[] | null>(null);

    useEffect(() => {
        let alive = true;
        if (card.serialNumber === undefined) return;
        cardsApi.getHistoryBySerial(card.cardTypeId, card.serialNumber)
            .then(d => { if (alive) setItems(Array.isArray(d) ? (d as HistoryRecord[]) : []); })
            .catch(() => { if (alive) setItems([]); });
        return () => { alive = false; };
    }, [card.cardTypeId, card.serialNumber]);

    if (items === null) return <SkeletonRows rows={3} />;
    if (items.length === 0) return <EmptyState icon={<HistoryIcon className="w-6 h-6" aria-hidden />} text={t('history.empty')} />;

    return (
        <List>
            {items.map(r => {
                const icon = r.eventType === 'MINING_SESSION'
                    ? <PauseCircle className="w-5 h-5 text-info" strokeWidth={1.75} aria-hidden />
                    : r.eventType === 'SOLD_BACK'
                        ? <Undo2 className="w-5 h-5" strokeWidth={1.75} aria-hidden />
                        : <ShoppingBag className="w-5 h-5" strokeWidth={1.75} aria-hidden />;
                const amount = r.eventType === 'MINING_SESSION' ? num(r.profitUsd) : num(r.priceUsd);
                return (
                    <ListRow
                        key={r._id}
                        icon={icon}
                        title={t(`history.${r.eventType}`)}
                        subtitle={fmtDate(r.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                        value={amount > 0 ? <span className={r.eventType === 'MINING_SESSION' ? 'text-positive' : undefined}>{r.eventType === 'MINING_SESSION' ? '+' : ''}{fmtUsd(amount)}</span> : undefined}
                        valueSub={r.eventType === 'MINING_SESSION' ? <span className="text-caption text-muted">{t('history.income')}</span> : undefined}
                    />
                );
            })}
        </List>
    );
};

interface Props {
    card: TyrexCard | null;
    onClose: () => void;
    now: number;
    profitOf: (c: TyrexCard) => number;
}

/** Лист карты: «Управление» и «История». Действие внизу зависит от статуса. */
const CardSheet: React.FC<Props> = ({ card, onClose, now, profitOf }) => {
    const { t } = useTranslation('cards');
    const btcPrice = useTyrexStore(s => s.btcPrice);
    const refreshAllData = useSession(s => s.refreshAllData);
    const [tab, setTab] = useState<Tab>('manage');
    const [busy, setBusy] = useState(false);

    const close = () => { setTab('manage'); onClose(); };

    const run = async (fn: () => Promise<unknown>, success: string) => {
        setBusy(true);
        try {
            await fn();
            notify.success(success);
            await refreshAllData();
            close();
        } catch (e) {
            notify.error(e);
            await refreshAllData();
        } finally {
            setBusy(false);
        }
    };

    const start = (c: TyrexCard) => run(() => cardsApi.startCard(c.id), t('toast.started', { name: c.name }));

    const stop = async (c: TyrexCard) => {
        const payoutDate = fmtDate(now + COOLING_DAYS * 86_400_000, { day: 'numeric', month: 'long' });
        const ok = await showConfirm(t('confirm.stop', { days: COOLING_DAYS, date: payoutDate, amount: fmtUsd(c.purchasePriceUsd + profitOf(c)) }));
        if (ok) run(() => cardsApi.stopCard(c.id), t('toast.stopped', { date: payoutDate }));
    };

    const sell = async (c: TyrexCard) => {
        const ok = await showConfirm(t('confirm.sell', { amount: fmtUsd(c.purchasePriceUsd), name: c.name, serial: c.serialNumber }));
        if (ok) run(() => cardsApi.sellCardBack(c.id), t('toast.sold', { amount: fmtUsd(c.purchasePriceUsd) }));
    };

    let action: SheetAction | undefined;
    let footer: React.ReactNode = null;
    if (card && !card.isTrial && card.status === 'Inactive') {
        action = { text: t('actions.start'), onClick: () => start(card), loading: busy };
        footer = (
            <Button variant="danger" block icon={<Undo2 className="w-5 h-5" strokeWidth={1.75} aria-hidden />} disabled={busy} onClick={() => sell(card)}>
                {t('actions.sell', { amount: fmtUsd(card.purchasePriceUsd) })}
            </Button>
        );
    } else if (card && !card.isTrial && card.status === 'Active') {
        action = { text: t('actions.stop'), onClick: () => stop(card), loading: busy };
    }

    const daily = card ? cardDailyUsd(card, btcPrice) : 0;
    const progress = card ? cycleProgress(card, now) : null;
    const left = card ? daysLeft(card, now) : null;

    return (
        <Sheet
            open={Boolean(card)}
            onClose={close}
            title={card ? `${card.name} #${card.serialNumber ?? ''}` : ''}
            action={tab === 'manage' ? action : undefined}
            footer={tab === 'manage' ? footer : undefined}
        >
            {card && (
                <>
                    <Segmented
                        className="mb-4"
                        value={tab}
                        onChange={setTab}
                        options={[{ value: 'manage', label: t('sheet.tabManage') }, { value: 'history', label: t('sheet.tabHistory') }]}
                    />

                    {tab === 'history' ? <HistoryTab card={card} /> : (
                        <>
                            <div className="flex items-center gap-4">
                                <CardThumb src={card.imageUrl} alt={card.name} className="w-20 h-20 rounded-card shrink-0" />
                                <div className="min-w-0">
                                    <CardStatusBadge status={card.status === 'OnSale' ? 'OnSale' : card.status} unlockAt={card.unlockTimestamp} isTrial={card.isTrial} />
                                    <p className="text-callout text-muted mt-2">{t(`statusHint.${card.isTrial ? `trial${card.status}` : card.status}`, {
                                        days: COOLING_DAYS,
                                        date: card.unlockTimestamp ? fmtDate(card.unlockTimestamp, { day: 'numeric', month: 'long' }) : '',
                                        defaultValue: '',
                                    })}</p>
                                </div>
                            </div>

                            {card.status === 'Active' && (
                                <Surface className="mt-4 p-4 text-center">
                                    <p className="text-callout text-muted">{t('sheet.cycleIncome')}</p>
                                    <p className="text-title text-positive tabular-nums mt-1">+{fmtUsd(profitOf(card))}</p>
                                    {btcPrice > 0 && <p className="text-callout text-muted mt-1">{t('sheet.perDay', { amount: fmtUsd(daily) })}</p>}
                                </Surface>
                            )}

                            {progress !== null && left !== null && (
                                <div className="mt-4">
                                    <ProgressBar value={progress} tone={card.status === 'Cooling' ? 'info' : 'accent'} label={t(card.status === 'Cooling' ? 'progress.payoutIn' : 'progress.trialLeft', { count: left })} />
                                </div>
                            )}

                            <Surface className="mt-4 px-4 divide-y divide-line/60">
                                <InfoRow label={t('sheet.price')} value={card.isTrial ? t('sheet.gift') : fmtUsd(card.purchasePriceUsd)} />
                                <InfoRow label={t('sheet.rate')} value={t('sheet.rateValue', { rate: fmtPct(card.clientAPY, 1) })} />
                                <InfoRow label={t('sheet.nominal')} value={fmtBtcAmount(card.nominalBtc, 'detail')} />
                                <InfoRow label={t('sheet.bought')} value={fmtDate(card.boughtAtTimestamp, { day: 'numeric', month: 'long', year: 'numeric' })} />
                                {card.status === 'Cooling' && card.unlockTimestamp && (
                                    <InfoRow label={t('sheet.payoutDate')} value={fmtDate(card.unlockTimestamp, { day: 'numeric', month: 'long' })} />
                                )}
                            </Surface>
                            <p className="text-caption text-muted mt-2">{t('sheet.rateNote')}</p>

                            {card && !card.isTrial && card.status === 'Inactive' && (
                                <Surface className="mt-4 p-4">
                                    <p className="text-headline text-fg flex items-center gap-2"><Play className="w-5 h-5" strokeWidth={1.75} aria-hidden />{t('sheet.termsTitle')}</p>
                                    <ul className="mt-2 space-y-1.5 text-callout text-muted list-disc pl-5">
                                        <li>{t('sheet.termStart')}</li>
                                        <li>{t('sheet.termStop', { days: COOLING_DAYS, count: COOLING_DAYS })}</li>
                                        <li>{t('sheet.termSell', { amount: fmtUsd(card.purchasePriceUsd) })}</li>
                                    </ul>
                                </Surface>
                            )}
                            {card && !card.isTrial && card.status === 'Active' && (
                                <p className="text-callout text-muted mt-4">{t('sheet.stopNote', { days: COOLING_DAYS, count: COOLING_DAYS })}</p>
                            )}
                        </>
                    )}
                </>
            )}
        </Sheet>
    );
};

export default CardSheet;
