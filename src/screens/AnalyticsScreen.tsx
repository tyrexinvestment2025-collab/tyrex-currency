import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { Page, ScreenTitle, Segmented, Surface, Skeleton, EmptyState } from '../ui';
import { analyticsApi } from '../api/tyrexApi';
import IncomeSection from '../features/analytics/IncomeSection';
import CompareSection from '../features/analytics/CompareSection';
import ForecastSection from '../features/analytics/ForecastSection';
import MarketSection from '../features/analytics/MarketSection';
import type { Dashboard, Upcoming } from '../features/analytics/types';

type Section = 'income' | 'compare' | 'forecast' | 'market';
const SECTIONS: Section[] = ['income', 'compare', 'forecast', 'market'];

/** Скелетоны в форме графиков вместо спиннера */
const ChartSkeleton: React.FC = () => (
    <div className="space-y-3" aria-busy="true">
        <Surface className="p-4 space-y-3"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-9 w-1/2" /><Skeleton className="h-4 w-1/4" /></Surface>
        <Surface className="p-4">
            <div className="flex items-end gap-[3px] h-32">
                {Array.from({ length: 14 }).map((_, i) => <Skeleton key={i} className="flex-1 rounded-[3px]" />)}
            </div>
        </Surface>
    </div>
);

/** Аналитика — главный экран для заказчика: Доход · Сравнение · Прогноз · Рынок */
const AnalyticsScreen: React.FC = () => {
    const { t } = useTranslation('analytics');
    const [params, setParams] = useSearchParams();
    const fromUrl = params.get('s') as Section | null;
    const section: Section = fromUrl && SECTIONS.includes(fromUrl) ? fromUrl : 'income';
    const setSection = (s: Section) => setParams(s === 'income' ? {} : { s }, { replace: true });

    const [data, setData] = useState<Dashboard | null>(null);
    const [failed, setFailed] = useState(false);

    const load = useCallback(() => {
        setFailed(false);
        analyticsApi.getDashboard().then(d => setData(d as Dashboard)).catch(() => setFailed(true));
    }, []);

    useEffect(() => {
        let alive = true;
        analyticsApi.getDashboard()
            .then(d => { if (alive) setData(d as Dashboard); })
            .catch(() => { if (alive) setFailed(true); });
        return () => { alive = false; };
    }, []);

    const setUpcoming = (list: Upcoming[]) =>
        setData(d => (d ? { ...d, analytics: { ...d.analytics, upcoming: list } } : d));

    const a = data?.analytics;
    const hasCards = Boolean(a && (a.activeNodes > 0 || a.income.pendingUsd > 0 || a.upcoming.length > 0));

    return (
        <Page>
            <ScreenTitle>{t('title')}</ScreenTitle>
            <Segmented<Section>
                value={section}
                onChange={setSection}
                options={SECTIONS.map(s => ({ value: s, label: t(`sections.${s}`) }))}
                className="mb-4"
            />

            {section === 'market' ? (
                <MarketSection sentiment={data?.marketSentiment} />
            ) : failed && !data ? (
                <Surface>
                    <EmptyState icon={<ShieldAlert className="w-6 h-6" aria-hidden />} text={t('error.text')} action={{ label: t('error.retry'), onClick: load }} />
                </Surface>
            ) : !data || !a ? (
                <ChartSkeleton />
            ) : section === 'income' ? (
                <IncomeSection income={a.income} upcoming={a.upcoming} hasCards={hasCards} onUpcomingChange={setUpcoming} />
            ) : section === 'compare' ? (
                <CompareSection benchmarks={a.benchmarks} tyrex={a.userScore} updatedAt={a.scoresUpdatedAt} />
            ) : (
                <ForecastSection data={data} />
            )}
        </Page>
    );
};

export default AnalyticsScreen;
