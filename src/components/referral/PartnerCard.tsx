import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { useTyrexStore } from '../../store/useTyrexStore';
import clsx from 'clsx';
import PartnerProfitChart from '../charts/PartnerProfitChart';

const PartnerCard = ({ partner }: { partner: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currency, setCurrency] = useState<'BTC' | 'USDT'>('BTC');
    const { btcPrice } = useTyrexStore();

    // Переключение валюты
    const toggleCurrency = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrency(prev => prev === 'BTC' ? 'USDT' : 'BTC');
    };

    // Расчет отображаемого дохода
    const displayProfit = useMemo(() => {
        const btc = Number(partner.myProfitFromHimBTC || 0);
        if (currency === 'BTC') return btc.toFixed(8);
        return (btc * btcPrice).toFixed(2);
    }, [currency, partner.myProfitFromHimBTC, btcPrice]);

    // Конвертация данных графика
    const convertedChartData = useMemo(() => {
        return (partner.chartData || []).map((point: any) => ({
            ...point,
            // Если на графике USDT, умножаем сатоши на курс
            val: currency === 'BTC' 
                ? point.val / 100000000 
                : (point.val / 100000000) * btcPrice
        }));
    }, [currency, partner.chartData, btcPrice]);

    const totalCapital = (Number(partner.idleBalance || 0) + Number(partner.totalInvestment || 0)).toFixed(2);

    return (
        <div className={clsx(
            "bg-[#141414] border rounded-[2rem] transition-all duration-300 mb-3 overflow-hidden",
            isExpanded ? "border-[#FFB800]/40 shadow-2xl ring-1 ring-[#FFB800]/10" : "border-[#222222]"
        )}>
            {/* ШАПКА КАРТКИ */}
            <div onClick={() => setIsExpanded(!isExpanded)} className="p-5 flex items-center justify-between cursor-pointer active:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#080808] border border-[#222222] flex items-center justify-center font-black text-[#FFB700] text-xl">
                        {(partner.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-black text-white tracking-tight uppercase leading-none mb-1">{partner.username || 'Anonymous'}</p>
                        <p className="text-[10px] font-bold text-[#555555] uppercase">ID: {partner.id.slice(-6).toUpperCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <div className="text-right">
                        <p className="text-[14px] font-black text-white leading-none">${partner.idleBalance}</p>
                        <p className="text-[8px] font-bold text-[#555555] uppercase tracking-widest mt-1">На кошельке</p>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-[#333]"><ChevronDown size={24} /></motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-6">
                        <div className="pt-5 border-t border-white/5 space-y-5">
                            
                            {/* HUD: 3 ЦИФРЫ */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-[#080808] p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                    <span className="text-[7px] font-black text-[#555555] uppercase mb-1 leading-none">Капитал</span>
                                    <span className="text-[11px] font-black text-white">${totalCapital}</span>
                                </div>
                                <div className="bg-[#080808] p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                                    <span className="text-[7px] font-black text-[#555555] uppercase mb-1 leading-none">Инвестировано</span>
                                    <span className="text-[11px] font-black text-white">${partner.totalInvestment}</span>
                                </div>

                                {/* МОЙ ДОХОД С ПЕРЕКЛЮЧАТЕЛЕМ */}
                                <div 
                                    onClick={toggleCurrency}
                                    className="bg-[#FFB800]/5 p-3 rounded-2xl border border-[#FFB800]/20 flex flex-col items-center justify-center relative group active:scale-95 transition-all"
                                >
                                    <span className="text-[7px] font-black text-[#FFB800] uppercase mb-1 leading-none">Мой доход</span>
                                    <span className="text-[11px] font-black text-[#FFB800] italic leading-none">
                                        {displayProfit} <span className="not-italic text-[8px] opacity-60">{currency}</span>
                                    </span>
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-40 transition-opacity">
                                        <RefreshCw size={8} className="text-[#FFB800]" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-black/20 p-3 rounded-2xl border border-white/5">
                                <span className="text-[9px] font-black text-[#555555] uppercase tracking-[0.2em]">Статус партнера:</span>
                                {partner.isActive ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Активный Майнер</span>
                                        <Zap size={12} fill="currentColor" />
                                    </div>
                                ) : <span className="text-[10px] font-black text-[#333] uppercase">Не инвестировал</span>}
                            </div>

                            {/* ГРАФІК */}
                            <div className="bg-[#080808] p-4 rounded-2xl border border-[#222222] space-y-3 relative overflow-hidden">
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={12} className="text-[#FFB700] opacity-50" />
                                        <span className="text-[8px] font-black text-[#555555] uppercase tracking-widest">Тренд ({currency})</span>
                                    </div>
                                    <button 
                                        onClick={toggleCurrency}
                                        className="text-[8px] font-black text-[#FFB700] border border-[#FFB700]/30 px-2 py-0.5 rounded-md uppercase active:bg-[#FFB700] active:text-black transition-all"
                                    >
                                        Switch to {currency === 'BTC' ? 'USDT' : 'BTC'}
                                    </button>
                                </div>
                                
                                <PartnerProfitChart 
                                    data={convertedChartData} 
                                    partnerId={partner.id} 
                                    currency={currency}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PartnerCard;