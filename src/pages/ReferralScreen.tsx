import React, { useEffect, useState } from 'react';
import { Copy, Users, Lock, Share2, Wallet, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { referralApi } from '../api/tyrexApi';
import clsx from 'clsx';

// Интерфейсы
interface ReferralData {
    isLocked?: boolean;
    referralLink?: string;
    totalEarnedSats?: number;
    stats?: {
        totalInvited: number;
        activeMiners: number;
    };
}

const ReferralScreen: React.FC = () => {
    const navigate = useNavigate();
    
    const [data, setData] = useState<ReferralData | null>(null);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PARTNERS'>('OVERVIEW');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const info = await referralApi.getReferralInfo();
            setData(info);
            
            if (!info.isLocked) {
                const list = await referralApi.getReferralList();
                setPartners(list);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (data?.referralLink) {
            navigator.clipboard.writeText(data.referralLink);
            // Тут можно добавить тост уведомление
            alert("Link copied to clipboard");
        }
    };

    // --- ЭКРАН ЗАГРУЗКИ ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-tyrex-ultra-gold-glow animate-spin opacity-50" />
            </div>
        );
    }

    // --- ЭКРАН БЛОКИРОВКИ (Пользователь не купил карту) ---
    if (data?.isLocked) {
        return (
            <div className="min-h-screen bg-[#080808] text-white p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 bg-[#121213] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                        <Lock className="w-8 h-8 text-white/30" />
                    </div>
                    
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-3">Pool Locked</h1>
                    <p className="text-white/40 text-[11px] font-medium uppercase tracking-widest max-w-[220px] leading-relaxed mb-8">
                        Purchase at least one mining node to activate your referral network.
                    </p>

                    <button 
                        onClick={() => navigate('/marketplace')}
                        className="w-full py-4 bg-tyrex-ultra-gold-glow text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_10px_30px_rgba(253,185,49,0.15)] active:scale-95 transition-all"
                    >
                        Go to Market
                    </button>
                </div>
            </div>
        );
    }

    // --- ЭКРАН АКТИВНОГО ПУЛА ---
    return (
        <div className="min-h-screen bg-[#080808] text-white pb-24 font-sans">
            
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 px-6 py-6 flex justify-between items-center">
                <h1 className="text-xl font-black uppercase italic tracking-tighter">Mining Pool</h1>
                <div className="bg-tyrex-ultra-gold-glow/10 border border-tyrex-ultra-gold-glow/20 rounded-full px-3 py-1 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-tyrex-ultra-gold-glow rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-tyrex-ultra-gold-glow uppercase tracking-widest">Active</span>
                </div>
            </div>

            <div className="p-5">
                {/* Balance Card */}
                <div className="bg-[#121213] border border-white/5 rounded-[2.5rem] p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-tyrex-ultra-gold-glow/5 blur-[60px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-3 opacity-40">
                            <Wallet className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pool Revenue</span>
                        </div>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-4xl font-black text-white italic tracking-tighter">
                                {data?.totalEarnedSats?.toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-tyrex-ultra-gold-glow uppercase tracking-widest">SATS</span>
                        </div>
                        <p className="text-[9px] text-white/20 mt-2 font-bold uppercase tracking-wider">
                            ≈ ${( (data?.totalEarnedSats || 0) * 0.00069 ).toFixed(2)} USD
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-white/5 rounded-2xl mb-6">
                    <button 
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={clsx(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'OVERVIEW' ? "bg-white/10 text-white shadow-lg" : "text-white/30"
                        )}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('PARTNERS')}
                        className={clsx(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'PARTNERS' ? "bg-white/10 text-white shadow-lg" : "text-white/30"
                        )}
                    >
                        Partners
                    </button>
                </div>

                {/* CONTENT: OVERVIEW */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/[0.03] p-5 rounded-[2rem] border border-white/5 flex flex-col justify-between h-32">
                                <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-white/40" />
                                </div>
                                <div>
                                    <span className="text-2xl font-black text-white">{data?.stats?.totalInvited}</span>
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mt-1">Total Invited</span>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] p-5 rounded-[2rem] border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden">
                                <div className="absolute inset-0 bg-green-500/5" />
                                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center relative z-10">
                                    <Zap className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="relative z-10">
                                    <span className="text-2xl font-black text-green-400">{data?.stats?.activeMiners}</span>
                                    <span className="text-[9px] font-black text-green-400/50 uppercase tracking-widest block mt-1">Active Miners</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#161617] border border-white/10 p-5 rounded-[2rem] mt-6">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Your Invite Link</p>
                            <button 
                                onClick={copyLink}
                                className="w-full bg-black/40 border border-white/5 py-4 px-5 rounded-2xl flex items-center justify-between active:bg-black/60 transition-all group"
                            >
                                <span className="text-xs font-bold text-white/70 truncate mr-4 italic font-mono">
                                    {data?.referralLink}
                                </span>
                                <Copy className="w-4 h-4 text-tyrex-ultra-gold-glow group-active:scale-90" />
                            </button>
                            <button 
                                onClick={copyLink}
                                className="w-full mt-3 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white/50 flex items-center justify-center space-x-2 hover:bg-white/10"
                            >
                                <Share2 className="w-3 h-3" />
                                <span>Share Link</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* CONTENT: PARTNERS LIST */}
                {activeTab === 'PARTNERS' && (
                    <div className="space-y-3 animate-fade-in">
                        {partners.length === 0 ? (
                            <div className="text-center py-20 opacity-30">
                                <Users className="w-10 h-10 mx-auto mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No partners found</p>
                            </div>
                        ) : (
                            partners.map((p: any) => (
                                <div key={p.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-white/40">
                                            {p.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{p.username}</p>
                                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{new Date(p.registeredAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={clsx(
                                        "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                        p.isActive ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/20"
                                    )}>
                                        {p.isActive ? 'Mining' : 'Idle'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralScreen;