import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---- Tunables ----
const FREE_MONTHLY_LIMIT = 1;
const CACHE_TTL_DAYS = 1;
// Standard tier (free): cheaper/faster model.
// Deep tier (pro+): bigger model + bigger token budget for richer roadmaps.
const AI_MODEL_STANDARD = "google/gemini-2.5-flash-lite";
const AI_MODEL_DEEP = "google/gemini-2.5-flash";
const AI_MAX_OUTPUT_TOKENS_STANDARD = 4096;
const AI_MAX_OUTPUT_TOKENS_DEEP = 8192;
const AI_TEMPERATURE = 0.3;
const MAX_FIELD_LEN = 80;
const MAX_COMBINED_INPUT_LEN = 240;

// Allow-list of trusted hostname suffixes for URLs the model returns.
// Anything not matching gets dropped (better empty than hallucinated).
const TRUSTED_HOST_SUFFIXES = [
  ".gov",
  ".gov.uk",
  ".gc.ca",
  ".gouv.fr",
  ".admin.ch",
  ".gv.at",
  ".int",
  "europa.eu",
  "vfsglobal.com",
  "tlscontact.com",
  "blsinternational.com",
  "iom.int",
  "schengenvisainfo.com",
];

function isTrustedUrl(u: string): boolean {
  if (!u) return false;
  try {
    const url = new URL(u);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    // Government TLD pattern: anything ending in .gov, .gov.xx, .gob.xx, .gouv.xx, etc.
    if (/\.(gov|gob|gouv|govt)(\.[a-z]{2,3})?$/.test(host)) return true;
    return TRUSTED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(s));
  } catch {
    return false;
  }
}

const InputSchema = z.object({
  nationality: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
  purpose: z.string().min(1).max(100),
  refresh: z.boolean().optional(),
  fingerprint: z.string().min(8).max(128).optional(),
  email: z.string().email().max(320).optional(),
});

// Strip user input to a safe character set before it reaches the prompt.
function sanitizeField(s: string): string {
  return s
    .replace(/[^A-Za-z\s\-]/g, "")
    .trim()
    .slice(0, MAX_FIELD_LEN);
}

function getClientIp(): string {
  return getRequestHeader("cf-connecting-ip") || "unknown";
}

// Returns true when the current request carries a valid Supabase bearer token
// for a user whose email is granted the 'admin' role. Admins bypass quotas.
async function isAdminRequest(): Promise<boolean> {
  try {
    const authHeader = getRequestHeader("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return false;
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.email) return false;
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin_email", {
      _email: data.user.email,
    });
    return Boolean(isAdmin);
  } catch {
    return false;
  }
}

// Returns the tier of the authenticated caller, or 'free' if not signed in.
// Used to decide whether to run deep-mode generation.
type CallerTier = "free" | "pro" | "pro_max";
async function getRequestTier(): Promise<CallerTier> {
  try {
    const authHeader = getRequestHeader("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return "free";
    const { data: userRes, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !userRes.user) return "free";
    const { data: sub } = await supabaseAdmin
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", userRes.user.id)
      .maybeSingle();
    const t = (sub?.tier ?? "free") as CallerTier;
    return t === "pro" || t === "pro_max" ? t : "free";
  } catch {
    return "free";
  }
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function currentMonthBucket(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function generateSlug(): string {
  return randomBytes(6).toString("base64url").slice(0, 10).toLowerCase();
}

const LinkBlock = z.object({
  label: z.string().max(120).optional().default(""),
  url: z.string().max(500).optional().default(""),
  note: z.string().max(400).optional().default(""),
});

// Tighter schema: every string capped, every array bounded.
// Prevents the model from padding with invented detail.
const RoadmapSchema = z.object({
  summary: z.string().max(600),
  visaType: z.string().max(120),
  estimatedProcessingTime: z.string().max(120),
  estimatedTotalCost: z.string().max(120),
  difficulty: z.enum(["Easy", "Moderate", "Hard", "Very Hard"]),
  difficultyReason: z.string().max(400).optional().default(""),
  steps: z
    .array(
      z.object({
        order: z.number(),
        title: z.string().max(140),
        timeframe: z.string().max(80),
        description: z.string().max(800),
        actionItems: z.array(z.string().max(240)).max(12),
      }),
    )
    .max(15),
  documents: z
    .array(
      z.object({
        name: z.string().max(140),
        details: z.string().max(400),
        critical: z.boolean(),
      }),
    )
    .max(25),
  financialRequirements: z
    .array(
      z.object({
        item: z.string().max(140),
        amount: z.string().max(120),
        note: z.string().max(300),
      }),
    )
    .max(12),
  appointmentBooking: LinkBlock.optional(),
  biometrics: z
    .object({
      required: z.boolean().optional().default(false),
      where: z.string().max(300).optional().default(""),
      cost: z.string().max(120).optional().default(""),
      note: z.string().max(400).optional().default(""),
    })
    .optional(),
  interview: z
    .object({
      required: z.boolean().optional().default(false),
      typicalQuestions: z.array(z.string().max(240)).max(10).optional().default([]),
      tips: z.string().max(600).optional().default(""),
    })
    .optional(),
  postArrival: z.array(z.string().max(240)).max(12).optional().default([]),
  commonRejectionReasons: z.array(z.string().max(300)).max(8),
  embassyContacts: z
    .array(
      z.object({
        name: z.string().max(140),
        city: z.string().max(80),
        address: z.string().max(240),
        phone: z.string().max(60),
        email: z.string().max(120),
        website: z.string().max(300),
      }),
    )
    .max(4),
  officialLinks: z
    .array(
      z.object({
        title: z.string().max(140),
        url: z.string().max(500),
        purpose: z.string().max(240),
      }),
    )
    .max(20),
  usefulResources: z
    .array(
      z.object({
        title: z.string().max(140),
        url: z.string().max(500),
        note: z.string().max(240),
      }),
    )
    .max(15),
  proTips: z.array(z.string().max(280)).max(12),
  sources: z
    .array(
      z.object({
        title: z.string().max(140),
        url: z.string().max(500),
      }),
    )
    .max(25)
    .optional()
    .default([]),
});

export type Roadmap = z.infer<typeof RoadmapSchema> & {
  verifiedAt: string;
  cached: boolean;
  brokenLinks: string[];
  shareSlug: string;
};

export const QUOTA_ERROR_PREFIX = "QUOTA_REACHED:";

const SYSTEM_PROMPT = `You are an expert immigration and visa consultant with current (2026) consular knowledge.

Generate a hyper-specific, accurate, INFORMATIVE visa roadmap. Quality bar:

1. NEVER FABRICATE. If you do not know a specific embassy address, phone, email, exact form number, or fee, OMIT that field entirely (empty string) rather than inventing one. For amounts you are unsure of, give a range with the word "approx" (e.g. "approx $80–120") instead of a fake precise number. Never make up URLs.

2. URLS MUST BE REAL OFFICIAL DOMAINS only — .gov, .gov.xx, .gouv.xx, .admin.ch, europa.eu, vfsglobal.com, tlscontact.com, blsinternational.com, iom.int. If you are not certain a URL exists, return an empty string for that field.

3. CITE EVERYTHING. Every fact (fee, processing time, document requirement) should be traceable to an official source. Populate the "sources" array with the actual government URLs you relied on.

4. ROUTE-SPECIFIC, not generic. Tailor every section to this exact nationality → destination → purpose combination. The rejection reasons, embassy contacts, and document list must reflect THIS specific route.

5. CONCRETE DETAILS:
   - Exact form numbers when known (DS-160, VAF, IMM 1294, Anlage A, etc.)
   - Amounts in local currency + EUR/USD equivalent when known
   - Bank-statement requirements with specific durations and minimum balances
   - 4-8 chronological steps, each with timeframe and 2-5 actionItems
   - 6-15 documents with concrete details
   - 3-5 most common rejection reasons specific to this route
   - 1-3 embassy/consulate entries (destination country's embassy in applicant's country)
   - Appointment booking system used (VFS Global / TLS / direct embassy) with current portal URL
   - Biometrics requirement and where to give them
   - Interview requirement and 3-5 typical questions for this profile
   - Post-arrival actions (residence registration, residence permit, insurance)
   - "difficultyReason": 1 sentence explaining WHY this route got that difficulty rating

6. Output ONLY valid JSON. No markdown, no commentary, no code fences.`;

// Deep-mode prompt for Pro / Pro Max — asks for more steps, more action items,
// more documents, and an exhaustive validated source list.
const SYSTEM_PROMPT_DEEP = `You are an expert immigration and visa consultant with current (2026) consular knowledge. You are generating a PREMIUM deep-research roadmap for a paying customer. Quality bar is much higher than the standard tier.

1. NEVER FABRICATE. Omit any field you are not certain about (empty string) rather than guessing. Never invent URLs, embassy phone numbers, or form numbers.

2. URLS MUST BE REAL OFFICIAL DOMAINS only — .gov, .gov.xx, .gouv.xx, .admin.ch, europa.eu, vfsglobal.com, tlscontact.com, blsinternational.com, iom.int. Drop anything you are not sure about.

3. EXHAUSTIVE CITATIONS. The "sources" array MUST contain 10-20 distinct OFFICIAL government / consular URLs (embassy pages, visa pages, fee schedules, appointment portals, official guidance). Every major fact (fee, form, processing time, document) should be traceable to one of these sources.

4. ROUTE-SPECIFIC, not generic. Every section is tailored to this exact nationality → destination → purpose combination.

5. DEEP STEP-BY-STEP PLAN:
   - 8-12 chronological steps, each with a precise timeframe and 5-10 concrete actionItems
   - Each step's description (up to 800 chars) must explain WHAT, WHERE (portal/embassy), HOW LONG, and the COMMON PITFALL
   - actionItems must be granular sub-tasks, not high-level summaries (e.g. "Open VFS account → verify email → complete personal details → upload passport bio page (color, <2MB JPEG)")

6. RICH DETAILS:
   - 15-25 documents with concrete details (format, copies, translation/apostille requirements, validity window)
   - 4-6 most common rejection reasons specific to this route, each with a 1-line fix
   - 1-3 embassy/consulate entries (destination's embassy in applicant's country)
   - Exact form numbers (DS-160, VAF, IMM 1294, Anlage A, etc.)
   - Amounts in local currency + EUR/USD equivalent when known
   - Bank-statement requirements with specific durations and minimum balances
   - Appointment booking system used (VFS Global / TLS / direct embassy) with current portal URL
   - Biometrics requirement and where to give them
   - Interview requirement and 3-5 typical questions for this profile
   - Post-arrival actions (residence registration, residence permit, insurance, tax)
   - 6-12 pro tips that reflect insider knowledge of this route
   - 10-20 official links and 5-15 useful resources (only real, verifiable URLs)
   - "difficultyReason": 1-2 sentences explaining WHY this route got that difficulty rating

7. Output ONLY valid JSON. No markdown, no commentary, no code fences.`;

function buildSchema() {
  return {
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
      "appointmentBooking",
      "biometrics",
      "interview",
      "postArrival",
      "commonRejectionReasons",
      "embassyContacts",
      "officialLinks",
      "usefulResources",
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
      appointmentBooking: {
        type: "object",
        additionalProperties: false,
        required: ["label", "url", "note"],
        properties: {
          label: { type: "string" },
          url: { type: "string" },
          note: { type: "string" },
        },
      },
      biometrics: {
        type: "object",
        additionalProperties: false,
        required: ["required", "where", "cost", "note"],
        properties: {
          required: { type: "boolean" },
          where: { type: "string" },
          cost: { type: "string" },
          note: { type: "string" },
        },
      },
      interview: {
        type: "object",
        additionalProperties: false,
        required: ["required", "typicalQuestions", "tips"],
        properties: {
          required: { type: "boolean" },
          typicalQuestions: { type: "array", items: { type: "string" } },
          tips: { type: "string" },
        },
      },
      postArrival: { type: "array", items: { type: "string" } },
      commonRejectionReasons: { type: "array", items: { type: "string" } },
      embassyContacts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "city", "address", "phone", "email", "website"],
          properties: {
            name: { type: "string" },
            city: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            website: { type: "string" },
          },
        },
      },
      officialLinks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "url", "purpose"],
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            purpose: { type: "string" },
          },
        },
      },
      usefulResources: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "url", "note"],
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            note: { type: "string" },
          },
        },
      },
      proTips: { type: "array", items: { type: "string" } },
      sources: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "url"],
          properties: {
            title: { type: "string" },
            url: { type: "string" },
          },
        },
      },
    },
  };
}

async function callAI(prompt: string, deep: boolean): Promise<z.infer<typeof RoadmapSchema>> {
  const { chatCompletion } = await import("../services/ai-gateway.server");
  const data = await chatCompletion({
    model: deep ? AI_MODEL_DEEP : AI_MODEL_STANDARD,
    temperature: AI_TEMPERATURE,
    max_tokens: deep ? AI_MAX_OUTPUT_TOKENS_DEEP : AI_MAX_OUTPUT_TOKENS_STANDARD,
    messages: [
      { role: "system", content: deep ? SYSTEM_PROMPT_DEEP : SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "visa_roadmap", strict: true, schema: buildSchema() },
    },
  });
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI");
  return RoadmapSchema.parse(JSON.parse(content));
}

// Post-process URLs: drop any that aren't on a trusted-host allow-list.
function scrubUrls(r: z.infer<typeof RoadmapSchema>): z.infer<typeof RoadmapSchema> {
  const scrub = (u: string) => (isTrustedUrl(u) ? u : "");
  return {
    ...r,
    appointmentBooking: r.appointmentBooking
      ? { ...r.appointmentBooking, url: scrub(r.appointmentBooking.url) }
      : r.appointmentBooking,
    embassyContacts: r.embassyContacts.map((e) => ({ ...e, website: scrub(e.website) })),
    officialLinks: r.officialLinks.filter((l) => isTrustedUrl(l.url)),
    usefulResources: r.usefulResources.filter((l) => isTrustedUrl(l.url)),
    sources: (r.sources ?? []).filter((s) => isTrustedUrl(s.url)),
  };
}

function cacheKeyFor(nationality: string, destination: string, purpose: string, deep: boolean) {
  // Deep + standard tiers are cached separately so paying users always get the
  // richer roadmap and never collide with a cached free-tier version.
  return `${nationality.toLowerCase().trim()}|${destination.toLowerCase().trim()}|${purpose.toLowerCase().trim()}|${deep ? "d" : "s"}`;
}

export const generateRoadmap = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ roadmap: Roadmap }> => {
    const nationality = sanitizeField(data.nationality);
    const destination = sanitizeField(data.destination);
    const purpose = sanitizeField(data.purpose);
    if (!nationality || !destination || !purpose) {
      throw new Error("Invalid route input. Please use letters only.");
    }
    if (nationality.length + destination.length + purpose.length > MAX_COMBINED_INPUT_LEN) {
      throw new Error("Route input is too long.");
    }

    // Pro / Pro Max callers get the deep roadmap; everyone else gets standard.
    const callerTier = await getRequestTier();
    const deep = callerTier === "pro" || callerTier === "pro_max";

    const key = cacheKeyFor(nationality, destination, purpose, deep);

    // 1. Try cache first (unless explicit refresh)
    if (!data.refresh) {
      const { data: cached } = await supabaseAdmin
        .from("roadmap_cache")
        .select("roadmap, created_at, expires_at, share_slug")
        .eq("cache_key", key)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached?.roadmap) {
        const parsed = RoadmapSchema.parse(cached.roadmap);
        const rawRoadmap = cached.roadmap as any;
        const brokenLinks = Array.isArray(rawRoadmap.brokenLinks) ? rawRoadmap.brokenLinks : [];
        return {
          roadmap: {
            ...parsed,
            verifiedAt: rawRoadmap.verifiedAt || cached.created_at,
            cached: true,
            brokenLinks,
            shareSlug: cached.share_slug,
          },
        };
      }
    }

    // 2. Enforce free-tier monthly quota (IP + device fingerprint).
    //    Admin users bypass quota entirely.
    const ipHash = hashIp(getClientIp());
    const fingerprint = data.fingerprint || "no-fp";
    const month = currentMonthBucket();
    const isAdmin = await isAdminRequest();

    if (!isAdmin) {
      const [ipRow, fpRow] = await Promise.all([
        supabaseAdmin
          .from("roadmap_usage")
          .select("count")
          .eq("ip_hash", ipHash)
          .eq("fingerprint", "no-fp")
          .eq("month", month)
          .maybeSingle(),
        supabaseAdmin
          .from("roadmap_usage")
          .select("count")
          .eq("ip_hash", "no-ip")
          .eq("fingerprint", fingerprint)
          .eq("month", month)
          .maybeSingle(),
      ]);

      const maxCount = Math.max(ipRow.data?.count ?? 0, fpRow.data?.count ?? 0);
      if (maxCount >= FREE_MONTHLY_LIMIT) {
        throw new Error(
          `${QUOTA_ERROR_PREFIX} You've used your free roadmap for this month. Upgrade for 30 roadmaps per month.`,
        );
      }
    }

    // 3. Generate fresh
    let ratesContext = "";
    try {
      const { getExchangeRates, getConversionPromptContext } =
        await import("../services/exchange-rate.server");
      const rates = await getExchangeRates();
      ratesContext = getConversionPromptContext(rates);
    } catch (err) {
      console.warn("[roadmap] Failed to load exchange rates:", err);
    }

    let researchContext = "";
    try {
      const { researchStandardRoadmap } = await import("./roadmap-research.server");
      const citations = await researchStandardRoadmap(nationality, destination, purpose);
      if (citations.length > 0) {
        researchContext = `### LIVE SEARCH GROUNDING DATA (Fetched Today)
Use the following live web search snippets to ground your responses for visa fees, processing times, document checklists, and contact info. Do not guess or use outdated training data if current figures are available below:

${citations.map((c) => `Source: ${c.title} (${c.url})\nSnippet: ${c.snippet}`).join("\n\n")}

Instructions:
1. Ground visa fees, processing times, and embassy contact info in the grounding data above.
2. Each source may contain detailed figures, exemptions, and procedural edge cases — read them fully. Do not omit specific amounts, dates, or conditional requirements even if they seem like edge cases.
3. In your JSON "sources" array, only include URLs that are present in the grounding data above. Do not invent or include other URLs.

---
`;
      }
    } catch (err) {
      console.warn("[roadmap] Failed to perform web research:", err);
    }

    const prompt = `${researchContext}Generate a complete, accurate, fully-cited visa roadmap for:
- Applicant nationality: ${nationality}
- Destination country: ${destination}
- Visa purpose: ${purpose}

${ratesContext ? `${ratesContext}\n` : ""}Tailor everything to this exact route. Include the embassy/consulate of ${destination} located in the applicant's country. Use 2026 figures. Populate the "sources" array with the official government URLs you used. Remember: omit fields you are not certain about rather than guessing.`;

    const generated = scrubUrls(await callAI(prompt, deep));

    const urlsToVerify: string[] = [];
    if (generated.appointmentBooking?.url) urlsToVerify.push(generated.appointmentBooking.url);
    generated.embassyContacts.forEach((e) => {
      if (e.website) urlsToVerify.push(e.website);
    });
    generated.officialLinks.forEach((l) => urlsToVerify.push(l.url));
    generated.usefulResources.forEach((l) => urlsToVerify.push(l.url));
    (generated.sources ?? []).forEach((s) => urlsToVerify.push(s.url));

    let deadUrls = new Set<string>();
    try {
      const { verifyUrls } = await import("./url-verifier.server");
      const { dead } = await verifyUrls(urlsToVerify);
      deadUrls = dead;
    } catch (err) {
      console.warn("[roadmap] URL verification failed:", err);
    }

    const finalRoadmap = {
      ...generated,
      appointmentBooking: generated.appointmentBooking
        ? {
            ...generated.appointmentBooking,
            url: deadUrls.has(generated.appointmentBooking.url) ? "" : generated.appointmentBooking.url,
          }
        : generated.appointmentBooking,
      embassyContacts: generated.embassyContacts.map((e) => ({
        ...e,
        website: deadUrls.has(e.website) ? "" : e.website,
      })),
      officialLinks: generated.officialLinks.filter((l) => !deadUrls.has(l.url)),
      usefulResources: generated.usefulResources.filter((l) => !deadUrls.has(l.url)),
      sources: (generated.sources ?? []).filter((s) => !deadUrls.has(s.url)),
    };
    
    const brokenLinks = Array.from(deadUrls);
    const verifiedAt = new Date().toISOString();

    // 4. Persist to cache (best-effort) — preserve existing slug if row exists.
    const { data: existing } = await supabaseAdmin
      .from("roadmap_cache")
      .select("share_slug")
      .eq("cache_key", key)
      .maybeSingle();
    const shareSlug = existing?.share_slug ?? generateSlug();

    const { error: cacheErr } = await supabaseAdmin.from("roadmap_cache").upsert(
      {
        cache_key: key,
        nationality,
        destination,
        purpose,
        roadmap: { ...finalRoadmap, brokenLinks, verifiedAt },
        share_slug: shareSlug,
        created_at: verifiedAt,
        expires_at: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "cache_key" },
    );
    if (cacheErr) console.warn("[roadmap] cache upsert failed:", cacheErr.message);

    // 5. Atomic quota increment via SECURITY DEFINER RPC (skipped for admins).
    if (!isAdmin) {
      const email = data.email ?? "";
      await Promise.all([
        supabaseAdmin.rpc("increment_roadmap_usage", {
          _ip_hash: ipHash,
          _fingerprint: "no-fp",
          _month: month,
          _email: email,
        }),
        supabaseAdmin.rpc("increment_roadmap_usage", {
          _ip_hash: "no-ip",
          _fingerprint: fingerprint,
          _month: month,
          _email: email,
        }),
      ]).catch((e) => console.warn("[roadmap] usage increment failed:", e));
    }

    return {
      roadmap: {
        ...finalRoadmap,
        verifiedAt,
        cached: false,
        brokenLinks,
        shareSlug,
      },
    };
  });

// Public read-only fetcher for shared roadmap URLs (/r/$slug).
export const getRoadmapBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z
          .string()
          .min(4)
          .max(20)
          .regex(/^[a-z0-9_-]+$/),
      })
      .parse(input),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      roadmap: Roadmap;
      nationality: string;
      destination: string;
      purpose: string;
    } | null> => {
      const { data: row } = await supabaseAdmin
        .from("roadmap_cache")
        .select("roadmap, created_at, share_slug, nationality, destination, purpose")
        .eq("share_slug", data.slug)
        .maybeSingle();
      if (!row?.roadmap) return null;
      const parsed = RoadmapSchema.parse(row.roadmap);
      const rawRoadmap = row.roadmap as any;
      const brokenLinks = Array.isArray(rawRoadmap.brokenLinks) ? rawRoadmap.brokenLinks : [];
      return {
        roadmap: {
          ...parsed,
          verifiedAt: rawRoadmap.verifiedAt || row.created_at,
          cached: true,
          brokenLinks,
          shareSlug: row.share_slug,
        },
        nationality: row.nationality,
        destination: row.destination,
        purpose: row.purpose,
      };
    },
  );
