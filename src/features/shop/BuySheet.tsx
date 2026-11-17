import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Info } from 'lucide-react';
import { Sheet, Surface, InfoRow, Skeleton, EmptyState, notify, useMoney, cn, type SheetAction } from '../../ui';
import { cardsApi, type ApiJson } from '../../api/tyrexApi';
import { useTyrexStore, type TyrexCardType } from '../../store/useTyrexStore';
import { useSession } from '../../store/useSession';
import { haptic } from '../../lib/telegram';
import SeriesImage from './SeriesImage';
import { apyOf, incomeForDays, priceUsdOf, type CollectionItem } from './shopMath';

const COOLING_DAYS = 30;

interface Props {
    type: TyrexCardType | null;
    onClose: () => void;
}

/**
 * Лист покупки: шаг 1 — выбор номера (сетка по 3, поиск, занятые приглушены),
 * шаг 2 — условия, калькулятор и главная кнопка «Купить за $X» / «Пополнить на $N».
 */
const BuySheetContent: React.FC<{ type: TyrexCardType; onClose: () => void }> = ({ type, onClose }) => {
    const { t } = useTranslation('shop');
    const navigate = useNavigate();
    const { usd } = useMoney();
    const btcPrice = useTyrexStore(s => s.btcPrice);
    const walletUsd = useTyrexStore(s => s.balance.walletUsd);
    const refreshAllData = useSession(s => s.refreshAllData);

    const [items, setItems] = useState<CollectionItem[] | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<number | null>(null);
    const [step, setStep] = useState<'pick' | 'buy'>('pick');
    const [buying, setBuying] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let alive = true;
        cardsApi.getCollectionItems(type.id)
            .then((data: ApiJson) => {
                if (!alive) return;
                const list: CollectionItem[] = Array.isArray(data?.items)
                    ? data.items.map((i: ApiJson) => ({ serialNumber: Number(i.serialNumber), isSold: Boolean(i.isSold) }))
                    : [];
                setItems(list);
                setLoadError(false);
            })
            .catch(() => { if (alive) { setItems([]); setLoadError(true); } });
        return () => { alive = false; };
    }, [type.id, reloadKey]);

    const filtered = useMemo(() => {
        if (!items) return [];
        const q = query.trim();
        return q ? items.filter(i => String(i.serialNumber).includes(q)) : items;
    }, [items, query]);

    // Свободных номеров может быть больше, чем осталось к продаже (лимит серии задаёт админ) — показываем меньшее
    const freeCount = items ? Math.min(items.filter(i => !i.isSold).length, Number.isFinite(type.available) ? type.available : Infinity) : 0;
    const price = priceUsdOf(type, btcPrice);
    const priceReady = btcPrice > 0 && price > 0;
    const deficit = Math.max(0, Math.ceil((price - walletUsd) * 100) / 100);
    const apy = apyOf(type.clientAPY);
    const refApy = apyOf(type.referralAPY);

    const buy = async () => {
        if (selected === null || !priceReady) return;
        setBuying(true);
        try {
            await cardsApi.buyCard(type.id, selected);
            notify.success(t('buy.success', { name: type.name, serial: selected }));
            await refreshAllData();
            onClose();
            navigate('/cards');
        } catch (e) {
            notify.error(e);
            // Номер мог уйти другому покупателю — обновляем сетку и возвращаемся к выбору
            setSelected(null);
            setStep('pick');
            setReloadKey(k => k + 1);
            refreshAllData();
        } finally {
            setBuying(false);
        }
    };

    let action: SheetAction;
    if (step === 'pick') {
        action = {
            text: selected !== null ? t('pick.continue', { serial: selected }) : t('pick.choose'),
            onClick: () => { if (selected !== null) setStep('buy'); },
            disabled: selected === null,
        };
    } else if (!priceReady) {
        action = { text: t('buy.priceSyncing'), onClick: () => {}, disabled: true };
    } else if (deficit > 0) {
        action = {
            text: t('buy.topUp', { amount: usd(deficit) }),
            onClick: () => { onClose(); navigate('/wallet?action=deposit'); },
        };
    } else {
        action = { text: t('buy.cta', { price: usd(price) }), onClick: buy, loading: buying };
    }

    return (
        <Sheet open onClose={onClose} title={step === 'pick' ? t('pick.title', { name: type.name }) : type.name} action={action}>
            {step === 'pick' ? (
                <>
                    <p className="text-callout text-muted">
                        {items ? t('pick.free', { count: freeCount }) : t('pick.loading')}
                    </p>
                    <label className="mt-3 flex items-center gap-2 bg-surface rounded-control px-3 h-12 border border-transparent focus-within:border-link">
                        <Search className="w-5 h-5 text-muted" strokeWidth={1.75} aria-hidden />
                        <input
                            inputMode="numeric"
                            value={query}
                            onChange={(e) => setQuery(e.target.value.replace(/\D/g, ''))}
                            placeholder={t('pick.search')}
                            aria-label={t('pick.search')}
                            className="flex-1 min-w-0 bg-transparent outline-none text-body text-fg placeholder:text-muted/70"
                        />
                    </label>

                    {items === null ? (
                        <div className="grid grid-cols-3 gap-2 mt-3" aria-busy="true">
                            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                        </div>
                    ) : loadError ? (
                        <EmptyState icon={<Info className="w-6 h-6" aria-hidden />} text={t('pick.error')} action={{ label: t('pick.retry'), onClick: () => { setItems(null); setReloadKey(k => k + 1); } }} />
                    ) : filtered.length === 0 ? (
                        <EmptyState icon={<Search className="w-6 h-6" aria-hidden />} text={t('pick.notFound')} />
                    ) : (
                        <div className="grid grid-cols-3 gap-2 mt-3" role="listbox" aria-label={t('pick.title', { name: type.name })}>
                            {filtered.map(item => {
                                const isSel = selected === item.serialNumber;
                                return (
                                    <button
                                        key={item.serialNumber}
                                        role="option"
                                        aria-selected={isSel}
                                        aria-disabled={item.isSold}
                                        disabled={item.isSold}
                                        onClick={() => { haptic.tap(); setSelected(item.serialNumber); }}
                                        className={cn(
                                            'h-12 rounded-control text-body tabular-nums transition-colors duration-150',
                                            item.isSold && 'bg-surface text-muted/50 line-through',
                                            !item.isSold && !isSel && 'bg-surface text-fg active:opacity-70',
                                            isSel && 'bg-accent text-on-accent font-semibold',
                                        )}
                                    >
                                        #{item.serialNumber}
                                        <span className="sr-only">{item.isSold ? t('pick.taken') : ''}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <SeriesImage src={type.imageUrl} alt={type.name} className="w-24 h-24 rounded-card shrink-0" />
                        <div className="min-w-0">
                            <p className="text-headline text-fg">{type.name} <span className="text-muted tabular-nums">#{selected}</span></p>
                            <p className="text-title text-fg tabular-nums mt-1">{priceReady ? usd(price) : '…'}</p>
                            <p className="text-callout text-muted">{type.nominalBtcDisplay}</p>
                            <button onClick={() => setStep('pick')} className="text-callout text-link min-h-[44px] active:opacity-60">{t('buy.changeNumber')}</button>
                        </div>
                    </div>

                    <Surface className="px-4 mt-4 divide-y divide-line/60">
                        <InfoRow label={t('buy.rate')} value={t('buy.rateValue', { apy })} />
                        <InfoRow label={t('buy.inviterBonus')} value={t('buy.rateValue', { apy: refApy })} />
                        <InfoRow label={t('buy.income30')} value={priceReady ? `≈ ${usd(incomeForDays(type, btcPrice, 30))}` : '—'} />
                        <InfoRow label={t('buy.wallet')} value={usd(walletUsd)} />
                    </Surface>
                    <p className="text-callout text-muted mt-2">{t('buy.calcNote')}</p>

                    <h3 className="text-headline text-fg mt-6 mb-2">{t('terms.title')}</h3>
                    <Surface className="px-4 py-3">
                        <ul className="space-y-2 text-body text-fg list-disc pl-5">
                            <li>{t('terms.cycle')}</li>
                            <li>{t('terms.stop', { days: COOLING_DAYS })}</li>
                            <li>{t('terms.sell')}</li>
                            <li>{t('terms.rate')}</li>
                        </ul>
                    </Surface>

                    {deficit > 0 && priceReady && (
                        <p className="text-callout text-muted mt-3">{t('buy.notEnough', { amount: usd(deficit) })}</p>
                    )}
                    {!priceReady && <p className="text-callout text-muted mt-3">{t('buy.priceSyncing')}</p>}
                </>
            )}
        </Sheet>
    );
};

/** Обёртка: лист монтируется только для выбранной серии (сбрасывает состояние при смене) */
const BuySheet: React.FC<Props> = ({ type, onClose }) =>
    type ? <BuySheetContent key={type.id} type={type} onClose={onClose} /> : null;

export default BuySheet;
