import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Lock, Share2, RefreshCw, Info, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { referralApi } from '../api/tyrexApi';
import { useTyrexStore } from '../store/useTyrexStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import PartnersSection from '../components/referral/PartnersSection';

// Конфіг для легенди
const REFERRAL_LEGEND: any = {
    'REVENUE': { title: 'ВАШ ДОХОД', full: 'Это суммарная прибыль, которую вы получили от активности ваших партнеров. Начисляется автоматически в валюте актива, который приобрел партнер.' },
    'LINK': { title: 'РЕФЕРАЛЬНАЯ ССЫЛКА', full: 'Используйте эту ссылку для приглашения новых пользователей. Вы получаете процент от каждой их успешной инвестиции.' },
    'TOTAL_REG': { title: 'ВСЕГО РЕГИСТРАЦИЙ', full: 'Общее количество людей, зарегистрировавшихся в системе Tyrex по вашей уникальной ссылке.' },
    'NON_INVEST': { title: 'НЕ ИНВЕСТИРОВАЛИ', full: 'Пользователи, которые прошли регистрацию, но еще не приобрели ни одной NFT-карты. Потенциал вашего роста.' },
    'PARTNER_CAPITAL': { title: 'КАПИТАЛ ПАРТНЕРОВ', full: 'Суммарная стоимость всех активных майнинг-карт, которые находятся в работе у вашей первой линии партнеров.' },
    'IDLE_CAPITAL': { title: 'КАПИТАЛ НЕ В РАБОТЕ', full: 'Сумма средств на кошельках ваших партнеров, не задействованная в стратегиях. Это ваш потенциальный доход.' }
};

const ReferralScreen: React.FC = () => {
    const navigate = useNavigate();
    const { btcPrice } = useTyrexStore();
    
    const [data, setData] = useState<any>(null);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [activeTab, setActiveTab] = useState<'RESULTS' | 'PARTNERS'>('RESULTS');
    // const [showExtended, setShowExtended] = useState(false);
    
    const [modalInfo, setModalInfo] = useState<any>(null);
    const [activeWidget, setActiveWidget] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const info = await referralApi.getReferralInfo();
            setData(info);
            if (!info.isLocked) {
                const list = await referralApi.getReferralList();
                setPartners(list || []);
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const btcValue = useMemo(() => {
        if (!data?.totalEarnedSats) return "0.00000000";
        return (data.totalEarnedSats / 100000000).toFixed(8);
    }, [data?.totalEarnedSats]);

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
        } catch (e) { toast.error("Ошибка сбора"); } finally { setClaiming(false); }
    };

    const copyLink = () => {
        if (!data?.referralLink) return;
        navigator.clipboard.writeText(data.referralLink);
        toast.success('Ссылка скопирована!');
    };

    const handleShare = async () => {
        if (!data?.referralLink) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Tyrex Currency',
                    text: 'Присоединяйся к моей команде в Tyrex!',
                    url: data.referralLink,
                });
            } catch (err) { console.log('Share failed'); }
        } else {
            copyLink();
            toast('Ссылка скопирована', { icon: 'ℹ️' });
        }
    };

    const openInfo = (key: string) => {
        setActiveWidget(key); 
        setTimeout(() => {
            setModalInfo(REFERRAL_LEGEND[key]);
        }, 450);
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
                    <h1 className="text-xl font-black uppercase italic tracking-tighter mb-2">Pool Locked</h1>
                    <p className="text-[#808080] text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8 text-center">
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
                    {activeTab === 'RESULTS' 
                        ? "Зарабатывайте на рекомендациях! Получайте процент от прибыли каждого приглашенного вами пользователя."
                        : "Управляйте своей сетью и отслеживайте активность каждого партнера в реальном времени."}
                </p>
            </div>

            <div className="p-5 space-y-5">

                {/* --- 2. ВАШ ДОХОД (DASHBOARD) --- */}
                <div 
                    onClick={() => openInfo('REVENUE')}
                    className={clsx(
                        "bg-[#141414] border-2 rounded-[2.5rem] p-7 relative overflow-hidden transition-all duration-300 cursor-pointer",
                        activeWidget === 'REVENUE' 
                            ? "border-[#FFB700] bg-gradient-to-br from-[#FFB700]/10 to-transparent shadow-[0_0_40px_rgba(255,184,0,0.3)] ring-2 ring-[#FFB700]/20 scale-[1.02]" 
                            : "border-[#FFB700]/20 shadow-2xl"
                    )}
                >
                    <div className="absolute top-4 right-6 text-white/20 hover:text-[#FFB700] transition-colors z-20">
                        <HelpCircle size={18} />
                    </div>
                    
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFB700]/5 blur-[60px] rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <span className="text-[13px] font-black uppercase tracking-[0.2em] text-[#808080] mb-3">ВАШ ДОХОД ОТ ПАРТНЕРКИ</span>
                        
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-5xl font-black text-white italic tracking-tighter leading-none">
                                ${currentUsdtValue}
                            </span>
                            <span className="text-sm font-black text-[#FFB700] uppercase">USDT</span>
                        </div>
                        <p className="text-xs font-bold text-[#808080] uppercase tracking-widest mb-6">
                            {btcValue} BTC
                        </p>

                        <button 
                            onClick={(e) => { e.stopPropagation(); handleClaim(); }}
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
                <div 
                    onClick={() => openInfo('LINK')}
                    className={clsx(
                        "bg-[#141414] border-2 rounded-[2rem] p-6 space-y-5 transition-all duration-300 cursor-pointer relative",
                        activeWidget === 'LINK' ? "border-[#FFB700] bg-gradient-to-br from-[#FFB700]/10 to-transparent shadow-[0_0_30px_rgba(255,183,0,0.1)] scale-[1.01]" : "border-[#222222]"
                    )}
                >
                    <div className="absolute top-4 right-6 text-white/20 hover:text-[#FFB700] transition-colors z-20">
                        <HelpCircle size={16} />
                    </div>

                    <p className="text-[11px] text-[#808080] font-medium leading-snug uppercase tracking-wider text-center px-2">
                        Делитесь своей реферальной ссылкой с друзьями и получайте пассивный доход от работы их капитала.
                    </p>
                    
                    <div className="bg-[#080808] border border-[#222222] p-4 rounded-xl text-center shadow-inner">
                        <span className="text-[12px] font-mono text-white/60 truncate block">{data?.referralLink}</span>
                    </div>

                    <div className="flex justify-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); copyLink(); }} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#080808] border border-[#222222] rounded-xl active:border-[#FFB700] transition-all shadow-md group">
                            <Copy size={16} className="text-[#FFB700] group-active:scale-90 transition-transform"/>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Копировать</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#080808] border border-[#222222] rounded-xl active:border-white transition-all shadow-md group">
                            <Share2 size={16} className="text-[#808080] group-active:scale-90 transition-transform"/>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Поделиться</span>
                        </button>
                    </div>
                </div>

                {/* --- TABS --- */}
                <div className="flex p-1 bg-[#141414] border border-[#222222] rounded-2xl shadow-inner mt-2">
                    <button onClick={() => setActiveTab('RESULTS')} className={clsx("flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300", activeTab === 'RESULTS' ? "bg-white text-black shadow-xl scale-[1.02]" : "text-[#808080]")}>РЕЗУЛЬТАТЫ</button>
                    <button onClick={() => setActiveTab('PARTNERS')} className={clsx("flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300", activeTab === 'PARTNERS' ? "bg-white text-black shadow-xl scale-[1.02]" : "text-[#808080]")}>ПАРТНЕРЫ</button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'RESULTS' ? (
                        <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {/* 1. Всего регистраций */}
                                <div 
                                    onClick={() => openInfo('TOTAL_REG')}
                                    className={clsx(
                                        "bg-[#141414] p-5 rounded-[2rem] border-2 flex flex-col justify-between h-40 transition-all cursor-pointer relative",
                                        activeWidget === 'TOTAL_REG' ? "border-[#FFB700] bg-gradient-to-br from-[#FFB700]/10 to-transparent shadow-[0_0_20px_rgba(255,183,0,0.2)] scale-[1.02]" : "border-[#222222]"
                                    )}
                                >
                                    <div className="absolute top-4 right-4 text-white/10 group-active:text-[#FFB700]"><HelpCircle size={14} /></div>
                                    <span className="text-[11px] font-black text-[#808080] uppercase tracking-widest leading-tight">ВСЕГО РЕГИСТРАЦИЙ</span>
                                    <div className="text-4xl font-black text-white italic tracking-tighter leading-none">{data?.stats?.totalInvited} <span className="text-[10px] opacity-30 not-italic ml-1">чел.</span></div>
                                </div>
                                {/* 2. Не инвестировали */}
                                <div 
                                    onClick={() => openInfo('NON_INVEST')}
                                    className={clsx(
                                        "bg-[#141414] p-5 rounded-[2rem] border-2 flex flex-col justify-between h-40 transition-all cursor-pointer relative",
                                        activeWidget === 'NON_INVEST' ? "border-[#FF7000] bg-gradient-to-br from-[#FF7000]/10 to-transparent shadow-[0_0_20px_rgba(255,112,0,0.25)] scale-[1.02]" : "border-[#222222]"
                                    )}
                                >
                                    <div className="absolute top-4 right-4 text-white/10"><HelpCircle size={14} /></div>
                                    <span className="text-[11px] font-black text-[#808080] uppercase tracking-widest leading-tight">ИЗ НИХ НЕ ИНВЕСТИРОВАЛИ</span>
                                    <div className="text-4xl font-black text-[#FF7000] italic tracking-tighter leading-none">{data?.stats?.nonInvestorsCount} <span className="text-[10px] opacity-30 not-italic ml-1">чел.</span></div>
                                </div>
                                {/* 3. Капитал партнеров */}
                                <div 
                                    onClick={() => openInfo('PARTNER_CAPITAL')}
                                    className={clsx(
                                        "bg-[#141414] p-5 rounded-[2rem] border-2 flex flex-col justify-between h-40 transition-all cursor-pointer relative",
                                        activeWidget === 'PARTNER_CAPITAL' ? "border-white bg-gradient-to-br from-white/5 to-transparent shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-[1.02]" : "border-[#222222]"
                                    )}
                                >
                                    <div className="absolute top-4 right-4 text-white/10"><HelpCircle size={14} /></div>
                                    <span className="text-[11px] font-black text-[#808080] uppercase tracking-widest leading-tight">КАПИТАЛ ВАШИХ ПАРТНЕРОВ</span>
                                    <div className="text-2xl font-black text-white italic tracking-tighter leading-none">${data?.stats?.totalPartnerCapital?.toLocaleString()}</div>
                                </div>
                                {/* 4. Капитал не в работе */}
                                <div 
                                    onClick={() => openInfo('IDLE_CAPITAL')}
                                    className={clsx(
                                        "bg-[#141414] p-5 rounded-[2rem] border-2 flex flex-col justify-between h-40 transition-all cursor-pointer relative shadow-[0_0_25px_rgba(255,183,0,0.1)]",
                                        activeWidget === 'IDLE_CAPITAL' ? "border-[#FFB700] bg-gradient-to-br from-[#FFB700]/10 to-transparent shadow-[0_0_35px_rgba(255,183,0,0.3)] ring-2 ring-[#FFB700]/10 scale-[1.02]" : "border-[#FFB700]/30"
                                    )}
                                >
                                    <div className="absolute top-4 right-4 text-white/10"><HelpCircle size={14} /></div>
                                    <span className="text-[11px] font-black text-[#FFB700] uppercase tracking-widest leading-tight">КАПИТАЛ НЕ В РАБОТЕ</span>
                                    <div className="text-2xl font-black text-[#FFB700] italic tracking-tighter leading-none">${data?.stats?.totalIdleCapital?.toLocaleString()}</div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Вкладка ПАРТНЕРЫ залишається без змін */
                        <motion.div key="part" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pb-10">
                             {/* МОДУЛЬНИЙ СПИСОК ПАРТНЕРІВ */}
                             <PartnersSection partners={partners} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- ПОПАП --- */}
            <AnimatePresence>
                {modalInfo && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md" onClick={() => setModalInfo(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#141414] border border-[#222222] p-10 rounded-[3rem] max-w-sm shadow-2xl text-center relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFB700]/5 blur-3xl rounded-full" />
                            <div className="w-16 h-16 bg-[#FFB800]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FFB700]/20">
                                <Info size={32} className="text-[#FFB700]" />
                            </div>
                            <h3 className="text-[#FFB700] font-black uppercase text-xl mb-4 tracking-widest leading-tight">{modalInfo.title}</h3>
                            <p className="text-white font-medium leading-relaxed text-lg italic opacity-90">{modalInfo.full}</p>
                            <button 
                                onClick={() => setModalInfo(null)}
                                className="mt-10 w-full py-5 bg-[#FFB800] text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                            >
                                Понятно
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReferralScreen;