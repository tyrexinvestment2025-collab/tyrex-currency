export interface OnboardingStep {
  selector: string;
  title: string;
  description: string;
  path: string; // НОВОЕ ПОЛЕ: Маршрут, куда нужно перейти
}

export const onboardingSteps: OnboardingStep[] = [
  // --- ЭКРАН 1: DASHBOARD ---
  {
    selector: '#balance-card',
    title: 'Ваш Капитал',
    description: 'Здесь ваш общий баланс (все купленные карты) и доступные USD для вывода.',
    path: '/'
  },
  {
    selector: '#action-buttons',
    title: 'Пополнение и Вывод',
    description: 'Используйте эти кнопки для быстрого депозита или запроса выплаты на криптокошелек.',
    path: '/'
  },
  
  // --- ЭКРАН 2: MARKETPLACE ---
  {
    selector: '#nav-market', // Подсветим кнопку навигации перед переходом
    title: 'Идем за покупками!',
    description: 'Чтобы начать зарабатывать, нужно купить майнинговую мощность. Переходим в Маркет.',
    path: '/' 
  },
  {
    selector: '#market-first-card', // ID, который мы добавим в MarketplaceScreen
    title: 'Карты Майнинга',
    description: 'Здесь лучшие предложения. Обратите внимание на доходность (APY) и цену. Нажмите "Купить", чтобы приобрести.',
    path: '/marketplace' // Тутор сам переключит нас сюда
  },

  // --- ЭКРАН 3: COLLECTION ---
  {
    selector: '#nav-collection',
    title: 'Ваш Инвентарь',
    description: 'После покупки карты попадают в вашу коллекцию. Давайте посмотрим.',
    path: '/marketplace'
  },
  {
    selector: '#collection-content', // ID, который мы добавим в CollectionScreen
    title: 'Управление',
    description: 'Здесь лежат ваши карты. Самое важное: не забудьте нажать "Запустить", чтобы доход начал капать!',
    path: '/collection' // Тутор переключит сюда
  },
];