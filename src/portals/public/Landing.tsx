import { Link } from 'react-router-dom';
import { PublicHeader } from '../../components/Layout';
import { useT } from '../../i18n';
import { currentWeights, scoreFor, useDb } from '../../api/store';

export default function Landing() {
  const { t, num } = useT();
  const db = useDb();
  const w = currentWeights(db);
  const scores = db.employers.map((e) => scoreFor(e.id, db));
  const rated = scores.filter((s) => s.tier !== 'UNRATED');
  const avg = rated.length ? rated.reduce((a, s) => a + s.total, 0) / rated.length : 0;
  const workers = db.employees.filter((e) => e.status !== 'archived').length;

  const portals = [
    { to: '/login/employer', title: t('landing.employer'), desc: t('landing.employerDesc'), icon: '🏢' },
    { to: '/login/employee', title: t('landing.employee'), desc: t('landing.employeeDesc'), icon: '👷' },
    { to: '/login/mol', title: t('landing.mol'), desc: t('landing.molDesc'), icon: '🏛️' },
  ];

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <section className="bg-gradient-to-b from-brand-900 to-brand-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">{t('app.prototype')}</span>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">{t('landing.hero')}</h1>
          <p className="mt-4 max-w-2xl text-base text-brand-100 sm:text-lg">{t('landing.sub')}</p>
          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [t('landing.stats.employers'), num(db.employers.length)],
              [t('landing.stats.workers'), num(workers)],
              [t('landing.stats.avg'), num(avg, 1)],
              [t('landing.stats.red'), num(scores.filter((s) => s.tier === 'RED').length)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/10 p-4">
                <dt className="text-xs text-brand-100">{k}</dt>
                <dd className="text-2xl font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('landing.enterAs')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {portals.map((p) => (
            <Link key={p.to} to={p.to} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md">
              <div className="text-3xl" aria-hidden>{p.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-brand-700">{p.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-brand-600">→</span>
            </Link>
          ))}
        </div>
        <Link to="/directory" className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-4 hover:border-brand-500">
          <div>
            <div className="font-semibold">{t('landing.directory')}</div>
            <div className="text-sm text-slate-600">{t('landing.directoryDesc')}</div>
          </div>
          <span className="text-brand-600">→</span>
        </Link>
        <Link to="/rights" className="mt-3 flex items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-4 hover:border-brand-500">
          <div>
            <div className="font-semibold">⚖️ {t('rightsPage.title')}</div>
            <div className="text-sm text-slate-600">{t('rightsPage.linkDesc')}</div>
          </div>
          <span className="text-brand-600">→</span>
        </Link>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">{t('landing.how')}</h2>
            <ul className="mt-5 space-y-3">
              {(['ssc', 'contract', 'insurance', 'payment'] as const).map((k) => (
                <li key={k} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 rounded-lg bg-brand-50 py-1 text-center text-sm font-bold text-brand-700 tabular-nums">{num(w[k])}</span>
                  <span className="text-slate-700">{t(`landing.weights.${k}`)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              {(['A+', 'A', 'B', 'RED'] as const).map((tier) => (
                <span key={tier} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  <b dir="ltr">{t(`tier.${tier}`)}</b> · {t(`tier.desc.${tier}`)}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="font-semibold">{t('landing.roadmap')}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t('landing.roadmapItems')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
