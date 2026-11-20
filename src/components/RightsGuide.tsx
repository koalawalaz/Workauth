import { useState } from 'react';
import { useT } from '../i18n';
import { RIGHTS_GUIDE } from '../domain/rights';

export default function RightsGuide() {
  const { t, lang } = useT();
  const [cat, setCat] = useState<string>('all');
  const shown = RIGHTS_GUIDE.filter((c) => cat === 'all' || c.id === cat);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t('rightsPage.title')}</h1>
        <p className="mt-2 text-base text-slate-600">{t('rightsPage.sub')}</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('rightsPage.title')}>
        {[{ id: 'all', icon: '', label: t('app.all') }, ...RIGHTS_GUIDE.map((c) => ({ id: c.id, icon: c.icon, label: c.title[lang] }))].map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            aria-pressed={cat === c.id}
            className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ${cat === c.id ? 'bg-brand-500 text-white ring-brand-500' : 'bg-white text-slate-700 ring-slate-300 hover:ring-brand-500'}`}
          >
            {c.icon && <span aria-hidden>{c.icon} </span>}
            {c.label}
          </button>
        ))}
      </div>
      {shown.map((c) => (
        <section key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <span aria-hidden>{c.icon}</span>
            {c.title[lang]}
          </h2>
          <ul className="space-y-4">
            {c.rights.map((r) => (
              <li key={r.title.en} className="border-s-4 border-brand-200 ps-4">
                <h3 className="text-lg font-semibold text-slate-900">{r.title[lang]}</h3>
                <p className="mt-1 text-base leading-7 text-slate-700">{r.detail[lang]}</p>
                <p className="mt-1 text-xs text-slate-500">⚖ {r.law[lang]}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">{t('analyzer.disclaimer')}</p>
    </div>
  );
}
