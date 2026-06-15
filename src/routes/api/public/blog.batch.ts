/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";
import crypto from "node:crypto";

export const Route = createFileRoute("/api/public/blog/batch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.BLOG_API_KEY;
        if (!key) return new Response("Server not configured", { status: 500 });

        const header =
          request.headers.get("authorization") ?? request.headers.get("x-api-key") ?? "";
        const supplied = header.replace(/^Bearer\s+/i, "").trim();

        if (!supplied) {
          return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const suppliedHash = crypto.createHash("sha256").update(supplied).digest();
        const keyHash = crypto.createHash("sha256").update(key).digest();
        if (!crypto.timingSafeEqual(suppliedHash, keyHash)) {
          return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
            status: 400,
          });
        }

        if (!body || !Array.isArray(body.keywords)) {
          return Response.json({ ok: false, error: "Requires 'keywords' array" }, { status: 400 });
        }

        const keywords = body.keywords;
        if (keywords.length === 0 || keywords.length > 100) {
          return Response.json(
            {
              ok: false,
              error: "Keywords array must be between 1 and 100 items",
            },
            { status: 400 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const batchId = `batch_${Date.now()}`;

        const payload = keywords
          .map((k: any) => {
            const kw = String(k.keyword || "").trim();
            const topic = k.topic ? String(k.topic).trim() : kw;

            return {
              topic: topic,
              primary_keyword: kw,
              raw_keyword: kw,
              expanded: !!k.topic,
              secondary_keywords: Array.isArray(k.secondary_keywords) ? k.secondary_keywords : [],
              audience: k.audience ? String(k.audience) : null,
              angle: k.angle ? String(k.angle) : null,
              priority: typeof k.priority === "number" ? k.priority : 5,
              status: "queued",
              batch_id: batchId,
              created_by: "system_api",
            };
          })
          .filter((p: any) => p.primary_keyword.length > 0);

        if (payload.length === 0) {
          return Response.json({ ok: true, queued: 0 });
        }

        const { error } = await supabaseAdmin.from("blog_topic_queue").insert(payload);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        return Response.json({
          ok: true,
          queued: payload.length,
          batch_id: batchId,
        });
      },
    },
  },
});
