import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import clsx from 'clsx';

// Базовый origin API (для картинок /static/...). Если VITE_API_URL относительный — текущий origin.
const API_ORIGIN = (() => {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  try { return new URL(api, window.location.origin).origin; } catch { return window.location.origin; }
})();

/**
 * Картинки карт хранятся в БД абсолютными URL с хостом бэка на момент покупки
 * (http://localhost:5000/static/..., http://<render>/static/...). В Telegram/туннеле
 * такие URL недоступны или блокируются как mixed content → чёрные квадраты.
 * Переписываем любой путь /static/... на текущий API origin.
 */
const resolveImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  const idx = url.indexOf('/static/');
  if (idx >= 0) return `${API_ORIGIN}${url.slice(idx)}`;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
};

interface CardImageProps {
  src?: string;
  alt: string;
  className?: string;
}

/** Картинка карты с нормализацией URL и фолбэком при ошибке загрузки */
export const CardImage: React.FC<CardImageProps> = ({ src, alt, className }) => {
  const resolved = resolveImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !resolved || failedSrc === resolved;

  if (failed) {
    return (
      <div className={clsx(className, 'flex items-center justify-center bg-gradient-to-br from-[#2a2110] via-[#111] to-black')}>
        <span className="text-tyrex-ultra-gold-glow/70 font-black uppercase italic tracking-tighter text-center px-2 leading-none text-[clamp(10px,18%,28px)]">
          {alt || 'Tyrex'}
        </span>
      </div>
    );
  }
  return <img src={resolved} alt={alt} className={className} onError={() => setFailedSrc(resolved)} loading="lazy" />;
};

interface Props {
  imageUrl?: string;
  name: string;
  sizeClass?: string;
  serialNumber?: number;
}

const NftCardVisual: React.FC<Props> = ({ imageUrl, name, sizeClass = "w-64", serialNumber }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  const shineX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const shineOpacity = useTransform(mouseYSpring, [-0.5, 0, 0.5], [0.5, 0, 0.5]);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    x.set((clientX - rect.left) / rect.width - 0.5);
    y.set((clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <div className="flex justify-center items-center py-2 relative" style={{ perspective: "1200px" }}>
        <div className="absolute w-2/3 h-2/3 bg-tyrex-ultra-gold-glow/20 rounded-full blur-[40px] pointer-events-none animate-pulse" />

        <motion.div
            ref={cardRef}
            onMouseMove={handleMove} onTouchMove={handleMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={clsx(
                "relative aspect-square rounded-[2rem] bg-[#050505] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden cursor-grab active:cursor-grabbing",
                sizeClass
            )}
        >
            <CardImage src={imageUrl} alt={name} className="w-full h-full object-cover transform scale-105" />

            {serialNumber ? (
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg z-20 shadow-lg">
                    <span className="text-[10px] font-black text-tyrex-ultra-gold-glow uppercase tracking-tighter">#{serialNumber}</span>
                </div>
            ) : null}

            <motion.div
                style={{
                    background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) ${shineX}, transparent 100%)`,
                    opacity: shineOpacity
                }}
                className="absolute inset-0 pointer-events-none"
            />

            <div className="absolute inset-0 border border-white/5 rounded-[2rem] pointer-events-none" />
        </motion.div>
    </div>
  );
};

export default NftCardVisual;
