import React, { useEffect, useMemo, useState } from 'react';
import { 
    Lock, RefreshCw, Info, HelpCircle, 
    Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { referralApi } from '../api/tyrexApi';
import { useTyrexStore } from '../store/useTyrexStore';
import { useTelegram } from '../hooks/useTelegram';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Імпорт дочірніх компонентів
import StatsCard from '../components/referral/StatsCard';
import ReferralLink from '../components/referral/ReferralLink';
import PartnerDetailView from '../components/referral/PartnerDetailView';

// Тексти Легенди згідно з ТЗ
const REFERRAL_LEGEND: any = {
    'REVENUE': { 
        title: 'ВАШ ДОХОД ОТ ПАРТНЕРКИ', 
        full: 'Вы получаете прямые комиссионные от капитала, работающего в вашем партнерском пуле. Делитесь персональной ссылкой и помогайте новым пользователям запускать их первые Доходные токены.' 
    },
    'LINK': { 
        title: 'ВАША РЕФЕРАЛЬНАЯ ССЫЛКА', 
        full: 'Ваша персональная ссылка автоматически связывает всех перешедших по ней участников с вашим профилем. Используйте ее при общении и публикации материалов, помогая партнерам быстро запустить капитал в работу.' 
    },
    'TOTAL_REG': { 
        title: 'ВСЕГО РЕГИСТРАЦИЙ', 
        full: 'Общее количество пользователей, которые зарегистрировались по вашей ссылке. Помогайте этим пользователям быстрее разобраться в платформе и запустить капитал в работу.' 
    },
    'NON_INVEST': { 
        title: 'НЕ ИНВЕСТИРОВАЛИ', 
        full: 'Число зарегистрированных по вашей ссылке пользователей, у которых еще нет работающего капитала. Расскажите им о преимуществах платформы, чтобы перевести их в статус действующих партнеров.' 
    },
    'PARTNER_CAPITAL': { 
        title: 'КАПИТАЛ ПАРТНЕРОВ', 
        full: 'Совокупный объем средств, размещенный участниками вашего партнерского пула в Доходных токенах. Именно от этой суммы рассчитываются и начисляются ваши регулярные комиссионные.' 
    },
    'IDLE_CAPITAL': { 
        title: 'ДЕНЬГИ НЕ В РАБОТЕ', 
        full: 'Средства ваших партнеров, которые хранятся на балансе без начисления процента. Мотивируйте команду реинвестировать прибыль и запускать новые токены, чтобы эти деньги начали приносить комиссионные.' 
    }
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

    // Стан для детального CRM-вікна партнера
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

    // Стан для пошуку та фільтрації
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

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

    // Фільтрація списку партнерів
    const filteredPartners = useMemo(() => {
        return partners.filter(p => {
            const nick = p.username?.toLowerCase() || '';
            const query = searchQuery.toLowerCase();
            const matchesSearch = nick.includes(query);
            
            const matchesStatus = statusFilter === 'ALL' || 
                                p.statusLabel?.toUpperCase().includes(statusFilter);
                                
            return matchesSearch && matchesStatus;
        });
    }, [partners, searchQuery, statusFilter]);

    const openInfo = (key: string) => {
        setActiveWidget(key); 
        setTimeout(() => setModalInfo(REFERRAL_LEGEND[key]), 300);
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

    // Розумний перехід в ТГ з авто-копіюванням шаблону
    const handleSmartWrite = (partner: any) => {
        const needsNudge = partner.statusLabel.includes("АКТИВОВ") || partner.statusLabel.includes("ІНВЕСТ");
        if (needsNudge && partner.messageTemplate) {
            navigator.clipboard.writeText(partner.messageTemplate);
            toast.success("Текст шаблона скопирован!", { 
                icon: '📝',
                style: { background: '#121212', color: '#FFB700', border: '1px solid #FFB700' }
            });
        }
        const link = `https://t.me/${partner.tgUsername.replace('@', '')}`;
        if (tg?.openTelegramLink) tg.openTelegramLink(link);
        else window.open(link, '_blank');
    };

    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <RefreshCw className="animate-spin text-[#FFB700] w-12 h-12 opacity-40" />
        </div>
    );

    if (data?.isLocked) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 text-center">
                <div className="bg-[#141414] border border-[#222222] p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFB700]/5 blur-[60px] rounded-full" />
                    <Lock className="w-16 h-16 text-[#FFB700] opacity-20 mb-8" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Pool Locked</h2>
                    <p className="text-[#808080] text-[12px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-12">Purchase a mining node <br/> to unlock network</p>
                    <button onClick={() => navigate('/marketplace')} className="w-full py-6 bg-[#FFB800] text-black rounded-[1.8rem] font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl">Go to Marketplace</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 font-sans relative overflow-x-hidden">
            
            {/* --- CRM ДЕТАЛІ ПАРТНЕРА (ПЕРЕКРИВАЄ ВСЕ) --- */}
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
            <div className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-2xl border-b border-white/5 px-6 py-8">
                <h1 className="text-[30px] font-black uppercase tracking-tighter italic leading-none" 
                    style={{ background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ПАРТНЕРСКАЯ ПРОГРАММА
                </h1>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-[0.4em]">Network Terminal v.3.1</p>
            </div>

            <div className="p-5 space-y-7">
                
                {activeTab === 'RESULTS' && (
                    <div className="space-y-7 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Головна картка доходу */}
                        <div onClick={() => openInfo('REVENUE')} 
                             className={clsx(
                                "bg-[#111112] border-2 rounded-[3.2rem] p-10 relative overflow-hidden transition-all duration-500 cursor-pointer group shadow-2xl", 
                                activeWidget === 'REVENUE' ? "border-[#FFB700] bg-[#FFB700]/5 scale-[1.02]" : "border-white/10"
                             )}>
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FFB700]/5 blur-[80px] rounded-full pointer-events-none" />
                            <HelpCircle size={22} className="absolute top-8 right-10 text-white/30 group-hover:text-[#FFB700] transition-colors z-20" />
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-7">ВАШ ДОХОД ОТ ПАРТНЕРКИ</span>
                                <div className="flex items-baseline gap-3 mb-10">
                                    <span className="text-6xl font-black text-white italic tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">${currentUsdtValue}</span>
                                    <span className="text-xl font-black text-[#FFB700] uppercase drop-shadow-[0_0_10px_rgba(255,183,0,0.3)]">USDT</span>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleClaim(); }} 
                                    disabled={claiming || (data?.totalEarnedSats || 0) <= 0} 
                                    className={clsx(
                                        "w-full py-7 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] transition-all relative overflow-hidden shadow-2xl", 
                                        (data?.totalEarnedSats || 0) > 0 ? "bg-[#FFB700] text-black active:scale-95 shadow-amber-500/20" : "bg-[#181818] text-slate-600 border border-white/5"
                                    )}
                                >
                                    {claiming ? <RefreshCw className="animate-spin mx-auto w-7 h-7" /> : "ЗАБРАТЬ НАГРАДУ"}
                                </button>
                            </div>
                        </div>

                        <ReferralLink 
                            link={data?.referralLink} 
                            onCopy={() => { navigator.clipboard.writeText(data?.referralLink); toast.success('Copied!'); }} 
                            onShare={() => tg?.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(data?.referralLink)}`)} 
                            onInfo={() => openInfo('LINK')} 
                        />
                    </div>
                )}

                {/* Таб-перемикач */}
                <div className="flex p-2 bg-[#111112] border border-white/10 rounded-[1.8rem] shadow-inner mt-2">
                    <button onClick={() => setActiveTab('RESULTS')} className={clsx("flex-1 py-4.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500", activeTab === 'RESULTS' ? "bg-white text-black shadow-2xl scale-[1.02]" : "text-slate-500")}>РЕЗУЛЬТАТЫ</button>
                    <button onClick={() => setActiveTab('PARTNERS')} className={clsx("flex-1 py-4.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500", activeTab === 'PARTNERS' ? "bg-white text-black shadow-2xl scale-[1.02]" : "text-slate-500")}>ПАРТНЕРЫ</button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'RESULTS' ? (
                        /* ВКЛАДКА СТАТИСТИКИ */
                        <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                            <StatsCard label="ВСЕГО РЕГИСТРАЦИЙ" value={data?.stats?.totalInvited} sub="чел." id="TOTAL_REG" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label="НЕ ИНВЕСТИРОВАЛИ" value={data?.stats?.nonInvestorsCount} sub="чел." orange id="NON_INVEST" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label="КАПИТАЛ ПАРТНЕРОВ" value={`$${data?.stats?.totalPartnerCapital?.toLocaleString()}`} white id="PARTNER_CAPITAL" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label="ДЕНЬГИ НЕ В РАБОТЕ" value={`$${data?.stats?.totalIdleCapital?.toLocaleString()}`} gold id="IDLE_CAPITAL" activeId={activeWidget} onOpen={openInfo} />
                        </motion.div>
                    ) : (
                        /* ВКЛАДКА ПАРТНЕРІВ З ПОШУКОМ ТА ФІЛЬТРАМИ */
                        <motion.div key="part" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">
                             <div className="space-y-4 px-1">
                                 {/* Пошуковий інпут */}
                                 <div className="relative group">
                                     <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFB700] transition-colors" />
                                     <input 
                                        type="text" 
                                        placeholder="Имя, ник или ID..." 
                                        value={searchQuery} 
                                        onChange={(e) => setSearchQuery(e.target.value)} 
                                        className="w-full bg-[#111112] border border-white/5 rounded-[1.8rem] py-5 pl-14 pr-6 text-xs font-black text-white outline-none focus:border-[#FFB700]/30 transition-all shadow-inner" 
                                     />
                                 </div>
                                 {/* Кнопки статус-фільтрів */}
                                 <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                                     {['ALL', 'НЕ АКТИВОВ', 'ДОХІД', 'ІНВЕСТ', 'ГРОШІ', 'ЗРОСТАТИ'].map(st => (
                                         <button 
                                            key={st} 
                                            onClick={() => setStatusFilter(st)} 
                                            className={clsx(
                                                "px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase whitespace-nowrap border transition-all duration-300", 
                                                statusFilter === st ? "bg-[#FFB700] text-black border-[#FFB700] shadow-lg shadow-amber-500/10" : "bg-white/5 text-slate-400 border-white/10"
                                            )}
                                         >
                                            {st}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                             {filteredPartners.length === 0 ? (
                                 <div className="py-28 text-center border-2 border-dashed border-white/10 rounded-[3.5rem] bg-[#111112]/50">
                                    <p className="text-[11px] font-black uppercase text-slate-700 tracking-[0.5em] italic">No entities found</p>
                                 </div>
                             ) : (
                                 filteredPartners.map(p => (
                                     <div 
                                        key={p.id} 
                                        onClick={() => setSelectedPartner(p)} 
                                        className="bg-[#111112] border border-white/10 p-6 rounded-[2.8rem] flex items-center justify-between active:scale-[0.97] transition-all cursor-pointer shadow-xl hover:border-[#FFB700]/40 group"
                                     >
                                         <div className="flex items-center gap-5">
                                             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1a1c] to-[#050505] border border-white/10 flex items-center justify-center font-black text-[#FFB700] text-2xl shadow-inner group-hover:scale-105 transition-transform">
                                                 {(p.username || '?')[0].toUpperCase()}
                                             </div>
                                             <div>
                                                 <p className="text-[15px] font-black uppercase tracking-tight text-white group-hover:text-[#FFB700] transition-colors">{p.username || 'Anonymous'}</p>
                                                 <div className="flex items-center gap-2 mt-2">
                                                     <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse" style={{ backgroundColor: p.statusColor }} />
                                                     <span className="text-[10px] font-black uppercase tracking-widest leading-none italic" style={{ color: p.statusColor }}>{p.statusLabel}</span>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-[19px] font-black text-white italic tracking-tighter leading-none">${p.idleBalance}</p>
                                             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2 leading-none">Wallet</p>
                                         </div>
                                     </div>
                                 ))
                             )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ЗОЛОТИЙ ПОПАП (ЛЕГЕНДА) */}
            <AnimatePresence>
                {modalInfo && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md" onClick={() => setModalInfo(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-[#0D0D0E] border-2 border-[#FFB700] p-11 rounded-[3.8rem] max-w-sm text-center shadow-[0_0_80px_rgba(255,183,0,0.35)] relative overflow-hidden" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FFB700]/10 blur-3xl rounded-full" />
                            <div className="w-20 h-20 bg-[#FFB700]/15 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-[#FFB700]/30 shadow-inner">
                                <Info size={40} className="text-[#FFB700]" />
                            </div>
                            <h3 className="text-[#FFB700] font-black uppercase text-xl mb-6 tracking-[0.25em] italic leading-tight drop-shadow-md">{modalInfo.title}</h3>
                            <p className="text-white font-bold leading-relaxed italic opacity-100 text-[15px] px-2">{modalInfo.full}</p>
                            <p className="mt-12 text-[9px] font-black text-slate-600 uppercase tracking-[0.6em] animate-pulse">Touch anywhere to close</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReferralScreen;