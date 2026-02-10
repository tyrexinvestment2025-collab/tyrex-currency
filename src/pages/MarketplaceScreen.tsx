import React, { useState, useMemo, useEffect } from 'react';
import { 
    ChevronRight, DollarSign, RefreshCw, 
    ArrowLeft, ShieldCheck, Users, Info, Search, HelpCircle, ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTyrexStore, type TyrexCardType } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import TyrexModal from '../components/common/TyrexModal';
import NftCardVisual from '../components/NftCardVisual';

// --- Types ---
interface CollectionItem {
    serialNumber: number;
    isSold: boolean;
    priceUSDT: number;
    nominalSats: number;
    imageUrl: string; 
}

// --- 1. Карточка Коллекции (View 1: Основной список) ---
const CollectionCard = ({ card, onClick }: { card: TyrexCardType; onClick: () => void }) => (
    <div onClick={onClick} className="bg-white/[0.03] p-4 rounded-[2rem] border border-white/5 relative active:scale-95 transition-all overflow-hidden flex flex-col group">
        <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-18 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 shadow-lg">
                <img src={card.imageUrl || undefined} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-lg font-black text-white uppercase tracking-tight truncate">{card.name}</h4>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{card.available} / {card.maxSupply} LEFT</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-tyrex-ultra-gold-glow transition-colors" />
        </div>

        {/* Планки характеристик (Уменьшены в 1.5 раза) */}
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 py-1.5 px-2 rounded-xl border border-white/5 flex flex-col items-center">
                <span className="text-[8px] text-white/40 uppercase font-bold">APY</span>
                <span className="text-[11px] font-black text-green-400">{card.clientAPY}</span>
            </div>
            <div className="bg-white/5 py-1.5 px-2 rounded-xl border border-white/5 flex flex-col items-center">
                <span className="text-[8px] text-white/40 uppercase font-bold">Price</span>
                <span className="text-[11px] font-black text-white">${card.priceUSDT}</span>
            </div>
            <div className="bg-tyrex-ultra-gold-glow/10 py-1.5 px-2 rounded-xl border border-tyrex-ultra-gold-glow/20 flex flex-col items-center">
                <span className="text-[8px] text-tyrex-ultra-gold-glow uppercase font-bold flex items-center">
                   <Users className="w-2 h-2 mr-1 opacity-50"/> Ref
                </span>
                <span className="text-[11px] font-black text-tyrex-ultra-gold-glow">{card.referralAPY}</span>
            </div>
        </div>
    </div>
);

// --- 2. Модальное окно покупки (View 3: Детально) ---
const PurchaseModal = ({ isOpen, onClose, item, collection, onBuy, isBuying, balance }: any) => {
    const [tooltip, setTooltip] = useState<string | null>(null);

    if (!isOpen || !item || !collection) return null;
    const canAfford = balance >= item.priceUSDT;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/98 backdrop-blur-md" onClick={onClose} />
            <div className="bg-[#080808] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-5 relative z-10 shadow-2xl animate-fade-in-up flex flex-col overflow-hidden">
                
                <NftCardVisual imageUrl={item.imageUrl || null} name={collection.name} sizeClass="w-40" serialNumber={item.serialNumber} />

                <div className="text-center mt-2 mb-5">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{collection.name}</h3>
                </div>

                <div className="bg-white/[0.03] rounded-2xl p-4 space-y-3 mb-5 border border-white/5 relative">
                    <AnimatePresence>
                        {tooltip && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 bg-[#111] rounded-2xl p-4 flex flex-col justify-center border border-tyrex-ultra-gold-glow/20"
                            >
                                <p className="text-[11px] text-white/80 leading-relaxed text-center italic">
                                    {tooltip === 'apy' ? 'Annual yield. Your miner generates income every day for a full year.' : 'Referral bonus. Earn this % of the daily income of friends who use your link.'}
                                </p>
                                <button onClick={() => setTooltip(null)} className="mt-3 text-[10px] font-bold text-tyrex-ultra-gold-glow uppercase tracking-widest">Got it</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#888888] uppercase">Price</span>
                        <span className="text-xs font-black text-white">${item.priceUSDT.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center" onClick={() => setTooltip('apy')}>
                        <div className="flex items-center space-x-1.5 cursor-pointer">
                            <span className="text-[10px] font-bold text-[#888888] uppercase">Your APY</span>
                            <HelpCircle className="w-3 h-3 text-[#444]"/>
                        </div>
                        <span className="text-xs font-black text-green-400">+{collection.clientAPY}</span>
                    </div>

                    <div className="flex justify-between items-center" onClick={() => setTooltip('ref')}>
                        <div className="flex items-center space-x-1.5 cursor-pointer">
                            <span className="text-[10px] font-bold text-[#888888] uppercase">Ref. Bonus</span>
                            <HelpCircle className="w-3 h-3 text-tyrex-ultra-gold-glow/30"/>
                        </div>
                        <span className="text-xs font-black text-tyrex-ultra-gold-glow">+{collection.referralAPY}</span>
                    </div>

                    <div className="h-px bg-white/5 my-1" />

                    <div className="flex items-start space-x-2 pt-1 opacity-60">
                        <Info className="w-3 h-3 text-tyrex-ultra-gold-glow mt-0.5 shrink-0" />
                        <p className="text-[9px] text-white/40 leading-tight">
                            Earn {collection.referralAPY} daily from every active friend with this card.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button onClick={onClose} className="py-4 text-white/20 font-black text-[11px] uppercase tracking-widest">Cancel</button>
                    <button 
                        onClick={onBuy} 
                        disabled={!canAfford || isBuying}
                        className="py-4 bg-tyrex-ultra-gold-glow text-black rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 disabled:opacity-20 transition-all shadow-lg"
                    >
                        {isBuying ? <RefreshCw className="w-4 h-4 animate-spin mx-auto"/> : 'BUY NFT'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ОСНОВНОЙ ЭКРАН ---
const MarketplaceScreen: React.FC = () => {
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const { marketCardTypes, balance } = useTyrexStore();
    const { refreshAllData } = useTelegram(); 
    const navigate = useNavigate();

    const [items, setItems] = useState<CollectionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(20);
    
    const [selectedSerial, setSelectedSerial] = useState<CollectionItem | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, title: '', message: '', actionText: '', onAction: () => {} });

    useEffect(() => {
        if (selectedCollectionId) {
            setLoading(true);
            cardsApi.getCollectionItems(selectedCollectionId)
                .then(data => data && data.items && setItems(data.items))
                .finally(() => setLoading(false));
        } else {
            setItems([]);
            setSearchQuery('');
            setVisibleCount(20);
        }
    }, [selectedCollectionId]);

    // Умная фильтрация: если ищем, показываем ТОЛЬКО первое совпадение
    const filteredItems = useMemo(() => {
        const query = searchQuery.trim().replace('#', '');
        if (query === '') return items.slice(0, visibleCount);

        const match = items.find(item => item.serialNumber.toString().includes(query));
        return match ? [match] : [];
    }, [items, searchQuery, visibleCount]);

    const handleBuy = async () => {
        if (!selectedCollectionId || !selectedSerial) return;
        try {
            setIsBuying(true);
            await cardsApi.buyCard(selectedCollectionId, selectedSerial.serialNumber);
            await refreshAllData();
            setSelectedSerial(null);
            setStatusModal({ 
                isOpen: true, title: 'Success!', 
                message: `NFT #${selectedSerial.serialNumber} added to your vault.`, 
                actionText: 'View Vault', onAction: () => navigate('/collection') 
            });
        } catch (error: any) {
            setSelectedSerial(null);
            setStatusModal({ isOpen: true, title: 'Error', message: error.message || 'Failed', actionText: 'Close', onAction: () => setStatusModal(p => ({...p, isOpen: false}))});
        } finally {
            setIsBuying(false);
        }
    };

    const activeCollection = useMemo(() => marketCardTypes.find(c => c.id === selectedCollectionId), [marketCardTypes, selectedCollectionId]);

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans tracking-tight">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    {selectedCollectionId && (
                        <button onClick={() => setSelectedCollectionId(null)} className="p-1 -ml-2 active:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6"/>
                        </button>
                    )}
                    <h1 className="text-xl font-black uppercase tracking-tighter">
                        {selectedCollectionId ? (activeCollection?.name || 'Loading...') : 'Market'}
                    </h1>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center space-x-2">
                    <DollarSign className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-white font-black text-sm tabular-nums tracking-tighter">${balance.walletUsd.toFixed(2)}</span>
                </div>
            </div>

            <div className="p-4 px-3">
                {!selectedCollectionId ? (
                    <div className="space-y-3">
                        {marketCardTypes.map((card) => (
                            <CollectionCard key={card.id} card={card} onClick={() => setSelectedCollectionId(card.id)} />
                        ))}
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {/* Поиск по ID */}
                        <div className="relative mb-8">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                <Search className="w-4 h-4 text-tyrex-ultra-gold-glow/40" />
                                <span className="text-white/10 font-black text-xs">#</span>
                            </div>
                           <input 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*" // Дополнительная подсказка для браузеров
                            placeholder="Enter ID number..."
                            value={searchQuery}
                            onChange={(e) => {
        // Разрешаем вводить только цифры через регулярку
                            const val = e.target.value.replace(/\D/g, '');
                            setSearchQuery(val);
                            }}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-white placeholder:text-white/10 focus:border-tyrex-ultra-gold-glow/20 outline-none transition-all tabular-nums"
/>
                        </div>

                        {/* Сетка: 2 колонки (обычно) или 1 колонка (при поиске) */}
                        <div className={clsx(
                            "grid gap-4 transition-all duration-300",
                            searchQuery !== '' ? "grid-cols-1 max-w-[240px] mx-auto" : "grid-cols-2"
                        )}>
                            {loading ? (
                                [...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/5 rounded-[2.5rem] animate-pulse" />)
                            ) : (
                                filteredItems.map((item) => (
                                    <div 
                                        key={item.serialNumber} 
                                        onClick={() => !item.isSold && setSelectedSerial(item)} 
                                        className={clsx(
                                            "relative aspect-[3/4] rounded-[2.5rem] border overflow-hidden transition-all active:scale-95",
                                            item.isSold ? "opacity-20 grayscale border-transparent" : "border-white/10 bg-white/5 shadow-xl",
                                            searchQuery !== '' && "scale-105 border-tyrex-ultra-gold-glow/30 shadow-[0_0_30px_rgba(255,215,0,0.1)]"
                                        )}
                                    >
                                        <img src={item.imageUrl || undefined} className="w-full h-full object-contain p-4" alt="" />
                                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 py-2.5 rounded-[1.2rem] text-center">
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{item.isSold ? 'SOLD' : `#${item.serialNumber}`}</span>
                                        </div>
                                        {searchQuery !== '' && !item.isSold && (
                                            <div className="absolute top-4 left-4 bg-green-500 rounded-full p-1"><ShieldCheck className="w-3 h-3 text-black"/></div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Пустое состояние */}
                        {filteredItems.length === 0 && !loading && (
                            <div className="text-center py-20 opacity-20 font-black uppercase tracking-widest text-[10px]">No miner found</div>
                        )}

                        {/* Загрузить еще */}
                        {searchQuery === '' && !loading && items.length > visibleCount && (
                            <button 
                                onClick={() => setVisibleCount(v => v + 20)}
                                className="w-full mt-10 py-5 bg-white/5 rounded-[1.5rem] border border-white/5 text-[9px] font-black uppercase tracking-[0.4em] text-white/20 flex items-center justify-center space-x-2 active:bg-white/10"
                            >
                                <ChevronDown className="w-3 h-3 opacity-50"/>
                                <span>Load More</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Модалка покупки */}
            <PurchaseModal 
                isOpen={!!selectedSerial} 
                onClose={() => setSelectedSerial(null)} 
                item={selectedSerial} 
                collection={activeCollection} 
                onBuy={handleBuy} 
                isBuying={isBuying} 
                balance={balance.walletUsd} 
            />

            <TyrexModal {...statusModal} onClose={() => setStatusModal({ ...statusModal, isOpen: false })} />
        </div>
    );
};

export default MarketplaceScreen;