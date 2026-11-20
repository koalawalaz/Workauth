# Work Auth contract analyzer (Cloudflare Worker)

Runs the AI contract analysis for the prototype. It holds the Anthropic API key so the key never
reaches the browser. The site stays on GitHub Pages and calls this Worker.

```
site (GitHub Pages)  ──POST { text } or { file }──▶  Worker  ──▶  Anthropic API (Claude Opus 5.5)
                     ◀──────── { analysis } ────────          (key stored as a Worker secret)
```

## Deploy (about 10 minutes, once)

You need a free Cloudflare account and an Anthropic API key (console.anthropic.com).

```bash
cd worker
npm install
npx wrangler login                          # opens the browser to sign in to Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY   # paste the key when asked; it is stored encrypted
npx wrangler deploy                         # prints the Worker URL, e.g. https://workauth-analyzer.<you>.workers.dev
```

Then switch the site to live analysis:

1. GitHub → the Workauth repo → **Settings → Secrets and variables → Actions → Variables** →
   **New repository variable**: name `ANALYZER_URL`, value = the Worker URL from `wrangler deploy`.
2. Re-run the latest **Deploy prototype to GitHub Pages** workflow (or push to `main`).

The "Check my contract" page then analyses contracts live and shows an **Upload your contract**
box (PDF or photo, up to 5 MB). To go back to demo results, delete the variable and redeploy.

## Guardrails

| Guard | Where | Default |
| --- | --- | --- |
| Only your site can call it (CORS + Origin check) | `ALLOWED_ORIGINS` in `wrangler.toml` | `https://koalawalaz.github.io` |
| Per-IP rate limit | `[[ratelimits]]` in `wrangler.toml` | 5 analyses per minute |
| Size caps | `src/handler.ts` | 60,000 characters of text, 5 MB files |
| Contract text treated as data, not instructions | `src/prompt.ts` | always |
| Output must match the schema the site renders | `src/schema.ts` (structured outputs) | always |

The Origin check stops other websites, not someone calling the Worker directly with a script, so
also **set a monthly spend limit in the Anthropic Console** (Settings → Limits). Each analysis costs
roughly a few cents to a few tens of cents depending on contract length.

## Model

`claude-opus-5-5` at `high` effort, with server-side fallbacks enabled (`fallbacks: "default"`): if
a safety classifier declines a document, the API retries on a fallback model in the same call. A
document that is still declined returns error `refused`, which the site shows as a friendly message.

## Develop and test

```bash
npm test          # 9 tests against a mock Anthropic API (no key needed)
npm run typecheck
npx wrangler dev --var ALLOWED_ORIGINS:http://localhost:5173   # local Worker on :8787
# site: VITE_ANALYZER_URL=http://127.0.0.1:8787 npm run dev   (from the repo root)
```

Legal references in the model's output are not legal advice. Have a Jordanian labour lawyer review
the prompt and a sample of reports before real users rely on it.
