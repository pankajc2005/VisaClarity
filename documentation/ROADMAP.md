# VisaClarity — Master Roadmap, Vision & Execution Plan

> **One trusted home for the entire visa + relocation journey — from "can I even get this visa?" to "I've landed, here's my SIM, bank, room, and registration."**

This is the **single source of truth** for where VisaClarity is going, why, and how we get there. It merges the long-term vision, market research, product pillars, technical architecture, business model, and a quarter-by-quarter execution plan into one document anyone on the team — engineer, designer, partner, investor, or new hire — can read end-to-end and understand the entire game.

Companion docs (kept for depth, not required reading):

- `VISION.md` — original north-star (this doc supersedes it for planning)
- `PORTABILITY.md` — how the stack stays platform-independent
- `STUDENT_PACK.md` — credits and tools fuelling the build
- `MIGRATION.md` — escape hatches
- `.lovable/plan.md` — current sprint only

---

## Table of Contents

1. [The Mission in One Page](#1-the-mission-in-one-page)
2. [Who We Serve — The Three Humans](#2-who-we-serve)
3. [The 14 Pains We Are Killing](#3-the-14-pains)
4. [Market Landscape — 40+ Competitors, Where They Fail](#4-market-landscape)
5. [Our Unfair Advantages (The Moat)](#5-moat)
6. [The 13 Product Pillars (What We Build)](#6-pillars)
7. [How Each Pillar Maps to Our Codebase](#7-code-mapping)
8. [The 24-Month Roadmap (4 Horizons, Quarter by Quarter)](#8-roadmap)
9. [Geographic Rollout — Which Corridors, In What Order](#9-corridors)
10. [Business Model & Pricing](#10-business-model)
11. [Trust, Ethics & Guardrails](#11-trust)
12. [Success Metrics (What "Won" Looks Like)](#12-metrics)
13. [Risks & Mitigations](#13-risks)
14. [Team, Hiring & Org Shape](#14-team)
15. [Capital Plan](#15-capital)
16. [What We Will NOT Build](#16-non-goals)
17. [The First 90 Days — Concrete Checklist](#17-first-90-days)

---

<a id="1-the-mission-in-one-page"></a>

## 1. The Mission in One Page

**Problem.** Every year ~300 million people apply for a visa. Most do it in fear: confusing forms, scarce embassy slots, hidden fees, scam agents, silent rejections, and zero help once they land. The Global South pays the highest price — an Indian parent visiting their child in Germany routinely pays an agent ₹30,000 for a process that should cost ₹8,000 and could be free with the right software.

**Mission.** Make crossing a border feel as simple, transparent and trustworthy as booking a flight on MakeMyTrip or sending money on Wise — for anyone, in any language, on any phone.

**Wedge.** AI-personalized roadmaps. We ask 8 questions (nationality, destination, purpose, profile, dates, budget, dependents, special needs) and produce a step-by-step, document-by-document, cost-itemized, embassy-slot-aware, scam-proof plan — with citations. No human agent can match the speed; no static checklist can match the personalization.

**Endgame.** Become the default rail for the entire journey: research → apply → finance → fly → land → settle. One login, one wallet, one document vault, one human on WhatsApp if you panic.

**Why now.**

1. LLMs finally make true personalization cheap (Gemini 2.5 Flash ≈ $0.075 / 1M input tokens — a full roadmap costs us < $0.01).
2. Embassies are moving online (UK ETA, EU ETIAS in 2026, India e-Visa, US DS-160) — APIs and scrapeable surfaces are exploding.
3. Global migration is at an all-time high (281M international migrants per UN DESA 2024) and rising.
4. Trust in traditional agents is collapsing — Reddit and Trustpilot are full of horror stories.
5. WhatsApp Business API + UPI/local-rail payments make distribution in the Global South near-free.

---

<a id="2-who-we-serve"></a>

## 2. Who We Serve — The Three Humans

We design every screen, message, and price point against these three personas. If a feature doesn't help at least one of them, we don't build it.

### Persona A — "Aunty Sushma," the first-timer

- 54, lives in Lucknow, wants to visit her son in Toronto.
- Speaks Hindi, reads basic English, uses WhatsApp daily, has never filled an online form alone.
- Today: pays a local agent ₹35,000, hands over her passport, prays.
- What she needs: voice + Hindi, a human-feeling chat, photos of "what your bank statement should look like," reassurance that "people like you got this visa last month."

### Persona B — "Arjun," the experienced repeat traveller

- 31, product manager, 14 Schengen entries, hates VFS upsells and re-typing the same form.
- Today: power-uses Atlys for Schengen, manually does the rest.
- What he needs: document vault, auto-fill, embassy slot radar, true all-in cost (visa + VFS + courier + photo + premium-lounge).

### Persona C — "Priya & Rohan," the relocators

- Engaged couple, both 26, Priya admitted to TUM Munich, Rohan job-hunting on EU Blue Card.
- Need: student visa + blocked account + health insurance + university registration + housing + Anmeldung + bank account + tax ID + spouse visa pathway.
- Today: juggle 7 vendors (Expatrio, Fintiba, Amber, IamExpat, etc.) over 6 months.
- What they need: one timeline, one wallet, one assistant that knows their full case.

---

<a id="3-the-14-pains"></a>

## 3. The 14 Pains We Are Killing

| #   | Pain                                                           | Severity | Who feels it most |
| --- | -------------------------------------------------------------- | -------- | ----------------- |
| 1   | "I don't know which documents I actually need"                 | Critical | A, C              |
| 2   | Embassy/VFS slots vanish in seconds                            | Critical | B, C              |
| 3   | Hidden fees (VFS premium, courier, SMS, photo)                 | High     | All               |
| 4   | Scam agents and fake portals                                   | Critical | A                 |
| 5   | Financial-proof anxiety (blocked accounts, sponsor affidavits) | High     | C                 |
| 6   | Generic checklists that ignore my nationality + profile        | High     | All               |
| 7   | English-only interfaces                                        | Critical | A                 |
| 8   | Post-submission black hole ("is my visa moving?")              | High     | All               |
| 9   | Silent rejections with no explanation                          | Critical | A, C              |
| 10  | Post-arrival void (SIM, bank, registration, transport)         | High     | C                 |
| 11  | Fake housing listings, lost deposits                           | Critical | C                 |
| 12  | Insurance illiteracy (Schengen min €30k cover, etc.)           | Medium   | All               |
| 13  | Education-loan opacity (Prodigy vs MPOWER vs local bank)       | High     | C                 |
| 14  | Emotional toll — no one to talk to during a 6-week wait        | High     | All               |

Each pillar in §6 is tagged with the pain numbers it kills.

---

<a id="4-market-landscape"></a>

## 4. Market Landscape — 40+ Competitors, Where They Fail

We benchmarked the entire space. Headline insight: **no one owns the full vertical stack for the Global-South consumer.** Players are either B2B-only, single-product, or geography-locked.

### 4.1 The seven categories and the gap each leaves open

| Category                         | Notable players                                                         | What they nail                          | What they miss (our wedge)                                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Consumer visa apps**           | iVisa, Atlys, VisaHQ, Sherpa (B2B), VFS Global                          | Atlys: slick UX for Schengen            | No personalization beyond destination; opaque markups; no post-arrival; English-only         |
| **Study abroad**                 | Leverage Edu, Yocket, ApplyBoard, IDP, GradRight, Edvoy, Crimson        | University matching, counsellor network | Heavy human-agent model; commissions distort advice; weak on visa specifics; no post-arrival |
| **Corporate relocation**         | Envoy, Boundless, Localyze, Deel Immigration, SimpleCitizen             | Enterprise compliance                   | B2B only; $$$; US-centric; ignores consumer                                                  |
| **Financial / blocked accounts** | Expatrio, Fintiba, Flywire, MPOWER, Prodigy                             | Single transaction done well            | Germany-only for blocked; loan products opaque; no roadmap context                           |
| **Housing**                      | Amber Student, University Living, HousingAnywhere, Uniplaces, Spotahome | Inventory aggregation                   | No visa linkage; deposit risk; fake listings persist                                         |
| **Insurance**                    | SafetyWing, World Nomads, Tata AIG, ACKO                                | Decent products                         | Discovery is a nightmare; Schengen compliance unclear; no auto-certificate to embassy        |
| **AI-native entrants**           | Casium (B2B), VISARUN.AI, Visafy, JustiGuide, Permito, GetGIS, SPUN     | Modern UX                               | All early-stage, narrow scope; none full-stack consumer                                      |

### 4.2 The white-space matrix

|                          | Personalized AI roadmap | Slot radar | Document review | Financial proof | Housing | Insurance | Arrival kit | WhatsApp + local lang |
| ------------------------ | :---------------------: | :--------: | :-------------: | :-------------: | :-----: | :-------: | :---------: | :-------------------: |
| iVisa / Atlys            |         partial         |  partial   |        –        |        –        |    –    |     –     |      –      |           –           |
| VFS Global               |            –            |     –      |        –        |        –        |    –    |     –     |      –      |           –           |
| Yocket / Leverage        |         partial         |     –      |        –        |     partial     | partial |     –     |   partial   |           –           |
| Boundless / Envoy        |            –            |     –      |        –        |        –        |    –    |     –     |      –      |           –           |
| Expatrio                 |            –            |     –      |        –        |        –        |    –    |  partial  |   partial   |           –           |
| Amber Student            |            –            |     –      |        –        |        –        |    –    |     –     |      –      |           –           |
| **VisaClarity (target)** |         **yes**         |  **yes**   |     **yes**     |     **yes**     | **yes** |  **yes**  |   **yes**   |        **yes**        |

Nobody fills every column. We will.

---

<a id="5-moat"></a>

## 5. Our Unfair Advantages (The Moat)

1. **AI-first personalization with citations.** Every recommendation is sourced via Tavily and rendered with a "why we said this" link. Competitors either guess or copy-paste embassy pages.
2. **Outcome data flywheel.** Every approved/rejected case (opt-in) silently trains the "Will I Get It?" predictor. After 10,000 cases per corridor we have a moat no static checklist can touch.
3. **Radical fee transparency.** We publish embassy fee + VFS fee + our fee + courier + photo as four separate line items. VFS's biggest revenue source — confusion — disappears.
4. **WhatsApp-native distribution.** 2B users, near-zero CAC in India/SEA/LATAM/Africa, voice notes in local language. Atlys is app-only; agents are person-only; we are everywhere.
5. **Portable architecture.** `PORTABILITY.md` + `storage.server.ts` + `ai-gateway.server.ts` + `saga.server.ts` let us swap cloud, AI provider, or storage in days, not quarters. We will outlast any single-vendor outage or price hike.
6. **Trust collateral.** Open-source the roadmap engine spec, publish monthly approval-rate transparency reports, partner with consulates for verified info — turn a low-trust category into a high-trust brand.

---

<a id="6-pillars"></a>

## 6. The 13 Product Pillars (What We Build)

Each pillar = a product surface with a single owner, a single metric, and a clear competitor it beats.

### P1 — "Will I Get It?" Approval Predictor _(kills pains 6, 9)_

Pre-application probability score (0–100) + the 3 specific fixes that move it up the most ("add 6 more months of bank history," "book a return flight beyond visa validity"). Trained initially on public embassy refusal stats + Reddit case threads; long-term on our own opt-in outcome data. Beats: every competitor (nobody offers this).

### P2 — Dynamic, Hyper-Personalized Document Checklist _(kills pains 1, 6)_

Nationality × destination × purpose × profile × dates → live-updated checklist with sample images, photo specs (35×45mm white background, etc.), and "common mistakes." Already prototyped via `personalized-roadmap-craft.server.ts`. Beats: iVisa, VFS.

### P3 — Embassy / VFS Slot Radar + Opt-in Auto-Book _(kills pain 2)_

Headless watchers on VFS, TLScontact, BLS, embassy portals. Push + WhatsApp alert in < 30 s of a slot opening. Opt-in auto-book for Pro Max (with ethical guardrails — see §11). Most-viral feature; Schengen first. Beats: Atlys (their slot finder is the best in market today and we will out-execute it).

### P4 — Conversational AI Form-Filling Copilot _(kills pains 1, 7, 14)_

WhatsApp + web chat, voice input in Hindi/Spanish/Arabic/Filipino, fills DS-160 / VAF / Schengen / India e-Visa fields by interview. Auto-saves progress, resumes any time. Beats: every form on every embassy site.

### P5 — Rejection-Proof Document Review _(kills pains 1, 9)_

"Document health score." AI flags issues (bank statement gap, photo background wrong, sponsor letter missing notary). Pro Max adds a human-reviewer SLA (24 h). Beats: agents who charge ₹5k for the same review.

### P6 — Scam Shield + Verified-Agent Marketplace _(kills pain 4)_

Real-time URL/phishing checker, agent-verification badges with escrow-backed bookings, community-reported scam database. Beats: a complete category gap.

### P7 — Integrated Financial-Proof Builder _(kills pains 5, 13)_

Blocked-account onboarding beyond Germany (Coracle, Expatrio competitor for FR/NL/IE), sponsor affidavit generator (US I-134, UK Appendix FM), education-loan reverse-auction (Prodigy vs MPOWER vs Avanse vs HDFC). Beats: Expatrio's narrow Germany focus.

### P8 — All-In Fee + FX Transparency Layer _(kills pain 3)_

Live, itemized total cost in local currency: embassy fee, service-centre fee, our fee, courier, photo, translation, apostille, FX spread. Compare paying in INR vs EUR vs USD. Beats: VFS opacity.

### P9 — Visa-Linked Housing Guarantee _(kills pains 10, 11)_

Partner inventory from Amber / University Living / HousingAnywhere with a **refundable hold** that converts to a real booking on visa approval — and full refund on rejection. Verified-listing badge to kill the scam problem. Beats: standalone housing portals (no visa awareness) and direct embassy housing pages (no booking).

### P10 — Smart Insurance Recommender + Auto-Certificate _(kills pain 12)_

One-click Schengen-compliant (€30k, all-EU, full-stay) insurance with the certificate delivered as a PDF in 60 s, ready to upload to VFS. Long-term partnerships with SafetyWing, ACKO, Tata AIG. Beats: insurance discovery chaos.

### P11 — "Day 1 Arrival Kit" _(kills pain 10)_

WhatsApp drip campaign 7 days before departure: eSIM (Airalo affiliate), bank account pre-application (N26, Wise, Monzo), city-registration walkthrough (Anmeldung, residence permit appointment), public-transport setup, emergency contacts, "what to do if your luggage is lost." Beats: nothing exists today.

### P12 — Status-AI Monitor _(kills pain 8)_

Watch CEAC / USCIS / VFS tracking, parse cryptic status codes into plain language with an ETA based on historical data ("Administrative Processing — typically 11–22 days for Indian applicants from Mumbai consulate"). Beats: every embassy tracker.

### P13 — Peer Community + Mental Wellness _(kills pain 14)_

"Someone like me" matching — anonymized profiles of recent applicants on the same corridor. Moderated Q&A, success/failure stories, optional licensed-counsellor chat for high-stress cases (immigration anxiety is real and clinically documented). Beats: Reddit (unmoderated, no context).

---

<a id="7-code-mapping"></a>

## 7. How Each Pillar Maps to Our Codebase

| Pillar              | Primary file(s)                                                                                   | What we extend                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| P1 Predictor        | `src/lib/ai-gateway.server.ts`, new `prediction.server.ts`                                        | New table `case_outcomes`, batch trainer, server fn `scoreApplication` |
| P2 Checklist        | `src/lib/personalized-roadmap-craft.server.ts`, `src/lib/personalized-roadmap-research.server.ts` | Already shipping — add per-document sub-prompts                        |
| P3 Slot radar       | `src/lib/saga.server.ts`, `src/lib/idempotency.server.ts`, new `scrapers/*.server.ts`             | Cron via pg_cron → `/api/public/hooks/slot-check`, fan-out to WhatsApp |
| P4 Copilot          | New `src/lib/copilot.server.ts` + WhatsApp Business webhook at `/api/public/hooks/whatsapp`       | Gemini 2.5 Flash sessions keyed by phone                               |
| P5 Doc review       | New `src/lib/doc-review.server.ts`, `src/lib/storage.server.ts` for uploads                       | Vision model via `ai-gateway.server.ts` (Gemini multimodal)            |
| P6 Scam shield      | New `src/routes/api/public/scam-check.ts`                                                         | URL reputation API + community DB                                      |
| P7 Financial proof  | New `src/lib/finance.server.ts`, partner integrations                                             | Affidavit PDF gen via existing `roadmap-export.server.ts` pattern      |
| P8 Fee transparency | Extend `personalized-roadmap-craft.server.ts` output schema                                       | Add `cost_breakdown` JSONB column                                      |
| P9 Housing          | New `src/routes/housing.tsx` + partner APIs                                                       | Hold/refund saga via `saga.server.ts`                                  |
| P10 Insurance       | New `src/lib/insurance.server.ts`                                                                 | Quote → bind → PDF certificate                                         |
| P11 Arrival kit     | WhatsApp drip via `/api/public/hooks/arrival-kit`                                                 | Scheduled by pg_cron, idempotent via `idempotency.server.ts`           |
| P12 Status monitor  | New scrapers + `notifications.server.ts`                                                          | Daily check, NLP normalisation                                         |
| P13 Community       | New `src/routes/community.*` + Supabase realtime                                                  | RLS-scoped peer matching                                               |

Every pillar slots into existing seams. We are not rewriting — we are extending the personalized-roadmap engine outward.

---

<a id="8-roadmap"></a>

## 8. The 24-Month Roadmap (4 Horizons, Quarter by Quarter)

Dates are indicative; the order is firm.

### Horizon 1 — NOW (Q2 2026, next 90 days) — _"Nail the wedge"_

- Ship P2 Document Checklist generator to GA (already in flight via personalized roadmap)
- Ship P8 Fee Transparency layer inside every generated roadmap
- WhatsApp delivery channel for completed roadmaps (Twilio or WhatsApp Cloud API)
- Launch v1 in 1 corridor: **India → Germany (student)** — highest pain, highest willingness to pay
- Trustpilot + Product Hunt launch with 100 free Pro accounts to seed reviews

### Horizon 2 — NEXT (Q3–Q4 2026) — _"Become the daily tool"_

- P3 Slot Radar (Schengen first: France, Germany, Netherlands VFS endpoints)
- P5 Document Review (AI tier free, human tier $29 per case)
- P6 Scam Shield (URL checker + first 50 verified agents)
- P7 Financial Proof — extend blocked account to France & Netherlands
- Add 2 corridors: **India → UK (student)**, **India → Schengen (tourist)**
- Hire: 1 immigration-policy analyst, 1 community manager, 1 Schengen-specialist engineer

### Horizon 3 — LATER (Q1–Q2 2027) — _"Own the whole journey"_

- P9 Housing Guarantee (partner: Amber Student first; expand to 3 more)
- P11 Arrival Kit (eSIM + bank + Anmeldung drip)
- P12 Status Monitor (CEAC, UKVI, IRCC, VFS)
- P10 Insurance Marketplace (SafetyWing + Tata AIG first)
- Add 3 corridors: **Philippines → Canada (worker)**, **Nigeria → UK (student)**, **Mexico → US (tourist)**
- Hire: head of partnerships, 2 country leads, design lead

### Horizon 4 — LONG (Q3 2027 – Q2 2028) — _"Defensible category leader"_

- P1 Approval Predictor v2 trained on 10k+ real outcomes per corridor
- P4 Voice copilot in Hindi, Spanish, Tagalog, Arabic
- P13 Peer Community + wellness layer
- B2B API tier: universities, agents, employers (Sherpa-style) — recurring revenue without consumer CAC
- 5+ corridors live, 1M+ free users, 100k+ Pro applications
- Series A (~$15M) for global expansion, regulatory licensing, and an EU office

---

<a id="9-corridors"></a>

## 9. Geographic Rollout — Which Corridors, In What Order

We sequence by `pain × willingness-to-pay × competition-gap × regulatory-tractability`.

| Order | Corridor                  | Why now                                                                              | Anchor pillar  |
| ----- | ------------------------- | ------------------------------------------------------------------------------------ | -------------- |
| 1     | IN → DE student           | Highest volume, blocked account is universally hated, Germany e-portal is scrapeable | P2 + P7        |
| 2     | IN → UK student           | UKVI fee is opaque, ETA launching, student migration up                              | P2 + P8        |
| 3     | IN → Schengen tourist     | Slot scarcity is a daily news story                                                  | P3             |
| 4     | PH → CA worker            | OFW market huge, English literacy high, IRCC slot pain                               | P3 + P11       |
| 5     | NG → UK student           | Largest sub-Saharan corridor, English-speaking, mobile-money ready                   | P2 + P9        |
| 6     | MX → US tourist (B1/B2)   | Wait times > 400 days in some consulates — P12 has massive pull                      | P12            |
| 7     | IN → US H-1B family (H-4) | Premium-pricing tolerance, document complexity                                       | P5 + P7        |
| 8     | VN → JP student           | Underserved by English-only competitors                                              | P2 in Japanese |

Each corridor requires a "playbook": authoritative docs, slot endpoints, fee schedule, partner shortlist, sample success/refusal letters, local-language glossary. We will publish playbooks as living documents.

---

<a id="10-business-model"></a>

## 10. Business Model & Pricing

| Tier        | Price (USD)                        | What you get                                                                                                   | Target persona               |
| ----------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Free**    | $0                                 | Research, generic checklist, fee transparency, scam shield                                                     | All — funnel + trust         |
| **Pro**     | $15–25 per application             | Personalized roadmap, document review (AI), status monitor, WhatsApp delivery                                  | A, B                         |
| **Pro Max** | $99–199 per application            | Slot radar + opt-in auto-book, human document review (24 h SLA), housing hold, priority WhatsApp human support | C, anxious A, premium B      |
| **B2B API** | $0.50–2 per call + monthly minimum | Sherpa-style API for universities, agents, employers, fintechs                                                 | Universities, edtechs, banks |

**Unit economics target (steady state, Pro tier):**

- Revenue per application: $20
- AI cost (Gemini Flash + Tavily): ~$0.05
- Payment + WhatsApp + infra: ~$0.40
- Support amortized: ~$0.50
- **Gross margin: ~95%**

We are deliberately not commission-funded by partners — commissions corrupt advice (see Yocket / Leverage critiques). Partner revenue is flat affiliate or none.

---

<a id="11-trust"></a>

## 11. Trust, Ethics & Guardrails

Trust is the entire moat. These are non-negotiable.

- **Never guarantee approval.** P1 outputs probabilities and confidence intervals, never promises.
- **Opt-in auto-booking only.** P3 slot auto-book requires explicit per-application consent + a circuit breaker (max 3 attempts per slot, never compete with applicant's own session).
- **Human-in-loop on P5 high-stakes reviews.** AI flags, human confirms before a rejection-risk verdict is shown.
- **Citations on every claim.** Tavily-sourced URLs rendered inline. If we can't source it, we don't claim it.
- **PII encryption at rest, regional data residency.** Visa data is some of the most sensitive PII (passport, financials, biometrics). EU data stays in EU; Indian data stays in India once we cross the DPDPA threshold.
- **No dark patterns in pricing.** Fee transparency applies to ourselves first — Pro/Pro Max prices shown before any work begins, no surprise upsell after the form is filled.
- **Scam shield false positives.** Verified-agent appeals process within 48h; never permanently brand someone a scammer without review.
- **Monthly transparency report.** Approval rates per corridor, average savings vs agents, complaints logged + resolved.

---

<a id="12-metrics"></a>

## 12. Success Metrics (What "Won" Looks Like)

**12-month milestones (end of Q1 2027):**

- 250k free users, 25k Pro applications shipped
- 3 corridors live with > 1,000 applications each
- Trustpilot 4.6★ on ≥ 500 reviews
- AI cost per roadmap < $0.05
- WhatsApp DAU / MAU > 30%
- Pro gross margin > 90%

**24-month milestones (end of Q2 2028):**

- 1M+ free users, 100k+ Pro applications
- 5+ corridors with > 5,000 cases each, of which 3 in languages beyond English
- Trustpilot 4.7★ on ≥ 5,000 reviews, Net Promoter Score > 60
- Profitable on Pro tier alone (no B2B or partner revenue required)
- Approval predictor accuracy > 80% AUC on top-3 corridors
- Featured by at least 2 national news outlets in India + 1 in EU as the trusted alternative to agents

---

<a id="13-risks"></a>

## 13. Risks & Mitigations

| Risk                                                       | Likelihood |  Impact  | Mitigation                                                                                                      |
| ---------------------------------------------------------- | :--------: | :------: | --------------------------------------------------------------------------------------------------------------- |
| VFS / embassy adds anti-bot to slot endpoints              |    High    |   High   | Diversify scrapers, partner where possible, fall back to push-alerts (still better than nothing)                |
| Regulatory pushback (we're "providing immigration advice") |   Medium   |   High   | Carefully scoped disclaimers, registered immigration partners per jurisdiction, never give bespoke legal advice |
| LLM hallucination on critical doc                          |   Medium   | Critical | Citations mandatory, human review for P5 paid tier, monthly hallucination audit                                 |
| Single AI vendor price hike or outage                      |   Medium   |  Medium  | `ai-gateway.server.ts` already supports multi-provider — Azure OpenAI as failover (see `STUDENT_PACK.md`)       |
| Cloud / DB lock-in                                         |    Low     |   High   | `PORTABILITY.md` + `storage.server.ts` mean we can move in days                                                 |
| Negative outcome blamed on us                              |    High    |  Medium  | Probabilistic UI, never-guarantee policy, refunds on Pro Max if SLA breached                                    |
| Scam-shield false positive damages innocent agent          |   Medium   |  Medium  | Appeals SLA 48h, public methodology                                                                             |
| Acquisition by an incumbent (VFS, IDP) at low valuation    |   Medium   |   Low    | Open-source roadmap engine + community moat make hostile cheap-buy unattractive                                 |

---

<a id="14-team"></a>

## 14. Team, Hiring & Org Shape

**Today (Q2 2026):** founding team — keep lean, ship pillar by pillar.

**End of Year 1 (12 people):**

- 4 engineers (1 AI/ML, 2 full-stack, 1 scraper/infra)
- 1 designer
- 1 immigration-policy analyst (ex-consulate or ex-Boundless)
- 1 community/WhatsApp ops lead
- 1 partnerships lead (housing, finance, insurance)
- 1 country lead (India)
- 1 founder/CEO + 1 founder/CTO + 1 founder/CPO

**End of Year 2 (~30 people):** add country leads for PH, NG, MX; head of trust & safety; finance/legal; 2 more AI engineers; growth lead.

Culture rules: write decisions down (this doc is the template), every PM/eng pair owns a pillar end-to-end, weekly "applicant call" — every team member talks to a real user.

---

<a id="15-capital"></a>

## 15. Capital Plan

- **Bootstrapped + GitHub Student Pack credits today** — runway is months, not years. See `STUDENT_PACK.md` for the full credit map (DigitalOcean $200, Azure OpenAI $100, Namecheap domain, Sentry, Doppler, etc.).
- **Pre-seed (~$500k, Q4 2026)** after Horizon 1 metrics: 250k users, $20k MRR proof. Use of funds: 2 hires, 6 months runway, WhatsApp Business API at scale, paid acquisition in 1 corridor.
- **Seed (~$3M, Q3 2027)** after Horizon 2 metrics: 3 corridors profitable on contribution margin. Use of funds: team to 12, build P9–P12, regulatory compliance.
- **Series A (~$15M, Q2 2028)** at category-leader metrics. Use of funds: 5 new corridors, EU office, B2B sales motion.

We will not raise sooner than the metrics justify — fundraising distracts and dilutes. Every dollar of revenue we earn before pre-seed compounds founder ownership.

---

<a id="16-non-goals"></a>

## 16. What We Will NOT Build

Explicit non-goals keep us focused.

- **Not a law firm.** We surface licensed immigration partners; we do not give bespoke legal advice.
- **Not a university marketplace like ApplyBoard.** Commission-driven advice corrupts trust.
- **Not a generic travel-booking site.** No flight inventory, no hotel inventory beyond visa-linked housing.
- **Not a test-prep brand.** No IELTS/TOEFL courses (we partner if needed).
- **Not English-only.** Hindi, Spanish, Tagalog, Arabic are first-class by Horizon 4.
- **Not commission-funded.** Affiliate at flat rates, disclosed; partners cannot pay for ranking.
- **Not growth-at-any-cost.** No viral hacks that erode trust (e.g. spam invites).
- **Not yet a B2C immigration platform for permanent migration** (PR, citizenship) — that's a Horizon 4+ decision after we own short-term visa.

---

<a id="17-first-90-days"></a>

## 17. The First 90 Days — Concrete Checklist

Pick this up tomorrow.

### Engineering

- [ ] Add `cost_breakdown` JSONB to personalized-roadmap output (P8)
- [ ] Wire WhatsApp Cloud API webhook at `/api/public/hooks/whatsapp` (P11, P4 foundation)
- [ ] Add `case_outcomes` table (anonymous, opt-in) — foundation for P1
- [ ] Migrate sample-image upload to `storage.server.ts` (P5 foundation)
- [ ] Wire Sentry (GitHub Student Pack) into `src/components/GlobalErrorListener.tsx`
- [ ] Run `scripts/portability-check.ts` in CI to keep `PORTABILITY.md` honest

### Product

- [ ] Publish the IN → DE student playbook (docs, fees, slot endpoints, partners)
- [ ] Ship the 100-free-Pro Product Hunt + Trustpilot seed campaign
- [ ] Record 10 founder-led WhatsApp calls with real applicants — write notes back into this doc

### Partnerships

- [ ] Email Amber Student, University Living re: visa-linked housing pilot (P9)
- [ ] Email SafetyWing + Tata AIG re: Schengen insurance API (P10)
- [ ] Apply to WhatsApp Business API (lead time ~2 weeks)

### Trust

- [ ] Publish the first monthly transparency report template (even if N=0)
- [ ] Draft DPDPA + GDPR data-handling note (live by Pro launch)
- [ ] Stand up `legal.visaclarity.app` with disclaimers + complaints address

### Vision hygiene

- [ ] Re-read this doc on the first Monday of every month with the team
- [ ] Update §8 if a horizon slips by > 2 weeks
- [ ] Add a "Lessons" section at the bottom each quarter — what we got wrong, what surprised us

---

## Closing

Crossing a border should not require fear, an agent, or a bank loan to pay the agent. It should require a phone, a passport, and a trustworthy assistant. That's the company. Everything in this document — every pillar, every corridor, every metric — points at that single sentence.

If a future decision doesn't make crossing a border simpler, cheaper, safer, or more humane for Aunty Sushma, Arjun, or Priya & Rohan — it's the wrong decision.

Let's build it.
