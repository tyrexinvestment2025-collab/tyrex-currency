import React, { useState, useEffect } from 'react';
import { 
     Clock, Zap, Info, Loader2, RefreshCw, 
     X, DollarSign,  BarChart3, Hash,  ShieldCheck 
} from 'lucide-react';
import { useTyrexStore, type TyrexCard } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import LiveProfit from '../components/LiveProfit';
import NftCardVisual from '../components/NftCardVisual';

// --- Helper: Маскировка ника ---
const maskUsername = (username?: string) => {
    if (!username) return 'Unknown User';
    if (username.length <= 4) return username + '***';
    return username.slice(0, 3) + '***' + username.slice(-1);
};

const parseVal = (val: any) => val?.$numberDecimal ? parseFloat(val.$numberDecimal) : (parseFloat(val) || 0);

// --- Элемент списка (Карточка) ---
interface ListItemProps {
    card: TyrexCard;
    onClick: () => void;
    btcPrice: number;
}

const CollectionListItem: React.FC<ListItemProps> = ({ card, onClick, btcPrice }) => {
    let statusText = 'Inactive';
    let bgGradient = 'from-tyrex-graphite/40 to-tyrex-graphite/20';

    if (card.status === 'Active') {
        statusText = 'Mining';
        bgGradient = 'from-green-900/10 to-tyrex-graphite/20 border-green-500/10';
    } else if (card.status === 'Cooling') {
        statusText = 'Cooling';
    }

    const nominalSats = card.nominalBtc * 100000000;

    return (
        <div onClick={onClick} className={clsx("relative p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all bg-gradient-to-br active:scale-[0.98]", bgGradient)}>
            <div className="flex items-center space-x-4">
                {/* ПРЕВЬЮ КАРТИНКИ КАРТЫ */}
                <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center border border-white/10 overflow-hidden shadow-inner flex-shrink-0">
                    <img src={card.imageUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">
                        {card.name} <span className="text-tyrex-ultra-gold-glow/60 text-xs ml-1">#{card.serialNumber}</span>
                    </h4>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-tighter mt-0.5">
                        {card.nominalBtc.toFixed(8)} BTC
                    </p>
                </div>
                <div className="text-right">
                    <p className={clsx("text-[10px] font-black uppercase px-2 py-0.5 rounded-md border", 
                        card.status === 'Active' ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-white/10 bg-white/5 text-white/40")}>
                        {statusText}
                    </p>
                </div>
            </div>
            
            <div className="mt-4 flex justify-between items-end border-t border-white/5 pt-3">
                <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Live Profit</p>
                    <div className="text-lg font-black text-green-400 leading-none">
                        <LiveProfit 
                            nominalSats={nominalSats}
                            apy={card.clientAPY} 
                            btcPrice={btcPrice}
                            baseProfitUsd={card.currentProfitUsd}
                            status={card.status}
                        />
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20" />
            </div>
        </div>
    );
};

// --- Модальное окно (Детали) ---
const CardDetailsModal = ({ card, isOpen, onClose, onUpdate }: any) => {
    if (!isOpen || !card) return null;

    const [activeTab, setActiveTab] = useState<'CONTROL' | 'HISTORY'>('CONTROL');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'HISTORY') {
            setIsLoadingHistory(true);
            const typeId = typeof card.cardTypeId === 'object' ? card.cardTypeId._id : card.cardTypeId;
            if (typeId) {
                cardsApi.getHistoryBySerial(typeId, card.serialNumber)
                    .then(setHistory)
                    .catch(console.error)
                    .finally(() => setIsLoadingHistory(false));
            }
        }
    }, [activeTab, card]);

    const handleAction = async (action: () => Promise<any>, errorMsg: string) => {
        setActionLoading(true);
        try { await action(); await onUpdate(); onClose(); }
        catch (e) { alert(errorMsg); }
        finally { setActionLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            <div className="bg-tyrex-dark-black border border-white/10 w-full max-w-sm rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
                
                {/* Интерактивный визуал в заголовке модалки */}
                <div className="pt-2 bg-gradient-to-b from-white/5 to-transparent relative">
                   <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 bg-black/40 rounded-full text-white/50 backdrop-blur-md">
                       <X className="w-5 h-5"/>
                   </button>
                   <NftCardVisual imageUrl={card.imageUrl} name={card.name} />
                </div>

                <div className="px-6 pb-2 text-center">
                    <h3 className="text-2xl font-black text-white">{card.name}</h3>
                    <div className="flex items-center justify-center space-x-2 mt-1">
                        <ShieldCheck className="w-4 h-4 text-tyrex-ultra-gold-glow" />
                        <p className="text-tyrex-ultra-gold-glow font-mono text-sm font-bold uppercase">Serial #{card.serialNumber}</p>
                    </div>
                </div>

                {/* Табы */}
                <div className="flex px-6 mt-4 border-b border-white/5">
                    <button onClick={() => setActiveTab('CONTROL')} className={clsx("flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all", activeTab === 'CONTROL' ? "text-white border-b-2 border-tyrex-ultra-gold-glow" : "text-white/30")}>Control</button>
                    <button onClick={() => setActiveTab('HISTORY')} className={clsx("flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all", activeTab === 'HISTORY' ? "text-white border-b-2 border-tyrex-ultra-gold-glow" : "text-white/30")}>History</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'CONTROL' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Profit</p>
                                    <p className="text-xl font-black text-green-400">${card.currentProfitUsd.toFixed(2)}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Value</p>
                                    <p className="text-xl font-black text-white">${card.purchasePriceUsd.toFixed(2)}</p>
                                </div>
                            </div>

                            {card.status === 'Inactive' && (
                                <div className="space-y-4">
                                    <button onClick={() => handleAction(() => cardsApi.startCard(card.id), 'Error starting')} className="w-full py-4 bg-green-500 text-black rounded-2xl font-black uppercase tracking-widest flex justify-center items-center shadow-[0_10px_20px_rgba(34,197,94,0.2)] active:scale-95 transition-all">
                                        {actionLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : 'Start Mining'}
                                    </button>
                                    <button onClick={() => handleAction(() => cardsApi.sellCardBack(card.id), 'Error selling')} className="w-full py-3 bg-white/5 text-red-400 font-bold rounded-xl border border-red-500/10 hover:bg-red-500/5 transition-all">
                                        Sell to System for ${card.purchasePriceUsd.toFixed(2)}
                                    </button>
                                </div>
                            )}

                            {card.status === 'Active' && (
                                <div className="text-center space-y-6">
                                    <div className="flex justify-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                                            <Zap className="w-16 h-16 text-green-500 relative z-10" />
                                        </div>
                                    </div>
                                    <button onClick={() => handleAction(() => cardsApi.stopCard(card.id), 'Error stopping')} className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">
                                        Stop & Collect
                                    </button>
                                </div>
                            )}

                            {card.status === 'Cooling' && (
                                <div className="text-center p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                                    <Clock className="w-10 h-10 text-blue-400 mx-auto mb-3"/>
                                    <p className="text-blue-200 font-bold uppercase text-xs tracking-tighter">Unlocking on {card.unlockTimestamp ? new Date(card.unlockTimestamp).toLocaleDateString() : '...'}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {isLoadingHistory ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-tyrex-ultra-gold-glow"/></div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-10 text-white/20">No data found.</div>
                            ) : (
                                history.map((record: any) => (
                                    <div key={record._id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center space-x-4">
                                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", 
                                            record.eventType === 'MINING_SESSION' ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400")}>
                                            {record.eventType === 'MINING_SESSION' ? <Zap className="w-5 h-5"/> : <DollarSign className="w-5 h-5"/>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{record.eventType === 'MINING_SESSION' ? 'Mining Profit' : 'Purchase'}</p>
                                            <p className="text-[10px] text-white/40 uppercase">{maskUsername(record.userId?.username)} • {new Date(record.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={clsx("font-black", record.profitUsd > 0 ? "text-green-400" : "text-white")}>
                                                {record.profitUsd > 0 ? `+${parseVal(record.profitUsd).toFixed(2)}` : `$${parseVal(record.priceUsd).toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ОСНОВНОЙ ЭКРАН ---
const CollectionScreen: React.FC = () => {
    const { cards, btcPrice } = useTyrexStore(); 
    const { refreshAllData } = useTelegram();
    const navigate = useNavigate();
    const [selectedCard, setSelectedCard] = useState<TyrexCard | null>(null);

    useEffect(() => {
        const interval = setInterval(() => refreshAllData(), 60000); 
        return () => clearInterval(interval);
    }, [refreshAllData]);

    const sortedCards = [...(cards || [])].sort((a, b) => {
        const priority: Record<string, number> = { 'Active': 0, 'Inactive': 1, 'Cooling': 2, 'Finished': 3 };
        return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
    });

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white p-4 pb-28">
            <div className="flex justify-between items-center pt-6 mb-6">
                <div className="flex items-center space-x-3">
                    <BarChart3 className="w-7 h-7 text-tyrex-ultra-gold-glow"/>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Vault</h1>
                </div>
                <button onClick={refreshAllData} className="p-3 bg-white/5 rounded-full active:scale-90 transition-all border border-white/5">
                    <RefreshCw className="w-5 h-5 text-white/70" />
                </button>
            </div>

            <div className="bg-gradient-to-r from-tyrex-ultra-gold-glow/10 to-transparent border-l-2 border-tyrex-ultra-gold-glow p-4 rounded-r-2xl mb-8 flex items-start space-x-3">
                <Info className="w-5 h-5 shrink-0 text-tyrex-ultra-gold-glow"/>
                <p className="text-[11px] text-white/70 leading-relaxed font-medium uppercase tracking-wider">
                    Your digital mining fleet. Every NFT generates BTC rewards based on its power and current APY.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {sortedCards.length > 0 ? (
                    sortedCards.map((card) => (
                        <CollectionListItem key={card.id} card={card} btcPrice={btcPrice} onClick={() => setSelectedCard(card)} />
                    ))
                ) : (
                    <div className="text-center p-12 bg-white/5 rounded-[2rem] border border-white/5 mt-4">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Hash className="w-10 h-10 text-white/10"/>
                        </div>
                        <h2 className="text-lg font-bold mb-2">No Miners Found</h2>
                        <p className="text-sm text-white/40 mb-8">Purchase your first NFT miner to start earning.</p>
                        <button onClick={() => navigate('/marketplace')} className='bg-tyrex-ultra-gold-glow text-black font-black uppercase py-4 px-8 rounded-2xl text-xs tracking-widest active:scale-95 transition-all shadow-[0_15px_30px_rgba(255,215,0,0.2)]'>
                            Go to Store
                        </button>
                    </div>
                )}
            </div>

            <CardDetailsModal 
                isOpen={!!selectedCard} card={selectedCard} 
                onClose={() => setSelectedCard(null)} onUpdate={refreshAllData}
            />
        </div>
    );
};

export default CollectionScreen;

// Добавь в иконки (lucide-react) ChevronRight если его нет
import { ChevronRight } from 'lucide-react';