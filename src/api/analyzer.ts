import type { Analysis, SampleContract } from '../domain/contracts';

/**
 * POST /v1/contracts/:id/analyze — AI Contract Analyzer (SRS §14).
 *
 * Today this returns the pre-written demo analysis after a short delay, so the
 * prototype works on GitHub Pages with no server and no API key.
 *
 * Later, set VITE_ANALYZER_URL at build time to the Cloudflare Worker that holds
 * the Anthropic API key. The Worker receives { text } and must return
 * { analysis } in the same bilingual `Analysis` shape. The API key must never be
 * placed in this front-end code.
 */
export async function analyzeContract(contract: SampleContract): Promise<{ analysis: Analysis; live: boolean }> {
  const url = import.meta.env.VITE_ANALYZER_URL as string | undefined;
  if (url) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: contract.text }),
    });
    if (!res.ok) throw new Error(`Analyzer returned ${res.status}`);
    const body = (await res.json()) as { analysis: Analysis };
    return { analysis: body.analysis, live: true };
  }
  await new Promise((r) => setTimeout(r, 2400));
  return { analysis: contract.analysis, live: false };
}
