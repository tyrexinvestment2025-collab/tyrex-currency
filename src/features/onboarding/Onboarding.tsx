import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion';
import { Layers, ShieldAlert, ArrowUpFromLine, Check } from 'lucide-react';
import { Button, MainAction, cn } from '../../ui';
import { usePrefs } from '../../store/usePrefs';
import { useSession } from '../../store/useSession';
import { haptic } from '../../lib/telegram';
import { InfoSheet } from '../profile/InfoSheets';

const STEPS = [
    { key: 'card', Icon: Layers },
    { key: 'risks', Icon: ShieldAlert },
    { key: 'withdraw', Icon: ArrowUpFromLine },
] as const;

/** Контент онбординга — монтируется, только когда его нужно показать */
const OnboardingFlow: React.FC = () => {
    const { t } = useTranslation('onboarding2');
    const setPref = usePrefs(s => s.set);
    const reduce = useReducedMotion();
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [agreed, setAgreed] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);

    const isLast = step === STEPS.length - 1;
    const { key, Icon } = STEPS[step];

    const go = (next: number) => {
        if (next < 0 || next >= STEPS.length) return;
        haptic.tap();
        setDir(next > step ? 1 : -1);
        setStep(next);
    };

    const finish = () => {
        if (!agreed) return;
        setPref('termsAccepted', true);
        setPref('onboardingDone', true);
        haptic.success();
    };

    const onPanEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.x < -60) go(step + 1);
        else if (info.offset.x > 60) go(step - 1);
    };

    return (
        <div className="fixed inset-0 z-[90] bg-bg text-fg flex flex-col pt-safe" role="dialog" aria-modal="true" aria-label={t('aria')}>
            <div className="mx-auto w-full max-w-app flex-1 flex flex-col px-4">
                {/* Индикатор шагов */}
                <div className="flex gap-1.5 justify-center pt-4" aria-label={t('stepOf', { current: step + 1, total: STEPS.length })}>
                    {STEPS.map((s, i) => (
                        <span key={s.key} className={cn('h-1.5 rounded-full transition-all duration-200', i === step ? 'w-6 bg-accent' : 'w-1.5 bg-fg/20')} />
                    ))}
                </div>

                <motion.div className="flex-1 flex flex-col justify-center touch-pan-y" onPanEnd={onPanEnd}>
                    <AnimatePresence mode="wait" custom={dir} initial={false}>
                        <motion.div
                            key={key}
                            custom={dir}
                            initial={reduce ? false : { opacity: 0, x: dir * 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
                            transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }}
                            className="flex flex-col items-center text-center"
                        >
                            <span className="w-20 h-20 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                                <Icon className="w-9 h-9" strokeWidth={1.75} aria-hidden />
                            </span>
                            <h1 className="text-title mt-6">{t(`steps.${key}.title`)}</h1>
                            <p className="text-body text-muted mt-3 max-w-[340px] whitespace-pre-line">{t(`steps.${key}.text`)}</p>
                            <ul className="mt-5 space-y-2 text-left w-full max-w-[340px]">
                                {(t(`steps.${key}.points`, { returnObjects: true }) as string[]).map((p, i) => (
                                    <li key={i} className="flex gap-2 text-callout text-fg">
                                        <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" aria-hidden />
                                        <span>{p}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {isLast && (
                    <label className="flex items-start gap-3 bg-surface rounded-control p-4 mb-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => { haptic.tap(); setAgreed(e.target.checked); }}
                            className="mt-0.5 w-5 h-5 accent-[rgb(var(--c-accent))] shrink-0"
                        />
                        <span className="text-callout text-fg">
                            {t('consent.prefix')}{' '}
                            <button type="button" onClick={(e) => { e.preventDefault(); setTermsOpen(true); }} className="text-accent underline underline-offset-2">
                                {t('consent.link')}
                            </button>
                            {t('consent.suffix')}
                        </span>
                    </label>
                )}

                <div className="flex gap-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
                    {step > 0 && <Button variant="secondary" onClick={() => go(step - 1)} className="flex-1">{t('back')}</Button>}
                    {!isLast && <Button onClick={() => go(step + 1)} className="flex-1">{t('next')}</Button>}
                    {isLast && (
                        <div className="flex-1">
                            <MainAction text={t('start')} onClick={finish} disabled={!agreed} />
                        </div>
                    )}
                </div>
                {isLast && !agreed && <p className="text-caption text-muted text-center -mt-2 mb-3">{t('consent.required')}</p>}
            </div>

            <InfoSheet kind={termsOpen ? 'terms' : null} onClose={() => setTermsOpen(false)} />
        </div>
    );
};

/**
 * Онбординг при первом входе: что такое карта → откуда доход и риски → как вывести + согласие с условиями.
 */
const Onboarding: React.FC = () => {
    const loaded = usePrefs(s => s.loaded);
    const done = usePrefs(s => s.onboardingDone);
    const ready = useSession(s => s.status === 'ready');
    if (!loaded || done || !ready) return null;
    return <OnboardingFlow />;
};

export default Onboarding;
