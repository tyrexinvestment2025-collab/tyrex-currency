// src/pages/ProfileScreen.tsx
import React from 'react';
import { Settings, MessageSquare, LogOut, Copy, ChevronRight, Shield } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';

// --- Компонент настроек ---
const SettingsBlock: React.FC = () => {
    const SettingItem = ({ title, description, onClick }: { title: string, description: string, onClick: () => void }) => (
        <button 
            onClick={onClick}
            className="flex justify-between items-center w-full p-3 bg-tyrex-graphite/40 rounded-lg hover:bg-tyrex-graphite/60 transition-colors border-b border-white/5"
        >
            <div>
                <p className="text-white font-medium text-left">{title}</p>
                <p className="text-xs text-white/60 text-left">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-tyrex-ultra-gold-glow"/>
        </button>
    );

    return (
        <div className="bg-tyrex-graphite/50 p-4 rounded-xl mb-5 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-tyrex-ultra-gold-glow"/> Настройки
            </h3>
            
            <div className="space-y-3">
                <SettingItem 
                    title="Валюта отображения" 
                    description="По умолчанию: BTC. Сменить на USDT." 
                    onClick={() => console.log('Смена валюты')}
                />
                <SettingItem 
                    title="Уведомления" 
                    description="Настройка пуш-уведомлений о выводе." 
                    onClick={() => console.log('Настройки уведомлений')}
                />
            </div>
        </div>
    );
};

// --- Блок Поддержки ---
interface SupportBlockProps {
    tgId: string | number;
}

const SupportBlock: React.FC<SupportBlockProps> = ({ tgId }) => {
     const handleCopyCode = () => {
        navigator.clipboard.writeText(tgId.toString());
        alert(`ID ${tgId} скопирован в буфер обмена.`);
    };

    return (
        <div className="bg-tyrex-graphite/50 p-4 rounded-xl mb-5 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-tyrex-ultra-gold-glow"/> Связь и Поддержка
            </h3>
            
            <div className="space-y-3">
                <div className="text-sm text-white/80 p-3 bg-tyrex-graphite/40 rounded-lg">
                    <p>Ваш Telegram ID:</p>
                    <code className="text-white font-mono break-all flex justify-between items-center mt-1">
                        {tgId}
                        <button onClick={handleCopyCode} className='text-tyrex-ultra-gold-glow ml-2 p-1 hover:bg-white/10 rounded'>
                            <Copy className='w-4 h-4'/>
                        </button>
                    </code>
                    <p className="text-xs text-white/60 mt-1">Используйте этот ID при обращении в поддержку.</p>
                </div>
                
                <button className="w-full bg-purple-700 text-white py-3 rounded-lg font-bold hover:bg-purple-600 transition-colors">
                    Написать в Чат Поддержки
                </button>
            </div>
        </div>
    );
}

const ProfileScreen: React.FC = () => {
    const { user, userProfile, onClose } = useTelegram(); 
    const navigate = useNavigate();

    // Получаем реальные данные. 
    // userProfile - приходит с вашего Бэкенда (MongoDB).
    // user - приходит от Telegram WebApp (initData).
    
    const displayUsername = userProfile?.username || user?.username || 'Unknown User';
    const displayTgId = user?.id || userProfile?.tgId || '---';
    const displayReferralCode = userProfile?.referralCode || 'Loading...';
    
    // Проверка роли для отображения админки
    const isAdmin = userProfile?.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white p-4">
            
            <h1 className="text-2xl font-bold mb-6 text-white pt-4">Профиль</h1>

            {/* --- Блок User Info (Реальные данные) --- */}
            <div className="flex items-center space-x-4 bg-tyrex-graphite/50 p-4 rounded-xl mb-6 shadow-lg border border-tyrex-graphite/50">
                 {/* Аватар (Первая буква имени) */}
                <div className="w-14 h-14 bg-tyrex-ultra-gold-glow rounded-full flex items-center justify-center text-tyrex-dark-black font-bold text-xl border-2 border-purple-700">
                    {displayUsername[0]?.toUpperCase()}
                </div>
                <div>
                    <p className="text-lg font-bold text-tyrex-ultra-gold-glow leading-tight">
                        @{displayUsername}
                    </p>
                    <p className="text-sm text-white/70 mt-1">ID: {displayTgId}</p>
                    <div className="flex items-center mt-1">
                        <span className="text-xs text-white/50 mr-2">Реф. код:</span> 
                        <span className="text-xs font-mono bg-white/10 px-1 rounded text-white/80">
                            {displayReferralCode}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- Блок Админ Панели (ВИДЕН ТОЛЬКО АДМИНУ) --- */}
            {isAdmin && (
                <div className="mb-6 animate-fade-in">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="w-full bg-gradient-to-r from-red-900 to-red-700 p-4 rounded-xl flex items-center justify-between shadow-lg border border-red-500/30 hover:scale-[1.02] transition-transform"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-black/30 p-2 rounded-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white text-lg">Админ Панель</h3>
                                <p className="text-xs text-white/70">Управление депозитами и выводами</p>
                            </div>
                        </div>
                        <div className="bg-white/10 p-1 rounded-full">
                           <ChevronRight className="w-5 h-5 text-white" />
                        </div>
                    </button>
                </div>
            )}

            {/* Блок Настроек */}
            <SettingsBlock />
            
            {/* Блок Поддержки (передаем реальный ID) */}
            <SupportBlock tgId={displayTgId} />

            {/* Кнопка Выхода (Закрыть приложение) */}
            <button 
                onClick={onClose}
                className="w-full bg-red-800/20 text-red-400 py-3 rounded-lg font-bold hover:bg-red-800/40 transition-colors flex items-center justify-center mt-8 border border-red-800/30"
            >
                <LogOut className="w-5 h-5 mr-2"/>
                Закрыть приложение
            </button>
            
            <div className="h-24"></div> 
        </div>
    );
};

export default ProfileScreen;