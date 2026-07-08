import React, { useState, useMemo, useEffect } from 'react';
import { 
     RefreshCw, ArrowLeft, Search, X, Wallet, TrendingUp, Info, Filter, SortAsc, SortDesc, Star, Rocket
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTyrexStore, type TyrexCard, type TyrexCardType } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NftCardVisual from '../components/NftCardVisual';

// --- Types ---
interface CollectionItem {
    serialNumber: number;
    isSold: boolean;
    priceUSDT: number;
    nominalSats: number;
    imageUrl: string; 
}

// --- 1. Конфігурація стилів для Тирів (Правка №2) ---
const TIER_STYLES: Record<string, any> = {
    'MINI': { text: 'text-[#CD7F32]', border: 'border-[#CD7F32]/40', bg: 'bg-[#CD7F32]/10', shadow: 'shadow-[#CD7F32]/20' },
    'MIDI': { text: 'text-[#00FFFF]', border: 'border-[#00FFFF]/40', bg: 'bg-[#00FFFF]/10', shadow: 'shadow-[#00FFFF]/20' },
    'MAXI': { text: 'text-[#FFD700]', border: 'border-[#FFD700]/40', bg: 'bg-[#FFD700]/10', shadow: 'shadow-[#FFD700]/20' },
    'ULTRA': { text: 'text-[#BF00FF]', border: 'border-[#BF00FF]/60', bg: 'bg-[#BF00FF]/10', shadow: 'shadow-[#BF00FF]/30', glow: 'drop-shadow-[0_0_8px_#BF00FF]' },
    'INFINITY': { text: 'text-white shadow-[0_0_15px_rgba(255,255,255,0.5)]', border: 'border-white/40', bg: 'bg-white/10', glow: 'drop-shadow-[0_0_10px_#fff]' },
};

const getTierStyle = (name: string) => {
    const upperName = name.toUpperCase();
    if (upperName.includes('MINI')) return TIER_STYLES['MINI'];
    if (upperName.includes('MIDI')) return TIER_STYLES['MIDI'];
    if (upperName.includes('MAXI')) return TIER_STYLES['MAXI'];
    if (upperName.includes('ULTRA')) return TIER_STYLES['ULTRA'];
    if (upperName.includes('INFINITY')) return TIER_STYLES['INFINITY'];
    return TIER_STYLES['MINI'];
};

// --- Компонент клікабельної плашки (Правка №3) ---
const MetricButton = ({ label, value, type, colorClass, onClick }: any) => (
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

// --- КАРТОЧКА КОЛЕКЦІЇ (Правка №1, №2, №5) ---
const CollectionCard = ({ card, onClick, onInfo }: { card: TyrexCardType; onClick: () => void; onInfo: (type: string, c: any) => void }) => {
    const style = getTierStyle(card.name);
    const isLowSupply = card.available <= 5; // Поріг для червоного кольору (Правка №5)

    return (
        <div onClick={onClick} className="bg-[#111112] border border-white/5 rounded-[2.8rem] relative active:scale-[0.98] transition-all overflow-hidden mb-6 shadow-2xl group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10 pointer-events-none" />
            
            <div className="relative z-20 p-7 flex flex-col items-center">
                {/* Header: Name + Left Count */}
                <div className="w-full flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                        <h4 className={clsx("text-2xl font-black uppercase italic tracking-tighter leading-none", style.text)}>
                            {card.name}
                        </h4>
                        <span className="text-[11px] font-bold text-white/20 uppercase mt-1 tracking-tight">
                            Nominal: {card.nominalBtcDisplay}
                        </span>
                    </div>
                    <div className={clsx(
                        "px-3 py-1 rounded-full border text-[9px] font-black uppercase transition-colors",
                        isLowSupply ? "border-red-500 text-red-500 bg-red-500/10 animate-pulse" : "border-white/10 text-white/30"
                    )}>
                        {card.available} / {card.maxSupply} LEFT
                    </div>
                </div>

                {/* МОНЕТА (Правка №1: наїзд плашок) */}
                <div className="w-56 h-56 relative -my-8 transform group-hover:scale-110 transition-all duration-700 ease-out z-0">
                    <img src={card.imageUrl} className={clsx("w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]", style.glow)} alt="" />
                </div>

                {/* Капсули (Правка №1) */}
                <div className="grid grid-cols-3 gap-2.5 w-full relative z-20 mt-2">
                    <MetricButton label="APY" value={card.clientAPY} type="apy" colorClass="text-green-400" onClick={(t:any) => onInfo(t, card)} />
                    <MetricButton label="PRICE" value={`$${card.priceUSDT}`} type="price" colorClass="text-white" onClick={(t:any) => onInfo(t, card)} />
                    <MetricButton label="REF" value={card.referralAPY} type="ref" colorClass="text-[#FFB800]" onClick={(t:any) => onInfo(t, card)} />
                </div>
            </div>
        </div>
    );
};

// --- ГОЛОВНИЙ ЕКРАН ---
const MarketplaceScreen: React.FC = () => {
    const navigate = useNavigate();
    const { marketCardTypes, balance, btcPrice, cards } = useTyrexStore();
    const { refreshAllData } = useTelegram(); 

    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'NODES' | 'BOOSTERS'>('NODES');
    const [items, setItems] = useState<CollectionItem[]>([]);
    const [_loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSold, setFilterSold] = useState(false);
    const [sortMode, setSortMode] = useState<'ASC' | 'DESC'>('ASC');
    
    const [selectedSerial, setSelectedSerial] = useState<CollectionItem | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; content: string } | null>(null);

    // Завантаження предметів колекції
    useEffect(() => {
        if (selectedCollectionId) {
            setLoading(true);
            cardsApi.getCollectionItems(selectedCollectionId)
                .then(data => data && data.items && setItems(data.items))
                .finally(() => setLoading(false));
        }
    }, [selectedCollectionId]);

    // Список серійників, які вже купив юзер (Правка №8)
    const mySerialNumbers = useMemo(() => {
        return new Set(
            cards
                .filter((c: TyrexCard) => c.cardTypeId === selectedCollectionId)
                .map(c => c.serialNumber)
        );
    }, [cards, selectedCollectionId]);

    // Фільтрація та сортування (Правка №7)
    const filteredItems = useMemo(() => {
        let list = [...items];
        if (filterSold) list = list.filter(i => !i.isSold);
        if (searchQuery) list = list.filter(i => i.serialNumber.toString().includes(searchQuery));
        
        list.sort((a, b) => sortMode === 'ASC' 
            ? a.serialNumber - b.serialNumber 
            : b.serialNumber - a.serialNumber
        );
        return list;
    }, [items, filterSold, searchQuery, sortMode]);

    const handleBuy = async () => {
        if (!selectedCollectionId || !selectedSerial) return;
        try {
            setIsBuying(true);
            const liveCost = (selectedSerial.nominalSats / 100000000) * btcPrice;
            if (balance.walletUsd < liveCost) throw new Error("Insufficient funds");

            await cardsApi.buyCard(selectedCollectionId, selectedSerial.serialNumber);
            toast.success(`Success! #${selectedSerial.serialNumber} is now yours.`);
            await refreshAllData();
            setSelectedSerial(null);
            navigate('/collection');
        } catch (error: any) {
            toast.error(error.message || 'Purchase failed');
        } finally { setIsBuying(false); }
    };

    const activeCollection = useMemo(() => marketCardTypes.find(c => c.id === selectedCollectionId), [marketCardTypes, selectedCollectionId]);

    const handleOpenInfo = (type: string, collection: any) => {
        const infoMap: any = {
            apy: { title: 'Annual Yield', content: `This node generates ${collection.clientAPY} per year in BTC equivalent. Rewards are calculated daily.` },
            price: { title: 'Dynamic Price', content: `The price is pegged to ${collection.nominalBtcDisplay}. It updates every minute based on the BTC/USDT rate.` },
            ref: { title: 'Partnership', content: `You receive ${collection.referralAPY} from the daily earnings of your first-line partners who own this node.` }
        };
        setInfoModal({ isOpen: true, ...infoMap[type] });
    };

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 font-sans relative">
            
            {/* Header (Правка №11) */}
            <div className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {selectedCollectionId && (
                        <button onClick={() => setSelectedCollectionId(null)} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20}/></button>
                    )}
                    <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">
                        {selectedCollectionId ? activeCollection?.name : 'Market'}
                    </h1>
                </div>
                <div className="bg-[#141415] border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-inner">
                    <Wallet size={14} className="text-[#FFB800]" />
                    <span className="text-sm font-black italic tracking-tighter">${balance.walletUsd.toFixed(2)}</span>
                </div>
            </div>

            <div className="p-4">
                {!selectedCollectionId ? (
                    <>
                        {/* Section Switcher (Правка №4) */}
                        <div className="flex p-1 bg-[#141415] rounded-2xl mb-8 border border-white/5">
                            {(['NODES', 'BOOSTERS'] as const).map(s => (
                                <button 
                                    key={s} onClick={() => setActiveSection(s)} 
                                    className={clsx(
                                        "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                        activeSection === s ? "bg-white text-black shadow-xl" : "text-white/20"
                                    )}
                                >
                                    {s === 'BOOSTERS' ? 'Boosters (Soon)' : 'Mining Nodes'}
                                </button>
                            ))}
                        </div>

                        {activeSection === 'NODES' ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {marketCardTypes.map((card) => (
                                    <CollectionCard key={card.id} card={card} onClick={() => setSelectedCollectionId(card.id)} onInfo={handleOpenInfo} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center opacity-30">
                                <Rocket size={48} className="mx-auto mb-4 animate-bounce" />
                                <p className="text-xs font-black uppercase tracking-[0.3em]">Coming Soon</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {/* STICKY INFO HUD (Правка №6) */}
                        <div className="sticky top-20 z-30 bg-[#080808] pb-6 space-y-4">
                            <div className="bg-[#141415] border border-white/10 p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-pulse" />
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Selected Series</p>
                                    </div>
                                    <h2 className={clsx("text-2xl font-black uppercase italic tracking-tighter", getTierStyle(activeCollection!.name).text)}>
                                        {activeCollection?.name}
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-white">{activeCollection?.clientAPY}</p>
                                    <p className="text-[9px] font-bold text-[#FFB800] uppercase">{activeCollection?.available} Nodes Left</p>
                                </div>
                            </div>

                            {/* FILTERS & SEARCH (Правка №7) */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input 
                                        type="number" placeholder="Search ID..."
                                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#141415] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-[#FFB800]/20 transition-all"
                                    />
                                </div>
                                <button 
                                    onClick={() => setFilterSold(!filterSold)}
                                    className={clsx(
                                        "p-4 rounded-2xl border transition-all",
                                        filterSold ? "bg-[#FFB800] text-black border-[#FFB800]" : "bg-white/5 border-white/5 text-white/40"
                                    )}
                                >
                                    <Filter size={20} />
                                </button>
                                <button 
                                    onClick={() => setSortMode(s => s === 'ASC' ? 'DESC' : 'ASC')}
                                    className="p-4 bg-white/5 rounded-2xl border border-white/5 text-white/40 active:scale-90 transition-all"
                                >
                                    {sortMode === 'ASC' ? <SortAsc size={20}/> : <SortDesc size={20}/>}
                                </button>
                            </div>
                        </div>

                        {/* SERIALS GRID (Правка №8: Виділення YOURS) */}
                        <div className="grid grid-cols-2 gap-4">
                            {filteredItems.map((item) => {
                                const isOwned = mySerialNumbers.has(item.serialNumber);
                                return (
                                    <div key={item.serialNumber} onClick={() => !item.isSold && setSelectedSerial(item)} 
                                        className={clsx(
                                            "relative aspect-square rounded-[2.5rem] border overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center bg-[#050505]",
                                            item.isSold ? (isOwned ? "border-[#FFB800] shadow-[0_0_20px_rgba(255,184,0,0.2)]" : "opacity-20 grayscale border-transparent") : "border-white/10 shadow-xl"
                                        )}>
                                        <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                        
                                        {isOwned && (
                                            <div className="absolute top-4 left-4 bg-[#FFB800] text-black px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shadow-lg z-20">
                                                <Star size={10} fill="currentColor"/> YOURS
                                            </div>
                                        )}

                                        <div className={clsx(
                                            "absolute bottom-4 left-4 right-4 backdrop-blur-md py-2.5 rounded-xl text-center border z-20", 
                                            isOwned ? "bg-[#FFB800] border-[#FFB800] text-black" : "bg-black/80 border-white/10 text-white"
                                        )}>
                                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                                                {item.isSold ? (isOwned ? 'OWNED' : 'SOLD') : `#${item.serialNumber}`}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* --- PURCHASE MODAL (Правка №9, №10) --- */}
            <AnimatePresence>
                {selectedSerial && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSerial(null)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
                        <motion.div 
                            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                            className="bg-[#0D0D0E] border border-white/10 w-full max-w-sm rounded-[3.5rem] p-8 relative z-10 shadow-2xl flex flex-col"
                        >
                            <button onClick={() => setSelectedSerial(null)} className="absolute top-8 right-8 p-2 bg-white/5 rounded-full text-white/30"><X size={18}/></button>
                            
                            <div className="flex justify-center -mt-6 mb-4">
                                <NftCardVisual imageUrl={selectedSerial.imageUrl} name={activeCollection!.name} sizeClass="w-60" serialNumber={selectedSerial.serialNumber} />
                            </div>

                            <div className="text-center mb-8">
                                <h3 className={clsx("text-3xl font-black uppercase italic tracking-tighter leading-none mb-2", getTierStyle(activeCollection!.name).text)}>
                                    {activeCollection!.name} <span className="text-white/20">#{selectedSerial.serialNumber}</span>
                                </h3>
                                <div className="inline-flex items-center gap-2 bg-white/5 px-5 py-2 rounded-full border border-white/10">
                                    <TrendingUp size={14} className="text-[#FFB800]" />
                                    <span className="text-xs font-black text-white/70 uppercase tracking-tighter">{activeCollection?.nominalBtcDisplay}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="flex justify-between items-end border-b border-white/5 pb-4 px-2">
                                    <span className="text-[11px] font-black text-white/30 uppercase tracking-widest">Current Value</span>
                                    <span className="text-4xl font-black text-white tabular-nums">${((selectedSerial.nominalSats/100000000)*btcPrice).toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-white/20 uppercase mb-1">Your Wallet</span>
                                        <span className="text-base font-black text-white">${balance.walletUsd.toFixed(2)}</span>
                                    </div>
                                    <div className="bg-[#FFB800]/10 p-5 rounded-3xl border border-[#FFB800]/20 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-[#FFB800] uppercase mb-1">Daily Yield</span>
                                        <span className="text-base font-black text-[#FFB800]">~${(((selectedSerial.nominalSats/100000000)*btcPrice * (parseFloat(activeCollection!.clientAPY)/100))/365).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleBuy} 
                                disabled={isBuying || balance.walletUsd < ((selectedSerial.nominalSats/100000000)*btcPrice)}
                                className="w-full py-6 bg-[#FFB800] text-black rounded-[2rem] font-black uppercase text-base tracking-[0.2em] shadow-[0_15px_45px_rgba(255,184,0,0.3)] active:scale-95 disabled:grayscale disabled:opacity-20 transition-all"
                            >
                                {isBuying ? <RefreshCw className="animate-spin mx-auto" /> : 'Confirm Order'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* INFO POPUP (Правка №3) */}
            <AnimatePresence>
                {infoModal?.isOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" onClick={() => setInfoModal(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-white/10 p-10 rounded-[3rem] max-w-sm text-center shadow-2xl relative">
                             <div className="w-16 h-16 bg-[#FFB800]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Info size={32} className="text-[#FFB800]" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-white mb-4 tracking-tighter">{infoModal.title}</h3>
                            <p className="text-white/60 leading-relaxed italic text-sm mb-8">{infoModal.content}</p>
                            <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Got it</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketplaceScreen;