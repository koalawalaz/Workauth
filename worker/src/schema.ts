import { z } from 'zod';

// Must match `Analysis` in ../../src/domain/contracts.ts — the site renders this shape.

const L = z.object({
  en: z.string().describe('English, plain language'),
  ar: z.string().describe('Arabic (simple Modern Standard Arabic), same meaning as en'),
});

export const AnalysisSchema = z.object({
  isContract: z.boolean().describe('false if the document is not an employment contract'),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  riskScore: z.number().int().describe('0 to 100; higher means riskier for the worker'),
  summary: L.describe('Two sentences: what this contract is'),
  verdict: L.describe('One sentence: is it fair, risky or dangerous for the worker'),
  violations: z.array(
    z.object({
      severity: z.enum(['critical', 'high', 'medium']),
      clause: z.string().describe('Clause number as written in the contract, or "—" for something missing'),
      title: L,
      problem: L.describe('What the contract says versus what the law requires'),
      law: L.describe('The law and article, only if certain; otherwise name the law without an article'),
      right: L.describe('What the worker is entitled to instead'),
    }),
  ),
  positives: z.array(z.object({ title: L, detail: L })),
  questions: z.array(L).describe('Questions the worker should ask the employer'),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
