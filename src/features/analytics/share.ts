import { referralApi } from '../../api/tyrexApi';
import { openLink } from '../../lib/telegram';

let cachedLink: string | null = null;

/**
 * «Поделиться» прогнозом или доходом: выбор чата Telegram с текстом и реф-ссылкой.
 * (Картинка для сторис требует хостинга изображений — пока делимся текстом.)
 */
export async function shareWithRefLink(text: string): Promise<void> {
    if (!cachedLink) {
        try {
            const info = (await referralApi.getReferralInfo()) as { referralLink?: string };
            cachedLink = info?.referralLink || '';
        } catch { cachedLink = ''; }
    }
    const url = cachedLink || 'https://t.me';
    openLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
}
