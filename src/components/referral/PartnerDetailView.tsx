import { motion } from 'framer-motion';
import { 
    ArrowLeft, MessageCircle, Calendar, Wallet, 
    TrendingUp, ArrowUpCircle, Database, Zap 
} from 'lucide-react';
import PartnerProfitChart from '../charts/PartnerProfitChart';
import clsx from 'clsx';

const DetailInfoBox = ({ icon: Icon, label, value, highlight }: any) => (
    <div className="bg-[#111112] p-5 rounded-[2.2rem] border border-white/10 flex flex-col items-center text-center shadow-inner group hover:bg-white/[0.02] transition-colors">
        <Icon size={22} className={clsx("mb-2 group-hover:scale-110 transition-transform", highlight ? "text-[#FFB700] drop-shadow-[0_0_8px_rgba(255,183,0,0.4)]" : "text-slate-400")} />
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">{label}</span>
        <span className={clsx("text-[14px] font-black tracking-tight", highlight ? "text-[#FFB700] italic" : "text-white")}>{value}</span>
    </div>
);

const PartnerDetailView = ({ partner, onClose, onWrite }: any) => {
    return (
        <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[500] bg-[#080808] flex flex-col overflow-y-auto"
        >
            {/* Header з білим текстом */}
            <div className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5 px-6 py-8 flex items-center gap-5">
                <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-white active:scale-90 transition-all shadow-lg border border-white/10"><ArrowLeft size={24} /></button>
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-white">{partner.username}</h2>
                    <div className="flex items-center gap-2 mt-2.5">
                        <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: partner.statusColor }} />
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none" style={{ color: partner.statusColor }}>{partner.statusLabel}</span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-7 pb-32">
                {/* Кольоровий акцент для поради */}
                <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 p-8 rounded-[2.8rem] relative overflow-hidden shadow-2xl">
                    <TrendingUp className="absolute top-2 right-2 opacity-[0.03] text-white" size={90} />
                    <p className="text-[15px] text-white italic leading-relaxed relative z-10 font-medium tracking-tight">"{partner.statusDescription}"</p>
                </div>

                {/* Інвентар з білими назвами */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <Database size={16} className="text-[#FFB700] opacity-80" />
                        <span className="text-[11px] font-black text-slate-200 uppercase tracking-[0.3em]">ИНВЕНТАРЬ ПАРТНЕРА</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {partner.inventory?.staked?.length > 0 ? (
                            partner.inventory.staked.map((card: any, idx: number) => (
                                <div key={idx} className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[1.8rem] flex justify-between items-center shadow-inner group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform"><Zap size={18} className="text-emerald-400" /></div>
                                        <span className="text-[14px] font-black uppercase text-white tracking-tight">{card.name}</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-emerald-400 font-black px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">#{card.serial}</span>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/[0.02] border border-dashed border-white/10 p-8 rounded-[2.2rem] text-center">
                                <span className="text-[11px] font-black uppercase text-slate-600 tracking-[0.4em] italic">No active assets</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Фінансова сітка з білим текстом */}
                <div className="grid grid-cols-2 gap-4">
                    <DetailInfoBox icon={Calendar} label="РЕГИСТРАЦИЯ" value={new Date(partner.registrationDate).toLocaleDateString()} />
                    <DetailInfoBox icon={Wallet} label="КАПИТАЛ $" value={`$${partner.depositedAmount}`} />
                    <DetailInfoBox icon={TrendingUp} label="ПРИБЫЛЬ $" value={`$${partner.totalPartnerIncome}`} />
                    <DetailInfoBox icon={ArrowUpCircle} label="ВАША КОМИССИЯ (BTC)" value={`${partner.myProfitFromHimBTC} BTC`} highlight />
                </div>

                {/* Графік з покращеним контрастом */}
                <div className="bg-[#111] border border-white/10 p-7 rounded-[2.8rem] space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFB700]/30 to-transparent" />
                    <div className="flex items-center gap-3 px-2">
                        <TrendingUp size={16} className="text-[#FFB700] opacity-80" />
                        <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest leading-none italic">РЕАЛЬНЫЙ ТРЕНД (BTC)</span>
                    </div>
                    {partner.chartData && partner.chartData.length > 0 ? (
                        <PartnerProfitChart 
                            data={partner.chartData.map((p: any) => ({ ...p, val: p.val / 100000000 }))} 
                            partnerId={partner.id} 
                            currency="BTC" 
                        />
                    ) : (
                        <div className="h-44 flex items-center justify-center border border-white/5 rounded-[2rem] bg-black/40">
                            <span className="text-[11px] font-black uppercase text-slate-700 tracking-[0.5em] italic">Awaiting data stream...</span>
                        </div>
                    )}
                </div>

                {/* Екшн-кнопка з ефектом білого сяйва */}
                <div className="pt-4 space-y-5">
                    <button 
                        onClick={onWrite}
                        className="w-full py-7 bg-white text-black rounded-full font-black uppercase text-xs tracking-[0.25em] flex items-center justify-center gap-4 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all border-t border-white/40"
                    >
                        <MessageCircle size={24} strokeWidth={3} /> НАПИСАТЬ В ТЕЛЕГРАМ
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.4em] leading-relaxed italic opacity-60">
                        Текст шаблона копируется автоматически
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default PartnerDetailView;