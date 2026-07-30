import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const SATS_IN_BTC = 100000000;

export interface TyrexCard {
    id: string;
    cardTypeId: string;
    name: string;
    nominalBtc: number;
    purchasePriceUsd: number;
    clientAPY: number;
    referralAPY: number;
    status: 'Inactive' | 'Active' | 'Cooling' | 'Finished' | 'OnSale';
    boughtAtTimestamp: number;
    currentProfitUsd: number;
    unlockTimestamp?: number;
    serialNumber?: number;
    imageUrl?: string;
    listingPriceUsd?: number;
}

export interface TyrexCardType {
    id: string;
    name: string;
    nominalBtcDisplay: string;
    nominalSats: number;
    priceUSDT: number;
    clientAPY: string;
    referralAPY: string;
    available: number;
    maxSupply: number;
    isAvailable: boolean;
    imageUrl?: string;
}

interface TyrexState {
    btcPrice: number;
    isPriceLive: boolean; // Флаг: получили ли мы живую цену (из сокетов или кеша)
    balance: {
        walletUsd: number;
        stakingBTC: number;
        totalBTC: number;
        walletSats: number;
        referralSats: number;
        totalProfitUsd: number;
        pendingWithdrawalUsd: number;
    };
    cards: TyrexCard[];
    marketCardTypes: TyrexCardType[];
    userProfile: {
        isTrialActivated: boolean;
        trialActivatedAt?: string;
    } | null;
    
    updateBtcPrice: (price: number) => void;
    setInitialData: (userData: any, currentBtcPrice?: number) => void;
    loadCardTypes: (typesData: any[], currentBtcPrice: number) => void;
    simulateDailyInterest: () => void;
}

const parseVal = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'object') {
        if (value['$numberDecimal']) return parseFloat(value['$numberDecimal']);
        if (value.toString) return parseFloat(value.toString()) || 0;
        return 0;
    }
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
};

export const useTyrexStore = create<TyrexState>()(
    persist(
        (set, _get) => ({
            userProfile: null,
            btcPrice: 0,
            isPriceLive: false,
            balance: {
                walletUsd: 0, walletSats: 0, referralSats: 0,
                stakingBTC: 0, totalBTC: 0, pendingWithdrawalUsd: 0, totalProfitUsd: 0,
            },
            cards: [],
            marketCardTypes: [],

            updateBtcPrice: (price: number) => set((state) => {
                if (!price || price === state.btcPrice) return {};
                
                const updatedMarket = state.marketCardTypes.map(type => ({
                    ...type,
                    priceUSDT: Math.round((type.nominalSats / SATS_IN_BTC) * price)
                }));
                
                return { 
                    btcPrice: price, 
                    marketCardTypes: updatedMarket,
                    isPriceLive: true // Цена теперь живая
                };
            }),

            loadCardTypes: (typesData: any[], currentBtcPrice: number) => set((state) => {
                if (!Array.isArray(typesData)) return {};
                // Если у нас уже есть живая цена, игнорируем ту, что пришла в списке типов
                const price = state.isPriceLive ? state.btcPrice : (currentBtcPrice || state.btcPrice);
                
                const marketCards = typesData.map(type => {
                    const nominalSats = parseVal(type.nominalSats);
                    const nominalBtc = nominalSats / SATS_IN_BTC;
                    return {
                        id: type._id || type.id,
                        name: type.name,
                        imageUrl: type.imageUrl,
                        nominalBtcDisplay: `${nominalBtc.toFixed(8)} BTC`,
                        nominalSats: nominalSats,
                        priceUSDT: price > 0 ? Math.round(nominalBtc * price) : (parseVal(type.priceUSDT) || 0),
                        clientAPY: `${type.clientAPY}%`,
                        referralAPY: `${type.referralAPY || 0}%`,
                        available: type.available,
                        maxSupply: type.maxSupply || 100,
                        isAvailable: type.isActive && type.available > 0,
                    };
                });
                return { marketCardTypes: marketCards, btcPrice: price };
            }),

            setInitialData: (userData, currentBtcPrice) => set((state) => {
                if (!userData) return {};
                const balanceObj = userData.balance || {};
                
                // ПРОВЕРКА: Если цена в приложении уже "живая", не позволяем серверу
                // перезаписать её старым значением из профиля
                const price = state.isPriceLive ? state.btcPrice : (currentBtcPrice || state.btcPrice);
                
                const userCards = Array.isArray(userData.cards) ? userData.cards : [];

                const updatedCards: TyrexCard[] = userCards.map((card: any) => {
                    const rawTypeId = card.cardTypeId?._id || card.cardTypeId;
                    const cardType = (card.cardTypeId && typeof card.cardTypeId === 'object')
                        ? card.cardTypeId : { name: 'Miner', clientAPY: 0, referralAPY: 0, imageUrl: '' };

                    return {
                        id: card._id,
                        cardTypeId: String(rawTypeId),
                        name: cardType.name || 'Unknown',
                        nominalBtc: parseVal(card.nominalSats) / SATS_IN_BTC,
                        purchasePriceUsd: parseVal(card.purchasePriceUsd),
                        clientAPY: parseVal(cardType.clientAPY),
                        referralAPY: parseVal(cardType.referralAPY),
                        status: card.status,
                        boughtAtTimestamp: new Date(card.createdAt).getTime(),
                        currentProfitUsd: parseVal(card.currentProfitUsd),
                        unlockTimestamp: card.unlockAt ? new Date(card.unlockAt).getTime() : undefined,
                        serialNumber: card.serialNumber,
                        imageUrl: card.imageUrl || cardType.imageUrl || ''
                    };
                });

                return {
                    btcPrice: price,
                    balance: {
                        walletUsd: parseVal(balanceObj.walletUsd),
                        walletSats: balanceObj.walletSats || 0,
                        referralSats: balanceObj.referralSats || 0,
                        stakingBTC: updatedCards.filter(c => c.status === 'Active').reduce((sum, c) => sum + c.nominalBtc, 0),
                        totalBTC: updatedCards.reduce((sum, c) => sum + c.nominalBtc, 0),
                        pendingWithdrawalUsd: parseVal(balanceObj.pendingWithdrawalUsd),
                        totalProfitUsd: parseVal(balanceObj.totalProfitUsd)
                    },
                    userProfile: {
                        isTrialActivated: userData.isTrialActivated,
                        trialActivatedAt: userData.trialActivatedAt
                    },
                    cards: updatedCards
                };
            }),

            simulateDailyInterest: () => set((state) => { return state; }),
        }),
        {
            name: 'tyrex-v2-storage', // Новое имя ключа для чистого старта
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                btcPrice: state.btcPrice,
                isPriceLive: state.isPriceLive,
                balance: state.balance
            }),
        }
    )
);