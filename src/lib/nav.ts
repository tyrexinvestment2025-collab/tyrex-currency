import type { NavigateFunction } from 'react-router-dom';

/**
 * «Назад» внутри приложения: шаг назад по истории, если он есть,
 * иначе — замена текущего экрана на fallback (без новой записи в истории,
 * чтобы два экрана не ссылались друг на друга по кругу).
 */
export function goBackOr(navigate: NavigateFunction, fallback: string) {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
}
