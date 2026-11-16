import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '../../ui';

// Базовый origin API для картинок /static/... (если VITE_API_URL относительный — текущий origin)
const API_ORIGIN = (() => {
    const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    try { return new URL(api, window.location.origin).origin; } catch { return window.location.origin; }
})();

/** Картинки хранятся абсолютными URL с хостом бэка на момент записи — переписываем /static/... на текущий API */
const resolve = (url?: string): string | undefined => {
    if (!url) return undefined;
    const idx = url.indexOf('/static/');
    if (idx >= 0) return `${API_ORIGIN}${url.slice(idx)}`;
    if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
    return url;
};

/** Картинка серии 1:1 со спокойным фолбэком при ошибке загрузки */
const SeriesImage: React.FC<{ src?: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const resolved = resolve(src);
    const [failed, setFailed] = useState<string | null>(null);

    if (!resolved || failed === resolved) {
        return (
            <div className={cn('aspect-square bg-raised flex items-center justify-center text-muted', className)} role="img" aria-label={alt}>
                <Layers className="w-6 h-6" strokeWidth={1.75} aria-hidden />
            </div>
        );
    }
    return (
        <img
            src={resolved}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(resolved)}
            className={cn('aspect-square object-cover bg-raised', className)}
        />
    );
};

export default SeriesImage;
