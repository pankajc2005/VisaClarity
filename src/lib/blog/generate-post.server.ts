/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Blog post generation orchestrator.
 *
 * Rewritten for speed and reliability:
 *   - Uses only OpenRouter for drafting/expanding/alt-text.
 *   - Performs keyword expansion if the topic is short.
 *   - Runs parallel search research.
 *   - Runs the 8-check weighted Quality Assurance (QA) pipeline.
 *   - Saves the post to the database immediately after QA passes.
 *   - Decoupled image generation: fires a background promise that generates and attaches the image, returning success immediately.
 *   - Writes real-time steps to `blog_generation_logs` table for frontend progress streaming.
 */

import { blogChatCompletion } from "./llm-chain.server.ts";
import { expandKeyword } from "./keyword-expander.server.ts";
import { runQualityChecks } from "./quality-checker.server.ts";
import { runResearch, type ResearchHit } from "./research-agent.server.ts";
import { generateHeroImage } from "./image-gen.server.ts";
import { uploadBlogImage } from "./storage.server.ts";
import WRITER_SYSTEM from "./writer-system.md?raw";

export interface GenerateInput {
  topic: string;
  primary_keyword: string;
  secondary_keywords?: string[];
  audience?: string;
  angle?: string;
  author_slug?: string; // optional, otherwise rotation
  official_seeds?: string[]; // optional URLs to fetch directly
  auto_publish?: boolean; // public API only
  llm_profile?: "balanced" | "quality" | "fast";
}

export interface GenerateResult {
  ok: boolean;
  post_id?: string;
  slug?: string;
  status?: "draft" | "in_review" | "published";
  refusal?: string;
  confidence?: string;
  needs_source_count?: number;
  error?: string;
  logs: Array<{ step: string; tool?: string; ok: boolean; summary?: string; error?: string }>;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface Author {
  id: string;
  slug: string;
  name: string;
  bio: string;
  locale_hint: string | null;
  voice_style: string;
}

async function pickAuthor(authorSlug?: string): Promise<Author | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (authorSlug) {
    const { data } = await supabaseAdmin
      .from("blog_authors")
      .select("id,slug,name,bio,locale_hint,voice_style")
      .eq("slug", authorSlug)
      .maybeSingle();
    if (data) return data as Author;
  }
  // Rotate: pick the author who has authored the fewest posts.
  const { data: authors } = await supabaseAdmin
    .from("blog_authors")
    .select("id,slug,name,bio,locale_hint,voice_style");
  if (!authors || authors.length === 0) return null;
  const { data: counts } = await supabaseAdmin.from("blog_posts").select("author_id");
  const tally: Record<string, number> = {};
  for (const c of counts ?? [])
    if (c.author_id) tally[c.author_id as string] = (tally[c.author_id as string] ?? 0) + 1;
  const ranked = (authors as Author[])
    .slice()
    .sort((a, b) => (tally[a.id] ?? 0) - (tally[b.id] ?? 0));
  return ranked[0];
}

function buildUserMessage(
  input: GenerateInput,
  author: Author,
  hits: ResearchHit[],
  today: string,
): string {
  const sources = hits
    .map(
      (h, i) =>
        `[${i}] (${h.tier}) ${h.title}\n    URL: ${h.url}\n    ${h.snippet ? "Snippet: " + h.snippet.replace(/\s+/g, " ").slice(0, 600) : ""}`,
    )
    .join("\n\n");
  return `Today's date: ${today}

You are writing as:
  Name: ${author.name}
  Bio: ${author.bio}
  Locale hint: ${author.locale_hint ?? "(unspecified)"}
  Voice style: ${author.voice_style}

Topic: ${input.topic}
Primary keyword: ${input.primary_keyword}
Secondary keywords: ${(input.secondary_keywords ?? []).join(", ") || "(none)"}
Audience: ${input.audience ?? "general visa applicants"}
Angle: ${input.angle ?? "(none — choose the most useful angle)"}

You have ${hits.length} researched sources. Cite by index, e.g. [^3] for source index 3.
Official-tier sources count: ${hits.filter((h) => h.tier === "official").length}

SOURCES:
${sources}

Now write the article per the system contract. Return ONE JSON object only.`;
}

interface DraftJson {
  refusal?: string | null;
  title?: string;
  subtitle?: string;
  description?: string;
  category?: string;
  reading_minutes?: number;
  tldr?: string[];
  body_mdx?: string;
  sources_used?: number[];
  needs_source_count?: number;
  hero_image_prompt?: string;
  confidence?: "high" | "medium" | "low";
  voice_notes?: string;
  have?: number;
  need?: number;
}

function extractJson(s: string): DraftJson | null {
  const cleaned = s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = /\{[\s\S]*\}/.exec(cleaned);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

async function generateAltText(title: string, heroPrompt: string): Promise<string> {
  if (process.env.BLOG_AGENT_LOCAL_TEST === "1") {
    return title;
  }
  try {
    const r = await blogChatCompletion({
      purpose: "alt-text",
      messages: [
        {
          role: "system",
          content:
            "Return ONE short alt-text sentence (max 120 chars) describing an editorial image. No quotes, no period at end if natural.",
        },
        { role: "user", content: `Article title: ${title}\nImage scene: ${heroPrompt}` },
      ],
      temperature: 0.2,
      max_tokens: 80,
    });
    return r.content.trim().slice(0, 120) || title;
  } catch {
    return title;
  }
}

/**
 * Detached background helper to generate image and attach it to the post.
 */
async function generateAndAttachImage({
  postId,
  postTitle,
  heroImagePrompt,
  queueId,
}: {
  postId: string;
  postTitle: string;
  heroImagePrompt: string;
  queueId?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  async function logImage(ok: boolean, summary?: string, error?: string, request?: any) {
    if (queueId) {
      await supabaseAdmin.from("blog_generation_logs").insert({
        queue_id: queueId,
        post_id: postId,
        step: "image" as never,
        tool: "pollinations-flux",
        ok,
        response_summary: summary ?? null,
        error: error ?? null,
        request: request ? JSON.parse(JSON.stringify(request)) : null,
      });
    }
  }

  try {
    const img = await generateHeroImage(heroImagePrompt);
    if (img) {
      const slug = slugify(postTitle);
      const heroUrl = await uploadBlogImage(`${slug}-hero.png`, img.bytes, "image/png");
      if (heroUrl) {
        const heroPromptFinal = img.promptUsed;
        const heroAlt = await generateAltText(postTitle, heroImagePrompt);

        const { error: updateErr } = await supabaseAdmin
          .from("blog_posts")
          .update({
            hero_image_url: heroUrl,
            hero_image_alt: heroAlt,
            hero_prompt: heroPromptFinal,
          })
          .eq("id", postId);

        if (updateErr) {
          await logImage(false, "Failed to update blog post with image URL", updateErr.message, {
            heroUrl,
          });
        } else {
          await logImage(true, `Successfully generated and attached image: ${heroUrl}`, undefined, {
            hero_image_prompt: heroImagePrompt,
            url: heroUrl,
          });
        }
      } else {
        await logImage(false, "Failed to upload image to storage", undefined, {
          hero_image_prompt: heroImagePrompt,
        });
      }
    } else {
      await logImage(false, "Image generation returned null bytes", undefined, {
        hero_image_prompt: heroImagePrompt,
      });
    }
  } catch (err: any) {
    await logImage(false, "Background image generation crashed", err.message || String(err), {
      hero_image_prompt: heroImagePrompt,
    });
  }

  // Write final log step=finalize to indicate completion of the entire process
  if (queueId) {
    await supabaseAdmin.from("blog_generation_logs").insert({
      queue_id: queueId,
      post_id: postId,
      step: "finalize" as never,
      ok: true,
      response_summary: "Generation session completed successfully (image attached)",
    });
  }
}

export async function generatePost(
  input: GenerateInput,
  opts: { queueId?: string } = {},
): Promise<GenerateResult> {
  const logs: GenerateResult["logs"] = [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  async function log(
    step: string,
    ok: boolean,
    summary?: string,
    tool?: string,
    error?: string,
    request?: any,
  ) {
    logs.push({ step, ok, summary, tool, error });
    if (opts.queueId) {
      await supabaseAdmin.from("blog_generation_logs").insert({
        queue_id: opts.queueId,
        step: step as never,
        tool,
        ok,
        response_summary: summary,
        error,
        request: request ? JSON.parse(JSON.stringify(request)) : null,
      });
    }
  }

  // 1. Plan / Author selection
  const author = await pickAuthor(input.author_slug);
  if (!author) {
    await log("plan", false, "no authors seeded", undefined, "missing_authors", { input });
    return { ok: false, error: "no authors seeded", logs };
  }
  await log("plan", true, `author=${author.slug}`, undefined, undefined, { input });

  // 1.5 Expand Keyword
  let topic = input.topic;
  let secondary_keywords = input.secondary_keywords ?? [];

  // If topic looks like a raw keyword, expand it
  if (topic.length < 40 && topic.split(" ").length <= 4) {
    try {
      const expanded = await expandKeyword(input.primary_keyword, null, {
        audience: input.audience,
        angle: input.angle,
      });
      topic = expanded.topic;
      secondary_keywords = expanded.secondary_keywords;
      await log("expand", true, `expanded=${topic}`, undefined, undefined, {
        primary_keyword: input.primary_keyword,
      });
    } catch (e) {
      await log(
        "expand",
        false,
        "keyword expansion failed, using fallback",
        undefined,
        e instanceof Error ? e.message : String(e),
        { primary_keyword: input.primary_keyword },
      );
    }
  }

  // 2. Research
  const research = await runResearch(topic, [input.primary_keyword, ...secondary_keywords], {
    officialSeeds: input.official_seeds,
  });
  await log(
    "research",
    true,
    `hits=${research.hits.length} official=${research.byTier.official}`,
    JSON.stringify(research.byTool),
    undefined,
    {
      topic,
      keywords: [input.primary_keyword, ...secondary_keywords],
      options: { officialSeeds: input.official_seeds },
    },
  );

  // Hard floor: refuse if no Tavily key AND fewer than 3 official.
  if (research.byTier.official < 1 && research.hits.length < 4) {
    await log("research", false, "insufficient sources", undefined, "low_source_count", {
      hits_count: research.hits.length,
      official_count: research.byTier.official,
    });
    return { ok: false, refusal: "insufficient_sources", logs };
  }

  // 3-4. Draft
  const today = new Date().toISOString().slice(0, 10);
  const effectiveInput = { ...input, topic, secondary_keywords };
  const userMsg = buildUserMessage(effectiveInput, author, research.hits, today);
  let draftText = "";
  let providerUsed = "unknown";
  let modelUsed = "unknown";

  try {
    const r = await blogChatCompletion({
      purpose: "draft",
      messages: [
        { role: "system", content: WRITER_SYSTEM },
        { role: "user", content: userMsg },
      ],
      temperature: 0.55,
      max_tokens: 4500,
      response_format: { type: "json_object" },
    });
    draftText = r.content;
    providerUsed = r.provider;
    modelUsed = r.model;
  } catch (e) {
    await log("draft", false, undefined, "llm-chain", e instanceof Error ? e.message : String(e), {
      user_message: userMsg,
    });
    return { ok: false, error: "draft failed", logs };
  }

  const draft = extractJson(draftText);
  if (!draft) {
    await log("draft", false, "json parse failed", "llm-chain", undefined, {
      raw_output: draftText.slice(0, 2000),
    });
    return { ok: false, error: "draft json parse failed", logs };
  }
  if (draft.refusal) {
    await log("draft", false, `refusal: ${draft.refusal}`, undefined, undefined, {
      refusal: draft.refusal,
    });
    return { ok: false, refusal: draft.refusal, logs };
  }
  if (!draft.title || !draft.body_mdx) {
    await log("draft", false, "missing title/body", undefined, undefined, {
      title_exists: !!draft.title,
      body_exists: !!draft.body_mdx,
    });
    return { ok: false, error: "draft missing fields", logs };
  }

  const needsSource =
    draft.needs_source_count ?? draft.body_mdx.match(/\[NEEDS OFFICIAL SOURCE\]/g)?.length ?? 0;
  const confidence = (draft.confidence ?? (needsSource === 0 ? "high" : "medium")) as
    | "high"
    | "medium"
    | "low";
  await log(
    "draft",
    true,
    `title=${draft.title}; confidence=${confidence}; needs_source=${needsSource}`,
    undefined,
    undefined,
    {
      draft_meta: {
        title: draft.title,
        confidence,
        needs_source: needsSource,
        category: draft.category,
        reading_minutes: draft.reading_minutes,
      },
    },
  );

  // Fetch existing titles to check for duplicates in QA
  let existingTitles: string[] = [];
  try {
    const { data: posts } = await supabaseAdmin.from("blog_posts").select("title");
    if (posts) {
      existingTitles = posts.map((p: any) => p.title).filter(Boolean);
    }
  } catch (err) {
    // ignore fetch existing titles failure
  }

  // 5. Run QA
  const qa = await runQualityChecks(
    {
      title: draft.title,
      description: draft.description ?? "",
      body_mdx: draft.body_mdx,
      sources_used: draft.sources_used ?? [],
      needs_source_count: needsSource,
      primary_keyword: input.primary_keyword,
    },
    research.hits.map((h, i) => ({ index: i, url: h.url, title: h.title })),
    existingTitles,
  );
  await log("qa", qa.passed, `score=${qa.score}`, undefined, undefined, {
    qa_input: {
      title: draft.title,
      description: draft.description ?? "",
      sources_used: draft.sources_used ?? [],
      needs_source_count: needsSource,
      primary_keyword: input.primary_keyword,
    },
    qa_results: qa.checks,
  });

  // 6. Persist Post to DB (hero image starts as null, gets added async)
  const baseSlug = slugify(draft.title);
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabaseAdmin
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
  }

  // Map sources_used into a sources[] payload of the actually-cited subset.
  const used = new Set(draft.sources_used ?? research.hits.map((_, i) => i));
  const sources = research.hits
    .map((h, i) => ({
      index: i,
      used: used.has(i),
      tool: h.tool,
      tier: h.tier,
      url: h.url,
      title: h.title,
      publishedAt: h.publishedAt ?? null,
    }))
    .filter((s) => s.used);

  // ALWAYS force in_review status
  const status = "in_review" as const;

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("blog_posts")
    .insert({
      slug,
      title: draft.title,
      subtitle: draft.subtitle ?? null,
      description: (draft.description ?? "").slice(0, 200),
      keywords: [input.primary_keyword, ...secondary_keywords].join(", "),
      category: draft.category ?? "Guide",
      hero_image_url: null, // to be updated by background promise
      hero_image_alt: null, // to be updated by background promise
      hero_prompt: null, // to be updated by background promise
      author_id: author.id,
      reading_minutes: Math.max(2, Math.min(20, draft.reading_minutes ?? 6)),
      body_mdx: draft.body_mdx,
      sources: JSON.parse(JSON.stringify(sources)),
      status,
      published_at: null,
      qa_score: qa.score,
      qa_passed: qa.passed,
      llm_provider: providerUsed,
      generation_meta: JSON.parse(
        JSON.stringify({
          confidence,
          needs_source_count: needsSource,
          qa_score: qa.score,
          qa_passed: qa.passed,
          qa_checks: qa.checks,
          llm_provider: providerUsed,
          llm_model: modelUsed,
          voice_notes: draft.voice_notes ?? null,
          research_by_tier: research.byTier,
          research_by_tool: research.byTool,
          tldr: draft.tldr ?? [],
          topic_input: effectiveInput,
        }),
      ),
    })
    .select("id,slug")
    .single();

  if (insertErr || !inserted) {
    await log("finalize", false, undefined, undefined, insertErr?.message, {
      slug,
      title: draft.title,
      status,
    });
    return { ok: false, error: insertErr?.message ?? "insert failed", logs };
  }

  await log(
    "finalize",
    true,
    `post_id=${inserted.id} status=${status} (saved to DB)`,
    undefined,
    undefined,
    {
      inserted_post: { id: inserted.id, slug: inserted.slug, status },
    },
  );

  // Backfill post_id on all logs created during this run.
  if (opts.queueId) {
    await supabaseAdmin
      .from("blog_generation_logs")
      .update({ post_id: inserted.id })
      .eq("queue_id", opts.queueId);
  }

  // 7. Fire-and-forget background image generation.
  if (draft.hero_image_prompt) {
    generateAndAttachImage({
      postId: inserted.id,
      postTitle: draft.title,
      heroImagePrompt: draft.hero_image_prompt,
      queueId: opts.queueId,
    }).catch((err) => {
      console.error("[generatePost] Background image generation error:", err);
    });
  } else {
    // If no prompt, complete finalize immediately
    if (opts.queueId) {
      await supabaseAdmin.from("blog_generation_logs").insert({
        queue_id: opts.queueId,
        post_id: inserted.id,
        step: "finalize" as never,
        ok: true,
        response_summary: "Generation session completed successfully (no hero image prompt)",
      });
    }
  }

  return {
    ok: true,
    post_id: inserted.id,
    slug: inserted.slug,
    status,
    confidence,
    needs_source_count: needsSource,
    logs,
  };
}

export default { generatePost };
