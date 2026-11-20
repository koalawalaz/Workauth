import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bar, Card, Pill, ScoreGauge, StatusPill, Table, Td, TierBadge } from './ui';
import { useT } from '../i18n';
import { currentWeights, scoreFor, useDb } from '../api/store';
import { addDays } from '../domain/businessDays';
import { isContractActive, isInsuranceValid, isPaidAtMinimum, type ScoreBreakdown } from '../domain/scoring';
import type { Employee } from '../domain/types';

export function contractStatus(e: Employee, today: string): 'active' | 'expired' | 'noContract' {
  if (!e.docs.contract) return 'noContract';
  return isContractActive(e, today) ? 'active' : 'expired';
}

export function ScoreCard({ employerId }: { employerId: string }) {
  const { t } = useT();
  const db = useDb();
  const s = scoreFor(employerId, db);
  return (
    <Card title={t('employer.trustScore')} className="flex flex-col">
      <ScoreGauge score={s.total} tier={s.tier} />
      <div className="mt-3 text-center">
        <TierBadge tier={s.tier} size="lg" />
        <p className="mt-2 text-sm text-slate-600">{t(`tier.desc.${s.tier}`)}</p>
      </div>
    </Card>
  );
}

export function BreakdownCard({ s }: { s: ScoreBreakdown }) {
  const { t, num } = useT();
  const db = useDb();
  const w = currentWeights(db);
  const n = s.counts.employees;
  const rows = [
    { k: 'ssc', v: s.ssc, max: w.ssc, detail: `${num(s.counts.sscVerified)} / ${num(n)}` },
    { k: 'contract', v: s.contract, max: w.contract, detail: `${num(s.counts.contractsActive)} / ${num(n)}` },
    { k: 'insurance', v: s.insurance, max: w.insurance, detail: `${num(s.counts.insured)} / ${num(n)}` },
    { k: 'payment', v: s.payment, max: w.payment, detail: `${num(s.counts.paidAtMinimum)} / ${num(n)}` },
  ] as const;
  return (
    <Card title={t('employer.breakdown')}>
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.k}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-slate-700">{t(`landing.weights.${r.k}`)}</span>
              <span className="tabular-nums text-slate-500">
                <b className="text-slate-900">{num(r.v, r.v % 1 ? 1 : 0)}</b> / {num(r.max)} <span className="text-xs">({r.detail})</span>
              </span>
            </div>
            <Bar value={r.v} max={r.max} color={r.v >= r.max * 0.85 ? '#10b981' : r.v >= r.max * 0.7 ? '#f59e0b' : '#dc2626'} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function TrendCard({ employerId }: { employerId: string }) {
  const { t, isAr } = useT();
  const db = useDb();
  const data = (db.scoreHistory[employerId] ?? []).slice(-12);
  return (
    <Card title={t('employer.trend')}>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">—</p>
      ) : (
        <div className="h-56" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(m: string) => new Date(m + '-01').toLocaleDateString(isAr ? 'ar-JO-u-nu-latn' : 'en-GB', { month: 'short' })} reversed={isAr} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} orientation={isAr ? 'right' : 'left'} />
              <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="4 4" />
              <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#005afd" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export interface AlertItem {
  key: string;
  count: number;
  tone: 'red' | 'amber';
}

export function computeAlerts(employees: Employee[], openDisputes: number, today: string, provisional: boolean): AlertItem[] {
  const list = employees.filter((e) => e.status !== 'archived');
  const in30 = addDays(today, 30);
  const expiring = list.filter(
    (e) => (e.endDate && e.endDate >= today && e.endDate <= in30) || (e.insuranceExpiry && e.insuranceExpiry >= today && e.insuranceExpiry <= in30),
  ).length;
  const items: AlertItem[] = [
    { key: 'alertDisputes', count: openDisputes, tone: 'red' },
    { key: 'alertMismatch', count: list.filter((e) => e.sscStatus !== 'verified').length, tone: 'red' },
    { key: 'alertUnderpaid', count: list.filter((e) => !isPaidAtMinimum(e)).length, tone: 'red' },
    { key: 'alertUninsured', count: list.filter((e) => !isInsuranceValid(e, today)).length, tone: 'red' },
    { key: 'alertExpired', count: list.filter((e) => !isContractActive(e, today)).length, tone: 'amber' },
    { key: 'alertExpiring', count: expiring, tone: 'amber' },
  ];
  const out = items.filter((i) => i.count > 0);
  if (provisional) out.unshift({ key: 'alertProvisional', count: 1, tone: 'amber' });
  return out;
}

export function EmployeeTable({ employees, onRowClick, showArchived }: { employees: Employee[]; onRowClick?: (e: Employee) => void; showArchived?: boolean }) {
  const { t, isAr, num } = useT();
  const db = useDb();
  const openDisputeIds = new Set(db.disputes.filter((d) => d.status !== 'resolved').map((d) => d.employeeId));
  const list = employees.filter((e) => showArchived || e.status !== 'archived');
  return (
    <Table head={[t('field.name'), t('field.jobTitle'), t('field.salary'), t('field.sscStatus'), t('field.insurance'), t('field.contractType'), '']}>
      {list.map((e) => {
        const cs = contractStatus(e, db.today);
        return (
          <tr key={e.id} className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''} ${e.status === 'archived' ? 'opacity-50' : ''}`} onClick={() => onRowClick?.(e)}>
            <Td>
              <div className="font-medium text-slate-900">{isAr ? e.nameAr : e.nameEn}</div>
              <div className="text-xs text-slate-500" dir="ltr">{e.idType} {e.idNumber}</div>
            </Td>
            <Td>{e.jobTitle}</Td>
            <Td className={`tabular-nums ${!isPaidAtMinimum(e) ? 'font-semibold text-red-600' : ''}`}>{num(e.salary)} {t('app.jod')}</Td>
            <Td><StatusPill status={e.sscStatus} /></Td>
            <Td><StatusPill status={isInsuranceValid(e, db.today) ? 'insured' : 'uninsured'} /></Td>
            <Td>
              <span className="me-2">{t(`contract.${e.contractType}`)}</span>
              {cs !== 'active' && <StatusPill status={cs} />}
            </Td>
            <Td>
              {e.status === 'archived' ? <StatusPill status="archived" /> : openDisputeIds.has(e.id) ? <Pill tone="amber">{t('status.disputed')}</Pill> : null}
            </Td>
          </tr>
        );
      })}
    </Table>
  );
}
