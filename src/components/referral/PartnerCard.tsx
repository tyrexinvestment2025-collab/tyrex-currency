import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, MessageCircle, Calendar, ArrowUpCircle, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useTyrexStore } from '../../store/useTyrexStore';
import PartnerProfitChart from '../charts/PartnerProfitChart';
import MessageScripts from './MessageScripts';
import { fmtBtc, fmtDate, satsToBtc } from '../../lib/format';
import { openLink } from '../../lib/telegram';
import { partnerStatusText, type Partner } from './types';

/** Компактная раскрывающаяся карточка партнёра */
const PartnerCard = ({ partner }: { partner: Partner }) => {
    const { t } = useTranslation('referral');
    const [isExpanded, setIsExpanded] = useState(false);
    const [currency, setCurrency] = useState<'BTC' | 'USDT'>('BTC');
    const btcPrice = useTyrexStore(s => s.btcPrice);

    const st = partnerStatusText(partner, t);
    const tgName = partner.tgUsername?.replace('@', '');

    const toggleCurrency = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrency(prev => prev === 'BTC' ? 'USDT' : 'BTC');
    };

    return (
        <div className={clsx(
            "bg-[#141414] border rounded-[2rem] transition-all duration-300 mb-3 overflow-hidden",
            isExpanded ? "border-[#FFB800]/40 shadow-2xl ring-1 ring-[#FFB800]/10" : "border-[#222222]"
        )}>
            <div onClick={() => setIsExpanded(!isExpanded)} className="p-5 flex items-center justify-between cursor-pointer active:bg-white/[0.02] transition-colors gap-3">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-[#1a1a1a] to-[#080808] border border-white/5 flex items-center justify-center font-black text-[#FFB700] text-xl shadow-inner shrink-0">
                        {(partner.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-white tracking-tight uppercase leading-none mb-2 truncate">
                            {partner.username || t('partners.anonymous')}
                        </p>
                        <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] shrink-0" style={{ backgroundColor: st.color }} />
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none truncate" style={{ color: st.color }}>{st.label}</span>
                        </div>
                    </div>
                </div>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-[#333] shrink-0"><ChevronDown size={24} /></motion.div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-6">
                        <div className="pt-5 border-t border-white/5 space-y-6">
                            <div className="bg-[#FFB800]/5 border border-[#FFB800]/10 p-5 rounded-[1.5rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp size={40}/></div>
                                <p className="text-[12px] text-slate-300 italic leading-relaxed relative z-10">{st.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <DataBox icon={Calendar} label={t('detail.registered')} value={fmtDate(partner.registrationDate)} />
                                <DataBox icon={Clock} label={t('detail.lastReward')} value={partner.lastRewardDate ? fmtDate(partner.lastRewardDate) : t('detail.never')} />
                                <div className="col-span-2">
                                    <DataBox icon={ArrowUpCircle} label={t('detail.commission')} value={fmtBtc(satsToBtc(partner.myProfitFromHimSats ?? 0))} highlight />
                                </div>
                            </div>

                            <div className="bg-[#080808] p-4 rounded-[1.8rem] border border-[#222222] space-y-3 relative overflow-hidden">
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={12} className="text-[#FFB700] opacity-50" />
                                        <span className="text-[9px] font-black text-[#777] uppercase tracking-widest">{t('chart.trend')} ({currency})</span>
                                    </div>
                                    <button onClick={toggleCurrency} className="text-[9px] font-black text-[#FFB700] border border-[#FFB700]/30 px-2 py-0.5 rounded-md uppercase active:bg-[#FFB700] active:text-black transition-all flex items-center gap-1">
                                        <RefreshCw size={8} /> {currency}
                                    </button>
                                </div>
                                <PartnerProfitChart
                                    data={(partner.chartData || []).map((p) => ({
                                        ...p,
                                        val: currency === 'BTC' ? p.val / 100000000 : (p.val / 100000000) * (btcPrice || 0)
                                    }))}
                                    partnerId={partner.id}
                                    currency={currency}
                                />
                            </div>

                            <MessageScripts status={st.status} username={partner.username} />

                            {tgName && (
                                <button
                                    onClick={() => openLink(`https://t.me/${tgName}`)}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-white/5"
                                >
                                    <MessageCircle size={16} /> {t('detail.write')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DataBox = ({ icon: Icon, label, value, highlight = false }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) => (
    <div className="bg-black/20 border border-white/5 p-4 rounded-[1.5rem] flex flex-col items-center text-center">
        <Icon size={14} className={highlight ? "text-[#FFB700] mb-2 scale-110" : "text-slate-600 mb-2"} />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-tight">{label}</span>
        <span className={clsx("text-[12px] font-black tracking-tight break-all", highlight ? "text-[#FFB700]" : "text-white")}>{value}</span>
    </div>
);

export default PartnerCard;
