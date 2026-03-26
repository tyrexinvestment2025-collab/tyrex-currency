import { 
    Building2, Landmark, LineChart, Coins, Briefcase, 
    PieChart, Layers, Pickaxe, MousePointer2, Zap, LayoutGrid, Signal 
} from 'lucide-react';

export const CATEGORY_ASSETS: any = {
    traditional: [
        { id: 'Real Estate', label: 'Нерухомість', icon: Building2 },
        { id: 'Bank Deposit', label: 'Банк', icon: Landmark },
        { id: 'S&P 500', label: 'Акції', icon: LineChart },
        { id: 'Gold', label: 'Золото', icon: Coins },
        { id: 'Business', label: 'Бізнес', icon: Briefcase },
        { id: 'Funds', label: 'Фонди', icon: PieChart },
    ],
    crypto: [
        { id: 'Staking', label: 'Стейкінг', icon: Layers },
        { id: 'Mining', label: 'Майнінг', icon: Pickaxe },
        { id: 'Trading', label: 'Трейдинг', icon: MousePointer2 },
        { id: 'Altcoins', label: 'Альткоїни', icon: Zap },
        { id: 'Bots', label: 'Боти', icon: LayoutGrid },
        { id: 'Signals', label: 'Сигнали', icon: Signal },
    ]
};

export const INFO_GRID = [
    { label: 'ДОХІД', text: 'Потенційна річна прибутковість активу.' },
    { label: 'ЛІКВІДНІСТЬ', text: 'Швидкість конвертації активу в готівку.' },
    { label: 'ВХІД', text: 'Мінімальний поріг капіталу для старту.' },
    { label: 'БЕЗПЕКА', text: 'Рівень захисту капіталу від маніпуляцій.' },
    { label: 'ПАСИВНІСТЬ', text: 'Ступінь автоматизації процесів.' },
    { label: 'РІСТ (BTC)', text: 'Здатність накопичувати кількість монет.' }
];

export const TABS = [
    { id: 'radar', label: 'ВИГОДА', header: 'Порівняння активів', sub: 'Порівняй свій актив з алгоритмом Tyrex та оціни різницю.' },
    { id: 'growth', label: 'ЦІЛЬ', header: 'Прогноз доходності', sub: 'Математична проекція росту вашого капіталу.' },
    { id: 'assets', label: 'ЗАХИСТ', header: 'Захист капіталу', sub: 'Накопичення монет як щит від волатильності.' },
    { id: 'time', label: 'ШВИДКІСТЬ', header: 'Економія часу', sub: 'Скільки років життя вам збереже автоматизація.' },
    { id: 'struct', label: 'СКЛАД', header: 'Склад капіталу', sub: 'Розподіл власних коштів та прибутку системи.' }
];

export const PEDAL_DESCRIPTIONS: Record<string, string> = {
    yield: 'Дохідність від стейкінгу активів.',
    ref: 'Бонус від партнерської мережі.',
    btc: 'Очікуваний річний ріст BTC.',
    boosters: 'Бонуси платформи за активність.',
    spec: 'Прибуток від торгових стратегій.'
};