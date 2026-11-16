export interface OnboardingStep {
  selector: string;
  /** Ключ в namespace onboarding: steps.<key>.title / steps.<key>.description */
  key: string;
  path: string; // Маршрут, куда нужно перейти
}

export const onboardingSteps: OnboardingStep[] = [
  // --- ЭКРАН 1: DASHBOARD ---
  { selector: '#balance-card', key: 'balance', path: '/' },
  { selector: '#action-buttons', key: 'actions', path: '/' },

  // --- ЭКРАН 2: MARKETPLACE ---
  { selector: '#nav-market', key: 'goMarket', path: '/' },
  { selector: '#market-first-card', key: 'marketCard', path: '/marketplace' },

  // --- ЭКРАН 3: COLLECTION ---
  { selector: '#nav-collection', key: 'goVault', path: '/marketplace' },
  { selector: '#collection-content', key: 'vault', path: '/collection' },
];
