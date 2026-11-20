import type {
  AuditEntry, Dispute, Employee, Employer, Inspection, Inspector, ScorePoint, WeightsVersion,
} from '../domain/types';
import { DEFAULT_WEIGHTS } from '../domain/scoring';
import { addBusinessDays } from '../domain/businessDays';

// All companies and people below are fictional demo data.

export const DEMO_START_DATE = '2026-11-20';

export interface Db {
  today: string;
  employers: Employer[];
  employees: Employee[];
  disputes: Dispute[];
  inspections: Inspection[];
  inspectors: Inspector[];
  weights: WeightsVersion[];
  audit: AuditEntry[];
  scoreHistory: Record<string, ScorePoint[]>;
  seq: number;
}

// Small deterministic PRNG so the seed is identical on every reset.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const FIRST_EN = ['Ahmad', 'Omar', 'Lina', 'Rania', 'Khaled', 'Sara', 'Yousef', 'Dana', 'Hamza', 'Noor', 'Tareq', 'Hala', 'Zaid', 'Reem', 'Fadi', 'Maya'];
const FIRST_AR = ['أحمد', 'عمر', 'لينا', 'رانيا', 'خالد', 'سارة', 'يوسف', 'دانا', 'حمزة', 'نور', 'طارق', 'هالة', 'زيد', 'ريم', 'فادي', 'مايا'];
const GENDER: ('M' | 'F')[] = ['M', 'M', 'F', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F'];
const LAST_EN = ['Haddad', 'Khalil', 'Nasser', 'Saleh', 'Mansour', 'Qasem', 'Darwish', 'Odeh'];
const LAST_AR = ['حداد', 'خليل', 'ناصر', 'صالح', 'منصور', 'قاسم', 'درويش', 'عودة'];
const MIGRANT_EN = ['Rahim Uddin', 'Priya Kumari', 'Mohamed Fathy', 'Sunil Perera', 'Aye Thida', 'Mahmoud Saeed'];
const MIGRANT_AR = ['رحيم الدين', 'بريا كوماري', 'محمد فتحي', 'سونيل بيريرا', 'آي ثيدا', 'محمود سعيد'];
const MIGRANT_NAT = ['Bangladeshi', 'Sri Lankan', 'Egyptian', 'Sri Lankan', 'Burmese', 'Egyptian'];
const JOBS = ['Site Engineer', 'Accountant', 'Machine Operator', 'Sales Associate', 'Technician', 'HR Officer', 'Driver', 'Supervisor', 'Cashier', 'Nurse'];

interface EmployerSpec {
  e: Omit<Employer, 'id' | 'createdAt' | 'contactEmail' | 'contactPhone' | 'address' | 'crnStatus'> & { crnStatus?: Employer['crnStatus'] };
  size: number;
  // probability that each compliance dimension fails, shaping the score
  fail: { ssc: number; contract: number; insurance: number; pay: number };
  history: number[]; // 12 monthly scores ending last month
}

const SPECS: EmployerSpec[] = [
  {
    e: { companyName: 'Petra Steel Works', companyNameAr: 'مصانع البتراء للحديد', crn: '200145', sector: 'manufacturing', governorate: 'Zarqa', representative: 'Samir Haddad' },
    size: 14, fail: { ssc: 0.2, contract: 0.15, insurance: 0, pay: 0.08 },
    history: [62, 64, 66, 70, 71, 73, 74, 76, 78, 79, 80, 81],
  },
  {
    e: { companyName: 'Dead Sea Hospitality Group', companyNameAr: 'مجموعة البحر الميت للضيافة', crn: '200311', sector: 'hospitality', governorate: 'Balqa', representative: 'Rula Mansour' },
    size: 12, fail: { ssc: 0, contract: 0, insurance: 0, pay: 0 },
    history: [91, 92, 94, 95, 96, 97, 98, 98, 99, 99, 100, 100],
  },
  {
    e: { companyName: 'Wadi Rum Logistics', companyNameAr: 'وادي رم للخدمات اللوجستية', crn: '200478', sector: 'retail', governorate: 'Aqaba', representative: 'Fares Odeh' },
    size: 10, fail: { ssc: 0.05, contract: 0.08, insurance: 0, pay: 0 },
    history: [80, 82, 84, 85, 86, 88, 88, 89, 90, 90, 91, 92],
  },
  {
    e: { companyName: 'Irbid Garment Factory', companyNameAr: 'مصنع إربد للألبسة', crn: '200592', sector: 'garments', governorate: 'Irbid', representative: 'Nabil Qasem' },
    size: 16, fail: { ssc: 0.45, contract: 0.35, insurance: 1, pay: 0.3 },
    history: [58, 57, 55, 56, 54, 52, 53, 51, 50, 49, 48, 47],
  },
  {
    e: { companyName: 'Amman Digital Labs', companyNameAr: 'مختبرات عمّان الرقمية', crn: '200633', sector: 'technology', governorate: 'Amman', representative: 'Dina Khalil' },
    size: 9, fail: { ssc: 0, contract: 0.1, insurance: 0, pay: 0 },
    history: [88, 88, 89, 90, 92, 93, 94, 95, 95, 96, 96, 97],
  },
  {
    e: { companyName: 'Jordan Valley Farms', companyNameAr: 'مزارع وادي الأردن', crn: '200719', sector: 'agriculture', governorate: 'Balqa', representative: 'Hasan Darwish' },
    size: 11, fail: { ssc: 0.3, contract: 0.25, insurance: 0, pay: 0.15 },
    history: [70, 71, 70, 69, 70, 72, 71, 72, 70, 71, 72, 72],
  },
  {
    e: { companyName: 'Al-Karak Medical Center', companyNameAr: 'مركز الكرك الطبي', crn: '200856', sector: 'healthcare', governorate: 'Karak', representative: 'Dr. Muna Saleh' },
    size: 10, fail: { ssc: 0.1, contract: 0, insurance: 0, pay: 0 },
    history: [84, 85, 85, 86, 87, 88, 89, 90, 90, 91, 92, 93],
  },
  {
    e: { companyName: 'Madaba Builders Co.', companyNameAr: 'شركة مأدبا للإنشاءات', crn: '200902', sector: 'construction', governorate: 'Madaba', representative: 'Walid Nasser', crnStatus: 'provisional' },
    size: 8, fail: { ssc: 0.5, contract: 0.4, insurance: 1, pay: 0.25 },
    history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 44, 46],
  },
];

function monthsBack(today: string, count: number): string[] {
  const [y, m] = today.split('-').map(Number);
  const out: string[] = [];
  for (let i = count; i >= 1; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export function buildSeed(): Db {
  const today = DEMO_START_DATE;
  const r = rng(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const employers: Employer[] = [];
  const employees: Employee[] = [];
  const scoreHistory: Record<string, ScorePoint[]> = {};
  const months = monthsBack(today, 12);
  let idCounter = 1000001;

  SPECS.forEach((spec, i) => {
    const id = `emp-${i + 1}`;
    employers.push({
      ...spec.e,
      crnStatus: spec.e.crnStatus ?? 'verified',
      id,
      address: `${spec.e.governorate}, Jordan`,
      contactEmail: `hr@${spec.e.companyName.toLowerCase().replace(/[^a-z]+/g, '')}.jo`,
      contactPhone: `+9627${90000000 + i * 1111111}`,
      createdAt: '2025-01-15',
    });
    scoreHistory[id] = months.map((month, k) => ({ month, score: spec.history[k] })).filter((p) => p.score > 0);

    for (let k = 0; k < spec.size; k++) {
      const migrant = r() < 0.3;
      const fi = Math.floor(r() * FIRST_EN.length);
      const li = Math.floor(r() * LAST_EN.length);
      const mi = Math.floor(r() * MIGRANT_EN.length);
      const sscFail = r() < spec.fail.ssc;
      const contractFail = r() < spec.fail.contract;
      const insFail = r() < spec.fail.insurance;
      const payFail = r() < spec.fail.pay;
      // IDs ending in 7 trigger an SSC mismatch in the mock verifier.
      let idNum = String(idCounter++);
      if (sscFail) idNum = idNum.slice(0, -1) + '7';
      else if (idNum.endsWith('7')) idNum = idNum.slice(0, -1) + '8';
      const salary = payFail ? 220 + Math.floor(r() * 30) : 300 + Math.floor(r() * 900);
      const type = pick<Employee['contractType']>(['permanent', 'permanent', 'permanent', 'temporary', 'part-time', 'seasonal']);
      employees.push({
        id: `ee-${id}-${k + 1}`,
        employerId: id,
        nameEn: migrant ? MIGRANT_EN[mi] : `${FIRST_EN[fi]} ${LAST_EN[li]}`,
        nameAr: migrant ? MIGRANT_AR[mi] : `${FIRST_AR[fi]} ${LAST_AR[li]}`,
        idType: migrant ? 'WPN' : 'NIN',
        idNumber: migrant ? `WP${idNum}` : `99${idNum}`,
        dob: `19${70 + Math.floor(r() * 30)}-0${1 + Math.floor(r() * 9)}-1${Math.floor(r() * 9)}`,
        nationality: migrant ? MIGRANT_NAT[mi] : 'Jordanian',
        gender: migrant ? (mi === 1 || mi === 4 ? 'F' : 'M') : GENDER[fi],
        jobTitle: pick(JOBS),
        department: pick(['Operations', 'Finance', 'Sales', 'Production', 'Admin']),
        contractType: type,
        startDate: `202${Math.floor(r() * 5)}-0${1 + Math.floor(r() * 9)}-01`,
        endDate: contractFail ? '2026-09-30' : type === 'permanent' ? undefined : '2027-08-31',
        salary,
        sscEnrolledDeclared: true,
        sscRef: `SSC-${idNum}`,
        sscStatus: sscFail ? 'mismatch' : 'verified',
        bankConfirmedSalary: salary,
        insured: !insFail,
        insuranceProvider: insFail ? undefined : pick(['Jordan Insurance Co.', 'Arab Orient Insurance', 'Middle East Insurance']),
        insuranceExpiry: insFail ? undefined : `2027-0${1 + Math.floor(r() * 9)}-15`,
        docs: { contract: 'contract.pdf', ssc: 'ssc-certificate.pdf', insurance: insFail ? undefined : 'insurance.pdf' },
        status: 'active',
        createdAt: '2025-02-01',
        updatedAt: '2026-10-01',
      });
    }
  });

  // A known demo employee for the Employee portal, at Petra Steel Works.
  employees.push({
    id: 'ee-demo', employerId: 'emp-1', nameEn: 'Mahmoud Saeed', nameAr: 'محمود سعيد', idType: 'NIN',
    idNumber: '9861234501', dob: '1992-04-12', nationality: 'Jordanian', gender: 'M', jobTitle: 'Machine Operator',
    department: 'Production', contractType: 'temporary', startDate: '2024-03-01', endDate: '2027-02-28',
    salary: 320, sscEnrolledDeclared: true, sscRef: 'SSC-61234501', sscStatus: 'verified', bankConfirmedSalary: 320,
    insured: true, insuranceProvider: 'Jordan Insurance Co.', insuranceExpiry: '2027-03-01',
    docs: { contract: 'contract.pdf', ssc: 'ssc-certificate.pdf', insurance: 'insurance.pdf' },
    status: 'active', createdAt: '2024-03-01', updatedAt: '2026-10-01',
  });

  const inspectors: Inspector[] = [
    { id: 'insp-1', name: 'Inspector Layla Haddad', employeeNo: 'MOL-1042', governorates: ['Amman', 'Zarqa', 'Balqa', 'Madaba'], active: true, role: 'inspector' },
    { id: 'insp-2', name: 'Inspector Basel Odeh', employeeNo: 'MOL-1077', governorates: ['Irbid', 'Jerash', 'Ajloun', 'Mafraq'], active: true, role: 'inspector' },
    { id: 'insp-3', name: 'Inspector Huda Mansour', employeeNo: 'MOL-1103', governorates: ['Karak', 'Tafilah', 'Maan', 'Aqaba'], active: true, role: 'inspector' },
    { id: 'admin-1', name: 'Eng. Rami Khalil (MoL Admin)', employeeNo: 'MOL-0001', governorates: [], active: true, role: 'admin' },
  ];

  const inspections: Inspection[] = [
    { id: 'ins-1', employerId: 'emp-4', inspectorId: 'insp-2', inspectorName: 'Inspector Basel Odeh', date: '2026-08-12', type: 'triggered', findings: 'Seven workers without SSC enrolment. No group health insurance policy on file. Overtime records incomplete.', outcome: 'warning_issued', createdAt: '2026-08-12T10:20:00Z' },
    { id: 'ins-2', employerId: 'emp-4', inspectorId: 'insp-2', inspectorName: 'Inspector Basel Odeh', date: '2026-09-15', type: 'follow_up', findings: 'Warning items not corrected within 30 days. Two workers paid below minimum wage.', outcome: 'penalty_referred', createdAt: '2026-09-15T09:05:00Z' },
    { id: 'ins-3', employerId: 'emp-2', inspectorId: 'insp-1', inspectorName: 'Inspector Layla Haddad', date: '2026-06-03', type: 'routine', findings: 'All records verified against SSC and insurer. Contracts on file for all staff.', outcome: 'compliant', createdAt: '2026-06-03T12:00:00Z' },
    { id: 'ins-4', employerId: 'emp-1', inspectorId: 'insp-1', inspectorName: 'Inspector Layla Haddad', date: '2026-07-21', type: 'routine', findings: 'Three SSC mismatches identified. Employer instructed to enrol affected staff.', outcome: 'warning_issued', createdAt: '2026-07-21T11:30:00Z' },
  ];

  const disputes: Dispute[] = [
    {
      id: 'dsp-1', trackingNo: 'WA-D-2026-0412', employeeId: 'ee-emp-1-2', employerId: 'emp-1', field: 'salary',
      recordedValue: '', claimedValue: '', explanation: 'My actual salary transfer is lower than what is recorded.',
      anonymous: false, status: 'employer_review', createdAt: '2026-11-17', deadline: addBusinessDays('2026-11-17', 5),
    },
    {
      id: 'dsp-2', trackingNo: 'WA-D-2026-0398', employeeId: 'ee-emp-4-3', employerId: 'emp-4', field: 'sscStatus',
      recordedValue: 'Enrolled', claimedValue: 'Not enrolled', explanation: 'I checked the SSC app and I am not registered.',
      anonymous: true, status: 'escalated', createdAt: '2026-11-04', deadline: addBusinessDays('2026-11-04', 5), escalatedAt: '2026-11-12',
    },
    {
      id: 'dsp-3', trackingNo: 'WA-D-2026-0377', employeeId: 'ee-emp-6-1', employerId: 'emp-6', field: 'contractType',
      recordedValue: 'Permanent', claimedValue: 'Seasonal', explanation: 'I was told my contract is seasonal and ends after harvest.',
      anonymous: false, status: 'resolved', employerResponse: 'Corrected — record updated.', employerDecision: 'accepted', resolvedBy: 'employer',
      createdAt: '2026-10-20', deadline: addBusinessDays('2026-10-20', 5), resolvedAt: '2026-10-22',
    },
  ];
  // fill recorded/claimed salary for dsp-1 from the seeded employee
  const e2 = employees.find((e) => e.id === 'ee-emp-1-2');
  if (e2) {
    disputes[0].recordedValue = `${e2.salary} JOD`;
    disputes[0].claimedValue = `${Math.max(200, e2.salary - 80)} JOD`;
  }

  const weights: WeightsVersion[] = [
    { version: 1, weights: { ...DEFAULT_WEIGHTS }, changedBy: 'System', changedAt: '2025-01-01', note: 'Initial weights per SRS FR-CSE-02' },
  ];

  const audit: AuditEntry[] = [
    { id: 'a-1', at: '2026-11-17T08:10:00Z', actor: 'Employee ••4502', role: 'employee', action: 'dispute.create', target: 'WA-D-2026-0412' },
    { id: 'a-2', at: '2026-11-12T00:00:00Z', actor: 'System', role: 'system', action: 'dispute.escalate', target: 'WA-D-2026-0398' },
    { id: 'a-3', at: '2026-09-15T09:05:00Z', actor: 'Inspector Basel Odeh', role: 'mol', action: 'inspection.create', target: 'Irbid Garment Factory' },
  ];

  return { today, employers, employees, disputes, inspections, inspectors, weights, audit, scoreHistory, seq: 500 };
}
