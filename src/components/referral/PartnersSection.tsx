import { Users } from 'lucide-react';
import PartnerCard from './PartnerCard';

const PartnersSection = ({ partners }: { partners: any[] }) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-2 mb-4">
                <div className="flex items-center gap-2">
                    <Users size={14} className="text-white/20" />
                    <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">Ваша сеть</span>
                </div>
                <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">{partners.length} партнеров</span>
            </div>

            {partners.length === 0 ? (
                <div className="py-20 text-center bg-[#141414] rounded-[2.5rem] border border-[#222222] border-dashed">
                    <p className="text-[10px] font-black uppercase text-[#333] tracking-widest">Список партнеров пуст</p>
                </div>
            ) : (
                <div className="pb-10">
                    {partners.map((p) => (
                        <PartnerCard key={p.id} partner={p} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PartnersSection;