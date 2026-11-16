import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Page, ScreenTitle, Surface, Badge, EmptyState, Skeleton, useMoney } from '../ui';
import { useTyrexStore, type TyrexCardType } from '../store/useTyrexStore';
import { useSession } from '../store/useSession';
import { haptic } from '../lib/telegram';
import SeriesImage from '../features/shop/SeriesImage';
import BuySheet from '../features/shop/BuySheet';
import { apyOf, priceUsdOf } from '../features/shop/shopMath';

/** Карточка серии: картинка 1:1, название, ставка, цена, остаток — у каждого параметра подпись */
const SeriesCard: React.FC<{ type: TyrexCardType; onOpen: () => void }> = ({ type, onOpen }) => {
    const { t } = useTranslation('shop');
    const { usd } = useMoney();
    const btcPrice = useTyrexStore(s => s.btcPrice);
    const price = priceUsdOf(type, btcPrice);
    const soldOut = type.available <= 0;

    return (
        <button
            onClick={() => { if (!soldOut) { haptic.tap(); onOpen(); } }}
            disabled={soldOut}
            aria-disabled={soldOut}
            className="w-full bg-surface rounded-card p-3 flex items-center gap-3 text-left active:opacity-80 disabled:active:opacity-100"
        >
            <SeriesImage src={type.imageUrl} alt={type.name} className="w-20 h-20 rounded-control shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-headline text-fg truncate">{type.name}</p>
                <p className="text-callout text-muted mt-0.5">{t('list.rate', { apy: apyOf(type.clientAPY) })}</p>
                <div className="flex items-end justify-between gap-2 mt-2">
                    <div>
                        <p className="text-caption text-muted">{t('list.price')}</p>
                        <p className="text-headline text-fg tabular-nums">{price > 0 ? usd(price) : '…'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-caption text-muted">{t('list.left')}</p>
                        {soldOut
                            ? <Badge tone="neutral">{t('list.soldOut')}</Badge>
                            : <p className="text-callout text-fg tabular-nums">{t('list.leftValue', { available: type.available, total: type.maxSupply })}</p>}
                    </div>
                </div>
            </div>
            {!soldOut && <ChevronRight className="w-5 h-5 text-muted shrink-0" strokeWidth={1.75} aria-hidden />}
        </button>
    );
};

/** Магазин: что купить и на каких условиях */
const ShopScreen: React.FC = () => {
    const { t } = useTranslation('shop');
    const types = useTyrexStore(s => s.marketCardTypes);
    const btcPrice = useTyrexStore(s => s.btcPrice);
    const status = useSession(s => s.status);
    const [picked, setSelected] = useState<TyrexCardType | null>(null);
    // ?series=<id> — открыть лист покупки сразу (например, из прогноза в аналитике)
    const [params, setParams] = useSearchParams();
    const fromUrl = params.get('series');
    const selected = picked ?? (fromUrl ? types.find(x => String(x.id) === fromUrl) ?? null : null);
    const closeSheet = () => { setSelected(null); if (fromUrl) setParams({}, { replace: true }); };

    // Сортировка по цене (номинал в BTC пропорционален цене при любом курсе)
    const sorted = useMemo(() => [...types].sort((a, b) => a.nominalSats - b.nominalSats), [types]);
    const loading = status !== 'ready' && types.length === 0;

    return (
        <Page>
            <ScreenTitle subtitle={btcPrice > 0 ? t('subtitle') : t('priceSyncing')}>{t('title')}</ScreenTitle>

            {loading ? (
                <div className="space-y-3" aria-busy="true">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Surface key={i} className="p-3 flex items-center gap-3">
                            <Skeleton className="w-20 h-20" />
                            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-2/3" /></div>
                        </Surface>
                    ))}
                </div>
            ) : sorted.length === 0 ? (
                <Surface><EmptyState icon={<ShoppingBag className="w-6 h-6" aria-hidden />} text={t('empty')} /></Surface>
            ) : (
                <div className="space-y-3">
                    {sorted.map(type => <SeriesCard key={type.id} type={type} onOpen={() => setSelected(type)} />)}
                </div>
            )}

            <p className="text-callout text-muted mt-4">{t('disclaimer')}</p>

            <BuySheet type={selected} onClose={closeSheet} />
        </Page>
    );
};

export default ShopScreen;
