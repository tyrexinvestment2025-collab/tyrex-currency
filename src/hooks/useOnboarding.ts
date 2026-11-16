import { useState } from 'react';
import { onboardingSteps } from '../config/onboardingSteps';
import { useTelegram } from './useTelegram';

const keyFor = (userId: string) => `tyrex_onboarding_completed_${userId}`;

const isCompleted = (userId: string): boolean => {
  try { return localStorage.getItem(keyFor(userId)) === 'true'; } catch { return false; }
};

export const useOnboarding = () => {
  const { userProfile } = useTelegram();
  const userId = userProfile?._id ? String(userProfile._id) : null;

  const [currentStep, setCurrentStep] = useState(0);
  // Пользователь, для которого онбординг завершён в этой сессии (localStorage может быть недоступен)
  const [finishedFor, setFinishedFor] = useState<string | null>(null);

  // Онбординг активен, когда профиль загружен и ЭТОТ пользователь его ещё не проходил
  const isActive = Boolean(userId) && finishedFor !== userId && !isCompleted(userId as string);

  const finishOnboarding = () => {
    if (!userId) return;
    try { localStorage.setItem(keyFor(userId), 'true'); } catch { /* storage недоступен */ }
    setFinishedFor(userId);
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
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
