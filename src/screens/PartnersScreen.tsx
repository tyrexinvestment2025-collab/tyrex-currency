import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Send, QrCode, Users, Lock, UserPlus, ShoppingBag, Coins, RefreshCw } from 'lucide-react';
import {
    Page, ScreenTitle, Surface, SectionHeader, List, ListRow, EmptyState, Skeleton, SkeletonRows,
    Button, Badge, MainAction, notify, useMoney,
} from '../ui';
import { referralApi } from '../api/tyrexApi';
import { usePortfolio } from '../features/portfolio/usePortfolio';
import { useSession } from '../store/useSession';
import { copyText, openLink } from '../lib/telegram';
import { fmtDate } from '../lib/format';
import PartnerSheet from '../features/partners/PartnerSheet';
import ShareSheet from '../features/partners/ShareSheet';
import { simpleStatus, type PartnerItem, type ReferralInfo, type SimpleStatus } from '../features/partners/types';

const STATUS_TONE: Record<SimpleStatus, 'neutral' | 'info' | 'accent' | 'positive'> = {
    registered: 'neutral',
    gift: 'info',
    bought: 'accent',
    working: 'positive',
};

/** Партнёры: сколько я заработал на приглашениях */
const PartnersScreen: React.FC = () => {
    const { t } = useTranslation('partners');
    const navigate = useNavigate();
    const { primary, btcPrice } = useMoney();
    const portfolio = usePortfolio();
    const refreshAllData = useSession(s => s.refreshAllData);

    const [info, setInfo] = useState<ReferralInfo | null>(null);
    const [copied, setCopied] = useState(false);
    const [partners, setPartners] = useState<PartnerItem[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [reload, setReload] = useState(0);
    const [claiming, setClaiming] = useState(false);
    const [selected, setSelected] = useState<PartnerItem | null>(null);
    const [qrOpen, setQrOpen] = useState(false);

    useEffect(() => {
        let alive = true;
        Promise.all([referralApi.getReferralInfo(), referralApi.getReferralList().catch(() => [])])
            .then(([i, list]) => {
                if (!alive) return;
                setInfo(i as ReferralInfo);
                setPartners(Array.isArray(list) ? (list as PartnerItem[]) : []);
                setFailed(false);
            })
            .catch(() => { if (alive) setFailed(true); });
        return () => { alive = false; };
    }, [reload]);

    const available = portfolio.referralUsd;
    const canClaim = available >= 0.01;
    const link = info?.referralLink || '';
    const satsToUsd = (s: number) => (btcPrice > 0 ? (s / 100_000_000) * btcPrice : 0);

    const claim = async () => {
        setClaiming(true);
        try {
            const res = await referralApi.claimRewards() as { claimedUsd?: number };
            await refreshAllData();
            notify.success(t('claim.success', { amount: primary(res?.claimedUsd || 0) }));
        } catch (e) {
            notify.error(e);
        } finally {
            setClaiming(false);
        }
    };

    const copy = async () => {
        if (await copyText(link)) {
            notify.success(t('link.copied'));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    const share = () => {
        openLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t('link.shareText'))}`);
    };

    // --- Ошибка загрузки ---
    if (failed) {
        return (
            <Page>
                <ScreenTitle>{t('title')}</ScreenTitle>
                <Surface>
                    <EmptyState
                        icon={<RefreshCw className="w-6 h-6" aria-hidden />}
                        text={t('error')}
                        action={{ label: t('retry'), onClick: () => { setFailed(false); setReload(r => r + 1); } }}
                    />
                </Surface>
            </Page>
        );
    }

    // --- Загрузка ---
    if (!info) {
        return (
            <Page>
                <ScreenTitle>{t('title')}</ScreenTitle>
                <Skeleton className="h-32 w-full rounded-card" />
                <Skeleton className="h-24 w-full rounded-card mt-3" />
                <div className="mt-6"><SkeletonRows rows={3} /></div>
            </Page>
        );
    }

    // --- Программа ещё закрыта ---
    if (info.isLocked) {
        return (
            <Page>
                <ScreenTitle>{t('title')}</ScreenTitle>
                <Surface>
                    <EmptyState
                        icon={<Lock className="w-6 h-6" aria-hidden />}
                        text={t('locked')}
                        action={{ label: t('toShop'), onClick: () => navigate('/shop') }}
                    />
                </Surface>
            </Page>
        );
    }

    const apyMin = info.referralApyMin ?? 0;
    const apyMax = info.referralApyMax ?? 0;
    const apyRange = apyMin === apyMax ? `${apyMax}%` : `${apyMin}–${apyMax}%`;
    const totalEarnedSats = info.totalEarnedSats || 0;

    return (
        <Page>
            <ScreenTitle>{t('title')}</ScreenTitle>

            {/* Главная цифра: доступно к получению */}
            <Surface className="py-6 px-4 text-center">
                <p className="text-callout text-muted">{t('available')}</p>
                <p className="text-display text-fg tabular-nums mt-1">{primary(available)}</p>
                <p className="text-callout text-muted tabular-nums">{t('sats', { count: portfolio.referralSats })}</p>
                {!canClaim && <p className="text-callout text-muted mt-2">{t('claim.nothing')}</p>}
            </Surface>

            <div className="grid grid-cols-2 gap-3 mt-3">
                <Surface className="p-4">
                    <p className="text-callout text-muted">{t('stats.invited')}</p>
                    <p className="text-headline text-fg tabular-nums mt-1">{info.stats?.totalInvited ?? 0}</p>
                    <p className="text-caption text-muted mt-0.5">{t('stats.bought', { count: info.stats?.investorsCount ?? 0 })}</p>
                </Surface>
                <Surface className="p-4">
                    <p className="text-callout text-muted">{t('stats.earned')}</p>
                    <p className="text-headline text-fg tabular-nums mt-1">{primary(satsToUsd(totalEarnedSats))}</p>
                    <p className="text-caption text-muted mt-0.5">{t('sats', { count: totalEarnedSats })}</p>
                </Surface>
            </div>

            {/* Ссылка */}
            <SectionHeader title={t('link.title')} />
            <Surface className="p-4">
                <p className="font-mono text-callout text-fg break-all">{link}</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                    <Button variant="secondary" size="sm" icon={copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />} onClick={copy}>{copied ? t('link.copied') : t('link.copy')}</Button>
                    <Button variant="secondary" size="sm" icon={<Send className="w-4 h-4" aria-hidden />} onClick={share}>{t('link.share')}</Button>
                    <Button variant="secondary" size="sm" icon={<QrCode className="w-4 h-4" aria-hidden />} onClick={() => setQrOpen(true)}>{t('link.qr')}</Button>
                </div>
            </Surface>

            {/* Как это работает */}
            <SectionHeader title={t('how.title')} />
            <List>
                <ListRow icon={<UserPlus className="w-5 h-5" strokeWidth={1.75} aria-hidden />} title={t('how.step1.title')} subtitle={t('how.step1.text')} />
                <ListRow icon={<ShoppingBag className="w-5 h-5" strokeWidth={1.75} aria-hidden />} title={t('how.step2.title')} subtitle={t('how.step2.text', { range: apyRange })} />
                <ListRow icon={<Coins className="w-5 h-5" strokeWidth={1.75} aria-hidden />} title={t('how.step3.title')} subtitle={t('how.step3.text')} />
            </List>
            <p className="text-callout text-muted mt-2">{t('how.note')}</p>

            {/* Список партнёров */}
            <SectionHeader title={t('list.title')} />
            {partners === null ? (
                <SkeletonRows rows={3} />
            ) : partners.length === 0 ? (
                <Surface>
                    <EmptyState icon={<Users className="w-6 h-6" aria-hidden />} text={t('list.empty')} action={{ label: t('link.share'), onClick: share }} />
                </Surface>
            ) : (
                <List>
                    {partners.map(p => {
                        const st = simpleStatus(p.status);
                        const sats = p.myProfitFromHimSats || 0;
                        return (
                            <ListRow
                                key={p.id}
                                icon={<span className="text-body font-semibold">{(p.username || '?').slice(0, 1).toUpperCase()}</span>}
                                title={p.username || t('list.anonymous')}
                                subtitle={<>{fmtDate(p.registrationDate, { day: 'numeric', month: 'short', year: 'numeric' })}<span className="block mt-1"><Badge tone={STATUS_TONE[st]}>{t(`status.${st}`)}</Badge></span></>}
                                value={sats > 0 ? primary(satsToUsd(sats)) : '—'}
                                valueSub={<span className="text-caption text-muted">{t('list.yourIncome')}</span>}
                                onClick={() => setSelected(p)}
                                chevron
                            />
                        );
                    })}
                </List>
            )}

            <MainAction
                text={canClaim ? t('claim.button', { amount: primary(available) }) : t('claim.buttonEmpty')}
                onClick={claim}
                disabled={!canClaim}
                loading={claiming}
                visible={canClaim}
            />

            <PartnerSheet partner={selected} onClose={() => setSelected(null)} />
            <ShareSheet open={qrOpen} onClose={() => setQrOpen(false)} link={link} />
        </Page>
    );
};

export default PartnersScreen;
