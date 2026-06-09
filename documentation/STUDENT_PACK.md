# GitHub Student Developer Pack — VisaClarity Growth Guide

Curated from the offers you actually have access to. Ranked by impact for **this project** (AI-personalized visa roadmaps · TanStack Start on Cloudflare Worker runtime · Lovable Cloud / Supabase · pg_cron worker · Tavily research · PDF/DOCX delivery).

Every recommendation maps to a portability seam we already built (`src/lib/ai-gateway.server.ts`, `src/lib/storage.server.ts`, `src/lib/idempotency.server.ts`, `src/lib/saga.server.ts`) — see `PORTABILITY.md` for the migration mechanics.

---

## TL;DR — Claim these 8 today (highest ROI)

| #   | Tool                           | Why it matters for VisaClarity                                                         | Time to value           |
| --- | ------------------------------ | -------------------------------------------------------------------------------------- | ----------------------- |
| 1   | **Namecheap `.me` + free SSL** | Real production domain (visaclarity.me) instead of `*.lovable.app`                     | 10 min                  |
| 2   | **Name.com / .TECH**           | Backup or alt domain (.app / .tech / .studio)                                          | 10 min                  |
| 3   | **Sentry Team (1 yr)**         | Catch crashes in the pg_cron crafting worker and PDF render path before users see them | 20 min                  |
| 4   | **Microsoft Azure $100**       | Fallback AI host (Azure OpenAI) for `AI_GATEWAY_URL` failover                          | 30 min                  |
| 5   | **DigitalOcean $200**          | Spare deploy target if we ever leave Cloudflare Workers                                | claim now, deploy later |
| 6   | **1Password Developer (1 yr)** | Hold `TAVILY_API_KEY`, `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` securely         | 15 min                  |
| 7   | **Doppler Team**               | Sync the same secrets to every environment (dev / preview / prod) without `.env` chaos | 30 min                  |
| 8   | **GitHub Copilot Pro (free)**  | Faster iteration in VS Code on `personalized-roadmap-*.server.ts`                      | 5 min                   |

---

## Stack map — what to swap, what to add, what to skip

| Current tool                                      | Student-pack option                                                                          | Seam to swap at                                                        | Decision                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| Lovable AI Gateway (Gemini / GPT-5)               | **Azure $100 OpenAI**                                                                        | `AI_GATEWAY_URL`, `AI_GATEWAY_API_KEY` in `ai-gateway.server.ts`       | **Hold** — claim credit, only switch if we hit pricing wall |
| Supabase Storage (`personalized-roadmaps` bucket) | **Appwrite Education** (2 projects, Pro limits)                                              | `STORAGE_BACKEND` in `storage.server.ts`                               | **Hold** — Supabase is fine, keep Appwrite as escape hatch  |
| Cloudflare Workers (current host)                 | **DigitalOcean $200** / **Azure App Service** / **Heroku $13/mo × 24mo**                     | Re-deploy target                                                       | **Claim all three**, pick later                             |
| Tavily Search (research agent)                    | — (no direct replacement in pack)                                                            | `personalized-roadmap-research.server.ts`                              | Keep Tavily                                                 |
| Lovable Auth (Supabase)                           | **Clerk Pro (free)**                                                                         | Major rewrite — `useAuth.ts`, `auth-middleware.ts`                     | **Skip** — too invasive, current auth works                 |
| no error tracking yet                             | **Sentry Team** (50k errors/yr, free 1yr)                                                    | New: `src/lib/observability.server.ts`                                 | **Add now**                                                 |
| no APM yet                                        | **New Relic** ($300/mo value, free while student) **or** **Datadog Pro** (2 yrs, 10 servers) | Wrap pg_cron worker                                                    | **Add one** (pick Sentry first, APM later)                  |
| no uptime monitoring                              | **Honeybadger** (Small, 1 yr)                                                                | External ping to `/api/public/hooks/craft-personalized-roadmap`        | **Add**                                                     |
| no feature flags                                  | **DevCycle** (1 yr Starter) **or** **ConfigCat** (1k flags free)                             | Wrap `personalized-roadmap.functions.ts` to flag-gate Pro Max features | **Add** ConfigCat — simpler                                 |
| ad-hoc product analytics                          | **SimpleAnalytics** (100k pv/mo, 1 yr)                                                       | `<script>` in `__root.tsx`                                             | **Add** — privacy-friendly, GDPR-safe for visa users        |
| no cross-browser QA                               | **BrowserStack Automate** / **LambdaTest Live** (1 yr each)                                  | CI later                                                               | Claim, use before launch                                    |
| domain                                            | **Namecheap .me + SSL** + **Name.com** + **.TECH**                                           | DNS to Cloudflare                                                      | **Claim all three**, pick best name                         |
| design assets                                     | **IconScout** (60 icons/mo) + **Icons8** (3 mo)                                              | `src/assets/`                                                          | **Claim** for landing polish                                |
| docs / planning                                   | **Notion Education**                                                                         | external                                                               | **Claim** — replace `.lovable/plan.md` overflow             |
| password mgmt                                     | **1Password Developer** (1 yr)                                                               | external                                                               | **Claim**                                                   |
| secrets mgmt                                      | **Doppler Team**                                                                             | replaces local `.env` workflow                                         | **Claim**                                                   |
| dev env                                           | **GitHub Copilot Pro** + **JetBrains All Products** + **Codespaces Pro**                     | local                                                                  | **Claim all 3**                                             |
| translate roadmaps (future feature)               | **POEditor Plus** (1 yr)                                                                     | i18n strings                                                           | Hold for v2                                                 |

---

## Per-offer deep dives (only the ones that fit our stack)

### 1. Sentry — error tracking for the crafting worker _(claim first)_

**Why us:** The personalized-roadmap pipeline has 4 failure points (Tavily fetch → Gemini synthesis → PDF render → Storage upload). Right now a failure shows up as `status='failed'` in the DB with `error_message` — that's it. With Sentry you get stack traces, breadcrumbs, and release tracking.

**Wire-up:**

1. `bun add @sentry/node @sentry/react`
2. New file `src/lib/observability.server.ts`:
   ```ts
   import * as Sentry from "@sentry/node";
   if (process.env.SENTRY_DSN) {
     Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
   }
   export { Sentry };
   ```
3. In `src/routes/api/public/hooks/craft-personalized-roadmap.ts`, wrap each saga step with `Sentry.captureException` in the catch path.
4. Add `SENTRY_DSN` to `.env.example`.

**Cost after pack:** Free → pay-as-you-go (~$26/mo if we outgrow 50k errors).

---

### 2. ConfigCat — feature flags for Pro Max gating

**Why us:** Right now Pro Max gating lives in `entitlements.server.ts`. A feature flag layer lets us:

- Kill-switch the personalized worker if Tavily quota dies
- Roll out `gemini-3-pro` synthesis to 10% of Pro users
- Gate "translate to native language" beta to specific user IDs

**Wire-up:** New `src/lib/flags.server.ts` reading `CONFIGCAT_SDK_KEY`. Wrap `createPersonalizedRoadmap` server fn.

---

### 3. Azure $100 — AI failover (don't migrate, just hedge)

**Why us:** If Lovable AI Gateway rate-limits during a traffic spike, we lose roadmap delivery. Azure OpenAI gives us a drop-in OpenAI-compatible endpoint.

**Switch with zero code change** — already supported by `ai-gateway.server.ts`:

```bash
AI_GATEWAY_URL=https://YOUR-RESOURCE.openai.azure.com/openai/deployments/gpt-5/chat/completions?api-version=2024-08-01-preview
AI_GATEWAY_API_KEY=<azure key>
```

---

### 4. DigitalOcean $200 — backup deploy target

**Why us:** Insurance. If Cloudflare Workers + Lovable hosting ever blocks something we need (long-running PDF render >30s CPU), we have $200 to spin up an App Platform service running the same TanStack Start build.

**Action:** Claim, don't deploy. Note credit expiry date in calendar.

---

### 5. Doppler + 1Password — secret hygiene

**Why us:** We have 5+ secrets (`TAVILY_API_KEY`, `LOVABLE_API_KEY`, Supabase service role, future Stripe, future SendGrid). Right now they live in Lovable Cloud env + your laptop. Doppler syncs them across environments; 1Password is the human vault.

**Wire-up:** Doppler CLI → `doppler run -- bun dev` for local. Lovable Cloud env stays the source of truth in prod.

---

### 6. Notion Education — operations doc home

Move long-form planning out of `.lovable/plan.md` into Notion. Keep `.lovable/plan.md` for the _current_ sprint only. Use the Notion Education AI quota to draft visa research summaries.

---

### 7. SimpleAnalytics — privacy-friendly analytics

**Why us:** Visa users are sharing nationality + financial data. GDPR / cookie-banner risk with GA4 is real. SimpleAnalytics is cookieless and based in the EU.

100k page views/mo is plenty for the first year.

---

### 8. Stripe — waived fees on first $1k

We don't have payments wired yet, but when we monetize Pro / Pro Max tiers, claim this **before** processing the first payment. ~$30 savings.

---

### 9. BrowserStack / LambdaTest — pre-launch QA

The personalized form has 15+ fields, date pickers, currency selects. Test on real iOS Safari + Android Chrome before launch.

---

### 10. Heroku $13 × 24 = $312 — secondary worker host

If pg_cron limits ever bite, we can move the crafting worker to a Heroku scheduler dyno calling `/api/public/hooks/craft-personalized-roadmap`. Pure ops migration, no code change (the endpoint already accepts external triggers per `PORTABILITY.md`).

---

## Add to `.env.example` after claiming

```bash
# Observability (Sentry student pack)
SENTRY_DSN=

# Feature flags (ConfigCat student pack)
CONFIGCAT_SDK_KEY=

# Analytics (SimpleAnalytics — no key needed, script-only)

# AI failover (Azure $100 student credit) — optional override
# AI_GATEWAY_URL=https://<resource>.openai.azure.com/openai/deployments/<model>/chat/completions?api-version=2024-08-01-preview
# AI_GATEWAY_API_KEY=
```

---

## 30-day claim checklist

**Week 1 — production hardening**

- [ ] Namecheap `.me` domain → point DNS to Lovable
- [ ] Namecheap SSL (or rely on Cloudflare's)
- [ ] Sentry → wire into worker
- [ ] 1Password → import all secrets
- [ ] GitHub Copilot Pro

**Week 2 — observability + ops**

- [ ] Doppler → sync secrets
- [ ] Honeybadger uptime ping on the worker endpoint
- [ ] SimpleAnalytics script in `__root.tsx`
- [ ] ConfigCat → first kill-switch flag

**Week 3 — insurance credits (claim, don't migrate)**

- [ ] Azure $100
- [ ] DigitalOcean $200
- [ ] Heroku $13/mo × 24
- [ ] Appwrite Education
- [ ] MongoDB Atlas $50 (skip wiring; only useful if we add analytics warehouse)

**Week 4 — polish + monetization prep**

- [ ] IconScout + Icons8 → landing illustrations
- [ ] BrowserStack → run mobile audit
- [ ] Stripe waived-fee link (claim **before** first payment)
- [ ] Notion Education → move long-form docs

---

## Offers I'm explicitly skipping (and why)

| Offer                                                                                                                           | Reason                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Clerk Pro**                                                                                                                   | Auth rewrite = days of work. Current Supabase auth handles email + Google fine.                    |
| **MongoDB Atlas**                                                                                                               | We're Postgres-first via Supabase. Adding a doc DB = two source-of-truth problem.                  |
| **Heroku** (wire-up)                                                                                                            | Claim the credit, but don't deploy. Cloudflare Workers is cheaper and we already optimized for it. |
| **Bootstrap Studio / Themeisle Neve**                                                                                           | We're Tailwind v4 + shadcn. Wrong ecosystem.                                                       |
| **Travis CI**                                                                                                                   | GitHub Actions is free for what we need.                                                           |
| **DataCamp / Boot.dev / Educative / FrontendMasters / Scrimba / Codedex / GoRails / SymfonyCasts / AlgoExpert / InterviewCake** | Learning platforms — claim if useful personally, but no project impact.                            |
| **Arduino / Adafruit / Camber / Carto / Blockchair / Xojo / Vaadin / LocalStack / Zyte**                                        | Wrong domain (hardware / blockchain / spatial / Java / scraping infra).                            |
| **Pageclip**                                                                                                                    | Form backend — we have Supabase server functions.                                                  |
| **Visme / SlideCoach / PomoDone / HazeOver / Dashlane**                                                                         | Productivity / pitch tools — claim personally, no project impact.                                  |
| **CodeScene / DeepScan / Blackfire / Codecov**                                                                                  | Code quality tools — nice-to-have, low priority for a small TS codebase.                           |
| **Requestly / Testmail / Polypane / ToDiagram / SQLGate / PopSQL / Deepnote**                                                   | Dev utilities — claim if you personally use them.                                                  |
| **GitLens / GitKraken / Tower / WorkingCopy / Termius**                                                                         | Git/SSH clients — personal preference.                                                             |
| **Imgbot**                                                                                                                      | Useful if we add many user-uploaded images. Hold for v2.                                           |
| **AstraSecurity**                                                                                                               | Real security audit, but premature — wait until paid users exist.                                  |
| **CARTO / Appfigures / Octicons**                                                                                               | Wrong domain.                                                                                      |

---

## Reference

- All migration mechanics: `PORTABILITY.md`
- AI gateway abstraction: `src/lib/ai-gateway.server.ts`
- Storage abstraction: `src/lib/storage.server.ts`
- Background worker entry: `src/routes/api/public/hooks/craft-personalized-roadmap.ts`
- Portability self-test: `bun run portability:check`
