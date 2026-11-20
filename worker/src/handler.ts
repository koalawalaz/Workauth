import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { AnalysisSchema, type Analysis } from './schema';
import { SYSTEM_PROMPT } from './prompt';

/*
 * Work Auth contract analyzer — Cloudflare Worker.
 *
 * Holds the Anthropic API key (a Worker secret) so it never reaches the browser.
 * The static site on GitHub Pages POSTs { text } or { file: { data, mediaType } }
 * and gets back { analysis } in the bilingual shape the UI renders.
 *
 * Guardrails: only listed origins, per-IP rate limit, size caps, refusals and
 * malformed output turned into clear error codes.
 */

export interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGINS: string; // comma-separated, e.g. "https://koalawalaz.github.io"
  LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  ANTHROPIC_BASE_URL?: string; // tests only
}

export const MODEL = 'claude-opus-5-5';
const MAX_TEXT_CHARS = 60_000;
const MAX_FILE_BASE64_CHARS = 7_000_000; // ≈ 5 MB file
const MEDIA_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

interface Body {
  text?: unknown;
  file?: { data?: unknown; mediaType?: unknown };
}

type ErrorCode = 'origin' | 'method' | 'rate_limited' | 'bad_request' | 'too_large' | 'refused' | 'incomplete' | 'upstream';

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = allowedOrigins(env);
  return origin && allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function fail(code: ErrorCode, status: number, headers: Record<string, string>): Response {
  return json({ error: code }, status, headers);
}

/** Builds the user turn: the document (PDF or image) or the pasted text, then the instruction. */
export function buildContent(body: Body): Anthropic.Beta.BetaContentBlockParam[] | ErrorCode {
  const instruction = 'Review this employment contract for the worker.';
  if (body.file) {
    const { data, mediaType } = body.file;
    if (typeof data !== 'string' || !MEDIA_TYPES.includes(mediaType as MediaType)) return 'bad_request';
    if (data.length > MAX_FILE_BASE64_CHARS) return 'too_large';
    const clean = data.replace(/\s/g, '');
    const block: Anthropic.Beta.BetaContentBlockParam =
      mediaType === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: clean } }
        : { type: 'image', source: { type: 'base64', media_type: mediaType as Exclude<MediaType, 'application/pdf'>, data: clean } };
    return [block, { type: 'text', text: instruction }];
  }
  if (typeof body.text === 'string' && body.text.trim()) {
    if (body.text.length > MAX_TEXT_CHARS) return 'too_large';
    return [{ type: 'text', text: `${instruction}\n\n<contract>\n${body.text}\n</contract>` }];
  }
  return 'bad_request';
}

export async function analyze(content: Anthropic.Beta.BetaContentBlockParam[], env: Env): Promise<Analysis | ErrorCode> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL, timeout: 120_000, maxRetries: 1 });
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // Server-side fallback: if a safety classifier declines, the API re-runs on a fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(AnalysisSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') return 'refused';
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) return 'incomplete';
  const a = response.parsed_output;
  return { ...a, riskScore: Math.max(0, Math.min(100, Math.round(a.riskScore))) };
}

export async function handle(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, env);

  if (!origin || !allowedOrigins(env).includes(origin)) return fail('origin', 403, cors);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return fail('method', 405, cors);

  if (env.LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.LIMITER.limit({ key: ip });
    if (!success) return fail('rate_limited', 429, cors);
  }

  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > MAX_FILE_BASE64_CHARS + 10_000) return fail('too_large', 413, cors);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail('bad_request', 400, cors);
  }

  const content = buildContent(body);
  if (typeof content === 'string') return fail(content, content === 'too_large' ? 413 : 400, cors);

  try {
    const result = await analyze(content, env);
    if (result === 'refused') return fail('refused', 422, cors);
    if (typeof result === 'string') return fail(result, 502, cors);
    return json({ analysis: result }, 200, cors);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return fail('rate_limited', 429, cors);
    // parse() throws a plain AnthropicError when the output is cut off or fails the schema.
    if (err instanceof Anthropic.AnthropicError && !(err instanceof Anthropic.APIError)) {
      console.error('Analyzer output did not match the schema', err.message);
      return fail('incomplete', 502, cors);
    }
    if (err instanceof Anthropic.APIError) console.error('Anthropic API error', err.status, err.message);
    else console.error('Analyzer error', err instanceof Error ? err.message : err);
    return fail('upstream', 502, cors);
  }
}


