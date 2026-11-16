import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { adminApi } from '../../api/tyrexApi';
import { useTyrexStore } from '../../store/useTyrexStore';
import { useSession } from '../../store/useSession';
import { fmtUsd, fmtInt } from '../../lib/format';
import { showConfirm } from '../../lib/telegram';
import { List, ListRow, Sheet, Toggle, Badge, EmptyState, Surface, SkeletonRows, notify, cn } from '../../ui';

/** Серия из админского API (включая неактивные) */
interface AdminSeries {
    id: string;
    name: string;
    nominalSats: number;
    clientAPY: number;
    available: number;
    maxSupply: number;
    isActive: boolean;
    imagePath?: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');

const Field: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; suffix?: string; error?: string | null; hint?: string }> = ({ id, label, value, onChange, suffix, error, hint }) => (
    <div className="mt-4">
        <label htmlFor={id} className="text-callout text-muted">{label}</label>
        <div className={cn('mt-1.5 flex items-center gap-2 bg-surface rounded-control px-4 h-12 border', error ? 'border-negative' : 'border-transparent focus-within:border-accent')}>
            <input
                id={id}
                inputMode="decimal"
                value={value}
                onChange={(e) => onChange(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''))}
                className="flex-1 min-w-0 bg-transparent outline-none text-body text-fg tabular-nums"
                aria-invalid={Boolean(error)}
            />
            {suffix && <span className="text-callout text-muted">{suffix}</span>}
        </div>
        {error ? <p className="text-callout text-negative mt-1">{error}</p> : hint && <p className="text-caption text-muted mt-1">{hint}</p>}
    </div>
);

/** Лист редактирования серии; монтируется заново для каждой серии */
const EditForm: React.FC<{ type: AdminSeries; onDone: (changed: boolean) => void }> = ({ type, onDone }) => {
    const { t } = useTranslation('admin2');
    const refreshAllData = useSession(s => s.refreshAllData);
    const [nominal, setNominal] = useState(String(type.nominalSats));
    const [apy, setApy] = useState(String(type.clientAPY || 0));
    const [available, setAvailable] = useState(String(type.available));
    const [active, setActive] = useState(type.isActive);
    const [saving, setSaving] = useState(false);

    const nominalN = Number(nominal);
    const apyN = Number(apy);
    const availableN = Number(available);
    const errors = {
        nominal: !(nominalN > 0) || !Number.isInteger(nominalN) ? t('series.errNominal') : null,
        apy: !(apyN >= 0 && apyN <= 100) || apy === '' ? t('series.errApy') : null,
        available: !Number.isInteger(availableN) || availableN < 0 || available === '' ? t('series.errAvailable') : availableN > type.maxSupply ? t('series.errAvailableMax', { max: type.maxSupply }) : null,
    };
    const valid = !errors.nominal && !errors.apy && !errors.available;

    const save = async () => {
        if (!valid) return;
        if (!(await showConfirm(t('series.confirmSave', { name: type.name })))) return;
        setSaving(true);
        try {
            await adminApi.updateCardType(type.id, { nominalSats: nominalN, clientAPY: apyN, available: availableN, isActive: active });
            notify.success(t('series.saved'));
            await refreshAllData();
            onDone(true);
        } catch (e) {
            notify.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet
            open
            onClose={() => { if (!saving) onDone(false); }}
            title={type.name}
            action={{ text: t('series.save'), onClick: save, disabled: !valid, loading: saving }}
        >
            <p className="text-callout text-muted">{t('series.editNote')}</p>
            <Field id="s-nominal" label={t('series.nominal')} value={nominal} onChange={setNominal} suffix="sat" error={errors.nominal} hint={t('series.nominalHint', { btc: (nominalN / 1e8 || 0).toFixed(8) })} />
            <Field id="s-apy" label={t('series.apy')} value={apy} onChange={setApy} suffix="%" error={errors.apy} />
            <Field id="s-available" label={t('series.available')} value={available} onChange={setAvailable} error={errors.available} hint={t('series.maxSupply', { max: type.maxSupply })} />
            <div className="flex items-center justify-between mt-5 min-h-[44px]">
                <div>
                    <p className="text-body text-fg">{t('series.active')}</p>
                    <p className="text-caption text-muted">{t('series.activeHint')}</p>
                </div>
                <Toggle checked={active} onChange={setActive} label={t('series.active')} />
            </div>
        </Sheet>
    );
};

/** Серии карт: список (включая выключенные) и редактирование */
const SeriesTab: React.FC = () => {
    const { t } = useTranslation('admin2');
    const btcPrice = useTyrexStore(s => s.btcPrice);
    const [types, setTypes] = useState<AdminSeries[] | null>(null);
    const [editing, setEditing] = useState<AdminSeries | null>(null);

    const load = useCallback(() => adminApi.getCardTypes()
        .then(data => setTypes(Array.isArray(data) ? data as AdminSeries[] : []))
        .catch(e => { notify.error(e); setTypes([]); }), []);
    useEffect(() => { void Promise.resolve().then(load); }, [load]);

    if (types === null) return <SkeletonRows rows={4} />;
    if (types.length === 0) {
        return <Surface><EmptyState icon={<Layers className="w-6 h-6" aria-hidden />} text={t('series.empty')} /></Surface>;
    }

    return (
        <div>
            <List>
                {types.map(s => (
                    <ListRow
                        key={s.id}
                        icon={s.imagePath ? <img src={`${API_BASE}${s.imagePath}`} alt="" className="w-full h-full object-cover" /> : <Layers className="w-5 h-5" aria-hidden />}
                        title={s.name}
                        subtitle={t('series.row', { apy: `${s.clientAPY}%`, price: btcPrice > 0 ? fmtUsd((s.nominalSats / 1e8) * btcPrice, 0) : '…' })}
                        value={<span className="text-body">{fmtInt(s.available)} / {fmtInt(s.maxSupply)}</span>}
                        valueSub={!s.isActive ? <Badge tone="negative">{t('series.inactive')}</Badge> : s.available === 0 ? <Badge tone="neutral">{t('series.soldOut')}</Badge> : undefined}
                        onClick={() => setEditing(s)}
                        chevron
                    />
                ))}
            </List>
            {editing && <EditForm key={editing.id} type={editing} onDone={(changed) => { setEditing(null); if (changed) load(); }} />}
        </div>
    );
};

export default SeriesTab;
