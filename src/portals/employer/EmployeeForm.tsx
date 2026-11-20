import { useState } from 'react';
import { Button, Field, inputCls, Notice, Stepper } from '../../components/ui';
import { useT } from '../../i18n';
import type { EmployeeInput } from '../../api/store';
import type { ContractType, Employee } from '../../domain/types';

const EMPTY: EmployeeInput = {
  nameEn: '', nameAr: '', idType: 'NIN', idNumber: '', dob: '', nationality: 'Jordanian', gender: 'M',
  jobTitle: '', department: '', contractType: 'permanent', startDate: '', endDate: undefined, salary: 0,
  sscEnrolledDeclared: true, sscRef: '', insured: true, insuranceProvider: '', insuranceExpiry: '', docs: {},
};

function FileInput({ label, value, maxMb, accept, onChange, required }: { label: string; value?: string; maxMb: number; accept: string; onChange: (name?: string) => void; required?: boolean }) {
  const { t } = useT();
  const [err, setErr] = useState('');
  return (
    <Field label={label} required={required}>
      {(id) => (
        <div className="rounded-lg border border-dashed border-slate-300 p-3">
          <input
            id={id}
            type="file"
            accept={accept}
            className="block w-full text-sm file:me-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setErr('');
              if (!f) return;
              const okType = accept.split(',').some((a) => (a.startsWith('.') ? f.name.toLowerCase().endsWith(a) : f.type.startsWith(a.replace('*', ''))));
              if (!okType) return setErr(t('employees.fileType'));
              if (f.size > maxMb * 1024 * 1024) return setErr(t('employees.fileTooBig', { max: maxMb }));
              onChange(f.name);
            }}
          />
          {value && !err && (
            <p className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
              ✓ {t('employees.uploaded')}: <b dir="ltr">{value}</b> · {t('employees.scanOk')}
            </p>
          )}
          {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
        </div>
      )}
    </Field>
  );
}

export default function EmployeeForm({ initial, onSave, onCancel, error }: { initial?: Employee; onSave: (v: EmployeeInput) => void; onCancel: () => void; error?: string }) {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [v, setV] = useState<EmployeeInput>(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [missing, setMissing] = useState(false);
  const set = <K extends keyof EmployeeInput>(k: K, val: EmployeeInput[K]) => setV((x) => ({ ...x, [k]: val }));
  const steps = [t('employees.stepPersonal'), t('employees.stepEmployment'), t('employees.stepCompliance'), t('employees.stepDocs')];

  const valid = [
    !!(v.nameEn && v.nameAr && v.idNumber.trim().length >= 6 && v.dob && v.nationality),
    !!(v.jobTitle && v.department && v.startDate && v.salary > 0 && (v.contractType === 'permanent' || v.endDate)),
    !!((!v.sscEnrolledDeclared || v.sscRef) && (!v.insured || (v.insuranceProvider && v.insuranceExpiry))),
    true,
  ];

  const next = () => {
    if (!valid[step]) return setMissing(true);
    setMissing(false);
    if (step < 3) setStep(step + 1);
    else onSave(v);
  };

  return (
    <div>
      <Stepper steps={steps} current={step} />
      <div className="grid gap-4 sm:grid-cols-2">
        {step === 0 && (
          <>
            <Field label={t('field.nameEn')} required>{(id) => <input id={id} className={inputCls} value={v.nameEn} onChange={(e) => set('nameEn', e.target.value)} dir="ltr" />}</Field>
            <Field label={t('field.nameAr')} required>{(id) => <input id={id} className={inputCls} value={v.nameAr} onChange={(e) => set('nameAr', e.target.value)} dir="rtl" />}</Field>
            <Field label={t('field.idType')}>
              {(id) => (
                <select id={id} className={inputCls} value={v.idType} onChange={(e) => { const it = e.target.value as 'NIN' | 'WPN'; set('idType', it); if (it === 'NIN') set('nationality', 'Jordanian'); }}>
                  <option value="NIN">NIN — Jordanian</option>
                  <option value="WPN">WPN — Work permit</option>
                </select>
              )}
            </Field>
            <Field label={t('field.idNumber')} required hint={t('employees.sscHint')}>{(id) => <input id={id} className={inputCls} value={v.idNumber} onChange={(e) => set('idNumber', e.target.value)} dir="ltr" disabled={!!initial} />}</Field>
            <Field label={t('field.dob')} required>{(id) => <input id={id} type="date" className={inputCls} value={v.dob} onChange={(e) => set('dob', e.target.value)} />}</Field>
            <Field label={t('field.nationality')} required>{(id) => <input id={id} className={inputCls} value={v.nationality} onChange={(e) => set('nationality', e.target.value)} />}</Field>
            <Field label={t('field.gender')}>
              {(id) => (
                <select id={id} className={inputCls} value={v.gender} onChange={(e) => set('gender', e.target.value as 'M' | 'F')}>
                  <option value="M">{t('field.male')}</option>
                  <option value="F">{t('field.female')}</option>
                </select>
              )}
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <Field label={t('field.jobTitle')} required>{(id) => <input id={id} className={inputCls} value={v.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />}</Field>
            <Field label={t('field.department')} required>{(id) => <input id={id} className={inputCls} value={v.department} onChange={(e) => set('department', e.target.value)} />}</Field>
            <Field label={t('field.contractType')}>
              {(id) => (
                <select id={id} className={inputCls} value={v.contractType} onChange={(e) => set('contractType', e.target.value as ContractType)}>
                  {(['permanent', 'temporary', 'part-time', 'seasonal'] as const).map((c) => <option key={c} value={c}>{t(`contract.${c}`)}</option>)}
                </select>
              )}
            </Field>
            <Field label={t('field.salary')} required hint={`${t('app.jod')} · min 260`}>
              {(id) => <input id={id} type="number" min={0} className={inputCls} value={v.salary || ''} onChange={(e) => set('salary', Number(e.target.value))} dir="ltr" />}
            </Field>
            <Field label={t('field.startDate')} required>{(id) => <input id={id} type="date" className={inputCls} value={v.startDate} onChange={(e) => set('startDate', e.target.value)} />}</Field>
            <Field label={t('field.endDate')} required={v.contractType !== 'permanent'}>
              {(id) => <input id={id} type="date" className={inputCls} value={v.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || undefined)} />}
            </Field>
          </>
        )}
        {step === 2 && (
          <>
            <Field label={t('field.sscEnrolled')}>
              {(id) => (
                <select id={id} className={inputCls} value={v.sscEnrolledDeclared ? 'y' : 'n'} onChange={(e) => set('sscEnrolledDeclared', e.target.value === 'y')}>
                  <option value="y">{t('app.yes')}</option>
                  <option value="n">{t('app.no')}</option>
                </select>
              )}
            </Field>
            <Field label={t('field.sscRef')} required={v.sscEnrolledDeclared}>{(id) => <input id={id} className={inputCls} value={v.sscRef ?? ''} onChange={(e) => set('sscRef', e.target.value)} dir="ltr" disabled={!v.sscEnrolledDeclared} />}</Field>
            <Field label={t('field.insured')}>
              {(id) => (
                <select id={id} className={inputCls} value={v.insured ? 'y' : 'n'} onChange={(e) => set('insured', e.target.value === 'y')}>
                  <option value="y">{t('app.yes')}</option>
                  <option value="n">{t('app.no')}</option>
                </select>
              )}
            </Field>
            <div />
            <Field label={t('field.insuranceProvider')} required={v.insured}>{(id) => <input id={id} className={inputCls} value={v.insuranceProvider ?? ''} onChange={(e) => set('insuranceProvider', e.target.value)} disabled={!v.insured} />}</Field>
            <Field label={t('field.insuranceExpiry')} required={v.insured}>{(id) => <input id={id} type="date" className={inputCls} value={v.insuranceExpiry ?? ''} onChange={(e) => set('insuranceExpiry', e.target.value)} disabled={!v.insured} />}</Field>
          </>
        )}
        {step === 3 && (
          <div className="space-y-4 sm:col-span-2">
            <FileInput label={t('field.contractDoc')} accept=".pdf" maxMb={10} value={v.docs.contract} onChange={(n) => set('docs', { ...v.docs, contract: n })} required />
            <FileInput label={t('field.sscDoc')} accept=".pdf,image/*" maxMb={5} value={v.docs.ssc} onChange={(n) => set('docs', { ...v.docs, ssc: n })} />
            {v.insured && <FileInput label={t('field.insuranceDoc')} accept=".pdf,image/*" maxMb={5} value={v.docs.insurance} onChange={(n) => set('docs', { ...v.docs, insurance: n })} />}
          </div>
        )}
      </div>
      {missing && <div className="mt-4"><Notice tone="red">{t('employees.required')}</Notice></div>}
      {error && <div className="mt-4"><Notice tone="red">{error}</Notice></div>}
      <div className="mt-6 flex justify-between gap-2">
        <Button variant="secondary" onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}>{step === 0 ? t('app.cancel') : t('app.back')}</Button>
        <Button onClick={next}>{step === 3 ? t('app.save') : t('app.continue')}</Button>
      </div>
    </div>
  );
}
