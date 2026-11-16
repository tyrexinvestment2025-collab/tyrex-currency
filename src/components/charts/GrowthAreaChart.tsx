import { memo, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
    ReferenceLine, Tooltip as RechartsTooltip, CartesianGrid, Label
} from 'recharts';
import { Settings2, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { fmtUsd, fmtPct } from '../../lib/format';
import { PEDAL_IDS, type PedalId } from '../../constants/AnalyticsConfig';
import type { ForecastConfig } from '../../pages/StaticInputPanel';

export interface GrowthPointDatum {
    month: number;
    monthLabel: string;
    dateLabel: string;
    value: number;
}

interface GrowthAreaChartProps {
    data: GrowthPointDatum[];
    goal: number;
    targetMonth: number;
    pedals: ForecastConfig['pedals'];
    setPedals: Dispatch<SetStateAction<ForecastConfig>>;
}

interface TooltipContentProps {
    active?: boolean;
    payload?: { payload: GrowthPointDatum }[];
}

const ChartTooltip = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-[#1C1C1C] p-3 rounded-xl border-2 border-[#FFB800] shadow-2xl">
            <p className="text-[10px] font-black text-[#FFB800] mb-1">{d.dateLabel}</p>
            <p className="text-base font-black text-white">{fmtUsd(d.value, 0)}</p>
            <p className="text-[9px] text-white/30 uppercase">{d.monthLabel}</p>
        </div>
    );
};

const compact = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

const GrowthAreaChart = memo(({ data, goal, targetMonth, pedals, setPedals }: GrowthAreaChartProps) => {
    const { t } = useTranslation('analytics');
    const [isOpen, setIsOpen] = useState(false);

    const setPedal = (key: PedalId, value: number) =>
        setPedals(prev => ({ ...prev, pedals: { ...prev.pedals, [key]: value } }));

    return (
        <div className="relative w-full bg-[#151517] rounded-[2rem] p-4 border border-white/10 overflow-hidden min-h-[320px] shadow-2xl">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label={t('forecast.fineTune')}
                    className="absolute top-3 right-3 z-20 p-3 bg-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,0.4)] active:scale-95 rounded-full transition-all"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            )}

            <div className={clsx("h-[280px] w-full transition-all duration-500", isOpen && "blur-md opacity-20")}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FFB800" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                        <XAxis dataKey="monthLabel" stroke="#888" fontSize={9} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(data.length / 5))} />
                        <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
                        <RechartsTooltip content={<ChartTooltip />} />
                        <ReferenceLine y={goal} stroke="#FFB800" strokeDasharray="5 5" strokeOpacity={0.5} />
                        {targetMonth > 0 && targetMonth < data.length && (
                            <ReferenceLine x={data[targetMonth]?.monthLabel} stroke="#FFB800" strokeWidth={3}>
                                <Label value={t('forecast.goalMarker')} position="top" fill="#FFB800" fontSize={10} fontWeight="900" />
                            </ReferenceLine>
                        )}
                        <Area type="monotone" dataKey="value" stroke="#FFB800" fill="url(#colorGrowth)" strokeWidth={3} animationDuration={1000} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className="absolute inset-0 z-30 bg-black/95 p-5 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-black uppercase text-[#FFB800] tracking-widest">{t('forecast.fineTune')}</h4>
                            <button onClick={() => setIsOpen(false)} aria-label={t('info.close')} className="p-2 bg-white/10 rounded-full text-white"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                            {PEDAL_IDS.map((key) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                                        <span className="text-white/40">{t(`pedals.${key}.label`)}</span>
                                        <span className="text-[#FFB800] bg-[#FFB800]/10 px-2 py-1 rounded-lg">{fmtPct(pedals[key], 1)}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="50" step="0.5" value={pedals[key]}
                                        onChange={(e) => setPedal(key, Number(e.target.value))}
                                        className="w-full h-2 accent-[#FFB800] bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
});

GrowthAreaChart.displayName = 'GrowthAreaChart';

export default GrowthAreaChart;
