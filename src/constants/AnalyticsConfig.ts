import type { LucideIcon } from 'lucide-react';
import {
    Building2, Landmark, LineChart, Coins, Briefcase,
    PieChart, Layers, Pickaxe, MousePointer2, Zap, LayoutGrid, Signal
} from 'lucide-react';

/**
 * Конфигурация экрана аналитики. Все тексты — в src/locales/<lang>/analytics.json:
 *  - assets.<id>.label / assets.<id>.conclusion
 *  - metrics.<key>.axis / title / short / full
 *  - tabs.<id>.label / header / description
 *  - pedals.<id>.label / description
 */

/** Метрики сравнения — совпадают с полями бенчмарков на бэке */
export const METRIC_KEYS = ['yield', 'growth', 'passive', 'liquidity', 'entry', 'safety'] as const;
export type MetricKey = typeof METRIC_KEYS[number];

export interface AssetDef {
    /** Совпадает с полем subject в бенчмарках бэка */
    id: string;
    icon: LucideIcon;
}

export const CATEGORY_ASSETS: Record<'traditional' | 'crypto', AssetDef[]> = {
    traditional: [
        { id: 'Real Estate', icon: Building2 },
        { id: 'Bank Deposit', icon: Landmark },
        { id: 'S&P 500', icon: LineChart },
        { id: 'Gold', icon: Coins },
        { id: 'Business', icon: Briefcase },
        { id: 'Funds', icon: PieChart },
    ],
    crypto: [
        { id: 'Staking', icon: Layers },
        { id: 'Mining', icon: Pickaxe },
        { id: 'Trading', icon: MousePointer2 },
        { id: 'Altcoins', icon: Zap },
        { id: 'Bots', icon: LayoutGrid },
        { id: 'Signals', icon: Signal },
    ]
};

export const TAB_IDS = ['radar_trad', 'radar_crypto', 'forecast'] as const;
export type TabId = typeof TAB_IDS[number];

export const PEDAL_IDS = ['yield', 'boosters', 'spec', 'btc', 'ref', 'bonus'] as const;
export type PedalId = typeof PEDAL_IDS[number];
export type Pedals = Record<PedalId, number>;
