import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import type { ChangeEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { listPublishedPosts } from "@/lib/blog/blog.functions";
import { SITE_URL } from "@/lib/core/platform";

const PAGE_TITLE = "Visa Guides & Country Checklists | VisaClarity";
const PAGE_DESCRIPTION =
  "In-depth visa guides: exact amounts, document checklists, processing times, and rejection patterns by country and visa type.";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  hero_image_url?: string;
  hero_image_alt?: string;
  reading_minutes: number;
  published_at?: string;
  author_id?: string;
};

const postsQuery = queryOptions({
  queryKey: ["blog", "published"],
  queryFn: () => listPublishedPosts(),
});

const SearchSchema = z
  .object({
    q: z.string().optional(),
    category: z.string().optional(),
  })
  .passthrough();

export const Route = createFileRoute("/blog/")({
  validateSearch: (search) => SearchSchema.parse(search),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: SITE_URL + "/blog" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/blog" }],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <p>Could not load guides: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-10">Not found</div>,
  component: BlogIndex,
});

function BlogIndex() {
  const { data } = useSuspenseQuery(postsQuery);
  const { q, category } = useSearch({ from: "/blog" });
  const navigate = useNavigate({ from: "/blog" });
  const posts = data.posts;
  const authorsById = new Map(data.authors.map((a) => [a.id, a]));

  const uniqueCategories = Array.from(
    new Set(posts.map((p: BlogPost) => p.category).filter(Boolean)),
  ).sort();
  const activeCategory = category || "All";
  const searchQuery = q || "";

  const filteredPosts = posts.filter((p: BlogPost) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const searchTarget = (p.title + " " + (p.description || "")).toLowerCase();
    const matchesSearch = !searchQuery || searchTarget.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (newCategory: string) => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        category: newCategory === "All" ? undefined : newCategory,
      }),
    });
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        q: val || undefined,
      }),
      replace: true,
    });
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filteredPosts.map((p: BlogPost, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  const [hero, ...rest] = filteredPosts;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <nav className="fixed top-0 inset-x-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto h-full px-6 md:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block size-1.5 bg-cream rounded-full" />
            <span className="text-[15px] font-medium text-foreground">VisaClarity</span>
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <Link
              to="/blog"
              className="hidden sm:inline text-[13px] text-foreground hover:text-cream transition-colors"
            >
              Guides
            </Link>
            <Link
              to="/"
              className="inline-flex items-center h-9 px-3 md:px-5 rounded-full bg-cream text-cream-foreground text-[12px] md:text-[13px] font-medium hover:bg-cream/90 transition-colors"
            >
              Get Roadmap
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="pt-[120px] pb-32 px-6 md:px-10">
        <header className="max-w-[900px] mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Visa Guides
          </p>
          <h1 className="mt-6 font-display font-normal text-[44px] md:text-[64px] leading-[1.05] text-foreground">
            In-depth guides for the
            <br />
            <em className="italic text-cream font-normal">visa you are applying for.</em>
          </h1>
          <p className="mt-8 max-w-[640px] text-[16px] leading-[1.7] text-muted-foreground">
            Country-specific document checklists, exact financial amounts, real processing times,
            and the rejection patterns we see on each route.
          </p>
        </header>

        {/* Filters and Search */}
        <div className="mt-12 max-w-[1100px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {["All", ...uniqueCategories].map((cat: string) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 bg-card border-border h-9"
            />
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="mt-20 max-w-[900px] mx-auto text-center text-muted-foreground">
            No guides published yet.
          </p>
        ) : filteredPosts.length === 0 ? (
          <p className="mt-20 max-w-[900px] mx-auto text-center text-muted-foreground">
            No guides match your search.
          </p>
        ) : (
          <>
            {hero && (
              <Link
                to="/blog/$slug"
                params={{ slug: hero.slug }}
                className="block mt-16 max-w-[1100px] mx-auto group"
              >
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  {hero.hero_image_url ? (
                    <div className="aspect-[3/2] overflow-hidden rounded-lg bg-card">
                      <img
                        src={hero.hero_image_url}
                        alt={hero.hero_image_alt ?? hero.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/2] rounded-lg bg-gradient-to-br from-card to-background" />
                  )}
                  <div>
                    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em]">
                      <span className="text-cream">{hero.category}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{hero.reading_minutes} min read</span>
                    </div>
                    <h2 className="mt-4 font-display text-[28px] md:text-[40px] leading-[1.15] text-foreground group-hover:text-cream transition-colors">
                      {hero.title}
                    </h2>
                    {hero.subtitle && (
                      <p className="mt-3 text-[16px] text-muted-foreground">{hero.subtitle}</p>
                    )}
                    <p className="mt-4 text-[15px] leading-[1.7] text-muted-foreground line-clamp-3">
                      {hero.description}
                    </p>
                    {hero.author_id && authorsById.get(hero.author_id) && (
                      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        By {authorsById.get(hero.author_id)!.name}
                        {authorsById.get(hero.author_id)!.locale_hint
                          ? ` · ${authorsById.get(hero.author_id)!.locale_hint}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )}

            <div className="mt-20 max-w-[1100px] mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((post: BlogPost) => {
                const a = post.author_id ? authorsById.get(post.author_id) : null;
                return (
                  <Link
                    key={post.slug}
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="group block"
                  >
                    {post.hero_image_url ? (
                      <div className="aspect-[3/2] overflow-hidden rounded-lg bg-card">
                        <img
                          src={post.hero_image_url}
                          alt={post.hero_image_alt ?? post.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/2] rounded-lg bg-gradient-to-br from-card to-background" />
                    )}
                    <div className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
                      <span className="text-cream">{post.category}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{post.reading_minutes} min</span>
                    </div>
                    <h3 className="mt-3 font-display text-[20px] md:text-[22px] leading-[1.25] text-foreground group-hover:text-cream transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.65] text-muted-foreground line-clamp-2">
                      {post.description}
                    </p>
                    {a && (
                      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {a.name}
                        {a.locale_hint ? ` · ${a.locale_hint}` : ""}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
