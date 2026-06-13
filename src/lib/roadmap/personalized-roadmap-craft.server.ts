/**
 * Synthesis agent — single Gemini Flash Lite call.
 * Combines the user's personal brief with the Tavily research bundle and
 * produces a roadmap JSON in the SAME shape as the existing AI roadmap
 * (RoadmapSchema), so existing PDF/DOCX exporters render it natively.
 *
 * The personalization (booking flows, blocked account, insurance, e-visa,
 * currency-accurate amounts) is folded into the standard sections —
 * `steps`, `documents`, `financialRequirements`, `proTips`, `sources` —
 * which the existing premium export already renders beautifully.
 */
import type { ResearchBundle } from "./personalized-roadmap-research.server";

type Profile = {
  nationality: string;
  destination: string;
  purpose: string;
  travelDatesFrom?: string;
  travelDatesTo?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  incomeMonthly?: number;
  incomeCurrency?: string;
  sponsor?: { hasSponsor?: boolean; relation?: string; notes?: string };
  blockedAccountNeeded?: boolean;
  insuranceNeeded?: boolean;
  flightsNeeded?: boolean;
  hotelPreference?: string;
  employmentStatus?: string;
  familyTies?: string;
  priorRefusals?: string;
  additionalContext?: string;
};

const SYSTEM_PROMPT = `You are a senior immigration & travel consultant building a PERSONAL, hand-tailored visa roadmap for a paying premium customer (10–15 min crafting window).

You receive:
  (a) the customer's full profile,
  (b) a research bundle of verified citations (titles, URLs, snippets).

Build ONE consolidated roadmap that BOTH contains the standard generalized visa info AND is deeply personalized to this exact case.

Hard rules:
1. NEVER FABRICATE. Omit any field you are not sure about (empty string) instead of guessing. Use citation URLs verbatim — never invent URLs.
2. PERSONALIZE EVERY SECTION to the customer's nationality, destination, purpose, dates, budget, sponsor, blocked-account need, insurance need, hotel preference, employment, family ties, prior refusals, and additional context they shared.
3. CURRENCY-ACCURATE money: ALWAYS show amounts in destination's local currency AND the customer's budget currency (use ISO codes). If budgetCurrency is provided, give equivalents in that currency too.
4. EXHAUSTIVE step-by-step: 10–14 chronological steps. For each step that involves a booking (hotel, insurance, blocked account, flight, e-visa, embassy appointment), expand actionItems into a GRANULAR walkthrough (open portal → field-by-field guidance → upload requirements → expected confirmation → what to keep).
5. INCLUDE these dedicated steps when relevant to the profile:
   - "Open blocked account" with provider options, exact amount, transfer flow (only if blockedAccountNeeded).
   - "Buy travel/health insurance" with minimum coverage figures, recommended providers, what to attach to application.
   - "Book accommodation proof" with hotel-booking strategy (refundable bookings, sponsor letter alternative).
   - "Apply on e-visa portal" with the exact portal URL, step-by-step on-portal instructions.
   - "Reserve flights" with dummy-ticket vs real-ticket guidance (only if flightsNeeded).
6. financialRequirements MUST cover: visa fee, biometrics fee, blocked account (if any), insurance premium estimate, accommodation budget, flights estimate, daily living estimate. Each item shows local-currency amount AND customer-currency equivalent.
7. documents MUST be tailored: list extras specific to the case (sponsor letter if sponsor=yes, employment letter / leave approval if employed, ITR if self-employed, refusal explanation letter if priorRefusals, etc.). Mark critical items.
8. commonRejectionReasons: 4–6 specific to THIS profile, each with implicit fix in wording.
9. proTips: 6–10 insider tips that reference the customer's specifics (e.g. "Your travel dates fall during X visa rush — book biometrics 6 weeks earlier").
10. EACH SOURCE in the research bundle may contain detailed figures, exemptions, and procedural edge cases — read them fully. Do not omit specific amounts, dates, or conditional requirements even if they seem like edge cases.
11. sources MUST be drawn from the provided citations whenever possible. Do not invent URLs.
12. Output ONLY valid JSON matching the schema. No markdown, no commentary.`;

const RESPONSE_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  required: [
    "summary",
    "visaType",
    "estimatedProcessingTime",
    "estimatedTotalCost",
    "difficulty",
    "difficultyReason",
    "steps",
    "documents",
    "financialRequirements",
    "postArrival",
    "commonRejectionReasons",
    "proTips",
    "sources",
  ],
  properties: {
    summary: { type: "string" },
    visaType: { type: "string" },
    estimatedProcessingTime: { type: "string" },
    estimatedTotalCost: { type: "string" },
    difficulty: { type: "string", enum: ["Easy", "Moderate", "Hard", "Very Hard"] },
    difficultyReason: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["order", "title", "timeframe", "description", "actionItems"],
        properties: {
          order: { type: "number" },
          title: { type: "string" },
          timeframe: { type: "string" },
          description: { type: "string" },
          actionItems: { type: "array", items: { type: "string" } },
        },
      },
    },
    documents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "details", "critical"],
        properties: {
          name: { type: "string" },
          details: { type: "string" },
          critical: { type: "boolean" },
        },
      },
    },
    financialRequirements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "amount", "note"],
        properties: {
          item: { type: "string" },
          amount: { type: "string" },
          note: { type: "string" },
        },
      },
    },
    postArrival: { type: "array", items: { type: "string" } },
    commonRejectionReasons: { type: "array", items: { type: "string" } },
    proTips: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "url"],
        properties: { title: { type: "string" }, url: { type: "string" } },
      },
    },
  },
};

function buildUserPrompt(
  profile: Profile,
  research: ResearchBundle[],
  ratesContext?: string,
): string {
  const lines: string[] = [];
  lines.push("CUSTOMER PROFILE:");
  lines.push(JSON.stringify(profile, null, 2));
  lines.push("");
  if (ratesContext) {
    lines.push(ratesContext);
    lines.push("");
  }
  lines.push("RESEARCH BUNDLE (verified web citations — use only these URLs in `sources`):");
  for (const b of research) {
    lines.push(`\n## ${b.topic}`);
    for (const c of b.citations) {
      lines.push(`- ${c.title}\n  ${c.url}\n  ${c.snippet}`);
    }
  }
  if (!research.length) {
    lines.push(
      "(no live research available — rely on your training knowledge but be conservative; omit URLs you cannot verify)",
    );
  }
  lines.push("");
  lines.push(
    `Now produce the personalized roadmap JSON for ${profile.nationality} → ${profile.destination} (${profile.purpose}).`,
  );
  return lines.join("\n");
}

export type CraftedRoadmap = {
  summary: string;
  visaType: string;
  estimatedProcessingTime: string;
  estimatedTotalCost: string;
  difficulty: "Easy" | "Moderate" | "Hard" | "Very Hard";
  difficultyReason: string;
  steps: Array<{
    order: number;
    title: string;
    timeframe: string;
    description: string;
    actionItems: string[];
  }>;
  documents: Array<{ name: string; details: string; critical: boolean }>;
  financialRequirements: Array<{ item: string; amount: string; note: string }>;
  postArrival: string[];
  commonRejectionReasons: string[];
  proTips: string[];
  sources: Array<{ title: string; url: string }>;
};

export async function craftPersonalizedRoadmap(
  profile: Profile,
  research: ResearchBundle[],
): Promise<CraftedRoadmap> {
  const { getExchangeRates, getConversionPromptContext } =
    await import("../services/exchange-rate.server");
  let ratesContext = "";
  try {
    const rates = await getExchangeRates();
    ratesContext = getConversionPromptContext(rates);
  } catch (err) {
    console.warn("[personalized-roadmap-craft] Failed to load exchange rates:", err);
  }

  const { chatCompletion } = await import("../services/ai-gateway.server");
  const json = await chatCompletion({
    // Cheapest capable model — keeps credits sustainable
    model: "google/gemini-2.5-flash-lite",
    temperature: 0.25,
    max_tokens: 8192,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(profile, research, ratesContext) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "PersonalizedRoadmap", strict: true, schema: RESPONSE_SCHEMA },
    },
  });
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned empty response");
  return JSON.parse(content) as CraftedRoadmap;
}
