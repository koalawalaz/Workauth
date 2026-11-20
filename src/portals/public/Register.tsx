import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, inputCls, Notice, Stepper } from '../../components/ui';
import { useT } from '../../i18n';
import { lookupCrn, registerEmployer, setSession, type CrnLookup } from '../../api/store';
import { GOVERNORATES, SECTORS, type Governorate, type Sector } from '../../domain/types';
import { AuthShell, OtpStep } from './Auth';

export default function Register() {
  const { t } = useT();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [crn, setCrn] = useState('');
  const [lookup, setLookup] = useState<CrnLookup | null>(null);
  const [f, setF] = useState({
    companyName: '', companyNameAr: '', address: '', representative: '', designation: '',
    email: '', phone: '+9627', sector: 'construction' as Sector, governorate: 'Amman' as Governorate, size: '10', password: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const doLookup = () => {
    const r = lookupCrn(crn);
    setLookup(r);
    if (r.ok && r.verified) setF((x) => ({ ...x, companyName: r.companyName, companyNameAr: r.companyNameAr, address: r.address }));
  };

  const finish = () => {
    const emp = registerEmployer({
      companyName: f.companyName, companyNameAr: f.companyNameAr || f.companyName, crn: crn.trim(),
      crnStatus: lookup && lookup.ok && lookup.verified ? 'verified' : 'provisional',
      sector: f.sector, governorate: f.governorate, address: f.address, representative: f.representative,
      contactEmail: f.email, contactPhone: f.phone,
    });
    setSession({ role: 'employer', employerId: emp.id });
    navigate('/employer');
  };

  const step2Valid = f.companyName && f.representative && f.email.includes('@') && f.phone.length >= 12 && f.password.length >= 8;

  return (
    <AuthShell title={t('register.title')} wide>
      <Stepper steps={[t('register.step1'), t('register.step2'), t('register.step3')]} current={step} />

      {step === 0 && (
        <div className="space-y-4">
          <Field label={t('login.crn')} hint={t('register.crnHint')} required>
            {(id) => (
              <div className="flex gap-2">
                <input id={id} className={inputCls} value={crn} onChange={(e) => { setCrn(e.target.value); setLookup(null); }} dir="ltr" inputMode="numeric" />
                <Button type="button" variant="secondary" onClick={doLookup} disabled={crn.trim().length < 4}>{t('register.lookup')}</Button>
              </div>
            )}
          </Field>
          {lookup && !lookup.ok && <Notice tone="red">{t('register.duplicate')}</Notice>}
          {lookup && lookup.ok && lookup.verified && <Notice tone="green">✓ {t('register.verified')}</Notice>}
          {lookup && lookup.ok && !lookup.verified && <Notice tone="amber">{t('register.provisional')}</Notice>}
          <div className="flex justify-end">
            <Button disabled={!lookup || !lookup.ok} onClick={() => setStep(1)}>{t('app.continue')}</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <Field label={t('register.companyName')} required>{(id) => <input id={id} className={inputCls} value={f.companyName} onChange={set('companyName')} />}</Field>
          <Field label={t('register.companyNameAr')}>{(id) => <input id={id} className={inputCls} value={f.companyNameAr} onChange={set('companyNameAr')} dir="rtl" />}</Field>
          <div className="sm:col-span-2"><Field label={t('register.address')}>{(id) => <input id={id} className={inputCls} value={f.address} onChange={set('address')} />}</Field></div>
          <Field label={t('register.representative')} required>{(id) => <input id={id} className={inputCls} value={f.representative} onChange={set('representative')} />}</Field>
          <Field label={t('register.designation')}>{(id) => <input id={id} className={inputCls} value={f.designation} onChange={set('designation')} />}</Field>
          <Field label={t('register.email')} required>{(id) => <input id={id} type="email" className={inputCls} value={f.email} onChange={set('email')} dir="ltr" />}</Field>
          <Field label={t('register.phone')} required>{(id) => <input id={id} type="tel" className={inputCls} value={f.phone} onChange={set('phone')} dir="ltr" />}</Field>
          <Field label={t('field.sector')}>
            {(id) => <select id={id} className={inputCls} value={f.sector} onChange={set('sector')}>{SECTORS.map((s) => <option key={s} value={s}>{t(`sector.${s}`)}</option>)}</select>}
          </Field>
          <Field label={t('field.governorate')}>
            {(id) => <select id={id} className={inputCls} value={f.governorate} onChange={set('governorate')}>{GOVERNORATES.map((g) => <option key={g} value={g}>{t(`gov.${g}`)}</option>)}</select>}
          </Field>
          <Field label={t('register.size')}>{(id) => <input id={id} type="number" min={1} className={inputCls} value={f.size} onChange={set('size')} />}</Field>
          <Field label={t('register.password')} required hint="8+">{(id) => <input id={id} type="password" className={inputCls} value={f.password} onChange={set('password')} />}</Field>
          <div className="flex justify-between gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>{t('app.back')}</Button>
            <Button type="submit" disabled={!step2Valid}>{t('app.continue')}</Button>
          </div>
        </form>
      )}

      {step === 2 && <OtpStep onBack={() => setStep(1)} onDone={finish} />}
    </AuthShell>
  );
}
