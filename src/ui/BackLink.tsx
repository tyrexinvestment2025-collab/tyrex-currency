import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useTgBackButton, nativeBackAvailable } from '../lib/tgButtons';

/**
 * «Назад» для вложенного экрана: нативная кнопка Telegram,
 * а в старых клиентах без неё — ссылка вверху экрана.
 */
export const BackLink: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation('ui');
    useTgBackButton(onBack);
    if (nativeBackAvailable()) return null;
    return (
        <button onClick={onBack} className="flex items-center gap-1 text-body text-link min-h-[44px] -ml-1 mt-1 active:opacity-60">
            <ChevronLeft className="w-5 h-5" aria-hidden /> {t('back')}
        </button>
    );
};
