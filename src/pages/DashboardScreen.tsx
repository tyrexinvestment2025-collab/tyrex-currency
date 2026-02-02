import React, { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram'; 
import { useTyrexStore } from '../store/useTyrexStore';
import { userApi } from '../api/tyrexApi';
import { RefreshCw, Copy, X, Loader2 } from 'lucide-react';
import TyrexModal from '../components/common/TyrexModal';

const ADMIN_WALLET_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; 

// --- Иконки ---
const DepositIcon = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const WithdrawIcon = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ExchangeIcon = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const BillIcon = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DollarSmallIcon = () => <svg className="w-3 h-3 text-tyrex-dark-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- Components ---

const UserHeader: React.FC = () => {
    const { user, refreshAllData } = useTelegram();
    const userName = user?.username || 'MINER'; 

    return (
        <div className="p-4 pt-6 flex justify-between items-center bg-tyrex-dark-black">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-tyrex-dark-black font-extrabold text-sm shadow-md border border-white/10">
                    {userName[0]?.toUpperCase() || 'M'}
                </div>
                <div>
                    <p className="text-xs text-white/60 font-medium leading-none mb-1">Welcome back,</p>
                    <p className="text-lg font-bold text-tyrex-ultra-gold-glow leading-tight tracking-wide">
                        @{userName}
                    </p>
                </div>
            </div>
            <button onClick={refreshAllData} className="p-2 bg-tyrex-graphite/40 rounded-full active:scale-90 transition-transform">
                <RefreshCw className="w-5 h-5 text-white/70" />
            </button>
        </div>
    );
};

const TotalBalanceCard: React.FC = () => {
    const { balance } = useTyrexStore();
    const { stakingBTC, totalBTC, walletUsd } = balance;

    return (
        <div id="balance-card" className="p-4 pt-2">
            <div className="bg-gradient-to-br from-[#FFD700] to-[#E6B800] p-5 rounded-[24px] shadow-2xl relative overflow-hidden ring-1 ring-white/20">
                <div className="flex justify-between items-start mb-5 relative z-10">
                    <div>
                        <p className="text-[11px] font-extrabold text-tyrex-dark-black/70 uppercase tracking-widest">
                            Общий капитал (BTC)
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                         <div className="bg-tyrex-dark-black/10 px-2.5 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-sm border border-black/5">
                            <DollarSmallIcon />
                            <span className="text-sm font-extrabold text-tyrex-dark-black tabular-nums">
                                {walletUsd.toFixed(2)}
                            </span>
                         </div>
                         <span className="text-[10px] font-semibold text-tyrex-dark-black/60 mt-1 mr-1">
                             Доступно USD
                         </span>
                    </div>
                </div>
                
                <h2 className="text-[40px] font-black text-tyrex-dark-black leading-none mb-6 tracking-tighter relative z-10">
                    {totalBTC.toFixed(8)}
                </h2>
                
                <div className="flex gap-3 relative z-10">
                    <div className="flex-1 bg-tyrex-dark-black/10 p-3 rounded-xl border border-tyrex-dark-black/5 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-tyrex-dark-black animate-pulse"></div>
                             <p className="text-[10px] font-bold text-tyrex-dark-black/70 uppercase">В майнинге</p>
                        </div>
                        <p className="text-sm font-bold text-tyrex-dark-black truncate tabular-nums">
                            {stakingBTC.toFixed(8)}
                        </p>
                    </div>
                     <div className="flex-1 bg-tyrex-dark-black/10 p-3 rounded-xl border border-tyrex-dark-black/5 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                             <p className="text-[10px] font-bold text-tyrex-dark-black/70 uppercase">Рефералы</p>
                        </div>
                        <p className="text-sm font-bold text-tyrex-dark-black truncate tabular-nums">
                            0.00000000
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---

const DashboardScreen: React.FC = () => {
    const { tg, refreshAllData } = useTelegram();
    const { simulateDailyInterest, balance } = useTyrexStore();
    
    // Состояния для модалок
    const [isDepositOpen, setDepositOpen] = useState(false);
    const [isWithdrawOpen, setWithdrawOpen] = useState(false);
    
    // Состояния форм
    const [amount, setAmount] = useState('');
    const [walletOrHash, setWalletOrHash] = useState('');
    const [loading, setLoading] = useState(false);

    // Модалка результата (Успех/Ошибка)
    const [resultModal, setResultModal] = useState({ isOpen: false, title: '', message: '', isError: false });

    useEffect(() => {
        if (tg) tg.ready();
        const interval = setInterval(() => { simulateDailyInterest(); }, 60000); 
        return () => clearInterval(interval);
    }, [tg, simulateDailyInterest]);

    // Обработчик Пополнения
    const handleDepositSubmit = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert("Введите корректную сумму");
            return;
        }
        if (!walletOrHash) {
            alert("Введите Hash транзакции");
            return;
        }

        setLoading(true);
        try {
            await userApi.requestDeposit(Number(amount), walletOrHash);
            setDepositOpen(false);
            setResultModal({ 
                isOpen: true, 
                title: 'Заявка создана', 
                message: 'Администратор проверит вашу транзакцию и начислит средства.', 
                isError: false 
            });
            // Сброс формы
            setAmount('');
            setWalletOrHash('');
        } catch (error: any) {
            setResultModal({ 
                isOpen: true, 
                title: 'Ошибка', 
                message: error.message || 'Не удалось создать заявку', 
                isError: true 
            });
        } finally {
            setLoading(false);
            refreshAllData();
        }
    };

    // Обработчик Вывода
    const handleWithdrawSubmit = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert("Введите корректную сумму");
            return;
        }
        if (Number(amount) > balance.walletUsd) {
            alert("Недостаточно средств на балансе");
            return;
        }
        if (!walletOrHash) {
            alert("Введите адрес кошелька");
            return;
        }

        setLoading(true);
        try {
            await userApi.requestWithdrawal(Number(amount), walletOrHash);
            setWithdrawOpen(false);
            setResultModal({ 
                isOpen: true, 
                title: 'Заявка принята', 
                message: 'Средства поступят на ваш кошелек после одобрения администратором.', 
                isError: false 
            });
            setAmount('');
            setWalletOrHash('');
        } catch (error: any) {
            setResultModal({ 
                isOpen: true, 
                title: 'Ошибка', 
                message: error.message || 'Не удалось запросить вывод', 
                isError: true 
            });
        } finally {
            setLoading(false);
            refreshAllData();
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(ADMIN_WALLET_ADDRESS);
        alert("Адрес скопирован!");
    };

    return (
        <div className="min-h-screen bg-tyrex-dark-black font-sans pb-28 relative">
            <UserHeader />
            <TotalBalanceCard />
            
            {/* КНОПКИ ДЕЙСТВИЙ */}
            <div className="flex justify-around px-4 pt-2 pb-6">
                <button onClick={() => setDepositOpen(true)} className="flex flex-col items-center space-y-2 w-1/4 group active:scale-95 transition-transform">
                    <div className="p-3.5 rounded-2xl shadow-lg border border-white/5 bg-[#6D28D9]">
                        <DepositIcon />
                    </div>
                    <span className="text-[11px] font-medium text-white/70 group-hover:text-tyrex-ultra-gold-glow transition-colors">Add Funds</span>
                </button>

                <button onClick={() => setWithdrawOpen(true)} className="flex flex-col items-center space-y-2 w-1/4 group active:scale-95 transition-transform">
                    <div className="p-3.5 rounded-2xl shadow-lg border border-white/5 bg-[#6D28D9]">
                        <WithdrawIcon />
                    </div>
                    <span className="text-[11px] font-medium text-white/70 group-hover:text-tyrex-ultra-gold-glow transition-colors">Withdraw</span>
                </button>

                <button className="flex flex-col items-center space-y-2 w-1/4 group active:scale-95 transition-transform opacity-50 cursor-not-allowed">
                    <div className="p-3.5 rounded-2xl shadow-lg border border-white/5 bg-[#6D28D9]">
                        <ExchangeIcon />
                    </div>
                    <span className="text-[11px] font-medium text-white/70">Transfer</span>
                </button>

                <button className="flex flex-col items-center space-y-2 w-1/4 group active:scale-95 transition-transform opacity-50 cursor-not-allowed">
                    <div className="p-3.5 rounded-2xl shadow-lg border border-white/5 bg-[#6D28D9]">
                        <BillIcon />
                    </div>
                    <span className="text-[11px] font-medium text-white/70">History</span>
                </button>
            </div>

            {/* МОДАЛЬНОЕ ОКНО ПОПОЛНЕНИЯ */}
            {isDepositOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-tyrex-graphite w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative">
                        <button onClick={() => setDepositOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <DepositIcon /> <span className="ml-2">Пополнение</span>
                        </h3>

                        <div className="mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-xs text-white/50 mb-1">Адрес для перевода (USDT TRC20):</p>
                            <div className="flex justify-between items-center">
                                <code className="text-xs text-tyrex-ultra-gold-glow break-all mr-2">{ADMIN_WALLET_ADDRESS}</code>
                                <button onClick={copyAddress} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                    <Copy className="w-4 h-4 text-white"/>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Сумма (USD)</label>
                                <input 
                                    type="number" 
                                    placeholder="100" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-tyrex-dark-black border border-white/10 rounded-lg p-3 text-white focus:border-tyrex-ultra-gold-glow outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">TxHash (ID транзакции)</label>
                                <input 
                                    type="text" 
                                    placeholder="Вставьте хеш транзакции..." 
                                    value={walletOrHash}
                                    onChange={(e) => setWalletOrHash(e.target.value)}
                                    className="w-full bg-tyrex-dark-black border border-white/10 rounded-lg p-3 text-white focus:border-tyrex-ultra-gold-glow outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleDepositSubmit} 
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex justify-center items-center"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Я перевел средства'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* МОДАЛЬНОЕ ОКНО ВЫВОДА */}
            {isWithdrawOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-tyrex-graphite w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl relative">
                        <button onClick={() => setWithdrawOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <WithdrawIcon /> <span className="ml-2">Вывод средств</span>
                        </h3>

                        <div className="mb-4 text-center">
                            <p className="text-sm text-white/50">Доступно для вывода:</p>
                            <p className="text-2xl font-bold text-green-400">${balance.walletUsd.toFixed(2)}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Сумма к выводу (USD)</label>
                                <input 
                                    type="number" 
                                    placeholder="Min $30" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-tyrex-dark-black border border-white/10 rounded-lg p-3 text-white focus:border-tyrex-ultra-gold-glow outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Ваш кошелек (USDT TRC20)</label>
                                <input 
                                    type="text" 
                                    placeholder="T..." 
                                    value={walletOrHash}
                                    onChange={(e) => setWalletOrHash(e.target.value)}
                                    className="w-full bg-tyrex-dark-black border border-white/10 rounded-lg p-3 text-white focus:border-tyrex-ultra-gold-glow outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleWithdrawSubmit} 
                                disabled={loading}
                                className="w-full bg-tyrex-ultra-gold-glow hover:bg-yellow-400 text-black font-bold py-3 rounded-xl flex justify-center items-center"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Запросить вывод'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка результата (используем общий компонент) */}
            <TyrexModal 
                isOpen={resultModal.isOpen} 
                title={resultModal.title} 
                message={resultModal.message} 
                actionText="OK"
                onAction={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
                onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default DashboardScreen;