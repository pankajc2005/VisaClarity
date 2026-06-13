/**
 * Research agent for standard visa roadmaps — Tavily Search (free 1k/mo).
 * Runs parallel searches for standard roadmap briefs and returns a
 * deduped citation bundle.
 */

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

export type ResearchCitation = {
  title: string;
  url: string;
  snippet: string;
};

async function tavilySearch(
  apiKey: string,
  query: string,
  maxResults = 5,
): Promise<TavilyResult[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    if (!res.ok) {
      console.warn("[tavily-standard] non-200", res.status, await res.text().catch(() => ""));
      return [];
    }
    const json = (await res.json()) as { results?: TavilyResult[] };
    return json.results ?? [];
  } catch (err) {
    console.warn("[tavily-standard] failed", (err as Error).message);
    return [];
  }
}

export async function researchStandardRoadmap(
  nationality: string,
  destination: string,
  purpose: string,
): Promise<ResearchCitation[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("[research-standard] TAVILY_API_KEY missing — proceeding without web research");
    return [];
  }

  const queries = [
    {
      topic: "Visa requirements & process",
      q: `${nationality} ${purpose} visa ${destination} 2026 official requirements site:.gov OR site:vfsglobal.com OR site:tlscontact.com`,
    },
    {
      topic: "Visa fees",
      q: `${destination} visa fee for ${nationality} citizen ${purpose} 2026`,
    },
    {
      topic: "Visa processing times",
      q: `${destination} visa application processing time in ${nationality} 2026`,
    },
    {
      topic: "Embassy and consulate contacts",
      q: `${destination} embassy consulate ${nationality} contact details 2026`,
    },
  ];

  const settled = await Promise.allSettled(
    queries.map(async ({ q }) => {
      const results = await tavilySearch(apiKey, q, 3);
      return results.map((r) => ({
        title: r.title?.slice(0, 200) ?? "",
        url: r.url,
        snippet: (r.content ?? "").slice(0, 15000), // Generous snippet limit to prevent lossy truncation (Gemini supports large context windows)
      })) satisfies ResearchCitation[];
    }),
  );

  const citations: ResearchCitation[] = [];
  const seen = new Set<string>();

  for (const result of settled) {
    if (result.status === "fulfilled") {
      for (const citation of result.value) {
        if (citation.url && !seen.has(citation.url)) {
          seen.add(citation.url);
          citations.push(citation);
        }
      }
    }
  }

  return citations.slice(0, 12); // Return top 12 unique citations
}
