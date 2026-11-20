import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, inputCls, Pill, Table, Td, TierBadge } from '../../components/ui';
import { useT } from '../../i18n';
import { scoreFor, useDb } from '../../api/store';
import { GOVERNORATES, SECTORS, type Inspector, type Tier } from '../../domain/types';

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
}

export default function EmployerList({ me }: { me: Inspector }) {
  const { t, isAr, num, date } = useT();
  const db = useDb();
  // Inspectors default to their assigned governorates (SRS §2.2); admins see everything.
  const [gov, setGov] = useState(me.role === 'admin' ? '' : 'mine');
  const [sector, setSector] = useState('');
  const [tier, setTier] = useState('');
  const [size, setSize] = useState('');
  const [q, setQ] = useState('');

  const rows = useMemo(
    () =>
      db.employers
        .map((e) => {
          const s = scoreFor(e.id, db);
          const updated = db.employees.filter((x) => x.employerId === e.id).reduce((m, x) => (x.updatedAt > m ? x.updatedAt : m), e.createdAt);
          return { e, s, updated };
        })
        .filter(({ e }) => (gov === 'mine' ? me.governorates.includes(e.governorate) : !gov || e.governorate === gov))
        .filter(({ e }) => !sector || e.sector === sector)
        .filter(({ s }) => !tier || s.tier === tier)
        .filter(({ s }) => {
          const n = s.counts.employees;
          return !size || (size === 's' ? n < 10 : size === 'm' ? n >= 10 && n < 15 : n >= 15);
        })
        .filter(({ e }) => !q || e.companyName.toLowerCase().includes(q.toLowerCase()) || e.companyNameAr.includes(q) || e.crn.includes(q))
        .sort((a, b) => a.s.total - b.s.total),
    [db, gov, sector, tier, size, q, me],
  );

  const exportCsv = () =>
    downloadCsv('workauth-employers.csv', [
      ['Company', 'CRN', 'Sector', 'Governorate', 'Employees', 'Score', 'Tier', 'Last updated'],
      ...rows.map(({ e, s, updated }) => [e.companyName, e.crn, e.sector, e.governorate, s.counts.employees, s.total, s.tier, updated]),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('mol.nav.employers')} <span className="text-base font-normal text-slate-500">({num(rows.length)})</span></h1>
        <div className="flex gap-2 print:hidden">
          <Button variant="secondary" onClick={exportCsv}>{t('app.exportCsv')}</Button>
          <Button variant="secondary" onClick={() => window.print()}>{t('app.print')}</Button>
        </div>
      </div>
      <Card className="print:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className={inputCls} placeholder={t('directory.placeholder')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('app.search')} />
          <select className={inputCls} value={gov} onChange={(e) => setGov(e.target.value)} aria-label={t('field.governorate')}>
            <option value="">{t('field.governorate')}: {t('app.all')}</option>
            {me.governorates.length > 0 && <option value="mine">{t('mol.governorates')}</option>}
            {GOVERNORATES.map((g) => <option key={g} value={g}>{t(`gov.${g}`)}</option>)}
          </select>
          <select className={inputCls} value={sector} onChange={(e) => setSector(e.target.value)} aria-label={t('field.sector')}>
            <option value="">{t('field.sector')}: {t('app.all')}</option>
            {SECTORS.map((s) => <option key={s} value={s}>{t(`sector.${s}`)}</option>)}
          </select>
          <select className={inputCls} value={tier} onChange={(e) => setTier(e.target.value)} aria-label={t('field.tier')}>
            <option value="">{t('field.tier')}: {t('app.all')}</option>
            {(['A+', 'A', 'B', 'RED', 'UNRATED'] as Tier[]).map((x) => <option key={x} value={x}>{t(`tier.${x}`)}</option>)}
          </select>
          <select className={inputCls} value={size} onChange={(e) => setSize(e.target.value)} aria-label={t('mol.size')}>
            <option value="">{t('mol.size')}: {t('app.all')}</option>
            {(['s', 'm', 'l'] as const).map((x) => <option key={x} value={x}>{t(`mol.sizes.${x}`)}</option>)}
          </select>
        </div>
      </Card>
      <Card>
        <Table head={[t('field.company'), t('field.sector'), t('field.governorate'), t('field.employeeCount'), t('field.score'), t('field.updated')]}>
          {rows.map(({ e, s, updated }) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <Td>
                <Link to={`/mol/employers/${e.id}`} className="font-medium text-brand-700 hover:underline">{isAr ? e.companyNameAr : e.companyName}</Link>
                <div className="flex items-center gap-2 text-xs text-slate-500"><span dir="ltr">CRN {e.crn}</span>{e.crnStatus === 'provisional' && <Pill tone="amber">{t('status.provisional')}</Pill>}</div>
              </Td>
              <Td>{t(`sector.${e.sector}`)}</Td>
              <Td>{t(`gov.${e.governorate}`)}</Td>
              <Td className="tabular-nums">{num(s.counts.employees)}</Td>
              <Td><span className="me-2 font-semibold tabular-nums">{num(s.total, 1)}</span><TierBadge tier={s.tier} /></Td>
              <Td className="text-slate-500">{date(updated)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
