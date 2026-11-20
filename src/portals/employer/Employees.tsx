import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmployeeTable } from '../../components/EmployerPanels';
import { Button, Card, inputCls, Modal, Notice } from '../../components/ui';
import { useT } from '../../i18n';
import { addEmployee, archiveEmployee, getDb, scoreFor, updateEmployee, useDb } from '../../api/store';
import type { Employee, Employer } from '../../domain/types';
import EmployeeForm from './EmployeeForm';

export default function Employees({ employer }: { employer: Employer }) {
  const { t, num } = useT();
  const db = useDb();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<Employee | 'new' | null>(params.get('add') ? 'new' : null);
  const [error, setError] = useState<string>();
  const [flash, setFlash] = useState<string>();

  const all = db.employees.filter((e) => e.employerId === employer.id);
  const needle = q.trim().toLowerCase();
  const list = all.filter((e) => !needle || e.nameEn.toLowerCase().includes(needle) || e.nameAr.includes(needle) || e.idNumber.includes(needle));
  const actor = employer.representative;

  const close = () => {
    setEditing(null);
    setError(undefined);
    if (params.get('add')) setParams({});
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('employees.title')} <span className="text-base font-normal text-slate-500">({num(all.filter((e) => e.status !== 'archived').length)})</span></h1>
        <Button onClick={() => setEditing('new')}>+ {t('employees.add')}</Button>
      </div>
      {flash && <Notice tone="green">{flash}</Notice>}
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input className={`${inputCls} sm:max-w-xs`} placeholder={t('employees.filter')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('employees.filter')} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="rounded" />
            {t('employees.showArchived')}
          </label>
        </div>
        {all.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{t('employees.empty')}</p>
        ) : (
          <EmployeeTable employees={list} showArchived={archived} onRowClick={(e) => e.status !== 'archived' && setEditing(e)} />
        )}
      </Card>

      <Modal open={editing !== null} onClose={close} title={editing === 'new' ? t('employees.add') : t('employees.edit')}>
        {editing !== null && (
          <>
            <EmployeeForm
              key={editing === 'new' ? 'new' : editing.id}
              initial={editing === 'new' ? undefined : editing}
              error={error}
              onCancel={close}
              onSave={(v) => {
                let status: string;
                if (editing === 'new') {
                  const res = addEmployee(employer.id, v, actor);
                  if (!res.ok) return setError(t(`employees.${res.error}`));
                  status = res.employee.sscStatus;
                } else {
                  updateEmployee(editing.id, v, actor);
                  status = getDb().employees.find((e) => e.id === editing.id)!.sscStatus;
                }
                const s = scoreFor(employer.id, getDb());
                setFlash(t('employees.saved', { status: t(`status.${status}`), score: num(s.total, 1) }));
                close();
              }}
            />
            {editing !== 'new' && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <Button
                  variant="ghost"
                  className="!text-red-700"
                  onClick={() => {
                    if (confirm(t('employees.archiveConfirm'))) {
                      archiveEmployee(editing.id, actor);
                      close();
                    }
                  }}
                >
                  {t('employees.archive')}
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
