# LAUNCH.md — VisaClarity Public Launch (v1)

> The single source of truth for what we are putting in front of the public on day one, what we are intentionally hiding, and how we run the first 30 days.
>
> Companion files: `VISION.md` · `BRAND.md` · `PITCH.md` · `ROADMAP.md` · `SLOT_AND_DOCS_PLAN.md` · `SUGGESTIONS.md`. This file overrides any of them where they disagree about **what ships in v1**.

---

## 1. Launch Stance

VisaClarity v1 is a **free public beta**. No paywalls. No tiers exposed in the UI. No upgrade prompts. No "limited spots." No fake urgency.

- **Positioning:** _"Free public beta — the trust layer for your visa journey."_
- **The one promise:** _Truthful, personalized, in plain English._ Nothing else.
- **The pact with early users:** they get the product for free, forever, on the destinations we support at launch. In return, they give us feedback. That is the entire trade.

We are deliberately under-promising. Day-one users should leave saying _"this was more honest than I expected"_ — not _"this did less than I expected."_

---

## 2. What v1 Ships With — the "Yes" list

Every item below is already built (or one short edit away). Each one ships with a visible honesty disclaimer where relevant.

| Surface                                   | What the user sees                                               | Honesty line shown next to it                                                                |
| ----------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Landing page**                          | Hero, problem, how-it-works, destinations, waitlist, FAQ, footer | "Free public beta. We're early. We tell you what we don't know yet."                         |
| **Auth**                                  | Google + email sign-up / sign-in                                 | —                                                                                            |
| **Personalized AI roadmap**               | 3-input form → AI-crafted, citation-backed roadmap               | "AI-drafted, source-cited. The embassy's decision is always final."                          |
| **Saved roadmaps + dashboard**            | History of every roadmap the user generated                      | —                                                                                            |
| **Public shareable roadmap** (`/r/$slug`) | Per-roadmap page with OG image + canonical                       | "Personal to one applicant on one date. Verify before you act."                              |
| **Blog**                                  | SEO seed posts on top corridors                                  | "Last verified: <date>" on every post                                                        |
| **Pricing page**                          | Repurposed as **"Free during beta"**                             | "Paid plans will launch with Slot Radar, Document Studio, and the panic button. Not before." |
| **Feedback widget**                       | Already wired, single-click                                      | Routes to a real inbox we read daily                                                         |
| **Analytics**                             | GA4 already wired                                                | Disclosed in `/legal/privacy`                                                                |
| **About / Transparency / Disclaimer**     | Three short pages                                                | The full "what we don't do" list (see §8)                                                    |

That's it. **Anything not in this table is hidden in v1.**

---

## 3. What v1 Hides / Removes — the "Not Now" list

We do not delete the code — we hide the entry points. Everything stays behind a feature flag so post-launch rollout is one boolean flip.

| Hidden surface                                            | Why                                                                                                                           | How to hide                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Slot Radar** CTAs                                       | Promised in `SLOT_AND_DOCS_PLAN.md` Feature A — not yet built. Showing a CTA we can't fulfill destroys the one thing we sell. | Replace any "Watch this slot" button with `Coming soon` chip. No email capture.                          |
| **Document Studio OCR / health check**                    | Feature C — not built.                                                                                                        | Hide upload buttons. Keep the static checklist.                                                          |
| **WhatsApp drip / panic button**                          | Feature D — not built.                                                                                                        | Remove from dashboard.                                                                                   |
| **Pro / Pro Max tier UI**                                 | We are 100% free in v1. Mentioning tiers in UI breaks the promise.                                                            | Hide upgrade modals, `LockedFeature` triggers, tier badges. `useSubscription` keeps working server-side. |
| **`PersonalizedRequestDialog`** (human-crafted requests)  | Requires ops capacity we don't have yet.                                                                                      | Admin-only flag.                                                                                         |
| **`AdminTierPanel`** in nav                               | Internal tool.                                                                                                                | Mounted only at `/admin/*`, hidden from `UserNav`.                                                       |
| **Any "guaranteed", "100% approval", "in 24 hours"** copy | Trust killers. Often illegal.                                                                                                 | Copy audit across all routes + blog.                                                                     |
| **Empty / unverified corridor pages**                     | Better to have 5 great corridors than 50 mediocre ones.                                                                       | Ship only corridors a human has verified within the last 14 days.                                        |

**Implementation note:** add a single feature-flag map (e.g. `src/lib/flags.ts`) and gate the above surfaces. Do NOT rip out the code paths.

---

## 4. Pre-Launch Checklist

Each line is a single ticket. Cross off in order.

### Copy & trust

- [ ] Grep the entire repo for "guarantee", "100%", "approved", "fastest", "instant" — rewrite or remove
- [ ] Create `/legal/disclaimer`, `/legal/privacy`, `/legal/terms`
- [ ] Add a thin "Free public beta" banner sitewide (dismissible, persisted)
- [ ] Add "Last verified: <date>" badge on every corridor / roadmap output
- [ ] Footer links to all three legal pages + transparency note

### SEO & sharing

- [ ] Unique `<title>` + meta description on every route (run `seo_chat--list_findings` and fix all failing)
- [ ] Per-route OG image at leaf routes (root one only, leaves override) — see `tanstack-route-architecture`
- [ ] `sitemap.xml` lists every public route; `robots.txt` allows everything except `/admin` and `/_authenticated`
- [ ] JSON-LD `Article` schema on blog posts; `WebSite` + `Organization` on landing
- [ ] Canonical tags on every leaf route — never on `__root.tsx`

### Product hardening

- [ ] Rate-limit AI roadmap generation: 5/day per user, 20/day per IP for anon
- [ ] `errorComponent` + `notFoundComponent` on every route with a loader
- [ ] `defaultErrorComponent` on the router config
- [ ] Sentry / `ErrorReporter` verified end-to-end (throw a test error in prod)
- [ ] Mobile pass: landing, `/auth`, `/dashboard`, `/roadmap`, `/r/$slug`, `/blog`
- [ ] Dark mode pass on the same five surfaces
- [ ] Lighthouse > 90 on landing (performance, a11y, SEO, best-practices)
- [ ] All images have `alt` text
- [ ] All interactive elements reachable by keyboard

### Backend & ops

- [ ] RLS audit on every `public.*` table — run `security--run_security_scan`
- [ ] Confirm DB backup cadence in Lovable Cloud
- [ ] Feedback widget routes to a real inbox we actually read
- [ ] Admin routes locked to founder email(s) via `has_role('admin')`
- [ ] Server-fn logs sampled for PII leaks before launch

### Hide the unfinished

- [ ] `src/lib/flags.ts` created with `SLOT_RADAR`, `DOC_STUDIO`, `WHATSAPP_DRIP`, `PAID_TIERS`, `HUMAN_CRAFTED_REQUESTS` — all `false`
- [ ] Every surface in §3 gated by the relevant flag
- [ ] Pricing page CTA replaced with _"Free during beta — join the waitlist for Pro features"_
- [ ] No tier badge, no lock icon, no upgrade modal appears anywhere a logged-in free user clicks

---

## 5. Day-of-Launch Runbook

| When  | Action                                                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| T−24h | Final smoke test on preview URL. Walk the full user journey on mobile + desktop.                                                    |
| T−2h  | Re-run `seo_chat--list_findings`, fix anything failing. Re-run security scan.                                                       |
| T−1h  | Switch publish visibility to **public** (`publish_settings--update_visibility`).                                                    |
| T−0   | Post to Product Hunt, LinkedIn, Twitter/X, IndieHackers, r/IWantOut, r/germany, r/studyAbroad, relevant university WhatsApp groups. |
| T+1h  | Watch Sentry, console, feedback widget. Reply to every comment within the hour.                                                     |
| T+24h | Triage feedback. Write the first public changelog entry.                                                                            |
| T+7d  | First public transparency post: traffic, signups, what broke, what we fixed.                                                        |

---

## 6. Success Metrics — first 30 days

| Metric                                                     | Target |
| ---------------------------------------------------------- | ------ |
| Unique visitors                                            | 1,000  |
| Signups                                                    | 200    |
| Personalized roadmaps generated                            | 50     |
| Unsolicited "this is useful" feedback entries              | 10     |
| Trust-breaking complaints (false info, missing disclaimer) | **0**  |

**Gate to start building paid features:** hit ≥ 3 of the 5 metrics → start Feature B (Decoder upgrade) per `SLOT_AND_DOCS_PLAN.md`. Anything less → keep iterating on v1.

---

## 7. Post-Launch 90-Day Loop

No new planning here — point to the existing docs:

- **Build order:** `SLOT_AND_DOCS_PLAN.md` §8 (B → D → C → A)
- **Prompt backlog:** `SUGGESTIONS.md` (~150 ready-to-paste prompts)
- **Long-term vision:** `VISION.md` and `ROADMAP.md`

The job in the first 90 days post-launch is **only** to ship Feature B (Plain-English Decoder upgrade) and run the feedback loop. Resist everything else.

---

## 8. Things We Will NEVER Ship

Copied verbatim from `SLOT_AND_DOCS_PLAN.md` §4 so it lives next to the launch decision:

- ❌ **Auto-booking on VFS / BLS / TLScontact.** ToS violation; gets users banned; harms the very people we serve.
- ❌ **"Guaranteed approval" claims.** Illegal in many jurisdictions. Always false. Erodes trust.
- ❌ **Fake-urgency dark patterns** ("only 2 slots left!"). The visa process is stressful enough.
- ❌ **Selling user data to agents or marketing lists.** Not now. Not ever.
- ❌ **Free unlimited everything forever.** v1 is free in full because we are small. When paid tiers launch, free stays genuinely useful — but the human-review economics require paid tiers to exist.

This list is pinned to the wall.

---

## 9. The Public Promise

> VisaClarity is free during public beta. We won't claim to guarantee a visa, we won't auto-book slots we'd get you banned for, and we won't sell your data. We tell you what we know, what we don't, and when we last verified it. Real humans read every piece of feedback. That's the company we are building — and that's the promise we'll keep on the day you walk into your appointment.

---

_Last updated: 2026-06-03 · Owner: founders · Review cadence: weekly during beta._
