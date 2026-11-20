import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { setLang, useT } from '../i18n';
import { advanceClock, getDb, resetDemo, setSession, useDb } from '../api/store';
import { Button } from './ui';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center" dir="ltr" aria-label="Work Auth">
      <img src={light ? './logo-white.png' : './logo-sm.png'} alt="Work Auth" className="h-6 w-auto sm:h-7" width={333} height={80} />
    </Link>
  );
}

export function LangToggle() {
  const { t, lang } = useT();
  return (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
      lang={lang === 'ar' ? 'en' : 'ar'}
    >
      {t('app.language')}
    </button>
  );
}

export interface NavItem {
  to: string;
  label: string;
  badge?: number;
  end?: boolean;
}

export function PortalLayout({ portal, user, nav, children }: { portal: string; user: string; nav: NavItem[]; children: ReactNode }) {
  const { t, date } = useT();
  const db = useDb();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Logo />
          <span className="hidden rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 sm:inline">{portal}</span>
          <div className="ms-auto flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 md:inline">{t('app.today')}: <b className="text-slate-700">{date(db.today)}</b></span>
            <span className="hidden max-w-[16rem] truncate text-sm font-medium text-slate-700 lg:inline">{user}</span>
            <LangToggle />
            <Button
              variant="ghost"
              className="!px-2"
              onClick={() => {
                setSession(null);
                navigate('/');
              }}
            >
              {t('app.logout')}
            </Button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-4">
          <ul className="flex gap-1">
            {nav.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${isActive ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`
                  }
                >
                  {n.label}
                  {!!n.badge && <span className="rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{n.badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Logo />
        <div className="ms-auto flex items-center gap-2">
          <LangToggle />
        </div>
      </div>
    </header>
  );
}

/** Floating presenter controls: jump between portals, move the clock, reset. */
export function DemoMenu() {
  const { t, date } = useT();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const db = useDb();
  const go = (fn: () => void, path: string) => {
    fn();
    setOpen(false);
    navigate(path);
  };
  return (
    <div className="fixed bottom-4 end-4 z-40 print:hidden">
      {open && (
        <div className="mb-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <b>{t('demo.title')}</b>
            <span className="text-xs text-slate-500">{date(db.today)}</span>
          </div>
          <div className="mb-1 text-xs font-medium text-slate-500">{t('demo.switchRole')}</div>
          <div className="space-y-1">
            {[
              [t('demo.asEmployer'), () => setSession({ role: 'employer', employerId: 'emp-1' }), '/employer'],
              [t('demo.asEmployerRed'), () => setSession({ role: 'employer', employerId: 'emp-4' }), '/employer'],
              [t('demo.asEmployee'), () => setSession({ role: 'employee', employeeId: 'ee-demo' }), '/employee'],
              [t('demo.asInspector'), () => setSession({ role: 'mol', inspectorId: 'insp-1' }), '/mol'],
              [t('demo.asAdmin'), () => setSession({ role: 'mol', inspectorId: 'admin-1' }), '/mol'],
            ].map(([label, fn, path]) => (
              <button key={label as string} className="block w-full rounded-lg px-2 py-1.5 text-start hover:bg-slate-100" onClick={() => go(fn as () => void, path as string)}>
                {label as string}
              </button>
            ))}
          </div>
          <hr className="my-2" />
          <button className="block w-full rounded-lg px-2 py-1.5 text-start hover:bg-slate-100" onClick={() => advanceClock(1)}>⏩ {t('demo.advance1')}</button>
          <button
            className="block w-full rounded-lg px-2 py-1.5 text-start hover:bg-slate-100"
            onClick={() => {
              // 5 business days plus any weekend in between: step day by day.
              let added = 0;
              while (added < 5) {
                advanceClock(1);
                const d = new Date(getDb().today + 'T00:00:00Z').getUTCDay();
                if (d !== 5 && d !== 6) added++;
              }
            }}
          >
            ⏭ {t('demo.advance')}
          </button>
          <button
            className="block w-full rounded-lg px-2 py-1.5 text-start text-red-700 hover:bg-red-50"
            onClick={() => {
              if (confirm(t('demo.resetConfirm'))) {
                resetDemo();
                setOpen(false);
                navigate('/');
              }
            }}
          >
            ↺ {t('demo.reset')}
          </button>
          <p className="mt-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">{t('demo.otpHint')}</p>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="ms-auto flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
        aria-expanded={open}
      >
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        {t('demo.menu')}
      </button>
    </div>
  );
}
