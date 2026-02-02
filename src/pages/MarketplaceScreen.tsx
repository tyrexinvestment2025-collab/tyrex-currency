import React, { useState, useMemo } from 'react';
import { Bitcoin, ChevronRight, Filter, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useTyrexStore, type TyrexCardType } from '../store/useTyrexStore';
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import TyrexModal from '../components/common/TyrexModal';

interface TabProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
}

interface CardItemProps {
    card: TyrexCardType;
    onBuyRequest: (card: TyrexCardType) => void;
    canAfford: boolean;
    isLoading: boolean;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick, icon }) => {
    const activeClasses = "text-tyrex-ultra-gold-glow bg-tyrex-ultra-gold-glow/10 border-tyrex-ultra-gold-glow";
    const inactiveClasses = "text-white/60 border-transparent hover:text-white hover:bg-white/5";
    return (
        <button
            onClick={onClick}
            className={clsx("flex items-center space-x-1.5 py-2 px-3 rounded-full border text-xs font-semibold transition-all duration-200", isActive ? activeClasses : inactiveClasses)}>
            {icon && <span className="w-3.5 h-3.5">{icon}</span>}
            <span>{label}</span>
        </button>
    );
};

const CardItem: React.FC<CardItemProps> = ({ card, onBuyRequest, canAfford, isLoading }) => {
    const isAvailable = card.available > 0 && card.isAvailable;
    
    let buttonText = 'Купить';
    let buttonStyle = 'bg-tyrex-ultra-gold-glow text-tyrex-dark-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.3)]';
    
    if (!isAvailable) {
        buttonText = 'Sold Out';
        buttonStyle = 'bg-white/10 text-white/40 cursor-not-allowed';
    } else if (!canAfford) {
        buttonText = 'Нет средств';
        buttonStyle = 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30';
    }

    return (
        <div className="bg-gradient-to-b from-tyrex-graphite/60 to-tyrex-graphite/30 p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-tyrex-ultra-gold-glow/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-tyrex-dark-black border border-white/10 flex items-center justify-center shadow-inner">
                        <Bitcoin className="w-7 h-7 text-tyrex-ultra-gold-glow" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-white leading-tight">{card.name}</h4>
                        <p className="text-lg font-black text-tyrex-ultra-gold-glow leading-none mt-1">{card.nominalBtcDisplay}</p>
                    </div>
                </div>
                <div className="text-right space-y-1">
                     <p className="text-[10px] text-white/50">Client APY: <span className="font-bold text-green-400">{card.clientAPY}</span></p>
                     <p className="text-[10px] text-white/50">Referral APY: <span className="font-bold text-sky-400">{card.referralAPY}</span></p>
                </div>
            </div>
            <div className="flex items-center justify-between mb-4 bg-tyrex-dark-black/40 p-2.5 rounded-xl border border-white/5">
                <div>
                    <span className="text-[10px] text-white/40">Цена покупки (USD)</span>
                    <span className="block text-sm font-bold text-white">${card.priceUSDT.toFixed(2)}</span>
                </div>
                {card.available < 10 && isAvailable && <div className="text-[10px] text-red-400 font-bold px-2 py-1 bg-red-500/10 rounded-md animate-pulse">Осталось: {card.available}</div>}
            </div>
            <button 
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex justify-center items-center ${buttonStyle}`}
                disabled={!isAvailable || isLoading} 
                onClick={() => isAvailable && onBuyRequest(card)}>
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : buttonText}
                {!isLoading && isAvailable && canAfford && <ChevronRight className="w-4 h-4 ml-1 opacity-70" />}
            </button>
        </div>
    );
};

const MarketplaceScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'apy' | 'price' | 'all'>('apy');
    const [isBuying, setIsBuying] = useState(false);
    
    const { marketCardTypes, balance } = useTyrexStore();
    const { refreshAllData } = useTelegram(); 
    const navigate = useNavigate();
    
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', actionText: '', onAction: () => {} });

    const sortedCards = useMemo(() => {
        let cards = [...marketCardTypes];
        if (activeTab === 'apy') cards.sort((a, b) => parseFloat(b.clientAPY) - parseFloat(a.clientAPY));
        else if (activeTab === 'price') cards.sort((a, b) => a.priceUSDT - b.priceUSDT);
        return cards;
    }, [marketCardTypes, activeTab]);

    const handleBuyRequest = async (card: TyrexCardType) => {
        // Предварительная проверка на клиенте
        if (balance.walletUsd < card.priceUSDT) {
            setModal({ 
                isOpen: true, 
                title: 'Недостаточно USD', 
                message: `Цена карты $${card.priceUSDT.toFixed(2)}, а у вас на кошельке $${balance.walletUsd.toFixed(2)}.`, 
                actionText: 'Пополнить', 
                onAction: () => navigate('/wallet') 
            });
            return;
        }

        try {
            setIsBuying(true);
            // cardsApi.buyCard теперь выбросит Error, если статус не 200
            await cardsApi.buyCard(card.id);
            
            // Если ошибки не было, обновляем данные
            await refreshAllData(); 
            
            setModal({ 
                isOpen: true, 
                title: 'Успех!', 
                message: `Вы приобрели "${card.name}". Карта добавлена в вашу коллекцию. Не забудьте запустить её!`, 
                actionText: 'В коллекцию', 
                onAction: () => navigate('/collection') 
            });

        } catch (error: any) {
            setModal({ 
                isOpen: true, 
                title: 'Ошибка', 
                message: error.message || 'Не удалось совершить покупку.', 
                actionText: 'Закрыть', 
                onAction: () => setModal(prev => ({...prev, isOpen: false})) 
            });
        } finally {
            setIsBuying(false);
        }
    };

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white pb-24">
            <div className="sticky top-0 z-20 bg-tyrex-dark-black/95 backdrop-blur-md border-b border-white/5 px-4 pt-6 pb-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-black text-white tracking-tight">Marketplace</h1>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1.5 flex items-center space-x-2">
                        <DollarSign className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-green-400 font-bold tabular-nums">{balance.walletUsd.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                    <Tab label="Hot Yield" icon={<TrendingUp className="w-3 h-3"/>} isActive={activeTab === 'apy'} onClick={() => setActiveTab('apy')} />
                    <Tab label="Best Price" icon={<Filter className="w-3 h-3"/>} isActive={activeTab === 'price'} onClick={() => setActiveTab('price')} />
                    <Tab label="All" isActive={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                </div>
            </div>
            <div className="p-4 space-y-4">
                {sortedCards.length > 0 ? (
                    sortedCards.map((card, index) => (
                        <div key={card.id} id={index === 0 ? 'market-first-card' : undefined}>
                            <CardItem 
                                card={card} 
                                onBuyRequest={handleBuyRequest} 
                                canAfford={balance.walletUsd >= card.priceUSDT} 
                                isLoading={isBuying}
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center pt-20 text-white/40 space-y-4">
                        <RefreshCw className="w-8 h-8 animate-spin text-tyrex-ultra-gold-glow" />
                        <p className="text-sm">Загрузка товаров...</p>
                    </div>
                )}
            </div>
            <TyrexModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} actionText={modal.actionText} onAction={modal.onAction} />
        </div>
    );
};

export default MarketplaceScreen;