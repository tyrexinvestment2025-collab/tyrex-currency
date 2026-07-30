import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageCircle, Users, 
    CheckCircle2, Loader2, RefreshCw, 
    Sparkles, Trophy, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cardsApi, userApi } from '../../api/tyrexApi';
import { useTelegram } from '../../hooks/useTelegram';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import NftCardVisual from '../NftCardVisual';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');
const BASE_URL = API_URL.replace('/api/v1', '');

interface TrialActivationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const TrialActivationModal: React.FC<TrialActivationModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const navigate = useNavigate();
    const { refreshAllData, tg } = useTelegram(); 
    
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [wonCard, setWonCard] = useState<any>(null);

    const formatImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${BASE_URL}${path}`;
    };

    const fireCelebration = () => {
        const count = 150;
        const defaults = { origin: { y: 0.6 }, zIndex: 1000 };
        function fire(particleRatio: number, opts: any) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    };

    const handleCheckSubscription = async () => {
        setVerifying(true);
        try {
            const res = await userApi.checkSubscription();
            if (res.success) {
                setIsSubscribed(true);
                if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                toast.success("Підписку підтверджено!");
            } else {
                toast.error("Ви ще не підписалися");
                window.open('https://t.me/TYREXcompany', '_blank');
            }
        } catch (e) { toast.error("Помилка зв'язку"); } finally { setVerifying(false); }
    };

    const handleActivate = async () => {
        if (!isSubscribed) return;
        setLoading(true);
        try {
            const res = await cardsApi.activateTrialCard();
            if (res.success) {
                if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                fireCelebration();
                setWonCard(res.card);
                if (onSuccess) onSuccess();
                refreshAllData();
            }
        } catch (e: any) { toast.error(e.message || "Помилка активації"); } finally { setLoading(false); }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={!wonCard ? onClose : undefined} className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[300]" />

                    <motion.div 
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-x-0 bottom-0 z-[310] bg-[#080808] border-t border-white/10 rounded-t-[3rem] p-6 pb-8 shadow-2xl overflow-hidden"
                    >
                        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 relative z-10" />

                        <AnimatePresence mode="wait">
                            {!wonCard ? (
                                <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
                                    <div className="text-center mb-6">
                                        <h2 className="text-3xl font-black italic tracking-tighter text-[#FFB700] uppercase mb-1">ОТРИМАЙ ПОДАРУНОК</h2>
                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-80">ВИКОНАЙ ЗАВДАННЯ ТА ВИЙМИ РАНДОМНУ МОНЕТУ</p>
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        <div className={clsx("bg-white/[0.03] border p-5 rounded-3xl flex items-center justify-between transition-all", isSubscribed ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/5")}>
                                            <div className="flex items-center space-x-4">
                                                <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg", isSubscribed ? "bg-emerald-500 text-black" : "bg-white/5 text-slate-500")}>
                                                    <MessageCircle size={20} fill={isSubscribed ? "currentColor" : "none"} />
                                                </div>
                                                <span className={clsx("text-[10px] font-black uppercase tracking-tight", isSubscribed ? "text-white" : "text-slate-400")}>Підписка на канал</span>
                                            </div>
                                            {isSubscribed ? <CheckCircle2 size={24} className="text-emerald-500" /> : (
                                                <button onClick={handleCheckSubscription} disabled={verifying} className="bg-[#FFB700] text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase active:scale-90">{verifying ? <RefreshCw size={12} className="animate-spin" /> : "Перевірити"}</button>
                                            )}
                                        </div>

                                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-3xl flex items-center justify-between opacity-30 grayscale">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500"><Users size={20} /></div>
                                                <span className="text-[10px] font-black uppercase text-slate-500">Запросити партнера</span>
                                            </div>
                                            <div className="w-5 h-5 rounded-full border-2 border-white/10" />
                                        </div>
                                    </div>

                                    <button onClick={handleActivate} disabled={loading || !isSubscribed} className={clsx("w-full py-5 rounded-[2rem] font-black uppercase text-xs transition-all relative overflow-hidden group shadow-2xl", isSubscribed ? "bg-gradient-to-r from-[#FFB700] to-[#FF7000] text-black active:scale-95 shadow-orange-500/20" : "bg-[#1a1a1a] text-white/20 border border-white/5 cursor-not-allowed")}>
                                        <div className="flex items-center justify-center space-x-2">
                                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                                <>
                                                    <Sparkles size={16} className={isSubscribed ? "animate-pulse" : "opacity-0"} />
                                                    <span>ЗАБРАТИ МІЙ TYREX MINI</span>
                                                </>
                                            )}
                                        </div>
                                        {isSubscribed && <motion.div animate={{ x: ['-150%', '150%'] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full -skew-x-12" />}
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center relative">
                                    <div className="absolute inset-0 -z-10"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-[#FFB700]/5 blur-[80px] rounded-full animate-pulse" /></div>

                                    <div className="text-center mb-4">
                                        <Trophy size={32} className="text-[#FFB700] mx-auto mb-2 drop-shadow-[0_0_10px_rgba(255,183,0,0.5)]" />
                                        <h2 className="text-3xl font-black italic text-[#FFB700] uppercase leading-none">ВІТАЄМО!</h2>
                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">ЦЯ МОНЕТА ТЕПЕР ТВОЯ</p>
                                    </div>

                                    {/* Зменшений візуал монети (sizeClass="w-48") */}
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
                                        transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.2 }}
                                        className="relative mb-4"
                                    >
                                        <NftCardVisual 
                                            imageUrl={formatImageUrl(wonCard.imageUrl)} 
                                            name="Tyrex Mini" 
                                            sizeClass="w-48" 
                                            serialNumber={wonCard.serialNumber} 
                                        />
                                        <div className="absolute inset-0 bg-[#FFB700]/15 blur-[60px] -z-10 rounded-full animate-pulse" />
                                    </motion.div>

                                    <div className="grid grid-cols-3 gap-2 w-full mb-6">
                                        {[
                                            { label: 'APY', val: '6%', color: 'text-emerald-400' },
                                            { label: 'SERIAL', val: `#${wonCard.serialNumber}`, color: 'text-white' },
                                            { label: 'TERM', val: '30D', color: 'text-[#FFB800]' }
                                        ].map((m, idx) => (
                                            <div key={idx} className="bg-[#111112] border border-white/10 rounded-2xl py-3 flex flex-col items-center shadow-inner">
                                                <span className="text-[7px] font-black text-white/30 uppercase mb-0.5">{m.label}</span>
                                                <span className={clsx("text-[14px] font-black leading-none", m.color)}>{m.val}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <motion.button 
                                        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                                        onClick={() => { onClose(); navigate('/collection'); }}
                                        className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
                                    >
                                        <span>ПЕРЕЙТИ В КОЛЕКЦІЮ</span>
                                        <ArrowRight size={16} />
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TrialActivationModal;