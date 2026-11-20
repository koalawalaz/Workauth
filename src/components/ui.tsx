import { useEffect, useId, type ReactNode } from 'react';
import type { Tier } from '../domain/types';
import { useT } from '../i18n';

export function Card({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TIER_STYLE: Record<Tier, string> = {
  'A+': 'bg-emerald-600 text-white',
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-amber-100 text-amber-800',
  RED: 'bg-red-600 text-white',
  UNRATED: 'bg-slate-200 text-slate-700',
};

export function TierBadge({ tier, size = 'sm' }: { tier: Tier; size?: 'sm' | 'lg' }) {
  const { t } = useT();
  const sz = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return <span dir="ltr" className={`inline-flex items-center rounded-full font-semibold ${sz} ${TIER_STYLE[tier]}`}>{t(`tier.${tier}`)}</span>;
}

export function tierColor(tier: Tier): string {
  return { 'A+': '#059669', A: '#10b981', B: '#f59e0b', RED: '#dc2626', UNRATED: '#94a3b8' }[tier];
}

type Tone = 'green' | 'amber' | 'red' | 'slate' | 'blue';
const TONE: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[tone]}`}>{children}</span>;
}

export function statusTone(s: string): Tone {
  if (['verified', 'active', 'resolved', 'insured', 'compliant'].includes(s)) return 'green';
  if (['mismatch', 'escalated', 'expired', 'uninsured', 'noContract', 'penalty_referred', 'case_opened'].includes(s)) return 'red';
  if (['pending', 'disputed', 'employer_review', 'submitted', 'provisional', 'warning_issued', 'not_enrolled'].includes(s)) return 'amber';
  return 'slate';
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useT();
  return <Pill tone={statusTone(status)}>{t(`status.${status}`)}</Pill>;
}

/** Semi-circle gauge for the Trust Score. */
export function ScoreGauge({ score, tier }: { score: number; tier: Tier }) {
  const { num } = useT();
  const r = 80;
  const c = Math.PI * r;
  const pct = tier === 'UNRATED' ? 0 : Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative mx-auto w-56" dir="ltr">
      <svg viewBox="0 0 200 115" className="w-full" role="img" aria-label={`Trust Score ${score} of 100`}>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={tierColor(tier)}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: 'stroke-dasharray 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="text-4xl font-bold tabular-nums text-slate-900">{num(score, score % 1 ? 1 : 0)}</div>
        <div className="text-xs text-slate-500">/ 100</div>
      </div>
    </div>
  );
}

export function Bar({ value, max, color = '#13795b' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Button({
  children, variant = 'primary', className = '', ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const v = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-slate-300',
    secondary: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300',
    ghost: 'text-slate-700 hover:bg-slate-100',
  }[variant];
  return (
    <button className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${v} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, children, hint, required }: { label: ReactNode; children: (id: string) => ReactNode; hint?: ReactNode; required?: boolean }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const inputCls =
  'block w-full rounded-lg border-0 px-3 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 sm:text-sm bg-white';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  const { t } = useT();
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label={t('app.close')}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs sm:text-sm">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < current ? 'bg-brand-500 text-white' : i === current ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' : 'bg-slate-100 text-slate-500'}`}>
            {i < current ? '✓' : i + 1}
          </span>
          <span className={`hidden sm:inline ${i === current ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{s}</span>
          {i < steps.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
        </li>
      ))}
    </ol>
  );
}

export function Notice({ tone = 'blue', children }: { tone?: Tone; children: ReactNode }) {
  return <div className={`rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${TONE[tone]}`}>{children}</div>;
}

export function Kpi({ label, value, tone }: { label: string; value: ReactNode; tone?: 'red' | 'amber' }) {
  const c = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-900';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-start text-xs uppercase tracking-wide text-slate-500">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-5 py-2 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-5 py-3 ${className}`}>{children}</td>;
}
