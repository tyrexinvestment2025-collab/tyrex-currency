// src/pages/ReferralScreen.tsx
import React, { useEffect, useState } from 'react';
import { Copy, Zap, Users, User, Loader2 } from 'lucide-react'; // Добавили Loader2
import { useTelegram } from '../hooks/useTelegram';
import { referralApi } from '../api/tyrexApi'; // Импортируем наш новый API

// --- Константы ---
const SATOSHI_IN_BTC = 100000000; // Добавьте, если нет в глобальном доступе

// --- Интерфейсы для данных с бэкенда ---
interface ReferralInfo {
    referralLink: string;
    totalEarnedSats: string; // Приходит как строка Decimal128
    stats: {
        totalInvited: number;
        activeReferralsCount: number;
    };
}

interface ReferralPartner {
    username: string;
    tgId: number;
    registeredAt: string;
    status: 'Active' | 'Inactive';
    // На данный момент бэкенд не возвращает capitalBTC и inactiveBTC для каждого реферала в списке /list.
    // Если нужно, потребуется изменить эндпоинт /list или делать дополнительный запрос для каждого реферала.
}

// --- Вспомогательная функция для форматирования сатоши в BTC ---
const formatSatsToBtc = (satsString: string | number): string => {
    const sats = parseFloat(satsString.toString());
    if (isNaN(sats)) return '0.00000000';
    return (sats / SATOSHI_IN_BTC).toFixed(8);
};

// --- Компонент для отображения статистики (Золотой Акцент) ---
interface StatBoxProps {
    label: string;
    value: string;
    subValue?: string; // Изменил btcLabel на subValue для универсальности
    icon?: React.FC<any>;
    iconColor: string;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, subValue, icon: Icon, iconColor }) => (
    <div className="flex-1 bg-tyrex-graphite/50 p-3 rounded-lg shadow-inner border border-tyrex-graphite/50">
        <div className="flex items-center mb-1">
            {Icon && <Icon className={`w-4 h-4 mr-1 ${iconColor}`} />}
            <p className="text-xs text-white/70">{label}</p>
        </div>
        <p className="text-lg font-extrabold text-tyrex-ultra-gold-glow leading-snug">{value}</p>
        {subValue && <p className="text-[10px] text-white/50 mt-0.5">{subValue}</p>}
    </div>
);

// --- Компонент для отображения одного партнера ---
interface PartnerItemProps {
    partner: ReferralPartner;
}

const PartnerItem: React.FC<PartnerItemProps> = ({ partner }) => {
    const statusColor = partner.status === 'Active' ? 'text-green-500' : 'text-yellow-500';
    
    return (
        <div className="flex items-center justify-between bg-tyrex-graphite/30 p-3 rounded-lg hover:bg-tyrex-graphite/50 transition-colors border-l-4 border-purple-700">
            <div className="flex items-center space-x-3">
                <div className="p-1 bg-tyrex-graphite rounded-full">
                    <User className="w-5 h-5 text-white/80"/>
                </div>
                <div>
                    <p className="text-white font-semibold leading-tight">@{partner.username || 'N/A'}</p>
                    <p className="text-xs text-white/60">
                        Регистрация {new Date(partner.registeredAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className={`text-sm font-bold ${statusColor}`}>Статус: {partner.status === 'Active' ? 'Активен' : 'Неактивен'}</p>
                {/* Капитал партнера в /list эндпоинте не приходит. Если нужен, модифицируйте бэкенд */}
                {/* <p className="text-xs text-red-400">Не в работе {partner.inactiveBTC}</p> */}
            </div>
        </div>
    );
};


const ReferralScreen: React.FC = () => {
    const { tg } = useTelegram();
    const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
    const [referralList, setReferralList] = useState<ReferralPartner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReferralData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Убедимся, что пользователь авторизован перед запросом
                if (!localStorage.getItem('authToken')) {
                    throw new Error('Пользователь не авторизован.');
                }

                const info = await referralApi.getReferralInfo();
                const list = await referralApi.getReferralList();

                setReferralInfo(info);
                setReferralList(list);
            } catch (err: any) {
                console.error("Ошибка загрузки реферальных данных:", err);
                setError(err.message || "Не удалось загрузить данные партнерской программы.");
            } finally {
                setIsLoading(false);
            }
        };

        if (tg.initDataUnsafe?.user) { // Загружаем данные, когда Telegram инициализируется
            fetchReferralData();
        }
    }, [tg.initDataUnsafe?.user]);

    // Копирование ссылки
    const handleCopyLink = () => {
        if (referralInfo?.referralLink) {
            navigator.clipboard.writeText(referralInfo.referralLink);
            alert(`Реферальная ссылка скопирована: ${referralInfo.referralLink}`);
        } else {
            alert("Ссылка пока недоступна.");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-tyrex-dark-black flex items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin text-tyrex-ultra-gold-glow" />
                <p className="ml-3">Загрузка данных...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-tyrex-dark-black flex items-center justify-center text-red-500 p-4 text-center">
                <p>Ошибка: {error}</p>
            </div>
        );
    }
    
    // Данные для отображения
    const currentTotalEarnedBtc = referralInfo ? formatSatsToBtc(referralInfo.totalEarnedSats) : '0.00000000';
    const currentTotalInvited = referralInfo?.stats?.totalInvited || 0;
    const currentActiveReferrals = referralInfo?.stats?.activeReferralsCount || 0;

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white p-4">
            
            <h1 className="text-2xl font-bold mb-4 text-white pt-4">Партнерская Программа</h1>

            {/* 1. Ваша Реферальная Ссылка */}
            <div className="bg-purple-800/50 p-4 rounded-xl mb-5 shadow-lg border border-purple-700">
                <p className="text-sm text-white/80 mb-2">Ваша Реферальная ссылка</p>
                <div className="flex justify-between items-center bg-tyrex-dark-black p-3 rounded-lg border border-tyrex-ultra-gold-glow/50">
                    <code className="text-lg font-mono text-tyrex-ultra-gold-glow break-all">
                        {referralInfo?.referralLink || 'Загрузка...'}
                    </code>
                    <button 
                        onClick={handleCopyLink}
                        disabled={!referralInfo?.referralLink}
                        className="ml-3 p-2 bg-tyrex-ultra-gold-glow rounded-lg hover:bg-tyrex-ultra-gold-glow/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Copy className="w-5 h-5 text-tyrex-dark-black" />
                    </button>
                </div>
            </div>

            {/* 2. Основная Статистика (Метрики) */}
            <div className="mb-5">
                <div className="flex space-x-3 mb-3">
                    <StatBox 
                        label="Ваш доход от Партнерки" 
                        value={currentTotalEarnedBtc} 
                        subValue="BTC" 
                        icon={Zap} 
                        iconColor="text-green-500"
                    />
                    {/* APY Партнерки пока не возвращается бэкендом, можно убрать или сделать заглушку */}
                    <StatBox 
                        label="Ваш APR по Партнерке"
                        value="Расчет в разработке" // Заглушка
                        iconColor="text-tyrex-ultra-gold-glow"
                    />
                </div>
                <div className="flex space-x-3">
                    <StatBox 
                        label="Всего приглашено" 
                        value={currentTotalInvited.toString()} 
                        icon={Users} 
                        iconColor="text-blue-400"
                    />
                    <StatBox 
                        label="Активных рефералов" 
                        value={currentActiveReferrals.toString()} 
                        icon={Users} 
                        iconColor="text-green-400"
                    />
                </div>
            </div>

            {/* 3. Список Партнеров */}
            <div className="mb-5">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold text-white">Партнеры</h3>
                    <p className="text-sm text-white/70">Всего: {currentTotalInvited} / Активных: {currentActiveReferrals}</p>
                </div>

                <div className="space-y-3">
                    {referralList.length > 0 ? (
                        referralList.map((partner) => (
                            <PartnerItem key={partner.tgId} partner={partner} />
                        ))
                    ) : (
                        <div className="text-center p-5 text-white/50 bg-tyrex-graphite/30 rounded-xl">
                            У вас пока нет приглашенных партнеров.
                        </div>
                    )}
                </div>
            </div>
            
            <div className="h-20"></div> {/* Отступ для навигации */}
        </div>
    );
};

export default ReferralScreen;