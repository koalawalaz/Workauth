import { useState } from 'react';
import { DisputeCard } from '../../components/DisputeCard';
import { Button, Card, Field, inputCls, Modal, Notice, Pill, Table, Td } from '../../components/ui';
import { useT } from '../../i18n';
import { createInspector, currentWeights, resolveDispute, saveWeights, setInspectorActive, useDb } from '../../api/store';
import { computeScore } from '../../domain/scoring';
import { GOVERNORATES, type Governorate, type Inspector, type ScoreWeights } from '../../domain/types';
import { InspectionList } from './EmployerDetail';

function ResolveBox({ id, actor }: { id: string; actor: string }) {
  const { t } = useT();
  const [notes, setNotes] = useState('');
  return (
    <div className="space-y-2">
      <textarea className={inputCls} rows={2} placeholder={t('mol.resolutionNotes')} value={notes} onChange={(e) => setNotes(e.target.value)} aria-label={t('mol.resolutionNotes')} />
      <Button disabled={!notes.trim()} onClick={() => resolveDispute(id, notes, actor)}>{t('mol.resolve')}</Button>
    </div>
  );
}

export function EscalatedDisputes({ me }: { me: Inspector }) {
  const { t, isAr } = useT();
  const db = useDb();
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const list = db.disputes.filter((d) => (tab === 'open' ? d.status === 'escalated' : d.status === 'resolved' && d.resolvedBy === 'inspector'));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('mol.nav.disputes')}</h1>
      <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        {(['open', 'closed'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-md px-4 py-1.5 font-medium ${tab === k ? 'bg-white shadow-sm' : 'text-slate-600'}`}>{t(`disputes.${k}`)}</button>
        ))}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-slate-500">{t('disputes.empty')}</p>}
      {list.map((d) => {
        const emp = db.employers.find((e) => e.id === d.employerId);
        return (
          <DisputeCard key={d.id} d={d} who="mol" employer={emp && (isAr ? emp.companyNameAr : emp.companyName)}>
            {d.status === 'escalated' && <ResolveBox id={d.id} actor={me.name} />}
          </DisputeCard>
        );
      })}
    </div>
  );
}

export function AllInspections() {
  const { t } = useT();
  const db = useDb();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('mol.allInspections')}</h1>
      <Notice tone="slate">🔒 {t('mol.immutable')}</Notice>
      <Card>
        <InspectionList items={[...db.inspections].sort((a, b) => b.date.localeCompare(a.date))} showEmployer />
      </Card>
    </div>
  );
}

export function Inspectors({ me }: { me: Inspector }) {
  const { t } = useT();
  const db = useDb();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [no, setNo] = useState('');
  const [govs, setGovs] = useState<Governorate[]>([]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('mol.nav.inspectors')}</h1>
        <Button onClick={() => setOpen(true)}>+ {t('mol.newInspector')}</Button>
      </div>
      <Card>
        <Table head={[t('field.name'), t('mol.empNo'), t('mol.role'), t('mol.governorates'), '']}>
          {db.inspectors.map((i) => (
            <tr key={i.id} className={i.active ? '' : 'opacity-50'}>
              <Td className="font-medium">{i.name}</Td>
              <Td><span dir="ltr">{i.employeeNo}</span></Td>
              <Td><Pill tone={i.role === 'admin' ? 'blue' : 'slate'}>{i.role}</Pill></Td>
              <Td className="!whitespace-normal">{i.governorates.map((g) => t(`gov.${g}`)).join('، ') || '—'}</Td>
              <Td>
                {i.id !== me.id && (
                  <Button variant="ghost" className={i.active ? '!text-red-700' : ''} onClick={() => setInspectorActive(i.id, !i.active, me.name)}>
                    {i.active ? t('mol.deactivate') : t('mol.activate')}
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={t('mol.newInspector')}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createInspector({ name, employeeNo: no, governorates: govs, role: 'inspector' }, me.name);
            setOpen(false);
            setName('');
            setNo('');
            setGovs([]);
          }}
        >
          <Field label={t('field.name')} required>{(id) => <input id={id} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          <Field label={t('mol.empNo')} required>{(id) => <input id={id} className={inputCls} value={no} onChange={(e) => setNo(e.target.value)} dir="ltr" />}</Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">{t('mol.governorates')}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GOVERNORATES.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" checked={govs.includes(g)} onChange={(e) => setGovs(e.target.checked ? [...govs, g] : govs.filter((x) => x !== g))} />
                  {t(`gov.${g}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" className="w-full" disabled={!name || !no || govs.length === 0}>{t('app.save')}</Button>
        </form>
      </Modal>
    </div>
  );
}

export function Weights({ me }: { me: Inspector }) {
  const { t, num, date } = useT();
  const db = useDb();
  const [w, setW] = useState<ScoreWeights>(currentWeights(db));
  const [note, setNote] = useState('');
  const sum = w.ssc + w.contract + w.insurance + w.payment;
  const preview = (() => {
    const scores = db.employers
      .map((e) => computeScore(db.employees.filter((x) => x.employerId === e.id), w, db.today))
      .filter((s) => s.tier !== 'UNRATED');
    return scores.length ? scores.reduce((a, s) => a + s.total, 0) / scores.length : 0;
  })();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('mol.weightsTitle')}</h1>
      <p className="max-w-2xl text-slate-600">{t('mol.weightsSub')}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-5">
            {(['ssc', 'contract', 'insurance', 'payment'] as const).map((k) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-sm">
                  <label htmlFor={`w-${k}`} className="font-medium">{t(`landing.weights.${k}`)}</label>
                  <b className="tabular-nums">{num(w[k])}</b>
                </div>
                <input id={`w-${k}`} type="range" min={0} max={60} value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} className="w-full accent-brand-500" />
              </div>
            ))}
            <Notice tone={sum === 100 ? 'green' : 'red'}>{t('mol.weightsSum', { sum })}</Notice>
            <p className="text-sm text-slate-600">{t('mol.preview', { avg: num(preview, 1) })}</p>
            <Field label={t('mol.note')} required>{(id) => <input id={id} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
            <Button
              disabled={sum !== 100 || !note.trim()}
              onClick={() => {
                saveWeights(w, note, me.name);
                setNote('');
              }}
            >
              {t('app.save')}
            </Button>
          </div>
        </Card>
        <Card title={t('mol.versions')}>
          <Table head={[t('mol.version'), 'SSC / CON / INS / PAY', t('mol.changedBy'), t('mol.note')]}>
            {[...db.weights].reverse().map((v) => (
              <tr key={v.version}>
                <Td className="font-semibold">v{v.version}</Td>
                <Td className="tabular-nums"><span dir="ltr">{v.weights.ssc} / {v.weights.contract} / {v.weights.insurance} / {v.weights.payment}</span></Td>
                <Td>{v.changedBy}<div className="text-xs text-slate-500">{date(v.changedAt)}</div></Td>
                <Td className="!whitespace-normal text-slate-600">{v.note}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}

export function AuditLog() {
  const { t } = useT();
  const db = useDb();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('mol.auditTitle')}</h1>
      <p className="text-slate-600">{t('mol.auditSub')}</p>
      <Card>
        <Table head={[t('mol.at'), t('mol.actor'), t('mol.action'), t('mol.target')]}>
          {db.audit.map((a) => (
            <tr key={a.id}>
              <Td className="font-mono text-xs text-slate-500"><span dir="ltr">{a.at.replace('T', ' ').slice(0, 16)}</span></Td>
              <Td>{a.actor} <Pill tone="slate">{a.role}</Pill></Td>
              <Td className="font-mono text-xs"><span dir="ltr">{a.action}</span></Td>
              <Td>{a.target}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
