import React, { useState, useEffect } from 'react';
import { 
     Clock, Zap, Info, RefreshCw, 
     X, BarChart3, ChevronRight, CheckCircle2, TrendingUp, Play
} from 'lucide-react';
import { useTyrexStore, type TyrexCard } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import LiveProfit from '../components/LiveProfit';
import NftCardVisual from '../components/NftCardVisual';

// --- Helper: Маскування ника ---
// const maskUsername = (username?: string) => {
//     if (!username) return 'Unknown';
//     return username.length <= 4 ? username + '***' : username.slice(0, 3) + '***' + username.slice(-1);
// };

const parseVal = (val: any) => val?.$numberDecimal ? parseFloat(val.$numberDecimal) : (parseFloat(val) || 0);

// --- Елемент списка (Карточка в стиле HUD) ---
const CollectionListItem: React.FC<{ card: TyrexCard; onClick: () => void; btcPrice: number }> = ({ card, onClick, btcPrice }) => {
    const isActive = card.status === 'Active';
    const isCooling = card.status === 'Cooling';
    const isFinished = card.status === 'Finished';
    
    // Перевірка: готова нода до перезапуску (охолола, неактивна або завершена)
    const isReadyToRestart = isFinished || (isCooling && card.unlockTimestamp && Date.now() > new Date(card.unlockTimestamp).getTime());

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

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-black rounded-2xl border border-white/10 overflow-hidden shadow-inner flex-shrink-0">
                        <img src={card.imageUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" alt="" />
                    </div>
                    <div>
                        <h4 className="font-black text-white text-sm uppercase tracking-tight flex items-center gap-1">
                            {card.name} 
                            <span className="text-[#FFB800] text-[10px] opacity-40">#{card.serialNumber}</span>
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{card.nominalBtc.toFixed(4)} BTC</span>
                        </div>
                    </div>
                </div>

                <div className={clsx(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors",
                    isActive && "bg-green-500/10 text-green-400 border-green-500/20",
                    isCooling && !isReadyToRestart && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    (card.status === 'Inactive' || isReadyToRestart) && "bg-white/5 text-white/40 border-white/10"
                )}>
                    {isActive ? (
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                            Mining
                        </div>
                    ) : isReadyToRestart ? 'Ready' : card.status}
                </div>
            </div>
            
            <div className="flex justify-between items-end bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                <div>
                    <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mb-1">Current Yield</p>
                    <div className="text-xl font-black text-white italic tracking-tighter flex items-center gap-2">
                        <LiveProfit 
                            nominalSats={nominalSats}
                            apy={card.clientAPY} 
                            btcPrice={btcPrice}
                            baseProfitUsd={card.currentProfitUsd}
                            status={card.status}
                        />
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center border border-white/5 group-hover:bg-[#FFB800] group-hover:text-black transition-all">
                        <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- Модальное окно управления Нодой ---
const CardDetailsModal = ({ card, isOpen, onClose, onUpdate, btcPrice }: any) => {
    const [activeTab, setActiveTab] = useState<'CONTROL' | 'HISTORY'>('CONTROL');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // --- ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ЛОГИКА ---
    const isCooledDown = card?.status === 'Cooling' && card?.unlockTimestamp && Date.now() > new Date(card.unlockTimestamp).getTime();
    // Тепер canStart включає в себе Finished
    const canStart = card?.status === 'Inactive' || card?.status === 'Finished' || isCooledDown;

    useEffect(() => {
        if (isOpen && activeTab === 'HISTORY' && card) {
            setIsLoadingHistory(true);
            const typeId = typeof card.cardTypeId === 'object' ? card.cardTypeId._id : card.cardTypeId;
            cardsApi.getHistoryBySerial(typeId, card.serialNumber)
                .then(setHistory)
                .catch(console.error)
                .finally(() => setIsLoadingHistory(false));
        }
    }, [activeTab, card, isOpen]);

    // --- ФУНКЦІЯ ПРОДАЖУ ---
    const handleSell = async () => {
        setActionLoading(true);
        try {
            const res = await cardsApi.sellCardBack(card.id);
            if (res.success) {
                toast.success(
                    (_t) => (
                        <div className="flex flex-col gap-1">
                            <b className="text-[#FFB800]">Вихід у ліквідність успішний!</b>
                            <span className="text-[11px] opacity-80">
                                Повернено: ${res.amount} <br/>
                                Курс виконання: ${res.rate}
                            </span>
                        </div>
                    ),
                    { duration: 6000 }
                );
                await onUpdate();
                onClose();
            }
        } catch (e: any) {
            toast.error(e.message || "Помилка при продажу");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        setActionLoading(true);
        try {
            await action();
            toast.success(successMsg);
            await onUpdate();
            onClose();
        } catch (e: any) {
            toast.error(e.message || "Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                        onClick={onClose} 
                    />
                    <motion.div 
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="bg-[#0D0D0E] border-t border-white/10 w-full max-w-md rounded-t-[3rem] overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[95vh]"
                    >
                        {/* NFT Visual Section */}
                        <div className="relative pt-10 pb-6 bg-gradient-to-b from-white/[0.05] to-transparent">
                            <button onClick={onClose} className="absolute top-6 right-8 z-30 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white/40 border border-white/5 backdrop-blur-sm">
                                <X size={20}/>
                            </button>
                            <NftCardVisual imageUrl={card.imageUrl} name={card.name} sizeClass="w-64" serialNumber={card.serialNumber} />
                        </div>

                        <div className="px-8 text-center mb-6">
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{card.name}</h3>
                            <div className="flex items-center justify-center space-x-2 mt-1">
                                <div className={clsx(
                                    "px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                    card.status === 'Active' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-white/40"
                                )}>
                                    {card.status} Node
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-8 gap-2 mb-6">
                            {['CONTROL', 'HISTORY'].map((t: any) => (
                                <button 
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={clsx(
                                        "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                        activeTab === t ? "bg-white text-black shadow-lg" : "bg-white/5 text-white/30 border border-white/5"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="px-8 pb-10 overflow-y-auto no-scrollbar flex-1">
                            {activeTab === 'CONTROL' ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/[0.03] p-5 rounded-[1.8rem] border border-white/5">
                                            <p className="text-[8px] text-white/20 uppercase font-black tracking-widest mb-2">Live Profit</p>
                                            <div className="text-xl font-black text-green-400 italic">
                                                <LiveProfit 
                                                    nominalSats={card.nominalBtc * 100000000}
                                                    apy={card.clientAPY} 
                                                    btcPrice={btcPrice}
                                                    baseProfitUsd={card.currentProfitUsd}
                                                    status={card.status}
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.03] p-5 rounded-[1.8rem] border border-white/5">
                                            <p className="text-[8px] text-white/20 uppercase font-black tracking-widest mb-2">Purchase Price</p>
                                            <p className="text-xl font-black text-white italic tracking-tighter">${parseVal(card.purchasePriceUsd).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {canStart && (
                                            <button 
                                                onClick={() => handleAction(() => cardsApi.startCard(card.id), 'Mining session successfully started!')}
                                                disabled={actionLoading}
                                                className="w-full py-5 bg-green-500 text-black rounded-[1.8rem] font-black uppercase text-sm tracking-widest shadow-[0_15px_40px_rgba(34,197,94,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? <RefreshCw className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                                                {card.status === 'Inactive' ? 'Start Node' : 'Restart Node'}
                                            </button>
                                        )}

                                        {card.status === 'Active' && (
                                            <div className="bg-green-500/5 border border-green-500/10 p-6 rounded-[2.5rem] text-center">
                                                <div className="relative w-16 h-16 mx-auto mb-4">
                                                    <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                                                    <Zap className="w-16 h-16 text-green-500 relative z-10" />
                                                </div>
                                                <button 
                                                    onClick={() => handleAction(() => cardsApi.stopCard(card.id), 'Rewards collected!')}
                                                    className="w-full py-5 bg-white text-black rounded-[1.8rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all"
                                                >
                                                    Stop & Collect
                                                </button>
                                            </div>
                                        )}

                                        {/* Кнопка продажу - тепер активна для Inactive та Finished */}
                                        {(card.status === 'Inactive' || card.status === 'Finished' || isCooledDown) && (
                                            <button 
                                                onClick={handleSell}
                                                disabled={actionLoading}
                                                className="w-full py-4 bg-red-500/5 text-red-500/80 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl border border-red-500/10 active:bg-red-500/10 transition-all"
                                            >
                                                Liquidity Exit: ${parseVal(card.purchasePriceUsd).toFixed(2)}
                                            </button>
                                        )}

                                        {card.status === 'Cooling' && !isCooledDown && (
                                            <div className="text-center p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/20">
                                                <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin-slow"/>
                                                <p className="text-blue-300/50 font-bold uppercase text-[10px] tracking-widest">
                                                    Ends at: {new Date(card.unlockTimestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {isLoadingHistory ? (
                                        <div className="flex justify-center py-10"><RefreshCw className="w-8 h-8 animate-spin text-[#FFB800]"/></div>
                                    ) : (
                                        history.map((record: any) => (
                                            <div key={record._id} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", record.eventType === 'MINING_SESSION' ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400")}>
                                                        {record.eventType === 'MINING_SESSION' ? <TrendingUp size={16}/> : <CheckCircle2 size={16}/>}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white">{record.eventType === 'MINING_SESSION' ? 'Mining' : 'Buy'}</p>
                                                        <p className="text-[9px] font-bold text-white/20 uppercase">{new Date(record.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={clsx("font-black italic tracking-tighter", record.profitUsd > 0 ? "text-green-400" : "text-white")}>
                                                        {record.profitUsd > 0 ? `+${parseVal(record.profitUsd).toFixed(4)}` : `$${parseVal(record.priceUsd).toFixed(2)}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- ОСНОВНОЙ ЭКРАН ---
const CollectionScreen: React.FC = () => {
    const { cards, btcPrice } = useTyrexStore(); 
    const { refreshAllData } = useTelegram();
    const navigate = useNavigate();
    const [selectedCard, setSelectedCard] = useState<TyrexCard | null>(null);

    useEffect(() => {
        const interval = setInterval(() => refreshAllData(), 30000); 
        return () => clearInterval(interval);
    }, [refreshAllData]);

    const sortedCards = [...(cards || [])].sort((a, b) => {
        const priority: Record<string, number> = { 'Active': 0, 'Inactive': 1, 'Finished': 1.1, 'Cooling': 2 };
        return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
    });

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32">
            <div className="sticky top-0 z-20 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#FFB800]/10 rounded-2xl flex items-center justify-center border border-[#FFB800]/20">
                        <BarChart3 className="w-6 h-6 text-[#FFB800]"/>
                    </div>
                    <h1 className="text-xl font-black uppercase italic tracking-tighter">Vault</h1>
                </div>
                <button onClick={refreshAllData} className="p-3 bg-white/5 rounded-full active:scale-90 transition-all border border-white/5">
                    <RefreshCw className="w-5 h-5 text-white/40" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div className="bg-gradient-to-r from-[#FFB800]/10 to-transparent border-l-4 border-[#FFB800] p-5 rounded-r-[2rem] shadow-xl">
                    <div className="flex gap-4">
                        <Info className="w-6 h-6 shrink-0 text-[#FFB800]"/>
                        <div>
                            <p className="text-[10px] text-[#FFB800] font-black uppercase tracking-widest mb-1">Fleet Management</p>
                            <p className="text-[12px] text-white/70 leading-relaxed font-bold uppercase italic tracking-tight">
                                Control your nodes. Restart them immediately after the cycle ends to maintain peak APY.
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
                                onClick={() => setSelectedCard(card)} 
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 bg-[#121213] rounded-[3rem] border border-white/5 border-dashed mx-2">
                            <Zap size={40} className="text-white/10 mx-auto mb-6"/>
                            <h2 className="text-xl font-black uppercase tracking-tight mb-2">No Active Nodes</h2>
                            <button onClick={() => navigate('/marketplace')} className='mt-4 bg-[#FFB800] text-black font-black uppercase py-5 px-10 rounded-2xl text-xs tracking-widest active:scale-95'>
                                Open Store
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <CardDetailsModal 
                isOpen={!!selectedCard} 
                card={selectedCard} 
                btcPrice={btcPrice}
                onClose={() => setSelectedCard(null)} 
                onUpdate={refreshAllData}
            />
        </div>
    );
};

export default CollectionScreen;