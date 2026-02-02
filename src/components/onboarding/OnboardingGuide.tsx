import React, { useEffect, useState, useCallback } from 'react';
import type { OnboardingStep } from '../../config/onboardingSteps';
import { X } from 'lucide-react';

interface Props {
  step: OnboardingStep;
  isLastStep: boolean;
  onNext: () => void;
  onFinish: () => void;
}

const OnboardingGuide: React.FC<Props> = ({ step, isLastStep, onNext, onFinish }) => {
  // Состояние координат подсветки
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({
    opacity: 0, // Скрываем рамку, пока не найдем элемент
  });
  
  // Состояние координат тултипа (подсказки)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', // По умолчанию в центре
  });

  const [elementFound, setElementFound] = useState(false);

  const calculatePosition = useCallback(() => {
    const element = document.querySelector(step.selector);

    if (element) {
      // 1. Скроллим к элементу
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      // 2. Получаем координаты
      const rect = element.getBoundingClientRect();

      // 3. Устанавливаем стиль "дырки" (подсветки)
      setHighlightStyle({
        position: 'absolute',
        left: `${rect.left - 5}px`,
        top: `${rect.top - 5}px`,
        width: `${rect.width + 10}px`,
        height: `${rect.height + 10}px`,
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)', // Затемнение вокруг
        zIndex: 100,
        transition: 'all 0.4s ease-out', // Плавное движение
        pointerEvents: 'none', // Чтобы клики проходили сквозь дырку
        opacity: 1,
      });

      // 4. Вычисляем позицию тултипа
      // Проверяем, где больше места: сверху или снизу
      const spaceBelow = window.innerHeight - rect.bottom;
      const showBelow = spaceBelow > 200; // Если снизу есть место

      setTooltipStyle({
        position: 'absolute',
        top: showBelow ? `${rect.bottom + 15}px` : 'auto',
        bottom: showBelow ? 'auto' : `${window.innerHeight - rect.top + 15}px`,
        left: '50%',
        transform: 'translateX(-50%)', // Центрируем относительно элемента по горизонтали
        width: '280px',
        maxWidth: '90vw',
        zIndex: 101, // Тултип выше подсветки
        transition: 'all 0.4s ease-out',
      });
      
      setElementFound(true);
    } else {
      // Элемент не найден — показываем по центру
      setHighlightStyle({ opacity: 0 }); // Скрываем рамку
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '280px',
        zIndex: 101,
      });
      setElementFound(false);
    }
  }, [step.selector]);

  useEffect(() => {
    // Небольшая задержка, чтобы React успел отрисовать DOM, если мы перешли на новую страницу
    const timer = setTimeout(() => {
      calculatePosition();
    }, 300);

    // Слушаем ресайз окна, чтобы пересчитать координаты
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [calculatePosition, step]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* 1. Слой подсветки (дырка) */}
      {elementFound && <div style={highlightStyle} />}

      {/* 2. Если элемент не найден, нужен просто темный фон, так как boxShadow не сработает */}
      {!elementFound && (
        <div className="absolute inset-0 bg-black/70 transition-opacity duration-500" />
      )}

      {/* 3. Окно подсказки */}
      <div 
        className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/10 shadow-2xl animate-fade-in flex flex-col"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-lg text-tyrex-ultra-gold-glow leading-tight pr-4">
                {step.title}
            </h4>
            <button 
                onClick={onFinish} 
                className="text-white/40 hover:text-white transition-colors"
            >
                <X className="w-5 h-5"/>
            </button>
        </div>
        
        <p className="text-sm text-white/80 mb-6 leading-relaxed">
            {step.description}
        </p>
        
        <div className="flex gap-3 mt-auto">
            <button
                onClick={isLastStep ? onFinish : onNext}
                className="flex-1 bg-tyrex-ultra-gold-glow text-black font-bold py-2.5 px-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
                {isLastStep ? "Начать!" : "Далее"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;