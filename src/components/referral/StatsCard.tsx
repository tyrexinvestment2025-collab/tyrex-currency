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

const StatsCard: React.FC<StatsCardProps> = ({ label, value, sub, activeId, id, onOpen, orange, white, gold }) => (
    <div onClick={() => onOpen(id)} className={clsx(
        "bg-[#141414] p-5 rounded-[2.2rem] border-2 flex flex-col justify-between h-40 transition-all cursor-pointer relative shadow-2xl",
        activeId === id ? "border-[#FFB700] scale-[1.05] z-10" : "border-[#222222]",
        orange && activeId === id && "border-[#FF7000]",
        white && activeId === id && "border-white",
        gold && activeId === id && "border-amber-400"
    )}>
        <HelpCircle size={14} className="absolute top-4 right-4 text-white/10" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{label}</span>
        <div className={clsx("text-2xl font-black italic tracking-tighter leading-none", orange ? "text-[#FF7000]" : "text-white")}>
            {value} {sub && <span className="text-[10px] not-italic opacity-30 ml-1">{sub}</span>}
        </div>
    </div>
);

export default StatsCard;