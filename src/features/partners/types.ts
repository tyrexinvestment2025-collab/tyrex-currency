/** Данные реферальной программы с бэка (/referrals/info, /referrals/list) */
export interface ReferralInfo {
    isLocked: boolean;
    referralLink?: string;
    totalEarnedSats?: number;
    referralApyMin?: number;
    referralApyMax?: number;
    stats?: { totalInvited: number; investorsCount: number; nonInvestorsCount: number; totalPartnerCapital: number };
}

export interface PartnerItem {
    id: string;
    username?: string;
    tgUsername?: string | null;
    registrationDate: string;
    status?: string;
    myProfitFromHimSats?: number;
    lastRewardDate?: string | null;
}

/** Простой статус партнёра для пользователя */
export type SimpleStatus = 'registered' | 'gift' | 'bought' | 'working';

export const simpleStatus = (status?: string): SimpleStatus => {
    switch (status) {
        case 'WORKING': return 'working';
        case 'GROW': return 'bought';
        case 'WAITING':
        case 'INVEST': return 'gift';
        default: return 'registered';
    }
};
