# SUGGESTIONS.md

> The complete catalog of next-step prompts for VisaClarity.
>
> **How to use this file:** scan a section, copy any line, paste it into Lovable chat. Each line is a complete, ready-to-send prompt. Group order roughly mirrors our build order from `SLOT_AND_DOCS_PLAN.md` and `ROADMAP.md`, but you can jump in anywhere.
>
> **Why this exists:** Lovable's chat shows only 3–4 suggestion chips at a time. This file collects every meaningful one we'd surface for this product, in one place, so nothing gets lost between chats.

---

## 1. Slot Radar — Feature A

1. Add an `appointment_slots` and `slot_watches` table to the database with RLS scoped to `auth.uid()`.
2. Build a "Watch this slot" toggle inside the personalized roadmap output.
3. Create a polling worker (TanStack server route + pg_cron, 60–120s) for the IN→DE VFS portal.
4. Add a slot history chart showing slot availability over the last 14 days per corridor.
5. Build the WhatsApp Cloud API integration for slot notifications.
6. Add email + browser-push channels as fallbacks for slot alerts.
7. Build the "Watch dashboard" page where users see all their active watches.
8. Add multi-city + multi-date-range support for Pro users on a single watch.
9. Build the IN→UK BLS scraper as a second corridor.
10. Build the IN→Schengen TLScontact scraper as a third corridor.
11. Add diff detection so notifications fire only when slot inventory actually changes.
12. Build the concierge-verify admin queue (Pro Max human-verifies slots before notifying).
13. Add an in-product disclaimer banner on every slot watch: "we notify, you book."
14. Add a free-tier throttle: 1 watch, 24h-delayed email notification.
15. Build a Pro upgrade modal that triggers when a free user adds a second watch.
16. Add slot-watch analytics: median time-to-notify, false-positive rate, claim-rate per corridor.
17. Add a public corridor stats page: "Average slot wait time for IN→DE this month."

---

## 2. Plain-English Requirement Decoder — Feature B

1. Extend `personalized-roadmap-craft.server.ts` with a "decoder mode" that ingests an embassy PDF URL.
2. Add a language switcher (Hindi, Tamil, Bengali, Tagalog, Arabic) to the roadmap view.
3. Build a side-by-side "Original embassy text ↔ Plain English" view component.
4. Add a "Verified by [researcher name], [date]" badge to roadmap outputs.
5. Build the human-review admin queue (researcher signs off on top 20 corridors monthly).
6. Build a 14-day re-verification cron job that re-runs research for each corridor.
7. Add a "What changed since last month" diff component for returning users.
8. Add a `corridor_versions` table storing each verified snapshot with a hash.
9. Build the researcher dashboard for accepting/rejecting AI-generated drafts.
10. Add inline citations under every claim, linking back to the source embassy URL.
11. Build a "Report this is wrong" button on every roadmap section, feeding the review queue.
12. Add free-tier throttle: 3 decodes/month, English only.
13. Build a "Last verified on [date] — refresh now" CTA on cached roadmaps.
14. Add per-language quality scores so researchers know which translations need review.
15. Build a `/verified-corridors` public page listing every corridor with a verification status.

---

## 3. Document Studio — Feature C

1. Create the `documents` table: ~40 types × ~20 destinations matrix with format rules.
2. Build the researcher admin UI for editing the documents matrix.
3. Add a "Required documents" tab to every personalized roadmap.
4. Build the document upload component with image + PDF support.
5. Wire OCR (Tesseract or Lovable AI vision) to extract text from uploaded docs.
6. Add rule checks: expiry date, page count, photo background, apostille stamp visible, MRZ readable.
7. Build a green/yellow/red "Document health" card per uploaded file.
8. Add an apostille requirement flag to every document in the roadmap.
9. Add a translation requirement flag plus a list of embassy-approved translators.
10. Build a partner directory page for apostille services and sworn translators.
11. Add affiliate disclosure on every partner link.
12. Build the "Explain this rejection" tool — paste rejection letter, get a plain-English fix list.
13. Build the Pro Max human document-review add-on flow (₹999 / $19 one-off).
14. Add a sample preview gallery so users see what a correct document looks like.
15. Build a downloadable cover sheet PDF listing every doc with status + page count.
16. Add a per-document "estimated cost + estimated time" widget.
17. Add a "12 most common rejection reasons" knowledge-base article and link it from the health-check disclaimer.

---

## 4. Pre-Appointment Lockdown — Feature D

1. Add an `appointment_date` field to the user's saved roadmap.
2. Build an "Add appointment date" prompt on the roadmap page once a slot is booked.
3. Create the 7/3/1-day pg_cron drip that fires reminders per user.
4. Wire WhatsApp Cloud API for escalating reminder messages.
5. Build the final-24h "Lockdown" screen: green/red checklist of every doc.
6. Add a printable cover sheet PDF for appointment day.
7. Embed an offline embassy address + map link (Google Maps deep link).
8. Build the panic-button flow: opens a chat with an ops human during business hours.
9. Build the off-hours AI triage that promises a callback SLA.
10. Build the ops-team inbox dashboard (priority sort by hours-to-appointment).
11. Add a free-tier limit: email-only reminders at 7/3/1 days.
12. Track and publish "0% missed appointment" metric for Pro Max users.

---

## 5. Onboarding & Personalization

1. Add a "First-time visa applicant vs Experienced" fork on the homepage hero.
2. Auto-detect nationality from IP and pre-fill the lead form.
3. Build a profile completeness meter on the dashboard.
4. Add a "Why are you traveling?" quiz (study, work, tourism, family, immigration) for purpose detection.
5. Build a "Save your roadmap" inline CTA after the first scroll on the roadmap page.
6. Add a returning-user dashboard summary card: "Your IN→DE roadmap was verified 3 days ago."
7. Build a one-tap "Start over with a new destination" action.
8. Add a multi-roadmap comparison view (compare IN→DE vs IN→UK costs/time).
9. Build a "Recommended for you" section on the dashboard based on past searches.
10. Add a "Share your roadmap with family" view-only link generator.

---

## 6. Trust & Safety

1. Build a public `/success-rates` page showing approval rate per corridor.
2. Add a scam-shield URL checker: paste a "visa agent" link, get a risk score.
3. Publish a transparency report template at `/transparency` (updated quarterly).
4. Add a "Last verified [date]" stamp to every section of every roadmap.
5. Build a `/legal/disclaimers` page covering "we don't guarantee approval."
6. Add a `/legal/dpdpa-gdpr` page describing our data handling.
7. Build a "Report a scam" button in the footer feeding a moderation queue.
8. Add a "Verified researcher" page with photos + credentials of the human reviewers.
9. Build a public changelog at `/changelog` listing every embassy rule change we detected.
10. Add a "Why we don't auto-book" explainer page and link it from the slot radar.

---

## 7. Monetization

1. Build a 3-column pricing page: Free / Pro / Pro Max with feature checkmarks.
2. Add a usage meter to the dashboard ("2 of 3 free decodes used this month").
3. Wire Stripe checkout for international Pro/Pro Max subscriptions.
4. Wire Razorpay checkout for India-region Pro/Pro Max subscriptions.
5. Build the affiliate-disclosure badge component used on every partner link.
6. Add a "Compare to a visa agent (~₹15,000)" cost calculator.
7. Build a "Refer a friend, get 1 month free" referral system.
8. Add an annual-plan discount (2 months free if paid yearly).
9. Build a B2B "Contact sales" form for universities and HR teams.
10. Add a one-off "Single application pack" purchase for users who don't want a subscription.

---

## 8. Growth & SEO

1. Generate static per-corridor landing pages: `/in-to-de`, `/in-to-uk`, `/ph-to-ca`, `/ng-to-uk`, etc.
2. Build a blog post template for "What I learned from my IN→DE rejection" user stories.
3. Add a Trustpilot widget to the homepage footer.
4. Build a `/compare/{agent-name}-vs-visaclarity` page generator.
5. Add JSON-LD `FAQPage` schema to every corridor page.
6. Build an `/embassies/{country}` directory page with hours, address, phone, last-verified date.
7. Generate a sitemap that includes every corridor + every embassy page.
8. Add an `/llms.txt` update listing every public corridor + the data freshness policy.
9. Build a "Visa rejection reasons by corridor" data-journalism long-read.
10. Add OpenGraph + Twitter card images that include the user's specific corridor.

---

## 9. B2B / Partnerships

1. Build a university dashboard view: list of admitted students + their visa readiness.
2. Add a bulk-roadmap CSV export API for university partners.
3. Build white-label theming (logo, colors, custom domain) for HR/EOR partners.
4. Add SSO via Google Workspace for university partners.
5. Build a Slack/Teams notification integration so HR sees employee visa risk.
6. Create a partner-portal billing view with per-seat usage.
7. Build an OAuth-app flow so partners can pull their users' roadmaps via API.
8. Publish a partner case study template page.

---

## 10. Analytics & Ops

1. Wire Sentry server-fn + client error capture.
2. Build an admin dashboard for slot-watch SLA tracking.
3. Create a `case_outcomes` table for approval/rejection self-reporting.
4. Build a weekly accuracy report cron that emails the team.
5. Add PostHog (or Plausible) event tracking for funnel analysis.
6. Build a `/admin/health` page showing all background-job statuses.
7. Add per-corridor latency dashboards for the AI gateway calls.
8. Build a cost-per-roadmap monitor so we know unit economics in real time.

---

## 11. Localization & Accessibility

1. Add i18n routing with locale prefixes (`/hi`, `/ta`, `/bn`, `/tl`, `/ar`).
2. Translate the homepage, pricing, and roadmap shell into Hindi.
3. Add right-to-left layout support for Arabic.
4. Run a WCAG AA audit and fix all violations.
5. Add keyboard-navigation testing checklist + fixes for the roadmap.
6. Add `aria-live` regions for slot-watch notifications.
7. Add a high-contrast mode toggle.
8. Add font-size controls for readers on smaller phones.

---

## 12. Student Pack Tools Activation

1. Provision a DigitalOcean droplet using the $200 student credit for staging.
2. Wire Sentry student license for free production-grade error monitoring.
3. Set up Mailgun (or SendGrid) student credit for transactional emails.
4. Enable GitHub Copilot Pro for the team via the student pack.
5. Connect Namecheap student credit for a `.me` redirect domain.
6. Use Notion student plan for the internal knowledge base + researcher SOPs.
7. Set up Bitwarden Families via the student pack for shared admin secrets.
8. Use Heroku student credits for a backup AI gateway region.

---

## 13. Quick Wins — 1-hour tasks

1. Add a "Powered by VisaClarity" badge that partners can embed.
2. Fix dark-mode contrast on the roadmap page.
3. Add an OG image to every blog post.
4. Add a `/changelog` page wired to a markdown folder.
5. Add a "Last updated" timestamp on the homepage hero.
6. Add a floating WhatsApp support button on every page.
7. Add a cookie-banner that defaults to "essential only" (no dark pattern).
8. Add a 404 page that suggests popular corridors.
9. Add a `/press` page with logo downloads + brand colors from `BRAND.md`.
10. Add keyboard shortcut hints (press `?`) on the roadmap page.

---

## 14. Big Bets — Multi-week

1. Build the rejection-pattern AI predictor (trained on self-reported `case_outcomes`).
2. Build the relocation companion: housing + bank + SIM + insurance under one roof.
3. Build the agent-vs-VisaClarity live cost + time calculator with embed code.
4. Build a marketplace for vetted independent immigration lawyers (revenue share).
5. Build a community Q&A board moderated by verified researchers.
6. Build an enterprise plan with audit logs + SAML SSO for global HR teams.
7. Build a mobile app shell (React Native via Expo) reusing the same server functions.
8. Build the "Welcome home" post-arrival module: registration, tax ID, local SIM, bank account opening.

---

**Total: ~150 prompts.** Pick the next one based on `SLOT_AND_DOCS_PLAN.md` build order (B → D → C → A) — or jump into any quick win for momentum.
