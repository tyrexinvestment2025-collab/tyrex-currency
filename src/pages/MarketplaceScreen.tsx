import React, { useState, useMemo, useEffect } from 'react';
import { Bitcoin, ChevronRight, DollarSign, RefreshCw, ArrowLeft, Hash } from 'lucide-react';
import clsx from 'clsx';
import { useTyrexStore, type TyrexCardType } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import TyrexModal from '../components/common/TyrexModal';

// --- Types ---
interface CollectionItem {
    serialNumber: number;
    isSold: boolean;
    priceUSDT: number;
    nominalSats: number;
}

// --- Components ---

// 1. Карточка Коллекции (Вход в категорию)
const CollectionCard = ({ card, onClick }: { card: TyrexCardType; onClick: () => void }) => (
    <div onClick={onClick} className="bg-gradient-to-br from-tyrex-graphite/80 to-tyrex-dark-black p-5 rounded-2xl border border-white/5 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
        {/* Эффект свечения */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-tyrex-ultra-gold-glow/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:bg-tyrex-ultra-gold-glow/10"></div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl bg-tyrex-dark-black border border-white/10 flex items-center justify-center shadow-lg group-hover:border-tyrex-ultra-gold-glow/30 transition-colors">
                    <Bitcoin className="w-8 h-8 text-tyrex-ultra-gold-glow" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{card.name}</h4>
                    <p className="text-xs text-white/50 mt-1">Limited Edition</p>
                </div>
            </div>
            <div className="text-right">
                 <div className="text-xs text-tyrex-ultra-gold-glow font-bold border border-tyrex-ultra-gold-glow/20 bg-tyrex-ultra-gold-glow/5 px-2 py-1 rounded-lg">
                    {card.available} / {card.maxSupply} Left
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/5 p-2 rounded-lg">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Nominal</p>
                <p className="text-sm font-bold text-white">{card.nominalBtcDisplay}</p>
            </div>
            <div className="bg-white/5 p-2 rounded-lg">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Yield</p>
                <p className="text-sm font-bold text-green-400">{card.clientAPY}</p>
            </div>
        </div>

        <div className="flex justify-between items-center mt-2">
            <div>
                <span className="text-[10px] text-white/40">Starting from</span>
                <span className="block text-lg font-bold text-white">${card.priceUSDT.toFixed(2)}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-tyrex-ultra-gold-glow group-hover:text-black transition-all">
                <ChevronRight className="w-4 h-4" />
            </div>
        </div>
    </div>
);

// 2. Сетка номеров (Внутри коллекции)
const SerialGridItem = ({ item, isSelected, onClick }: { item: CollectionItem; isSelected: boolean; onClick: () => void }) => {
    return (
        <button 
            disabled={item.isSold}
            onClick={onClick}
            className={clsx(
                "relative aspect-square rounded-xl flex flex-col items-center justify-center border transition-all duration-200",
                item.isSold 
                    ? "bg-white/5 border-transparent text-white/20 cursor-not-allowed" 
                    : isSelected
                        ? "bg-tyrex-ultra-gold-glow text-black border-tyrex-ultra-gold-glow shadow-[0_0_15px_rgba(255,215,0,0.4)] transform scale-105 z-10"
                        : "bg-tyrex-graphite/40 border-white/5 text-white hover:border-white/20"
            )}
        >
            <span className={clsx("text-xs font-bold", item.isSold ? "" : (isSelected ? "text-black/60" : "text-white/40"))}>#</span>
            <span className="text-lg font-black leading-none">{item.serialNumber}</span>
            {item.isSold && <span className="text-[8px] mt-1 font-medium">SOLD</span>}
        </button>
    );
};

// 3. Модальное окно покупки детализированное
const PurchaseModal = ({ isOpen, onClose, item, collection, onBuy, isBuying, balance }: any) => {
    if (!isOpen || !item || !collection) return null;
    
    const canAfford = balance >= item.priceUSDT;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-tyrex-dark-black border border-white/10 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in-up">
                
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-tyrex-ultra-gold-glow/10 rounded-full flex items-center justify-center mb-3 border border-tyrex-ultra-gold-glow/20">
                        <Hash className="w-8 h-8 text-tyrex-ultra-gold-glow" />
                    </div>
                    <h3 className="text-2xl font-black text-white">{collection.name} <span className="text-tyrex-ultra-gold-glow">#{item.serialNumber}</span></h3>
                    <p className="text-white/50 text-sm mt-1">Unique NFT Miner</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 space-y-3 mb-6">
                    <div className="flex justify-between">
                        <span className="text-sm text-white/60">Nominal Value</span>
                        <span className="text-sm font-bold text-white">{collection.nominalBtcDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-white/60">Annual Yield (APY)</span>
                        <span className="text-sm font-bold text-green-400">{collection.clientAPY}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Price</span>
                        <span className="text-xl font-black text-white">${item.priceUSDT.toFixed(2)}</span>
                    </div>
                </div>

                {!canAfford && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4 text-center">
                        Insufficient funds. You have ${balance.toFixed(2)}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="py-3 rounded-xl font-bold text-sm bg-white/5 text-white hover:bg-white/10 transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={onBuy} 
                        disabled={!canAfford || isBuying}
                        className="py-3 rounded-xl font-bold text-sm bg-tyrex-ultra-gold-glow text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center"
                    >
                        {isBuying ? <RefreshCw className="w-4 h-4 animate-spin"/> : 'Confirm Buy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Screen ---
const MarketplaceScreen: React.FC = () => {
    // Navigation State
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    
    // Data State
    const { marketCardTypes, balance } = useTyrexStore();
    const { refreshAllData } = useTelegram(); 
    const navigate = useNavigate();

    // Collection Items State
    const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    
    // Purchase State
    const [selectedSerial, setSelectedSerial] = useState<CollectionItem | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, title: '', message: '', actionText: '', onAction: () => {} });

    // 1. Fetch Items when collection selected
    useEffect(() => {
        if (selectedCollectionId) {
            setLoadingItems(true);
            cardsApi.getCollectionItems(selectedCollectionId)
                .then(data => {
                    setCollectionItems(data.items);
                })
                .catch(err => {
                    console.error(err);
                    setStatusModal({ isOpen: true, title: 'Error', message: 'Failed to load collection items', actionText: 'Close', onAction: () => setStatusModal(prev => ({...prev, isOpen: false}))});
                })
                .finally(() => setLoadingItems(false));
        } else {
            setCollectionItems([]);
            setSelectedSerial(null);
        }
    }, [selectedCollectionId]);

    // 2. Buy Handler
    const handleBuy = async () => {
        if (!selectedCollectionId || !selectedSerial) return;

        try {
            setIsBuying(true);
            await cardsApi.buyCard(selectedCollectionId, selectedSerial.serialNumber);
            await refreshAllData(); // Обновляем баланс и инвентарь
            
            // Успех
            setSelectedSerial(null); // Закрываем модалку покупки
            setStatusModal({ 
                isOpen: true, 
                title: 'Success!', 
                message: `You successfully minted NFT #${selectedSerial.serialNumber}. Check your collection.`, 
                actionText: 'Go to Collection', 
                onAction: () => navigate('/collection') 
            });
            
            // Обновляем локально сетку (помечаем как sold)
            setCollectionItems(prev => prev.map(item => 
                item.serialNumber === selectedSerial.serialNumber ? { ...item, isSold: true } : item
            ));

        } catch (error: any) {
            setSelectedSerial(null);
            setStatusModal({ 
                isOpen: true, 
                title: 'Transaction Failed', 
                message: error.message || 'Something went wrong.', 
                actionText: 'Close', 
                onAction: () => setStatusModal(prev => ({...prev, isOpen: false})) 
            });
        } finally {
            setIsBuying(false);
        }
    };

    const activeCollection = useMemo(() => 
        marketCardTypes.find(c => c.id === selectedCollectionId), 
    [marketCardTypes, selectedCollectionId]);

    // --- RENDER ---

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-tyrex-dark-black/95 backdrop-blur-md border-b border-white/5 px-4 pt-6 pb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        {selectedCollectionId && (
                            <button onClick={() => setSelectedCollectionId(null)} className="p-1 -ml-2 mr-1 rounded-full hover:bg-white/10 transition-colors">
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </button>
                        )}
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            {selectedCollectionId ? activeCollection?.name : 'Marketplace'}
                        </h1>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1.5 flex items-center space-x-2">
                        <DollarSign className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-green-400 font-bold tabular-nums">{balance.walletUsd.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {/* VIEW 1: Collections List */}
                {!selectedCollectionId && (
                    <div className="space-y-4 animate-fade-in">
                        {marketCardTypes.length > 0 ? (
                            marketCardTypes.map((card) => (
                                <CollectionCard 
                                    key={card.id} 
                                    card={card} 
                                    onClick={() => setSelectedCollectionId(card.id)} 
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-20 text-white/40 space-y-4">
                                <RefreshCw className="w-8 h-8 animate-spin text-tyrex-ultra-gold-glow" />
                                <p className="text-sm">Loading Collections...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW 2: Items Grid */}
                {selectedCollectionId && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4 px-1">
                             <p className="text-sm text-white/50">Select a serial number to mint:</p>
                             <div className="flex items-center space-x-2 text-[10px] text-white/40">
                                 <div className="flex items-center"><div className="w-2 h-2 bg-tyrex-graphite/40 border border-white/10 mr-1 rounded-sm"></div> Available</div>
                                 <div className="flex items-center"><div className="w-2 h-2 bg-white/5 mr-1 rounded-sm"></div> Sold</div>
                             </div>
                        </div>
                        
                        {loadingItems ? (
                            <div className="grid grid-cols-4 gap-3">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse"/>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                {collectionItems.map((item) => (
                                    <SerialGridItem 
                                        key={item.serialNumber}
                                        item={item}
                                        isSelected={selectedSerial?.serialNumber === item.serialNumber}
                                        onClick={() => setSelectedSerial(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <PurchaseModal 
                isOpen={!!selectedSerial} 
                onClose={() => setSelectedSerial(null)} 
                item={selectedSerial} 
                collection={activeCollection}
                onBuy={handleBuy}
                isBuying={isBuying}
                balance={balance.walletUsd}
            />

            <TyrexModal 
                isOpen={statusModal.isOpen} 
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })} 
                title={statusModal.title} 
                message={statusModal.message} 
                actionText={statusModal.actionText} 
                onAction={statusModal.onAction} 
            />
        </div>
    );
};

export default MarketplaceScreen;