import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, MessageCircle, Calendar, Clock,
    TrendingUp, ArrowUpCircle, Database, Zap, Gift,
    MessageSquareQuote
} from 'lucide-react';
import clsx from 'clsx';
import PartnerProfitChart from '../charts/PartnerProfitChart';
import MessageScripts from './MessageScripts';
import { fmtBtc, fmtDate, satsToBtc } from '../../lib/format';
import { partnerStatusText, type Partner } from './types';

interface DetailProps {
    partner: Partner;
    onClose: () => void;
    onWrite: (message?: string) => void;
}

const DetailInfoBox = ({ icon: Icon, label, value, highlight }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) => (
    <div className="bg-[#111112] p-5 rounded-[2.2rem] border border-white/10 flex flex-col items-center text-center shadow-inner min-w-0">
        <Icon size={24} className={clsx("mb-3", highlight ? "text-[#FFB700] drop-shadow-[0_0_12px_rgba(255,183,0,0.5)]" : "text-slate-400")} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 leading-tight">{label}</span>
        <span className={clsx("text-lg font-black tracking-tight leading-none break-all", highlight ? "text-[#FFB700] italic" : "text-white")}>
            {value}
        </span>
    </div>
);

const PartnerDetailView: React.FC<DetailProps> = ({ partner, onClose, onWrite }) => {
    const { t } = useTranslation('referral');
    const [scriptText, setScriptText] = useState('');
    const handleTextChange = useCallback((text: string) => setScriptText(text), []);

    const st = partnerStatusText(partner, t);
    const name = partner.username || t('partners.anonymous');
    const commissionBtc = satsToBtc(partner.myProfitFromHimSats ?? 0);
    const nodes = partner.inventory?.staked || [];

    return (
        <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-[#080808] flex flex-col overflow-y-auto overflow-x-hidden pt-safe"
        >
            {/* HEADER */}
            <div className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5 px-5 py-6 flex items-center gap-5 shadow-2xl">
                <button onClick={onClose} aria-label={t('common:actions.back')} className="p-3.5 bg-white/5 rounded-full text-white active:scale-90 border border-white/10 shadow-lg shrink-0">
                    <ArrowLeft size={24} />
                </button>
                <div className="min-w-0">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-white truncate">{name}</h2>
                    <div className="flex items-center gap-2 mt-2.5">
                        <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_12px_currentColor] shrink-0" style={{ backgroundColor: st.color }} />
                        <span className="text-[12px] font-black uppercase tracking-widest leading-none truncate" style={{ color: st.color }}>{st.label}</span>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-8 pb-40">
                {/* 1. ПОЯСНЕННЯ СТАТУСУ */}
                <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 p-7 rounded-[2.8rem] relative overflow-hidden shadow-2xl">
                    <TrendingUp className="absolute top-2 right-2 opacity-[0.03] text-white" size={100} />
                    <p className="text-[16px] text-white italic leading-relaxed relative z-10 font-bold tracking-tight">
                        {st.description}
                    </p>
                </div>

                {/* 2. ГОТОВІ ПОВІДОМЛЕННЯ */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <MessageSquareQuote size={20} className="text-[#FFB700]" />
                        <span className="text-[12px] font-black text-slate-200 uppercase tracking-[0.25em]">{t('detail.scripts')}</span>
                    </div>
                    <MessageScripts status={st.status} username={partner.username} onTextChange={handleTextChange} />
                </div>

                {/* 3. НОДИ ПАРТНЕРА */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <Database size={20} className="text-[#FFB700] opacity-80" />
                        <span className="text-[12px] font-black text-slate-200 uppercase tracking-[0.25em]">{t('detail.inventory')}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {nodes.length > 0 ? (
                            nodes.map((card) => (
                                <div key={`${card.name}-${card.serial}`} className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[2.2rem] flex justify-between items-center shadow-inner gap-3">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl shrink-0">
                                            {card.isTrial ? <Gift size={20} className="text-emerald-400" /> : <Zap size={20} className="text-emerald-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[15px] font-black uppercase text-white tracking-tight block truncate">{card.name}</span>
                                            {card.isTrial && <span className="text-[10px] font-black uppercase text-emerald-400/70 tracking-widest">{t('detail.trial')}</span>}
                                        </div>
                                    </div>
                                    <span className="text-[13px] font-mono text-emerald-400 font-black px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">#{card.serial}</span>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/[0.02] border border-dashed border-white/10 p-8 rounded-[2.5rem] text-center">
                                <span className="text-[13px] font-black uppercase text-slate-600 tracking-[0.3em] italic">{t('detail.noNodes')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. ДАНІ (тільки те, що стосується реферера — без балансів партнера) */}
                <div className="grid grid-cols-2 gap-3">
                    <DetailInfoBox icon={Calendar} label={t('detail.registered')} value={fmtDate(partner.registrationDate)} />
                    <DetailInfoBox icon={Clock} label={t('detail.lastReward')} value={partner.lastRewardDate ? fmtDate(partner.lastRewardDate) : t('detail.never')} />
                    <div className="col-span-2">
                        <DetailInfoBox icon={ArrowUpCircle} label={t('detail.commission')} value={fmtBtc(commissionBtc)} highlight />
                    </div>
                </div>

                {/* 5. ГРАФІК */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-[2.8rem] space-y-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFB700]/30 to-transparent" />
                    <div className="flex items-center gap-3 px-1">
                        <TrendingUp size={20} className="text-[#FFB700] opacity-80" />
                        <span className="text-[12px] font-black text-slate-200 uppercase tracking-[0.2em] leading-tight italic">{t('detail.trend')}</span>
                    </div>
                    {partner.chartData && partner.chartData.length > 0 ? (
                        <PartnerProfitChart data={partner.chartData.map((p) => ({ ...p, val: p.val / 100000000 }))} partnerId={partner.id} currency="BTC" />
                    ) : (
                        <div className="h-32 flex items-center justify-center border border-white/5 rounded-[2rem] bg-black/40">
                            <span className="text-[12px] font-black uppercase text-slate-600 tracking-[0.3em] italic">{t('detail.trendEmpty')}</span>
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <button
                        onClick={() => onWrite(scriptText)}
                        className="w-full py-6 bg-white text-black rounded-full font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 shadow-[0_30px_70px_rgba(255,255,255,0.2)] transition-all"
                    >
                        <MessageCircle size={26} strokeWidth={3} /> {t('detail.write')}
                    </button>
                    <p className="text-[11px] text-center text-slate-500 font-black uppercase tracking-[0.3em] leading-relaxed mt-6 italic opacity-60">
                        {t('detail.writeHint')}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default PartnerDetailView;
