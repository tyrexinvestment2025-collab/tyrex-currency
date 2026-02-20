import React, { useState, useMemo, useEffect } from 'react';
import { 
    DollarSign, RefreshCw, ArrowLeft, ShieldCheck, Search, ChevronDown, X, Wallet, TrendingUp
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

// --- 1. КАРТОЧКА КОЛЛЕКЦИИ (HUGE COINS SHOWCASE) ---
const CollectionCard = ({ card, onClick }: { card: TyrexCardType; onClick: () => void }) => (
    <div onClick={onClick} className="bg-[#141415] border border-white/5 rounded-[2.5rem] relative active:scale-[0.98] transition-all overflow-hidden mb-4 shadow-2xl group cursor-pointer">
        
        {/* Фон и свечение */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-tyrex-ultra-gold-glow/10 blur-[60px] rounded-full group-hover:bg-tyrex-ultra-gold-glow/20 transition-colors" />

        <div className="relative z-20 flex flex-col items-center p-6 pb-8">
            
            {/* ОГРОМНАЯ МОНЕТА */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 relative mb-4 transform group-hover:scale-105 transition-transform duration-500 ease-out">
                <img 
                    src={card.imageUrl} 
                    className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" 
                    alt={card.name} 
                />
            </div>

            {/* Инфо */}
            <div className="text-center w-full">
                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">{card.name}</h4>
                
                {/* Характеристики в ряд */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 border border-white/5 rounded-2xl py-3 flex flex-col items-center justify-center">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-wider mb-1">APY</span>
                        <span className="text-sm font-black text-green-400">{card.clientAPY}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl py-3 flex flex-col items-center justify-center">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-wider mb-1">Price</span>
                        {/* Анимированная цена в карточке */}
                        <motion.span 
                            key={card.priceUSDT}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-black text-white"
                        >
                            ${card.priceUSDT}
                        </motion.span>
                    </div>
                    <div className="bg-tyrex-ultra-gold-glow/10 border border-tyrex-ultra-gold-glow/20 rounded-2xl py-3 flex flex-col items-center justify-center">
                        <span className="text-[9px] font-black text-tyrex-ultra-gold-glow/60 uppercase tracking-wider mb-1">Ref</span>
                        <span className="text-sm font-black text-tyrex-ultra-gold-glow">{card.referralAPY}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- 2. МОДАЛЬНОЕ ОКНО ПОКУПКИ ---
const PurchaseModal = ({ isOpen, onClose, item, collection, onBuy, isBuying, balance, btcPrice }: any) => {
    const [tooltip, setTooltip] = useState<string | null>(null);

    if (!isOpen || !item || !collection) return null;

    // ИСПРАВЛЕНИЕ: Берем nominalSats из айтема, либо из коллекции (как запасной вариант)
    const sats = item.nominalSats || collection.nominalSats || 0;
    const livePrice = (sats / 100000000) * btcPrice;
    
    const canAfford = balance >= livePrice;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
            
            <div className="bg-[#0D0D0D] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-6 relative z-10 shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-fade-in-up flex flex-col overflow-hidden max-h-[95vh]">
                
                <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                    <X className="w-4 h-4 text-white/50" />
                </button>

                <div className="flex justify-center mt-2 -mb-2">
                    <NftCardVisual imageUrl={item.imageUrl} name={collection.name} sizeClass="w-48" serialNumber={item.serialNumber} />
                </div>

                <div className="text-center mb-6 mt-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">{collection.name}</h3>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-3 px-5 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-white/30" />
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Price</span>
                        </div>
                        <motion.span 
                            key={livePrice}
                            initial={{ scale: 1.05, color: '#fbbf24' }}
                            animate={{ scale: 1, color: '#fff' }}
                            className="text-2xl font-black text-white tabular-nums"
                        >
                            ${livePrice.toFixed(2)}
                        </motion.span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-500/5 border border-green-500/10 rounded-2xl py-3 flex flex-col items-center cursor-pointer active:bg-green-500/10" onClick={() => setTooltip('apy')}>
                            <span className="text-[8px] font-black text-green-400/50 uppercase mb-0.5">APY</span>
                            <span className="text-xl font-black text-green-400 leading-none">{collection.clientAPY}</span>
                        </div>
                        <div className="bg-tyrex-ultra-gold-glow/5 border border-tyrex-ultra-gold-glow/10 rounded-2xl py-3 flex flex-col items-center cursor-pointer active:bg-tyrex-ultra-gold-glow/10" onClick={() => setTooltip('ref')}>
                            <span className="text-[8px] font-black text-tyrex-ultra-gold-glow/50 uppercase mb-0.5">Ref</span>
                            <span className="text-xl font-black text-tyrex-ultra-gold-glow leading-none">{collection.referralAPY}</span>
                        </div>
                    </div>
                    
                    <AnimatePresence>{tooltip && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white/5 rounded-xl p-2 text-center text-[10px] text-white/60">
                            {tooltip === 'apy' ? 'Annual mining yield.' : 'Bonus from friends.'}
                        </motion.div>
                    )}</AnimatePresence>
                </div>

                {/* Баланс и Кнопка */}
                <div className="mt-auto pt-2">
                    <div className="flex justify-between items-center px-2 mb-3">
                        <div className="flex items-center space-x-1.5 opacity-50">
                            <Wallet className="w-3.5 h-3.5 text-white" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Your Balance</span>
                        </div>
                        <span className={clsx("text-xs font-black tracking-wide tabular-nums", canAfford ? "text-white" : "text-red-500")}>
                            ${balance.toFixed(2)}
                        </span>
                    </div>

                    <button 
                        onClick={onBuy} 
                        disabled={!canAfford || isBuying}
                        className={clsx(
                            "w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all relative",
                            canAfford 
                                ? "bg-tyrex-ultra-gold-glow text-black shadow-[0_10px_30px_rgba(255,215,0,0.2)] active:scale-[0.97]" 
                                : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
                        )}
                    >
                        {isBuying ? <RefreshCw className="w-5 h-5 animate-spin mx-auto"/> : 'BUY NFT'}
                    </button>
                    
                    {!canAfford && (
                        <p className="mt-3 text-center text-red-500 font-black text-[9px] uppercase tracking-wide opacity-60">
                            Insufficient Funds
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ОСНОВНОЙ ЭКРАН ---
const MarketplaceScreen: React.FC = () => {
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const { marketCardTypes, balance, btcPrice } = useTyrexStore();
    const { refreshAllData } = useTelegram(); 
    const navigate = useNavigate();

    const [items, setItems] = useState<CollectionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(24);
    
    const [selectedSerial, setSelectedSerial] = useState<CollectionItem | null>(null);
    const [_isBuying, setIsBuying] = useState(false);
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
            setVisibleCount(24);
        }
    }, [selectedCollectionId]);

    // Живой пересчет фильтрованных айтемов на основе глобального btcPrice
    const filteredItems = useMemo(() => {
        const query = searchQuery.trim().replace('#', '');
        let currentList = items;
        if (query !== '') {
            const match = items.find(item => item.serialNumber.toString().includes(query));
            currentList = match ? [match] : [];
        } else {
            currentList = items.slice(0, visibleCount);
        }

        // Пересчитываем цену каждого айтема в зависимости от текущего курса
        return currentList.map(item => ({
            ...item,
            priceUSDT: (item.nominalSats / 100000000) * btcPrice
        }));
    }, [items, searchQuery, visibleCount, btcPrice]);

    const handleBuy = async () => {
        if (!selectedCollectionId || !selectedSerial) return;
        try {
            setIsBuying(true);
            await cardsApi.buyCard(selectedCollectionId, selectedSerial.serialNumber);
            await refreshAllData();
            setSelectedSerial(null);
            setStatusModal({ 
                isOpen: true, title: 'Success!', 
                message: `NFT #${selectedSerial.serialNumber} is now yours.`, 
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
            {/* Header с живым курсом BTC */}
            <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    {selectedCollectionId && (
                        <button onClick={() => setSelectedCollectionId(null)} className="p-1 -ml-2 active:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-6 h-6"/></button>
                    )}
                    <h1 className="text-xl font-black uppercase tracking-tighter italic">{selectedCollectionId ? activeCollection?.name : 'Market'}</h1>
                </div>

                <div className="flex items-center space-x-2">
                    {/* Индикатор курса BTC */}
                    <div className="hidden xs:flex items-center space-x-1.5 bg-white/5 border border-white/5 rounded-2xl px-3 py-2">
                        <TrendingUp className="w-3 h-3 text-tyrex-ultra-gold-glow" />
                        <motion.span 
                            key={btcPrice}
                            initial={{ y: -5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-[10px] font-black text-tyrex-ultra-gold-glow tabular-nums"
                        >
                            ${btcPrice.toLocaleString()}
                        </motion.span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-white font-black text-sm tracking-tighter">
                        ${balance.walletUsd.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="p-4 px-3">
                {!selectedCollectionId ? (
                    <div className="space-y-4 animate-fade-in">
                        {/* 1. БОЛЬШИЕ КАРТОЧКИ (Витрина) */}
                        {marketCardTypes.map((card) => (
                            <CollectionCard key={card.id} card={card} onClick={() => setSelectedCollectionId(card.id)} />
                        ))}
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {/* Поиск */}
                        <div className="relative mb-8">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                <Search className="w-4 h-4 text-tyrex-ultra-gold-glow/40" />
                                <span className="text-white/10 font-black text-xs">#</span>
                            </div>
                            <input 
                                type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Enter ID number..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-white focus:border-tyrex-ultra-gold-glow/20 outline-none transition-all tabular-nums"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-white/5 rounded-full"><X className="w-3 h-3 opacity-40"/></button>
                            )}
                        </div>

                        {/* Сетка номеров - Квадратная */}
                        <div className={clsx("grid gap-4 transition-all duration-300", searchQuery !== '' ? "grid-cols-1 max-w-[240px] mx-auto" : "grid-cols-2")}>
                            {loading ? (
                                [...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded-[2rem] animate-pulse" />)
                            ) : (
                                filteredItems.map((item) => (
                                    <div key={item.serialNumber} onClick={() => !item.isSold && setSelectedSerial(item)} 
                                        className={clsx("relative aspect-square rounded-[2rem] border overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center bg-[#050505]",
                                            item.isSold ? "opacity-20 grayscale border-transparent" : "border-white/10 shadow-xl shadow-black/40",
                                            searchQuery !== '' && "scale-105 border-tyrex-ultra-gold-glow/30"
                                        )}>
                                        
                                        <img src={item.imageUrl} className="w-full h-full object-cover p-0" alt="" />
                                        
                                        <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md py-1.5 rounded-xl text-center border border-white/10">
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">{item.isSold ? 'SOLD' : `#${item.serialNumber}`}</span>
                                        </div>
                                        
                                        {searchQuery !== '' && !item.isSold && <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1 shadow-lg"><ShieldCheck className="w-3 h-3 text-black"/></div>}
                                    </div>
                                ))
                            )}
                        </div>

                        {searchQuery === '' && !loading && items.length > visibleCount && (
                            <button onClick={() => setVisibleCount(v => v + 24)} 
                                className="w-full mt-10 py-5 bg-white/5 rounded-[1.5rem] border border-white/5 text-[9px] font-black uppercase tracking-[0.4em] text-white/20 flex items-center justify-center space-x-2 active:bg-white/10 transition-all">
                                <ChevronDown className="w-3 h-3 opacity-50"/><span>Load More</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Модалка покупки с передачей btcPrice */}
            <PurchaseModal 
                isOpen={!!selectedSerial} onClose={() => setSelectedSerial(null)} 
                item={selectedSerial} collection={activeCollection} 
                onBuy={handleBuy} balance={balance.walletUsd} 
                btcPrice={btcPrice}
            />

            <TyrexModal {...statusModal} onClose={() => setStatusModal({ ...statusModal, isOpen: false })} />
        </div>
    );
};

export default MarketplaceScreen;