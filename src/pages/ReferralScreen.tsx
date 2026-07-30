import React, { useEffect, useMemo, useState } from 'react';
import { 
    Lock, RefreshCw, Info, HelpCircle, Users 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { referralApi } from '../api/tyrexApi';
import { useTyrexStore } from '../store/useTyrexStore';
import { useTelegram } from '../hooks/useTelegram';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Імпорт дочірніх компонентів (переконайся, що вони існують)
import StatsCard from '../components/referral/StatsCard';
import ReferralLink from '../components/referral/ReferralLink';
import PartnerDetailView from '../components/referral/PartnerDetailView';

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
    const { tg } = useTelegram();
    const { btcPrice } = useTyrexStore();
    
    const [data, setData] = useState<any>(null);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [activeTab, setActiveTab] = useState<'RESULTS' | 'PARTNERS'>('RESULTS');
    
    const [modalInfo, setModalInfo] = useState<any>(null);
    const [activeWidget, setActiveWidget] = useState<string | null>(null);

    // Стан для повноекранного CRM вікна
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [info, list] = await Promise.all([
                referralApi.getReferralInfo(), 
                referralApi.getReferralList()
            ]);
            setData(info);
            setPartners(list || []);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    };

    const openInfo = (key: string) => {
        setActiveWidget(key); 
        setTimeout(() => setModalInfo(REFERRAL_LEGEND[key]), 450);
    };

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
                toast.success(`Зібрано ${res.claimedAmount} SATS!`, {
                    style: { background: '#121212', color: '#FFB700', border: '1px solid #FFB700' }
                });
                loadData();
            }
        } catch (e) { toast.error("Ошибка сбора"); } finally { setClaiming(false); }
    };

    // ФУНКЦІЯ ШАРИНГУ (Через Telegram Link щоб не закривався додаток)
    const handleShare = () => {
        const link = data?.referralLink;
        if (!link) return;
        const text = "Приєднуйся до моєї команди в Tyrex та отримуй пасивний дохід у BTC!";
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;

        if (tg?.openTelegramLink) {
            tg.openTelegramLink(shareUrl);
        } else {
            navigator.clipboard.writeText(link);
            toast.success("Ссылка скопирована!");
        }
    };

    // РОЗУМНИЙ ПЕРЕХІД (Копіює шаблон автоматично)
    const handleSmartWrite = (partner: any) => {
        // Якщо клієнт не активний — копіюємо шаблон у буфер
        const needsTemplate = partner.statusLabel.includes("АКТИВОВ") || partner.statusLabel.includes("ІНВЕСТ");
        
        if (needsTemplate && partner.messageTemplate) {
            navigator.clipboard.writeText(partner.messageTemplate);
            toast.success("Шаблон скопирован! Вставьте его в чате.", { 
                icon: '📝',
                style: { background: '#121212', color: '#FFB700', border: '1px solid #FFB700' }
            });
        }

        const link = `https://t.me/${partner.tgUsername.replace('@', '')}`;
        if (tg?.openTelegramLink) {
            tg.openTelegramLink(link);
        } else {
            window.open(link, '_blank');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <RefreshCw className="animate-spin text-[#FFB700] w-10 h-10 opacity-50" />
        </div>
    );

    if (data?.isLocked) {
        return (
            <div className="min-h-screen bg-[#080808] text-white p-6 flex flex-col justify-center items-center text-center">
                <div className="bg-[#141414] border border-[#222222] p-10 rounded-[3rem] shadow-2xl flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFB700]/5 blur-[60px] rounded-full" />
                    <Lock className="w-14 h-14 text-[#FFB700] opacity-20 mb-6" />
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-3">Pool Locked</h1>
                    <p className="text-[#808080] text-[12px] font-bold uppercase tracking-widest leading-relaxed mb-10 px-4">
                        Purchase a mining card <br/> to unlock your referral link
                    </p>
                    <button onClick={() => navigate('/marketplace')} className="w-full py-6 bg-[#FFB800] text-black rounded-[1.5rem] font-black uppercase text-xs tracking-widest active:scale-95 shadow-[0_10px_30px_rgba(255,184,0,0.2)] transition-all">
                        Go to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 font-sans relative overflow-x-hidden">
            
            {/* --- CRM ДЕТАЛІ ПАРТНЕРА (ПЕРЕКРИВАЄ BOTTOM NAV) --- */}
            <AnimatePresence>
                {selectedPartner && (
                    <PartnerDetailView 
                        partner={selectedPartner} 
                        onClose={() => setSelectedPartner(null)} 
                        onWrite={() => handleSmartWrite(selectedPartner)} 
                    />
                )}
            </AnimatePresence>

            {/* --- HEADER --- */}
            <div className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-2xl border-b border-white/5 px-6 py-6">
                <h1 className="text-[26px] font-black uppercase tracking-tighter leading-none italic"
                    style={{ background: 'linear-gradient(to bottom, #FFD700, #B8860B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ПАРТНЕРСКАЯ ПРОГРАММА
                </h1>
                <p className="text-[9px] text-[#555] font-black uppercase mt-1.5 tracking-[0.3em]">Network Control Panel v.2.0</p>
            </div>

            <div className="p-5 space-y-6">
                
                {/* 1. БЛОК ДОХОДА (МАКСИМАЛЬНАЯ МАССА) */}
                <div 
                    onClick={() => openInfo('REVENUE')} 
                    className={clsx(
                        "bg-[#111112] border-2 rounded-[2.8rem] p-8 relative overflow-hidden transition-all duration-500 cursor-pointer group shadow-2xl", 
                        activeWidget === 'REVENUE' 
                            ? "border-[#FFB700] bg-[#FFB700]/5 scale-[1.02] shadow-[0_0_50px_rgba(255,183,0,0.2)]" 
                            : "border-white/5"
                    )}
                >
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FFB700]/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#FFB700]/10 transition-colors" />
                    <HelpCircle size={20} className="absolute top-6 right-8 text-white/10 group-hover:text-[#FFB700] transition-colors" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#555] mb-5">ВАШ ДОХОД ОТ ПАРТНЕРКИ</span>
                        <div className="flex items-baseline gap-3 mb-8">
                            <span className="text-6xl font-black text-white italic tracking-tighter leading-none">${currentUsdtValue}</span>
                            <span className="text-lg font-black text-[#FFB700] uppercase">USDT</span>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleClaim(); }} 
                            disabled={claiming || (data?.totalEarnedSats || 0) <= 0} 
                            className={clsx(
                                "w-full py-6 rounded-[1.8rem] font-black uppercase text-sm tracking-[0.2em] transition-all relative overflow-hidden", 
                                (data?.totalEarnedSats || 0) > 0 
                                    ? "bg-[#FFB700] text-black shadow-[0_15px_35px_rgba(255,183,0,0.3)] active:scale-95" 
                                    : "bg-[#181818] text-[#333] border border-white/5"
                            )}
                        >
                            {claiming ? <RefreshCw className="animate-spin mx-auto w-6 h-6" /> : "ЗАБРАТИ НАГРАДУ"}
                        </button>
                    </div>
                </div>

                {/* 2. БЛОК ССЫЛКИ */}
                <ReferralLink 
                    link={data?.referralLink} 
                    onCopy={() => { navigator.clipboard.writeText(data?.referralLink); toast.success('Copied!'); }} 
                    onShare={handleShare} 
                    onInfo={() => openInfo('LINK')} 
                />

                {/* 3. ТАБЫ */}
                <div className="flex p-1.5 bg-[#111112] border border-white/5 rounded-[1.5rem] shadow-inner mt-2">
                    <button onClick={() => setActiveTab('RESULTS')} className={clsx("flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500", activeTab === 'RESULTS' ? "bg-white text-black shadow-2xl scale-[1.02]" : "text-[#555]")}>РЕЗУЛЬТАТЫ</button>
                    <button onClick={() => setActiveTab('PARTNERS')} className={clsx("flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500", activeTab === 'PARTNERS' ? "bg-white text-black shadow-2xl scale-[1.02]" : "text-[#555]")}>ПАРТНЕРЫ</button>
                </div>

                {/* 4. КОНТЕНТ */}
                <AnimatePresence mode="wait">
                    {activeTab === 'RESULTS' ? (
                        <motion.div key="res" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
                            <StatsCard label="ВСЕГО РЕГИСТРАЦИЙ" value={data?.stats?.totalInvited} sub="чел." id="TOTAL_REG" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label="НЕ ИНВЕСТИРОВАЛИ" value={data?.stats?.nonInvestorsCount} sub="чел." orange id="NON_INVEST" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label="КАПИТАЛ ПАРТНЕРОВ" value={`$${data?.stats?.totalPartnerCapital?.toLocaleString()}`} white id="PARTNER_CAPITAL" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label="КАПИТАЛ НЕ В РАБОТЕ" value={`$${data?.stats?.totalIdleCapital?.toLocaleString()}`} gold id="IDLE_CAPITAL" activeId={activeWidget} onOpen={openInfo} />
                        </motion.div>
                    ) : (
                        <motion.div key="part" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-10">
                             <div className="flex items-center justify-between px-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <Users size={16} className="text-[#FFB700] opacity-30" />
                                    <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">ВАША СЕТЬ</span>
                                </div>
                                <span className="text-[10px] font-bold text-white/10 uppercase bg-white/5 px-3 py-1 rounded-full">{partners.length} PARTNERS</span>
                             </div>

                             {partners.length === 0 ? (
                                 <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-[#111112]/50">
                                    <p className="text-[10px] font-black uppercase text-[#222] tracking-[0.4em]">Database Empty</p>
                                 </div>
                             ) : (
                                 partners.map(p => (
                                     <div 
                                        key={p.id} 
                                        onClick={() => setSelectedPartner(p)} 
                                        className="bg-[#111112] border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between active:scale-[0.97] transition-all cursor-pointer shadow-xl hover:border-[#FFB700]/30 group relative overflow-hidden"
                                     >
                                         <div className="absolute inset-y-0 left-0 w-1 bg-[#FFB700] opacity-0 group-hover:opacity-100 transition-opacity" />
                                         <div className="flex items-center gap-5">
                                             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1a1c] to-[#050505] border border-white/10 flex items-center justify-center font-black text-[#FFB700] text-2xl shadow-inner group-hover:scale-105 transition-transform">
                                                 {(p.username || '?')[0].toUpperCase()}
                                             </div>
                                             <div>
                                                 <p className="text-[15px] font-black uppercase tracking-tight text-white group-hover:text-[#FFB700] transition-colors">{p.username || 'Anonymous'}</p>
                                                 <div className="flex items-center gap-2 mt-1.5">
                                                     <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse" style={{ backgroundColor: p.statusColor }} />
                                                     <span className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: p.statusColor }}>{p.statusLabel}</span>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-lg font-black text-white italic tracking-tighter leading-none">${p.idleBalance}</p>
                                             <p className="text-[8px] font-black text-[#555] uppercase tracking-widest mt-1.5 leading-none">Wallet</p>
                                         </div>
                                     </div>
                                 ))
                             )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- LEGEND MODAL (PREMIUM HUD) --- */}
            <AnimatePresence>
                {modalInfo && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md" onClick={() => setModalInfo(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0D0D0E] border border-white/10 p-10 rounded-[3.5rem] max-w-sm text-center shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFB700]/5 blur-[60px] rounded-full" />
                            <div className="w-20 h-20 bg-[#FFB800]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-[#FFB700]/20 shadow-inner">
                                <Info size={40} className="text-[#FFB700]" />
                            </div>
                            <h3 className="text-[#FFB700] font-black uppercase text-2xl mb-5 tracking-widest leading-none italic">{modalInfo.title}</h3>
                            <p className="text-slate-300 font-medium leading-relaxed italic opacity-90 text-lg px-2">{modalInfo.full}</p>
                            <button 
                                onClick={() => setModalInfo(null)} 
                                className="mt-12 w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-all shadow-xl"
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