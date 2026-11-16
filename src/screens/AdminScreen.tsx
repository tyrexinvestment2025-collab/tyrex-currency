import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { Page, ScreenTitle, Segmented } from '../ui';
import { useTgBackButton, nativeBackAvailable } from '../lib/tgButtons';
import OverviewTab from '../features/admin/OverviewTab';
import RequestsTab from '../features/admin/RequestsTab';
import UsersTab from '../features/admin/UsersTab';
import SeriesTab from '../features/admin/SeriesTab';

type Section = 'overview' | 'requests' | 'users' | 'series';
type ReqFilter = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL';

/** Админ-панель: та же дизайн-система, плотные списки. Роль проверяется ещё и на бэкенде. */
const AdminScreen: React.FC = () => {
    const { t } = useTranslation('admin2');
    const navigate = useNavigate();
    const [section, setSection] = useState<Section>('overview');
    const [reqFilter, setReqFilter] = useState<ReqFilter>('ALL');

    const back = () => navigate('/profile');
    useTgBackButton(back);

    return (
        <Page>
            {!nativeBackAvailable() && (
                <button onClick={back} className="flex items-center gap-1 text-callout text-accent min-h-[44px] -ml-1 mt-1 active:opacity-60">
                    <ChevronLeft className="w-5 h-5" aria-hidden /> {t('back')}
                </button>
            )}
            <ScreenTitle>{t('title')}</ScreenTitle>

            <Segmented<Section>
                value={section}
                onChange={setSection}
                options={[
                    { value: 'overview', label: t('tabs.overview') },
                    { value: 'requests', label: t('tabs.requests') },
                    { value: 'users', label: t('tabs.users') },
                    { value: 'series', label: t('tabs.series') },
                ]}
                className="mb-4"
            />

            {section === 'overview' && (
                <OverviewTab onOpenRequests={(kind) => { setReqFilter(kind); setSection('requests'); }} />
            )}
            {section === 'requests' && <RequestsTab key={reqFilter} initialFilter={reqFilter} />}
            {section === 'users' && <UsersTab />}
            {section === 'series' && <SeriesTab />}
        </Page>
    );
};

export default AdminScreen;
