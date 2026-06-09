/**
 * One-shot migration of the static posts.ts content into DB rows.
 * Admin-only. Idempotent (UPSERT by slug).
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { BLOG_POSTS } from "@/lib/blog/posts";

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden: admin only.");
}

function buildMdx(p: (typeof BLOG_POSTS)[number]): string {
  const parts: string[] = [];
  parts.push(p.intro);
  parts.push("");
  for (const s of p.sections) {
    parts.push(`## ${s.heading}`);
    parts.push("");
    for (const b of s.body) {
      parts.push(b);
      parts.push("");
    }
    if (s.list && s.list.length > 0) {
      for (const item of s.list) parts.push(`- ${item}`);
      parts.push("");
    }
  }
  if (p.faqs.length > 0) {
    parts.push("## Frequently asked");
    parts.push("");
    for (const f of p.faqs) {
      parts.push(`### ${f.q}`);
      parts.push("");
      parts.push(f.a);
      parts.push("");
    }
  }
  return parts.join("\n");
}

export const importLegacyPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authors } = await supabaseAdmin
      .from("blog_authors")
      .select("id,slug")
      .order("slug");
    if (!authors || authors.length === 0) throw new Error("No authors seeded yet.");
    let i = 0;
    let imported = 0;
    for (const p of BLOG_POSTS) {
      const author = authors[i % authors.length];
      i++;
      const { data: existing } = await supabaseAdmin
        .from("blog_posts")
        .select("id")
        .eq("slug", p.slug)
        .maybeSingle();
      if (existing) continue;
      const { error } = await supabaseAdmin.from("blog_posts").insert({
        slug: p.slug,
        title: p.title,
        description: p.description,
        keywords: p.keywords,
        category: p.category,
        author_id: author.id,
        reading_minutes: p.readMinutes,
        body_mdx: buildMdx(p),
        sources: JSON.parse(JSON.stringify([])),
        status: "published",
        published_at: new Date(p.publishedAt).toISOString(),
        generation_meta: JSON.parse(
          JSON.stringify({
            tldr: [p.intro.split(". ")[0]],
            confidence: "medium",
            imported_from: "static",
          }),
        ),
      });
      if (error) throw new Error(`Insert failed for ${p.slug}: ${error.message}`);
      imported++;
    }
    return { imported, total: BLOG_POSTS.length };
  });
