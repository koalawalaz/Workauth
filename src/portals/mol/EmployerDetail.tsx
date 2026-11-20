import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BreakdownCard, EmployeeTable, ScoreCard, TrendCard } from '../../components/EmployerPanels';
import { DisputeCard } from '../../components/DisputeCard';
import { Button, Card, Field, inputCls, Modal, Notice, Pill, StatusPill, statusTone } from '../../components/ui';
import { useT } from '../../i18n';
import { createInspection, scoreFor, useDb, verifyCrn } from '../../api/store';
import type { Inspection, InspectionOutcome, InspectionType, Inspector } from '../../domain/types';

export function InspectionList({ items, showEmployer }: { items: Inspection[]; showEmployer?: boolean }) {
  const { t, date, isAr } = useT();
  const db = useDb();
  if (items.length === 0) return <p className="text-sm text-slate-500">{t('mol.noInspections')}</p>;
  return (
    <ol className="relative space-y-4 border-s-2 border-slate-200 ps-5">
      {items.map((i) => {
        const emp = db.employers.find((e) => e.id === i.employerId);
        return (
          <li key={i.id} className="relative">
            <span className="absolute -start-[27px] top-1.5 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <b>{date(i.date)}</b>
              <Pill tone="slate">{t(`mol.types.${i.type}`)}</Pill>
              <Pill tone={statusTone(i.outcome)}>{t(`mol.outcomes.${i.outcome}`)}</Pill>
              <span className="text-xs text-slate-400">🔒</span>
            </div>
            {showEmployer && emp && (
              <Link to={`/mol/employers/${emp.id}`} className="text-sm font-medium text-brand-700 hover:underline">{isAr ? emp.companyNameAr : emp.companyName}</Link>
            )}
            <p className="mt-1 text-sm text-slate-700">{i.findings}</p>
            <p className="mt-1 text-xs text-slate-500">{i.inspectorName} · <span dir="ltr">{i.createdAt.replace('T', ' ').slice(0, 16)}</span></p>
          </li>
        );
      })}
    </ol>
  );
}

function NewInspection({ employerId, me, onDone }: { employerId: string; me: Inspector; onDone: () => void }) {
  const { t } = useT();
  const db = useDb();
  const [type, setType] = useState<InspectionType>('routine');
  const [outcome, setOutcome] = useState<InspectionOutcome>('compliant');
  const [date, setDate] = useState(db.today);
  const [findings, setFindings] = useState('');
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        createInspection({ employerId, inspectorId: me.id, inspectorName: me.name, date, type, outcome, findings });
        onDone();
      }}
    >
      <Notice tone="amber">🔒 {t('mol.immutable')}</Notice>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('mol.inspDate')} required>{(id) => <input id={id} type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} max={db.today} />}</Field>
        <Field label={t('mol.inspType')}>
          {(id) => (
            <select id={id} className={inputCls} value={type} onChange={(e) => setType(e.target.value as InspectionType)}>
              {(['routine', 'triggered', 'follow_up'] as const).map((x) => <option key={x} value={x}>{t(`mol.types.${x}`)}</option>)}
            </select>
          )}
        </Field>
      </div>
      <Field label={t('mol.findings')} required>{(id) => <textarea id={id} rows={4} className={inputCls} value={findings} onChange={(e) => setFindings(e.target.value)} />}</Field>
      <Field label={t('mol.outcome')}>
        {(id) => (
          <select id={id} className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value as InspectionOutcome)}>
            {(['compliant', 'warning_issued', 'penalty_referred', 'case_opened'] as const).map((x) => <option key={x} value={x}>{t(`mol.outcomes.${x}`)}</option>)}
          </select>
        )}
      </Field>
      <p className="text-xs text-slate-500">{t('mol.inspector')}: {me.name}</p>
      <Button type="submit" className="w-full" disabled={!findings.trim()}>{t('app.submit')}</Button>
    </form>
  );
}

export default function EmployerDetail({ me }: { me: Inspector }) {
  const { t, isAr, date } = useT();
  const db = useDb();
  const { id } = useParams();
  const [open, setOpen] = useState(false);
  const employer = db.employers.find((e) => e.id === id);
  if (!employer) return <p>{t('app.notFound')}</p>;
  const s = scoreFor(employer.id, db);
  const inspections = db.inspections.filter((i) => i.employerId === employer.id);
  const disputes = db.disputes.filter((d) => d.employerId === employer.id);
  const employees = db.employees.filter((e) => e.employerId === employer.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/mol/employers" className="text-sm text-brand-700 hover:underline">← {t('mol.nav.employers')}</Link>
          <h1 className="mt-1 text-2xl font-bold">{isAr ? employer.companyNameAr : employer.companyName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span dir="ltr">CRN {employer.crn}</span>
            <StatusPill status={employer.crnStatus === 'verified' ? 'verified' : 'provisional'} />
            <span>{t(`sector.${employer.sector}`)}</span>
            <span>{t(`gov.${employer.governorate}`)}</span>
            <span>{employer.representative}</span>
            <span dir="ltr">{employer.contactEmail}</span>
            <span>{date(employer.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {employer.crnStatus === 'provisional' && <Button variant="secondary" onClick={() => verifyCrn(employer.id, me.name)}>✓ {t('mol.verifyCrn')}</Button>}
          <Button variant="secondary" onClick={() => window.print()}>{t('app.print')}</Button>
          <Button onClick={() => setOpen(true)}>+ {t('mol.newInspection')}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ScoreCard employerId={employer.id} />
        <BreakdownCard s={s} />
        <TrendCard employerId={employer.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t('mol.inspections')} className="lg:col-span-1">
          <InspectionList items={inspections} />
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <h2 className="font-semibold">{t('disputes.title')}</h2>
          {disputes.length === 0 && <p className="text-sm text-slate-500">{t('disputes.empty')}</p>}
          {disputes.map((d) => <DisputeCard key={d.id} d={d} who="mol" />)}
        </div>
      </div>

      <Card title={`${t('mol.workers')} (${s.counts.employees})`}>
        <EmployeeTable employees={employees} showArchived />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('mol.newInspection')}>
        <NewInspection employerId={employer.id} me={me} onDone={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
