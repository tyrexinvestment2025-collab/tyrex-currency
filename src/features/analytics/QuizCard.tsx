import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Surface, Skeleton, notify, cn } from '../../ui';
import { analyticsApi } from '../../api/tyrexApi';
import { haptic } from '../../lib/telegram';
import type { Quiz } from './types';

/** «Вопрос дня»: один вопрос в день, ответ и объяснение — сразу. Без наград. */
const QuizCard: React.FC = () => {
    const { t, i18n } = useTranslation('analytics');
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [failed, setFailed] = useState(false);
    const [sending, setSending] = useState(false);
    const lang = i18n.language;

    useEffect(() => {
        let alive = true;
        analyticsApi.getQuiz(lang)
            .then(q => { if (alive) setQuiz(q as Quiz); })
            .catch(() => { if (alive) setFailed(true); });
        return () => { alive = false; };
    }, [lang]);

    const answer = async (i: number) => {
        if (!quiz || quiz.given !== undefined || sending) return;
        setSending(true);
        try {
            const r = (await analyticsApi.submitQuiz(quiz.id, i, lang)) as Quiz;
            setQuiz(q => ({ ...r, stats: q?.stats ? { total: q.stats.total + 1, correct: q.stats.correct + (r.correct ? 1 : 0) } : undefined }));
            if (r.correct) haptic.success(); else haptic.error();
        } catch (e) { notify.error(e); }
        finally { setSending(false); }
    };

    if (failed) return null;

    return (
        <Surface className="p-4">
            <p className="flex items-center gap-1.5 text-callout text-muted"><HelpCircle className="w-4 h-4" aria-hidden />{t('quiz.title')}</p>
            {!quiz ? (
                <div className="mt-3 space-y-2" aria-busy="true"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-11" /><Skeleton className="h-11" /></div>
            ) : (
                <>
                    <p className="text-headline text-fg mt-2">{quiz.question}</p>
                    <div className="mt-3 space-y-2">
                        {quiz.options.map((o, i) => {
                            const answered = quiz.given !== undefined;
                            const isRight = answered && i === quiz.answer;
                            const isWrongPick = answered && i === quiz.given && !quiz.correct;
                            return (
                                <button
                                    key={i}
                                    disabled={answered || sending}
                                    onClick={() => answer(i)}
                                    className={cn(
                                        'w-full min-h-[44px] px-3 py-2 rounded-control text-left text-body border flex items-center gap-2 transition-colors',
                                        isRight ? 'border-positive bg-positive/10 text-fg'
                                            : isWrongPick ? 'border-negative bg-negative/10 text-fg'
                                                : 'border-line bg-raised text-fg active:opacity-70',
                                        answered && !isRight && !isWrongPick && 'opacity-60',
                                    )}
                                >
                                    <span className="flex-1">{o}</span>
                                    {isRight && <CheckCircle2 className="w-5 h-5 text-positive shrink-0" aria-label={t('quiz.right')} />}
                                    {isWrongPick && <XCircle className="w-5 h-5 text-negative shrink-0" aria-label={t('quiz.wrong')} />}
                                </button>
                            );
                        })}
                    </div>
                    {quiz.given !== undefined && (
                        <div className="mt-3">
                            <p className={cn('text-callout font-semibold', quiz.correct ? 'text-positive' : 'text-negative')}>{t(quiz.correct ? 'quiz.right' : 'quiz.wrong')}</p>
                            <p className="text-callout text-muted mt-1">{quiz.explain}</p>
                            <p className="text-caption text-muted mt-2">{t('quiz.comeBack')}</p>
                        </div>
                    )}
                    {quiz.stats && quiz.stats.total > 0 && (
                        <p className="text-caption text-muted mt-2">{t('quiz.stats', { correct: quiz.stats.correct, total: quiz.stats.total })}</p>
                    )}
                </>
            )}
        </Surface>
    );
};

export default QuizCard;
