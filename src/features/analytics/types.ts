/** Ответы /analytics/* */
export type MetricKey = 'yield' | 'growth' | 'passive' | 'liquidity' | 'entry' | 'safety';
export type Scores = Record<MetricKey, number>;
export type Benchmark = Scores & { subject: string };
export type ScenarioKey = 'bear' | 'base' | 'bull';
export type AssetGroup = 'traditional' | 'crypto';

export interface IncomeDay { date: string; cardsUsd: number; referralUsd: number }
export interface IncomeMonth { month: string; cardsUsd: number; referralUsd: number }
export interface IncomeSeries { name: string; receivedUsd: number; pendingUsd: number }

export interface Income {
    totalUsd: number;
    cardsUsd: number;
    partnersUsd: number;
    receivedUsd: number;
    pendingUsd: number;
    investedUsd: number;
    returnPct: number;
    daily: IncomeDay[];
    byMonth: IncomeMonth[];
    bySeries: IncomeSeries[];
}

export interface Upcoming {
    cardId: string;
    name: string;
    serial: number;
    kind: 'payout' | 'trialEnd';
    at: string;
    amountUsd: number;
    profitUsd: number;
    remind: boolean;
}

export interface Dashboard {
    marketSentiment?: { value: number; status: string };
    btcPrice: number | null;
    analytics: {
        currentBalance: number;
        cardsValueUsd: number;
        financialGoal: number;
        baseApy: number;
        activeNodes: number;
        metrics: MetricKey[];
        benchmarks: Record<AssetGroup, Benchmark[]>;
        userScore: Scores;
        scoresUpdatedAt: string;
        scenarios: Record<ScenarioKey, number>;
        income: Income;
        upcoming: Upcoming[];
    };
}

export interface Market {
    range: string;
    points: [number, number][];
    changePct: number;
    change24hPct: number;
    high: number;
    low: number;
    price: number | null;
}

export interface Quiz {
    date: string;
    id: string;
    question: string;
    options: string[];
    answer?: number;
    explain?: string;
    given?: number;
    correct?: boolean;
    stats?: { total: number; correct: number };
}

export const METRIC_KEYS: MetricKey[] = ['yield', 'growth', 'passive', 'liquidity', 'entry', 'safety'];
export const SCENARIO_KEYS: ScenarioKey[] = ['bear', 'base', 'bull'];
