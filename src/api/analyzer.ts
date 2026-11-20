import type { Analysis, SampleContract } from '../domain/contracts';

/**
 * POST /v1/contracts/analyze — AI Contract Analyzer (SRS §14).
 *
 * With no VITE_ANALYZER_URL (the default build), samples return their pre-written
 * analysis after a short delay, so the prototype works on GitHub Pages with no key.
 *
 * With VITE_ANALYZER_URL set to the Cloudflare Worker in /worker, every check is a
 * live analysis, and workers can upload their own contract. The Anthropic API key
 * lives only in the Worker; it must never be put in this front-end code.
 */

const URL_ = (import.meta.env.VITE_ANALYZER_URL as string | undefined)?.trim() || undefined;
export const LIVE_ANALYZER = !!URL_;

export type AnalyzerError = 'rate_limited' | 'too_large' | 'refused' | 'bad_request' | 'unsupported' | 'failed';
export type AnalyzerResult = { ok: true; analysis: Analysis; live: boolean } | { ok: false; error: AnalyzerError };

export const UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function call(body: unknown): Promise<AnalyzerResult> {
  let res: Response;
  try {
    res = await fetch(URL_!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, error: 'failed' };
  }
  if (res.ok) return { ok: true, analysis: ((await res.json()) as { analysis: Analysis }).analysis, live: true };
  const code = ((await res.json().catch(() => ({}))) as { error?: string }).error;
  if (code === 'rate_limited' || code === 'too_large' || code === 'refused' || code === 'bad_request') return { ok: false, error: code };
  return { ok: false, error: 'failed' };
}

export async function analyzeContract(contract: SampleContract): Promise<AnalyzerResult> {
  if (URL_) return call({ text: contract.text });
  await new Promise((r) => setTimeout(r, 2400));
  return { ok: true, analysis: contract.analysis, live: false };
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Checks a contract the worker uploads (PDF or photo). Only available with a live analyzer. */
export async function analyzeUpload(file: File): Promise<AnalyzerResult> {
  if (!URL_) return { ok: false, error: 'unsupported' };
  if (!UPLOAD_TYPES.includes(file.type)) return { ok: false, error: 'bad_request' };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' };
  return call({ file: { data: await toBase64(file), mediaType: file.type } });
}
