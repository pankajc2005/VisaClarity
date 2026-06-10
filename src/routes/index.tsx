import { createFileRoute, Link } from "@tanstack/react-router";
import { LeadForm } from "@/components/landing/LeadForm";
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import { HorizontalDestinations } from "@/components/landing/HorizontalDestinations";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Reveal } from "@/components/common/Reveal";
import { TypingCycle } from "@/components/common/TypingCycle";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { FeedbackWidget } from "@/components/common/FeedbackWidget";
import { UserNav } from "@/components/auth/UserNav";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import { SITE_URL } from "@/lib/core/platform";

const PAGE_TITLE = "VisaClarity — Free Personalized Visa Roadmaps";
const PAGE_DESCRIPTION =
  "Get a free personalized visa roadmap: exact documents, timeline, costs, and rejection patterns for your nationality and destination.";
const PAGE_KEYWORDS =
  "visaclarity, visa, passport, passport seva, passport seva login, passport renewal, passport renewal online, passport apply online, passport seva kendra, vfs global, vfs, vfsglobal.com, visa.vfsglobal.com, vfs india, vfs online application, ustraveldocs, ustraveldocs login, usvisascheduling.com login, us visa scheduling, ais us visa, us visa login, ceac, ceac login, nvc, nvc login, nvc sign in, us immigrant visa, immigrant visa, consular processing, gdrfa, gdrfa dubai, gdrfa login, gdrfad, icp, icp smart services, ica, uae visa, immigration uae, dubai immigration, emirates visa, visit visa uae, eta, etias, esta, canada eta, australia eta, uk eta, indian e-visa, indian visa online, evisa, e visa, visa bulletin, us visa bulletin 2026, priority date, us visa appointment, france visa, visa france, vls-ts france, campus france, vietnam visa, vietnam e-visa, bls spain visa, spain visa, china visa, china visa application, chinese visa, schengen visa, schengen visa checklist india, uk visa application, uk student visa requirements 2026, us f1 visa interview, canada study permit gic, germany student visa blocked account, australia subclass 500, ksa visa, mofa.gov.sa visa, kuwait visa, malaysia visa, thai visa, bali visa, korea visa portal, japan visa, brazil visa, south africa visa, evisa south africa, tn visa, o visa, nonimmigrant visa, business visa, tourist visa, visit visa, visa requirements, travel visa requirements, visa status check, how to apply for a visa, visa application process, golden visa portugal, portugal d7 visa, italy student visa, sweden student residence permit, netherlands mvv visa, ireland visa process, spain non lucrative visa, uae employment visa, japan student coe, work visa h1b lottery, skilled worker visa, personalized visa roadmap, visa rejection reasons students, visa financial proof guide, visa processing time 2026";

const FAQS = [
  {
    q: "What is a personalized visa roadmap?",
    a: "A personalized visa roadmap is a week-by-week document checklist generated for your specific nationality, destination, and travel purpose. It lists the exact documents, exact financial amounts, current processing times, and the most common rejection reasons on your exact route — not generic embassy copy.",
  },
  {
    q: "Which visa types does VisaClarity cover?",
    a: "VisaClarity covers tourist, student, work, business, family reunion, transit, medical treatment, and permanent residency visas across 47+ destinations including Germany, France, the United Kingdom, the United States, Canada, Australia, Schengen Area countries, the UAE, Japan, and more.",
  },
  {
    q: "Why do visa applications get rejected even when documents look complete?",
    a: "Most rejections are not about missing documents — they are about formatting and specifics: the wrong blocked-account amount, an insurance policy that does not cover repatriation, financial proof formatted for the wrong consulate, a sponsor letter missing the third year of tax returns, or a university letter with the wrong course start date.",
  },
  {
    q: "Is VisaClarity free?",
    a: "Yes. VisaClarity is free — generate your first personalized visa roadmap instantly with just three inputs: nationality, destination, and purpose.",
  },

  {
    q: "How much money do I need in a German blocked account for a student visa in 2026?",
    a: "As of 2026, the required blocked account amount for a German student visa is 11,904 euros (992 euros per month for 12 months). Wrong amounts — even off by a few euros — are the single most common rejection reason on the India to Germany student route.",
  },
  {
    q: "How long does a student visa application take?",
    a: "Typical processing times: Germany 6 to 12 weeks, UK 3 weeks (priority available), US F1 2 to 8 weeks after interview, Canada study permit 4 to 12 weeks, Australia subclass 500 around 4 weeks. VisaClarity shows live processing times for your exact consulate.",
  },
  {
    q: "What documents do I need for a Schengen tourist visa?",
    a: "Schengen tourist visa requires: completed application form, passport with 3 months validity beyond return, two biometric photos, travel insurance with 30,000 euros coverage including repatriation, confirmed flight and hotel bookings, bank statements for the last 3 months, and a cover letter explaining your travel purpose.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { name: "keywords", content: PAGE_KEYWORDS },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: SITE_URL + "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
  }),
  component: Landing,
});

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </p>
  );
}

const PROBLEM_SOURCES = [
  { title: "Embassy website", body: "Legalese. Outdated. Contradictory." },
  { title: "Google search", body: "10 answers. 5 different years." },
  { title: "Reddit / forums", body: "Someone else's case. Not yours." },
  { title: "Facebook groups", body: "Opinions. No accountability." },
  { title: "Travel agent", body: "Charges money. Still sometimes wrong." },
  { title: "Ask a friend", body: "Anecdote. Not reliable." },
];

const STEPS = [
  {
    n: "01",
    title: "Your passport nationality",
    body: "Where you are from determines what is required of you.",
  },
  {
    n: "02",
    title: "Your destination country",
    body: "Where you are going determines who reviews your application.",
  },
  {
    n: "03",
    title: "Your purpose and duration",
    body: "Why you are going determines which visa category applies.",
  },
];

const OUTPUTS = [
  {
    title: "Week-by-week timeline",
    body: "Not a list — a sequence. Knowing what blocks what is what removes the anxiety entirely.",
  },
  {
    title: "Exact costs, not estimates",
    body: "To the cent where possible. Blocked account amounts. Fee schedules. What you need liquid before departure.",
  },
  {
    title: "Real rejection patterns",
    body: "The five things that actually trip people up on your specific route. From real traveler ground truth, not official copy.",
  },
];

const DIFFERENT = [
  {
    n: "01",
    title: "Timeline first. Not a document list.",
    body: "Every existing site shows a list of documents. Nobody shows when to start which document because it blocks another. The sequence is the unlock. It is what removes the anxiety.",
  },
  {
    n: "02",
    title: "Real numbers. Not ranges.",
    body: "Every site says show sufficient funds. We say 10,332 euros exactly. Not approximately. Not around. The specificity is the value. Vague guidance is the same as no guidance.",
  },
  {
    n: "03",
    title: "What actually gets people rejected.",
    body: "Not the official requirements. The gap between official requirements and what actually trips people up. Pattern-recognized from real traveler ground truth, not embassy copy.",
  },
];

const REPORT_WEEKS = [
  {
    range: "Week 1 — 2",
    note: "Start here. These block everything else.",
    items: [
      {
        title: "University admission letter",
        body: "Required for every subsequent document. Get the original, not a provisional letter.",
      },
      {
        title: "Open blocked account — Fintiba or Coracle",
        body: "Exact amount: 10,332 euros. Wrong amount is the most common rejection reason on this route. Takes 2 to 3 weeks to process. Cannot be opened through a German bank remotely.",
      },
    ],
  },
  {
    range: "Week 3 — 4",
    note: "Financial and background documentation.",
    items: [
      {
        title: "Financial sponsorship letter from parents",
        body: "Must be notarized. Must show 3 years of ITR. Address must match passport exactly — mismatch causes delays.",
      },
      {
        title: "Police clearance certificate",
        body: "Apply at your state-specific office. Takes 10 to 21 days. Current processing: Mumbai 18 days, Delhi 12 days.",
      },
    ],
  },
  {
    range: "Week 5 — 6",
    note: "Appointment and insurance.",
    items: [
      {
        title: "Book VFS Global appointment",
        body: "Book through VFS Global, not the embassy directly. Current wait: Mumbai 3 weeks, Chennai 1 week. Bring physical copies — phone screens are rejected.",
      },
      {
        title: "Medical insurance",
        body: "Minimum coverage: 30,000 euros. Must cover repatriation. Valid from day of travel, not visa issue date. Indian insurance policies are commonly rejected.",
      },
    ],
  },
];

const COSTS = [
  ["Visa fee", "75 euros"],
  ["Blocked account (returned on arrival)", "10,332 euros"],
  ["VFS service charge", "2,714 rupees"],
  ["Document notarization", "500 — 2,000 rupees"],
  ["Police clearance", "500 rupees"],
  ["Health insurance (1 year)", "800 — 1,200 euros"],
  ["Total liquid needed before departure", "approx. 95,000 rupees"],
];

const REJECTIONS = [
  "Blocked account amount even slightly wrong",
  "Financial sponsor documents missing the third ITR year",
  "Insurance policy does not cover repatriation",
  "Gap between finances shown and apparent lifestyle",
  "University letter has wrong course start date",
];

function JsonLd({ type, data }: { type: string; data: unknown }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": type,
          ...(data as object),
        }),
      }}
    />
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <FeedbackWidget />
      <JsonLd
        type="Organization"
        data={{
          "@id": SITE_URL + "/#organization",
          name: "VisaClarity",
          alternateName: ["Visa Clarity", "VisaClarity.app", "Visa Clarity AI"],
          legalName: "VisaClarity",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: SITE_URL + "/favicon.png",
            width: 512,
            height: 512,
          },
          image: SITE_URL + "/favicon.png",
          slogan: "Stop hoping your visa documents are right.",
          description:
            "VisaClarity generates personalized visa application roadmaps — exact documents, week-by-week timelines, real costs, and the rejection patterns specific to your nationality and destination. Free to start.",
          knowsAbout: [
            "Visa applications",
            "Schengen visa",
            "Student visa",
            "Work visa",
            "Tourist visa",
            "Immigration roadmap",
            "Visa document checklist",
            "Visa rejection reasons",
          ],
          areaServed: "Worldwide",
          foundingDate: "2026",
          sameAs: [
            "https://devpost.com/software/visaclarity",
            "https://www.producthunt.com/products/visaclarity",
            "https://github.com/visaclarity",
            "https://twitter.com/VisaClarity",
            "https://www.linkedin.com/company/visaclarity",
          ],
        }}
      />
      <JsonLd
        type="WebSite"
        data={{
          "@id": SITE_URL + "/#website",
          name: "VisaClarity",
          alternateName: "Visa Clarity",
          url: SITE_URL,
          description: PAGE_DESCRIPTION,
          inLanguage: "en",
          publisher: { "@id": SITE_URL + "/#organization" },
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: SITE_URL + "/blog?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <JsonLd
        type="WebApplication"
        data={{
          name: "VisaClarity",
          url: SITE_URL,
          applicationCategory: "TravelApplication",
          operatingSystem: "Web",
          description: PAGE_DESCRIPTION,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: [
            "Personalized visa requirements checklist by nationality and destination",
            "Week-by-week document roadmap with processing times",
            "Exact financial amounts and blocked-account requirements",
            "Real visa rejection patterns by route",
            "Covers tourist, student, work, business, transit, medical, and residency visas",
          ],
        }}
      />
      <JsonLd
        type="Service"
        data={{
          name: "Personalized Visa Application Roadmap",
          provider: { "@type": "Organization", name: "VisaClarity", url: SITE_URL },
          serviceType: "Visa application guidance",
          areaServed: "Worldwide",
          description:
            "Personalized visa application roadmaps for students and travelers: exact documents, week-by-week timelines, real costs, and rejection patterns by nationality and destination.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd
        type="BreadcrumbList"
        data={{
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
          ],
        }}
      />
      <JsonLd
        type="FAQPage"
        data={{
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      {/* Top scroll progress bar */}
      <ScrollProgress />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto h-full px-6 md:px-10 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span className="inline-block size-1.5 bg-cream rounded-full" />
            <span className="text-[15px] font-medium text-foreground">VisaClarity</span>
          </a>
          <div className="flex items-center gap-3 md:gap-8">
            <a
              href="#problem"
              className="hidden md:inline text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              className="hidden md:inline text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="#sample"
              className="hidden md:inline text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Sample Report
            </a>
            <Link
              to="/pricing"
              className="hidden md:inline-flex items-center px-3.5 py-1.5 rounded-full text-[13px] text-foreground transition-all"
              style={{
                border: "1px solid color-mix(in oklab, var(--gold) 45%, transparent)",
                boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--gold) 15%, transparent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  "color-mix(in oklab, var(--gold) 80%, transparent)";
                e.currentTarget.style.boxShadow = "var(--shadow-gold)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  "color-mix(in oklab, var(--gold) 45%, transparent)";
                e.currentTarget.style.boxShadow =
                  "inset 0 0 0 1px color-mix(in oklab, var(--gold) 15%, transparent)";
              }}
            >
              Pricing
            </Link>
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section id="top" className="hero-vignette pt-[120px] pb-32 px-6 md:px-10">
          <div className="max-w-[1100px] mx-auto text-center">
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground border border-border-strong px-4 py-2">
              First roadmap free — no account required
            </span>
            <h1 className="mt-10 font-display font-normal text-[44px] md:text-[78px] leading-[1.05] text-foreground">
              Stop hoping your
              <br />
              <em className="italic text-cream font-normal">
                <TypingCycle
                  phrases={[
                    "visa documents",
                    "application checklist",
                    "embassy paperwork",
                    "approval timeline",
                    "blocked account",
                    "financial proof",
                    "sponsor letter",
                    "travel insurance",
                    "consulate forms",
                    "interview prep",
                  ]}
                />
              </em>{" "}
              are right.
            </h1>
            <p className="mt-8 mx-auto max-w-[600px] text-[16px] md:text-[17px] leading-[1.7] text-muted-foreground">
              Three inputs. One personalized roadmap. The exact documents, in the right order, with
              real costs and the rejection patterns for your specific route.
            </p>

            {/* Animated editorial illustration */}
            <div className="mt-14">
              <HeroIllustration />
            </div>

            <div className="mt-10">
              <LeadForm idPrefix="hero" />
            </div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-border-strong border border-border-strong max-w-[820px] mx-auto">
              {[
                ["47+", "Destinations covered"],
                ["120+", "Nationalities supported"],
                ["8", "Visa categories"],
                ["< 60s", "Roadmap generation"],
              ].map(([k, v]) => (
                <div key={v} className="bg-background px-5 py-6 text-center">
                  <p className="font-display text-[26px] md:text-[32px] text-cream">{k}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className="py-28 px-6 md:px-10 border-t border-border">
          <div className="max-w-[1100px] mx-auto">
            <Reveal className="text-center">
              <Eyebrow>The Problem</Eyebrow>
              <h2 className="mt-5 font-display text-[34px] md:text-[52px] leading-[1.1] text-foreground">
                Every traveler reaches the
                <br />
                <em className="italic text-cream font-normal">same moment.</em>
              </h2>
            </Reveal>

            <blockquote className="mt-14 max-w-[680px] mx-auto text-center font-display italic text-[22px] md:text-[28px] leading-[1.5] text-cream">
              &ldquo;
              <TypingCycle
                typeSpeed={60}
                deleteSpeed={30}
                pauseMs={2200}
                phrases={[
                  "I think I have everything. But I am not sure.",
                  "What if my blocked account amount is wrong?",
                  "Did I miss a document they did not list?",
                  "What if my insurance does not cover repatriation?",
                  "Is my sponsor letter format even accepted?",
                  "Did I book the right type of appointment?",
                  "What if they reject me and I lose the semester?",
                  "Is my financial proof strong enough?",
                  "Did I use the correct photo specifications?",
                  "What if the embassy updates the rules tomorrow?",
                ]}
              />
              &rdquo;
            </blockquote>

            <p className="mt-14 max-w-[640px] mx-auto text-center text-[15px] leading-[1.7] text-muted-foreground">
              Right now, to get certainty a person must go through all of this — and still arrives
              only slightly less uncertain than before.
            </p>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border-strong border border-border-strong">
              {PROBLEM_SOURCES.map((s, i) => (
                <Reveal key={s.title} delay={i * 60} className="bg-background p-8">
                  <p className="text-[16px] font-medium text-foreground">{s.title}</p>
                  <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">{s.body}</p>
                </Reveal>
              ))}
            </div>

            <p className="mt-16 text-center font-display italic text-[24px] md:text-[32px] text-cream">
              Hoping is the product gap.
            </p>
            <p className="mt-5 max-w-[620px] mx-auto text-center text-[15px] leading-[1.7] text-muted-foreground">
              After doing all of that, travelers still are not certain. They just feel slightly less
              uncertain. They show up hoping. That is the problem we are solving.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-28 px-6 md:px-10 border-t border-border">
          <div className="max-w-[1100px] mx-auto">
            <Reveal className="text-center">
              <Eyebrow>How It Works</Eyebrow>
              <h2 className="mt-5 font-display text-[34px] md:text-[52px] leading-[1.1] text-foreground">
                Three inputs. One complete
                <br />
                <em className="italic text-cream font-normal">roadmap.</em>
              </h2>
            </Reveal>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-px md:bg-border-strong md:border md:border-border-strong">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 90} className="md:bg-background p-2 md:p-10">
                  <p className="font-mono text-[28px] text-cream">{s.n}</p>
                  <h3 className="mt-6 text-[18px] font-medium text-foreground">{s.title}</h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-muted-foreground">{s.body}</p>
                </Reveal>
              ))}
            </div>

            <div className="mt-20 flex items-center gap-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Output
              </span>
              <span className="flex-1 h-px bg-border-strong" />
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
              {OUTPUTS.map((o, i) => (
                <Reveal key={o.title} delay={i * 90} className="border-t border-cream/30 pt-6">
                  <h3 className="text-[18px] font-medium text-cream font-display">{o.title}</h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-muted-foreground">{o.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Horizontal scroll: destinations */}
        <HorizontalDestinations />

        {/* What is different */}
        <section className="py-28 px-6 md:px-10 border-t border-border">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center">
              <Eyebrow>What Is Different</Eyebrow>
              <h2 className="mt-5 font-display text-[34px] md:text-[52px] leading-[1.1] text-foreground">
                Not a visa database.
                <br />
                Not a <em className="italic text-cream font-normal">checklist.</em>
              </h2>
            </div>

            <div className="mt-16 space-y-12">
              {DIFFERENT.map((d, i) => (
                <Reveal
                  key={d.n}
                  delay={i * 100}
                  className="grid grid-cols-[60px_1fr] md:grid-cols-[120px_1fr] gap-6 md:gap-10 border-t border-border-strong pt-8"
                >
                  <p className="font-mono text-[28px] text-cream">{d.n}</p>
                  <div>
                    <h3 className="font-display text-[22px] md:text-[28px] leading-[1.3] text-foreground">
                      {d.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-[1.75] text-muted-foreground">
                      {d.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Sample Output */}
        <section id="sample" className="py-28 px-6 md:px-10 border-t border-border bg-muted">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center">
              <Eyebrow>Sample Output</Eyebrow>
              <h2 className="mt-5 font-display text-[34px] md:text-[52px] leading-[1.1] text-foreground">
                This is what <em className="italic text-cream font-normal">certainty</em> looks
                like.
              </h2>
            </div>

            <div className="mt-14 border border-border-strong bg-background">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 md:px-10 py-6 border-b border-border-strong">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Trip Readiness Report
                  </p>
                  <p className="mt-2 font-display text-[20px] text-foreground">
                    India to Germany — Student Visa — 2 Years
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 font-mono text-[14px] text-cream">11 items to complete</p>
                </div>
              </div>

              {/* Weeks */}
              <div className="divide-y divide-border-strong">
                {REPORT_WEEKS.map((w) => (
                  <div key={w.range} className="px-6 md:px-10 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 md:gap-10">
                      <div>
                        <p className="font-mono text-[13px] text-cream">{w.range}</p>
                        <p className="mt-2 text-[12px] leading-[1.6] text-muted-foreground">
                          {w.note}
                        </p>
                      </div>
                      <div className="space-y-5">
                        {w.items.map((item) => (
                          <div key={item.title}>
                            <p className="text-[15px] font-medium text-foreground">{item.title}</p>
                            <p className="mt-1.5 text-[13px] leading-[1.7] text-muted-foreground">
                              {item.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Costs */}
              <div className="px-6 md:px-10 py-8 border-t border-border-strong bg-muted">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
                  Real cost breakdown
                </p>
                <div className="divide-y divide-border">
                  {COSTS.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-3 text-[14px]">
                      <span className="text-foreground">{label}</span>
                      <span className="font-mono text-cream">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejections */}
              <div className="px-6 md:px-10 py-8 border-t border-border-strong">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
                  What actually gets people rejected
                </p>
                <ol className="space-y-3">
                  {REJECTIONS.map((r, i) => (
                    <li key={r} className="grid grid-cols-[40px_1fr] gap-3 text-[14px]">
                      <span className="font-mono text-cream">#{i + 1}</span>
                      <span className="text-foreground">{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <p className="mt-6 text-center font-display italic text-[13px] text-muted-foreground">
              Sample for illustration — every roadmap is generated based on your specific route,
              purpose, and current processing times.
            </p>
          </div>
        </section>

        {/* FAQ — backs the FAQPage JSON-LD with visible content */}
        <section id="faq" className="py-28 px-6 md:px-10 border-t border-border">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center">
              <Eyebrow>Frequently Asked Questions</Eyebrow>
              <h2 className="mt-5 font-display text-[34px] md:text-[52px] leading-[1.1] text-foreground">
                Visa requirements, <em className="italic text-cream font-normal">answered.</em>
              </h2>
            </div>
            <div className="mt-14 border-t border-border-strong">
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((f, index) => (
                  <AccordionItem
                    key={f.q}
                    value={`item-${index}`}
                    className="py-2 border-border-strong"
                  >
                    <AccordionTrigger className="text-[17px] md:text-[19px] font-medium text-foreground hover:no-underline">
                      <span className="text-left">{f.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="mt-2 text-[15px] leading-[1.75] text-muted-foreground max-w-[760px]">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-12 border-t border-border">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:items-start">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 bg-cream rounded-full" />
            <span className="text-[14px] text-foreground">VisaClarity</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#sample" className="hover:text-foreground transition-colors">
              Sample report
            </a>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
        </div>
        <p className="mt-8 max-w-[1100px] mx-auto text-[12px] leading-[1.6] text-muted-foreground">
          Data sourced from European Commission Visa Statistics 2024, US Department of State, USCIS,
          and community-verified traveler submissions. VisaClarity does not provide legal advice.
        </p>
      </footer>
    </div>
  );
}
