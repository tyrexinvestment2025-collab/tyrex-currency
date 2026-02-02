import React from 'react';

interface TyrexModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
}

const TyrexModal: React.FC<TyrexModalProps> = ({ isOpen, onClose, title, message, actionText, onAction }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-tyrex-dark-black/80 p-4">
            <div className="bg-tyrex-graphite p-6 rounded-xl shadow-2xl w-full max-w-sm border border-tyrex-ultra-gold-glow/50">
                <h3 className="text-xl font-bold text-tyrex-ultra-gold-glow mb-2">{title}</h3>
                <p className="text-white/90 mb-4">{message}</p>
                
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="py-2 px-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-500 transition-colors"
                    >
                        Закрыть
                    </button>
                    {actionText && onAction && (
                        <button 
                            onClick={onAction} 
                            className="py-2 px-4 bg-tyrex-ultra-gold-glow text-tyrex-dark-black rounded-lg font-bold hover:bg-yellow-400 transition-colors"
                        >
                            {actionText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TyrexModal;