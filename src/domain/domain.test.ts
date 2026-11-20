import { describe, expect, it } from 'vitest';
import { computeScore, DEFAULT_WEIGHTS, mockSscVerify, tierFor } from './scoring';
import { addBusinessDays, businessDaysBetween } from './businessDays';
import type { Employee } from './types';

const TODAY = '2026-11-20';

function emp(over: Partial<Employee> = {}): Employee {
  return {
    id: 'e', employerId: 'x', nameEn: 'A', nameAr: 'أ', idType: 'NIN', idNumber: '9001000001',
    dob: '1990-01-01', nationality: 'Jordanian', gender: 'M', jobTitle: 'Clerk', department: 'Ops',
    contractType: 'permanent', startDate: '2024-01-01', salary: 400, sscEnrolledDeclared: true,
    sscStatus: 'verified', insured: true, insuranceProvider: 'X', insuranceExpiry: '2027-06-01',
    docs: { contract: 'c.pdf', ssc: 's.pdf', insurance: 'i.pdf' }, status: 'active',
    createdAt: TODAY, updatedAt: TODAY, ...over,
  };
}

describe('computeScore', () => {
  it('gives 100 and A+ to a fully compliant employer', () => {
    const s = computeScore([emp(), emp({ id: 'b' })], DEFAULT_WEIGHTS, TODAY);
    expect(s.total).toBe(100);
    expect(s.tier).toBe('A+');
  });

  it('is unrated with no employees', () => {
    expect(computeScore([], DEFAULT_WEIGHTS, TODAY).tier).toBe('UNRATED');
  });

  it('applies each weighted component', () => {
    const list = [
      emp(),
      emp({ id: 'b', sscStatus: 'mismatch' }), // loses SSC share
      emp({ id: 'c', endDate: '2026-01-01' }), // expired contract
      emp({ id: 'd', salary: 200 }), // below minimum wage
    ];
    const s = computeScore(list, DEFAULT_WEIGHTS, TODAY);
    expect(s.ssc).toBe(30); // 3/4 × 40
    expect(s.contract).toBe(18.8); // 3/4 × 25
    expect(s.insurance).toBe(15);
    expect(s.payment).toBe(15); // 3/4 × 20
    expect(s.total).toBe(78.8);
    expect(s.tier).toBe('B');
  });

  it('treats insurance as binary', () => {
    const s = computeScore([emp(), emp({ id: 'b', insured: false })], DEFAULT_WEIGHTS, TODAY);
    expect(s.insurance).toBe(0);
  });

  it('flags underpayment from bank confirmation', () => {
    const s = computeScore([emp({ salary: 400, bankConfirmedSalary: 300 })], DEFAULT_WEIGHTS, TODAY);
    expect(s.payment).toBe(0);
  });

  it('ignores archived records', () => {
    const s = computeScore([emp(), emp({ id: 'b', status: 'archived', sscStatus: 'mismatch' })], DEFAULT_WEIGHTS, TODAY);
    expect(s.total).toBe(100);
  });
});

describe('tierFor', () => {
  it('maps the SRS bands', () => {
    expect(tierFor(98, 1)).toBe('A+');
    expect(tierFor(97.9, 1)).toBe('A');
    expect(tierFor(85, 1)).toBe('A');
    expect(tierFor(70, 1)).toBe('B');
    expect(tierFor(69.9, 1)).toBe('RED');
  });
});

describe('mockSscVerify', () => {
  it('flags a mismatch when declared but not found', () => {
    expect(mockSscVerify('9001000007', true)).toBe('mismatch');
    expect(mockSscVerify('9001000001', true)).toBe('verified');
    expect(mockSscVerify('9001000001', false)).toBe('not_enrolled');
  });
});

describe('business days (Sun–Thu week)', () => {
  it('skips Friday and Saturday', () => {
    // 2026-11-19 is a Thursday → +1 business day is Sunday 22nd.
    expect(addBusinessDays('2026-11-19', 1)).toBe('2026-11-22');
    expect(addBusinessDays('2026-11-19', 5)).toBe('2026-11-26');
  });
  it('counts between dates', () => {
    expect(businessDaysBetween('2026-11-19', '2026-11-26')).toBe(5);
    expect(businessDaysBetween('2026-11-26', '2026-11-19')).toBe(-5);
  });
});
