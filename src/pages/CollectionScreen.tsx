import React, { useState, useEffect } from 'react';
import { Bitcoin, Clock, Zap, Info, Loader2, RefreshCw, Play, X, DollarSign, History, BarChart3, Hash, ArrowLeft } from 'lucide-react';
import { useTyrexStore, type TyrexCard } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
// Импортируем компонент живого счетчика
import LiveProfit from '../components/LiveProfit';

// --- Helper: Маскировка ника ---
const maskUsername = (username?: string) => {
    if (!username) return 'Unknown User';
    if (username.length <= 4) return username + '***';
    return username.slice(0, 3) + '***' + username.slice(-1);
};

// --- Helper: Парсинг Decimal128 ---
const parseVal = (val: any) => val?.$numberDecimal ? parseFloat(val.$numberDecimal) : (parseFloat(val) || 0);

// =========================================================
// КОМПОНЕНТ: Элемент списка (Карточка)
// =========================================================
interface ListItemProps {
    card: TyrexCard;
    onClick: () => void;
    btcPrice: number;
}

const CollectionListItem: React.FC<ListItemProps> = ({ card, onClick, btcPrice }) => {
    let statusColor = 'text-gray-400';
    let statusText = 'Inactive';
    let bgGradient = 'from-tyrex-graphite/40 to-tyrex-graphite/20';

    if (card.status === 'Active') {
        statusColor = 'text-green-400';
        statusText = 'Mining';
        bgGradient = 'from-green-900/10 to-tyrex-graphite/20 border-green-500/10';
    } else if (card.status === 'Cooling') {
        statusColor = 'text-blue-400';
        statusText = 'Cooling';
    } else if (card.status === 'Finished') {
        statusText = 'Finished';
    }

    // Рассчитываем номинал в Сатоши для LiveProfit
    const nominalSats = card.nominalBtc * 100000000;

    return (
        <div onClick={onClick} className={clsx("relative p-4 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all bg-gradient-to-br", bgGradient)}>
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-tyrex-dark-black rounded-lg flex items-center justify-center border border-white/5 shadow-inner">
                    <Bitcoin className={clsx("w-6 h-6", card.status === 'Active' ? 'text-tyrex-ultra-gold-glow animate-pulse' : 'text-gray-500')} />
                </div>
                <div>
                    <h4 className="font-bold text-white text-sm">{card.name} <span className="text-white/30 text-xs">#{card.serialNumber}</span></h4>
                    <p className="text-xs font-mono text-white/50">{card.nominalBtc.toFixed(8)} BTC</p>
                </div>
            </div>
            
            <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-2">
                <div>
                    <p className="text-[10px] text-white/40 flex items-center">
                        Profit {card.status === 'Active' && <span className="ml-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"/>}
                    </p>
                    <div className="text-sm font-bold text-green-400">
                        {/* ЖИВОЙ СЧЕТЧИК */}
                        <LiveProfit 
                            nominalSats={nominalSats}
                            apy={card.clientAPY} 
                            btcPrice={btcPrice}
                            baseProfitUsd={card.currentProfitUsd}
                            status={card.status}
                        />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-white/40">Status</p>
                    <p className={clsx("text-xs font-bold flex items-center justify-end", statusColor)}>
                        {statusText}
                    </p>
                </div>
            </div>
        </div>
    );
};

// =========================================================
// КОМПОНЕНТ: Модальное окно (Детали + История)
// =========================================================
const CardDetailsModal = ({ card, isOpen, onClose, onUpdate }: any) => {
    if (!isOpen || !card) return null;

    const [activeTab, setActiveTab] = useState<'CONTROL' | 'HISTORY'>('CONTROL');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // При открытии вкладки "История"
    useEffect(() => {
        if (activeTab === 'HISTORY') {
            setIsLoadingHistory(true);
            // Пытаемся получить cardTypeId из объекта card. 
            // Если в сторе его нет, убедитесь, что бекенд возвращает populate('cardTypeId') в getMyCards
            // Или используйте card.cardTypeId._id если это объект
            const typeId = typeof card.cardTypeId === 'object' ? card.cardTypeId._id : card.cardTypeId;
            
            if (typeId) {
                cardsApi.getHistoryBySerial(typeId, card.serialNumber)
                    .then(setHistory)
                    .catch(console.error)
                    .finally(() => setIsLoadingHistory(false));
            } else {
                setIsLoadingHistory(false);
            }
        }
    }, [activeTab, card]);

    const handleStart = async () => {
        setActionLoading(true);
        try { 
            await cardsApi.startCard(card.id); 
            await onUpdate(); 
            onClose(); 
        } catch (e) { 
            alert('Error starting mining'); 
        } finally { 
            setActionLoading(false); 
        }
    };

    const handleStop = async () => {
        if(!window.confirm("Stop mining? Profit will be credited to pending balance.")) return;
        setActionLoading(true);
        try { 
            await cardsApi.stopCard(card.id); 
            await onUpdate(); 
            onClose(); 
        } catch (e) { 
            alert('Error stopping mining'); 
        } finally { 
            setActionLoading(false); 
        }
    };

    const handleSellBack = async () => {
        if(!window.confirm(`Sell this card back to System? You will receive $${card.purchasePriceUsd.toFixed(2)} instantly.`)) return;
        setActionLoading(true);
        try { 
            await cardsApi.sellCardBack(card.id); 
            await onUpdate(); 
            onClose(); 
        } catch (e) { 
            alert('Error selling card'); 
        } finally { 
            setActionLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-tyrex-dark-black border border-white/10 w-full max-w-md rounded-3xl overflow-hidden relative z-10 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">{card.name}</h3>
                        <p className="text-tyrex-ultra-gold-glow font-mono text-sm">NFT #{card.serialNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-1 bg-white/5 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-white/50"/></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button onClick={() => setActiveTab('CONTROL')} className={clsx("flex-1 py-3 text-sm font-bold flex items-center justify-center space-x-2 transition-colors", activeTab === 'CONTROL' ? "text-white bg-white/5 border-b-2 border-tyrex-ultra-gold-glow" : "text-white/40")}>
                        <Zap className="w-4 h-4"/> <span>Control</span>
                    </button>
                    <button onClick={() => setActiveTab('HISTORY')} className={clsx("flex-1 py-3 text-sm font-bold flex items-center justify-center space-x-2 transition-colors", activeTab === 'HISTORY' ? "text-white bg-white/5 border-b-2 border-tyrex-ultra-gold-glow" : "text-white/40")}>
                        <History className="w-4 h-4"/> <span>Owner History</span>
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-5 overflow-y-auto flex-1">
                    {activeTab === 'CONTROL' ? (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <p className="text-[10px] text-white/40 uppercase">Current Profit</p>
                                    <p className="text-lg font-bold text-green-400">${card.currentProfitUsd.toFixed(2)}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <p className="text-[10px] text-white/40 uppercase">Card Value</p>
                                    <p className="text-lg font-bold text-white">${card.purchasePriceUsd.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Actions: INACTIVE */}
                            {card.status === 'Inactive' && (
                                <div className="space-y-3">
                                    <button onClick={handleStart} disabled={actionLoading} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg shadow-green-900/20 flex justify-center items-center active:scale-95 transition-transform">
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Play className="w-4 h-4 mr-2"/> Start Mining</>}
                                    </button>
                                    
                                    <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 mt-4">
                                        <p className="text-sm text-white/70 mb-3 font-bold">Sell back to System</p>
                                        <p className="text-xs text-white/40 mb-3">Instant refund of ${card.purchasePriceUsd.toFixed(2)}. Card will be removed from your collection.</p>
                                        <button onClick={handleSellBack} disabled={actionLoading} className="w-full py-2 bg-white/5 text-red-400 border border-red-500/20 font-bold rounded-lg hover:bg-red-500/10 transition-colors">
                                            Sell for ${card.purchasePriceUsd.toFixed(2)}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Actions: ACTIVE */}
                            {card.status === 'Active' && (
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center animate-pulse">
                                        <Zap className="w-10 h-10 text-green-500"/>
                                    </div>
                                    <p className="text-green-400 font-bold">Mining in progress...</p>
                                    <p className="text-xs text-white/50">Profit is calculated every minute.</p>
                                    <button onClick={handleStop} disabled={actionLoading} className="w-full py-3 bg-red-900/50 border border-red-500/20 hover:bg-red-900/70 rounded-xl font-bold text-red-200 flex justify-center items-center active:scale-95 transition-transform">
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Stop & Collect'}
                                    </button>
                                </div>
                            )}
                            
                            {/* Actions: COOLING */}
                            {card.status === 'Cooling' && (
                                <div className="text-center p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                    <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2"/>
                                    <p className="text-blue-200 text-sm">Funds unlocking on {card.unlockTimestamp ? new Date(card.unlockTimestamp).toLocaleDateString() : '...'}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // HISTORY TAB
                        <div className="space-y-3">
                            {isLoadingHistory ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-white/30"/></div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-10 text-white/30 text-sm">No history records yet.</div>
                            ) : (
                                history.map((record: any) => (
                                    <div key={record._id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-start space-x-3">
                                        <div className={clsx("p-2 rounded-lg mt-0.5", 
                                            record.eventType === 'MINING_SESSION' ? "bg-green-500/10" : 
                                            record.eventType === 'SOLD_BACK' ? "bg-red-500/10" : "bg-blue-500/10")}>
                                            {record.eventType === 'MINING_SESSION' ? <Zap className="w-4 h-4 text-green-400"/> : 
                                             record.eventType === 'SOLD_BACK' ? <ArrowLeft className="w-4 h-4 text-red-400"/> :
                                             <DollarSign className="w-4 h-4 text-blue-400"/>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-white">
                                                    {record.eventType === 'MINING_SESSION' ? 'Mining' : 
                                                     record.eventType === 'SOLD_BACK' ? 'Sold to System' : 'Purchased'}
                                                </p>
                                                <p className="text-[10px] text-white/40">{new Date(record.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            
                                            <div className="mt-1 flex justify-between text-xs">
                                                <span className="text-white/60">User: {maskUsername(record.userId?.username)}</span>
                                                {record.profitUsd > 0 && <span className="text-green-400 font-bold">+{parseVal(record.profitUsd).toFixed(2)} USD</span>}
                                                {record.priceUsd > 0 && <span className="text-white font-bold">${parseVal(record.priceUsd).toFixed(2)}</span>}
                                            </div>
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

// =========================================================
// ОСНОВНОЙ ЭКРАН: CollectionScreen
// =========================================================
const CollectionScreen: React.FC = () => {
    // Получаем данные из Store
    const { cards, btcPrice } = useTyrexStore(); 
    const { refreshAllData } = useTelegram();
    const navigate = useNavigate();
    
    // Состояние для выбранной карты (модалка)
    const [selectedCard, setSelectedCard] = useState<TyrexCard | null>(null);

    // Автоматическая синхронизация с сервером каждую минуту
    // Это важно, чтобы LiveProfit не "убегал" далеко от реальности
    useEffect(() => {
        const interval = setInterval(() => {
            console.log("Syncing collection data...");
            refreshAllData();
        }, 60000); 
        return () => clearInterval(interval);
    }, [refreshAllData]);

    // Сортировка карт: Active -> Inactive -> Cooling -> Finished
    const sortedCards = [...(cards || [])].sort((a, b) => {
        const priority: Record<string, number> = { 'Active': 0, 'Inactive': 1, 'Cooling': 2, 'Finished': 3 };
        return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
    });

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white p-4 pb-24">
            
            {/* Заголовок */}
            <div className="flex justify-between items-center pt-4 mb-4">
                <div className="flex items-center space-x-2">
                    <BarChart3 className="w-6 h-6 text-tyrex-ultra-gold-glow"/>
                    <h1 className="text-2xl font-black text-white tracking-tight">My Collection</h1>
                </div>
                <button 
                    onClick={refreshAllData} 
                    className="p-2 bg-tyrex-graphite/40 rounded-full active:scale-90 transition-transform hover:bg-white/10"
                >
                    <RefreshCw className="w-5 h-5 text-white/70" />
                </button>
            </div>

            {/* Инфо-баннер */}
            <div className="bg-tyrex-graphite/30 border border-white/5 p-3.5 rounded-xl text-xs text-white/60 mb-6 flex items-start space-x-2.5">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-tyrex-ultra-gold-glow"/>
                <span className="leading-relaxed">
                    Manage your miners here. Profit updates in real-time. You can sell cards back to the system if they are inactive.
                </span>
            </div>

            {/* Сетка карт */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedCards.length > 0 ? (
                    sortedCards.map((card) => (
                        <CollectionListItem 
                            key={card.id} 
                            card={card} 
                            btcPrice={btcPrice}
                            onClick={() => setSelectedCard(card)} 
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center p-10 text-white/50 bg-tyrex-graphite/20 rounded-2xl border border-white/5 mt-4">
                        <Hash className="w-12 h-12 mx-auto mb-4 text-white/20"/>
                        <p className="mb-4">Your collection is empty.</p>
                        <button 
                            onClick={() => navigate('/marketplace')} 
                            className='bg-tyrex-ultra-gold-glow text-tyrex-dark-black font-bold py-3 px-6 rounded-xl active:scale-95 transition-transform'
                        >
                            Go to Marketplace
                        </button>
                    </div>
                )}
            </div>

            {/* Модальное окно */}
            <CardDetailsModal 
                isOpen={!!selectedCard} 
                card={selectedCard} 
                onClose={() => setSelectedCard(null)}
                onUpdate={refreshAllData}
            />
        </div>
    );
};

export default CollectionScreen;