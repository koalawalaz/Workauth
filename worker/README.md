# Work Auth contract analyzer (Cloudflare Worker)

Runs the AI contract analysis for the prototype. It holds the Anthropic API key so the key never
reaches the browser. The site stays on GitHub Pages and calls this Worker.

```
site (GitHub Pages)  ──POST { text } or { file }──▶  Worker  ──▶  Anthropic API (Claude Opus 5.5)
                     ◀──────── { analysis } ────────          (key stored as a Worker secret)
```

## Deploy from your browser (about 15 minutes, once)

No terminal needed: GitHub Actions deploys the Worker for you.

**1. Cloudflare account and Account ID**
- Sign up free at <https://dash.cloudflare.com/sign-up>.
- In the left menu open **Workers & Pages** (called **Compute** in some accounts). If it asks you to pick a
  `workers.dev` subdomain, accept one. The Worker's address will be under it.
- Copy your **Account ID**. It is shown on the right side of the Workers & Pages overview, or on the
  account home page under **Account details**.

**2. Cloudflare API token**
- Click the person icon (top right) → **My Profile** → **API Tokens** → **Create Token**.
- Next to **Edit Cloudflare Workers**, click **Use template** → **Continue to summary** → **Create Token**.
- Copy the token. Cloudflare shows it only once.

**3. Anthropic API key**
- At <https://console.anthropic.com> → **API Keys** → **Create Key**. Copy it.
- Also set a monthly spend limit (**Settings → Limits**), so the Worker can never run up a large bill.

**4. Add three secrets to GitHub**
In the Workauth repo: **Settings → Secrets and variables → Actions → Secrets tab → New repository secret**.
Add each one (name exactly as written, value pasted from the steps above):

| Name | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | the Account ID from step 1 |
| `ANTHROPIC_API_KEY` | the key from step 3 |

**5. Deploy**
- **Actions** tab → **Deploy contract analyzer** (left list) → **Run workflow** → **Run workflow**.
- When it finishes (about 1 minute), open the run. The summary shows the Worker address,
  e.g. `https://workauth-analyzer.<your-subdomain>.workers.dev`.

**6. Point the site at it**
- **Settings → Secrets and variables → Actions → Variables tab → New repository variable**:
  name `ANALYZER_URL`, value = the Worker address from step 5.
- **Actions** → **Deploy prototype to GitHub Pages** → open the latest run → **Re-run all jobs**.

The "Check my contract" page now analyses contracts live and shows an **Upload your contract** box
(PDF or photo, up to 5 MB). To go back to demo results, delete the `ANALYZER_URL` variable and re-run
the Pages deploy. Later changes to `worker/` redeploy automatically when pushed to `main`.

### Alternative: deploy from a terminal

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy        # prints the Worker address; then do step 6
```

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
