import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BellRing, BellOff } from 'lucide-react';
import { Surface, Toggle, Button, notify } from '../../ui';
import { useSession } from '../../store/useSession';
import { userApi } from '../../api/tyrexApi';
import { enableNotifications } from '../../lib/botLink';

type Group = 'cards' | 'partners' | 'news';
const GROUPS: Group[] = ['cards', 'partners', 'news'];
const DEFAULTS: Record<Group, boolean> = { cards: true, partners: true, news: true };

/**
 * Уведомления в Telegram: разрешение боту писать и группы уведомлений.
 * Те же настройки, что в боте (/settings): хранятся в профиле на сервере.
 * Сообщения о деньгах и аккаунте приходят всегда.
 */
const NotificationSettings: React.FC = () => {
    const { t } = useTranslation('profile2');
    const user = useSession(s => s.user);
    const [busy, setBusy] = useState(false);
    const prefs = { ...DEFAULTS, ...(user?.notifPrefs || {}) } as Record<Group, boolean>;
    const canMessage = Boolean(user?.canMessage);

    const patchUser = (patch: Record<string, unknown>) => useSession.setState(s => (s.user ? { user: { ...s.user, ...patch } } : s));

    const toggle = async (g: Group, v: boolean) => {
        const prev = user?.notifPrefs;
        patchUser({ notifPrefs: { ...prefs, [g]: v } });
        try {
            const r = await userApi.updatePrefs({ notifPrefs: { [g]: v } });
            patchUser({ notifPrefs: r.notifPrefs });
        } catch (e) {
            patchUser({ notifPrefs: prev });
            notify.error(e);
        }
    };

    const enable = async () => {
        setBusy(true);
        const ok = await enableNotifications();
        setBusy(false);
        if (ok) { patchUser({ canMessage: true }); notify.success(t('notifications.enabled')); }
    };

    return (
        <Surface className="p-4 space-y-4">
            <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-raised flex items-center justify-center shrink-0 text-fg">
                    {canMessage ? <BellRing className="w-5 h-5" aria-hidden /> : <BellOff className="w-5 h-5" aria-hidden />}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-body text-fg">{t(canMessage ? 'notifications.on' : 'notifications.off')}</p>
                    <p className="text-callout text-muted">{t(canMessage ? 'notifications.onHint' : 'notifications.offHint')}</p>
                    {!canMessage && (
                        <Button size="sm" variant="secondary" className="mt-2" loading={busy} onClick={enable}>{t('notifications.enable')}</Button>
                    )}
                </div>
            </div>
            {GROUPS.map(g => (
                <div key={g} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-body text-fg">{t(`notifications.groups.${g}.title`)}</p>
                        <p className="text-callout text-muted">{t(`notifications.groups.${g}.hint`)}</p>
                    </div>
                    <Toggle checked={prefs[g]} onChange={(v) => toggle(g, v)} label={t(`notifications.groups.${g}.title`)} />
                </div>
            ))}
            <p className="text-caption text-muted">{t('notifications.moneyAlways')}</p>
        </Surface>
    );
};

export default NotificationSettings;
