import React, { useState, useMemo, useEffect } from 'react';
import { 
    ChevronRight, DollarSign, RefreshCw, 
    ArrowLeft, ShieldCheck, Info, Search, ChevronDown, X
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTyrexStore } from '../store/useTyrexStore';
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
    imageUrl: string; // Теперь это прямая ссылка
}

// --- 1. Модальное окно покупки (Ультра-быстрое) ---
const PurchaseModal = ({ isOpen, onClose, item, collection, onBuy, isBuying, balance }: any) => {
    const [tooltip, setTooltip] = useState<string | null>(null);

    if (!isOpen || !item || !collection) return null;
    const canAfford = balance >= item.priceUSDT;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
            
            <div className="bg-[#0D0D0D] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-6 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fade-in-up flex flex-col overflow-hidden">
                
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 z-20 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
                >
                    <X className="w-4 h-4 text-white/50" />
                </button>

                <div className="mt-2 -mb-2">
                    <NftCardVisual imageUrl={item.imageUrl} name={collection.name} sizeClass="w-32" serialNumber={item.serialNumber} />
                </div>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">{collection.name}</h3>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-5 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-white/20" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Price</span>
                        </div>
                        <span className="text-2xl font-black text-white italic">${item.priceUSDT.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-500/5 border border-green-500/10 rounded-2xl py-4 flex flex-col items-center cursor-pointer active:bg-green-500/10" onClick={() => setTooltip('apy')}>
                            <span className="text-[8px] font-black text-green-400/50 uppercase mb-1">APY</span>
                            <span className="text-2xl font-black text-green-400 leading-none">{collection.clientAPY}</span>
                        </div>
                        <div className="bg-tyrex-ultra-gold-glow/5 border border-tyrex-ultra-gold-glow/10 rounded-2xl py-4 flex flex-col items-center cursor-pointer active:bg-tyrex-ultra-gold-glow/10" onClick={() => setTooltip('ref')}>
                            <span className="text-[8px] font-black text-tyrex-ultra-gold-glow/50 uppercase mb-1">Ref</span>
                            <span className="text-2xl font-black text-tyrex-ultra-gold-glow leading-none">{collection.referralAPY}</span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {tooltip && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="bg-white/10 border border-white/10 rounded-xl p-3 text-[10px] text-white/80 text-center relative z-20">
                                {tooltip === 'apy' ? 'Annual mining yield. Rewards every day.' : 'Bonus from friend income.'} 
                                <button onClick={() => setTooltip(null)} className="ml-2 font-black text-tyrex-ultra-gold-glow underline uppercase">Got it</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-white/[0.02] rounded-xl py-3 px-4 flex items-center justify-center space-x-2 border border-white/[0.03]">
                        <Info className="w-3.5 h-3.5 text-white/20 shrink-0" />
                        <p className="text-[10px] text-white/40 font-medium">+<span className="text-tyrex-ultra-gold-glow font-bold">{collection.referralAPY}</span> bonus from every invited friend.</p>
                    </div>
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
                    <p className="mt-4 text-center text-red-500 font-black text-[10px] uppercase tracking-tighter opacity-70">
                        Insufficient balance (${balance.toFixed(2)})
                    </p>
                )}
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
        }
    }, [selectedCollectionId]);

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
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    {selectedCollectionId && (
                        <button onClick={() => setSelectedCollectionId(null)} className="p-1 -ml-2 active:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-6 h-6"/></button>
                    )}
                    <h1 className="text-xl font-black uppercase tracking-tighter italic">{selectedCollectionId ? activeCollection?.name : 'Market'}</h1>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-white font-black text-sm tracking-tighter">${balance.walletUsd.toFixed(2)}</div>
            </div>

            <div className="p-4 px-3">
                {!selectedCollectionId ? (
                    <div className="space-y-3">
                        {marketCardTypes.map((card) => (
                            <div key={card.id} onClick={() => setSelectedCollectionId(card.id)} className="bg-white/[0.03] p-4 rounded-[2rem] border border-white/5 flex items-center space-x-4 active:scale-95 transition-all group">
                                <div className="w-14 h-18 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0 shadow-lg">
                                    <img src={card.imageUrl} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-black text-white uppercase truncate tracking-tighter italic">{card.name}</h4>
                                    <div className="flex space-x-2 mt-1">
                                        <div className="bg-green-500/10 px-2 py-0.5 rounded text-[9px] font-black text-green-400 uppercase">APY {card.clientAPY}</div>
                                        <div className="bg-tyrex-ultra-gold-glow/10 px-2 py-0.5 rounded text-[9px] font-black text-tyrex-ultra-gold-glow uppercase">REF {card.referralAPY}</div>
                                    </div>
                                </div>
                                <ChevronRight className="opacity-20 group-hover:text-tyrex-ultra-gold-glow transition-colors"/>
                            </div>
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
                                type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Enter ID number..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-white focus:border-tyrex-ultra-gold-glow/20 outline-none transition-all tabular-nums"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-white/5 rounded-full"><X className="w-3 h-3 opacity-40"/></button>
                            )}
                        </div>

                        {/* Сетка номеров - ТЕПЕРЬ С КАРТИНКАМИ */}
                        <div className={clsx("grid gap-4 transition-all duration-300", searchQuery !== '' ? "grid-cols-1 max-w-[240px] mx-auto" : "grid-cols-2")}>
                            {loading ? (
                                [...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/5 rounded-[2.5rem] animate-pulse" />)
                            ) : (
                                filteredItems.map((item) => (
                                    <div key={item.serialNumber} onClick={() => !item.isSold && setSelectedSerial(item)} 
                                        className={clsx("relative aspect-[3/4] rounded-[2.5rem] border overflow-hidden transition-all active:scale-95",
                                            item.isSold ? "opacity-20 grayscale border-transparent" : "border-white/10 bg-white/5 shadow-xl shadow-black/40",
                                            searchQuery !== '' && "scale-105 border-tyrex-ultra-gold-glow/30"
                                        )}>
                                        
                                        {/* ПОКАЗЫВАЕМ КАРТИНКУ МОНЕТЫ */}
                                        <img src={item.imageUrl} className="w-full h-full object-contain p-4" alt="" />
                                        
                                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md py-2.5 rounded-[1.2rem] text-center border border-white/5">
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{item.isSold ? 'SOLD' : `#${item.serialNumber}`}</span>
                                        </div>
                                        {searchQuery !== '' && !item.isSold && <div className="absolute top-4 left-4 bg-green-500 rounded-full p-1 shadow-lg"><ShieldCheck className="w-3 h-3 text-black"/></div>}
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

            {/* Модалка покупки */}
            <PurchaseModal 
                isOpen={!!selectedSerial} onClose={() => setSelectedSerial(null)} 
                item={selectedSerial} collection={activeCollection} 
                onBuy={handleBuy} balance={balance.walletUsd} 
            />

            <TyrexModal {...statusModal} onClose={() => setStatusModal({ ...statusModal, isOpen: false })} />
        </div>
    );
};

export default MarketplaceScreen;