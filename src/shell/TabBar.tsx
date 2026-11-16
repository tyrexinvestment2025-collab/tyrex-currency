import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ShoppingBag, Layers, BarChart3, Users } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { cn } from '../ui';

const TABS = [
    { to: '/', key: 'home', Icon: Home, end: true },
    { to: '/shop', key: 'shop', Icon: ShoppingBag },
    { to: '/cards', key: 'cards', Icon: Layers },
    { to: '/analytics', key: 'analytics', Icon: BarChart3 },
    { to: '/partners', key: 'partners', Icon: Users },
] as const;

/** Пять вкладок: Главная, Магазин, Мои карты, Аналитика, Партнёры. Кошелёк открывается с Главной. */
const TabBar: React.FC = () => {
    const { t } = useTranslation('ui');
    return (
        <nav
            className="fixed bottom-0 inset-x-0 z-40 bg-bg/95 backdrop-blur border-t border-line/70"
            style={{ paddingBottom: 'var(--safe-bottom)' }}
            aria-label="Main"
        >
            <div className="mx-auto max-w-app grid grid-cols-5">
                {TABS.map(({ to, key, Icon, ...rest }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={'end' in rest ? rest.end : false}
                        onClick={() => haptic.tap()}
                        className={({ isActive }) => cn(
                            'flex flex-col items-center justify-center gap-1 pt-1.5 pb-1.5 min-h-[56px] transition-colors duration-150',
                            isActive ? 'text-fg font-semibold' : 'text-muted',
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Активная вкладка — золотая заливка с тёмной иконкой (золото не используем как цвет текста) */}
                                <span className={cn('flex items-center justify-center w-14 h-7 rounded-full transition-colors duration-150', isActive && 'bg-accent text-on-accent')}>
                                    <Icon className="w-[22px] h-[22px]" strokeWidth={1.75} aria-hidden />
                                </span>
                                <span className="text-caption leading-none text-center px-0.5">{t(`tabs.${key}`)}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default TabBar;
