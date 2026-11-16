import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { errorText } from '../lib/i18nHelpers';

/** Тост 3–4 с + вибрация. Ошибки API можно передавать как есть. */
export const notify = {
    success: (text: string) => {
        haptic.success();
        toast.success(text, { duration: 3000, icon: <CheckCircle2 className="w-5 h-5 text-positive" aria-hidden /> });
    },
    error: (e: unknown) => {
        haptic.error();
        const text = typeof e === 'string' ? e : errorText(e);
        toast.error(text, { duration: 4000, icon: <XCircle className="w-5 h-5 text-negative" aria-hidden /> });
    },
};
