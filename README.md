# Work Auth — clickable prototype

A front-end prototype of **Work Auth**, the labour-compliance platform for Jordan described in the
Software Requirements Specification (v1.1). It is built for demos to the Ministry of Labour and investors:
everything runs in the browser on fictional seed data, with no backend.

```
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the scoring engine and business-day logic
npm run build      # static site in dist/ (works from any path, e.g. GitHub Pages)
```

The demo OTP code everywhere is **123456**. The floating **Demo** button (bottom corner) jumps
between portals, moves the demo clock forward, and resets all data.

## Demo script (≈5 minutes)

1. **Landing → Employer → Register a new company.** An even CRN (e.g. `300124`) is auto-verified, an odd
   one goes provisional (max 10 employees, no badge).
2. **Add an employee** whose ID ends in `7`: the mocked SSC check returns a mismatch, the field turns red,
   and the Trust Score drops into the **Red Zone** with a corrective-action checklist.
3. **Demo → Employee — Mahmoud Saeed.** Every field has a "your right" explainer. Tap **This is wrong**
   on the salary, choose **Keep my identity private**, and submit. A tracking number is issued.
4. **Demo → Employer — Petra Steel Works → Disputes.** The report shows as anonymous, with a 5-business-day
   countdown (Sun–Thu week).
5. **Demo → Advance clock 5 business days.** The unanswered dispute escalates to the Ministry automatically.
6. **Demo → MoL Inspector.** See the national dashboard, resolve the escalated dispute (the reporter's identity
   is visible only here), open the employer file and **Record inspection**. Inspections are append-only.
7. **Demo → MoL Admin → Scoring weights.** Change the weights, preview the national average, and save a new
   version. Every action appears in the **Audit log**.
8. Switch to **العربية** at any time: the whole UI flips to RTL.

## What the prototype covers (SRS references)

| Area | Behaviour |
| --- | --- |
| Auth (FR-AUTH-01..05) | Three portals, CRN + password + OTP for employers, NIN/WPN + OTP for employees, simulated SSO + OTP for MoL, role-guarded routes |
| Employer (FR-EMP, §4.1) | Registration wizard with CRN lookup, provisional status, duplicate rejection; 4-step employee form with file type/size checks; archive; bulk CSV with row-level report; certified badge PNG for A/A+ |
| Trust Score (FR-CSE-01..07) | SSC 40 / Contract 25 / Insurance 15 (binary) / Payment 20; tiers A+ ≥ 98, A ≥ 85, B ≥ 70, Red Zone < 70; recalculated on every change; 12-month history |
| Employee (FR-EEP, §15) | Record view with rights explainers, dispute on any field, anonymous reporting, status tracker ; "Know your rights" guide (6 topics, law references), also public at `#/rights` |
| AI Contract Analyzer (§14) | "Check my contract" tab: 4 sample contracts with pre-written bilingual reports (risk score, violations with law articles, your rights, questions to ask). `src/api/analyzer.ts` switches to live analysis, plus contract upload (PDF/photo), when the Worker in `worker/` is deployed — see `worker/README.md` |
| Disputes (FR-EEP-03/04) | 5-business-day deadline, accept / reject, auto-escalation to MoL |
| MoL (FR-MOL, FR-CSE-07) | Analytics, employer list with governorate/sector/size/tier filters, CSV export and print-to-PDF, append-only inspections, escalated-dispute queue, inspector admin, versioned scoring weights, audit log |
| Red Zone (§12) | Banner, corrective-action checklist and phase timeline (visual only) |
| Public (FR-CSE-05) | Searchable employer directory |
| Usability (NFR-USE-01/02) | Full Arabic/English with RTL; a simplified, large-type employee portal; phone-width layouts |

**Not in the prototype:** a real backend, real authentication, and every external integration (SSC,
Companies Controller, Sanad, banks, insurers, MOPIC, SMS). Also out of scope: attendance and overtime,
leave, gratuity, the Labour Law AI agent, live AI contract analysis, monetization, and the developer portal.
The landing page lists these as later phases.

## Code layout

```
src/domain/     types (SRS §7.1), scoring engine, business-day calendar, unit tests
src/api/        mock backend: seed data + store; each function is named after its future REST endpoint
src/i18n/       en.ts and ar.ts (ar is type-checked against en, so no key can go missing)
src/components/ shared UI, score panels, dispute card, layout and demo menu
src/portals/    public/, employer/, employee/, mol/
scripts/smoke.cjs  Playwright end-to-end walk-through (run against `npm run preview`)
worker/         Cloudflare Worker for live AI contract analysis (holds the API key)
```

To move to a real backend, replace the functions in `src/api/store.ts` with `fetch` calls to the
Node/Express API from SRS §6. The UI calls nothing else.

All companies, people and numbers in the seed data are fictional.
