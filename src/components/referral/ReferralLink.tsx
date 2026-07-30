import React from 'react';
import { Copy, Share2, HelpCircle } from 'lucide-react';

interface Props {
    link: string;
    onCopy: () => void;
    onShare: () => void;
    onInfo: () => void;
}

const ReferralLink: React.FC<Props> = ({ link, onCopy, onShare, onInfo }) => (
    <div onClick={onInfo} className="bg-[#141414] border-2 border-[#222222] rounded-[2rem] p-6 space-y-5 transition-all cursor-pointer relative">
        <HelpCircle size={16} className="absolute top-4 right-6 text-white/20" />
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider text-center px-2">
            Делитесь своей реферальной ссылкой с друзьями и получайте пассивный доход.
        </p>
        <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center shadow-inner">
            <span className="text-[12px] font-mono text-white/40 truncate block">{link}</span>
        </div>
        <div className="flex justify-center gap-3">
            <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className="flex-1 py-4 bg-[#080808] border border-[#222222] rounded-xl active:border-[#FFB700] transition-all flex items-center justify-center gap-2">
                <Copy size={16} className="text-[#FFB700]"/><span className="text-[10px] font-black uppercase tracking-widest text-white/60">Копировать</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onShare(); }} className="flex-1 py-4 bg-[#080808] border border-[#222222] rounded-xl active:border-white transition-all flex items-center justify-center gap-2">
                <Share2 size={16} className="text-white/40"/><span className="text-[10px] font-black uppercase tracking-widest text-white/60">Поделиться</span>
            </button>
        </div>
    </div>
);

export default ReferralLink;