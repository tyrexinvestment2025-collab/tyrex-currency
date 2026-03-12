import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoCardProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    methodology: { label: string; text: string; color: string }[];
}

const InfoCard: React.FC<InfoCardProps> = ({ isOpen, onClose, title, description, methodology }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-[100] bg-[#0A0A0B]/95 backdrop-blur-md rounded-[2.5rem] p-8 flex flex-col justify-center border border-white/5"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/40" />
                    </button>
                    
                    <h4 className="text-[#FDB931] text-xs font-black uppercase tracking-[2px] mb-4">{title}</h4>
                    <p className="text-white/60 text-[11px] font-medium leading-relaxed mb-8 uppercase tracking-wider">
                        {description}
                    </p>
                    
                    <div className="space-y-6">
                        {methodology.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: item.color }}>
                                    ● {item.label}
                                </span>
                                <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed pl-3 border-l border-white/5">
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InfoCard;