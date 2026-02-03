// src/components/admin/UsersTab.tsx
import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/tyrexApi'; // Убедитесь, что путь правильный
import { Loader2, User, Ban, CheckCircle, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx'; // Используем clsx для условных классов

// Вспомогательная функция для безопасного форматирования Decimal128 из MongoDB
const parseAndFormatUsd = (value: any) => {
    try {
        if (value && value.$numberDecimal) {
            return parseFloat(value.$numberDecimal).toFixed(2);
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return parseFloat(String(value)).toFixed(2);
        }
    } catch (e) {
        console.warn("Failed to parse Decimal128 value:", value, e);
    }
    return '0.00';
};

const UsersTab: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [banningUserId, setBanningUserId] = useState<string | null>(null);
    const [viewingUserReport, setViewingUserReport] = useState<string | null>(null);
    const [userReport, setUserReport] = useState<any>(null);
    const [loadingUserReport, setLoadingUserReport] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(currentPage, searchQuery);
            setUsers(data.data || []);
            setTotalPages(data.pagination.pages);
        } catch (e) {
            console.error("Error loading users:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Сбрасываем на первую страницу при новом поиске
        loadUsers();
    };

    const handleBanToggle = async (userId: string, currentStatus: boolean) => {
        if (!window.confirm(`Вы уверены, что хотите ${currentStatus ? 'разбанить' : 'забанить'} пользователя?`)) return;
        setBanningUserId(userId);
        try {
            const response = await adminApi.banUser(userId);
            if (response.isBanned !== undefined) {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user._id === userId ? { ...user, isBanned: response.isBanned } : user
                    )
                );
            } else {
                alert("Ошибка: Не удалось обновить статус бана.");
            }
        } catch (e) {
            console.error("Error banning user:", e);
            alert("Ошибка при обновлении статуса бана.");
        } finally {
            setBanningUserId(null);
        }
    };

    const handleViewFullReport = async (userId: string) => {
        setLoadingUserReport(true);
        setViewingUserReport(userId);
        try {
            const report = await adminApi.getUserFullReport(userId);
            setUserReport(report);
        } catch (e) {
            console.error("Error loading user report:", e);
            alert("Ошибка при загрузке отчета пользователя.");
            setViewingUserReport(null);
        } finally {
            setLoadingUserReport(false);
        }
    };

    const closeUserReport = () => {
        setViewingUserReport(null);
        setUserReport(null);
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]); // Загружаем пользователей при изменении страницы

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tyrex-ultra-gold-glow"/></div>;

    if (viewingUserReport && userReport) {
        return (
            <div className="bg-tyrex-graphite/40 p-4 rounded-xl border border-white/5 space-y-4">
                <button onClick={closeUserReport} className="text-white/60 hover:text-white mb-4 flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1"/> Назад к списку
                </button>
                {loadingUserReport ? (
                     <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tyrex-ultra-gold-glow"/></div>
                ) : (
                    <>
                        <h3 className="text-lg font-bold text-white mb-3">Отчет по пользователю: @{userReport.profile?.username || 'N/A'} (ID: {userReport.profile?.tgId})</h3>
                        
                        <div className="space-y-2 text-sm text-white/70">
                            <p><strong>Роль:</strong> {userReport.profile?.role}</p>
                            <p><strong>Статус аккаунта:</strong> {userReport.profile?.accountStatus}</p>
                            <p><strong>Баланс (USD):</strong> ${parseAndFormatUsd(userReport.profile?.balance?.walletUsd)}</p>
                            <p><strong>В стейкинге (USD):</strong> ${parseAndFormatUsd(userReport.profile?.balance?.stakingUsd)}</p>
                            <p><strong>Ожидает вывода (USD):</strong> ${parseAndFormatUsd(userReport.profile?.balance?.pendingWithdrawalUsd)}</p>
                            <p><strong>Общая прибыль (USD):</strong> ${parseAndFormatUsd(userReport.profile?.balance?.totalProfitUsd)}</p>
                            <p><strong>Реферальные (USD):</strong> ${parseAndFormatUsd(userReport.profile?.balance?.referralUsd)}</p>
                            <p><strong>Забанен:</strong> {userReport.profile?.isBanned ? 'Да' : 'Нет'}</p>
                            <p><strong>Код реферала:</strong> {userReport.profile?.referralCode || 'N/A'}</p>
                            <p><strong>Приглашен от TG ID:</strong> {userReport.profile?.uplineUserId?.tgId || 'N/A'}</p>
                            <p><strong>Рефералов пригласил:</strong> {userReport.referrals?.count || 0}</p>
                        </div>

                        <h4 className="text-md font-bold text-white mt-6 mb-2">Карты пользователя ({userReport.cards?.length || 0})</h4>
                        {userReport.cards?.length === 0 ? (
                            <p className="text-white/50 text-sm">Нет активных карт.</p>
                        ) : (
                            <div className="space-y-2">
                                {userReport.cards?.map((card: any) => (
                                    <div key={card._id} className="bg-tyrex-dark-black p-2 rounded text-sm">
                                        <p><strong>Тип:</strong> {card.cardTypeId?.name || 'N/A'}</p>
                                        <p><strong>Сумма:</strong> {parseAndFormatUsd(card.amountUsd)} USD</p>
                                        <p><strong>Статус:</strong> {card.status}</p>
                                        <p><strong>Дата активации:</strong> {new Date(card.activatedAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 className="text-md font-bold text-white mt-6 mb-2">Последние транзакции ({userReport.transactions?.length || 0})</h4>
                        {userReport.transactions?.length === 0 ? (
                            <p className="text-white/50 text-sm">Нет транзакций.</p>
                        ) : (
                            <div className="space-y-2">
                                {userReport.transactions?.map((tx: any) => (
                                    <div key={tx._id} className={clsx("p-2 rounded text-sm", 
                                        tx.amountUsd ? (tx.txHash ? "bg-green-700/20" : "bg-red-700/20") : "bg-white/10" // Простой способ различить депозиты/выводы
                                    )}>
                                        <p><strong>Тип:</strong> {tx.txHash ? 'Пополнение' : 'Вывод'}</p>
                                        <p><strong>Сумма:</strong> {tx.txHash ? '+' : '-'}${parseAndFormatUsd(tx.amountUsd)} USD</p>
                                        <p><strong>Статус:</strong> {tx.status}</p>
                                        <p><strong>Дата:</strong> {new Date(tx.createdAt).toLocaleString()}</p>
                                        {tx.txHash && <p className="truncate text-white/50">TxHash: {tx.txHash}</p>}
                                        {tx.walletAddress && <p className="truncate text-white/50">Кошелек: {tx.walletAddress}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
                <input
                    type="text"
                    placeholder="Поиск по нику или TG ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow bg-tyrex-graphite/50 text-white border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-tyrex-ultra-gold-glow"
                />
                <button type="submit" className="bg-tyrex-ultra-gold-glow text-tyrex-dark-black p-2 rounded-lg hover:opacity-90 transition-opacity">
                    <Search className="w-4 h-4" />
                </button>
            </form>

            <h3 className="text-white font-bold mb-2 flex items-center"><User className="w-4 h-4 mr-2"/> Пользователи ({users.length})</h3>
            <div className="space-y-3">
                {users.length === 0 && <p className="text-white/30 text-sm">Нет пользователей по вашему запросу.</p>}
                {users.map(user => (
                    <div key={user._id} className="bg-tyrex-graphite/40 p-3 rounded-lg flex justify-between items-center border border-white/5">
                        <div>
                            <p className="text-sm font-bold text-white">@{user.username || 'Unknown'}</p>
                            <p className="text-[10px] text-white/50">ID: {user.tgId} | Баланс: ${parseAndFormatUsd(user.balance?.walletUsd)}</p>
                            <p className="text-[10px] text-white/50">Регистрация: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {user.isBanned ? (
                                <span className="text-red-500 text-[10px] font-bold">Забанен</span>
                            ) : (
                                <span className="text-green-500 text-[10px] font-bold">Активен</span>
                            )}
                            <button
                                disabled={banningUserId === user._id}
                                onClick={() => handleBanToggle(user._id, user.isBanned)}
                                className={clsx(
                                    "p-1.5 rounded-full text-white transition-colors",
                                    user.isBanned ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
                                )}
                            >
                                {banningUserId === user._id ? <Loader2 className="w-4 h-4 animate-spin"/> : (user.isBanned ? <CheckCircle className="w-4 h-4"/> : <Ban className="w-4 h-4"/>)}
                            </button>
                            <button
                                onClick={() => handleViewFullReport(user._id)}
                                className="text-[10px] bg-blue-700 px-3 py-1.5 rounded text-white hover:bg-blue-600 font-bold"
                            >
                                Отчет
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                        className="p-2 rounded-full bg-tyrex-graphite/50 text-white/60 hover:text-white disabled:opacity-50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-white/70">Страница {currentPage} из {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || loading}
                        className="p-2 rounded-full bg-tyrex-graphite/50 text-white/60 hover:text-white disabled:opacity-50"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default UsersTab;