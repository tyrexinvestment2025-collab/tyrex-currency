import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import clsx from 'clsx';

interface Props {
  imageUrl?: string;
  name: string;
  sizeClass?: string; 
  serialNumber?: number; // Добавили серийник внутрь для красоты
}

const NftCardVisual: React.FC<Props> = ({ imageUrl, name, sizeClass = "w-56", serialNumber }) => {
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
    <div className="flex justify-center items-center py-4 relative" style={{ perspective: "1200px" }}>
        {/* Фоновое свечение стало ярче */}
        <div className="absolute w-40 h-40 bg-tyrex-ultra-gold-glow/20 rounded-full blur-[50px] pointer-events-none animate-pulse" />
        
        <motion.div
            ref={cardRef}
            onMouseMove={handleMove} onTouchMove={handleMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={clsx(
                "relative aspect-[2/3] rounded-[2.5rem] bg-[#050505] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden cursor-grab active:cursor-grabbing",
                sizeClass
            )}
        >
            {/* Сама монета */}
            <img 
                src={imageUrl || undefined} 
                className="w-full h-full object-contain p-4 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
                alt={name} 
            />
            
            {/* Серийный номер в углу карточки */}
            {serialNumber && (
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg z-20">
                    <span className="text-[10px] font-black text-tyrex-ultra-gold-glow uppercase tracking-tighter">#{serialNumber}</span>
                </div>
            )}

            {/* Эффект блика */}
            <motion.div 
                style={{ 
                    background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) ${shineX}, transparent 100%)`,
                    opacity: shineOpacity 
                }}
                className="absolute inset-0 pointer-events-none"
            />
            
            {/* Глянцевая рамка */}
            <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none" />
        </motion.div>
    </div>
  );
};

export default NftCardVisual;