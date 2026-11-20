import type { Employee, ScoreWeights, Tier } from './types';

// SRS FR-CSE-02 default weights. MoL Admins can change these (FR-CSE-07).
export const DEFAULT_WEIGHTS: ScoreWeights = { ssc: 40, contract: 25, insurance: 15, payment: 20 };
export const MIN_WAGE_JOD = 260;
export const BANK_TOLERANCE_JOD = 5;

export interface ScoreBreakdown {
  total: number;
  tier: Tier;
  ssc: number;
  contract: number;
  insurance: number;
  payment: number;
  counts: {
    employees: number;
    sscVerified: number;
    contractsActive: number;
    insured: number;
    paidAtMinimum: number;
  };
}

export function isContractActive(e: Employee, today: string): boolean {
  if (!e.docs.contract) return false;
  if (e.endDate && e.endDate < today) return false;
  return true;
}

export function isInsuranceValid(e: Employee, today: string): boolean {
  return e.insured && !!e.insuranceExpiry && e.insuranceExpiry >= today;
}

/** Paid at or above minimum wage, using the bank-confirmed amount when we have one. */
export function isPaidAtMinimum(e: Employee): boolean {
  const paid = e.bankConfirmedSalary ?? e.salary;
  if (e.bankConfirmedSalary !== undefined && e.bankConfirmedSalary < e.salary - BANK_TOLERANCE_JOD) return false;
  return paid >= MIN_WAGE_JOD;
}

export function tierFor(score: number, employees: number): Tier {
  if (employees === 0) return 'UNRATED';
  if (score >= 98) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  return 'RED';
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Trust Score, FR-CSE-01..03. Archived records are excluded. */
export function computeScore(all: Employee[], weights: ScoreWeights, today: string): ScoreBreakdown {
  const list = all.filter((e) => e.status !== 'archived');
  const n = list.length;
  const sscVerified = list.filter((e) => e.sscStatus === 'verified').length;
  const contractsActive = list.filter((e) => isContractActive(e, today)).length;
  const insured = list.filter((e) => isInsuranceValid(e, today)).length;
  const paidAtMinimum = list.filter(isPaidAtMinimum).length;

  if (n === 0) {
    return {
      total: 0, tier: 'UNRATED', ssc: 0, contract: 0, insurance: 0, payment: 0,
      counts: { employees: 0, sscVerified: 0, contractsActive: 0, insured: 0, paidAtMinimum: 0 },
    };
  }

  const ssc = (sscVerified / n) * weights.ssc;
  const contract = (contractsActive / n) * weights.contract;
  // Binary check per FR-CSE-02: full points only if every employee is covered.
  const insurance = insured === n ? weights.insurance : 0;
  const payment = (paidAtMinimum / n) * weights.payment;
  const total = round1(ssc + contract + insurance + payment);

  return {
    total,
    tier: tierFor(total, n),
    ssc: round1(ssc),
    contract: round1(contract),
    insurance: round1(insurance),
    payment: round1(payment),
    counts: { employees: n, sscVerified, contractsActive, insured, paidAtMinimum },
  };
}

/**
 * Mock of the SSC API (FR-SSC-01/02). Deterministic from the ID number so a demo
 * always behaves the same: IDs ending in 7 are "not found" at SSC.
 */
export function mockSscVerify(idNumber: string, declaredEnrolled: boolean): Employee['sscStatus'] {
  const foundAtSsc = !idNumber.trim().endsWith('7');
  if (declaredEnrolled && foundAtSsc) return 'verified';
  if (declaredEnrolled && !foundAtSsc) return 'mismatch';
  return 'not_enrolled';
}
