import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, inputCls, Notice } from '../../components/ui';
import { useT } from '../../i18n';
import { setSession, useDb } from '../../api/store';
import { AuthShell, OtpStep } from './Auth';

export default function EmployerLogin() {
  const { t, isAr } = useT();
  const db = useDb();
  const navigate = useNavigate();
  const [crn, setCrn] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [employerId, setEmployerId] = useState<string | null>(null);

  if (employerId) {
    return (
      <AuthShell title={t('login.otpTitle')}>
        <OtpStep
          onBack={() => setEmployerId(null)}
          onDone={() => {
            setSession({ role: 'employer', employerId });
            navigate('/employer');
          }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('login.employerTitle')}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const found = db.employers.find((x) => x.crn === crn.trim());
          if (!found) return setErr(true);
          setEmployerId(found.id);
        }}
      >
        <Field label={t('login.crn')} required>
          {(id) => <input id={id} className={inputCls} value={crn} onChange={(e) => { setCrn(e.target.value); setErr(false); }} dir="ltr" inputMode="numeric" />}
        </Field>
        <Field label={t('login.password')} required>
          {(id) => <input id={id} type="password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} />}
        </Field>
        {err && <Notice tone="red">{t('login.noAccount')}</Notice>}
        <Button type="submit" className="w-full" disabled={!crn || !pw}>{t('login.signIn')}</Button>
      </form>
      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="mb-2 text-xs font-medium text-slate-500">{t('login.demoAccounts')}</div>
        <div className="flex flex-wrap gap-2">
          {db.employers.slice(0, 4).map((e) => (
            <button key={e.id} onClick={() => { setCrn(e.crn); setPw('demo1234'); }} className="rounded-lg bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200">
              {isAr ? e.companyNameAr : e.companyName} · <span dir="ltr">{e.crn}</span>
            </button>
          ))}
        </div>
      </div>
      <Link to="/register" className="mt-4 block text-center text-sm font-semibold text-brand-600 hover:underline">{t('login.register')} →</Link>
    </AuthShell>
  );
}
