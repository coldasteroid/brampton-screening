# FairPlan

**AI-native Administrative Penalty System modernization & personalized payment experience for the City of Brampton.**

Built against the City's published POC topic — *Administrative Penalty System Modernization and Personalized Payment Experience*. Every line item on the City's official benefits list maps to a working feature in this build.

---

## Why this matters

The City's January 2026 penalty schedule raised serious-violation fines (snow clearing $250 → $750, pool fence $350 → $1,000, rental licensing $750 → $1,500) and projects **$1.97M in additional annual revenue**. The existing APS portal offers:

- **No payment plans, no partial payments**
- A **15-day dispute window** with no extension policy
- Residents pay the $1.50–$2.50 transaction surcharge themselves
- French via downloadable PDF only — no inline multilingual flow
- Default → automatic credit-bureau referral, hitting low-income residents hardest

FairPlan addresses every one of these gaps with a single end-to-end experience deployed on Cloudflare.

---

## The City's brief, addressed line by line

| City's stated benefit | Where it lives | Status |
| --- | --- | --- |
| Automate screening intake, case triage, evidence gathering | `/dispute/[ticketId]` → R2 evidence + D1 case file + AI priority scoring | ✅ |
| Provide summary & recommendations to Screening Officers | `/officer` queue → `/officer/[id]` AI-drafted recommendation | ✅ |
| Automatically generate correspondence | Branded payment-plan agreement + Notice of Decision via Browser Rendering | ✅ |
| Personalized payment reminders & flexible options | 3/6/12-month plans calibrated to LIM-AT + scheduled reminder ledger | ✅ |
| **Predictive insights to prioritize overdue cases** | Public dashboard + officer queue priority sort + manager analytics | ✅ |
| Dashboards & reports for managers | `/manager` — caseload, decision mix, ward load, equity overlay | ✅ |

Plus differentiators the City didn't explicitly list but stakeholders will recognize:

- **Multilingual** resident experience — EN / Punjabi / Hindi / French, with HTML `lang` + `dir` and AI outputs in the resident's language
- **Hearings flow** end-to-end — slot picker → booking → ICS calendar download → officer hearings list
- **Bylaw RAG** — every screening recommendation grounded in published Brampton + Ontario AMPS regulation text, browsable at `/bylaws`
- **Auth with three roles** (resident / officer / manager) with PBKDF2-hashed credentials, HMAC-signed session cookies, and role-gated routes

---

## Architecture

A single Astro 5 app deploys to one Cloudflare Worker via Workers Assets. Server-rendered pages live alongside API routes that delegate to a small, auditable set of *agent skills*. Every model call's provider is one config flip away.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│   Astro + React PWA  →  Edge Worker  →  Agent skills (./src/lib/agents)       │
│                                                  │                            │
│              ┌───────────────────┬──────────────┴─────────────┐               │
│              ▼                   ▼                            ▼               │
│       Workers AI / Claude       D1 (state)             Browser Rendering      │
│       via AI Gateway            R2 (PDFs, evidence)    (correspondence)       │
│       (one config flip)         KV (config)                                   │
│                                                                               │
│   Per-case state for deploys (ready, see worker-entry.ts):                    │
│     · Durable Object  — FairPlanCase  (conversation, alarms, sync)            │
│     · Workflow        — ScreeningWorkflow  (intake → draft → wait → notify)   │
│                                                                               │
│   Live public data fetched at the edge (cached):                              │
│     · Brampton GeoHub — Ward Boundaries FeatureServer                         │
│     · Statistics Canada — Brampton CSD 3521010 + LIM-AT 2024                  │
│     · Bank of Canada — Valet API (prime + overnight rates)                    │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Agent skills (`src/lib/agents/skills.ts`)

| Skill | Inputs | Output | LLM-bounded? |
| --- | --- | --- | --- |
| `explainTicket` | ticket, language | warm 3-paragraph explanation in resident's language | yes |
| `proposePlan` | ticket, annual income, household, language | hardship band, months, monthly $, BoC APR comparison, persisted plan | **no** — deterministic policy + LIM-AT |
| `explainPlan` | plan facts, language | 2-paragraph rationale referencing the deterministic numbers | yes |
| `draftOfficerRecommendation` | ticket, review, evidence summary | structured JSON: recommended action, reasoning, cited bylaws, risk flags, confidence | yes + RAG + heuristic fallback |
| `lookupBylaw` | free-text query, k | top-k bylaw chunks from corpus | **no** — token-overlap retrieval (swaps to Vectorize + bge-m3 on deploy) |

**Decisions that touch money are deterministic.** The LLM is bounded to explanation and translation. A Screening Officer can read every line of policy code without trusting model output.

### Cloudflare primitives used

| Primitive | Where | Status |
| --- | --- | --- |
| Workers + Workers Assets | All page + API routing | Local + deploy |
| D1 | `tickets`, `payment_plans`, `screening_reviews`, `evidence_items`, `hearings`, `reminders`, `users`, `audit_log` | Local + deploy |
| R2 | `EVIDENCE` bucket for uploads + generated PDFs | Local emulator + deploy |
| KV | `CONFIG` namespace for feature flags + translation cache | Local emulator + deploy |
| Workers AI (Llama 3.3 70B) | AI router default provider | Deploy only (local uses curated fallback) |
| AI Gateway | Anthropic Claude routing with PII guardrails, caching, cost tracking | Deploy only (URL config'd in `.dev.vars`) |
| Browser Rendering | Server-side PDF for agreements + Notices of Decision | Deploy only (local uses print-HTML) |
| Durable Objects (`FairPlanCase`) | Per-ticket state, alarms-driven reminders, single-threaded sync | Code ready in `src/lib/agents/case.ts`; `worker-entry.ts` exports it |
| Workflows (`ScreeningWorkflow`) | Multi-day pipeline with `step.waitForEvent('officer-decision')` | Code ready in `src/lib/agents/workflow.ts`; `worker-entry.ts` exports it |
| Cron Triggers | `/api/reminders/run-due` — moves due reminders to sent | Local manual run; deploy uses `triggers.crons` |
| Edge Cache | Wards GeoJSON cached for 24h via `cf.cacheTtl` | Deploy only |

---

## Routes

### Resident
| Path | What it does |
| --- | --- |
| `/` | Landing — live BoC ticker, StatCan stats, story, 6 City benefits, Cloudflare stack |
| `/ticket/[id]` | Notice detail with AI plain-language explanation + reminder timeline |
| `/plan?ticket=[id]` | Hardship form → 3/6/12-month plan with live BoC APR comparison → e-sign |
| `/dispute/[id]` | Screening Review form: reasons + narrative + R2 evidence upload |
| `/dispute/submitted` | Confirmation after dispute is filed |
| `/decision/[id]` | Public Notice of Decision page (resident-facing) |
| `/hearing/select/[id]` | Slot picker after hearing referral |
| `/hearing/[id]` | Confirmation + ICS calendar download |
| `/my-notices` | Logged-in resident's notices, plans, reviews |

### Staff
| Path | Roles | What it does |
| --- | --- | --- |
| `/officer` | officer, manager | Priority-sorted screening queue |
| `/officer/[id]` | officer, manager | Case detail + AI recommendation + decision form + evidence viewer |
| `/hearings` | officer, manager | Upcoming hearings list |
| `/manager` | manager | KPIs, decision mix, ward load, offence breakdown, equity overlay |

### Public + reference
| Path | What it does |
| --- | --- |
| `/dashboard` | Live Brampton ward map + predictive collections + StatCan equity profile |
| `/bylaws` | Indexed corpus + free-text retrieval explorer |
| `/about` | Architecture, skill table, roadmap |
| `/login` / `/signup` | Pure-Astro forms; sample credentials displayed prominently |

### API
| Path | Method | Purpose |
| --- | --- | --- |
| `/api/ai/explain` | POST | Skill: explain a ticket |
| `/api/ai/propose-plan` | POST | Skill: propose hardship-aware plan |
| `/api/ai/explain-plan` | POST | Skill: narrate a proposed plan |
| `/api/screening/submit` | POST | Multipart — file a dispute with evidence |
| `/api/screening/recommend` | POST | Generate the AI officer recommendation |
| `/api/screening/decide` | POST | Officer records final decision |
| `/api/decision-letter/[id]` | GET | Branded Notice of Decision HTML/PDF |
| `/api/pdf/[planId]` | GET | Branded payment plan agreement |
| `/api/evidence/[id]` | GET | Officer-only R2 file proxy |
| `/api/hearings/book` | POST | Resident books a hearing slot |
| `/api/hearings/[id]/ics` | GET | Calendar invite download |
| `/api/reminders/run-due` | POST | Cron-trigger entrypoint; fires due reminders |
| `/api/rag/search` | GET | Bylaw retrieval |
| `/api/dashboard/summary` | GET | KPIs, by-ward, at-risk cases, rates |
| `/api/geo/wards` | GET | Brampton ward boundaries (live, edge-cached) |
| `/api/boc/prime` | GET | Bank of Canada prime rate (live) |
| `/api/stats/*` | GET | Statistics Canada highlights |
| `/api/auth/{me,logout}` | GET/POST | Session inspection + sign-out |
| `/api/lang` | POST | Set the resident's language preference cookie |

---

## Run it locally

Requires Node 20+ (tested on Node 24, npm 11, Windows 11 / PowerShell).

```powershell
npm install
npm run db:apply:local   # creates local SQLite + applies all 5 migrations
npm run dev              # http://localhost:4321
npm test                 # 21 tests across auth, statcan, boc, rag, hearings
```

**Local dev runs without `wrangler login`.** D1, KV, and R2 use Miniflare's local emulators. Workers AI, Browser Rendering, and AI Gateway aren't bound — the AI router falls through to curated multilingual sample responses (`src/lib/ai/sample-responses.ts`), the PDF endpoint returns print-HTML, and live external APIs (Bank of Canada, Brampton GeoHub) call directly.

### Sample credentials

| Role | Email | Password |
| --- | --- | --- |
| Resident | `resident@brampton.demo` | `fairplan2026` |
| Screening Officer | `officer@brampton.demo` | `fairplan2026` |
| Manager | `manager@brampton.demo` | `fairplan2026` |

Demo users are seeded on the first login attempt — passwords are PBKDF2-SHA256 hashed by the same routine that verifies them. The sign-in page lets reviewers autofill any role with one click.

### Sample notices

- `BRP-2026-001003` — $750 Property Maintenance, Ward 9 (assigned to demo resident)
- `BRP-2026-001004` — $1,000 Pool Fence Enclosure, Ward 6
- `BRP-2026-001006` — $1,500 Rental Without Licence, Ward 9
- Full list at `/dashboard`

---

## Deploy to Cloudflare

```powershell
npx wrangler login
npx wrangler d1 create fairplan-db
npx wrangler kv namespace create CONFIG
npx wrangler r2 bucket create fairplan-evidence
```

Paste the returned `database_id` and KV `id` into `wrangler.jsonc`.

Then **uncomment the blocks at the top of `wrangler.jsonc`** to enable the production-only bindings:

```jsonc
"ai":      { "binding": "AI" },
"browser": { "binding": "BROWSER" },

"durable_objects": {
  "bindings": [{ "name": "CASE", "class_name": "FairPlanCase" }]
},
"migrations": [
  { "tag": "v1", "new_sqlite_classes": ["FairPlanCase"] }
],

"workflows": [
  { "name": "screening-workflow", "binding": "SCREENING_WORKFLOW",
    "class_name": "ScreeningWorkflow" }
],

"triggers": { "crons": ["*/5 * * * *"] }
```

To export `FairPlanCase` and `ScreeningWorkflow` from the Worker bundle, add `workerEntryPoint` to `astro.config.mjs`:

```js
adapter: cloudflare({
  platformProxy: { enabled: true },
  workerEntryPoint: {
    path: 'src/worker-entry.ts',
    namedExports: ['FairPlanCase', 'ScreeningWorkflow'],
  },
})
```

Finally:

```powershell
npm run db:apply:remote
npm run deploy
```

The Worker ships to `fairplan.workers.dev` (or whatever `name` you set in `wrangler.jsonc`). A custom domain attaches via Cloudflare Registrar in two clicks once registered.

### Anthropic + AI Gateway (recommended for production)

```
# .dev.vars (or wrangler secret put)
AI_PROVIDER=anthropic
AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/{ACCOUNT_ID}/{GATEWAY_ID}/anthropic
ANTHROPIC_API_KEY=sk-ant-...
AUTH_SECRET=...
```

The router (`src/lib/ai/router.ts`) is provider-agnostic — no application code changes for the swap.

---

## Repository layout

```
src/
  pages/                          Astro routes (server-rendered on Workers)
    index.astro                   Resident landing
    ticket/[id].astro             Notice detail + AI explainer + reminders
    plan.astro                    Hardship-aware plan recommender
    dispute/[id].astro            Screening Review form + R2 evidence
    decision/[id].astro           Public Notice of Decision
    hearing/select/[id].astro     Hearing slot picker
    hearing/[id].astro            Hearing confirmation + ICS download
    my-notices.astro              Resident's case history
    officer/index.astro           Screening queue
    officer/[id].astro            Case detail + AI rec + decision form
    hearings.astro                Officer hearings list
    manager.astro                 Manager analytics
    dashboard.astro               Public analytics + wards map
    bylaws.astro                  RAG corpus explorer
    about.astro                   Architecture write-up
    login.astro                   Server-rendered auth (no React island)
    signup.astro                  Server-rendered auth
    api/                          Server endpoints
  components/                     React islands + Astro components
    TicketLookup.tsx · TicketExperience.tsx · PlanRecommender.tsx
    WardsMap.tsx · PredictiveCollections.tsx · LiveStat.tsx
    OfficerCase.tsx · DisputeForm.tsx · BylawSearch.tsx · LanguagePicker.astro
  layouts/Base.astro              Shared shell, header, footer, i18n switcher
  lib/
    ai/
      router.ts                   Workers AI ↔ Claude ↔ demo dispatcher
      prompts.ts                  Skill prompts — one per skill, auditable
      sample-responses.ts         Local demo fallback content (EN/PA/HI/FR/UR/ES)
    agents/
      skills.ts                   Pure skill functions (the production path)
      case.ts                     FairPlanCase Durable Object (deploy-ready)
      workflow.ts                 ScreeningWorkflow with waitForEvent (deploy-ready)
    data/
      penalties.ts                Brampton Jan 2026 penalty schedule
      boc.ts                      Bank of Canada Valet client (snapshot fallback)
      brampton-geohub.ts          ArcGIS Ward Boundaries client (snapshot fallback)
      statcan.ts                  Statistics Canada Brampton CSD 3521010
    rag/
      bylaws.ts                   Indexed bylaw corpus + token-overlap retrieval
    auth.ts                       PBKDF2 password hashing + HMAC session cookies
    db.ts                         D1 query helpers (all queries audited here)
    hearings.ts                   Slot generation + ICS rendering
    i18n.ts                       Translation bundle + language cookie helpers
    reminders.ts                  Reminder schedule builder
  middleware.ts                   Session + language resolution per request
  worker-entry.ts                 Production Worker entry (DO + Workflow exports)
  styles/global.css               Tailwind base + design tokens + AODA primitives
tests/                            21 vitest unit tests
migrations/                       5 D1 migrations (run by scripts/apply-migrations.mjs)
scripts/apply-migrations.mjs      Idempotent migration runner
public/favicon.svg
wrangler.jsonc                    Worker manifest (deploy-only bindings commented)
astro.config.mjs                  Astro + Cloudflare adapter config
tailwind.config.mjs               Brand palette + design tokens
```

---

## Public data sources

All three are public, OGL-compatible, and free to query.

- **City of Brampton ArcGIS GeoHub** — Ward Boundaries FeatureServer, queried server-side and edge-cached
- **Statistics Canada Census 2021** — Brampton CSD 3521010 (population, household income, languages at home, visible minority %) and LIM-AT 2024 thresholds for hardship calibration
- **Bank of Canada Valet API** — live prime rate (V80691311) and overnight rate (V39079) for the credit-card APR comparison

---

## Accessibility (AODA-aware)

- Skip-to-content link in every page
- HTML `lang` and `dir` attributes flip with the selected language (EN/PA/HI/FR)
- `aria-current="page"` on the active nav link
- `aria-live` regions on AI-generated content during fetch
- Visible focus ring on all interactive elements (4px teal halo, WCAG-friendly contrast)
- `prefers-reduced-motion` respected for shimmer + transitions
- Form labels associated with every input via `for`/`id`
- Decorative SVGs marked `aria-hidden`
- Color palette tested for 4.5:1 contrast on body text

---

## Tests

```powershell
npm test
```

21 tests across 5 files cover the deterministic core:

- **`tests/auth.test.ts`** — PBKDF2 hash format, verify roundtrip, wrong-password rejection, malformed-input safety, per-user salt
- **`tests/statcan.test.ts`** — LIM-AT scales with √(household), all three hardship bands hit at the right income ratios
- **`tests/boc.test.ts`** — credit-card interest formula at zero & standard APR, shorter-term cost ordering, graceful fallback when upstream is unreachable
- **`tests/rag.test.ts`** — top-result correctness across pool-fence / fire-hydrant / hardship queries, empty-query safety, sorted-by-score guarantee
- **`tests/hearings.test.ts`** — slot timing (≥ 10 days out, weekdays only), ICS format (RFC 5545-compliant VCALENDAR, escaped fields)

All tests run in pure Node — no D1 mock, no Cloudflare context required.

---

## License

Proof-of-concept code submitted in response to the City of Brampton's published AI POC program. Not affiliated with the City.
