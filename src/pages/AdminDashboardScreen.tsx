import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/tyrexApi'; // Убедитесь, что импорт правильный
import { useNavigate } from 'react-router-dom';
import { 
    Shield, Users, ArrowDownCircle, ArrowUpCircle, 
    Loader2, RefreshCw, Wallet, LayoutGrid,
} from 'lucide-react';
import { clsx } from 'clsx';
import UsersTab from '../components/UsersTab'; // <--- Добавьте эту строку

type TabType = 'STATS' | 'FINANCE' | 'USERS' | 'MARKET';

const StatCard = ({ label, value, subValue, icon: Icon }: any) => (
    <div className="bg-tyrex-graphite/50 p-3 rounded-xl border border-white/5">
        <div className="text-white/50 text-xs mb-1 flex items-center">{Icon && <Icon className="w-3 h-3 mr-1" />} {label}</div>
        <div className="text-xl font-bold text-white">{value}</div>
        {subValue && <div className="text-xs text-white/40 mt-1">{subValue}</div>}
    </div>
);

// =========================================================
// Вкладка: ФИНАНСЫ (ИСПРАВЛЕНА)
// =========================================================
const FinanceTab = () => {
    const [deposits, setDeposits] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [deps, wds] = await Promise.all([
                adminApi.getPendingDeposits(),
                adminApi.getPendingWithdrawals()
            ]);
            setDeposits(Array.isArray(deps) ? deps : []);
            setWithdrawals(Array.isArray(wds) ? wds : []);
        } catch (e) { console.error("Finance data loading error:", e); } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleAction = async (id: string, apiCall: Function, type: 'DEP' | 'WD') => {
        if(!window.confirm("Вы уверены?")) return;
        setProcessingId(id);
        try {
            await apiCall(id);
            if (type === 'DEP') setDeposits(prev => prev.filter(d => d._id !== id));
            else setWithdrawals(prev => prev.filter(w => w._id !== id));
        } catch (e) { alert("Ошибка выполнения"); } finally { setProcessingId(null); }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tyrex-ultra-gold-glow"/></div>;

    // Вспомогательная функция для безопасного форматирования
    const safeToFixed = (num: any, digits = 2) => {
        const value = Number(num);
        return isNaN(value) ? '0.00' : value.toFixed(digits);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-green-400 font-bold mb-2 flex items-center"><ArrowDownCircle className="w-4 h-4 mr-2"/> Входящие ({deposits.length})</h3>
                <div className="space-y-2">
                    {deposits.length === 0 && <p className="text-white/30 text-sm">Нет заявок</p>}
                    {deposits.map(d => (
                        <div key={d._id} className="bg-tyrex-graphite/40 p-3 rounded-lg flex justify-between items-center border border-green-500/10">
                            <div>
                                <p className="text-sm font-bold text-white">@{d.userId?.username || 'Unknown'}</p>
                                <p className="text-[10px] text-white/50">ID: {d.userId?.tgId}</p>
                                <p className="text-xs text-white/50 w-32 truncate mt-1" title={d.txHash}>{d.txHash}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-green-400 font-mono text-sm font-bold">+${safeToFixed(d.amountUsd)}</p>
                                <button disabled={!!processingId} onClick={() => handleAction(d._id, adminApi.confirmDeposit, 'DEP')}
                                    className="text-[10px] bg-green-700 px-3 py-1.5 rounded text-white mt-2 hover:bg-green-600 font-bold">
                                    {processingId === d._id ? '...' : 'Подтвердить'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-red-400 font-bold mb-2 flex items-center"><ArrowUpCircle className="w-4 h-4 mr-2"/> Заявки на вывод ({withdrawals.length})</h3>
                <div className="space-y-2">
                    {withdrawals.length === 0 && <p className="text-white/30 text-sm">Нет заявок</p>}
                    {withdrawals.map(w => (
                        <div key={w._id} className="bg-tyrex-graphite/40 p-3 rounded-lg flex justify-between items-center border border-red-500/10">
                            <div>
                                <p className="text-sm font-bold text-white">@{w.userId?.username || 'Unknown'}</p>
                                <p className="text-[10px] text-white/50">Баланс: ${safeToFixed(w.userId?.balance?.walletUsd)}</p>
                                <p className="text-xs text-white/50 w-32 truncate mt-1" title={w.walletAddress}>{w.walletAddress}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-red-400 font-mono text-sm font-bold">-${safeToFixed(w.amountUsd)}</p>
                                <button disabled={!!processingId} onClick={() => handleAction(w._id, adminApi.processWithdrawal, 'WD')}
                                    className="text-[10px] bg-red-700 px-3 py-1.5 rounded text-white mt-2 hover:bg-red-600 font-bold">
                                    {processingId === w._id ? '...' : 'Выплачено'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// =========================================================
// ОСНОВНОЙ КОМПОНЕНТ (Без изменений, но полный код для целостности)
// =========================================================
const AdminDashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('STATS');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'STATS') {
            adminApi.getStats().then(setStats).catch(console.error);
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-tyrex-dark-black text-white p-4 pb-24">
            <div className="flex justify-between items-center mb-6 pt-4">
                <div className="flex items-center space-x-2">
                    <Shield className="text-tyrex-ultra-gold-glow w-6 h-6" />
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                </div>
                <button onClick={() => navigate('/profile')} className="text-sm text-white/50 hover:text-white">Exit</button>
            </div>

            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                {[
                    { id: 'STATS', label: 'Overview', icon: LayoutGrid },
                    { id: 'FINANCE', label: 'Finance', icon: Wallet },
                    { id: 'USERS', label: 'Users', icon: Users },
                    // { id: 'MARKET', label: 'Market', icon: RefreshCw }, // Можно раскомментировать
                ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                        className={clsx("flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                            activeTab === tab.id ? "bg-tyrex-ultra-gold-glow text-tyrex-dark-black" : "bg-tyrex-graphite/50 text-white/60 hover:bg-tyrex-graphite")}>
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="animate-fade-in">
                {activeTab === 'STATS' && (
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} />
                        <StatCard label="Active Cards" value={stats?.activeCardsCount || 0} icon={RefreshCw} />
                    </div>
                )}
                {activeTab === 'FINANCE' && <FinanceTab />}
    {activeTab === 'USERS' && <UsersTab />} {/* <--- Добавьте эту строку */}
                {/* {activeTab === 'MARKET' && <div>Market management...</div>} */}
            </div>
        </div>
    );
};

export default AdminDashboardScreen;