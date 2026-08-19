import React from 'react';
import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
    label: string;
    value: string | number;
    sub?: string;
    id: string;
    activeId: string | null;
    onOpen: (id: string) => void;
    orange?: boolean;
    white?: boolean;
    gold?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, sub, activeId, id, onOpen, orange, gold }) => (
    <div 
        onClick={() => onOpen(id)} 
        className={clsx(
            "bg-[#111112] p-5 rounded-[2.2rem] border-2 flex flex-col justify-between h-40 transition-all duration-300 cursor-pointer relative shadow-2xl overflow-hidden group",
            activeId === id ? "border-[#FFB700] scale-[1.02] z-10" : "border-white/10"
        )}
    >
        {/* Фоновий градієнт при ховері */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 blur-2xl rounded-full group-hover:bg-[#FFB700]/10 transition-colors" />
        
        <HelpCircle size={14} className="absolute top-4 right-4 text-white/20 group-hover:text-[#FFB700] transition-colors" />
        
        {/* Яскравіший лейбл */}
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-tight relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
            {label}
        </span>
        
        {/* Контрастні цифри з ефектом світіння */}
        <div className={clsx(
            "text-2xl font-black italic tracking-tighter leading-none relative z-10 drop-shadow-md", 
            orange ? "text-[#FF7000] drop-shadow-[0_0_8px_rgba(255,112,0,0.3)]" : 
            gold ? "text-[#FFB700] drop-shadow-[0_0_10px_rgba(255,183,0,0.4)]" : 
            "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        )}>
            {value} {sub && <span className="text-[11px] not-italic text-white/40 ml-1 font-bold">{sub}</span>}
        </div>
    </div>
);

export default StatsCard;