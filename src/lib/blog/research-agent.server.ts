/**
 * Research agent — free, no-card tools only.
 *
 * Sources (in order of trust for visa/legal facts):
 *  1. Direct fetch of allowed .gov/.edu/consulate/official-body domains
 *  2. Tavily search + extract (when TAVILY_API_KEY set)
 *  3. Wikipedia REST API (background only — never visa amounts)
 *  4. Wikidata SPARQL (entity facts)
 *  5. Crossref (academic refs)
 *  6. OpenAlex (academic refs)
 *  7. Hacker News Algolia (community context only)
 *  8. GDELT 2.0 DOC (news coverage)
 *  9. DuckDuckGo Instant Answer (lite background)
 *  10. Tinyfish (optional — only if TINYFISH_API_KEY exists)
 *
 * Every returned ResearchHit carries the verbatim URL and source tier so the
 * writer prompt can refuse to cite below-tier sources for specific claims.
 */

export type SourceTier = "official" | "search" | "encyclopedia" | "academic" | "news" | "community";

export interface ResearchHit {
  tool: string;
  tier: SourceTier;
  url: string;
  title: string;
  snippet: string;
  publishedAt?: string;
  raw?: unknown;
}

/** Allow-list for "official" tier direct fetch. */
const OFFICIAL_DOMAIN_PATTERNS = [
  /\.gov(\.[a-z]{2})?$/i,
  /\.gov\.[a-z]{2}$/i,
  /\.gob\.[a-z]{2}$/i,
  /\.gouv\.[a-z]{2}$/i,
  /europa\.eu$/i,
  /schengenvisainfo\.com$/i, // tier down to "search" below — kept here only for reference
  /\.edu$/i,
  /unhcr\.org$/i,
  /iom\.int$/i,
  /who\.int$/i,
  /worldbank\.org$/i,
  /diplo\.de$/i,
  /auswaertiges-amt\.de$/i,
  /diplomatie\.gouv\.fr$/i,
  /gov\.uk$/i,
];

function tierForHost(host: string): SourceTier {
  const h = host.toLowerCase();
  if (OFFICIAL_DOMAIN_PATTERNS.some((re) => re.test(h)) && !/schengenvisainfo\.com$/i.test(h)) {
    return "official";
  }
  if (/wikipedia\.org$/.test(h) || /wikidata\.org$/.test(h)) return "encyclopedia";
  if (/crossref\.org$/.test(h) || /openalex\.org$/.test(h) || /doi\.org$/.test(h))
    return "academic";
  if (/news\.ycombinator\.com$/.test(h) || /reddit\.com$/.test(h)) return "community";
  if (/gdelt/.test(h)) return "news";
  return "search";
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

const UA = process.env.VITE_SITE_URL
  ? `VisaClarityResearchBot/1.0 (+${process.env.VITE_SITE_URL})`
  : "VisaClarityResearchBot/1.0 (+https://visaclarity.lovable.app)";

async function fetchJSON<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000,
): Promise<T | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctl.signal,
      headers: { "User-Agent": UA, Accept: "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchText(url: string, timeoutMs = 10_000): Promise<string | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ---------- Tavily ----------
export async function tavilySearch(query: string, max = 6): Promise<ResearchHit[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  const body = {
    api_key: key,
    query,
    max_results: max,
    search_depth: "advanced",
    include_answer: false,
  };
  const json = await fetchJSON<{
    results?: Array<{ url: string; title: string; content: string; published_date?: string }>;
  }>(
    "https://api.tavily.com/search",
    { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } },
    25_000,
  );
  if (!json?.results) return [];
  return json.results.map((r) => ({
    tool: "tavily",
    tier: tierForHost(safeHost(r.url)),
    url: r.url,
    title: r.title ?? r.url,
    snippet: (r.content ?? "").slice(0, 15000), // Generous snippet limit to prevent lossy truncation (Gemini supports large context windows)
    publishedAt: r.published_date,
  }));
}

// ---------- Wikipedia ----------
export async function wikipediaLookup(topic: string): Promise<ResearchHit[]> {
  const slug = encodeURIComponent(topic.replace(/\s+/g, "_"));
  const j = await fetchJSON<{
    title: string;
    extract: string;
    content_urls?: { desktop?: { page?: string } };
  }>(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  if (!j?.extract) return [];
  return [
    {
      tool: "wikipedia",
      tier: "encyclopedia",
      url: j.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${slug}`,
      title: j.title,
      snippet: j.extract.slice(0, 800),
    },
  ];
}

// ---------- Wikidata SPARQL ----------
export async function wikidataSearch(query: string, max = 5): Promise<ResearchHit[]> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=${max}&search=${encodeURIComponent(query)}&origin=*`;
  const j = await fetchJSON<{
    search?: Array<{ id: string; label: string; description?: string; concepturi: string }>;
  }>(url);
  if (!j?.search) return [];
  return j.search.map((s) => ({
    tool: "wikidata",
    tier: "encyclopedia",
    url: s.concepturi,
    title: s.label,
    snippet: s.description ?? "",
  }));
}

// ---------- Crossref ----------
export async function crossrefSearch(query: string, max = 4): Promise<ResearchHit[]> {
  const url = `https://api.crossref.org/works?rows=${max}&query=${encodeURIComponent(query)}`;
  const j = await fetchJSON<{
    message?: {
      items?: Array<{
        DOI: string;
        title?: string[];
        abstract?: string;
        issued?: { "date-parts": number[][] };
        URL: string;
      }>;
    };
  }>(url);
  const items = j?.message?.items ?? [];
  return items.map((it) => ({
    tool: "crossref",
    tier: "academic",
    url: it.URL ?? `https://doi.org/${it.DOI}`,
    title: it.title?.[0] ?? it.DOI,
    snippet: (it.abstract ?? "").replace(/<[^>]+>/g, "").slice(0, 500),
    publishedAt: it.issued?.["date-parts"]?.[0]?.join("-"),
  }));
}

// ---------- OpenAlex ----------
export async function openAlexSearch(query: string, max = 4): Promise<ResearchHit[]> {
  const url = `https://api.openalex.org/works?per_page=${max}&search=${encodeURIComponent(query)}`;
  const j = await fetchJSON<{
    results?: Array<{
      id: string;
      title: string;
      abstract_inverted_index?: Record<string, number[]>;
      publication_year?: number;
      doi?: string;
    }>;
  }>(url);
  return (j?.results ?? []).map((r) => ({
    tool: "openalex",
    tier: "academic",
    url: r.doi ? `https://doi.org/${r.doi.replace(/^https?:\/\/doi\.org\//, "")}` : r.id,
    title: r.title ?? r.id,
    snippet: "",
    publishedAt: r.publication_year ? String(r.publication_year) : undefined,
  }));
}

// ---------- Hacker News (Algolia) ----------
export async function hnSearch(query: string, max = 4): Promise<ResearchHit[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=${max}&tags=story`;
  const j = await fetchJSON<{
    hits?: Array<{
      title?: string;
      url?: string;
      story_text?: string;
      objectID: string;
      created_at: string;
    }>;
  }>(url);
  return (j?.hits ?? [])
    .filter((h) => h.url || h.title)
    .map((h) => ({
      tool: "hn",
      tier: "community" as const,
      url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      title: h.title ?? "(HN thread)",
      snippet: (h.story_text ?? "").slice(0, 400),
      publishedAt: h.created_at,
    }));
}

// ---------- GDELT ----------
export async function gdeltSearch(query: string, max = 5): Promise<ResearchHit[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=${max}&format=json&sort=hybridrel`;
  const j = await fetchJSON<{
    articles?: Array<{ url: string; title: string; seendate: string; domain: string }>;
  }>(url);
  return (j?.articles ?? []).map((a) => ({
    tool: "gdelt",
    tier: tierForHost(a.domain),
    url: a.url,
    title: a.title,
    snippet: "",
    publishedAt: a.seendate,
  }));
}

// ---------- DuckDuckGo Instant Answer (lite background only) ----------
export async function duckDuckGoLite(query: string): Promise<ResearchHit[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const j = await fetchJSON<{
    AbstractURL?: string;
    AbstractText?: string;
    Heading?: string;
    RelatedTopics?: Array<{ FirstURL?: string; Text?: string }>;
  }>(url);
  const out: ResearchHit[] = [];
  if (j?.AbstractURL) {
    out.push({
      tool: "duckduckgo",
      tier: tierForHost(safeHost(j.AbstractURL)),
      url: j.AbstractURL,
      title: j.Heading ?? j.AbstractURL,
      snippet: j.AbstractText ?? "",
    });
  }
  for (const r of (j?.RelatedTopics ?? []).slice(0, 3)) {
    if (r.FirstURL) {
      out.push({
        tool: "duckduckgo",
        tier: tierForHost(safeHost(r.FirstURL)),
        url: r.FirstURL,
        title: (r.Text ?? r.FirstURL).slice(0, 120),
        snippet: r.Text ?? "",
      });
    }
  }
  return out;
}

// ---------- Direct fetch (official only) ----------
export async function directFetchOfficial(url: string): Promise<ResearchHit | null> {
  const host = safeHost(url);
  if (tierForHost(host) !== "official") return null;
  const html = await fetchText(url, 10_000);
  if (!html) return null;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return {
    tool: "direct-fetch",
    tier: "official",
    url,
    title: titleMatch?.[1]?.trim() ?? host,
    snippet: text,
  };
}

// ---------- Tinyfish (optional) ----------
export async function tinyfishSearch(query: string): Promise<ResearchHit[]> {
  const key = process.env.TINYFISH_API_KEY;
  if (!key) return [];
  // Minimal placeholder — Tinyfish API surface varies per plan. Treat any
  // failure as silent; the rest of the agent has us covered.
  try {
    const j = await fetchJSON<{
      results?: Array<{ url: string; title: string; snippet?: string }>;
    }>(`https://api.tinyfish.io/v1/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    return (j?.results ?? []).map((r) => ({
      tool: "tinyfish",
      tier: tierForHost(safeHost(r.url)),
      url: r.url,
      title: r.title,
      snippet: (r.snippet ?? "").slice(0, 500),
    }));
  } catch {
    return [];
  }
}

// ---------- Combined research run ----------
export interface ResearchBundle {
  topic: string;
  hits: ResearchHit[];
  byTool: Record<string, number>;
  byTier: Record<SourceTier, number>;
}

export async function runResearch(
  topic: string,
  keywords: string[],
  opts: { officialSeeds?: string[]; depth?: "fast" | "deep" } = {},
): Promise<ResearchBundle> {
  if (process.env.BLOG_AGENT_LOCAL_TEST === "1") {
    // Add sleep to simulate research latency in local testing mode
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const deduped: ResearchHit[] = [
      {
        tool: "mock-official",
        tier: "official",
        url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
        title: "Student Visa - travel.state.gov",
        snippet:
          "To study in the United States, you must obtain a student visa. Your course of study and the type of school you plan to attend determine whether you need an F visa or an M visa. Students must apply and be accepted by their school before applying for their visa. The F-1 visa is for academic students, and the M-1 visa is for vocational students. Application fee is $185 USD. Common requirements include form I-20, SEVIS fee payment, passport, and interview.",
      },
      {
        tool: "mock-official",
        tier: "official",
        url: "https://www.uscis.gov/working-in-the-united-states/students-and-employment",
        title: "Students and Employment | USCIS",
        snippet:
          "F-1 students may not work off-campus during the first academic year, but may accept on-campus employment subject to certain conditions and limitations. After their first academic year, F-1 students may engage in three types of off-campus employment: Curricular Practical Training (CPT), Optional Practical Training (OPT) (pre-completion or post-completion), and Science, Technology, Engineering, and Mathematics (STEM) Optional Practical Training Extension.",
      },
      {
        tool: "mock-official",
        tier: "official",
        url: "https://www.ice.gov/sevis/schools",
        title: "SEVP Certified Schools | ICE",
        snippet:
          "The Student and Exchange Visitor Program (SEVP) monitors school certification and student status. The Student and Exchange Visitor Information System (SEVIS) is the web-based system that maintains information on SEVP-certified schools, F-1 and M-1 students. DSOs (Designated School Officials) issue Form I-20 to students who are admitted to their program.",
      },
    ];

    const byTool = { "mock-official": 3 };
    const byTier: Record<SourceTier, number> = {
      official: 3,
      authority: 0,
      partner: 0,
      trusted: 0,
      quality: 0,
      news: 0,
      opinion: 0,
      // Mapping extra keys for backward compatibility
      search: 0,
      encyclopedia: 0,
      academic: 0,
      community: 0,
    } as any;
    return { topic, hits: deduped, byTool, byTier };
  }

  const q = [topic, ...keywords].filter(Boolean).join(" ");
  const depth = opts.depth ?? "deep";

  const tasks: Promise<ResearchHit[]>[] = [
    tavilySearch(q, depth === "deep" ? 8 : 5),
    wikipediaLookup(topic),
    wikidataSearch(topic, 4),
    crossrefSearch(q, 3),
    openAlexSearch(q, 3),
    hnSearch(q, 3),
    gdeltSearch(q, 5),
    duckDuckGoLite(q),
    tinyfishSearch(q),
  ];
  const results = await Promise.allSettled(tasks);
  const hits: ResearchHit[] = [];
  for (const r of results) if (r.status === "fulfilled") hits.push(...r.value);

  // Direct fetch official seeds + the top 3 official-tier URLs that surfaced.
  const officialSeeds = opts.officialSeeds ?? [];
  const officialFromHits = hits
    .filter((h) => h.tier === "official")
    .slice(0, 3)
    .map((h) => h.url);
  const toFetch = [...new Set([...officialSeeds, ...officialFromHits])].slice(0, 5);
  const fetched = await Promise.allSettled(toFetch.map(directFetchOfficial));
  for (const f of fetched) if (f.status === "fulfilled" && f.value) hits.push(f.value);

  // Dedupe by URL.
  const seen = new Set<string>();
  const deduped = hits.filter((h) => (seen.has(h.url) ? false : (seen.add(h.url), true)));

  const byTool: Record<string, number> = {};
  const byTier = {
    official: 0,
    search: 0,
    encyclopedia: 0,
    academic: 0,
    news: 0,
    community: 0,
  } as Record<SourceTier, number>;
  for (const h of deduped) {
    byTool[h.tool] = (byTool[h.tool] ?? 0) + 1;
    byTier[h.tier]++;
  }
  return { topic, hits: deduped, byTool, byTier };
}
