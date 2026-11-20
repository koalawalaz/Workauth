import { useMemo, useState } from 'react';
import { PublicHeader } from '../../components/Layout';
import { Card, inputCls, Pill, TierBadge } from '../../components/ui';
import { useT } from '../../i18n';
import { scoreFor, useDb } from '../../api/store';
import { SECTORS } from '../../domain/types';

export default function Directory() {
  const { t, isAr, num } = useT();
  const db = useDb();
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');

  const rows = useMemo(
    () =>
      db.employers
        .map((e) => ({ e, s: scoreFor(e.id, db) }))
        .filter(({ e }) => !sector || e.sector === sector)
        .filter(({ e }) => {
          const needle = q.trim().toLowerCase();
          return !needle || e.companyName.toLowerCase().includes(needle) || e.companyNameAr.includes(needle) || e.crn.includes(needle);
        })
        .sort((a, b) => b.s.total - a.s.total),
    [db, q, sector],
  );

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">{t('directory.title')}</h1>
        <p className="mt-1 text-slate-600">{t('directory.sub')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input className={inputCls} placeholder={t('directory.placeholder')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('app.search')} />
          <select className={`${inputCls} sm:w-60`} value={sector} onChange={(e) => setSector(e.target.value)} aria-label={t('field.sector')}>
            <option value="">{t('field.sector')}: {t('app.all')}</option>
            {SECTORS.map((s) => <option key={s} value={s}>{t(`sector.${s}`)}</option>)}
          </select>
        </div>
        <div className="mt-6 space-y-3">
          {rows.map(({ e, s }, i) => (
            <Card key={e.id} className="!p-4">
              <div className="flex items-center gap-4">
                <span className="w-6 text-center text-sm font-semibold text-slate-400 tabular-nums">{num(i + 1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{isAr ? e.companyNameAr : e.companyName}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{t(`sector.${e.sector}`)}</span>
                    <span>{t(`gov.${e.governorate}`)}</span>
                    <span>{num(s.counts.employees)} {t('app.employees')}</span>
                    {e.crnStatus === 'provisional' && <Pill tone="amber">{t('directory.provisional')}</Pill>}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-2xl font-bold tabular-nums">{num(s.total, s.total % 1 ? 1 : 0)}</div>
                  <TierBadge tier={s.tier} />
                </div>
              </div>
            </Card>
          ))}
          {rows.length === 0 && <p className="py-10 text-center text-slate-500">{t('directory.empty')}</p>}
        </div>
      </main>
    </div>
  );
}
