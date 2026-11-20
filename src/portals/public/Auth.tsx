import { useState, type ReactNode } from 'react';
import { PublicHeader } from '../../components/Layout';
import { Button, Field, inputCls, Notice } from '../../components/ui';
import { useT } from '../../i18n';

export const DEMO_OTP = '123456';

export function AuthShell({ title, sub, children, wide }: { title: string; sub?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className={`mx-auto px-4 py-10 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <h1 className="text-2xl font-bold">{title}</h1>
        {sub && <p className="mt-1 text-slate-600">{sub}</p>}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
      </main>
    </div>
  );
}

/** Second factor screen shared by every portal (FR-AUTH-02/04). */
export function OtpStep({ onDone, onBack, large }: { onDone: () => void; onBack: () => void; large?: boolean }) {
  const { t } = useT();
  const [code, setCode] = useState('');
  const [err, setErr] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim() === DEMO_OTP) onDone();
        else setErr(true);
      }}
    >
      <p className={large ? 'text-lg' : 'text-sm text-slate-600'}>{t('login.otpSent')}</p>
      <Field label={t('login.otp')}>
        {(id) => (
          <input
            id={id}
            className={`${inputCls} text-center tracking-[0.5em] ${large ? '!text-2xl !py-3' : 'text-lg'}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''));
              setErr(false);
            }}
            dir="ltr"
            autoFocus
          />
        )}
      </Field>
      {err && <Notice tone="red">{t('login.otpWrong')}</Notice>}
      <Notice tone="slate">{t('demo.otpHint')}</Notice>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onBack}>{t('app.back')}</Button>
        <Button type="submit" className={`flex-1 ${large ? '!text-lg !min-h-[52px]' : ''}`} disabled={code.length !== 6}>{t('app.continue')}</Button>
      </div>
    </form>
  );
}
