import type { ReactNode } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import serializeJavascript from "serialize-javascript";
import { LeadForm } from "@/components/landing/LeadForm";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { getPublishedPost } from "@/lib/blog/blog.functions";
import { SITE_URL } from "@/lib/core/platform";

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", "post", slug],
    queryFn: () => getPublishedPost({ data: { slug } }),
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!data.post) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Guide not found | VisaClarity" }] };
    const url = `${SITE_URL}/blog/${post.slug}`;
    const meta: Array<{ name?: string; property?: string; content: string; title?: string }> = [
      { title: `${post.title} | VisaClarity` } as { title: string; content: string },
      { name: "description", content: post.description },
      { name: "keywords", content: post.keywords },
      { property: "og:title", content: post.title },
      { property: "og:description", content: post.description },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { property: "article:published_time", content: post.published_at ?? "" },
      { property: "article:section", content: post.category },
      { name: "twitter:title", content: post.title },
      { name: "twitter:description", content: post.description },
      { name: "twitter:card", content: post.hero_image_url ? "summary_large_image" : "summary" },
    ];
    if (post.hero_image_url) {
      meta.push({ property: "og:image", content: post.hero_image_url });
      meta.push({ name: "twitter:image", content: post.hero_image_url });
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-foreground">
      <p>Could not load: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <div className="text-center max-w-md">
        <h1 className="font-display text-[40px]">Guide not found</h1>
        <p className="mt-3 text-muted-foreground">That guide does not exist.</p>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center h-10 px-5 rounded-full bg-cream text-cream-foreground text-[13px] font-medium"
        >
          See all guides
        </Link>
      </div>
    </div>
  ),
  component: BlogPostPage,
});

/** Minimal, safe Markdown renderer for our writer output. Handles ## headings,
 *  ### subheadings, paragraphs, ordered/unordered lists, bold, italic, inline
 *  code, and footnote citation refs [^N]. No HTML pass-through (XSS-safe). */
function renderMarkdown(md: string): ReactNode[] {
  const lines = md.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const inlineToReact = (text: string): (string | ReactNode)[] => {
    // Split on inline tokens.
    const parts: (string | ReactNode)[] = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\^[0-9]+\])/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text))) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith("**")) parts.push(<strong key={`s${key++}`}>{tok.slice(2, -2)}</strong>);
      else if (tok.startsWith("*")) parts.push(<em key={`e${key++}`}>{tok.slice(1, -1)}</em>);
      else if (tok.startsWith("`"))
        parts.push(
          <code key={`c${key++}`} className="px-1.5 py-0.5 rounded bg-card text-[0.9em]">
            {tok.slice(1, -1)}
          </code>,
        );
      else if (tok.startsWith("[^")) {
        const n = tok.slice(2, -1);
        parts.push(
          <sup key={`f${key++}`}>
            <a href={`#src-${n}`} className="text-cream no-underline hover:underline">
              [{n}]
            </a>
          </sup>,
        );
      }
      last = m.index + tok.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={`b${key++}`}
          className="mt-14 mb-6 font-display text-[28px] md:text-[34px] leading-[1.2] text-foreground"
        >
          {inlineToReact(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={`b${key++}`}
          className="mt-10 mb-4 font-display text-[20px] md:text-[24px] text-foreground"
        >
          {inlineToReact(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <blockquote
          key={`b${key++}`}
          className="my-10 pl-6 border-l-2 border-cream text-[18px] md:text-[20px] leading-[1.6] text-foreground/90 italic"
        >
          {inlineToReact(buf.join(" "))}
        </blockquote>,
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`b${key++}`} className="my-6 space-y-3 list-none">
          {items.map((it, idx) => (
            <li
              key={idx}
              className="text-[17px] leading-[1.75] text-foreground/85 pl-6 relative before:content-['—'] before:absolute before:left-0 before:text-cream"
            >
              {inlineToReact(it)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`b${key++}`} className="my-6 space-y-3 list-decimal pl-6">
          {items.map((it, idx) => (
            <li key={idx} className="text-[17px] leading-[1.75] text-foreground/85 pl-1">
              {inlineToReact(it)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }
    // paragraph (collect until blank)
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6} |> |[-*] |\d+\. )/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={`b${key++}`} className="my-5 text-[18px] leading-[1.8] text-foreground/85">
        {inlineToReact(buf.join(" "))}
      </p>,
    );
  }
  return blocks;
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(slug));
  const post = data.post!;
  const author = data.author;
  const related = data.related;
  const url = `${SITE_URL}/blog/${post.slug}`;

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    image: post.hero_image_url ? [post.hero_image_url] : undefined,
    author: author
      ? { "@type": "Person", name: author.name }
      : { "@type": "Organization", name: "VisaClarity" },
    publisher: { "@type": "Organization", name: "VisaClarity", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: SITE_URL + "/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  const sources = Array.isArray(post.sources)
    ? (post.sources as Array<{ index: number; tier: string; url: string; title: string }>)
    : [];
  const meta = (post.generation_meta ?? {}) as { tldr?: string[]; confidence?: string };
  const tldr = meta.tldr ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: serializeJavascript(articleLd, { isJSON: true }) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: serializeJavascript(breadcrumbLd, { isJSON: true }) }}
      />

      <div className="fixed top-0 inset-x-0 h-0.5 bg-transparent z-50">
        <div className="h-full bg-cream transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <nav className="fixed top-0 inset-x-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto h-full px-6 md:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block size-1.5 bg-cream rounded-full" />
            <span className="text-[15px] font-medium text-foreground">VisaClarity</span>
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <Link
              to="/blog"
              className="hidden sm:inline text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              All Guides
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

      <main>
        <article className="pt-[120px] pb-20">
          <header className="max-w-[720px] mx-auto px-6 md:px-0">
            <nav
              aria-label="Breadcrumb"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              <Link to="/blog" className="hover:text-cream">
                Blog
              </Link>
              <span className="mx-2">/</span>
              <span className="text-cream">{post.category}</span>
            </nav>
            <h1 className="mt-6 font-display font-normal text-[36px] md:text-[56px] leading-[1.08] text-foreground">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mt-5 text-[20px] leading-[1.45] text-muted-foreground">
                {post.subtitle}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {author && (
                <Link
                  to="/blog/author/$slug"
                  params={{ slug: author.slug }}
                  className="flex items-center gap-3 group"
                >
                  {author.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt=""
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-cream/20" />
                  )}
                  <div>
                    <p className="text-[14px] font-medium text-foreground group-hover:text-cream transition-colors">
                      {author.name}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {author.locale_hint ? `${author.locale_hint} · ` : ""}
                      {post.published_at &&
                        new Date(post.published_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      {" · "}
                      {post.reading_minutes} min read
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </header>

          {post.hero_image_url && (
            <figure className="mt-10 max-w-[1100px] mx-auto px-6 md:px-0">
              <img
                src={post.hero_image_url}
                alt={post.hero_image_alt ?? post.title}
                className="w-full rounded-lg object-cover aspect-[3/2]"
              />
              {post.hero_image_alt && (
                <figcaption className="mt-3 text-center text-[12px] text-muted-foreground italic">
                  {post.hero_image_alt}
                </figcaption>
              )}
            </figure>
          )}

          <div className="mt-12 max-w-[720px] mx-auto px-6 md:px-0">
            {tldr.length > 0 && (
              <aside className="mb-10 p-6 rounded-lg border border-border-strong bg-card">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream">
                  TL;DR
                </p>
                <ul className="mt-3 space-y-2">
                  {tldr.map((t, i) => (
                    <li
                      key={i}
                      className="text-[15px] leading-[1.6] text-foreground/85 pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-cream"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <div className="prose-article font-serif">{renderMarkdown(post.body_mdx)}</div>

            {sources.length > 0 && (
              <section className="mt-20 pt-10 border-t border-border-strong">
                <h2 className="font-display text-[22px] md:text-[26px] text-foreground">Sources</h2>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Last verified: {new Date(post.updated_at).toISOString().slice(0, 10)}
                </p>
                <ol className="mt-6 space-y-3 list-decimal pl-6">
                  {sources.map((s) => (
                    <li
                      key={s.index}
                      id={`src-${s.index}`}
                      className="text-[14px] leading-[1.6] text-muted-foreground"
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="nofollow noopener"
                        className="text-foreground hover:text-cream underline-offset-4 hover:underline"
                      >
                        {s.title}
                      </a>
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream">
                        {s.tier}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="mt-20 pt-10 border-t border-border-strong">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream">
                Get your own roadmap
              </p>
              <h2 className="mt-4 font-display text-[28px] md:text-[36px] leading-[1.15] text-foreground">
                A personalized version of this guide
                <br />
                <em className="italic text-cream font-normal">for your exact route.</em>
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground">
                Three inputs. One free roadmap with exact amounts, processing times for your
                consulate, and rejection patterns specific to your nationality.
              </p>
              <div className="mt-8">
                <LeadForm idPrefix={`blog-${post.slug}`} />
              </div>
            </section>

            {related.length > 0 && (
              <section className="mt-20 pt-10 border-t border-border-strong">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  More guides
                </p>
                <div className="mt-6 grid sm:grid-cols-3 gap-6">
                  {related.map((r: any) => (
                    <Link
                      key={r.slug}
                      to="/blog/$slug"
                      params={{ slug: r.slug }}
                      className="block group"
                    >
                      {r.hero_image_url ? (
                        <div className="aspect-[3/2] rounded-md overflow-hidden bg-card">
                          <img
                            src={r.hero_image_url}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[3/2] rounded-md bg-gradient-to-br from-card to-background" />
                      )}
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cream">
                        {r.category}
                      </p>
                      <p className="mt-1 text-[15px] font-medium text-foreground group-hover:text-cream transition-colors">
                        {r.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
