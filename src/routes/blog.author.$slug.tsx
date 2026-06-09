import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { getAuthor } from "@/lib/blog/blog.functions";
import { SITE_URL } from "@/lib/core/platform";

const authorQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", "author", slug],
    queryFn: () => getAuthor({ data: { slug } }),
  });

export const Route = createFileRoute("/blog/author/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(authorQuery(params.slug));
    if (!data.author) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const a = loaderData?.author;
    if (!a) return { meta: [{ title: "Author not found" }] };
    const url = `${SITE_URL}/blog/author/${a.slug}`;
    return {
      meta: [
        { title: `${a.name} — VisaClarity Writer` },
        { name: "description", content: a.bio.slice(0, 160) },
        { property: "og:title", content: `${a.name} — VisaClarity` },
        { property: "og:description", content: a.bio.slice(0, 200) },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        ...(a.avatar_url ? [{ property: "og:image", content: a.avatar_url }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: ({ error }) => <div className="p-10">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-10">Author not found</div>,
  component: AuthorPage,
});

function AuthorPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(authorQuery(slug));
  const author = data.author!;
  const posts = data.posts;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 inset-x-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto h-full px-6 md:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block size-1.5 bg-cream rounded-full" />
            <span className="text-[15px] font-medium text-foreground">VisaClarity</span>
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/blog" className="text-[13px] text-foreground">
              Guides
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="pt-[120px] pb-24 px-6 md:px-10">
        <header className="max-w-[720px] mx-auto flex items-start gap-6">
          {author.avatar_url ? (
            <img src={author.avatar_url} alt="" className="size-20 rounded-full object-cover" />
          ) : (
            <div className="size-20 rounded-full bg-cream/20" />
          )}
          <div>
            <h1 className="font-display text-[34px] md:text-[44px] leading-[1.1] text-foreground">
              {author.name}
            </h1>
            {author.locale_hint && (
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {author.locale_hint}
              </p>
            )}
            <p className="mt-4 text-[16px] leading-[1.7] text-muted-foreground">{author.bio}</p>
          </div>
        </header>

        <section className="mt-16 max-w-[1100px] mx-auto">
          <h2 className="font-display text-[22px] text-foreground">
            Latest from {author.name.split(" ")[0]}
          </h2>
          {posts.length === 0 ? (
            <p className="mt-4 text-muted-foreground">No published posts yet.</p>
          ) : (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((p: any) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="block group"
                >
                  {p.hero_image_url ? (
                    <div className="aspect-[3/2] overflow-hidden rounded-md bg-card">
                      <img
                        src={p.hero_image_url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/2] rounded-md bg-gradient-to-br from-card to-background" />
                  )}
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cream">
                    {p.category}
                  </p>
                  <p className="mt-1 text-[17px] font-medium text-foreground group-hover:text-cream transition-colors">
                    {p.title}
                  </p>
                  <p className="mt-2 text-[13px] text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
