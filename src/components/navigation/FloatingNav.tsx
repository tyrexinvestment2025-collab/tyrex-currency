import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Tab {
    id: string;
    label: string;
}

interface FloatingNavProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (id: string) => void;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

const FloatingNav: React.FC<FloatingNavProps> = ({ tabs, activeTab, setActiveTab, scrollContainerRef }) => {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const element = scrollContainerRef?.current;
        if (!element) return;

        const handleScroll = () => {
            const currentScrollY = element.scrollTop;
            const diff = currentScrollY - lastScrollY.current;

            if (currentScrollY < 60) {
                setIsVisible(true);
            } else if (diff > 15) {
                setIsVisible(false);
            } else if (diff < -10) {
                setIsVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        element.addEventListener('scroll', handleScroll, { passive: true });
        return () => element.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef]);

    return (
        <motion.div
            initial={{ y: 0, x: '-50%' }}
            animate={{ 
                y: isVisible ? 0 : -100,
                opacity: isVisible ? 1 : 0 
            }}
            transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.8 }}
            style={{ left: '50%' }}
            className="fixed top-4 z-[9999] flex justify-center pointer-events-none w-full"
        >
            {/* The Shell: Внешний корпус плашки */}
            <motion.div 
                whileTap={{ scale: 0.97 }}
                className={clsx(
                    "pointer-events-auto w-[94vw] max-w-[450px] h-[48px] relative",
                    "bg-white/[0.03] backdrop-blur-[20px]", // Чистое стекло
                    "border-[0.5px] border-white/10 rounded-full", // Тонкая грань
                    "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.6)]" // Фаска и глубокая тень
                )}
            >
                {/* Скролл-контейнер */}
                <nav 
                    className="flex items-center h-full overflow-x-auto no-scrollbar px-1 relative"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                // w-[23%] гарантирует видимость 4-х элементов (4 * 23 = 92%)
                                className={clsx(
                                    "relative flex-shrink-0 w-[23%] h-[36px] flex flex-col items-center justify-center transition-all duration-300",
                                    "text-[11px] uppercase tracking-[0.05em] font-semibold z-10",
                                    isActive ? "text-white" : "text-white/40"
                                )}
                            >
                                <span className="relative z-20">{tab.label}</span>
                                
                                <AnimatePresence>
                                    {isActive && (
                                        <>
                                            {/* Подложка "Светлое пятно" */}
                                            <motion.div
                                                layoutId="premium-bg"
                                                className="absolute inset-0 bg-white/10 border border-white/5 rounded-full z-10"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                            />
                                            
                                            {/* Золотой Акцент (Underline) с эффектом Glow */}
                                            <motion.div 
                                                layoutId="gold-glow-line"
                                                className="absolute -bottom-[2px] w-[60%] h-[1.5px] bg-[#FFB800] rounded-full z-20 shadow-[0_0_10px_rgba(255,184,0,0.8)]"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        </>
                                    )}
                                </AnimatePresence>
                            </button>
                        );
                    })}
                </nav>
            </motion.div>
        </motion.div>
    );
};

export default FloatingNav;