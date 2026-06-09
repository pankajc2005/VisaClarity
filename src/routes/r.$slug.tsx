import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getRoadmapBySlug } from "@/lib/roadmap/roadmap.functions";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { RoadmapView, MobileTOC } from "@/components/roadmap/RoadmapSections";
import { ThemeToggle } from "@/components/common/ThemeToggle";

import { SITE_URL } from "@/lib/core/platform";

const slugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["roadmap-share", slug],
    queryFn: async () => {
      const result = await getRoadmapBySlug({ data: { slug } });
      if (!result) throw notFound();
      return result;
    },
    staleTime: 1000 * 60 * 60,
  });

export const Route = createFileRoute("/r/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(slugQueryOptions(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Shared visa roadmap | VisaClarity" }] };
    }
    const title = `${loaderData.nationality} → ${loaderData.destination} (${loaderData.purpose}) visa roadmap`;
    const description = loaderData.roadmap.summary.slice(0, 160);
    const url = `${SITE_URL}/r/${loaderData.roadmap.shareSlug}`;
    return {
      meta: [
        { title: `${title} | VisaClarity` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-destructive mb-3">
          Something went wrong
        </p>
        <h1 className="font-display text-[28px] text-cream mb-4">Couldn't load roadmap</h1>
        <p className="text-[14px] text-muted-foreground mb-6">
          {(error as Error).message ?? "Unknown error"}
        </p>
        <Link
          to="/"
          className="inline-flex items-center h-11 px-6 bg-cream text-cream-foreground text-[13px] font-medium hover:bg-cream/90"
        >
          Back home
        </Link>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream mb-3">
          Not found
        </p>
        <h1 className="font-display text-[28px] text-cream mb-4">This roadmap doesn't exist</h1>
        <p className="text-[14px] text-muted-foreground mb-6">
          The link may be mistyped or the roadmap may have been removed.
        </p>
        <Link
          to="/"
          className="inline-flex items-center h-11 px-6 bg-cream text-cream-foreground text-[13px] font-medium hover:bg-cream/90"
        >
          Generate your own
        </Link>
      </div>
    </main>
  ),
  component: SharedRoadmapPage,
});

function SharedRoadmapPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(slugQueryOptions(slug));
  const destLower = data.destination.toLowerCase();
  const relatedPosts = BLOG_POSTS.filter(
    (p) =>
      p.title.toLowerCase().includes(destLower) || p.keywords.toLowerCase().includes(destLower),
  ).slice(0, 3);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="fixed top-3 right-3 md:top-4 md:right-4 z-50 no-print">
        <ThemeToggle />
      </div>
      <div className="print-only fixed top-0 left-0 right-0 px-6 py-2 border-b border-border-strong text-[10px] uppercase tracking-[0.18em] font-mono">
        VisaClarity · {data.nationality} → {data.destination} · {data.purpose}
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between no-print">
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Generate your own roadmap
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Shared roadmap
          </span>
        </div>

        <header className="mt-6 pb-8 border-b border-border-strong">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream mb-3">
            Visa roadmap · shared
          </p>
          <h1 className="font-display text-[36px] md:text-[48px] leading-[1.05] text-cream">
            {data.nationality} → {data.destination}
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Purpose: <span className="text-foreground">{data.purpose}</span>
          </p>
        </header>

        <RoadmapView roadmap={data.roadmap} relatedPosts={relatedPosts} />
      </div>
      <MobileTOC />
    </main>
  );
}
