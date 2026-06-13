/**
 * Research agent — Tavily Search (free 1k/mo).
 * Runs 6 parallel searches for the personalized roadmap brief and returns a
 * deduped citation bundle. Used by the crafting worker so Gemini only needs
 * one synthesis call instead of multi-step reasoning, saving credits.
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

export type ResearchBundle = {
  topic: string;
  citations: ResearchCitation[];
};

export type PersonalizedBrief = {
  nationality: string;
  destination: string;
  purpose: string;
  blockedAccountNeeded?: boolean;
  insuranceNeeded?: boolean;
  flightsNeeded?: boolean;
  hotelPreference?: string;
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
      console.warn("[tavily] non-200", res.status, await res.text().catch(() => ""));
      return [];
    }
    const json = (await res.json()) as { results?: TavilyResult[] };
    return json.results ?? [];
  } catch (err) {
    console.warn("[tavily] failed", (err as Error).message);
    return [];
  }
}

export async function researchPersonalizedRoadmap(
  brief: PersonalizedBrief,
): Promise<ResearchBundle[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("[research] TAVILY_API_KEY missing — proceeding without web research");
    return [];
  }

  const { nationality, destination, purpose } = brief;
  const queries: { topic: string; q: string }[] = [
    {
      topic: "Visa requirements & process",
      q: `${nationality} ${purpose} visa ${destination} 2026 official requirements site:.gov OR site:vfsglobal.com OR site:tlscontact.com`,
    },
    {
      topic: "E-visa portal",
      q: `${destination} e-visa portal apply ${nationality} official 2026`,
    },
    {
      topic: "Embassy & appointment booking",
      q: `${destination} embassy ${nationality} visa appointment booking portal 2026`,
    },
  ];

  if (brief.blockedAccountNeeded) {
    queries.push({
      topic: "Blocked account",
      q: `${destination} blocked account ${purpose} amount 2026 official requirement`,
    });
  }
  if (brief.insuranceNeeded !== false) {
    queries.push({
      topic: "Travel & health insurance",
      q: `${destination} visa travel health insurance minimum coverage requirement 2026`,
    });
  }
  if (brief.hotelPreference || brief.purpose) {
    queries.push({
      topic: "Hotel & accommodation proof",
      q: `${destination} visa hotel booking accommodation proof requirement 2026`,
    });
  }
  if (brief.flightsNeeded) {
    queries.push({
      topic: "Flight reservation for visa",
      q: `${destination} visa flight reservation dummy ticket proof 2026`,
    });
  }

  const settled = await Promise.allSettled(
    queries.map(async ({ topic, q }) => {
      const results = await tavilySearch(apiKey, q, 5);
      return {
        topic,
        citations: results.map((r) => ({
          title: r.title?.slice(0, 200) ?? "",
          url: r.url,
          snippet: (r.content ?? "").slice(0, 15000), // Generous snippet limit to prevent lossy truncation (Gemini supports large context windows)
        })),
      } satisfies ResearchBundle;
    }),
  );

  const bundles = settled
    .filter((s): s is PromiseFulfilledResult<ResearchBundle> => s.status === "fulfilled")
    .map((s) => s.value);

  // De-dupe URLs across bundles (keep first occurrence)
  const seen = new Set<string>();
  for (const b of bundles) {
    b.citations = b.citations.filter((c) => {
      if (!c.url || seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    });
  }
  return bundles;
}

export function flattenCitations(bundles: ResearchBundle[]): ResearchCitation[] {
  return bundles.flatMap((b) => b.citations);
}
