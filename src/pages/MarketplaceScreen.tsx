import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
     RefreshCw, ArrowLeft, Search, X, Wallet, TrendingUp, Info, Filter, SortAsc, SortDesc, Star, Rocket
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTyrexStore, type TyrexCard, type TyrexCardType } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import NftCardVisual, { CardImage } from '../components/NftCardVisual';
import { fmtUsd, satsToBtc, btcToUsd } from '../lib/format';
import { errorText } from '../lib/i18nHelpers';
import { haptic } from '../lib/telegram';

// --- Types ---
interface CollectionItem {
    serialNumber: number;
    isSold: boolean;
    priceUSDT: number;
    nominalSats: number;
    imageUrl: string;
}

interface TierStyle { text: string; border: string; bg: string; shadow?: string; glow?: string }
type InfoType = 'apy' | 'price' | 'ref';

// --- Стили тиров ---
const TIER_STYLES: Record<string, TierStyle> = {
    'MINI': { text: 'text-[#CD7F32]', border: 'border-[#CD7F32]/40', bg: 'bg-[#CD7F32]/10', shadow: 'shadow-[#CD7F32]/20' },
    'MIDI': { text: 'text-[#00FFFF]', border: 'border-[#00FFFF]/40', bg: 'bg-[#00FFFF]/10', shadow: 'shadow-[#00FFFF]/20' },
    'MAXI': { text: 'text-[#FFD700]', border: 'border-[#FFD700]/40', bg: 'bg-[#FFD700]/10', shadow: 'shadow-[#FFD700]/20' },
    'ULTRA': { text: 'text-[#BF00FF]', border: 'border-[#BF00FF]/60', bg: 'bg-[#BF00FF]/10', shadow: 'shadow-[#BF00FF]/30', glow: 'drop-shadow-[0_0_8px_#BF00FF]' },
    'INFINITY': { text: 'text-white shadow-[0_0_15px_rgba(255,255,255,0.5)]', border: 'border-white/40', bg: 'bg-white/10', glow: 'drop-shadow-[0_0_10px_#fff]' },
};

const getTierStyle = (name = ''): TierStyle => {
    const upperName = name.toUpperCase();
    for (const key of ['MINI', 'MIDI', 'MAXI', 'ULTRA', 'INFINITY']) {
        if (upperName.includes(key)) return TIER_STYLES[key];
    }
    return TIER_STYLES['MINI'];
};

/** Цена по номиналу и текущему курсу; без курса — null (показываем «синхронизация») */
const livePrice = (nominalSats: number, btcPrice: number): number | null =>
    btcPrice > 0 ? btcToUsd(satsToBtc(nominalSats), btcPrice) : null;

// --- Кликабельная плашка метрики ---
const MetricButton: React.FC<{ label: string; value: string; type: InfoType; colorClass: string; onClick: (t: InfoType) => void }> = ({ label, value, type, colorClass, onClick }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(type); }}
        className={clsx(
            "bg-[#0D0D0E]/80 backdrop-blur-md border border-white/10 rounded-2xl py-3 flex flex-col items-center justify-center relative active:scale-95 transition-all group",
            colorClass
        )}
    >
        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5 group-hover:text-white/60 transition-colors">{label}</span>
        <span className="text-[14px] font-black leading-none">{value}</span>
        <div className="absolute top-1.5 right-1.5 opacity-20"><Info size={8} /></div>
    </button>
);

// --- Карточка коллекции ---
const CollectionCard: React.FC<{ card: TyrexCardType; btcPrice: number; onClick: () => void; onInfo: (type: InfoType, c: TyrexCardType) => void }> = ({ card, btcPrice, onClick, onInfo }) => {
    const { t } = useTranslation('market');
    const style = getTierStyle(card.name);
    const isLowSupply = card.available <= 5;
    const price = livePrice(card.nominalSats, btcPrice);

    return (
        <div onClick={onClick} className="bg-[#111112] border border-white/5 rounded-[2.8rem] relative active:scale-[0.98] transition-all overflow-hidden mb-6 shadow-2xl group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10 pointer-events-none" />

            <div className="relative z-20 p-7 flex flex-col items-center">
                <div className="w-full flex justify-between items-start mb-2 gap-2">
                    <div className="flex flex-col min-w-0">
                        <h4 className={clsx("text-2xl font-black uppercase italic tracking-tighter leading-none", style.text)}>
                            {card.name}
                        </h4>
                        <span className="text-[11px] font-bold text-white/20 uppercase mt-1 tracking-tight">
                            {t('card.nominal', { value: card.nominalBtcDisplay })}
                        </span>
                    </div>
                    <div className={clsx(
                        "px-3 py-1 rounded-full border text-[9px] font-black uppercase transition-colors shrink-0",
                        isLowSupply ? "border-red-500 text-red-500 bg-red-500/10 animate-pulse" : "border-white/10 text-white/30"
                    )}>
                        {t('card.left', { available: card.available, max: card.maxSupply })}
                    </div>
                </div>

                <div className="w-56 h-56 relative -my-8 transform group-hover:scale-110 transition-all duration-700 ease-out z-0">
                    <CardImage src={card.imageUrl} alt={card.name} className={clsx("w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-full", style.glow)} />
                </div>

                <div className="grid grid-cols-3 gap-2.5 w-full relative z-20 mt-2">
                    <MetricButton label={t('card.apy')} value={card.clientAPY} type="apy" colorClass="text-green-400" onClick={(ty) => onInfo(ty, card)} />
                    <MetricButton label={t('card.price')} value={price !== null ? fmtUsd(price, 0) : '…'} type="price" colorClass="text-white" onClick={(ty) => onInfo(ty, card)} />
                    <MetricButton label={t('card.ref')} value={card.referralAPY} type="ref" colorClass="text-[#FFB800]" onClick={(ty) => onInfo(ty, card)} />
                </div>
            </div>
        </div>
    );
};

// --- Главный экран ---
const MarketplaceScreen: React.FC = () => {
    const { t } = useTranslation('market');
    const navigate = useNavigate();
    const { marketCardTypes, balance, btcPrice, cards } = useTyrexStore();
    const { refreshAllData } = useTelegram();

    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'NODES' | 'BOOSTERS'>('NODES');
    const [items, setItems] = useState<CollectionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSold, setFilterSold] = useState(false);
    const [sortMode, setSortMode] = useState<'ASC' | 'DESC'>('ASC');

    const [selectedSerial, setSelectedSerial] = useState<CollectionItem | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null);

    const loadItems = useCallback((id: string) => {
        setLoading(true);
        cardsApi.getCollectionItems(id)
            .then((data: { items?: CollectionItem[] }) => setItems(Array.isArray(data?.items) ? data.items : []))
            .catch((e) => { setItems([]); toast.error(errorText(e)); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedCollectionId) loadItems(selectedCollectionId);
        else setItems([]);
    }, [selectedCollectionId, loadItems]);

    // Номера, которые уже принадлежат пользователю
    const mySerialNumbers = useMemo(() => new Set(
        cards
            .filter((c: TyrexCard) => c.cardTypeId === selectedCollectionId)
            .map(c => c.serialNumber)
    ), [cards, selectedCollectionId]);

    const filteredItems = useMemo(() => {
        let list = [...items];
        if (filterSold) list = list.filter(i => !i.isSold);
        if (searchQuery) list = list.filter(i => i.serialNumber.toString().includes(searchQuery));
        list.sort((a, b) => sortMode === 'ASC' ? a.serialNumber - b.serialNumber : b.serialNumber - a.serialNumber);
        return list;
    }, [items, filterSold, searchQuery, sortMode]);

    const activeCollection = useMemo(() => marketCardTypes.find(c => c.id === selectedCollectionId), [marketCardTypes, selectedCollectionId]);

    const selectedPrice = selectedSerial ? livePrice(selectedSerial.nominalSats, btcPrice) : null;
    const canAfford = selectedPrice !== null && balance.walletUsd >= selectedPrice;

    const handleBuy = async () => {
        if (!selectedCollectionId || !selectedSerial || selectedPrice === null) return;
        if (!canAfford) { toast.error(t('errors.insufficient')); return; }
        try {
            setIsBuying(true);
            await cardsApi.buyCard(selectedCollectionId, selectedSerial.serialNumber);
            haptic.success();
            toast.success(t('buy.success', { serial: selectedSerial.serialNumber }));
            await refreshAllData();
            setSelectedSerial(null);
            navigate('/collection');
        } catch (error) {
            haptic.error();
            toast.error(errorText(error));
            // Номер мог уйти другому покупателю — обновляем сетку
            loadItems(selectedCollectionId);
        } finally { setIsBuying(false); }
    };

    const handleOpenInfo = (type: InfoType, collection: TyrexCardType) => {
        const params = { apy: collection.clientAPY, nominal: collection.nominalBtcDisplay, ref: collection.referralAPY };
        setInfoModal({ title: t(`info.${type}.title`), content: t(`info.${type}.content`, params) });
    };

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 font-sans relative">

            {/* Header — внутри скролл-контейнера, который уже ниже безопасной зоны Telegram (pt-safe в App) */}
            <div className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {selectedCollectionId && (
                        <button onClick={() => setSelectedCollectionId(null)} aria-label={t('common:actions.back')} className="p-2 bg-white/5 rounded-full shrink-0"><ArrowLeft size={20}/></button>
                    )}
                    <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none truncate">
                        {selectedCollectionId ? activeCollection?.name : t('title')}
                    </h1>
                </div>
                <div className="bg-[#141415] border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-inner shrink-0">
                    <Wallet size={14} className="text-[#FFB800]" />
                    <span className="text-sm font-black italic tracking-tighter tabular-nums">{fmtUsd(balance.walletUsd)}</span>
                </div>
            </div>

            <div className="p-4">
                {!selectedCollectionId ? (
                    <>
                        <div className="flex p-1 bg-[#141415] rounded-2xl mb-8 border border-white/5">
                            {(['NODES', 'BOOSTERS'] as const).map(s => (
                                <button
                                    key={s} onClick={() => setActiveSection(s)}
                                    className={clsx(
                                        "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                                        activeSection === s ? "bg-white text-black shadow-xl" : "text-white/20"
                                    )}
                                >
                                    {s === 'BOOSTERS' ? t('sections.boosters') : t('sections.nodes')}
                                </button>
                            ))}
                        </div>

                        {btcPrice <= 0 && (
                            <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <RefreshCw size={12} className="animate-spin" /> {t('common:app.priceSyncing')}
                            </div>
                        )}

                        {activeSection === 'NODES' ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {marketCardTypes.map((card) => (
                                    <CollectionCard key={card.id} card={card} btcPrice={btcPrice} onClick={() => setSelectedCollectionId(card.id)} onInfo={handleOpenInfo} />
                                ))}
                                {marketCardTypes.length === 0 && (
                                    <div className="py-24 text-center text-white/30 text-xs font-black uppercase tracking-widest">{t('empty')}</div>
                                )}
                            </div>
                        ) : (
                            <div className="py-24 text-center opacity-30">
                                <Rocket size={48} className="mx-auto mb-4 animate-bounce" />
                                <p className="text-xs font-black uppercase tracking-[0.3em]">{t('common:comingSoon')}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {/* HUD выбранной серии */}
                        <div className="sticky top-[72px] z-30 bg-[#080808] pb-6 space-y-4">
                            <div className="bg-[#141415] border border-white/10 p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-pulse" />
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t('series.selected')}</p>
                                    </div>
                                    <h2 className={clsx("text-2xl font-black uppercase italic tracking-tighter truncate", getTierStyle(activeCollection?.name).text)}>
                                        {activeCollection?.name}
                                    </h2>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-black text-white">{t('series.apy', { apy: activeCollection?.clientAPY ?? '' })}</p>
                                    <p className="text-[9px] font-bold text-[#FFB800] uppercase">{t('series.left', { count: activeCollection?.available ?? 0 })}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="number" inputMode="numeric" placeholder={t('series.search')}
                                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#141415] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-[#FFB800]/20 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setFilterSold(!filterSold)}
                                    aria-label={t('series.filterAvailable')}
                                    title={t('series.filterAvailable')}
                                    className={clsx(
                                        "p-4 rounded-2xl border transition-all",
                                        filterSold ? "bg-[#FFB800] text-black border-[#FFB800]" : "bg-white/5 border-white/5 text-white/40"
                                    )}
                                >
                                    <Filter size={20} />
                                </button>
                                <button
                                    onClick={() => setSortMode(s => s === 'ASC' ? 'DESC' : 'ASC')}
                                    aria-label={t('series.sort')}
                                    title={t('series.sort')}
                                    className="p-4 bg-white/5 rounded-2xl border border-white/5 text-white/40 active:scale-90 transition-all"
                                >
                                    {sortMode === 'ASC' ? <SortAsc size={20}/> : <SortDesc size={20}/>}
                                </button>
                            </div>
                        </div>

                        {loading && items.length === 0 ? (
                            <div className="flex justify-center py-16"><RefreshCw className="w-8 h-8 animate-spin text-[#FFB800]" /></div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {filteredItems.map((item) => {
                                    const isOwned = mySerialNumbers.has(item.serialNumber);
                                    return (
                                        <div key={item.serialNumber} onClick={() => !item.isSold && setSelectedSerial(item)}
                                            className={clsx(
                                                "relative aspect-square rounded-[2.5rem] border overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center bg-[#050505]",
                                                item.isSold ? (isOwned ? "border-[#FFB800] shadow-[0_0_20px_rgba(255,184,0,0.2)]" : "opacity-20 grayscale border-transparent") : "border-white/10 shadow-xl"
                                            )}>
                                            <CardImage src={item.imageUrl} alt={activeCollection?.name || ''} className="w-full h-full object-cover" />

                                            {isOwned && (
                                                <div className="absolute top-4 left-4 bg-[#FFB800] text-black px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shadow-lg z-20">
                                                    <Star size={10} fill="currentColor"/> {t('grid.yours')}
                                                </div>
                                            )}

                                            <div className={clsx(
                                                "absolute bottom-4 left-4 right-4 backdrop-blur-md py-2.5 rounded-xl text-center border z-20",
                                                isOwned ? "bg-[#FFB800] border-[#FFB800] text-black" : "bg-black/80 border-white/10 text-white"
                                            )}>
                                                <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                                                    {item.isSold ? (isOwned ? t('grid.owned') : t('grid.sold')) : `#${item.serialNumber}`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredItems.length === 0 && (
                                    <div className="col-span-2 py-16 text-center text-white/30 text-xs font-black uppercase tracking-widest">{t('grid.empty')}</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- Модалка покупки --- */}
            <AnimatePresence>
                {selectedSerial && activeCollection && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                        style={{ paddingTop: 'calc(var(--safe-top) + 16px)', paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}
                    >
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSerial(null)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                            className="bg-[#0D0D0E] border border-white/10 w-full max-w-sm rounded-[3rem] relative z-10 shadow-2xl flex flex-col max-h-full overflow-hidden"
                        >
                            <button onClick={() => setSelectedSerial(null)} aria-label={t('common:actions.close')} className="absolute top-6 right-6 z-20 p-2 bg-white/5 rounded-full text-white/30"><X size={18}/></button>

                            {/* Прокручиваемое содержимое */}
                            <div className="overflow-y-auto no-scrollbar px-7 pt-8 flex-1 min-h-0">
                                <div className="flex justify-center mb-4">
                                    <NftCardVisual imageUrl={selectedSerial.imageUrl} name={activeCollection.name} sizeClass="w-48 sm:w-60" serialNumber={selectedSerial.serialNumber} />
                                </div>

                                <div className="text-center mb-6">
                                    <h3 className={clsx("text-3xl font-black uppercase italic tracking-tighter leading-none mb-2", getTierStyle(activeCollection.name).text)}>
                                        {activeCollection.name} <span className="text-white/20">#{selectedSerial.serialNumber}</span>
                                    </h3>
                                    <div className="inline-flex items-center gap-2 bg-white/5 px-5 py-2 rounded-full border border-white/10">
                                        <TrendingUp size={14} className="text-[#FFB800]" />
                                        <span className="text-xs font-black text-white/70 uppercase tracking-tighter">{activeCollection.nominalBtcDisplay}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-4">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-4 px-2 gap-2">
                                        <span className="text-[11px] font-black text-white/30 uppercase tracking-widest">{t('buy.price')}</span>
                                        <span className="text-3xl font-black text-white tabular-nums">{selectedPrice !== null ? fmtUsd(selectedPrice) : '…'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
                                            <span className="text-[10px] font-black text-white/20 uppercase mb-1">{t('buy.wallet')}</span>
                                            <span className={clsx("text-base font-black tabular-nums", canAfford ? "text-white" : "text-red-400")}>{fmtUsd(balance.walletUsd)}</span>
                                        </div>
                                        <div className="bg-[#FFB800]/10 p-4 rounded-3xl border border-[#FFB800]/20 flex flex-col items-center">
                                            <span className="text-[10px] font-black text-[#FFB800] uppercase mb-1">{t('buy.dailyYield')}</span>
                                            <span className="text-base font-black text-[#FFB800] tabular-nums">
                                                {selectedPrice !== null ? `~${fmtUsd((selectedPrice * (parseFloat(activeCollection.clientAPY) / 100)) / 365)}` : '…'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-white/30 leading-relaxed text-center px-2">{t('buy.note')}</p>
                                </div>
                            </div>

                            {/* Кнопка закреплена внизу */}
                            <div className="px-7 pb-7 pt-3 shrink-0 border-t border-white/5 bg-[#0D0D0E]">
                                {selectedPrice !== null && !canAfford && (
                                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">{t('errors.insufficient')}</p>
                                )}
                                <button
                                    onClick={handleBuy}
                                    disabled={isBuying || !canAfford}
                                    className="w-full py-5 bg-[#FFB800] text-black rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-[0_15px_45px_rgba(255,184,0,0.3)] active:scale-95 disabled:grayscale disabled:opacity-20 transition-all"
                                >
                                    {isBuying ? <RefreshCw className="animate-spin mx-auto" /> : t('buy.confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Информационный попап */}
            <AnimatePresence>
                {infoModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" onClick={() => setInfoModal(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-white/10 p-8 rounded-[3rem] max-w-sm text-center shadow-2xl relative">
                             <div className="w-16 h-16 bg-[#FFB800]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Info size={32} className="text-[#FFB800]" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-white mb-4 tracking-tighter">{infoModal.title}</h3>
                            <p className="text-white/60 leading-relaxed text-sm mb-8">{infoModal.content}</p>
                            <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">{t('info.gotIt')}</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketplaceScreen;
