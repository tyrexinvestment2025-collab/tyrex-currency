import { useState, useEffect } from 'react';
import { onboardingSteps } from '../config/onboardingSteps';
import { useTelegram } from './useTelegram'; // Импортируем, чтобы знать, кто вошел

export const useOnboarding = () => {
  const { userProfile } = useTelegram(); // Получаем данные текущего юзера
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // 1. Ждем, пока профиль загрузится с сервера
    if (!userProfile || !userProfile._id) return;

    // 2. Формируем УНИКАЛЬНЫЙ ключ для этого пользователя
    // Например: "tyrex_onboarding_completed_65d4f..."
    const userKey = `tyrex_onboarding_completed_${userProfile._id}`;
    
    const hasCompleted = localStorage.getItem(userKey);

    // 3. Если для ЭТОГО id записи нет — запускаем
    if (hasCompleted !== 'true') {
      setIsActive(true);
    }
  }, [userProfile]); // Эффект сработает, как только userProfile прилетит с бекенда

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    setIsActive(false);
    if (userProfile && userProfile._id) {
        // Запоминаем, что именно ЭТОТ юзер прошел обучение
        const userKey = `tyrex_onboarding_completed_${userProfile._id}`;
        localStorage.setItem(userKey, 'true');
    }
  };

  return {
    isOnboardingActive: isActive,
    currentOnboardingStep: onboardingSteps[currentStep],
    isLastStep: currentStep === onboardingSteps.length - 1,
    nextOnboardingStep: nextStep,
    finishOnboarding,
  };
};