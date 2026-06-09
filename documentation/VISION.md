# VisaClarity — Vision & Long-Term Product Roadmap

> **One trusted home for the entire visa + relocation journey — from "can I even get this visa?" to "I've landed, here's my SIM, bank, room, and registration."**

This is the north-star document. It defines what VisaClarity is trying to become over the next 24 months, who we serve, what we'll never build, and how every feature maps back to the codebase we already have. Every sprint plan, partnership conversation, and pitch starts here.

Companion docs:

- `PORTABILITY.md` — how the architecture stays platform-independent
- `STUDENT_PACK.md` — credits and tools fuelling the build
- `MIGRATION.md` — escape hatches if we ever leave the current stack
- `.lovable/plan.md` — current sprint only

---

## 1. The one-line vision

> A globally trusted, AI-first platform that walks **any human — first-timer, repeat traveller, or someone who's never filled a form in English** — through the entire visa and relocation journey, in their language, on their phone, with radical fee transparency and no scams.

We are not another visa-agent funnel. We are the **operating system for crossing borders**.

---

## 2. Who we serve (three personas, one product)

| Persona                                                                                                                         | Today's reality                                                                                      | What they need from us                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **First-timer / less-literate applicant** (e.g. parents going to visit children abroad, first-time student, blue-collar worker) | Pays an agent ₹15k–₹50k, has no idea what's in the form, lives in fear of rejection, often scammed   | WhatsApp-first, native language, voice input, hand-holding through every step, "someone like me" reassurance |
| **Experienced traveller / repeat applicant** (digital nomad, frequent business traveller)                                       | Knows the basics, hates VFS upsells, wants speed, hates re-typing                                    | Auto-fill from past applications, slot radar, all-in cost comparison, document vault                         |
| **Student / worker relocator** (Germany student, UK Skilled Worker, US H-1B partner, Canada PR applicant)                       | Juggles 7 vendors: visa, blocked account, insurance, accommodation, loan, flight, post-arrival admin | One platform that links visa → financial proof → housing → insurance → arrival kit                           |

The product must serve all three without becoming a Swiss-army-knife mess. The wedge is **personalization**: ask once, infer the rest.

---

## 3. Market landscape — who's out there, and where the gap is

We benchmarked 40+ platforms across 7 categories. Headline insight: **no one owns the full vertical stack for the Global-South consumer.** Most platforms are either B2B (Sherpa, Envoy, Localyze, Casium), single-product (Expatrio, Amber, SafetyWing), or geography-locked (Boundless = US-only, Yocket = India→US, Edvoy = →UK/Ireland).

### 3.1 Competitor snapshot

| Category                           | Players we benchmarked                                                                                                                      | Their gap = our opportunity                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Visa apps (B2C)**                | iVisa (4.3★, 68k reviews), Atlys ($37M raised, India focus), VisaHQ (legacy), Sherpa (B2B API), VFS Global (**1.6★**, near-monopoly, hated) | Opaque fees, tourist-only, no personalization, no post-visa support             |
| **Study abroad**                   | Leverage Edu, Yocket, ApplyBoard ($553M), IDP, GradRight, Edvoy, Crimson, Shorelight, Studyportals                                          | Counselor-heavy, commission-driven, no post-arrival, no financial proof builder |
| **Relocation SaaS**                | Envoy Global, Boundless ($750–1500), Localyze, Deel Immigration, SimpleCitizen ($529+), Jobbatical                                          | B2B-first or US-only; individual buyers ignored                                 |
| **Financial**                      | Expatrio (€5/mo), Fintiba, Flywire (NASDAQ), MPOWER (12–14% APR), Prodigy Finance ($900M raised)                                            | Germany-only blocked accounts, opaque loan rates, no integrated proof builder   |
| **Housing**                        | Amber Student (4.8★, 1M+ rooms), University Living (4.6★), HousingAnywhere, Uniplaces, Spotahome, Nestpick                                  | Bait-and-switch listings, no visa-linkage, no refund-if-rejected                |
| **Insurance**                      | SafetyWing (~$45/mo), World Nomads, Tata AIG, ACKO                                                                                          | Schengen-minimum confusion, slow claims, no auto-certificate generation         |
| **AI-native entrants (2023–2026)** | Casium ($5M, Oct 2025), VISARUN.AI ($700k, Feb 2025), SPUN ($1.8M, Jan 2026), Visafy, JustiGuide, Permito.ai, GetGIS, Visalaw.ai, Gale (YC) | Mostly B2B copilots for lawyers/agents; consumer AI is wide open                |

### 3.2 Where the white space is

```
                                       Pre-      Apply  Financial  Housing  Insurance  Arrival  Post-arrival
iVisa / Atlys / VFS                     ░░       ███     ░░         ░░       ░░         ░░       ░░
ApplyBoard / Leverage Edu               ██       ██      ██         ░░       ░░         ░░       ░░
Expatrio / Fintiba                      ░░       ░░      ███        ░░       █          ░░       ░░
Amber Student                           ░░       ░░      ░░         ███      ░░         ░░       ░░
SafetyWing                              ░░       ░░      ░░         ░░       ███        ░░       ░░
Casium / Envoy (B2B)                    ██       ██      █          ░░       ░░         ░░       ░░
────────────────────────────────────────────────────────────────────────────────────────────────────────
VisaClarity (target)                    ███      ███     ███        ███      ███        ███      ███
```

Nobody covers the full row. That row is our moat.

---

## 4. The 14 pain points we're attacking

Synthesized from VFS Global Trustpilot (1.6★ across 1,334 reviews), Atlys controversy reporting, Reddit r/immigration, Politico EU investigation (May 2026), Indian Express VFS bribery investigation, Quora, and Rappler scam coverage.

| #   | Pain point                                                           | Severity    | Our pillar # |
| --- | -------------------------------------------------------------------- | ----------- | ------------ |
| 1   | Document checklist confusion (nationality × destination × visa type) | 🔴 Critical | P2           |
| 2   | Embassy / VFS appointment slot scarcity (bots scalping slots)        | 🔴 Critical | P3           |
| 3   | Opaque, stacked fees (govt + service + "verification" + "scanning")  | 🔴 Critical | P8           |
| 4   | Visa scams and fake agents on social media                           | 🔴 Critical | P6           |
| 5   | Financial proof complexity (blocked accounts, sponsor letters, ITRs) | 🟠 High     | P7           |
| 6   | Zero personalization for first-timers / unusual profiles             | 🟠 High     | P1, P2       |
| 7   | Language barriers — almost everything is English-only                | 🟠 High     | P4           |
| 8   | Post-submission black hole (221(g), "administrative processing")     | 🟠 High     | P12          |
| 9   | Rejection with no explanation, no appeal help                        | 🟠 High     | P1, P5       |
| 10  | Post-arrival void — platforms disappear after visa stamped           | 🟡 Med-High | P11          |
| 11  | Unreliable accommodation listings, deposits for unavailable rooms    | 🟡 Med-High | P9           |
| 12  | Insurance literacy gap (what does Schengen-min actually cover?)      | 🟡 Med      | P10          |
| 13  | Loan rate opacity — final APR only after applying                    | 🟡 Med      | P7           |
| 14  | Emotional toll — anxiety, no community, no mental-health support     | 🟡 Med      | P13          |

---

## 5. The 13-pillar product

Each pillar lists: **problem → what ships → who it beats → code seam it plugs into.**

### P1. "Will I Get It?" — pre-application approval predictor

- **Problem:** Applicants spend ₹10k+ in fees not knowing if they're even a credible candidate.
- **Ship:** AI model trained on (a) public approval-rate data by nationality × embassy × visa class, (b) our own outcome data once we have it. Returns a calibrated probability + specific _profile-strengthening actions_ ("add 6 months of bank statements", "get an employer NOC").
- **Beats:** Nobody offers this. Closest is anecdotal Reddit threads.
- **Code seam:** new `src/lib/approval-predictor.server.ts`; reuses `chatCompletion` in `ai-gateway.server.ts`.

### P2. Dynamic, hyper-personalized document checklist

- **Problem:** Generic checklists miss profile-specific docs (self-employed → ITR + GST; single parent → custody letter; prior rejection → cover letter).
- **Ship:** Conversational intake → AI-generated checklist that updates live when embassy requirements change. WhatsApp alerts in local language.
- **Beats:** iVisa, Atlys (static checklists); VFS (no checklist at all).
- **Code seam:** extends `personalized-roadmap-craft.server.ts`; new `checklist.functions.ts` server fn.

### P3. Embassy / VFS slot radar + opt-in auto-book

- **Problem:** Genuine applicants wait 2–6 months for Schengen slots while bots resell them.
- **Ship:** Background scraper hitting VFS/TLScontact/consular portals every few minutes; instant push/WhatsApp on availability; **opt-in** auto-book with stored consent + payment method.
- **Beats:** This alone would be viral — no legitimate alternative exists.
- **Code seam:** new pg_cron worker at `src/routes/api/public/hooks/slot-radar.ts`, idempotency via `idempotency.server.ts`, saga via `saga.server.ts`.
- **Ethics:** rate-limited, respects portal ToS where booking is concerned, never resells slots.

### P4. Conversational AI form-filling copilot

- **Problem:** Government PDF forms are 20+ pages of jargon; one wrong field = rejection.
- **Ship:** Voice + text chat (WhatsApp + web) in user's language → auto-populates the official form → pre-validates against rejection triggers → produces a fill-ready PDF.
- **Beats:** Every existing player still shows the user a form.
- **Code seam:** new `src/lib/form-copilot.server.ts`; multimodal Gemini via `ai-gateway.server.ts`; storage via `storage.server.ts`.

### P5. Rejection-proof document review

- **Problem:** A 6-month-old bank statement, an unsigned employer letter, an ITR missing a page — silent rejection triggers.
- **Ship:** Upload docs → AI flags issues + a **"document health score"** + optional human-in-loop expert review for Pro Max. Currency-converted balances against embassy minimums.
- **Beats:** Boundless does this only for US family visas; nobody does it globally.
- **Code seam:** new `document-review.functions.ts`; storage in `personalized-roadmaps` bucket pattern; AI via gateway.

### P6. Scam shield + verified-agent marketplace

- **Problem:** Facebook/Instagram ads → phishing sites → drained bank accounts.
- **Ship:** (a) "Paste a URL, get a fraud score" tool, (b) badged marketplace of licensed agents with escrow payments held until visa delivered, (c) public scam-feed updated by community + our AI crawler.
- **Beats:** Nobody. This is a trust-building flagship.
- **Code seam:** new `scam-shield.functions.ts`; uses Tavily research seam already wired in `personalized-roadmap-research.server.ts`.

### P7. Integrated financial-proof builder

- **Problem:** Expatrio/Fintiba solve Germany only. Indian student going to Canada has to assemble GIC + ITR + sponsor affidavit + property docs alone.
- **Ship:** Per-corridor financial-proof generator — picks the right instrument (blocked account / GIC / liquid funds / sponsor), templates affidavits, formats statements to embassy spec, and runs a **reverse-auction loan marketplace** (GradRight model, but cross-corridor).
- **Beats:** Expatrio/Fintiba (Germany), GradRight (India→US), MPOWER (US).
- **Code seam:** new `financial-proof.functions.ts`; partner API adapters under `src/integrations/financial/`.

### P8. All-in fee + FX transparency layer

- **Problem:** VFS charges €150 to scan documents, €220 for "verification". iVisa stacks a service fee. Nobody shows the _true total_ in your home currency upfront.
- **Ship:** Before any application starts, show: govt fee + service fee + courier + biometric + insurance min + FX conversion = **one number in your currency**. Compare DIY vs. assisted side-by-side.
- **Beats:** Everyone. This is anti-VFS positioning.
- **Code seam:** new `cost-engine.server.ts`; FX via a free provider (exchangerate.host) wrapped behind a portability adapter.

### P9. Visa-linked housing guarantee

- **Problem:** Chicken-and-egg: can't lease without a visa, can't get visa without proof of accommodation.
- **Ship:** Partner with Amber Student / University Living / HousingAnywhere to offer **refundable hold** — small deposit reserves a room while visa processes, full refund on rejection.
- **Beats:** No housing platform offers visa-linkage today.
- **Code seam:** new `src/integrations/housing/` adapters; saga in `saga.server.ts` to coordinate deposit ↔ visa state.

### P10. Smart insurance recommender + auto-certificate

- **Problem:** Students buy ₹3000 "Schengen insurance" that fails on first claim.
- **Ship:** AI-picks the right policy (visa type × destination × duration × age × pre-existing conditions). Auto-generates the Schengen-compliant PDF certificate. Marketplace of SafetyWing / Tata AIG / ACKO / Allianz.
- **Beats:** Tata AIG (poor UX), SafetyWing (no visa context).
- **Code seam:** `src/integrations/insurance/`; certificate generation via `roadmap-export.server.ts` extension.

### P11. "Day 1 Arrival Kit" — post-visa orchestration

- **Problem:** Visa stamped → user is alone. SIM, bank, Anmeldung, transport, university enrolment — all separate vendors.
- **Ship:** Triggered when status becomes "approved". WhatsApp/email drip timed to arrival date: eSIM (Airalo partner), bank account (Wise/Revolut/N26 referral), city-specific registration guide, transport setup, university check-in checklist.
- **Beats:** **The biggest unmet need in the entire market.**
- **Code seam:** new `arrival-kit.functions.ts`; reuses email infra and WhatsApp channel (P4).

### P12. Status-AI monitor

- **Problem:** "Administrative processing" / 221(g) for 6 months with no explanation.
- **Ship:** Integrate with CEAC / USCIS / VFS tracking portals. Parse cryptic statuses into plain language. Predict ETAs from historical data. Proactive WhatsApp updates.
- **Beats:** Permito.ai (US-only); nobody global.
- **Code seam:** new pg_cron worker `src/routes/api/public/hooks/status-poll.ts`.

### P13. Peer community + "someone like me" + mental wellness

- **Problem:** Visa anxiety is real. r/immigration is full of trauma posts. People want to see _"someone with my exact profile made it through"_.
- **Ship:** Verified peer community with anonymized outcome data ("3,241 Nigerians applied for UK student visa at Lagos in 90 days — 76% approved in 18 days avg"). Optional **visa buddy** matching with someone who completed the same journey. Light-touch mental-wellness check-ins.
- **Beats:** Nobody combines outcome data + community + wellness.
- **Code seam:** new `community.functions.ts`; outcome data feeds back into P1's predictor.

---

## 6. Roadmap — four horizons (no calendar dates, just ordering)

### NOW (in flight + next 60 days of work)

- ✅ Personalized roadmap PDF/DOCX delivery (already shipping)
- ✅ Portability harness (`scripts/portability-check.ts`)
- 🔨 **P2** Dynamic checklist generator (extension of current craft pipeline)
- 🔨 **P8** Fee + FX transparency layer (cheap, high-trust win)
- 🔨 WhatsApp delivery channel (unlocks P4, P11, P12 later)
- 🔨 Sentry + observability (from `STUDENT_PACK.md`)

### NEXT

- **P3** Slot radar — start with Schengen (highest pain, highest virality)
- **P5** Document review (Pro tier monetization)
- **P6** Scam shield (trust flagship)
- **P7** Financial-proof builder — start India→Canada GIC and India→Germany blocked account

### LATER

- **P9** Housing guarantee — partnership with Amber Student first
- **P11** Arrival kit (eSIM + Wise partnerships)
- **P12** Status-AI monitor (CEAC + VFS first)
- **P10** Insurance marketplace

### LONG

- **P13** Peer community + buddy matching
- **P1** Approval predictor trained on our own accumulated outcome data
- **P4** Multilingual voice copilot (Hindi, Tagalog, Arabic, French, Spanish, Mandarin)

---

## 7. Trust & moat — why anyone will actually use us

1. **Radical fee transparency** — direct anti-VFS positioning. We show all-in cost before they spend a rupee.
2. **Cited every time** — every recommendation links to the official source (already wired via Tavily in `personalized-roadmap-research.server.ts`). No hallucinated fees, no fake URLs.
3. **Outcome data flywheel** — every approved/rejected case quietly improves P1's predictor. Compounds for years; new entrants can't catch up.
4. **WhatsApp-native + multilingual** — Global South wins on distribution. Atlys is mobile-app, we're conversational.
5. **Portable architecture** — `PORTABILITY.md` keeps us un-locked-in. Sentry, Doppler, Azure failover, storage abstraction. Trust = "we'll still be here in 5 years".
6. **Human-in-loop on the highest-stakes step (P5)** — AI confidence + expert sign-off. This is the premium moat agents can't beat on price OR quality.
7. **Verified-agent marketplace (P6)** — turns competitors (legit agents) into supply; cuts scammers out.

---

## 8. Business model

| Tier        | Who                                                                          | What they get                                                                                                                                            | Price                                     |
| ----------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Free**    | Everyone                                                                     | Research (current roadmap.tsx), basic checklist (P2), fee transparency (P8), scam shield URL checker (P6)                                                | $0                                        |
| **Pro**     | Serious individual applicants                                                | Personalized roadmap (current), document review AI (P5), status monitor (P12), arrival kit (P11)                                                         | ~$15–25 one-time per application or $9/mo |
| **Pro Max** | High-stakes / wealthy / risk-averse                                          | Everything above + slot radar (P3), human-expert document review (P5), housing guarantee (P9), financial-proof concierge (P7), priority WhatsApp support | ~$99–199 per application                  |
| **B2B**     | Universities, immigration agents, employers (EOR companies), travel insurers | API access (Sherpa-style), bulk applicant management, white-label arrival kits, lead-gen on housing/insurance/loans                                      | Custom                                    |

Affiliate / partnership revenue: housing (Amber, HousingAnywhere), insurance (SafetyWing, Allianz), loans (Prodigy, MPOWER, GradRight), bank/eSIM (Wise, Revolut, Airalo).

---

## 9. Risks & ethical guardrails

| Risk                                                                                      | Guardrail                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auto-booking slots (P3) crosses ToS or denies others access                               | Opt-in only, rate-limited, never bulk-bot, never resell, never charge for slot itself                                                                                           |
| Predictor (P1) feels deterministic — "the AI said I'd be rejected"                        | Always probabilistic UI, always show how to _improve_ the score, never claim certainty                                                                                          |
| Document review (P5) gives bad advice → rejection                                         | AI confidence score visible; Pro Max gets human expert; T&Cs make it clear we don't guarantee approval                                                                          |
| Scam shield (P6) false-positives a real agent                                             | Appeal process; only "warning" levels below "verified scam"; transparent criteria                                                                                               |
| Visa data is sensitive PII (passports, bank statements, biometrics)                       | Encryption at rest (Supabase + bucket policies), signed URLs with TTL, automatic purge 90 days post-completion, GDPR + India DPDP compliance, audit log of all access           |
| Regulatory variance per country (immigration is regulated practice in some jurisdictions) | We provide **information and tooling**, not legal advice. Partner with licensed practitioners (P6 marketplace) for jurisdictions that require it. Clear disclaimers per region. |
| AI hallucinating fees / requirements                                                      | Tavily-cited synthesis (current), confidence threshold below which we surface "verify with embassy"; human review of top-100 corridors quarterly                                |

---

## 10. How this maps to the current codebase

| Pillar                | Primary file/seam it plugs into                                           | New files needed                             |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| P1 Approval predictor | `src/lib/ai-gateway.server.ts`                                            | `src/lib/approval-predictor.server.ts`       |
| P2 Checklist          | `src/lib/personalized-roadmap-craft.server.ts`                            | `src/lib/checklist.functions.ts`             |
| P3 Slot radar         | `src/routes/api/public/hooks/`, `idempotency.server.ts`, `saga.server.ts` | `slot-radar.ts` hook + workers               |
| P4 Form copilot       | `ai-gateway.server.ts`, `storage.server.ts`                               | `src/lib/form-copilot.server.ts`             |
| P5 Document review    | `storage.server.ts`                                                       | `src/lib/document-review.functions.ts`       |
| P6 Scam shield        | `personalized-roadmap-research.server.ts` (Tavily)                        | `src/lib/scam-shield.functions.ts`           |
| P7 Financial-proof    | new `src/integrations/financial/`                                         | `src/lib/financial-proof.functions.ts`       |
| P8 Fee transparency   | none yet                                                                  | `src/lib/cost-engine.server.ts` + FX adapter |
| P9 Housing guarantee  | `saga.server.ts`                                                          | `src/integrations/housing/` adapters         |
| P10 Insurance         | `roadmap-export.server.ts` (cert gen)                                     | `src/integrations/insurance/`                |
| P11 Arrival kit       | `personalized.functions.ts`                                               | `src/lib/arrival-kit.functions.ts`           |
| P12 Status monitor    | `src/routes/api/public/hooks/`                                            | `status-poll.ts` hook                        |
| P13 Community         | new domain                                                                | `src/lib/community.functions.ts`             |

Every pillar reuses the seams we already invested in (AI gateway, storage abstraction, idempotency, saga, portability harness). **No pillar requires us to leave the current architecture.**

---

## 11. What we will explicitly NOT build

- ❌ **A law firm.** We don't give legal advice. We partner with licensed practitioners (P6) where regulation demands.
- ❌ **A university marketplace.** We don't compete with ApplyBoard / Yocket / Leverage Edu on "which uni should I apply to". We start _after_ the offer letter.
- ❌ **A generic travel booking site.** No flight search, no Booking.com clone. We do hotel/insurance/SIM only as needed for visa proof or arrival.
- ❌ **A test-prep company.** No IELTS / GRE / TOEFL prep. We integrate scores, we don't tutor.
- ❌ **An English-only product.** If we can't ship a pillar in at least 3 languages, we don't ship it.
- ❌ **A platform that hides fees.** Ever.
- ❌ **A growth-at-any-cost product.** Visa data is sensitive. We will say no to integrations that compromise privacy.

---

## 12. Appendix — competitor reference card

| Platform          | Category                          | Pricing                     | Reviews            | Funding         | Gap we attack                                  |
| ----------------- | --------------------------------- | --------------------------- | ------------------ | --------------- | ---------------------------------------------- |
| iVisa             | Visa B2C                          | govt + $20–90               | 4.3★ / 68k         | —               | Tourist only, no personalization, no post-visa |
| Atlys             | Visa B2C (India)                  | govt + service              | 4.6★ (Play)        | $37M            | Fee opacity allegations, India-corridor only   |
| VisaHQ            | Visa B2C/B2B                      | govt + service              | mixed              | —               | Outdated, slow, no AI                          |
| Sherpa°           | Visa data API                     | B2B enterprise              | —                  | —               | Zero consumer brand                            |
| VFS Global        | Outsourced visa centers           | govt + €5–€220 add-ons      | **1.6★ / 1334**    | —               | Hated, opaque, scalped slots                   |
| Leverage Edu      | Study abroad (India)              | freemium + counseling       | mixed              | ~$40M           | India-only, pushy sales                        |
| Yocket            | Study abroad (India)              | $150–$500 packages          | community-loved    | —               | Counselor bottleneck                           |
| ApplyBoard        | Study marketplace                 | univ commission             | —                  | $553M+          | No post-arrival                                |
| IDP Education     | Study + IELTS                     | univ commission             | —                  | ASX listed      | Traditional, slow to digitize                  |
| GradRight         | Loan marketplace                  | lender commission           | —                  | $6M             | India→US only                                  |
| Edvoy             | Study (UK/Ireland)                | commission                  | —                  | —               | Narrow corridor                                |
| Crimson Education | Elite admissions                  | $5k–$50k+                   | —                  | —               | Wealthy only                                   |
| Envoy Global      | Corporate immigration             | enterprise SaaS             | —                  | —               | B2B only                                       |
| Boundless         | US family visas                   | $750–$1500                  | —                  | —               | US-only, family-only                           |
| Localyze          | Corporate mobility (EU)           | per-employee SaaS           | —                  | —               | B2B only                                       |
| Deel Immigration  | Bundled with EOR                  | add-on to Deel              | —                  | unicorn         | Only if on Deel                                |
| SimpleCitizen     | US DIY green card                 | $529+                       | —                  | —               | US-only                                        |
| Expatrio          | Germany blocked acct + insurance  | €5/mo + insurance           | strong             | —               | Germany-only                                   |
| Fintiba           | Germany blocked acct              | €4.90/mo                    | strong             | DB-backed       | Germany-only                                   |
| Flywire           | International tuition payments    | FX spread                   | —                  | NASDAQ FLYW     | Transactional only                             |
| MPOWER            | US student loans (no co-signer)   | 12–14% APR + 5% origination | —                  | —               | High rate, US/CA only                          |
| Prodigy Finance   | Grad student loans                | SOFR + margin               | mixed              | $900M+          | Elite schools only, opaque rate                |
| Amber Student     | Student housing                   | free to student             | **4.8★ / 9406**    | —               | No visa-linkage                                |
| University Living | Student housing                   | free                        | 4.6★ / 1387        | —               | Smaller inventory                              |
| HousingAnywhere   | Mid/long-term rentals (EU)        | escrow + subs               | mixed              | —               | EU-centric                                     |
| SafetyWing        | Nomad insurance                   | $45–$99/mo                  | mixed              | —               | Slow claims, US-capped                         |
| World Nomads      | Adventure travel insurance        | per-trip $100–$200          | —                  | —               | Expensive per-trip                             |
| Casium            | AI corporate immigration          | enterprise                  | —                  | $5M (Oct '25)   | B2B only                                       |
| VISARUN.AI        | Visa-as-a-service (MENA)          | —                           | —                  | $700k (Feb '25) | B2B, MENA                                      |
| Visafy            | CRM for immigration consultants   | B2B SaaS                    | —                  | —               | B2B only                                       |
| JustiGuide        | AI for undocumented US immigrants | —                           | —                  | —               | US-only, narrow scope                          |
| Permito.ai        | US visa status tracker            | —                           | —                  | —               | US-only                                        |
| GetGIS            | AI-assisted consultancy           | consultancy fees            | claims 95% success | —               | Agent model, not platform                      |
| SPUN              | SE Asia AI visa                   | —                           | —                  | $1.8M (Jan '26) | Regional                                       |

---

## 13. Closing — what success looks like in 24 months

- **1 million** applicants have used at least one free pillar (checklist / fee calc / scam check)
- **100,000** Pro applications have gone through us end-to-end
- **5 corridors** with our own outcome dataset >5,000 cases → P1 predictor genuinely accurate
- **3 languages** beyond English shipped end-to-end (Hindi, Tagalog, Arabic baseline)
- **Trustpilot 4.7★+** — the anti-VFS
- **Profitable on Pro tier alone**, with B2B and affiliate as upside
- **One headline** — "The platform that finally killed visa scams in [country X]"

If we ship the 13 pillars with the trust guardrails in section 9, none of the 40+ competitors we benchmarked can match us on the full stack. That's the bet.

---

_This document is the source of truth. Sprint plans live in `.lovable/plan.md` and reference pillar IDs (P1–P13) from this file._
