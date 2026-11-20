import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Kpi, tierColor } from '../../components/ui';
import { useT } from '../../i18n';
import { scoreFor, useDb } from '../../api/store';
import { isContractActive, isInsuranceValid, isPaidAtMinimum } from '../../domain/scoring';
import { SECTORS, type Tier } from '../../domain/types';

export default function Overview() {
  const { t, num, isAr } = useT();
  const db = useDb();
  const scored = db.employers.map((e) => ({ e, s: scoreFor(e.id, db) }));
  const rated = scored.filter((x) => x.s.tier !== 'UNRATED');
  const avg = rated.length ? rated.reduce((a, x) => a + x.s.total, 0) / rated.length : 0;
  const active = db.employees.filter((e) => e.status !== 'archived');

  const bySector = SECTORS.map((sec) => {
    const xs = rated.filter((x) => x.e.sector === sec);
    return { name: t(`sector.${sec}`), score: xs.length ? Math.round((xs.reduce((a, x) => a + x.s.total, 0) / xs.length) * 10) / 10 : 0 };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const tiers: Tier[] = ['A+', 'A', 'B', 'RED'];
  const tierData = tiers.map((tier) => ({ tier, name: t(`tier.${tier}`), value: scored.filter((x) => x.s.tier === tier).length })).filter((x) => x.value > 0);

  const violations = [
    { name: t('mol.v.ssc'), value: active.filter((e) => e.sscStatus !== 'verified').length },
    { name: t('mol.v.contract'), value: active.filter((e) => !isContractActive(e, db.today)).length },
    { name: t('mol.v.insurance'), value: active.filter((e) => !isInsuranceValid(e, db.today)).length },
    { name: t('mol.v.pay'), value: active.filter((e) => !isPaidAtMinimum(e)).length },
  ];

  // National trend: mean of every employer's monthly history point.
  const months = Array.from(new Set(Object.values(db.scoreHistory).flat().map((p) => p.month))).sort().slice(-12);
  const trend = months.map((m) => {
    const pts = Object.values(db.scoreHistory).flatMap((h) => h.filter((p) => p.month === m).map((p) => p.score));
    return { month: m, score: pts.length ? Math.round((pts.reduce((a, b) => a + b, 0) / pts.length) * 10) / 10 : 0 };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('mol.overview')}</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={t('mol.kpi.employers')} value={num(db.employers.length)} />
        <Kpi label={t('mol.kpi.workers')} value={num(active.length)} />
        <Kpi label={t('mol.kpi.avg')} value={num(avg, 1)} />
        <Kpi label={t('mol.kpi.red')} value={num(scored.filter((x) => x.s.tier === 'RED').length)} tone="red" />
        <Kpi label={t('mol.kpi.escalated')} value={num(db.disputes.filter((d) => d.status === 'escalated').length)} tone="amber" />
        <Kpi label={t('mol.kpi.provisional')} value={num(db.employers.filter((e) => e.crnStatus === 'provisional').length)} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('mol.bySector')}>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={bySector} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} reversed={isAr} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} orientation={isAr ? 'right' : 'left'} />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {bySector.map((d) => <Cell key={d.name} fill={d.score >= 85 ? '#10b981' : d.score >= 70 ? '#f59e0b' : '#dc2626'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={t('mol.tierDist')}>
          <div className="flex h-64 items-center" dir="ltr">
            <ResponsiveContainer width="60%">
              <PieChart>
                <Pie data={tierData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {tierData.map((d) => <Cell key={d.tier} fill={tierColor(d.tier)} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 text-sm" dir={isAr ? 'rtl' : 'ltr'}>
              {tierData.map((d) => (
                <li key={d.tier} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ background: tierColor(d.tier) }} />
                  <span className="flex-1">{d.name}</span>
                  <b className="tabular-nums">{num(d.value)}</b>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card title={t('mol.violations')}>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={violations} margin={{ left: -20 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} reversed={isAr} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} orientation={isAr ? 'right' : 'left'} />
                <Tooltip />
                <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={t('mol.trend')}>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} reversed={isAr} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} orientation={isAr ? 'right' : 'left'} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#13795b" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
