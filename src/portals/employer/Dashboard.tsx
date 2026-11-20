import { Link, useNavigate } from 'react-router-dom';
import { BreakdownCard, computeAlerts, EmployeeTable, ScoreCard, TrendCard } from '../../components/EmployerPanels';
import { Button, Card } from '../../components/ui';
import { useT } from '../../i18n';
import { scoreFor, useDb } from '../../api/store';
import { isContractActive, isInsuranceValid, isPaidAtMinimum } from '../../domain/scoring';
import type { Employer, Tier } from '../../domain/types';

function downloadBadge(employer: Employer, score: number, tier: Tier) {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 300;
  const g = c.getContext('2d')!;
  g.fillStyle = '#001d57';
  g.beginPath();
  g.roundRect(0, 0, 600, 300, 32);
  g.fill();
  g.fillStyle = '#005afd';
  g.beginPath();
  g.arc(110, 150, 70, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.font = 'bold 52px sans-serif';
  g.textAlign = 'center';
  g.fillText(tier, 110, 168);
  g.textAlign = 'left';
  g.font = '600 22px sans-serif';
  g.fillStyle = '#b3ccff';
  g.fillText('WORK AUTH CERTIFIED', 210, 110);
  g.fillStyle = '#fff';
  g.font = 'bold 30px sans-serif';
  g.fillText(employer.companyName.slice(0, 26), 210, 155);
  g.font = '20px sans-serif';
  g.fillStyle = '#d9e6ff';
  g.fillText(`Trust Score ${score} / 100 · CRN ${employer.crn}`, 210, 195);
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `workauth-badge-${employer.crn}.png`;
  a.click();
}

export default function Dashboard({ employer }: { employer: Employer }) {
  const { t, isAr } = useT();
  const db = useDb();
  const navigate = useNavigate();
  const s = scoreFor(employer.id, db);
  const employees = db.employees.filter((e) => e.employerId === employer.id);
  const active = employees.filter((e) => e.status !== 'archived');
  const openDisputes = db.disputes.filter((d) => d.employerId === employer.id && d.status === 'employer_review').length;
  const alerts = computeAlerts(employees, openDisputes, db.today, employer.crnStatus === 'provisional');
  const badgeEligible = (s.tier === 'A' || s.tier === 'A+') && employer.crnStatus === 'verified';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">{t('employer.welcome')}, {employer.representative}</p>
        <h1 className="text-2xl font-bold">{isAr ? employer.companyNameAr : employer.companyName}</h1>
      </div>

      {s.tier === 'RED' && (
        <section className="rounded-2xl border-2 border-red-600 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden>⚠️</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-red-800">{t('employer.redTitle')}</h2>
              <p className="mt-1 text-sm text-red-900">{t('employer.redBody')}</p>
              <p className="mt-2 text-xs font-medium text-red-700">{t('employer.redPhases')}</p>
              <h3 className="mt-4 text-sm font-semibold text-red-900">{t('employer.redActions')}</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  ['redSsc', active.filter((e) => e.sscStatus !== 'verified').length],
                  ['redContract', active.filter((e) => !isContractActive(e, db.today)).length],
                  ['redInsurance', active.filter((e) => !isInsuranceValid(e, db.today)).length],
                  ['redPay', active.filter((e) => !isPaidAtMinimum(e)).length],
                ]
                  .filter(([, n]) => (n as number) > 0)
                  .map(([k, n]) => (
                    <li key={k as string}>
                      <Link to="/employer/employees" className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-red-200 hover:ring-red-400">
                        <span className="h-4 w-4 rounded border-2 border-red-400" />
                        {t(`employer.${k}`, { count: n as number })}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {active.length === 0 && (
        <Card title={t('employer.setupTitle')}>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[t('employer.setup1'), t('employer.setup2'), t('employer.setup3')].map((step, i) => (
              <li key={step} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 font-bold text-white">{i + 1}</span>
                <span className="text-sm font-medium">{step}</span>
              </li>
            ))}
          </ol>
          <Button className="mt-4" onClick={() => navigate('/employer/employees?add=1')}>{t('employees.add')}</Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ScoreCard employerId={employer.id} />
        <BreakdownCard s={s} />
        <Card title={t('employer.alerts')}>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-500">{t('employer.noAlerts')}</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.key} className={`flex gap-2 rounded-lg px-3 py-2 text-sm ${a.tone === 'red' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'}`}>
                  <span aria-hidden>{a.tone === 'red' ? '●' : '○'}</span>
                  <Link to={a.key === 'alertDisputes' ? '/employer/disputes' : '/employer/employees'} className="hover:underline">
                    {t(`employer.${a.key}`, { count: a.count })}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendCard employerId={employer.id} />
        </div>
        <Card title={t('employer.badge')}>
          {badgeEligible ? (
            <>
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-brand-900 p-4 text-white">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-bold" dir="ltr">{s.tier}</span>
                <div>
                  <div className="text-xs font-semibold tracking-wider text-brand-200">WORK AUTH CERTIFIED</div>
                  <div className="text-sm font-semibold">{employer.companyName}</div>
                </div>
              </div>
              <p className="mb-3 text-sm text-slate-600">{t('employer.badgeDesc')}</p>
              <Button variant="secondary" onClick={() => downloadBadge(employer, s.total, s.tier)}>{t('employer.downloadBadge')}</Button>
            </>
          ) : (
            <p className="text-sm text-slate-500">🔒 {t('employer.badgeLocked')}</p>
          )}
        </Card>
      </div>

      {active.length > 0 && (
        <Card title={t('employer.summary')} action={<Link to="/employer/employees" className="text-sm font-semibold text-brand-600">{t('employer.viewAll')} →</Link>}>
          <EmployeeTable employees={employees.slice(0, 8)} />
        </Card>
      )}
    </div>
  );
}
