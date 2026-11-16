import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '../../ui';

// Origin API для картинок /static/... (если VITE_API_URL относительный — текущий origin)
const API_ORIGIN = (() => {
    const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    try { return new URL(api, window.location.origin).origin; } catch { return window.location.origin; }
})();

/** В БД картинки лежат абсолютными URL с хостом бэка на момент покупки — переписываем /static/... на текущий origin */
const resolve = (url?: string): string | undefined => {
    if (!url) return undefined;
    const idx = url.indexOf('/static/');
    if (idx >= 0) return `${API_ORIGIN}${url.slice(idx)}`;
    if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
    return url;
};

/** Квадратная картинка карты (1:1) со спокойной заглушкой в цветах темы */
const CardThumb: React.FC<{ src?: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const url = resolve(src);
    const [failed, setFailed] = useState<string | null>(null);
    if (!url || failed === url) {
        return (
            <span className={cn('flex items-center justify-center bg-raised text-muted', className)} role="img" aria-label={alt}>
                <Layers className="w-1/2 h-1/2 max-w-[24px] max-h-[24px]" strokeWidth={1.75} aria-hidden />
            </span>
        );
    }
    return <img src={url} alt={alt} loading="lazy" onError={() => setFailed(url)} className={cn('object-cover', className)} />;
};

export default CardThumb;
