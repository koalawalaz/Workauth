import type { ReactNode } from 'react';
import { Pill, StatusPill } from './ui';
import { useT } from '../i18n';
import { useDb } from '../api/store';
import { businessDaysBetween } from '../domain/businessDays';
import type { Dispute } from '../domain/types';

/** Partial name for privacy, e.g. "Ahmad H." (SRS §4.1.4). */
export function partialName(full: string) {
  const parts = full.split(' ');
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : full;
}

export function Deadline({ d }: { d: Dispute }) {
  const { t, date } = useT();
  const db = useDb();
  if (d.status !== 'employer_review' && d.status !== 'submitted') return <span className="text-slate-500">{date(d.deadline)}</span>;
  const left = businessDaysBetween(db.today, d.deadline);
  if (left < 0) return <span className="font-semibold text-red-600">{t('disputes.overdue')}</span>;
  return (
    <span className={left <= 1 ? 'font-semibold text-red-600' : left <= 2 ? 'font-semibold text-amber-700' : 'text-slate-700'}>
      {date(d.deadline)} · {t('disputes.daysLeft', { count: left })}
    </span>
  );
}

export function DisputeCard({ d, who, employer, children }: { d: Dispute; who: 'employer' | 'mol'; employer?: ReactNode; children?: ReactNode }) {
  const { t, isAr, date } = useT();
  const db = useDb();
  const emp = db.employees.find((e) => e.id === d.employeeId);
  const name = emp ? (isAr ? emp.nameAr : emp.nameEn) : '—';
  // Employers never see an anonymous reporter; MoL sees identity with a protection notice (§15.1).
  const shownName = d.anonymous && who === 'employer' ? t('disputes.anonymous') : who === 'employer' ? partialName(name) : name;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-mono text-xs text-slate-500" dir="ltr">{d.trackingNo}</div>
          <h3 className="mt-0.5 font-semibold">{t(`disputeField.${d.field}`)}</h3>
          {employer && <div className="text-sm text-slate-600">{employer}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          {d.anonymous && <Pill tone="blue">🛡 {t('disputes.anonymous')}</Pill>}
          <StatusPill status={d.status} />
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">{t('disputes.employee')}</dt>
          <dd className="font-medium">
            {shownName}
            {d.anonymous && who === 'mol' && <span className="block text-xs font-normal text-sky-700">{t('mol.identityProtected')}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t('disputes.recorded')}</dt>
          <dd className="font-medium">{d.recordedValue || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t('disputes.claimed')}</dt>
          <dd className="font-medium text-red-700">{d.claimedValue || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{d.status === 'escalated' ? t('mol.escalatedOn') : t('disputes.deadline')}</dt>
          <dd>{d.status === 'escalated' ? date(d.escalatedAt) : <Deadline d={d} />}</dd>
        </div>
      </dl>
      {d.explanation && (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="text-xs text-slate-500">{t('disputes.explanation')}: </span>
          {d.explanation}
        </p>
      )}
      {d.employerResponse && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="text-xs">{t('disputes.yourResponse')}: </span>
          {d.employerResponse}
        </p>
      )}
      {d.resolutionNotes && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span className="text-xs">{t('disputes.resolution')}: </span>
          {d.resolutionNotes}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </article>
  );
}
