import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { setSession, useDb } from '../../api/store';
import { AuthShell, OtpStep } from './Auth';

export default function MolLogin() {
  const { t } = useT();
  const db = useDb();
  const navigate = useNavigate();
  const [chosen, setChosen] = useState<string | null>(null);

  if (chosen) {
    return (
      <AuthShell title={t('login.otpTitle')}>
        <OtpStep
          onBack={() => setChosen(null)}
          onDone={() => {
            setSession({ role: 'mol', inspectorId: chosen });
            navigate('/mol');
          }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('login.molTitle')} sub={t('login.molSub')}>
      <div className="mb-3 text-sm font-medium text-slate-700">{t('login.chooseAccount')}</div>
      <ul className="space-y-2">
        {db.inspectors.filter((i) => i.active).map((i) => (
          <li key={i.id}>
            <button onClick={() => setChosen(i.id)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-start hover:border-brand-500 hover:bg-brand-50">
              <span>
                <span className="block font-medium">{i.name}</span>
                <span className="block text-xs text-slate-500">
                  <span dir="ltr">{i.employeeNo}</span> · {i.role === 'admin' ? 'Admin' : i.governorates.map((g) => t(`gov.${g}`)).join('، ')}
                </span>
              </span>
              <span className="text-brand-600">→</span>
            </button>
          </li>
        ))}
      </ul>
    </AuthShell>
  );
}
