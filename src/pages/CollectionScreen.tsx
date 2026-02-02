import React, { useState } from 'react';
import { Bitcoin, Clock, Zap, Info, Loader2, RefreshCw, Play } from 'lucide-react';
import { useTyrexStore, type TyrexCard } from '../store/useTyrexStore'; // Update this path to match your actual file location
import { cardsApi } from '../api/tyrexApi';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';
import TyrexModal from '../components/common/TyrexModal';

interface CollectionCardProps {
    card: TyrexCard;
    onUpdateSuccess: () => Promise<void>;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ card, onUpdateSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

    const handleStop = async () => {
        if (!window.confirm("Остановить майнинг? Профит будет зафиксирован, средства отправятся на разморозку.")) return;

        setIsLoading(true);
        try {
            await cardsApi.stopCard(card.id);
            await onUpdateSuccess();
        } catch (error: any) {
            setModal({ isOpen: true, title: "Ошибка", message: error.message || "Не удалось остановить карту." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = async () => {
        setIsLoading(true);
        try {
            await cardsApi.startCard(card.id);
            await onUpdateSuccess();
        } catch (error: any) {
            setModal({ isOpen: true, title: "Ошибка", message: error.message || "Не удалось запустить карту." });
        } finally {
            setIsLoading(false);
        }
    };

    let statusBadge, statusText, actionButton, mainBg, textColor, iconColor;

    switch (card.status) {
        case 'Inactive':
            statusBadge = 'bg-gray-600/30 text-gray-300';
            statusText = 'Ожидает запуска';
            textColor = 'text-white/70';
            iconColor = 'text-gray-400';
            actionButton = (
                <button 
                    onClick={handleStart} 
                    disabled={isLoading}
                    className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
                        isLoading 
                            ? 'bg-gray-600 cursor-wait text-white/50' 
                            : 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20'
                    }`}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Запустить майнинг</span>
                        </>
                    )}
                </button>
            );
            mainBg = 'bg-tyrex-graphite/40 border-gray-600/30';
            break;

        case 'Active':
            statusBadge = 'bg-green-500/20 text-green-400';
            statusText = 'В работе';
            textColor = 'text-white';
            iconColor = 'text-tyrex-ultra-gold-glow';
            actionButton = (
                <button 
                    onClick={handleStop} 
                    disabled={isLoading}
                    className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                        isLoading 
                            ? 'bg-gray-600 cursor-wait text-white/50' 
                            : 'bg-red-900/80 text-red-100 hover:bg-red-800 border border-red-700/30'
                    }`}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Остановить'}
                </button>
            );
            mainBg = 'bg-tyrex-graphite/60 border-white/5';
            break;

        case 'Cooling':
            statusBadge = 'bg-yellow-500/20 text-yellow-400';
            statusText = `Разморозка до ${card.unlockTimestamp ? new Date(card.unlockTimestamp).toLocaleDateString('ru-RU') : '...'}`;
            textColor = 'text-white/80';
            iconColor = 'text-yellow-500/50';
            actionButton = <button disabled className="w-full py-2.5 bg-gray-700/50 text-white/30 rounded-lg font-bold text-sm cursor-not-allowed border border-white/5">В процессе вывода</button>;
            mainBg = 'bg-tyrex-graphite/40 border-yellow-500/10';
            break;

        case 'Finished':
            statusBadge = 'bg-gray-500/20 text-gray-400';
            statusText = 'Завершено';
            textColor = 'text-white/50';
            iconColor = 'text-gray-600';
            actionButton = null;
            mainBg = 'bg-tyrex-graphite/20 opacity-70 border-transparent';
            break;

        default:
            statusBadge = 'bg-gray-500';
            statusText = 'Неизвестно';
            textColor = 'text-white/50';
            iconColor = 'text-gray-500';
            actionButton = null;
            mainBg = 'bg-tyrex-graphite/20';
    }

    return (
        <>
            <div className={`${mainBg} ${textColor} p-4 rounded-2xl shadow-lg border transition-all duration-300`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full bg-tyrex-dark-black shadow-inner`}>
                            <Bitcoin className={`w-8 h-8 ${iconColor}`} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold leading-snug">{card.name}</h4>
                            <p className={`text-sm font-bold ${card.status === 'Active' ? 'text-tyrex-ultra-gold-glow/80' : 'text-white/40'}`}>
                                {card.nominalBtc.toFixed(8)} BTC
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4 border-t border-white/5 pt-3">
                    <div>
                        <p className="text-xs text-white/40 flex items-center"><Zap className="w-3 h-3 mr-1 text-white/30"/> Прибыль (USD)</p>
                        <p className={`text-lg font-extrabold leading-tight mt-0.5 ${card.status === 'Active' ? 'text-green-400' : 'text-white/60'}`}>
                            ${card.currentProfitUsd.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-white/40 flex items-center"><Clock className="w-3 h-3 mr-1 text-white/30"/> Статус</p>
                        <div className={`text-xs font-bold mt-1 px-2.5 py-0.5 rounded-md inline-flex items-center ${statusBadge}`}>
                            {statusText}
                        </div>
                    </div>
                </div>

                {actionButton && <div className="mt-2">{actionButton}</div>}
            </div>
            
            <TyrexModal 
                isOpen={modal.isOpen} 
                onClose={() => setModal({isOpen: false, title: '', message: ''})} 
                title={modal.title} 
                message={modal.message} 
                actionText="OK" 
                onAction={() => setModal({isOpen: false, title: '', message: ''})} 
            />
        </>
    );
};

const CollectionScreen: React.FC = () => {
    const { cards } = useTyrexStore();
    const { refreshAllData } = useTelegram();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white p-4 pb-24">
            
            <div className="flex justify-between items-center pt-4 mb-4">
                <h1 className="text-2xl font-black text-white tracking-tight">Моя коллекция</h1>
                <button onClick={refreshAllData} className="p-2 bg-tyrex-graphite/40 rounded-full active:scale-90 transition-transform hover:bg-white/10">
                    <RefreshCw className="w-5 h-5 text-white/70" />
                </button>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/20 p-3.5 rounded-xl text-xs text-sky-200 mb-6 flex items-start space-x-2.5 shadow-sm">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-400"/>
                <span className="leading-relaxed opacity-90">
                    Купленные карты попадают в инвентарь. Нажмите <b>"Запустить"</b>, чтобы начать майнинг. <br/>
                    Остановка фиксирует профит и отправляет средства на разморозку.
                </span>
            </div>

            {/* ДОБАВЛЕНО: Оборачиваем список или пустое состояние в ID */}
            <div id="collection-content" className="space-y-4">
                {cards && cards.length > 0 ? (
                    [...cards].sort((a, b) => {
                        const priority: Record<string, number> = { 'Inactive': 0, 'Active': 1, 'Cooling': 2, 'Finished': 3 };
                        return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
                    }).map((card) => (
                        <CollectionCard key={card.id} card={card} onUpdateSuccess={refreshAllData} />
                    ))
                ) : (
                    <div className="text-center p-10 text-white/50 bg-tyrex-graphite/20 rounded-2xl border border-white/5 mt-10">
                        <p className="mb-4">У вас пока нет карт.</p>
                        <button onClick={() => navigate('/marketplace')} className='bg-tyrex-ultra-gold-glow text-tyrex-dark-black font-bold py-3 px-6 rounded-xl shadow-lg shadow-yellow-500/20 transition-transform active:scale-95'>
                            Перейти в Маркетплейс
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectionScreen;