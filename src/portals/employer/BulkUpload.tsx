import { useState } from 'react';
import { Button, Card, Kpi, Notice, Table, Td } from '../../components/ui';
import { useT } from '../../i18n';
import { bulkImport, type EmployeeInput } from '../../api/store';
import type { ContractType, Employer } from '../../domain/types';

const COLUMNS = [
  'name_en', 'name_ar', 'id_type', 'id_number', 'dob', 'nationality', 'gender', 'job_title', 'department',
  'contract_type', 'start_date', 'end_date', 'salary_jod', 'ssc_enrolled', 'ssc_ref', 'insured', 'insurance_provider', 'insurance_expiry',
];
const REQUIRED = ['name_en', 'name_ar', 'id_number', 'job_title', 'contract_type', 'start_date', 'salary_jod'];

const SAMPLE = [
  COLUMNS.join(','),
  'Ali Hamdan,علي حمدان,NIN,9871100201,1990-05-01,Jordanian,M,Welder,Production,permanent,2025-01-01,,420,yes,SSC-1100201,yes,Jordan Insurance Co.,2027-05-01',
  'Salma Ayoub,سلمى أيوب,NIN,9871100212,1995-08-12,Jordanian,F,Accountant,Finance,permanent,2024-06-01,,650,yes,SSC-1100212,yes,Jordan Insurance Co.,2027-05-01',
  'Kamal Hussein,كمال حسين,WPN,WP1100227,1988-02-20,Egyptian,M,Labourer,Production,temporary,2026-02-01,2027-01-31,265,yes,SSC-1100227,yes,Jordan Insurance Co.,2027-05-01',
  'Nadia Fares,نادية فارس,NIN,,1993-11-02,Jordanian,F,Clerk,Admin,permanent,2025-03-01,,380,yes,SSC-x,yes,Jordan Insurance Co.,2027-05-01',
  'Osama Zoubi,أسامة الزعبي,NIN,9871100245,1991-07-07,Jordanian,M,Driver,Logistics,seasonal,2026-04-01,2026-12-31,240,no,,no,,',
].join('\n');

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(head.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });
}

function download(name: string, content: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
}

interface Report {
  imported: number;
  pending: number;
  errors: { row: number; error: string }[];
}

export default function BulkUpload({ employer }: { employer: Employer }) {
  const { t, num } = useT();
  const [report, setReport] = useState<Report | null>(null);

  const run = (text: string) => {
    const rows = parseCsv(text);
    const valid: EmployeeInput[] = [];
    const errors: Report['errors'] = [];
    const rowNumbers: number[] = [];
    rows.forEach((r, i) => {
      const miss = REQUIRED.filter((k) => !r[k]);
      if (miss.length) {
        errors.push({ row: i + 2, error: `${t('bulk.missing')}: ${miss.join(', ')}` });
        return;
      }
      rowNumbers.push(i + 2);
      valid.push({
        nameEn: r.name_en, nameAr: r.name_ar, idType: r.id_type === 'WPN' ? 'WPN' : 'NIN', idNumber: r.id_number,
        dob: r.dob, nationality: r.nationality || 'Jordanian', gender: r.gender === 'F' ? 'F' : 'M', jobTitle: r.job_title,
        department: r.department, contractType: (r.contract_type || 'permanent') as ContractType, startDate: r.start_date,
        endDate: r.end_date || undefined, salary: Number(r.salary_jod), sscEnrolledDeclared: r.ssc_enrolled === 'yes',
        sscRef: r.ssc_ref, insured: r.insured === 'yes', insuranceProvider: r.insurance_provider || undefined,
        insuranceExpiry: r.insurance_expiry || undefined, docs: { contract: 'bulk-upload.pdf' },
      });
    });
    const res = bulkImport(employer.id, valid, employer.representative);
    // bulkImport numbers rows within the valid subset; map back to the CSV row number.
    const mapped = res.errors.map((e) => ({ row: rowNumbers[e.row - 2], error: t(`employees.${e.error}`) }));
    setReport({ imported: res.imported, pending: res.pending, errors: [...errors, ...mapped].sort((a, b) => a.row - b.row) });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('bulk.title')}</h1>
      <p className="max-w-2xl text-slate-600">{t('bulk.sub')}</p>
      <Card>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => download('workauth-employees-template.csv', COLUMNS.join(',') + '\n')}>⬇ {t('bulk.template')}</Button>
          <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            ⬆ {t('bulk.upload')}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) run(await f.text());
                e.target.value = '';
              }}
            />
          </label>
          <Button variant="ghost" onClick={() => run(SAMPLE)}>{t('bulk.useSample')}</Button>
        </div>
        <p className="mt-3 text-xs text-slate-500" dir="ltr">{COLUMNS.join(', ')}</p>
      </Card>

      {report && (
        <Card title={t('bulk.results')}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label={t('bulk.imported')} value={num(report.imported)} />
            <Kpi label={t('bulk.pending')} value={num(report.pending)} tone={report.pending ? 'amber' : undefined} />
            <Kpi label={t('bulk.failed')} value={num(report.errors.length)} tone={report.errors.length ? 'red' : undefined} />
          </div>
          {report.errors.length > 0 && (
            <div className="mt-4">
              <Table head={[t('bulk.row'), t('bulk.error')]}>
                {report.errors.map((e) => (
                  <tr key={e.row}>
                    <Td className="tabular-nums">{num(e.row)}</Td>
                    <Td className="text-red-700">{e.error}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
          {report.imported > 0 && <div className="mt-4"><Notice tone="green">✓ {t('bulk.imported')}: {num(report.imported)}</Notice></div>}
        </Card>
      )}
    </div>
  );
}
