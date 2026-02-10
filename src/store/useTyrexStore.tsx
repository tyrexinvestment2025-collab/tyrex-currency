import { create } from 'zustand';

const SATS_IN_BTC = 100000000; 

export interface TyrexCard {
  id: string;
  name: string;
  nominalBtc: number;       
  purchasePriceUsd: number; 
  clientAPY: number;
  referralAPY: number;
  status: 'Inactive' | 'Active' | 'Cooling' | 'Finished' | 'OnSale'; // <--- Добавили OnSale
  boughtAtTimestamp: number;
  currentProfitUsd: number; 
  unlockTimestamp?: number;
  serialNumber?: number; 
  imageUrl?: string;
  listingPriceUsd?: number; // <--- НОВОЕ
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
    maxSupply: number; // НОВОЕ
    isAvailable: boolean;
    imageUrl?: string;
}

interface TyrexState {
  btcPrice: number; 
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

export const useTyrexStore = create<TyrexState>((set, _get) => ({
  btcPrice: 96500, 
  
 balance: {
    walletUsd: 0,
    walletSats: 0,
    referralSats: 0,
    stakingBTC: 0,
    totalBTC: 0,
    pendingWithdrawalUsd: 0,
    totalProfitUsd: 0,
  },
  cards: [],
  marketCardTypes: [],
  
  loadCardTypes: (typesData: any[], currentBtcPrice: number) => set((state) => {
      if (!Array.isArray(typesData)) return {};

      const price = (currentBtcPrice && currentBtcPrice > 0) ? currentBtcPrice : state.btcPrice;
      const marketCards = typesData.map(type => {
          const nominalSats = parseVal(type.nominalSats);
          const nominalBtc = nominalSats / SATS_IN_BTC;
          return {
              id: type._id,
              name: type.name,
              imageUrl: type.imageUrl,
              nominalBtcDisplay: `${nominalBtc.toFixed(8)} BTC`, 
              nominalSats: nominalSats,
              priceUSDT: parseVal(type.priceUSDT) || (nominalBtc * price), 
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
    const price = (currentBtcPrice && currentBtcPrice > 0) ? currentBtcPrice : state.btcPrice;
    const userCards = Array.isArray(userData.cards) ? userData.cards : [];
    
    const updatedCards: TyrexCard[] = userCards.map((card: any) => {
        // Добавляем imageUrl в объект по умолчанию на случай ошибки
        const cardType = (card.cardTypeId && typeof card.cardTypeId === 'object') 
            ? card.cardTypeId 
            : { name: 'Miner', clientAPY: 0, referralAPY: 0, imageUrl: '' };

        const nominalSats = parseVal(card.nominalSats);
        const nominalBtc = nominalSats / SATS_IN_BTC;

        return {
            id: card._id,
            name: cardType.name || 'Unknown',
            nominalBtc: nominalBtc,
            purchasePriceUsd: parseVal(card.purchasePriceUsd),
            clientAPY: parseVal(cardType.clientAPY),
            referralAPY: parseVal(cardType.referralAPY),
            status: card.status,
            boughtAtTimestamp: new Date(card.createdAt).getTime(),
            currentProfitUsd: parseVal(card.currentProfitUsd),
            unlockTimestamp: card.unlockAt ? new Date(card.unlockAt).getTime() : undefined,
            serialNumber: card.serialNumber,
            // Сначала смотрим картинку в самой карте (UserCard), потом в типе (CardType)
            imageUrl: card.imageUrl || cardType.imageUrl || '' 
        };
    });
    
    return { 
        btcPrice: price,
        balance: {
            
            walletUsd: parseVal(balanceObj.walletUsd),
            walletSats: balanceObj.walletSats || 0,     // НОВОЕ
            referralSats: balanceObj.referralSats || 0, // НОВОЕ
            stakingBTC: updatedCards
                .filter(c => c.status === 'Active')
                .reduce((sum, c) => sum + c.nominalBtc, 0),
            totalBTC: updatedCards.reduce((sum, c) => sum + c.nominalBtc, 0),
            pendingWithdrawalUsd: parseVal(balanceObj.pendingWithdrawalUsd),
            totalProfitUsd: parseVal(balanceObj.totalProfitUsd)
        }, 
        cards: updatedCards 
    };
}),
  
  simulateDailyInterest: () => set((state) => { return state; }),
}));