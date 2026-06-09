import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/common/ThemeToggle";

import { SITE_URL } from "@/lib/core/platform";
const TITLE = "About VisaClarity — Personalized Visa Roadmaps";
const DESCRIPTION =
  "VisaClarity gives students, workers, and travelers free personalized visa roadmaps: exact documents, costs, timelines, and rejection patterns.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "about visaclarity, visaclarity platform, visa roadmap tool, free visa checklist, visa help for students, visa help for travelers, visa application platform",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL + "/about" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About VisaClarity",
          url: SITE_URL + "/about",
          description: DESCRIPTION,
          mainEntity: {
            "@type": "Organization",
            name: "VisaClarity",
            alternateName: ["Visa Clarity", "VisaClarity.app"],
            url: SITE_URL,
            logo: SITE_URL + "/favicon.png",
            slogan: "Free Personalized Visa Roadmap for Students & Travelers",
            description: DESCRIPTION,
            foundingDate: "2025",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
            { "@type": "ListItem", position: 2, name: "About", item: SITE_URL + "/about" },
          ],
        }),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-serif text-xl">
            VisaClarity
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/blog">Blog</Link>
            <Link to="/pricing">Pricing</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-serif text-4xl">About VisaClarity</h1>
        <p className="text-lg text-muted-foreground">
          VisaClarity is a free platform that turns confusing embassy paperwork into a personalized,
          week-by-week visa roadmap — covering documents, exact financial amounts, processing times,
          and the rejection patterns specific to your nationality and destination.
        </p>

        <h2>Why VisaClarity exists</h2>
        <p>
          Visa rejections rarely come from missing documents. They come from wrong amounts in
          blocked accounts, insurance policies missing repatriation cover, bank statements formatted
          for the wrong consulate, and university letters with mismatched dates. Generic embassy
          pages don't catch these — VisaClarity does.
        </p>

        <h2>What VisaClarity covers</h2>
        <ul>
          <li>
            Student visas — Germany, UK, US (F1), Canada, Australia, France, Ireland, Netherlands,
            Sweden, Italy, Spain, Portugal, Japan and more
          </li>
          <li>Tourist and Schengen visas across 27 EU countries</li>
          <li>
            Work visas including H1B, UK Skilled Worker, Canada PGWP, Australia 482, UAE employment
          </li>
          <li>Family reunion, business, transit, medical, and PR pathways</li>
        </ul>

        <h2>How it works</h2>
        <ol>
          <li>Enter your nationality, destination, and visa purpose.</li>
          <li>Get a personalized roadmap with documents, costs, timeline, and rejection traps.</li>
          <li>Share, print, or revisit your roadmap anytime — free.</li>
        </ol>

        <p>
          <Link to="/" className="underline">
            Get your free visa roadmap →
          </Link>
        </p>
      </article>
    </main>
  );
}
