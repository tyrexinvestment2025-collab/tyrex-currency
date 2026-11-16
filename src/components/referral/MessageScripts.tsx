import React, { useEffect, useState } from 'react';
import { Copy, Heart, Smile, Coffee, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { copyText, haptic } from '../../lib/telegram';
import { normalizeStatus } from './types';

type ScriptStyle = 'CARE' | 'FRIENDLY' | 'HUMOR';
const STYLES: ScriptStyle[] = ['CARE', 'FRIENDLY', 'HUMOR'];

interface Props {
    /** Код статуса партнёра (NOT_ACTIVATED | WAITING | ...) */
    status?: string;
    username?: string;
    /** Сообщает родителю текущий выбранный текст (для кнопки «Написать») */
    onTextChange?: (text: string) => void;
}

/** Готовые сообщения для связи с партнёром — по статусу и стилю, на языке интерфейса */
const MessageScripts: React.FC<Props> = ({ status, username, onTextChange }) => {
    const { t } = useTranslation('referral');
    const [style, setStyle] = useState<ScriptStyle>('CARE');
    const [copied, setCopied] = useState(false);

    const name = username || t('scripts.defaultName');
    const activeText = t(`scripts.${normalizeStatus(status)}.${style}`, { name });

    useEffect(() => { onTextChange?.(activeText); }, [activeText, onTextChange]);

    const handleCopy = async () => {
        if (await copyText(activeText)) {
            haptic.success();
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                {STYLES.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={clsx(
                            "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 min-w-0",
                            style === s ? "bg-[#FFB700] text-black shadow-lg" : "text-white/30 hover:text-white/60"
                        )}
                    >
                        {s === 'CARE' && <Heart size={14} fill={style === s ? "black" : "none"} />}
                        {s === 'FRIENDLY' && <Smile size={14} />}
                        {s === 'HUMOR' && <Coffee size={14} />}
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">{t(`scripts.styles.${s}`)}</span>
                    </button>
                ))}
            </div>

            <div className="bg-[#111112] border border-white/10 p-5 rounded-2xl relative min-h-[100px] flex items-center">
                <p className="text-[14px] text-slate-200 leading-relaxed italic pr-12">“{activeText}”</p>
                <button
                    onClick={handleCopy}
                    aria-label={copied ? t('link.copied') : t('link.copy')}
                    className="absolute bottom-4 right-4 p-2.5 bg-[#FFB700]/10 rounded-xl text-[#FFB700] active:scale-90 transition-all border border-[#FFB700]/20"
                >
                    {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
            </div>
        </div>
    );
};

export default MessageScripts;
