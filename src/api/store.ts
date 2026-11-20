import { useSyncExternalStore } from 'react';
import { buildSeed, type Db } from './seed';
import { addBusinessDays, addDays } from '../domain/businessDays';
import { computeScore, mockSscVerify } from '../domain/scoring';
import type {
  AuditEntry, Dispute, Employee, Employer, Inspection, Inspector, ScoreWeights,
} from '../domain/types';

/*
 * Mock backend. Every exported function below stands in for one REST endpoint of
 * the future Express API (named in the comment beside it). State lives in memory
 * and is mirrored to localStorage so a demo survives a page reload.
 */

const KEY = 'workauth-demo-db-v1';
const SESSION_KEY = 'workauth-demo-session-v1';

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* storage unavailable: fall through to a fresh seed */
  }
  return buildSeed();
}

let db: Db = load();
const listeners = new Set<() => void>();

function commit() {
  db = { ...db };
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDb(): Db {
  return useSyncExternalStore(subscribe, () => db);
}

export function getDb(): Db {
  return db;
}

function nextId(prefix: string) {
  db.seq += 1;
  return `${prefix}-${db.seq}`;
}

function log(actor: string, role: AuditEntry['role'], action: string, target: string) {
  db.audit = [{ id: nextId('a'), at: new Date(db.today + 'T' + new Date().toISOString().slice(11)).toISOString(), actor, role, action, target }, ...db.audit];
}

export function currentWeights(d: Db = db): ScoreWeights {
  return d.weights[d.weights.length - 1].weights;
}

/** GET /v1/employers/:id/score */
export function scoreFor(employerId: string, d: Db = db) {
  return computeScore(d.employees.filter((e) => e.employerId === employerId), currentWeights(d), d.today);
}

/** Records the current score as this month's point in the history (FR-CSE-06). */
function snapshotScore(employerId: string) {
  const month = db.today.slice(0, 7);
  const s = scoreFor(employerId);
  const hist = (db.scoreHistory[employerId] ?? []).filter((p) => p.month !== month);
  db.scoreHistory = { ...db.scoreHistory, [employerId]: [...hist, { month, score: s.total }] };
}

// ---------- Session (demo login) ----------

export type Session =
  | { role: 'employer'; employerId: string }
  | { role: 'employee'; employeeId: string }
  | { role: 'mol'; inspectorId: string }
  | null;

let session: Session = (() => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as Session;
  } catch {
    return null;
  }
})();
const sessionListeners = new Set<() => void>();

export function useSession(): Session {
  return useSyncExternalStore(
    (l) => {
      sessionListeners.add(l);
      return () => sessionListeners.delete(l);
    },
    () => session,
  );
}

export function setSession(s: Session) {
  session = s;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  sessionListeners.forEach((l) => l());
}

// ---------- Demo controls ----------

export function resetDemo() {
  db = buildSeed();
  commit();
  setSession(null);
}

/** Moves the demo clock forward and runs the jobs a real server would run on a schedule. */
export function advanceClock(days: number) {
  db.today = addDays(db.today, days);
  runScheduledJobs();
  commit();
}

/** FR-EEP-04: disputes with no employer response by the deadline escalate to MoL. */
function runScheduledJobs() {
  db.disputes = db.disputes.map((d) => {
    if ((d.status === 'submitted' || d.status === 'employer_review') && d.deadline < db.today) {
      log('System', 'system', 'dispute.escalate', d.trackingNo);
      return { ...d, status: 'escalated', escalatedAt: db.today };
    }
    return d;
  });
}

/** Returns a record to 'active' once it has no open disputes. */
function releaseEmployeeIfClear(employeeId: string) {
  const open = db.disputes.some((d) => d.employeeId === employeeId && d.status !== 'resolved');
  if (!open) db.employees = db.employees.map((e) => (e.id === employeeId && e.status === 'disputed' ? { ...e, status: 'active' } : e));
}

// ---------- Employer ----------

export type CrnLookup =
  | { ok: true; verified: true; companyName: string; companyNameAr: string; address: string }
  | { ok: true; verified: false }
  | { ok: false; reason: 'duplicate' };

/** GET /v1/registry/crn/:crn — mocked Companies Controller lookup (FR-EMP-02). */
export function lookupCrn(crn: string): CrnLookup {
  if (db.employers.some((e) => e.crn === crn.trim())) return { ok: false, reason: 'duplicate' };
  // Even CRNs "exist" at the Companies Controller; odd ones go to manual MoL verification.
  const n = Number(crn.replace(/\D/g, '').slice(-1));
  if (!Number.isNaN(n) && n % 2 === 0) {
    return { ok: true, verified: true, companyName: `Company ${crn} LLC`, companyNameAr: `شركة ${crn} ذ.م.م`, address: 'Amman, Jordan' };
  }
  return { ok: true, verified: false };
}

/** POST /v1/employers */
export function registerEmployer(input: Omit<Employer, 'id' | 'createdAt'>): Employer {
  const emp: Employer = { ...input, id: nextId('emp'), createdAt: db.today };
  db.employers = [...db.employers, emp];
  db.scoreHistory = { ...db.scoreHistory, [emp.id]: [] };
  log(input.representative, 'employer', 'employer.register', input.companyName);
  commit();
  return emp;
}

export type EmployeeInput = Omit<Employee, 'id' | 'employerId' | 'sscStatus' | 'status' | 'createdAt' | 'updatedAt' | 'bankConfirmedSalary'>;

export type SaveResult = { ok: true; employee: Employee } | { ok: false; error: 'duplicate_id' | 'provisional_limit' };

/** POST /v1/employers/:id/employees — runs SSC verification and recalculates the score. */
export function addEmployee(employerId: string, input: EmployeeInput, actor: string): SaveResult {
  const employer = db.employers.find((e) => e.id === employerId)!;
  const mine = db.employees.filter((e) => e.employerId === employerId && e.status !== 'archived');
  if (mine.some((e) => e.idNumber === input.idNumber.trim())) return { ok: false, error: 'duplicate_id' };
  if (employer.crnStatus === 'provisional' && mine.length >= 10) return { ok: false, error: 'provisional_limit' };
  const employee: Employee = {
    ...input,
    idNumber: input.idNumber.trim(),
    id: nextId('ee'),
    employerId,
    sscStatus: mockSscVerify(input.idNumber, input.sscEnrolledDeclared),
    bankConfirmedSalary: input.salary,
    status: 'active',
    createdAt: db.today,
    updatedAt: db.today,
  };
  db.employees = [...db.employees, employee];
  log(actor, 'employer', 'employee.create', employee.nameEn);
  snapshotScore(employerId);
  commit();
  return { ok: true, employee };
}

/** PATCH /v1/employees/:id */
export function updateEmployee(id: string, patch: Partial<EmployeeInput>, actor: string) {
  db.employees = db.employees.map((e) => {
    if (e.id !== id) return e;
    const next = { ...e, ...patch, updatedAt: db.today };
    next.sscStatus = mockSscVerify(next.idNumber, next.sscEnrolledDeclared);
    if (patch.salary !== undefined) next.bankConfirmedSalary = patch.salary;
    return next;
  });
  const e = db.employees.find((x) => x.id === id)!;
  log(actor, 'employer', 'employee.update', e.nameEn);
  snapshotScore(e.employerId);
  commit();
}

/** POST /v1/employees/:id/archive — record stays visible to MoL for 5 years. */
export function archiveEmployee(id: string, actor: string) {
  db.employees = db.employees.map((e) => (e.id === id ? { ...e, status: 'archived', updatedAt: db.today } : e));
  const e = db.employees.find((x) => x.id === id)!;
  log(actor, 'employer', 'employee.archive', e.nameEn);
  snapshotScore(e.employerId);
  commit();
}

/** POST /v1/employers/:id/employees/bulk — returns a row-level report. */
export function bulkImport(employerId: string, rows: EmployeeInput[], actor: string) {
  let imported = 0;
  let pending = 0;
  const errors: { row: number; error: string }[] = [];
  rows.forEach((row, i) => {
    const res = addEmployee(employerId, row, actor);
    if (res.ok) {
      imported++;
      if (res.employee.sscStatus !== 'verified') pending++;
    } else errors.push({ row: i + 2, error: res.error });
  });
  return { imported, pending, errors };
}

/** POST /v1/disputes/:id/response */
export function respondToDispute(id: string, decision: 'accepted' | 'rejected', response: string, actor: string) {
  db.disputes = db.disputes.map((d) =>
    d.id === id
      ? decision === 'accepted'
        ? { ...d, status: 'resolved', employerDecision: decision, employerResponse: response, resolvedBy: 'employer', resolvedAt: db.today }
        : { ...d, status: 'escalated', employerDecision: decision, employerResponse: response, escalatedAt: db.today }
      : d,
  );
  const d = db.disputes.find((x) => x.id === id)!;
  releaseEmployeeIfClear(d.employeeId);
  log(actor, 'employer', decision === 'accepted' ? 'dispute.accept' : 'dispute.reject', d.trackingNo);
  commit();
}

// ---------- Employee ----------

/** POST /v1/auth/employee — NIN/WPN lookup (FR-AUTH-03). */
export function findEmployeeById(idNumber: string): Employee | undefined {
  return db.employees.find((e) => e.idNumber === idNumber.trim() && e.status !== 'archived');
}

/** POST /v1/disputes (FR-EEP-02/03) */
export function fileDispute(input: Pick<Dispute, 'employeeId' | 'field' | 'recordedValue' | 'claimedValue' | 'explanation' | 'anonymous'>): Dispute {
  const emp = db.employees.find((e) => e.id === input.employeeId)!;
  const n = db.disputes.length + 413;
  const dispute: Dispute = {
    ...input,
    id: nextId('dsp'),
    trackingNo: `WA-D-${db.today.slice(0, 4)}-${String(n).padStart(4, '0')}`,
    employerId: emp.employerId,
    status: 'employer_review',
    createdAt: db.today,
    deadline: addBusinessDays(db.today, 5),
  };
  db.disputes = [dispute, ...db.disputes];
  db.employees = db.employees.map((e) => (e.id === emp.id ? { ...e, status: 'disputed' } : e));
  log(input.anonymous ? 'Anonymous employee' : `Employee ••${emp.idNumber.slice(-4)}`, 'employee', 'dispute.create', dispute.trackingNo);
  commit();
  return dispute;
}

// ---------- Ministry of Labour ----------

/** POST /v1/disputes/:id/resolve — inspector decision on an escalated dispute. */
export function resolveDispute(id: string, notes: string, actor: string) {
  db.disputes = db.disputes.map((d) => (d.id === id ? { ...d, status: 'resolved', resolutionNotes: notes, resolvedBy: 'inspector', resolvedAt: db.today } : d));
  const d = db.disputes.find((x) => x.id === id)!;
  releaseEmployeeIfClear(d.employeeId);
  log(actor, 'mol', 'dispute.resolve', d.trackingNo);
  commit();
}

/** POST /v1/inspections — append-only, there is deliberately no update or delete (FR-MOL-03). */
export function createInspection(input: Omit<Inspection, 'id' | 'createdAt'>) {
  const ins: Inspection = { ...input, id: nextId('ins'), createdAt: new Date().toISOString() };
  db.inspections = [ins, ...db.inspections];
  const employer = db.employers.find((e) => e.id === input.employerId);
  log(input.inspectorName, 'mol', 'inspection.create', employer?.companyName ?? input.employerId);
  commit();
  return ins;
}

/** POST /v1/employers/:id/verify-crn — manual MoL verification of a provisional employer. */
export function verifyCrn(employerId: string, actor: string) {
  db.employers = db.employers.map((e) => (e.id === employerId ? { ...e, crnStatus: 'verified' } : e));
  const e = db.employers.find((x) => x.id === employerId)!;
  log(actor, 'mol', 'employer.verify_crn', e.companyName);
  commit();
}

/** POST /v1/admin/inspectors */
export function createInspector(input: Omit<Inspector, 'id' | 'active'>, actor: string) {
  db.inspectors = [...db.inspectors, { ...input, id: nextId('insp'), active: true }];
  log(actor, 'mol', 'inspector.create', input.name);
  commit();
}

/** PATCH /v1/admin/inspectors/:id */
export function setInspectorActive(id: string, active: boolean, actor: string) {
  db.inspectors = db.inspectors.map((i) => (i.id === id ? { ...i, active } : i));
  const i = db.inspectors.find((x) => x.id === id)!;
  log(actor, 'mol', active ? 'inspector.activate' : 'inspector.deactivate', i.name);
  commit();
}

/** PUT /v1/admin/scoring-weights — versioned (FR-CSE-07, NFR-SCA-02). */
export function saveWeights(weights: ScoreWeights, note: string, actor: string) {
  const version = db.weights[db.weights.length - 1].version + 1;
  db.weights = [...db.weights, { version, weights, changedBy: actor, changedAt: db.today, note }];
  log(actor, 'mol', 'scoring.weights_update', `v${version}`);
  commit();
}
