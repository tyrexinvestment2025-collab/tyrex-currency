import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Info } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { userApi } from '../api/tyrexApi';
import { notificationText } from '../lib/i18nHelpers';
import { fmtDateTime } from '../lib/format';
import { IconButton, Sheet, EmptyState, List, ListRow } from '../ui';

interface NotificationItem {
    _id: string;
    title?: string;
    message?: string;
    key?: string;
    params?: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}

/** Шапка на всех вкладках: аватар → профиль, колокольчик → уведомления с числом непрочитанных */
const AppHeader: React.FC = () => {
    const { t } = useTranslation('ui');
    const navigate = useNavigate();
    const { user, userProfile } = useTelegram();
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let alive = true;
        const load = () => userApi.getNotifications()
            .then(data => { if (alive && Array.isArray(data)) setItems(data as NotificationItem[]); })
            .catch(() => { /* тихо: уведомления не критичны */ });
        load();
        const id = setInterval(load, 60_000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    const unread = items.filter(n => !n.isRead).length;
    const name = userProfile?.username || user?.username || user?.first_name || '';
    const initial = (user?.first_name || name || '?').slice(0, 1).toUpperCase();

    const openSheet = () => {
        setOpen(true);
        if (unread > 0) {
            userApi.markNotificationsRead();
            setItems(prev => prev.map(n => ({ ...n, isRead: true })));
        }
    };

    return (
        <header className="mx-auto max-w-app px-4 pt-2 flex items-center justify-between">
            <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 min-h-[44px] min-w-0 active:opacity-60"
                aria-label={t('header.profile')}
            >
                {user?.photo_url ? (
                    <img src={user.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                    <span className="w-9 h-9 rounded-full bg-surface text-fg flex items-center justify-center text-body font-semibold">{initial}</span>
                )}
                <span className="text-body text-fg truncate">{name ? `@${name}` : ''}</span>
            </button>

            <IconButton label={unread ? `${t('header.notifications')}, ${t('header.unread', { count: unread })}` : t('header.notifications')} onClick={openSheet}>
                <Bell className="w-6 h-6" strokeWidth={1.75} aria-hidden />
                {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-negative text-white text-[11px] font-semibold leading-[18px] text-center tabular-nums">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </IconButton>

            <Sheet open={open} onClose={() => setOpen(false)} title={t('notifications.title')}>
                {items.length === 0 ? (
                    <EmptyState icon={<Bell className="w-6 h-6" aria-hidden />} text={t('notifications.empty')} />
                ) : (
                    <List>
                        {items.map(n => {
                            const { title, message } = notificationText(n);
                            return (
                                <ListRow
                                    key={n._id}
                                    icon={<Info className="w-5 h-5 text-info" aria-hidden />}
                                    title={title}
                                    subtitle={<><span className="block whitespace-pre-line">{message}</span><span className="block mt-1 text-caption">{fmtDateTime(n.createdAt)}</span></>}
                                />
                            );
                        })}
                    </List>
                )}
            </Sheet>
        </header>
    );
};

export default AppHeader;
