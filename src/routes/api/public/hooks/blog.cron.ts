/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/public/hooks/blog/cron")({
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

        let count = 1;
        try {
          const body = await request.json();
          if (body && typeof body.count === "number") {
            count = Math.max(1, Math.min(3, body.count));
          }
        } catch {
          // ignore invalid json, default to 1
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: queued, error } = await supabaseAdmin
          .from("blog_topic_queue")
          .select("*")
          .eq("status", "queued")
          .order("priority", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(count);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        if (!queued || queued.length === 0) {
          return Response.json({
            ok: true,
            idle: true,
            message: "No queued topics",
          });
        }

        const { generatePost } = await import("@/lib/blog/generate-post.server");
        const results: any[] = [];

        for (const item of queued) {
          await supabaseAdmin
            .from("blog_topic_queue")
            .update({
              status: "processing",
              started_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          try {
            const res = await generatePost(
              {
                topic: item.topic,
                primary_keyword: item.primary_keyword,
                secondary_keywords: item.secondary_keywords ?? undefined,
                audience: item.audience ?? undefined,
                angle: item.angle ?? undefined,
              },
              { queueId: item.id },
            );

            await supabaseAdmin
              .from("blog_topic_queue")
              .update({
                status: res.ok ? "done" : "failed",
                error: res.ok ? null : (res.error ?? res.refusal ?? "unknown"),
                post_id: res.post_id ?? null,
                completed_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            results.push({
              id: item.id,
              ok: res.ok,
              status: res.status ?? (res.ok ? "done" : "failed"),
              error: res.error,
              refusal: res.refusal,
              logs: res.logs,
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await supabaseAdmin
              .from("blog_topic_queue")
              .update({
                status: "failed",
                error: msg,
                completed_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            results.push({ id: item.id, ok: false, error: msg });
          }
        }

        return Response.json({ ok: true, processed: queued.length, results });
      },
    },
  },
});
