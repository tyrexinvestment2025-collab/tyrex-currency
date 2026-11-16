import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fmtUsd, fmtPct, usdToBtc } from '../../lib/format';
import type { StructureSlice } from '../../utils/structureMath';

interface InvestmentStructureChartProps {
    data: StructureSlice[];
    totalValue: number;
    btcPrice: number;
}

const InvestmentStructureChart = memo(({ data, totalValue, btcPrice }: InvestmentStructureChartProps) => {
    const { t } = useTranslation('analytics');
    // Без курса — 0, а не выдуманная цена
    const btcValue = usdToBtc(totalValue, btcPrice);

    return (
        <div className="relative w-full flex flex-col items-center">
            <div className="h-[280px] w-full relative">
                {/* ЦЕНТР БУБЛИКА */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{t('structure.total')}</p>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-black text-white">{btcValue.toFixed(4)}</span>
                        <span className="text-xs font-bold text-[#FDB931]">BTC</span>
                    </div>
                    <p className="text-sm font-bold text-white/60">{fmtUsd(totalValue, 0)}</p>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={800}
                            radius={10}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1C1C1C', border: 'none', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value?: number) => [fmtUsd(value || 0, 0)]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* ЛЕГЕНДА С ПРОЦЕНТАМИ */}
            <div className="grid grid-cols-1 gap-3 w-full mt-4 px-4">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-bold text-white/60 uppercase">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-white">
                            {fmtPct(totalValue > 0 ? (item.value / totalValue) * 100 : 0, 1)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

InvestmentStructureChart.displayName = 'InvestmentStructureChart';

export default InvestmentStructureChart;