import { 
    Building2, Landmark, LineChart, Coins, Briefcase, 
    PieChart, Layers, Pickaxe, MousePointer2, Zap, LayoutGrid, Signal 
} from 'lucide-react';

export const CATEGORY_ASSETS: any = {
    traditional: [
        { id: 'Real Estate', label: 'Недвижимость', icon: Building2 },
        { id: 'Bank Deposit', label: 'Банк', icon: Landmark },
        { id: 'S&P 500', label: 'Акции', icon: LineChart },
        { id: 'Gold', label: 'Золото', icon: Coins },
        { id: 'Business', label: 'Бизнес', icon: Briefcase },
        { id: 'Funds', label: 'Фонды', icon: PieChart },
    ],
    crypto: [
        { id: 'Staking', label: 'Стейкинг', icon: Layers },
        { id: 'Mining', label: 'Майнинг', icon: Pickaxe },
        { id: 'Trading', label: 'Трейдинг', icon: MousePointer2 },
        { id: 'Altcoins', label: 'Альткоины', icon: Zap },
        { id: 'Bots', label: 'Боты', icon: LayoutGrid },
        { id: 'Signals', label: 'Сигналы', icon: Signal },
    ]
};

export const INFO_GRID = [
    { label: 'ДОХОД', text: 'Потенциальная годовая доходность актива.' },
    { label: 'ЛИКВИДНОСТЬ', text: 'Скорость конвертации актива в наличные.' },
    { label: 'ВХОД', text: 'Минимальный порог капитала для старта.' },
    { label: 'БЕЗОПАСНОСТЬ', text: 'Уровень защиты капитала от манипуляций.' },
    { label: 'ПАССИВНОСТЬ', text: 'Степень автоматизации всех процессов.' },
    { label: 'РОСТ (BTC)', text: 'Способность увеличивать количество монет.' }
];

export const TABS = [
    { 
        id: 'radar', 
        label: 'ВЫГОДА', 
        header: '', 
        sub: '' 
    },
    { id: 'growth', label: 'ЦЕЛЬ', header: 'Прогноз доходности', sub: 'Математическая проекция роста вашего капитала на дистанции.' },
    { id: 'assets', label: 'ЗАЩИТА', header: 'Защита капитала', sub: 'Накопление твердых монет как щит от рыночной волатильности.' },
    { id: 'time', label: 'СКОРОСТЬ', header: 'Экономия времени', sub: 'Сколько лет жизни вам сохранит полная автоматизация стратегий.' },
    { id: 'struct', label: 'СОСТАВ', header: 'Состав капитала', sub: 'Распределение личных средств и чистой прибыли системы.' }
];

export const PEDAL_DESCRIPTIONS: Record<string, string> = {
    yield: 'Доходность от прямого стейкинга активов.',
    ref: 'Бонусы от развития партнерской сети.',
    btc: 'Ожидаемый среднегодовой рост цены BTC.',
    boosters: 'Дополнительные бонусы платформы за активность.',
    spec: 'Прибыль от реализации торговых стратегий.'
};