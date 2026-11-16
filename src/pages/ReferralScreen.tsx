import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, RefreshCw, Info, HelpCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { referralApi } from '../api/tyrexApi';
import { useTyrexStore } from '../store/useTyrexStore';
import { useTelegram } from '../hooks/useTelegram';
import { errorText } from '../lib/i18nHelpers';
import { fmtBtc, fmtUsd, fmtInt, btcToUsd, satsToBtc } from '../lib/format';
import { showAlert, copyText, openLink, haptic } from '../lib/telegram';

import StatsCard from '../components/referral/StatsCard';
import ReferralLink from '../components/referral/ReferralLink';
import PartnerDetailView from '../components/referral/PartnerDetailView';
import { normalizeStatus, partnerStatusText, type Partner, type ReferralInfo } from '../components/referral/types';

type LegendKey = 'REVENUE' | 'LINK' | 'TOTAL_REG' | 'INVESTORS' | 'NON_INVEST' | 'PARTNER_CAPITAL';
const FILTERS = ['ALL', 'NOT_ACTIVATED', 'WAITING', 'INVEST', 'GROW', 'WORKING'] as const;
type Filter = typeof FILTERS[number];

const ReferralScreen: React.FC = () => {
    const { t } = useTranslation('referral');
    const { refreshAllData } = useTelegram();
    const btcPrice = useTyrexStore(s => s.btcPrice);

    const [data, setData] = useState<ReferralInfo | null>(null);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [activeTab, setActiveTab] = useState<'RESULTS' | 'PARTNERS'>('RESULTS');
    const [modalKey, setModalKey] = useState<LegendKey | null>(null);
    const [activeWidget, setActiveWidget] = useState<string | null>(null);
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<Filter>('ALL');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError(null);
            const [info, list] = await Promise.all([
                referralApi.getReferralInfo() as Promise<ReferralInfo>,
                referralApi.getReferralList() as Promise<Partner[]>
            ]);
            setData(info);
            setPartners(Array.isArray(list) ? list : []);
        } catch (error) {
            setLoadError(errorText(error));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredPartners = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return partners.filter(p => {
            const matchesSearch = !query || (p.username || '').toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'ALL' || normalizeStatus(p.status) === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [partners, searchQuery, statusFilter]);

    const openInfo = (key: string) => {
        setActiveWidget(key);
        setTimeout(() => setModalKey(key as LegendKey), 300);
    };
    const closeInfo = () => { setModalKey(null); setActiveWidget(null); };

    const earnedSats = data?.totalEarnedSats || 0;
    const earnedBtc = satsToBtc(earnedSats);
    const earnedUsd = btcToUsd(earnedBtc, btcPrice);

    const apyMin = data?.referralApyMin ?? 0;
    const apyMax = data?.referralApyMax ?? 0;
    const apyText = apyMax > 0
        ? (apyMin === apyMax ? t('revenue.apySingle', { value: apyMax }) : t('revenue.apyRange', { min: apyMin, max: apyMax }))
        : null;

    const handleClaim = async () => {
        if (claiming || earnedSats <= 0) return;
        setClaiming(true);
        try {
            const res = await referralApi.claimRewards() as { success?: boolean; claimedAmount?: number };
            if (res?.success) {
                haptic.success();
                await showAlert(t('revenue.claimed', { sats: fmtInt(res.claimedAmount || 0) }));
                await Promise.all([loadData(), refreshAllData()]);
            }
        } catch (e) {
            haptic.error();
            await showAlert(errorText(e));
        } finally {
            setClaiming(false);
        }
    };

    const handleCopyLink = async () => {
        if (!data?.referralLink) return false;
        const ok = await copyText(data.referralLink);
        if (ok) haptic.success();
        return ok;
    };

    const handleShare = () => {
        if (!data?.referralLink) return;
        openLink(`https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent(t('link.shareText'))}`);
    };

    const handleSmartWrite = async (partner: Partner, message?: string) => {
        if (message) await copyText(message);
        const tgName = partner.tgUsername?.replace('@', '');
        if (!tgName) {
            await showAlert(t('detail.noUsername'));
            return;
        }
        openLink(`https://t.me/${tgName}`);
    };

    if (loading && !data) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <RefreshCw className="animate-spin text-[#FFB700] w-12 h-12 opacity-40" />
        </div>
    );

    if (loadError && !data) return (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="text-sm text-white/60">{loadError}</p>
            <button onClick={loadData} className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl text-xs font-bold uppercase text-white active:scale-95">
                <RefreshCw className="w-4 h-4" /> {t('common:actions.retry')}
            </button>
        </div>
    );

    if (data?.isLocked) return (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-5 px-8 text-center pb-32">
            <div className="w-20 h-20 rounded-[2rem] bg-[#FFB700]/10 border border-[#FFB700]/30 flex items-center justify-center">
                <Lock size={36} className="text-[#FFB700]" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">{t('locked.title')}</h1>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">{t('locked.text')}</p>
        </div>
    );

    const legend = modalKey ? { title: t(`legend.${modalKey}.title`), full: t(`legend.${modalKey}.full`) } : null;

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 font-sans relative overflow-x-hidden">

            <AnimatePresence>
                {selectedPartner && (
                    <PartnerDetailView
                        partner={selectedPartner}
                        onClose={() => setSelectedPartner(null)}
                        onWrite={(msg) => handleSmartWrite(selectedPartner, msg)}
                    />
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-2xl border-b border-white/5 px-5 py-7 flex flex-col gap-1">
                <h1 className="text-[28px] font-black uppercase tracking-tighter italic leading-none break-words"
                    style={{ background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {t('header.title')}
                </h1>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 leading-none opacity-60 italic">
                    {activeTab === 'RESULTS' ? t('header.subtitleResults') : t('header.subtitlePartners')}
                </p>
            </div>

            <div className="p-5 space-y-8">
                {activeTab === 'RESULTS' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div onClick={() => openInfo('REVENUE')}
                             className={clsx(
                                "bg-[#111112] border-2 rounded-[3rem] p-8 relative overflow-hidden transition-all duration-500 cursor-pointer group shadow-2xl shadow-black",
                                activeWidget === 'REVENUE' ? "border-[#FFB700] bg-[#FFB700]/5 scale-[1.02]" : "border-white/5"
                             )}>
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FFB700]/5 blur-[80px] rounded-full pointer-events-none" />
                            <HelpCircle size={22} className="absolute top-7 right-8 text-white/10 group-hover:text-[#FFB700] transition-colors z-20" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-6">{t('revenue.title')}</span>
                                <span className="text-5xl font-black text-white italic tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] break-all">
                                    {fmtUsd(earnedUsd)}
                                </span>
                                <span className="text-sm font-black text-[#FFB700] mt-3 opacity-70">
                                    {fmtBtc(earnedBtc)} · {fmtInt(earnedSats)} sats
                                </span>
                                {apyText && <span className="text-[11px] text-white/40 font-bold mt-4 leading-snug">{apyText}</span>}

                                <button onClick={(e) => { e.stopPropagation(); handleClaim(); }} disabled={claiming || earnedSats <= 0}
                                        className="w-full mt-8 py-6 bg-[#FFB700] text-black rounded-full font-black uppercase text-sm tracking-[0.2em] active:scale-95 shadow-[0_20px_50px_rgba(255,183,0,0.3)] transition-all disabled:opacity-40 disabled:shadow-none">
                                    {claiming ? <RefreshCw className="animate-spin w-6 h-6 mx-auto" /> : t('revenue.claim')}
                                </button>
                                {earnedSats <= 0 && <span className="text-[11px] text-white/30 mt-4">{t('revenue.nothing')}</span>}
                            </div>
                        </div>

                        <ReferralLink link={data?.referralLink} onCopy={handleCopyLink} onShare={handleShare} onInfo={() => openInfo('LINK')} />
                    </div>
                )}

                <div className="flex p-2 bg-[#111112] border border-white/10 rounded-[1.8rem] shadow-inner mt-2">
                    {(['RESULTS', 'PARTNERS'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={clsx("flex-1 py-4 rounded-[1.2rem] text-[12px] font-black uppercase transition-all duration-500", activeTab === tab ? "bg-white text-black shadow-2xl scale-[1.03]" : "text-slate-500")}>
                            {tab === 'RESULTS' ? t('tabs.results') : `${t('tabs.partners')} · ${partners.length}`}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'RESULTS' ? (
                        <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                            <StatsCard label={t('stats.totalReg')} value={data?.stats?.totalInvited ?? 0} sub={t('stats.people')} id="TOTAL_REG" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label={t('stats.investors')} value={data?.stats?.investorsCount ?? 0} sub={t('stats.people')} gold id="INVESTORS" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label={t('stats.nonInvest')} value={data?.stats?.nonInvestorsCount ?? 0} sub={t('stats.people')} orange id="NON_INVEST" activeId={activeWidget} onOpen={openInfo} />
                            <StatsCard label={t('stats.partnerCapital')} value={fmtUsd(data?.stats?.totalPartnerCapital ?? 0)} id="PARTNER_CAPITAL" activeId={activeWidget} onOpen={openInfo} />
                        </motion.div>
                    ) : (
                        <motion.div key="part" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">
                             <div className="space-y-4 px-1">
                                 <div className="relative group">
                                     <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFB700] transition-colors" />
                                     <input type="text" placeholder={t('partners.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-[#111112] border border-white/5 rounded-full py-5 pl-14 pr-6 text-[15px] font-black text-white outline-none focus:border-[#FFB700]/30 transition-all shadow-inner" />
                                 </div>
                                 <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
                                     {FILTERS.map(st => (
                                         <button key={st} onClick={() => setStatusFilter(st)}
                                                className={clsx("px-5 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-300 shadow-xl",
                                                statusFilter === st ? "bg-[#FFB700] text-black border-[#FFB700]" : "bg-white/5 text-slate-500 border-white/10")}>
                                             {t(`filters.${st}`)}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                             {filteredPartners.length === 0 && (
                                 <div className="py-16 text-center bg-[#111112] rounded-[2.5rem] border border-white/5 border-dashed">
                                     <p className="text-[11px] font-black uppercase text-white/30 tracking-widest">
                                         {partners.length === 0 ? t('partners.empty') : t('partners.notFound')}
                                     </p>
                                 </div>
                             )}

                             {filteredPartners.map(p => {
                                 const st = partnerStatusText(p, t);
                                 return (
                                 <div key={p.id} onClick={() => setSelectedPartner(p)}
                                      className="bg-[#111112] border border-white/10 p-5 rounded-[2.8rem] flex items-center justify-between gap-3 active:scale-[0.97] transition-all cursor-pointer shadow-[0_15px_40px_rgba(0,0,0,0.4)] group">
                                     <div className="flex items-center gap-4 min-w-0">
                                         <div className="w-14 h-14 rounded-[1.4rem] bg-gradient-to-br from-[#1a1a1c] to-[#050505] border border-white/10 flex items-center justify-center font-black text-[#FFB700] text-2xl shadow-inner overflow-hidden shrink-0">
                                             {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" alt="" /> : (p.username || '?')[0].toUpperCase()}
                                         </div>
                                         <div className="min-w-0">
                                             <p className="text-[16px] font-black uppercase tracking-tight text-white group-hover:text-[#FFB700] transition-colors truncate">{p.username || t('partners.anonymous')}</p>
                                             <div className="flex items-center gap-2 mt-2">
                                                 <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] shrink-0" style={{ backgroundColor: st.color }} />
                                                 <span className="text-[11px] font-black uppercase tracking-widest leading-none italic truncate" style={{ color: st.color }}>{st.label}</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="text-right shrink-0">
                                         <p className="text-[13px] font-black text-[#FFB700] italic tracking-tight leading-none">{fmtBtc(satsToBtc(p.myProfitFromHimSats ?? 0))}</p>
                                         <p className="text-[9px] font-black text-[#555] uppercase tracking-widest mt-2 leading-none">{t('partners.myCommission')}</p>
                                     </div>
                                 </div>
                                 );
                             })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Попап легенди */}
            <AnimatePresence>
                {legend && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-5 bg-black/95 backdrop-blur-2xl cursor-pointer" onClick={closeInfo}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-[#0D0D0E] border-2 border-[#FFB700] p-8 rounded-[3rem] max-w-sm w-full text-center shadow-[0_0_80px_rgba(255,183,0,0.4)] relative overflow-hidden max-h-[85vh] overflow-y-auto"
                                    onClick={(e) => e.stopPropagation()}>
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FFB700]/10 blur-3xl rounded-full pointer-events-none" />
                            <div className="w-20 h-20 bg-[#FFB700]/20 rounded-[2rem] flex items-center justify-center mx-auto mb-7 border border-[#FFB700]/30 shadow-inner">
                                <Info size={44} className="text-[#FFB700]" />
                            </div>
                            <h3 className="text-[#FFB700] font-black uppercase text-xl mb-6 tracking-[0.15em] italic leading-tight">{legend.title}</h3>
                            <p className="text-white font-bold leading-relaxed text-[16px] px-1 text-left">{legend.full}</p>
                            <button onClick={closeInfo} className="mt-8 text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">{t('legend.close')}</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReferralScreen;
