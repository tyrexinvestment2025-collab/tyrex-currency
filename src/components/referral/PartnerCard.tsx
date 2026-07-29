import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Copy, Calendar, ArrowUpCircle, Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import { useTyrexStore } from '../../store/useTyrexStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import PartnerProfitChart from '../charts/PartnerProfitChart';

const PartnerCard = ({ partner }: { partner: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currency, setCurrency] = useState<'BTC' | 'USDT'>('BTC');
    const { btcPrice } = useTyrexStore();

    const toggleCurrency = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrency(prev => prev === 'BTC' ? 'USDT' : 'BTC');
    };

    const copyTemplate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!partner.messageTemplate) return;
        navigator.clipboard.writeText(partner.messageTemplate);
        toast.success('Шаблон скопійовано!', {
            style: { background: '#121212', color: '#FFB700', fontSize: '12px' }
        });
    };

    return (
        <div className={clsx(
            "bg-[#141414] border rounded-[2rem] transition-all duration-300 mb-3 overflow-hidden",
            isExpanded ? "border-[#FFB800]/40 shadow-2xl ring-1 ring-[#FFB800]/10" : "border-[#222222]"
        )}>
            {/* ШАПКА КАРТКИ (Згорнутий вигляд) */}
            <div onClick={() => setIsExpanded(!isExpanded)} className="p-5 flex items-center justify-between cursor-pointer active:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-[#1a1a1a] to-[#080808] border border-white/5 flex items-center justify-center font-black text-[#FFB700] text-xl shadow-inner">
                        {(partner.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-black text-white tracking-tight uppercase leading-none mb-2">
                            {partner.username || 'Anonymous'}
                        </p>
                        {/* Динамічний статус з бекенду */}
                        <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" style={{ backgroundColor: partner.statusColor || '#333' }} />
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none" style={{ color: partner.statusColor || '#333' }}>
                                {partner.statusLabel || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-[#333] transition-colors group-hover:text-white"><ChevronDown size={24} /></motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-6">
                        <div className="pt-5 border-t border-white/5 space-y-6">
                            
                            {/* CRM ПОЯСНЕННЯ (Пояснювальний текст статусу) */}
                            <div className="bg-[#FFB800]/5 border border-[#FFB800]/10 p-5 rounded-[1.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp size={40}/></div>
                                <p className="text-[11px] text-slate-300 italic leading-relaxed relative z-10">
                                    "{partner.statusDescription || 'Клієнт вивчає платформу. Будь на зв\'язку!'}"
                                </p>
                            </div>

                            {/* ФІНАНСОВИЙ HUD (Стек полів) */}
                            <div className="grid grid-cols-2 gap-3">
                                <DataBox icon={Calendar} label="Реєстрація" value={new Date(partner.registrationDate).toLocaleDateString()} />
                                <DataBox icon={Wallet} label="Заведено ($)" value={`$${partner.depositedAmount}`} />
                                <DataBox icon={TrendingUp} label="Загальний дохід" value={`$${partner.totalPartnerIncome}`} />
                                <DataBox icon={ArrowUpCircle} label="Мій профіт" value={`${partner.myProfitFromHimBTC} BTC`} highlight />
                            </div>

                            {/* ГРАФІК ТРЕНДУ ПАРТНЕРА */}
                            <div className="bg-[#080808] p-4 rounded-[1.8rem] border border-[#222222] space-y-3 relative overflow-hidden">
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={12} className="text-[#FFB700] opacity-50" />
                                        <span className="text-[8px] font-black text-[#555555] uppercase tracking-widest">Revenue Trend ({currency})</span>
                                    </div>
                                    <button onClick={toggleCurrency} className="text-[8px] font-black text-[#FFB700] border border-[#FFB700]/30 px-2 py-0.5 rounded-md uppercase active:bg-[#FFB700] active:text-black transition-all flex items-center gap-1">
                                        <RefreshCw size={8} /> {currency}
                                    </button>
                                </div>
                                
                                <PartnerProfitChart 
                                    data={(partner.chartData || []).map((p: any) => ({
                                        ...p,
                                        val: currency === 'BTC' ? p.val / 100000000 : (p.val / 100000000) * btcPrice
                                    }))} 
                                    partnerId={partner.id} 
                                    currency={currency}
                                />
                            </div>

                            {/* БЛОК ШВИДКИХ ДІЙ */}
                            <div className="flex gap-3 mt-4">
                                <a 
                                    href={`https://t.me/${partner.tgUsername}`} target="_blank" rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-black rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-white/5"
                                >
                                    <MessageCircle size={16} /> Написати в ТГ
                                </a>
                                <button 
                                    onClick={copyTemplate}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest active:bg-white/10 transition-all text-slate-300"
                                >
                                    <Copy size={16} /> Шаблон
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DataBox = ({ icon: Icon, label, value, highlight = false }: any) => (
    <div className="bg-black/20 border border-white/5 p-4 rounded-[1.5rem] flex flex-col items-center text-center group">
        <Icon size={14} className={highlight ? "text-[#FFB700] mb-2 scale-110" : "text-slate-600 mb-2"} />
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">{label}</span>
        <span className={clsx("text-[11px] font-black tracking-tight", highlight ? "text-[#FFB700]" : "text-white")}>{value}</span>
    </div>
);

export default PartnerCard;