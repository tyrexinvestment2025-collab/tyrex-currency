import { create } from 'zustand';

const SATS_IN_BTC = 100000000; 

export interface TyrexCard {
  id: string;
  name: string;
  nominalBtc: number;       
  purchasePriceUsd: number; 
  clientAPY: number;
  referralAPY: number;
  status: 'Inactive' | 'Active' | 'Cooling' | 'Finished';
  boughtAtTimestamp: number;
  currentProfitUsd: number; 
  unlockTimestamp?: number;
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
    isAvailable: boolean;
}

interface TyrexState {
  btcPrice: number; 
  balance: {
    walletUsd: number;      
    stakingBTC: number; // Только то, что работает (Active)
    totalBTC: number;   // НОВОЕ: Всё вместе (Active + Inactive)
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
    stakingBTC: 0,
    totalBTC: 0, // Инициализация
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
              nominalBtcDisplay: `${nominalBtc.toFixed(8)} BTC`, 
              nominalSats: nominalSats,
              priceUSDT: parseVal(type.priceUSDT) || (nominalBtc * price), 
              clientAPY: `${type.clientAPY}%`, 
              referralAPY: `${type.referralAPY || 0}%`,
              available: type.available,
              isAvailable: type.isActive && type.available > 0,
          };
      });
      return { marketCardTypes: marketCards, btcPrice: price };
  }),

  setInitialData: (userData, currentBtcPrice) => set((state) => {
    if (!userData) return {};
      
    const balanceObj = userData.balance || {};
    const price = (currentBtcPrice && currentBtcPrice > 0) ? currentBtcPrice : state.btcPrice;
    
    const wUsd = parseVal(balanceObj.walletUsd);
    const pUsd = parseVal(balanceObj.pendingWithdrawalUsd);
    const profitUsd = parseVal(balanceObj.totalProfitUsd);

    const userCards = Array.isArray(userData.cards) ? userData.cards : [];
    
    // Переменные для подсчета
    let miningBTC = 0; // То, что работает
    let allBTC = 0;    // То, что куплено (работает + лежит)

    const updatedCards = userCards.map((card: any) => {
          const cardType = (card.cardTypeId && typeof card.cardTypeId === 'object') 
              ? card.cardTypeId 
              : { name: 'Miner', clientAPY: 0, referralAPY: 0 };

          const nominalSats = parseVal(card.nominalSats);
          const nominalBtc = nominalSats / SATS_IN_BTC;

          // 1. Считаем АКТИВНЫЕ для "В майнинге"
          if (card.status === 'Active') {
              miningBTC += nominalBtc;
          }

          // 2. Считаем ВСЕ купленные (Active + Inactive) для Главного баланса
          // Cooling и Finished обычно уже не считаются "текущим" капиталом, но Inactive - это ваши деньги
          if (card.status === 'Active' || card.status === 'Inactive') {
              allBTC += nominalBtc;
          }

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
          };
    });
    
    return { 
          btcPrice: price,
          balance: {
              walletUsd: wUsd,
              stakingBTC: miningBTC, // Маленькая цифра (только майнинг)
              totalBTC: allBTC,      // Большая цифра (все купленные)
              pendingWithdrawalUsd: pUsd,
              totalProfitUsd: profitUsd
          }, 
          cards: updatedCards 
    };
  }),
  
  simulateDailyInterest: () => set((state) => { return state; }),
}));