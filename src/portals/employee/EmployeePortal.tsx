import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { PortalLayout } from '../../components/Layout';
import { Button, inputCls, Modal, StatusPill } from '../../components/ui';
import { useT } from '../../i18n';
import { fileDispute, useDb, useSession } from '../../api/store';
import { isInsuranceValid } from '../../domain/scoring';
import type { Dispute, DisputeStatus, Employee } from '../../domain/types';

// Low-literacy design (NFR-USE-02): large type, one action per card, plain language,
// a rights explainer next to every field (FR-EEP-06).

type FieldKey = 'jobTitle' | 'salary' | 'contractType' | 'startDate' | 'endDate' | 'sscStatus' | 'insurance';

function useRows(e: Employee) {
  const { t, num, date } = useT();
  const db = useDb();
  const rows: { key: FieldKey; label: string; value: string; status?: string }[] = [
    { key: 'jobTitle', label: t('field.jobTitle'), value: e.jobTitle },
    { key: 'salary', label: t('field.salary'), value: `${num(e.salary)} ${t('app.jod')}`, status: e.salary < 260 ? 'mismatch' : undefined },
    { key: 'contractType', label: t('field.contractType'), value: t(`contract.${e.contractType}`) },
    { key: 'startDate', label: t('field.startDate'), value: date(e.startDate) },
    { key: 'endDate', label: t('field.endDate'), value: e.endDate ? date(e.endDate) : '—' },
    { key: 'sscStatus', label: t('field.sscStatus'), value: e.sscEnrolledDeclared ? e.sscRef || '—' : t('status.not_enrolled'), status: e.sscStatus },
    {
      key: 'insurance',
      label: t('field.insurance'),
      value: e.insured ? `${e.insuranceProvider ?? ''} · ${date(e.insuranceExpiry)}` : t('app.none'),
      status: isInsuranceValid(e, db.today) ? 'insured' : 'uninsured',
    },
  ];
  return rows;
}

const RIGHTS_KEY: Record<FieldKey, string> = {
  jobTitle: 'jobTitle', salary: 'salary', contractType: 'contractType', startDate: 'startDate',
  endDate: 'endDate', sscStatus: 'sscStatus', insurance: 'insurance',
};

function Progress({ status }: { status: DisputeStatus }) {
  const { t } = useT();
  const order: DisputeStatus[] = status === 'escalated' || status === 'resolved' ? ['submitted', 'employer_review', 'escalated', 'resolved'] : ['submitted', 'employer_review', 'resolved'];
  const idx = order.indexOf(status);
  return (
    <ol className="mt-4 flex items-center gap-1">
      {order.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center">
          <span className={`h-2 w-full rounded-full ${i <= idx ? (s === 'escalated' ? 'bg-amber-500' : 'bg-brand-500') : 'bg-slate-200'}`} />
          <span className={`text-xs ${i === idx ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{t(`employee.steps.${s}`)}</span>
        </li>
      ))}
    </ol>
  );
}

function DisputeForm({ e, field, recorded, onDone }: { e: Employee; field: FieldKey; recorded: string; onDone: (d: Dispute) => void }) {
  const { t } = useT();
  const [claim, setClaim] = useState('');
  const [why, setWhy] = useState('');
  const [anon, setAnon] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        onDone(fileDispute({ employeeId: e.id, field, recordedValue: recorded, claimedValue: claim, explanation: why, anonymous: anon }));
      }}
    >
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">{t('employee.whatWrong')}</div>
        <div className="text-lg font-semibold">{t(`disputeField.${field}`)}: <span className="text-slate-700">{recorded}</span></div>
      </div>
      <div>
        <label htmlFor="claim" className="mb-1 block text-base font-medium">{t('employee.correctValue')}</label>
        <input id="claim" className={`${inputCls} !py-3 !text-lg`} value={claim} onChange={(ev) => setClaim(ev.target.value)} autoFocus />
      </div>
      <div>
        <label htmlFor="why" className="mb-1 block text-base font-medium">{t('employee.explain')}</label>
        <textarea id="why" className={`${inputCls} !text-base`} rows={3} value={why} onChange={(ev) => setWhy(ev.target.value)} />
      </div>
      <label className={`flex cursor-pointer gap-3 rounded-xl p-4 ring-2 ${anon ? 'bg-sky-50 ring-sky-500' : 'ring-slate-200'}`}>
        <input type="checkbox" className="mt-1 h-5 w-5 rounded" checked={anon} onChange={(ev) => setAnon(ev.target.checked)} />
        <span>
          <span className="block font-semibold">🛡 {t('employee.anonTitle')}</span>
          <span className="block text-sm text-slate-600">{t('employee.anonDesc')}</span>
        </span>
      </label>
      <Button type="submit" className="w-full !min-h-[52px] !text-lg" disabled={!claim.trim()}>{t('app.submit')}</Button>
    </form>
  );
}

function Record({ e }: { e: Employee }) {
  const { t, isAr } = useT();
  const db = useDb();
  const navigate = useNavigate();
  const employer = db.employers.find((x) => x.id === e.employerId)!;
  const rows = useRows(e);
  const [disputing, setDisputing] = useState<{ key: FieldKey; value: string } | null>(null);
  const [sent, setSent] = useState<Dispute | null>(null);
  const company = isAr ? employer.companyNameAr : employer.companyName;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-lg text-slate-600">{t('employee.hello')}</p>
        <h1 className="text-3xl font-bold">{isAr ? e.nameAr : e.nameEn}</h1>
        <p className="mt-2 text-base text-slate-600">{t('employee.recordSub', { company })}</p>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">{r.label}</div>
                <div className="text-xl font-semibold">{r.value}</div>
                {r.status && <div className="mt-1"><StatusPill status={r.status} /></div>}
              </div>
              <button onClick={() => setDisputing({ key: r.key, value: r.value })} className="shrink-0 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100">
                {t('employee.reportWrong')}
              </button>
            </div>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-medium text-brand-700">ⓘ {t('employee.yourRights')}</summary>
              <p className="mt-2 leading-6 text-slate-700">{t(`rights.${RIGHTS_KEY[r.key]}`)}</p>
            </details>
          </li>
        ))}
      </ul>

      <Modal open={!!disputing && !sent} onClose={() => setDisputing(null)} title={t('employee.disputeTitle')}>
        {disputing && <DisputeForm e={e} field={disputing.key} recorded={disputing.value} onDone={setSent} />}
      </Modal>
      <Modal open={!!sent} onClose={() => { setSent(null); setDisputing(null); }} title={`✓ ${t('employee.sent')}`}>
        {sent && (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-4 text-center">
              <div className="font-mono text-2xl font-bold text-brand-700" dir="ltr">{sent.trackingNo}</div>
            </div>
            <p className="text-base leading-7">{t('employee.sentBody', { no: sent.trackingNo })}</p>
            <Button className="w-full !min-h-[52px] !text-lg" onClick={() => { setSent(null); setDisputing(null); navigate('/employee/disputes'); }}>{t('employee.track')}</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MyDisputes({ e }: { e: Employee }) {
  const { t, date } = useT();
  const db = useDb();
  const mine = db.disputes.filter((d) => d.employeeId === e.id);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">{t('employee.myDisputes')}</h1>
      {mine.length === 0 && <p className="py-10 text-center text-lg text-slate-500">{t('employee.noDisputes')}</p>}
      {mine.map((d) => (
        <article key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono text-sm text-slate-500" dir="ltr">{d.trackingNo}</div>
              <h2 className="text-xl font-semibold">{t(`disputeField.${d.field}`)}</h2>
              <div className="text-sm text-slate-500">{t('disputes.filed')}: {date(d.createdAt)}</div>
            </div>
            <StatusPill status={d.status} />
          </div>
          <Progress status={d.status} />
          {d.employerResponse && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-base"><b>{t('employee.company')}:</b> {d.employerResponse}</p>}
          {d.resolutionNotes && <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-base"><b>{t('landing.mol')}:</b> {d.resolutionNotes}</p>}
        </article>
      ))}
    </div>
  );
}

export default function EmployeePortal() {
  const { t, isAr } = useT();
  const db = useDb();
  const s = useSession();
  if (s?.role !== 'employee') return null;
  const e = db.employees.find((x) => x.id === s.employeeId);
  if (!e) return <Navigate to="/login/employee" replace />;
  const open = db.disputes.filter((d) => d.employeeId === e.id && d.status !== 'resolved').length;
  return (
    <PortalLayout
      portal={t('landing.employee')}
      user={isAr ? e.nameAr : e.nameEn}
      nav={[
        { to: '/employee', label: t('employee.yourRecord'), end: true },
        { to: '/employee/disputes', label: t('employee.myDisputes'), badge: open },
      ]}
    >
      <Routes>
        <Route index element={<Record e={e} />} />
        <Route path="disputes" element={<MyDisputes e={e} />} />
      </Routes>
    </PortalLayout>
  );
}
