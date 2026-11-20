// Entity shapes follow SRS §7.1. They are written to match the future REST API,
// so the mock client in src/api can be swapped for real fetch calls.

export const GOVERNORATES = [
  'Amman', 'Irbid', 'Zarqa', 'Balqa', 'Mafraq', 'Karak',
  'Jerash', 'Madaba', 'Ajloun', 'Aqaba', 'Maan', 'Tafilah',
] as const;
export type Governorate = (typeof GOVERNORATES)[number];

export const SECTORS = [
  'construction', 'manufacturing', 'hospitality', 'retail',
  'agriculture', 'healthcare', 'technology', 'garments',
] as const;
export type Sector = (typeof SECTORS)[number];

export type Tier = 'A+' | 'A' | 'B' | 'RED' | 'UNRATED';
export type CrnStatus = 'verified' | 'provisional';
export type ContractType = 'permanent' | 'temporary' | 'part-time' | 'seasonal';
export type SscStatus = 'verified' | 'mismatch' | 'not_enrolled' | 'pending';
export type RecordStatus = 'active' | 'disputed' | 'archived';

export interface Employer {
  id: string;
  companyName: string;
  companyNameAr: string;
  crn: string;
  crnStatus: CrnStatus;
  sector: Sector;
  governorate: Governorate;
  address: string;
  representative: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employerId: string;
  nameEn: string;
  nameAr: string;
  idType: 'NIN' | 'WPN';
  idNumber: string;
  dob: string;
  nationality: string;
  gender: 'M' | 'F';
  jobTitle: string;
  department: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  salary: number; // gross monthly, JOD
  sscEnrolledDeclared: boolean;
  sscRef?: string;
  sscStatus: SscStatus; // result of the (mocked) SSC verification
  bankConfirmedSalary?: number; // from the (mocked) bank payroll check
  insured: boolean;
  insuranceProvider?: string;
  insuranceExpiry?: string;
  docs: { contract?: string; ssc?: string; insurance?: string };
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export type DisputeStatus = 'submitted' | 'employer_review' | 'escalated' | 'resolved';

export interface Dispute {
  id: string;
  trackingNo: string;
  employeeId: string;
  employerId: string;
  field: string;
  recordedValue: string;
  claimedValue: string;
  explanation: string;
  anonymous: boolean;
  status: DisputeStatus;
  employerResponse?: string;
  employerDecision?: 'accepted' | 'rejected';
  resolutionNotes?: string;
  resolvedBy?: 'employer' | 'inspector';
  createdAt: string;
  deadline: string;
  escalatedAt?: string;
  resolvedAt?: string;
}

export type InspectionType = 'routine' | 'triggered' | 'follow_up';
export type InspectionOutcome = 'compliant' | 'warning_issued' | 'penalty_referred' | 'case_opened';

export interface Inspection {
  id: string;
  employerId: string;
  inspectorId: string;
  inspectorName: string;
  date: string;
  type: InspectionType;
  findings: string;
  outcome: InspectionOutcome;
  createdAt: string; // immutable, append-only
}

export interface Inspector {
  id: string;
  name: string;
  employeeNo: string;
  governorates: Governorate[];
  active: boolean;
  role: 'inspector' | 'admin';
}

export interface ScoreWeights {
  ssc: number;
  contract: number;
  insurance: number;
  payment: number;
}

export interface WeightsVersion {
  version: number;
  weights: ScoreWeights;
  changedBy: string;
  changedAt: string;
  note: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: 'employer' | 'employee' | 'mol' | 'system';
  action: string;
  target: string;
}

export interface ScorePoint {
  month: string; // YYYY-MM
  score: number;
}
