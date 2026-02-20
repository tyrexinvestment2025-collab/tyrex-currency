// src/hooks/useTelegram.ts
import WebApp from '@twa-dev/sdk';
import { useEffect, useState } from 'react';
import { useTyrexStore } from '../store/useTyrexStore';
import { authApi, userApi, cardsApi } from '../api/tyrexApi';

interface ITelegramUser {
    tgId?: any;
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code: string;
}

export function useTelegram() {
    const tg = WebApp;
    const setInitialData = useTyrexStore(state => state.setInitialData);
    const loadCardTypes = useTyrexStore(state => state.loadCardTypes);
    const [token, setToken] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    const onClose = () => tg.close();
    const onToggleButton = () => {
        if (tg.MainButton.isVisible) tg.MainButton.hide();
        else tg.MainButton.show();
    }
    
    const refreshAllData = async () => {
        // 1. Грузим Профиль (Самое важное)
        let currentBtcPrice = 96500;
        let profileData = null;
        
        try {
            profileData = await userApi.getProfile();
            if (profileData) {
                // Если курс пришел, берем его
                if (profileData.btcPrice) currentBtcPrice = profileData.btcPrice;
                
                // Проверяем, есть ли карты в профиле, если нет - пытаемся догрузить отдельно
                let userCards = profileData.cards;
                if (!userCards || !Array.isArray(userCards)) {
                    console.log("Cards missing in profile, fetching separately...");
                    const myCards = await cardsApi.getMyCards();
                    userCards = myCards;
                }

                // Собираем полный объект
                const fullUserData = {
                    ...profileData,
                    cards: userCards || []
                };

                // Обновляем Стор
                setInitialData(fullUserData, currentBtcPrice);
            }
        } catch (error) {
            console.error("Error updating user data:", error);
        }

        // 2. Грузим Маркет (Независимо от профиля)
        try {
            const marketData = await cardsApi.getMarketTypes();
            if (Array.isArray(marketData)) {
                loadCardTypes(marketData, currentBtcPrice);
            }
        } catch (error) {
            console.error("Error updating market:", error);
        }
    };

    const initializeAuth = async () => {
        const initData = tg.initData;
        
        // ДЛЯ ТЕСТОВ В БРАУЗЕРЕ (Если ты тестируешь не в телеге, раскомментируй и вставь строку)
        // if (!initData) { console.warn("No initData"); return; }

        if (initData) {
            const loginData = await authApi.login(initData);
            if (loginData.token) {
                setToken(loginData.token);
                setUserProfile(loginData.user);
                // Загружаем данные сразу после логина
                await refreshAllData();
            }
        }
    };

    useEffect(() => {
        tg.ready();
        initializeAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        onClose,
        onToggleButton,
        tg,
        user: tg.initDataUnsafe?.user as ITelegramUser,
        queryId: tg.initDataUnsafe?.query_id,
        token,
        userProfile,
        refreshAllData
    }
}