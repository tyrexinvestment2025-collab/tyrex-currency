import { motion } from 'framer-motion';
import { 
    ArrowLeft, MessageCircle, Calendar, Wallet, 
    TrendingUp, ArrowUpCircle, Database, Zap 
} from 'lucide-react';
import PartnerProfitChart from '../charts/PartnerProfitChart';
import clsx from 'clsx';

const DetailInfoBox = ({ icon: Icon, label, value, highlight }: any) => (
    <div className="bg-[#141414] p-5 rounded-[2rem] border border-white/5 flex flex-col items-center text-center shadow-inner group">
        <Icon size={20} className={clsx("mb-2 group-hover:scale-110 transition-transform", highlight ? "text-[#FFB700]" : "text-slate-600")} />
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 leading-none">{label}</span>
        <span className={clsx("text-[13px] font-black tracking-tight", highlight ? "text-[#FFB700] italic" : "text-white")}>{value}</span>
    </div>
);

const PartnerDetailView = ({ partner, onClose, onWrite }: any) => {
    return (
        <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-[#080808] flex flex-col overflow-y-auto"
        >
            {/* Header CRM */}
            <div className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5 px-6 py-6 flex items-center gap-5">
                <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-white active:scale-90 transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{partner.username}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: partner.statusColor }} />
                        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: partner.statusColor }}>{partner.statusLabel}</span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6 pb-24">
                {/* 1. CRM Совет / Опис */}
                <div className="bg-[#FFB800]/5 border border-[#FFB800]/10 p-6 rounded-[2.5rem] relative overflow-hidden">
                    <TrendingUp className="absolute top-2 right-2 opacity-5" size={70} />
                    <p className="text-[14px] text-slate-300 italic leading-relaxed relative z-10">"{partner.statusDescription}"</p>
                </div>

                {/* 2. ІНВЕНТАР МОНЕТ (НОВЕ) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <Database size={14} className="text-white/20" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Інвентар партнера</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        {/* Список застейканих (активних) */}
                        {partner.inventory.staked.length > 0 ? (
                            partner.inventory.staked.map((card: any, idx: number) => (
                                <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Zap size={16} className="text-emerald-400" />
                                        <span className="text-xs font-black uppercase text-white/90">{card.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-emerald-400/60 font-bold">#{card.serial} {card.isTrial ? '(TRIAL)' : ''}</span>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center">
                                <span className="text-[10px] font-black uppercase text-white/10">Немає активних нод</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Фінансова статистика */}
                <div className="grid grid-cols-2 gap-3">
                    <DetailInfoBox icon={Calendar} label="РЕЄСТРАЦІЯ" value={new Date(partner.registrationDate).toLocaleDateString()} />
                    <DetailInfoBox icon={Wallet} label="ЗАВЕДЕНО ($)" value={`$${partner.depositedAmount}`} />
                    <DetailInfoBox icon={TrendingUp} label="ЙОГО ДОХІД" value={`$${partner.totalPartnerIncome}`} />
                    <DetailInfoBox icon={ArrowUpCircle} label="МІЙ ПРОФІТ" value={`${partner.myProfitFromHimBTC} BTC`} highlight />
                </div>

                {/* 4. Графік реальних нарахувань */}
                <div className="bg-[#111] border border-white/5 p-5 rounded-[2.5rem] space-y-4 shadow-2xl">
                    <div className="flex items-center gap-2 px-2">
                        <TrendingUp size={14} className="text-[#FFB700] opacity-40" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">РЕАЛЬНИЙ ТРЕНД (BTC)</span>
                    </div>
                    {partner.chartData && partner.chartData.length > 0 ? (
                        <PartnerProfitChart 
                            data={partner.chartData.map((p: any) => ({ ...p, val: p.val / 100000000 }))} 
                            partnerId={partner.id} 
                            currency="BTC" 
                        />
                    ) : (
                        <div className="h-40 flex items-center justify-center border border-white/5 rounded-3xl bg-black/20">
                            <span className="text-[10px] font-black uppercase text-[#333] tracking-[0.2em]">Дані відсутні</span>
                        </div>
                    )}
                </div>

                {/* 5. Головна кнопка дії */}
                <div className="pt-4">
                    <button 
                        onClick={onWrite}
                        className="w-full py-6 bg-white text-black rounded-full font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-2xl transition-all"
                    >
                        <MessageCircle size={22} /> НАПИСАТИ В ТЕЛЕГРАМ
                    </button>
                    <p className="text-[10px] text-center text-slate-600 font-bold uppercase mt-5 tracking-[0.2em] opacity-40 leading-relaxed">
                        При натисканні текст шаблону <br/> копіюється автоматично
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default PartnerDetailView;