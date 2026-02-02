import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
// import { useTelegram } from '../../hooks/useTelegram'; 

import { Home, Store, Repeat2, Wallet, User } from 'lucide-react'; 
const ACTIVE_ICON_COLOR = 'text-tyrex-ultra-gold-glow'; 
const ACTIVE_LABEL_COLOR = 'text-tyrex-ultra-gold-glow'; 

const INACTIVE_ICON_COLOR = 'text-white';
const INACTIVE_LABEL_COLOR = 'text-white'; 

const navItems = [
    { path: '/', icon: Home, label: 'Home' }, 
    { path: '/marketplace', icon: Store, label: 'Market' }, 
    { path: '/collection', icon: Repeat2, label: 'Cards', isCenter: true }, 
    { path: '/referral', icon: Wallet, label: 'Partner' }, 
    { path: '/profile', icon: User, label: 'Profile' }, 
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = location.pathname === item.path;
    
    const baseClasses = "flex flex-col items-center justify-center transition-all duration-200 w-full h-full pt-2";
    
    const iconColor = isActive ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR;
    const labelColor = isActive ? ACTIVE_LABEL_COLOR : INACTIVE_LABEL_COLOR;

    return (
      <button
        key={item.path}
        onClick={() => handleNavClick(item.path)}
        className={`${baseClasses}`}
      >
        <item.icon className={`w-6 h-6 mb-0.5 ${iconColor}`} strokeWidth={isActive ? 3 : 2} />
        <span className={`text-[10px] font-medium ${labelColor}`}>
            {item.label}
        </span>
      </button>
    );
  };

  const centerItem = navItems.find(i => i.isCenter) || navItems[2];

  return (
 <div 
            // Фон Dark Black и тонкая темная граница СВЕРХУ
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-tyrex-graphite/30" 
            style={{ 
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                backgroundColor: '#0A0A0A', // Dark Black
            }}
        >
      <div className="flex justify-around items-center h-16">
        
        <div className="flex w-2/5 justify-around">
            {renderNavItem(navItems[0])} {/* Home */}
            {renderNavItem(navItems[1])} {/* Market */}
        </div>

        {/* Центральная Кнопка (Collection) */}
        <div className="w-1/5 flex justify-center -mt-5 z-20">
          <button
            onClick={() => handleNavClick(centerItem.path)} 
            className={clsx(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
              location.pathname === centerItem.path 
                ? "bg-tyrex-ultra-gold-glow text-tyrex-dark-black shadow-gold-glow scale-105" // Золотая подсветка (Активна)
                : "bg-purple-700 text-white shadow-lg" // Фиолетовая (Неактивна)
            )}
          >
            <centerItem.icon className="w-8 h-8" strokeWidth={2.5} />
          </button>
        </div>

        {/* Правая часть */}
        <div className="flex w-2/5 justify-around">
            {renderNavItem(navItems[3])} {/* Partner */}
            {renderNavItem(navItems[4])} {/* Support */}
        </div>

      </div>
    </div>
  );
};

export default BottomNav;