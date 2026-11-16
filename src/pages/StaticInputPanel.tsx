import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, TrendingUp, Target, Users, BarChart3, Rocket, Info, Edit2 } from 'lucide-react';
import clsx from 'clsx';
import { fmtUsd, fmtPct } from '../lib/format';
import type { PedalId, Pedals } from '../constants/AnalyticsConfig';

export type InputField = 'principal' | 'reinvest' | 'goal';

export interface ForecastConfig {
    principal: number;
    reinvest: number;
    goal: number;
    pedals: Pedals;
}

// --- БЛОК ВВОДУ ---
export const NumericalInputsHUD = ({ config, onOpenSelector }: { config: ForecastConfig; onOpenSelector: (field: InputField) => void }) => {
    const { t } = useTranslation('analytics');
    const rows: { key: InputField; color: string }[] = [
        { key: 'principal', color: 'text-white' },
        { key: 'reinvest', color: 'text-white' },
        { key: 'goal', color: 'text-[#FFB700]' },
    ];
    return (
        <div className="bg-[#141414] border border-[#222222] rounded-xl overflow-hidden divide-y divide-[#222222] shadow-2xl">
            {rows.map((item) => (
                <button
                    key={item.key}
                    onClick={() => onOpenSelector(item.key)}
                    className="w-full px-5 py-3.5 flex justify-between items-center gap-3 active:bg-white/[0.02] transition-all"
                >
                    <span className="text-[13px] font-medium text-[#808080] uppercase tracking-wide text-left">{t(`fields.${item.key}`)}</span>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className={clsx("text-lg font-bold tracking-tight", item.color)}>
                            {fmtUsd(config[item.key], 0)}
                        </span>
                        <Edit2 size={14} className="text-[#FFB700] opacity-40" />
                    </div>
                </button>
            ))}
        </div>
    );
};

interface PedalListProps {
    config: ForecastConfig;
    setConfig: Dispatch<SetStateAction<ForecastConfig>>;
    onOpenInfo: (id: PedalId) => void;
    /** Значение, которое подставляется при включении параметра «Доход нод» */
    yieldValue: number;
}

// --- ПАРАМЕТРИ СЦЕНАРІЮ ---
export const PedalList = ({ config, setConfig, onOpenInfo, yieldValue }: PedalListProps) => {
    const { t } = useTranslation('analytics');
    // Значения при включении. Все, кроме дохода нод, — гипотетические допущения пользователя.
    const BOOSTER_DEFS: { id: PedalId; val: number; icon: ReactNode }[] = [
        { id: 'yield', val: yieldValue, icon: <Zap size={16} /> },
        { id: 'boosters', val: 2, icon: <Rocket size={16} /> },
        { id: 'spec', val: 5, icon: <BarChart3 size={16} /> },
        { id: 'btc', val: 10, icon: <TrendingUp size={16} /> },
        { id: 'ref', val: 2, icon: <Users size={16} /> },
        { id: 'bonus', val: 2, icon: <Target size={16} /> },
    ];

    const togglePedal = (id: PedalId, value: number) => {
        setConfig(prev => ({
            ...prev,
            pedals: { ...prev.pedals, [id]: prev.pedals[id] === 0 ? value : 0 }
        }));
    };

    return (
        <div className="mt-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#808080] ml-1 mb-2">
                {t('pedals.title')}
            </p>
            {BOOSTER_DEFS.map((booster) => {
                const current = config.pedals[booster.id];
                const isActive = current > 0;
                return (
                    <div
                        key={booster.id}
                        className={clsx(
                            "min-h-[52px] w-full rounded-xl border transition-all duration-500 flex items-center justify-between gap-2 px-4",
                            isActive
                                ? "bg-[#141414] border-[#FFB700] shadow-[0_0_15px_rgba(255,183,0,0.1)]"
                                : "bg-[#141414] border-[#222222] opacity-60"
                        )}
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div className={clsx("transition-all duration-500 shrink-0", isActive ? "text-[#FFB700] drop-shadow-[0_0_8px_#FFB700]" : "text-[#555555]")}>
                                {booster.icon}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={clsx("text-[13px] font-bold leading-tight truncate", isActive ? "text-white" : "text-[#555555]")}>
                                    {t(`pedals.${booster.id}.label`)}
                                </span>
                                <span className={clsx("text-[11px] font-medium mt-0.5", isActive ? "text-[#FFB700]" : "text-[#555555]")}>
                                    {isActive ? `+${fmtPct(current, 1)}` : fmtPct(booster.val, 1)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={() => onOpenInfo(booster.id)} className="p-1 text-[#555555] hover:text-white transition-colors" aria-label={t('info.title')}>
                                <Info size={14} />
                            </button>
                            <button
                                onClick={() => togglePedal(booster.id, booster.val)}
                                role="switch"
                                aria-checked={isActive}
                                aria-label={t(`pedals.${booster.id}.label`)}
                                className={clsx(
                                    "w-10 h-5 rounded-full relative transition-all duration-300 border",
                                    isActive ? "bg-[#FFB700] border-[#FFB700]" : "bg-[#222222] border-[#222222]"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all duration-300",
                                    isActive ? "left-[22px]" : "left-1"
                                )} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
