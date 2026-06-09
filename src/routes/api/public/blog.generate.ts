import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/public/blog/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.BLOG_API_KEY;
        if (!key) return new Response("Server not configured", { status: 500 });
        const header =
          request.headers.get("authorization") ?? request.headers.get("x-api-key") ?? "";
        const supplied = header.replace(/^Bearer\s+/i, "").trim();
        if (!supplied || supplied !== key) {
          return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
            status: 400,
          });
        }
        const b = body as {
          topic?: string;
          primary_keyword?: string;
          secondary_keywords?: string[];
          audience?: string;
          angle?: string;
          author_slug?: string;
          official_seeds?: string[];
          auto_publish?: boolean;
          idempotency_key?: string;
        };
        if (!b.topic || !b.primary_keyword) {
          return new Response(
            JSON.stringify({ ok: false, error: "topic and primary_keyword are required" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        if (b.topic.length > 300 || b.primary_keyword.length > 120) {
          return new Response(JSON.stringify({ ok: false, error: "field too long" }), {
            status: 400,
          });
        }

        // Idempotency
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (b.idempotency_key) {
          const { data: existing } = await supabaseAdmin
            .from("idempotency_keys")
            .select("status,response")
            .eq("scope", "blog_public_generate")
            .eq("key", b.idempotency_key)
            .maybeSingle();
          if (existing?.status === "succeeded") {
            return Response.json(existing.response ?? { ok: true, cached: true });
          }
          await supabaseAdmin
            .from("idempotency_keys")
            .upsert(
              { scope: "blog_public_generate", key: b.idempotency_key, status: "in_progress" },
              { onConflict: "scope,key" },
            );
        }

        try {
          const { generatePost } = await import("@/lib/blog/generate-post.server");
          const result = await generatePost({
            topic: b.topic,
            primary_keyword: b.primary_keyword,
            secondary_keywords: b.secondary_keywords,
            audience: b.audience,
            angle: b.angle,
            author_slug: b.author_slug,
            official_seeds: b.official_seeds,
            auto_publish: !!b.auto_publish,
          });
          if (b.idempotency_key) {
            await supabaseAdmin
              .from("idempotency_keys")
              .update({
                status: result.ok ? "succeeded" : "failed",
                response: JSON.parse(JSON.stringify(result)),
              })
              .eq("scope", "blog_public_generate")
              .eq("key", b.idempotency_key);
          }
          return Response.json(result, { status: result.ok ? 200 : 422 });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (b.idempotency_key) {
            await supabaseAdmin
              .from("idempotency_keys")
              .update({ status: "failed", response: { ok: false, error: msg } as never })
              .eq("scope", "blog_public_generate")
              .eq("key", b.idempotency_key);
          }
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
});
