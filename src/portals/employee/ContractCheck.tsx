import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Notice } from '../../components/ui';
import { useT } from '../../i18n';
import { analyzeContract } from '../../api/analyzer';
import { SAMPLE_CONTRACTS, type Analysis, type L, type Risk, type SampleContract, type Severity } from '../../domain/contracts';
import type { Employee } from '../../domain/types';

const RISK_STYLE: Record<Risk, { bar: string; chip: string }> = {
  low: { bar: '#10b981', chip: 'bg-emerald-100 text-emerald-800' },
  medium: { bar: '#f59e0b', chip: 'bg-amber-100 text-amber-800' },
  high: { bar: '#ea580c', chip: 'bg-orange-100 text-orange-800' },
  critical: { bar: '#dc2626', chip: 'bg-red-600 text-white' },
};

const SEV_STYLE: Record<Severity, string> = {
  critical: 'border-red-600 bg-red-50',
  high: 'border-orange-500 bg-orange-50',
  medium: 'border-amber-400 bg-amber-50',
};
const SEV_CHIP: Record<Severity, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-400 text-amber-950',
};

function useL() {
  const { lang } = useT();
  return (x: L) => x[lang];
}

function Progress() {
  const { t } = useT();
  const steps = [t('analyzer.step1'), t('analyzer.step2'), t('analyzer.step3')];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 800);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6" role="status" aria-live="polite">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-hidden />
        <b className="text-brand-800">{t('analyzer.analyzing')}</b>
      </div>
      <ol className="space-y-2 text-base">
        {steps.map((s, k) => (
          <li key={s} className={k <= i ? 'text-slate-900' : 'text-slate-400'}>
            {k < i ? '✓' : k === i ? '•' : '○'} {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Report({ a, live }: { a: Analysis; live: boolean }) {
  const { t, num } = useT();
  const l = useL();
  const [tab, setTab] = useState<'violations' | 'positives' | 'questions'>(a.violations.length ? 'violations' : 'positives');
  const tabs = [
    { k: 'violations' as const, label: t('analyzer.violations'), n: a.violations.length },
    { k: 'positives' as const, label: t('analyzer.positives'), n: a.positives.length },
    { k: 'questions' as const, label: t('analyzer.questions'), n: a.questions.length },
  ];
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t('analyzer.report')}</h2>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${RISK_STYLE[a.risk].chip}`}>{t(`analyzer.risk.${a.risk}`)}</span>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm text-slate-600">
            <span>{t('analyzer.riskScore')}</span>
            <b className="tabular-nums text-slate-900">{num(a.riskScore)} / 100</b>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${a.riskScore}%`, background: RISK_STYLE[a.risk].bar }} />
          </div>
        </div>
        <p className="mt-4 text-base leading-7 text-slate-700">{l(a.summary)}</p>
        <p className={`mt-3 rounded-xl p-4 text-base font-semibold leading-7 ${a.risk === 'low' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>{l(a.verdict)}</p>
      </section>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist">
        {tabs.map((x) => (
          <button
            key={x.k}
            role="tab"
            aria-selected={tab === x.k}
            onClick={() => setTab(x.k)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === x.k ? 'bg-white shadow-sm' : 'text-slate-600'}`}
          >
            {x.label} <span className="tabular-nums text-slate-500">({num(x.n)})</span>
          </button>
        ))}
      </div>

      {tab === 'violations' && (
        <ul className="space-y-3">
          {a.violations.length === 0 && <li className="rounded-2xl bg-emerald-50 p-5 text-base text-emerald-900">✓ {t('analyzer.noViolations')}</li>}
          {a.violations.map((v, i) => (
            <li key={i} className={`rounded-2xl border-s-4 p-4 ${SEV_STYLE[v.severity]}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${SEV_CHIP[v.severity]}`}>{t(`analyzer.sev.${v.severity}`)}</span>
                <span className="text-xs font-medium text-slate-500">{t('analyzer.clause', { n: v.clause })}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{l(v.title)}</h3>
              <p className="mt-1 text-base leading-7 text-slate-700">{l(v.problem)}</p>
              <p className="mt-2 rounded-lg bg-white/70 p-3 text-base leading-7">
                <b className="text-brand-700">{t('analyzer.yourRight')}: </b>
                {l(v.right)}
              </p>
              <p className="mt-2 text-xs text-slate-500">⚖ {l(v.law)}</p>
            </li>
          ))}
        </ul>
      )}
      {tab === 'positives' && (
        <ul className="space-y-3">
          {a.positives.map((p, i) => (
            <li key={i} className="rounded-2xl border-s-4 border-emerald-500 bg-emerald-50 p-4">
              <h3 className="text-lg font-semibold text-emerald-900">✓ {l(p.title)}</h3>
              <p className="mt-1 text-base text-emerald-900/80">{l(p.detail)}</p>
            </li>
          ))}
        </ul>
      )}
      {tab === 'questions' && (
        <ol className="space-y-3">
          {a.questions.map((q, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-base">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">{num(i + 1)}</span>
              <span className="leading-7">{l(q)}</span>
            </li>
          ))}
        </ol>
      )}

      {a.violations.length > 0 && (
        <Link to="/employee" className="block rounded-2xl bg-brand-500 p-4 text-center text-base font-semibold text-white hover:bg-brand-600">
          {t('analyzer.reportCta')}
        </Link>
      )}
      <Notice tone="slate">
        {t('analyzer.disclaimer')}
        {!live && <span className="mt-1 block text-xs">{t('analyzer.demoNote')}</span>}
      </Notice>
    </div>
  );
}

export default function ContractCheck({ e }: { e: Employee }) {
  const { t } = useT();
  const l = useL();
  const mine = SAMPLE_CONTRACTS.find((c) => c.employeeId === e.id);
  const samples = SAMPLE_CONTRACTS.filter((c) => c !== mine);
  const [selected, setSelected] = useState<SampleContract | undefined>(mine);
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ analysis: Analysis; live: boolean }>();
  const [showText, setShowText] = useState(false);

  const pick = (c: SampleContract) => {
    setSelected(c);
    setState('idle');
    setResult(undefined);
    setShowText(false);
  };

  const run = async () => {
    if (!selected) return;
    setState('running');
    try {
      setResult(await analyzeContract(selected));
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t('analyzer.title')}</h1>
        <p className="mt-2 text-base text-slate-600">{t('analyzer.sub')}</p>
      </div>

      {selected && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">{selected === mine ? t('analyzer.yourContract') : t('analyzer.sampleContract')}</div>
          <h2 className="text-xl font-semibold">{l(selected.title)}</h2>
          <button className="mt-2 text-sm font-semibold text-brand-700 hover:underline" onClick={() => setShowText((s) => !s)} aria-expanded={showText}>
            {showText ? t('analyzer.hideText') : t('analyzer.showText')}
          </button>
          {showText && (
            <pre dir="ltr" className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-start font-sans text-sm leading-6 text-slate-700">
              {selected.text}
            </pre>
          )}
          {state === 'idle' && (
            <Button className="mt-4 w-full !min-h-[52px] !text-lg" onClick={run}>✦ {t('analyzer.run')}</Button>
          )}
        </section>
      )}

      {state === 'running' && <Progress />}
      {state === 'error' && <Notice tone="red">{t('analyzer.error')}</Notice>}
      {state === 'done' && result && <Report a={result.analysis} live={result.live} />}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('analyzer.trySample')}</h2>
        <ul className="space-y-2">
          {[...(mine ? [mine] : []), ...samples].map((c) => (
            <li key={c.id}>
              <button
                onClick={() => pick(c)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start ${selected === c ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-500'}`}
              >
                <span className="font-medium">{l(c.title)}</span>
                {c === mine && <span className="shrink-0 text-xs font-semibold text-brand-700">{t('analyzer.yours')}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
