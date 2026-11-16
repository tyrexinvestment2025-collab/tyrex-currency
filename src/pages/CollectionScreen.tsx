import React, { useState, useEffect } from 'react';
import {
     Clock, Zap, Info, RefreshCw, Gift,
     X, BarChart3, ChevronRight, CheckCircle2, TrendingUp, Play, ArrowDownLeft, Square
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useTyrexStore, type TyrexCard } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import LiveProfit from '../components/LiveProfit';
import NftCardVisual, { CardImage } from '../components/NftCardVisual';
import { fmtUsd, fmtDate, fmtDateTime } from '../lib/format';
import { errorText } from '../lib/i18nHelpers';
import { showConfirm, haptic } from '../lib/telegram';

const COOLING_DAYS = 30;

const parseVal = (val: unknown): number => {
    if (val && typeof val === 'object' && '$numberDecimal' in (val as Record<string, unknown>)) {
        return parseFloat(String((val as Record<string, unknown>).$numberDecimal)) || 0;
    }
    const n = parseFloat(String(val ?? ''));
    return Number.isFinite(n) ? n : 0;
};

/**
 * Пробная (подарочная) карта. Стор пока не прокидывает isTrial, поэтому
 * определяем по цене покупки 0 — платные карты всегда имеют цену > 0.
 */
const isTrialCard = (card: TyrexCard): boolean =>
    Boolean((card as TyrexCard & { isTrial?: boolean }).isTrial) || card.purchasePriceUsd === 0;

/** Что разрешено бэкендом для карты */
const cardActions = (card: TyrexCard) => {
    const trial = isTrialCard(card);
    return {
        trial,
        canStart: !trial && card.status === 'Inactive',
        canStop: !trial && card.status === 'Active',
        canSell: !trial && card.status === 'Inactive',
    };
};

interface HistoryRecord {
    _id: string;
    eventType: 'MINING_SESSION' | 'PURCHASE' | 'SOLD_BACK';
    profitUsd?: unknown;
    priceUsd?: unknown;
    createdAt: string;
}

// --- Элемент списка ---
const CollectionListItem: React.FC<{ card: TyrexCard; onClick: () => void; btcPrice: number }> = ({ card, onClick, btcPrice }) => {
    const { t } = useTranslation('vault');
    const isActive = card.status === 'Active';
    const isCooling = card.status === 'Cooling';
    const trial = isTrialCard(card);
    const nominalSats = card.nominalBtc * 100000000;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="relative p-5 rounded-[2rem] border border-white/5 cursor-pointer bg-[#121213] hover:border-white/10 transition-all overflow-hidden group shadow-xl"
        >
            {isActive && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[40px] rounded-full pointer-events-none" />
            )}

            <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 bg-black rounded-2xl border border-white/10 overflow-hidden shadow-inner flex-shrink-0">
                        <CardImage src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-black text-white text-sm uppercase tracking-tight flex items-center gap-1 truncate">
                            {card.name}
                            <span className="text-[#FFB800] text-[10px] opacity-40">#{card.serialNumber}</span>
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{card.nominalBtc.toFixed(4)} BTC</span>
                            {trial && (
                                <span className="text-[9px] font-black uppercase text-[#FFB800] bg-[#FFB800]/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Gift size={9} /> {t('gift')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={clsx(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors shrink-0",
                    isActive && "bg-green-500/10 text-green-400 border-green-500/20",
                    isCooling && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    !isActive && !isCooling && "bg-white/5 text-white/40 border-white/10"
                )}>
                    {isActive ? (
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                            {t('common:cardStatus.Active')}
                        </div>
                    ) : t(`common:cardStatus.${card.status}`, { defaultValue: card.status })}
                </div>
            </div>

            <div className="flex justify-between items-end bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                <div className="min-w-0">
                    <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mb-1">
                        {isCooling ? t('list.coolingUntil') : t('list.currentYield')}
                    </p>
                    <div className="text-xl font-black text-white italic tracking-tighter flex items-center gap-2">
                        {isCooling && card.unlockTimestamp ? (
                            <span className="text-base text-blue-300">{fmtDate(card.unlockTimestamp)}</span>
                        ) : (
                            <LiveProfit
                                cardId={card.id}
                                nominalSats={nominalSats}
                                apy={card.clientAPY}
                                btcPrice={btcPrice}
                                baseProfitUsd={card.currentProfitUsd}
                                status={card.status}
                            />
                        )}
                    </div>
                </div>
                <div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center border border-white/5 group-hover:bg-[#FFB800] group-hover:text-black transition-all shrink-0">
                    <ChevronRight size={14} />
                </div>
            </div>
        </motion.div>
    );
};

// --- Модалка управления нодой ---
interface ModalProps {
    card: TyrexCard | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => Promise<void>;
    btcPrice: number;
}

const CardDetailsModal: React.FC<ModalProps> = ({ card, isOpen, onClose, onUpdate, btcPrice }) => {
    const { t } = useTranslation('vault');
    const [activeTab, setActiveTab] = useState<'CONTROL' | 'HISTORY'>('CONTROL');
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { if (!isOpen) setActiveTab('CONTROL'); }, [isOpen]);

    useEffect(() => {
        if (isOpen && activeTab === 'HISTORY' && card?.serialNumber) {
            setIsLoadingHistory(true);
            cardsApi.getHistoryBySerial(card.cardTypeId, card.serialNumber)
                .then(h => setHistory(Array.isArray(h) ? h : []))
                .finally(() => setIsLoadingHistory(false));
        }
    }, [activeTab, card, isOpen]);

    if (!card) return null;

    const { trial, canStart, canStop, canSell } = cardActions(card);
    const purchasePrice = parseVal(card.purchasePriceUsd);

    const run = async (action: () => Promise<unknown>, successMsg: string) => {
        setActionLoading(true);
        try {
            await action();
            haptic.success();
            toast.success(successMsg);
            await onUpdate();
            onClose();
        } catch (e) {
            haptic.error();
            toast.error(errorText(e));
        } finally {
            setActionLoading(false);
        }
    };

    const handleStart = () => run(() => cardsApi.startCard(card.id), t('toast.started'));

    const handleStop = async () => {
        const ok = await showConfirm(t('confirm.stop', { days: COOLING_DAYS, price: fmtUsd(purchasePrice) }));
        if (ok) run(() => cardsApi.stopCard(card.id), t('toast.stopped', { days: COOLING_DAYS }));
    };

    const handleSell = async () => {
        const ok = await showConfirm(t('confirm.sell', { price: fmtUsd(purchasePrice) }));
        if (!ok) return;
        run(() => cardsApi.sellCardBack(card.id), t('toast.sold', { price: fmtUsd(purchasePrice) }));
    };

    const historyLabel = (type: HistoryRecord['eventType']) => t(`history.${type}`, { defaultValue: type });

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center"
                    style={{ paddingTop: 'calc(var(--safe-top) + 12px)' }}
                >
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="bg-[#0D0D0E] border-t border-white/10 w-full max-w-md rounded-t-[2.5rem] overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-full"
                    >
                        <button onClick={onClose} aria-label={t('common:actions.close')} className="absolute top-4 right-5 z-30 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white/40 border border-white/5 backdrop-blur-sm">
                            <X size={20}/>
                        </button>

                        {/* Скроллится всё содержимое, панель действий закреплена внизу */}
                        <div className="overflow-y-auto no-scrollbar flex-1 min-h-0">
                            <div className="relative pt-8 pb-4 bg-gradient-to-b from-white/[0.05] to-transparent">
                                <NftCardVisual imageUrl={card.imageUrl} name={card.name} sizeClass="w-40 sm:w-56" serialNumber={card.serialNumber} />
                            </div>

                            <div className="px-6 text-center mb-5">
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{card.name}</h3>
                                <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                                    <div className={clsx(
                                        "px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                        card.status === 'Active' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-white/40"
                                    )}>
                                        {t(`common:cardStatus.${card.status}`, { defaultValue: card.status })}
                                    </div>
                                    {trial && (
                                        <div className="px-3 py-1 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 text-[#FFB800] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Gift size={10} /> {t('gift')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex px-6 gap-2 mb-5">
                                {(['CONTROL', 'HISTORY'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={clsx(
                                            "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                            activeTab === tab ? "bg-white text-black shadow-lg" : "bg-white/5 text-white/30 border border-white/5"
                                        )}
                                    >
                                        {t(`tabs.${tab}`)}
                                    </button>
                                ))}
                            </div>

                            <div className="px-6 pb-6">
                                {activeTab === 'CONTROL' ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/5 min-w-0">
                                                <p className="text-[8px] text-white/20 uppercase font-black tracking-widest mb-2">{t('control.liveProfit')}</p>
                                                <div className="text-base font-black text-green-400 italic truncate">
                                                    <LiveProfit
                                                        cardId={card.id}
                                                        nominalSats={card.nominalBtc * 100000000}
                                                        apy={card.clientAPY}
                                                        btcPrice={btcPrice}
                                                        baseProfitUsd={card.currentProfitUsd}
                                                        status={card.status}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/5">
                                                <p className="text-[8px] text-white/20 uppercase font-black tracking-widest mb-2">{t('control.purchasePrice')}</p>
                                                <p className="text-base font-black text-white italic tracking-tighter">{trial ? t('gift') : fmtUsd(purchasePrice)}</p>
                                            </div>
                                        </div>

                                        {/* Честная подсказка по текущему статусу */}
                                        <div className={clsx(
                                            "p-4 rounded-2xl border text-[11px] leading-relaxed flex gap-3",
                                            card.status === 'Cooling' ? "bg-blue-500/5 border-blue-500/20 text-blue-200/70" : "bg-white/[0.03] border-white/5 text-white/50"
                                        )}>
                                            {card.status === 'Cooling' ? <Clock size={16} className="shrink-0 text-blue-400 mt-0.5" /> : <Info size={16} className="shrink-0 text-[#FFB800] mt-0.5" />}
                                            <span>
                                                {trial
                                                    ? (card.status === 'Active'
                                                        ? t('hint.trialActive', { date: card.unlockTimestamp ? fmtDate(card.unlockTimestamp) : '—' })
                                                        : t('hint.trialFinished'))
                                                    : card.status === 'Inactive' ? t('hint.inactive', { days: COOLING_DAYS })
                                                    : card.status === 'Active' ? t('hint.active', { days: COOLING_DAYS })
                                                    : card.status === 'Cooling' ? t('hint.cooling', { date: card.unlockTimestamp ? fmtDateTime(card.unlockTimestamp) : '—' })
                                                    : t('hint.finished')}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {isLoadingHistory ? (
                                            <div className="flex justify-center py-10"><RefreshCw className="w-8 h-8 animate-spin text-[#FFB800]"/></div>
                                        ) : history.length === 0 ? (
                                            <p className="text-center py-10 text-white/30 text-xs font-black uppercase tracking-widest">{t('history.empty')}</p>
                                        ) : (
                                            history.map((record) => {
                                                const profit = parseVal(record.profitUsd);
                                                const price = parseVal(record.priceUsd);
                                                const isMining = record.eventType === 'MINING_SESSION';
                                                return (
                                                    <div key={record._id} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                                                        <div className="flex items-center space-x-3 min-w-0">
                                                            <div className={clsx(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                                isMining ? "bg-green-500/10 text-green-400" : record.eventType === 'SOLD_BACK' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                                                            )}>
                                                                {isMining ? <TrendingUp size={16}/> : record.eventType === 'SOLD_BACK' ? <ArrowDownLeft size={16}/> : <CheckCircle2 size={16}/>}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black text-white">{historyLabel(record.eventType)}</p>
                                                                <p className="text-[9px] font-bold text-white/20 uppercase">{fmtDate(record.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                        <p className={clsx("font-black italic tracking-tighter tabular-nums shrink-0", isMining && profit > 0 ? "text-green-400" : "text-white")}>
                                                            {isMining ? `+${fmtUsd(profit)}` : fmtUsd(price)}
                                                        </p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Панель действий — всегда видна */}
                        {activeTab === 'CONTROL' && (canStart || canStop || canSell) && (
                            <div
                                className="shrink-0 px-6 pt-3 border-t border-white/5 bg-[#0D0D0E] space-y-2"
                                style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}
                            >
                                {canStart && (
                                    <button
                                        onClick={handleStart}
                                        disabled={actionLoading}
                                        className="w-full py-4 bg-green-500 text-black rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-[0_15px_40px_rgba(34,197,94,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {actionLoading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                                        {t('actions.start')}
                                    </button>
                                )}

                                {canStop && (
                                    <button
                                        onClick={handleStop}
                                        disabled={actionLoading}
                                        className="w-full py-4 bg-white text-black rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {actionLoading ? <RefreshCw className="animate-spin" size={18} /> : <Square size={16} fill="currentColor" />}
                                        {t('actions.stop')}
                                    </button>
                                )}

                                {canSell && (
                                    <button
                                        onClick={handleSell}
                                        disabled={actionLoading}
                                        className="w-full py-3 bg-red-500/5 text-red-400/90 font-black uppercase text-[10px] tracking-[0.15em] rounded-2xl border border-red-500/10 active:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                        {t('actions.sell', { price: fmtUsd(purchasePrice) })}
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Основной экран ---
const CollectionScreen: React.FC = () => {
    const { t } = useTranslation('vault');
    const { cards, btcPrice } = useTyrexStore();
    const { refreshAllData } = useTelegram();
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => refreshAllData(), 30000);
        return () => clearInterval(interval);
    }, [refreshAllData]);

    // Берём актуальную карту из стора, чтобы модалка видела свежие данные после обновления
    const selectedCard = cards.find(c => c.id === selectedId) || null;

    const sortedCards = [...(cards || [])].sort((a, b) => {
        const priority: Record<string, number> = { 'Active': 0, 'Inactive': 1, 'Cooling': 2, 'Finished': 3 };
        return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
    });

    const manualRefresh = async () => {
        setRefreshing(true);
        try { await refreshAllData(); } finally { setRefreshing(false); }
    };

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32">
            <div className="sticky top-0 z-20 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#FFB800]/10 rounded-2xl flex items-center justify-center border border-[#FFB800]/20">
                        <BarChart3 className="w-6 h-6 text-[#FFB800]"/>
                    </div>
                    <h1 className="text-xl font-black uppercase italic tracking-tighter">{t('title')}</h1>
                </div>
                <button onClick={manualRefresh} aria-label={t('refresh')} className="p-3 bg-white/5 rounded-full active:scale-90 transition-all border border-white/5">
                    <RefreshCw className={clsx("w-5 h-5 text-white/40", refreshing && "animate-spin")} />
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div className="bg-gradient-to-r from-[#FFB800]/10 to-transparent border-l-4 border-[#FFB800] p-5 rounded-r-[2rem] shadow-xl">
                    <div className="flex gap-4">
                        <Info className="w-6 h-6 shrink-0 text-[#FFB800]"/>
                        <div>
                            <p className="text-[10px] text-[#FFB800] font-black uppercase tracking-widest mb-1">{t('banner.title')}</p>
                            <p className="text-[12px] text-white/70 leading-relaxed font-bold">
                                {t('banner.text', { days: COOLING_DAYS })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-2">
                    {sortedCards.length > 0 ? (
                        sortedCards.map((card) => (
                            <CollectionListItem
                                key={card.id}
                                card={card}
                                btcPrice={btcPrice}
                                onClick={() => setSelectedId(card.id)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 bg-[#121213] rounded-[3rem] border border-white/5 border-dashed mx-2">
                            <Zap size={40} className="text-white/10 mx-auto mb-6"/>
                            <h2 className="text-xl font-black uppercase tracking-tight mb-2">{t('empty.title')}</h2>
                            <button onClick={() => navigate('/marketplace')} className='mt-4 bg-[#FFB800] text-black font-black uppercase py-5 px-10 rounded-2xl text-xs tracking-widest active:scale-95'>
                                {t('empty.cta')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <CardDetailsModal
                isOpen={!!selectedCard}
                card={selectedCard}
                btcPrice={btcPrice}
                onClose={() => setSelectedId(null)}
                onUpdate={refreshAllData}
            />
        </div>
    );
};

export default CollectionScreen;
