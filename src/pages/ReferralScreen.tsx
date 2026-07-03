import React, { useEffect, useState } from 'react';
import { Copy, Users, Lock, Share2, RefreshCw, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { referralApi } from '../api/tyrexApi';
import toast from 'react-hot-toast'; // Импорт библиотеки уведомлений
import clsx from 'clsx';

// Константа курса (можно брать из глобального стейта цен)
const SATS_TO_USD = 0.00069;

interface ReferralData {
    isLocked?: boolean;
    referralLink?: string;
    totalEarnedSats?: number;
    stats?: {
        totalInvited: number;
        activeMiners: number;
        estMonthlyIncomeBtc?: number;
    };
}

const ReferralScreen: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<ReferralData | null>(null);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
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

    // --- ЛОГИКА СБОРА СРЕДСТВ (CLAIM) ---
    const handleClaim = async () => {
        if (claiming || (data?.totalEarnedSats || 0) <= 0) return;
        
        setClaiming(true);
        const claimPromise = referralApi.claimRewards();

        toast.promise(claimPromise, {
            loading: 'Processing rewards collection...',
            success: (res) => {
                if (res.success) {
                    loadData(); // Обновляем балансы на странице
                    return `Successfully collected ${res.claimedAmount} SATS!`;
                }
                throw new Error(res.message || 'Claim failed');
            },
            error: (err) => err.message || 'Error communicating with server',
        }, {
            style: {
                minWidth: '250px',
                background: '#121213',
                color: '#fff',
                border: '1px solid #FFB800',
                borderRadius: '16px'
            },
            success: {
                duration: 4000,
                iconTheme: { primary: '#FFB800', secondary: '#000' }
            }
        });
        
        setClaiming(false);
    };

    const copyLink = () => {
        if (data?.referralLink) {
            navigator.clipboard.writeText(data.referralLink);
            toast.success('Link copied to clipboard!', {
                icon: '🔗',
                style: {
                    background: '#121213',
                    color: '#fff',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }
            });
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-[#FFB800] animate-spin opacity-50" />
        </div>
    );

    if (data?.isLocked) {
        return (
            <div className="min-h-screen bg-[#080808] text-white p-6 flex flex-col justify-center items-center text-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#121213] border border-white/5 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center"
                >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                        <Lock className="w-8 h-8 text-white/20" />
                    </div>
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Pool Locked</h1>
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8">
                        Purchase a mining card <br/> to unlock your referral link
                    </p>
                    <button onClick={() => navigate('/marketplace')} className="w-full py-5 bg-[#FFB800] text-black rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-[0_10px_40px_rgba(255,184,0,0.2)]">
                        Go to Marketplace
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white pb-32 font-sans overflow-x-hidden">
            
            {/* --- HEADER --- */}
            <div className="sticky top-0 z-30 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">Mining Pool</h1>
                    <span className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest mt-1 flex items-center gap-1">
                        <div className="w-1 h-1 bg-[#FFB800] rounded-full animate-pulse" />
                        Network Active
                    </span>
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                    <Users className="w-4 h-4 text-white/40" />
                </div>
            </div>

            <div className="p-5 space-y-6">
                
                {/* --- MAIN REVENUE CARD --- */}
                <div className="bg-[#121213] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFB800]/10 blur-[60px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="flex items-center space-x-2 mb-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                            <TrendingUp className="w-3 h-3 text-[#FFB800]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Passive Revenue</span>
                        </div>
                        
                        <div className="flex items-baseline space-x-2 mb-1">
                            <span className="text-5xl font-black text-white italic tracking-tighter">
                                {data?.totalEarnedSats?.toLocaleString()}
                            </span>
                            <span className="text-sm font-black text-[#FFB800] uppercase tracking-widest">SATS</span>
                        </div>
                        
                        <p className="text-sm font-bold text-white/20 uppercase tracking-widest mb-8">
                            ≈ ${( (data?.totalEarnedSats || 0) * SATS_TO_USD ).toFixed(2)} USD
                        </p>

                        {/* КНОПКА СБОРА (CLAIM) */}
                        <button 
                            onClick={handleClaim}
                            disabled={claiming || (data?.totalEarnedSats || 0) === 0}
                            className={clsx(
                                "w-full py-5 rounded-[1.8rem] font-black uppercase text-sm tracking-widest transition-all relative overflow-hidden group",
                                (data?.totalEarnedSats || 0) > 0 
                                    ? "bg-white text-black shadow-[0_15px_40px_rgba(255,255,255,0.15)] active:scale-95" 
                                    : "bg-white/5 text-white/20 border border-white/5 opacity-50"
                            )}
                        >
                            {claiming ? (
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Claim Rewards</span>
                                </div>
                            )}
                            {(data?.totalEarnedSats || 0) > 0 && !claiming && (
                                <motion.div 
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                            )}
                        </button>
                    </div>
                </div>

                {/* --- TABS --- */}
                <div className="flex p-1.5 bg-[#121213] border border-white/5 rounded-2xl">
                    {['OVERVIEW', 'PARTNERS'].map((tab: any) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                                activeTab === tab ? "bg-white/10 text-white shadow-xl" : "text-white/20"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* --- CONTENT AREA --- */}
                <AnimatePresence mode="wait">
                    {activeTab === 'OVERVIEW' ? (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#121213] p-6 rounded-[2.2rem] border border-white/5 flex flex-col justify-between h-36">
                                    <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                                        <Users className="w-5 h-5 text-white/40" />
                                    </div>
                                    <div>
                                        <span className="text-3xl font-black text-white italic tracking-tighter">{data?.stats?.totalInvited}</span>
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mt-1">Direct Referrals</span>
                                    </div>
                                </div>
                                <div className="bg-[#121213] p-6 rounded-[2.2rem] border border-white/5 flex flex-col justify-between h-36 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/5 transition-colors" />
                                    <div className="w-10 h-10 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                                        <Zap className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-3xl font-black text-green-400 italic tracking-tighter">{data?.stats?.activeMiners}</span>
                                        <span className="text-[8px] font-black text-green-400/50 uppercase tracking-[0.2em] block mt-1">Active Miners</span>
                                    </div>
                                </div>
                            </div>

                            {/* Invite Section */}
                            <div className="bg-[#121213] border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl">
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Your Network Link</p>
                                    <Share2 className="w-3 h-3 text-white/10" />
                                </div>
                                
                                <div className="relative">
                                    <button 
                                        onClick={copyLink}
                                        className="w-full bg-black/40 border border-white/5 py-5 px-6 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all group overflow-hidden"
                                    >
                                        <span className="text-xs font-bold text-[#FFB800] truncate mr-4 italic font-mono tracking-tight">
                                            {data?.referralLink}
                                        </span>
                                        <Copy className="w-4 h-4 text-white/40 group-active:text-[#FFB800] transition-colors" />
                                    </button>
                                </div>
                                
                                <p className="text-[9px] text-center text-white/20 font-bold uppercase tracking-wider leading-relaxed">
                                    Earn rewards from every active card <br/> in your first line of referrals.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="partners"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {partners.length === 0 ? (
                                <div className="text-center py-20 bg-[#121213] rounded-[3rem] border border-white/5 border-dashed">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-white/10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Empty pool</p>
                                </div>
                            ) : (
                                partners.map((p: any) => (
                                    <div key={p.id} className="bg-[#121213] border border-white/5 p-5 rounded-[1.8rem] flex items-center justify-between active:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-lg font-black text-[#FFB800] border border-white/5 shadow-inner">
                                                {p.username ? p.username[0].toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white tracking-tight">{p.username || 'Anonymous'}</p>
                                                <p className="text-[10px] font-bold text-white/20 uppercase">Joined {new Date(p.registeredAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            p.isActive 
                                                ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                                : "bg-white/5 text-white/20 border-white/5"
                                        )}>
                                            {p.isActive ? 'Mining' : 'Idle'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReferralScreen;