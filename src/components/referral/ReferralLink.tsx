import React, { useState } from 'react';
import { Copy, Share2, HelpCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props {
    link?: string;
    /** Возвращает true, если копирование удалось */
    onCopy: () => Promise<boolean> | boolean;
    onShare: () => void;
    onInfo: () => void;
}

const ReferralLink: React.FC<Props> = ({ link, onCopy, onShare, onInfo }) => {
    const { t } = useTranslation('referral');
    const [copied, setCopied] = useState(false);

    const handleLocalCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (await onCopy()) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div onClick={onInfo} className="bg-[#111112] border-2 border-white/5 rounded-[2.8rem] p-7 space-y-6 transition-all cursor-pointer relative group overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFB700]/5 blur-3xl rounded-full pointer-events-none" />
            <HelpCircle size={18} className="absolute top-6 right-7 text-white/40 group-hover:text-[#FFB700] transition-colors z-20" />

            <p className="text-[11px] text-slate-200 font-bold uppercase tracking-widest text-center px-6 leading-relaxed relative z-10">
                {t('link.description')}
            </p>

            <div className="bg-black/60 border border-white/10 p-5 rounded-2xl text-center shadow-inner relative z-10 overflow-hidden group-hover:border-[#FFB700]/30 transition-colors">
                <span className="text-[13px] font-mono text-white font-bold tracking-tight truncate block px-2">{link}</span>
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
            </div>

            <div className="flex justify-center gap-3 relative z-10">
                <button
                    onClick={handleLocalCopy}
                    disabled={!link}
                    className="flex-1 py-5 bg-[#080808] border border-white/10 rounded-xl active:border-[#FFB700] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 overflow-hidden disabled:opacity-40"
                >
                    <AnimatePresence mode="wait">
                        {copied ? (
                            <motion.div key="check" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2 text-emerald-400">
                                <Check size={16} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('link.copied')}</span>
                            </motion.div>
                        ) : (
                            <motion.div key="copy" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                                <Copy size={16} className="text-[#FFB700]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{t('link.copy')}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onShare(); }}
                    disabled={!link}
                    className="flex-1 py-5 bg-[#080808] border border-white/10 rounded-xl active:border-white transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-40"
                >
                    <Share2 size={16} className="text-white/50"/>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{t('link.share')}</span>
                </button>
            </div>
        </div>
    );
};

export default ReferralLink;
