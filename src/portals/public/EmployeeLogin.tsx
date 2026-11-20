import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, inputCls, Notice } from '../../components/ui';
import { useT } from '../../i18n';
import { findEmployeeById, setSession } from '../../api/store';
import { AuthShell, OtpStep } from './Auth';

// Designed for low digital literacy (NFR-USE-02): one question per screen, big type and targets.
export default function EmployeeLogin() {
  const { t } = useT();
  const navigate = useNavigate();
  const [idNo, setIdNo] = useState('');
  const [err, setErr] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  if (employeeId) {
    return (
      <AuthShell title={t('login.otpTitle')}>
        <OtpStep
          large
          onBack={() => setEmployeeId(null)}
          onDone={() => {
            setSession({ role: 'employee', employeeId });
            navigate('/employee');
          }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('login.employeeTitle')} sub={t('login.employeeSub')}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const found = findEmployeeById(idNo);
          if (!found) return setErr(true);
          setEmployeeId(found.id);
        }}
      >
        <label className="block text-lg font-medium" htmlFor="nin">{t('login.idLabel')}</label>
        <input
          id="nin"
          className={`${inputCls} !py-3 !text-xl tracking-wider`}
          value={idNo}
          onChange={(e) => { setIdNo(e.target.value); setErr(false); }}
          dir="ltr"
          autoComplete="off"
        />
        {err && <Notice tone="red">{t('login.idNotFound')}</Notice>}
        <Button type="submit" className="w-full !min-h-[52px] !text-lg" disabled={idNo.trim().length < 6}>{t('app.continue')}</Button>
      </form>
      <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
        {t('login.demoAccounts')}:{' '}
        <button className="rounded bg-slate-100 px-2 py-1 font-mono hover:bg-slate-200" onClick={() => setIdNo('9861234501')} dir="ltr">9861234501</button>
      </div>
    </AuthShell>
  );
}
