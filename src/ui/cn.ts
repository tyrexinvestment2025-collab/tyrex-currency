import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge не знает наши размеры шрифта (text-display … text-caption из tailwind.config)
 * и без настройки считает их цветом текста: cn('text-positive', 'text-caption') выкидывал цвет.
 * Регистрируем их как font-size, а токены палитры — как цвета.
 */
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            'font-size': [{ text: ['display', 'title', 'headline', 'body', 'callout', 'caption'] }],
        },
    },
});

/** Склейка классов Tailwind с разрешением конфликтов */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
