import React from "react";

export function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const inlineToReact = (text: string): (string | React.ReactNode)[] => {
    const parts: (string | React.ReactNode)[] = [];
    const regex =
      /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\^[0-9]+\]|\[NEEDS OFFICIAL SOURCE\]|\[NEEDS SOURCE\])/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text))) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith("**")) parts.push(<strong key={`s${key++}`}>{tok.slice(2, -2)}</strong>);
      else if (tok.startsWith("*")) parts.push(<em key={`e${key++}`}>{tok.slice(1, -1)}</em>);
      else if (tok.startsWith("`"))
        parts.push(
          <code
            key={`c${key++}`}
            className="px-1.5 py-0.5 rounded bg-muted/70 text-[0.9em] font-mono"
          >
            {tok.slice(1, -1)}
          </code>,
        );
      else if (tok.startsWith("[^")) {
        const n = tok.slice(2, -1);
        parts.push(
          <sup key={`f${key++}`}>
            <span className="text-cream no-underline hover:underline cursor-help font-semibold">
              [{n}]
            </span>
          </sup>,
        );
      } else if (tok === "[NEEDS OFFICIAL SOURCE]" || tok === "[NEEDS SOURCE]") {
        parts.push(
          <span
            key={`w${key++}`}
            className="inline-flex items-center gap-1 mx-1.5 px-2 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-sans font-semibold align-middle uppercase tracking-wider border border-red-500/10 animate-pulse"
          >
            ⚠️ Needs Source
          </span>,
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
          className="mt-14 mb-6 font-display text-[28px] md:text-[34px] leading-[1.2] text-foreground font-medium"
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
          className="mt-10 mb-4 font-display text-[20px] md:text-[24px] text-foreground font-medium"
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

export function MarkdownPreview({
  text,
  title,
  subtitle,
  category,
  heroImageUrl,
  heroImageAlt,
  author,
  sources,
  generationMeta,
  updatedAt,
}: {
  text: string;
  title?: string;
  subtitle?: string;
  category?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  author?: { name: string; avatar_url?: string | null; locale_hint?: string | null } | null;
  sources?: Array<{ index: number; tier: string; url: string; title: string }>;
  generationMeta?: any;
  updatedAt?: string;
}) {
  const tldr = generationMeta?.tldr ?? [];

  return (
    <div className="max-w-[760px] mx-auto bg-background text-foreground border border-border-strong/65 rounded-md p-6 sm:p-10 shadow-lg font-sans text-left">
      <nav
        aria-label="Breadcrumb"
        className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
      >
        <span>Blog</span>
        <span className="mx-2">/</span>
        <span className="text-cream font-semibold">{category || "Guide"}</span>
      </nav>

      <h1 className="mt-6 font-display font-normal text-[32px] sm:text-[44px] leading-[1.12] text-foreground tracking-tight">
        {title || "Untitled Article"}
      </h1>

      {subtitle && (
        <p className="mt-4 text-[18px] sm:text-[20px] leading-[1.45] text-muted-foreground italic font-serif">
          {subtitle}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-border/50 pb-5">
        {author ? (
          <div className="flex items-center gap-3">
            {author.avatar_url ? (
              <img src={author.avatar_url} alt="" className="size-9 rounded-full object-cover" />
            ) : (
              <div className="size-9 rounded-full bg-cream/20 flex items-center justify-center font-bold text-[12px] text-cream">
                {author.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[13px] font-semibold text-foreground leading-normal">
                {author.name}
              </p>
              <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                {author.locale_hint ? `${author.locale_hint} · ` : ""}
                {updatedAt
                  ? new Date(updatedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Draft Date"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-[12px] text-muted-foreground italic">No author assigned</div>
        )}
      </div>

      {heroImageUrl && (
        <figure className="mt-8">
          <img
            src={heroImageUrl}
            alt={heroImageAlt || title}
            className="w-full rounded-md object-cover aspect-[3/2] border border-border/40"
          />
          {heroImageAlt && (
            <figcaption className="mt-2 text-center text-[11px] text-muted-foreground italic">
              {heroImageAlt}
            </figcaption>
          )}
        </figure>
      )}

      {tldr.length > 0 && (
        <aside className="mt-8 p-5 rounded border border-border-strong bg-card/60">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-cream font-bold">
            TL;DR
          </p>
          <ul className="mt-2.5 space-y-2">
            {tldr.map((t: string, i: number) => (
              <li
                key={i}
                className="text-[14px] leading-[1.5] text-foreground/85 pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-cream"
              >
                {t}
              </li>
            ))}
          </ul>
        </aside>
      )}

      <article className="mt-8 prose-article font-serif text-[17px] leading-[1.75] text-foreground/90">
        {renderMarkdown(text)}
      </article>

      {sources && sources.length > 0 && (
        <section className="mt-16 pt-8 border-t border-border-strong">
          <h2 className="font-display text-[20px] text-foreground font-semibold">Sources</h2>
          <ol className="mt-4 space-y-2.5 list-decimal pl-5">
            {sources.map((s: any) => (
              <li key={s.index} className="text-[13px] leading-[1.5] text-muted-foreground">
                <a
                  href={s.url}
                  target="_blank"
                  rel="nofollow noopener"
                  className="text-foreground hover:text-cream underline-offset-4 hover:underline"
                >
                  {s.title}
                </a>
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.16em] text-cream font-semibold">
                  {s.tier}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-16 pt-8 border-t border-border-strong">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-cream font-bold">
          Get your own roadmap
        </p>
        <h2 className="mt-3 font-display text-[24px] leading-[1.2] text-foreground font-medium">
          A personalized version of this guide
          <br />
          <em className="italic text-cream font-normal">for your exact route.</em>
        </h2>
        <p className="mt-4 text-[13px] leading-[1.6] text-muted-foreground">
          Three inputs. One free roadmap with exact amounts, processing times for your consulate,
          and rejection patterns specific to your nationality.
        </p>
        <div className="mt-6 border border-dashed border-border-strong/60 p-4 rounded bg-muted/20 text-center text-[12px] text-muted-foreground">
          [ LeadForm Roadmap Callout Preview ]
        </div>
      </section>
    </div>
  );
}
