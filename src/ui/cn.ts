import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Склейка классов Tailwind с разрешением конфликтов */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
