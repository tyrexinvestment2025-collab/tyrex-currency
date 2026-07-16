import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Lock, Share2, RefreshCw, CheckCircle2, TrendingUp, ShieldCheck, MinusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { referralApi } from '../api/tyrexApi';
import { useTyrexStore } from '../store/useTyrexStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ReferralScreen: React.FC = () => {
    const navigate = useNavigate();
    const { btcPrice } = useTyrexStore();
    
    const [data, setData] = useState<any>(null);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [activeTab, setActiveTab] = useState<'RESULTS' | 'PARTNERS'>('RESULTS');
    const [showExtended, setShowExtended] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const info = await referralApi.getReferralInfo();
            setData(info);
            if (!info.isLocked) {
                const list = await referralApi.getReferralList();
                setPartners(list);
            }
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    };

    // Конвертація SATS у повний формат BTC (8 знаків після коми)
    const btcValue = useMemo(() => {
        if (!data?.totalEarnedSats) return "0.00000000";
        return (data.totalEarnedSats / 100000000).toFixed(8);
    }, [data?.totalEarnedSats]);

    // Розрахунок USD
    const currentUsdtValue = useMemo(() => {
        if (!btcPrice || !data?.totalEarnedSats) return "0.00";
        return ((data.totalEarnedSats / 100000000) * btcPrice).toFixed(2);
    }, [btcPrice, data?.totalEarnedSats]);

    const handleClaim = async () => {
        if (claiming || (data?.totalEarnedSats || 0) <= 0) return;
        setClaiming(true);
        try {
            const res = await referralApi.claimRewards();
            if (res.success) {
                toast.success(`Собрано ${res.claimedAmount} SATS!`);
                loadData();
            }
        } catch (e) { 
            toast.error("Ошибка сбора"); 
        } finally { 
            setClaiming(false); 
        }
    };

    const copyLink = () => {
        if (!data?.referralLink) return;
        navigator.clipboard.writeText(data.referralLink);
        toast.success('Ссылка скопирована!');
    };

    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-[#FFB700] animate-spin opacity-50" />
        </div>
    );

    if (data?.isLocked) {
        return (
            <div className="min-h-screen bg-[#080808] text-white p-6 flex flex-col justify-center items-center text-center">
                <div className="bg-[#141414] border border-[#222222] p-10 rounded-[3rem] shadow-2xl flex flex-col items-center">
                    <Lock className="w-12 h-12 text-[#FFB700] opacity-20 mb-6" />
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Pool Locked</h1>
                    <p className="text-[#808080] text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8">
                        Purchase a mining card <br/> to unlock your referral link
                    </p>
                    <button onClick={() => navigate('/marketplace')} className="w-full py-5 bg-[#FFB800] text-black rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">
                        Go to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 font-sans overflow-x-hidden">
            
            {/* --- 1. HEADER (Стиль Аналітики) --- */}
            <div className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-xl border-b border-[#222222] px-6 py-5">
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-none"
                    style={{ background: 'linear-gradient(to bottom, #FFD700, #B8860B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ПАРТНЕРСКАЯ ПРОГРАММА
                </h1>
                <p className="text-[11px] text-[#808080] font-medium mt-1 leading-snug uppercase tracking-wider">
                    Зарабатывайте на рекомендациях! Получайте процент от прибыли каждого приглашенного вами пользователя.
                </p>
            </div>

            <div className="p-5 space-y-5">

                {/* --- 2. ВАШ ДОХОД (DASHBOARD) --- */}
                <div className="bg-[#141414] border border-[#FFB700]/20 rounded-[2.5rem] p-7 relative overflow-hidden shadow-2xl">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFB700]/5 blur-[60px] rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#808080] mb-3">ВАШ ДОХОД ОТ ПАРТНЕРКИ</span>
                        
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                {btcValue}
                            </span>
                            <span className="text-sm font-black text-[#FFB700] uppercase">BTC</span>
                        </div>
                        <p className="text-xs font-bold text-[#808080] uppercase tracking-widest mb-6">
                            ≈ ${currentUsdtValue} USDT
                        </p>

                        <button 
                            onClick={handleClaim}
                            disabled={claiming || (data?.totalEarnedSats || 0) <= 0}
                            className={clsx(
                                "w-full py-5 rounded-2xl font-black uppercase text-sm tracking-widest transition-all",
                                (data?.totalEarnedSats || 0) > 0 ? "bg-[#FFB700] text-black shadow-[0_10px_30px_rgba(255,183,0,0.3)] active:scale-95" : "bg-[#222222] text-[#555555]"
                            )}
                        >
                            {claiming ? <RefreshCw className="animate-spin mx-auto" size={20}/> : "ЗАБРАТЬ НАГРАДУ"}
                        </button>
                    </div>
                </div>

                {/* --- 3. РЕФЕРАЛЬНАЯ ССЫЛКА --- */}
                <div className="bg-[#141414] border border-[#222222] p-5 rounded-[2rem] space-y-4 shadow-xl">
                    <div className="flex justify-between items-center px-1">
                        <p className="text-[10px] font-black text-[#FFB700] uppercase tracking-[0.2em]">ВАША РЕФЕРАЛЬНАЯ ССЫЛКА</p>
                        <div className="flex gap-2">
                            <button onClick={copyLink} className="p-2.5 bg-[#080808] border border-[#222222] rounded-xl active:border-[#FFB700] transition-all shadow-inner">
                                <Copy size={14} className="text-[#FFB700]"/>
                            </button>
                            <button onClick={() => {}} className="p-2.5 bg-[#080808] border border-[#222222] rounded-xl">
                                <Share2 size={14} className="text-[#808080]"/>
                            </button>
                        </div>
                    </div>
                    <div className="bg-[#080808] border border-[#222222] p-4 rounded-xl text-center">
                        <span className="text-[12px] font-mono text-white/60 truncate block">{data?.referralLink}</span>
                    </div>
                    <p className="text-[10px] text-center text-[#808080] font-bold leading-relaxed uppercase tracking-tight">
                        Делитесь ссылкой с друзьями и получайте пассивный доход от работы их капитала.
                    </p>
                </div>

                {/* --- TABS --- */}
                <div className="flex p-1 bg-[#141414] border border-[#222222] rounded-2xl shadow-inner">
                    <button 
                        onClick={() => setActiveTab('RESULTS')}
                        className={clsx(
                            "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                            activeTab === 'RESULTS' ? "bg-white text-black shadow-xl scale-[1.02]" : "text-[#808080]"
                        )}
                    >
                        РЕЗУЛЬТАТЫ
                    </button>
                    <button 
                        onClick={() => setActiveTab('PARTNERS')}
                        className={clsx(
                            "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                            activeTab === 'PARTNERS' ? "bg-white text-black shadow-xl scale-[1.02]" : "text-[#808080]"
                        )}
                    >
                        ПАРТНЕРЫ
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'RESULTS' ? (
                        <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {/* ВЕРХНІЙ РЯД */}
                                <div className="bg-[#141414] p-5 rounded-[2rem] border border-[#222222] flex flex-col justify-between h-40">
                                    <span className="text-[11px] font-black text-[#808080] uppercase tracking-widest leading-tight">ВСЕГО РЕГИСТРАЦИЙ</span>
                                    <div className="text-3xl font-black text-white italic tracking-tighter">
                                        {data?.stats?.totalInvited} <span className="text-xs opacity-30 not-italic">чел.</span>
                                    </div>
                                </div>
                                <div className="bg-[#141414] p-5 rounded-[2rem] border border-[#222222] flex flex-col justify-between h-40">
                                    <span className="text-[11px] font-black text-[#808080] uppercase tracking-widest leading-tight">ИЗ НИХ НЕ ИНВЕСТИРОВАЛИ</span>
                                    <div className="text-3xl font-black text-[#FF7000] italic tracking-tighter">
                                        {data?.stats?.nonInvestorsCount} <span className="text-xs opacity-30 not-italic">чел.</span>
                                    </div>
                                </div>
                                
                                {/* НИЖНІЙ РЯД */}
                                <div className="bg-[#141414] p-5 rounded-[2rem] border border-[#222222] flex flex-col justify-between h-40">
                                    <span className="text-[11px] font-black text-[#808080] uppercase tracking-widest leading-tight">КАПИТАЛ ВАШИХ ПАРТНЕРОВ</span>
                                    <div className="text-2xl font-black text-white italic tracking-tighter">
                                        ${data?.stats?.totalPartnerCapital?.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-[#141414] p-5 rounded-[2rem] border border-[#FFB700]/60 flex flex-col justify-between h-40 shadow-[0_0_25px_rgba(255,183,0,0.1)]">
                                    <span className="text-[11px] font-black text-[#FFB700] uppercase tracking-widest leading-tight">КАПИТАЛ НЕ В РАБОТЕ</span>
                                    <div className="text-2xl font-black text-[#FFB700] italic tracking-tighter">
                                        ${data?.stats?.totalIdleCapital?.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="part" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                             <div className="flex justify-end px-2 mb-2">
                                 <button 
                                    onClick={() => setShowExtended(!showExtended)}
                                    className={clsx(
                                        "flex items-center gap-2 text-[10px] font-black uppercase transition-all duration-300 px-3 py-1.5 rounded-full border",
                                        showExtended ? "text-[#FFB800] border-[#FFB800]/40 bg-[#FFB800]/10" : "text-[#555555] border-[#222222]"
                                    )}
                                 >
                                     <ShieldCheck size={14} className={showExtended ? "animate-pulse" : ""}/>
                                     {showExtended ? "Скрыть детали" : "Расширенная информация"}
                                 </button>
                             </div>
                             {partners.map((p: any) => (
                                <div key={p.id} className="bg-[#141414] border border-[#222222] p-5 rounded-[2rem] flex flex-col shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-11 h-11 rounded-xl bg-[#080808] border border-[#222222] flex items-center justify-center shadow-inner">
                                                {p.isActive ? (
                                                    <CheckCircle2 size={20} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                                ) : (
                                                    <MinusCircle size={20} className="text-[#333333]" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white tracking-tight uppercase">{p.username || 'Anonymous'}</p>
                                                <p className="text-[9px] font-bold text-[#555555] uppercase">ID: {p.id.slice(-6)}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[12px] font-black text-white">${p.idleBalance || '0.00'}</p>
                                            <p className="text-[8px] font-black text-[#555555] uppercase tracking-tighter">Не в работе</p>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {showExtended && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp size={12} className="text-[#FFB800] opacity-50" />
                                                        <span className="text-[8px] font-black text-[#555555] uppercase tracking-widest">Инвестировано</span>
                                                    </div>
                                                    <p className="text-[12px] font-black text-[#FFB800] italic tracking-tighter">
                                                        ${p.totalInvestment || '0.00'}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReferralScreen;