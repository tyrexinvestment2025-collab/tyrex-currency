import type { TFunction } from 'i18next';

export const PARTNER_STATUSES = ['NOT_ACTIVATED', 'WAITING', 'INVEST', 'GROW', 'WORKING', 'UNKNOWN'] as const;
export type PartnerStatus = typeof PARTNER_STATUSES[number];

export interface PartnerInventoryItem { name: string; serial: number; status?: string; isTrial?: boolean }

export interface Partner {
    id: string;
    username?: string;
    tgUsername?: string;
    photo_url?: string;
    registrationDate: string;
    status?: PartnerStatus;
    statusParams?: { daysLeft?: number };
    statusColor?: string;
    myProfitFromHimBTC?: string;
    myProfitFromHimSats?: number;
    lastRewardDate?: string | null;
    inventory?: { bought?: PartnerInventoryItem[]; staked?: PartnerInventoryItem[] };
    chartData?: { date: string; val: number }[];
}

export interface ReferralInfo {
    isLocked: boolean;
    referralLink?: string;
    totalEarnedSats?: number;
    referralApyMin?: number;
    referralApyMax?: number;
    stats?: { totalInvited: number; investorsCount: number; nonInvestorsCount: number; totalPartnerCapital: number };
}

export const normalizeStatus = (s?: string): PartnerStatus =>
    (PARTNER_STATUSES as readonly string[]).includes(s || '') ? (s as PartnerStatus) : 'UNKNOWN';

/** Переведённые подпись и описание статуса партнёра (бэк отдаёт код) */
export const partnerStatusText = (p: Partner, t: TFunction) => {
    const status = normalizeStatus(p.status);
    const count = p.statusParams?.daysLeft ?? 0;
    return {
        status,
        label: t(`referral:status.${status}.label`, { count }),
        description: t(`referral:status.${status}.description`, { count }),
        color: p.statusColor || '#94A3B8',
    };
};
