# SLOT_AND_DOCS_PLAN.md

> Fixing the 4 acute visa pains — without faking it.
>
> This plan is the source of truth for the next four features VisaClarity will ship under our existing vision ("From dream to doorstep" · "Trust Layer for Global Mobility"). Every decision below is filtered through one question: **does this make the user trust us more next time, even if this application fails?** If the answer is no, we don't build it.

---

## 1. The 4 Pains — In the User's Own Voice

We keep these in Hinglish on purpose. The team must never forget who we are building for.

1. **"Searching for available embassy slots"**
   _Problem: VFS website manually check karte raho. Slots seconds mein full ho jaate hain. Log 4 AM pe alarm lagate hain._

2. **"Studying additional requirements"**
   _Problem: Embassy website pe jaao, legalese padho, 40 pages padho sirf ye jaanne ke liye ki tumhe exactly kya chahiye._

3. **"Preparing certificates and proofs"**
   _Problem: Kaunsa certificate kaisi format mein chahiye, apostille chahiye ya nahi, translation chahiye ya nahi — ye sab scattered information hai._

4. **"Rushing to fix missing documents"**
   _Problem: Appointment ke din pata chala koi document miss hai. Sab kuch last minute._

These four pains describe **90% of the emotional weight** of a visa application. Solve them well and we own the category.

---

## 2. Why Existing Solutions Fail

| Existing option                      | Why it fails the user                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| **VFS / embassy portals**            | No notifications, no plain English, no personalization, no memory of your case |
| **Visa agents (₹15k–₹50k)**          | Opaque, slow, often wrong, no audit trail, you still do the work               |
| **Telegram slot-bot groups**         | Spammy, unreliable, often scams, violate VFS ToS, no accountability            |
| **Quora / YouTube checklists**       | Outdated within months, not personalized, no one to ask                        |
| **Generic "AI visa" tools**          | Pure LLM guesswork, no live data, no human review, hallucinated requirements   |
| **University international offices** | Helpful but only for students, only for 1–2 destinations, overloaded           |

The white space is obvious: **a neutral, AI-native, human-verified, end-to-end companion** that treats the user as an adult and tells the truth.

---

## 3. The 4 Features We Will Build

For each feature: **what · how it actually works · free vs paid · honesty rating · vision fit**.

---

### Feature A — Slot Radar (fixes Pain 1)

**What it does**
Watches VFS / BLS / TLScontact / direct embassy portals for the user's exact city + visa type. Pushes WhatsApp + email + browser push the second a slot opens. Deep-links the user straight to the booking page.

**How it actually works (no magic)**

- Polling worker (every 60–120s per watch) on a queue, respecting each portal's rate limits and robots.txt
- Per-corridor scrapers, starting with **IN→DE, IN→UK, IN→Schengen** — the three highest-pain corridors
- Diff detection: we only fire a notification when the slot inventory changes
- **We do NOT auto-book.** Auto-booking violates VFS ToS, gets user accounts permanently banned, and is the #1 way "visa tech" startups burn their users. We will be the company that didn't.
- Honest in-product disclaimer: _"We notify in under 30 seconds. You book. We can't guarantee you'll be fast enough — but you'll be faster than 99% of people refreshing manually."_
- Slot counts surfaced directly inside the personalized roadmap with a one-tap **"Watch this slot"** toggle so the radar grows from the surface users already trust.

**Free vs Paid**
| Tier | What you get |
|---|---|
| Free | 1 active watch · 24h delayed notification · email only |
| Pro (₹499/mo · $9) | Unlimited watches · instant WhatsApp + push · multi-city · multi-date-range |
| Pro Max (₹1,499/mo · $29) | Above + **concierge alert** — a human verifies the slot is real (not a stale JS render) before notifying. Cuts false positives by ~80%. |

**Honesty rating: REAL.**
The pattern is proven (airline fare alerts, sneaker drops, concert tickets). The tech is boring. The value is the discipline of running it reliably and ethically.

**Vision fit**
Pillar 3 of `ROADMAP.md` (slot-radar). Directly attacks the #1 emotional pain — the 4 AM alarm.

**Marketing one-liner**

> "Stop setting 4 AM alarms. We watch VFS so you don't have to."

---

### Feature B — Plain-English Requirement Decoder (fixes Pain 2)

**What it does**
Pick your route (nationality → destination → purpose) and get a **1-page personalized requirement summary in your language** (Hindi, Tamil, Bengali, Tagalog, Arabic to start). Side-by-side with the original embassy text, so you can verify nothing was lost in translation.

**How it actually works (no magic)**

- Extends our existing `personalized-roadmap-craft.server.ts` + Tavily research pipeline with a "decoder" mode
- Ingests the actual embassy PDF / HTML, structures it, then explains it
- **Human review queue** for the top 20 corridors — a real immigration researcher signs off monthly. Output carries a **"Verified by [name], [date]"** badge. This is our trust differential.
- **Re-verification cron every 14 days.** Embassy rules change quietly — this is the #1 reason agents are wrong and Quora answers are out of date.
- "What changed since last month" diff view, so returning users see updates instantly.

**Free vs Paid**
| Tier | What you get |
|---|---|
| Free | 3 decodes/month · English only |
| Pro | Unlimited decodes · 5 languages · side-by-side original-vs-plain-English · monthly diff |
| Pro Max | Above + priority on the human-verification queue for your corridor |

**Honesty rating: REAL.**
100% based on scraping real, official, public information from the web, then synthesized with a reasoning LLM. We layer the human-verified badge on top to make it trustworthy at scale.

**Vision fit**
Pillars 1 + 2 (personalized roadmap, plain language). Kills the 40-page PDF pain.

**Marketing one-liner**

> "Your visa requirements, in your language, on one page."

---

### Feature C — Document Studio (fixes Pain 3)

**What it does**
For every document on your checklist we tell you, in one place: **exact format, who issues it, apostille required Y/N, translation required Y/N + which translators are accepted, how long it takes, how much it costs, and a working sample.** Plus an upload-to-check pre-flight on every file.

**How it actually works (no magic)**

- A curated database of ~40 document types × ~20 destinations = ~800 cells. Built and maintained by the same researchers who power Feature B.
- **Document health check** — upload a PDF or photo, we OCR + run rule checks (expiry date, page count, photo background, apostille stamp visible, signature present, MRZ readable on passport). We explicitly say: _"This catches the top 12 reasons documents get rejected. It does not guarantee approval."_
- **Partner referrals** — vetted apostille services and sworn translators. Affiliate fee disclosed transparently on every link. User always sees the non-partner option too.

**Free vs Paid**
| Tier | What you get |
|---|---|
| Free | View checklist with format rules + sample previews |
| Pro | Unlimited health checks · partner discounts · "explain this rejection" tool |
| Pro Max | One **human review** of your full document set before submission (₹999 / $19 add-on or included monthly) |

**Honesty rating: REAL** for the database and format rules. **ASSISTIVE** for the health check — we are clear about what it can and cannot catch. The human review tier is where real value is captured.

**Vision fit**
Pillar 5 (doc-review). Kills the scattered-information pain.

**Marketing one-liner**

> "Every document. Every rule. Every format. Done right the first time."

---

### Feature D — Pre-Appointment Lockdown (fixes Pain 4)

**What it does**
At **7 / 3 / 1 day** before your appointment, an escalating checklist runs over WhatsApp + email + push. The final 24 hours show a single screen with every document marked green / red, a printable cover sheet, the embassy address with offline map, and a **panic button** that connects you to a human.

**How it actually works (no magic)**

- Reuses our existing roadmap data + an `appointment_date` field + `pg_cron` for scheduled drips
- WhatsApp Cloud API — free tier covers ~1,000 conversations/month, enough for MVP
- "Panic button" routes to a small ops team during India + Europe business hours; off-hours auto-reply with AI triage and an SLA-backed callback

**Free vs Paid**
| Tier | What you get |
|---|---|
| Free | Email reminders at 7/3/1 day |
| Pro | WhatsApp + push escalation · printable cover sheet · offline embassy map |
| Pro Max | Panic button to a human (SLA: response in 15 min during business hours) |

**Honesty rating: REAL.**
Boring engineering, big emotional payoff. The panic button is where we earn loyalty for life.

**Vision fit**
Pillars 4 + 11 (copilot + drip campaigns). Kills the last-minute pain — the one that actually causes rejections.

**Marketing one-liner**

> "Walk into your appointment knowing you have everything."

---

## 4. What We Will NOT Build (And Why)

A short, public list. We will pin this to the wall.

- ❌ **Auto-booking on VFS / BLS / TLScontact.** ToS violation; gets users banned; harms the very people we serve.
- ❌ **"Guaranteed approval" claims.** Illegal in many jurisdictions. Always false. Erodes trust.
- ❌ **Fake-urgency dark patterns** ("only 2 slots left!"). The visa process is stressful enough.
- ❌ **Selling user data to agents or marketing lists.** Not now. Not ever.
- ❌ **Free unlimited everything.** It would kill the human-review economics that make us trustworthy. We'd rather have a smaller paying base than a larger lying one.

---

## 5. Free vs Paid Philosophy

- **Free is genuinely useful, not crippled.** A first-time student from a small town in India can solve their visa for ₹0 if they are patient.
- **Paid removes time pressure and adds humans.** That is exactly what stressed, working, or family users will pay for.
- **Pricing is anchored to "one agent visit"** (~₹15,000). If we save the user ₹14,000 and 3 weeks, then ₹499/month for 2 months is a no-brainer.
- We never paywall safety. Scam shield, rejection-reason explainers, and emergency document warnings are always free.

---

## 6. Feasibility & Risk (Brutal Honesty Section)

| Risk                                          | Likelihood        | Mitigation                                                                                                                                  |
| --------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| VFS / portals block our scrapers              | High              | Distributed IPs · polite rate limits · only public pages · fallback to embassy direct portals · **never** use bot-detection-bypass services |
| Embassy rules change silently                 | Certain           | 14-day re-verification cron + community reporting + visible "last verified" date on every page                                              |
| Human researcher costs eat margin             | Medium            | Start with top 5 corridors only · expand as Pro revenue funds new researchers                                                               |
| WhatsApp Cloud API limits hit                 | Low initially     | Free tier covers MVP · switch to paid tier at 1k conversations/mo                                                                           |
| Users blame us for rejections                 | High              | Constant disclaimer: _"we prepare, you submit; the decision is the embassy's"_ · publish corridor-level success rates transparently         |
| LLM hallucinations on requirements            | High if unchecked | Every Pro/Pro Max output is grounded in citations · human review for top corridors · diff detection against last verified version           |
| Affiliate revenue tempts us into bad partners | Medium            | Public partner policy · user always sees non-partner alternatives · annual partner audit                                                    |

---

## 7. Vision Alignment Check

Every feature above must pass three tests:

1. **One-liner test** — does it "turn the most stressful paperwork of your life into a clear, personal roadmap"? ✅ A removes the slot-anxiety step. B removes the comprehension step. C removes the preparation step. D removes the day-of step.
2. **Tagline test** — does it move the user closer to "from dream to doorstep"? ✅ Each feature is one of the four bridges across the chasm between dream and doorstep.
3. **Category test** — does it strengthen our claim as the _Trust Layer for Global Mobility_? ✅ Each feature trades short-term revenue (we could auto-book, we could fake guarantees) for long-term trust (we don't, and we say so out loud).

If a future feature fails any of these three tests, we don't ship it — no matter how good the demo looks.

---

## 8. 90-Day Build Order

| Weeks | Ship                                                              | Why this order                                                                                    |
| ----- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1–3   | Feature B — Decoder upgrade + human-verify badge                  | Lowest technical risk · reuses existing AI infra · biggest immediate user delight                 |
| 4–6   | Feature D — Pre-appointment drip (WhatsApp + pg_cron)             | Boring engineering · huge emotional payoff · sets up Pro Max upgrades                             |
| 7–10  | Feature C v1 — Document Studio (DB + health check)                | Needs the researcher hires from Pro revenue · unlocks affiliate revenue stream                    |
| 11–13 | Feature A — Slot Radar (IN→DE only, then IN→UK, then IN→Schengen) | Highest operational risk · ships last, after we've proven we can keep promises on the easier ones |

The riskiest, most-ops-heavy feature (Slot Radar) is intentionally last. We earn the right to make that promise.

---

## 9. Success Metrics Per Feature

| Feature             | Metric                                           | Target                  |
| ------------------- | ------------------------------------------------ | ----------------------- |
| A — Slot Radar      | Median time-to-notify                            | < 60 seconds            |
| A — Slot Radar      | User-reported slot-secured rate                  | > 40% of notified users |
| B — Decoder         | Accuracy on human spot-check                     | > 95%                   |
| B — Decoder         | "I understood my visa for the first time" survey | > 70% agree             |
| C — Document Studio | Pro Max users with a doc-format rejection        | < 5%                    |
| C — Document Studio | Affiliate revenue covers researcher salary       | by month 6              |
| D — Pre-Appointment | Pro Max users who miss their appointment         | 0%                      |
| D — Pre-Appointment | Panic-button NPS                                 | > 70                    |

We publish these numbers publicly every quarter. Transparency is the moat.

---

## 10. The Promise

Every other player in this space promises certainty they cannot deliver. We promise something rarer: **the truth, in your language, on time, with a human you can reach when it counts.**

If we build the four features above honestly, in this order, with these guardrails, then in 24 months VisaClarity is the default first-open app for anyone, anywhere, crossing a border for the first time.

That is the company worth building.
