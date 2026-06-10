import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { storage } from "@/lib/services/storage.server";
import {
  researchPersonalizedRoadmap,
  type PersonalizedBrief,
} from "@/lib/roadmap/personalized-roadmap-research.server";
import {
  craftPersonalizedRoadmap,
  type CraftedRoadmap,
} from "@/lib/roadmap/personalized-roadmap-craft.server";
import { generateRoadmapPdf, generateRoadmapDocx } from "@/lib/roadmap/roadmap-export.server";

const MAX_PER_TICK = 2;
const MAX_ATTEMPTS = 3;

type RequestRow = {
  id: string;
  user_id: string;
  nationality: string;
  destination: string;
  purpose: string;
  notify_email: string;
  profile: Record<string, unknown> | null;
  status: string;
  attempts: number;
};

async function processRows(rows: RequestRow[]): Promise<void> {
  if (!rows.length) return;

  const startedAt = new Date().toISOString();
  const claimedIds = new Set<string>();

  // Batch claim by grouping by attempts
  const byAttempts = new Map<number, string[]>();
  for (const row of rows) {
    const arr = byAttempts.get(row.attempts) || [];
    arr.push(row.id);
    byAttempts.set(row.attempts, arr);
  }

  for (const [attempts, ids] of byAttempts.entries()) {
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("personalized_roadmap_requests")
      .update({
        status: "in_progress",
        started_at: startedAt,
        attempts: attempts + 1,
        error_message: null,
      })
      .in("id", ids)
      .eq("status", "queued")
      .select("id");

    if (claimErr) {
      console.log("[craft-worker] batch claim failed", claimErr.message);
    } else if (claimed) {
      claimed.forEach((c) => claimedIds.add(c.id));
    }
  }

  const successfullyClaimed = rows.filter((r) => claimedIds.has(r.id));
  if (!successfullyClaimed.length) return;

  await Promise.all(
    successfullyClaimed.map(async (row) => {
      try {
        const profile = (row.profile ?? {}) as Record<string, unknown>;
        const brief: PersonalizedBrief = {
          nationality: row.nationality,
          destination: row.destination,
          purpose: row.purpose,
          blockedAccountNeeded: Boolean(profile.blockedAccountNeeded),
          insuranceNeeded: profile.insuranceNeeded !== false,
          flightsNeeded: Boolean(profile.flightsNeeded),
          hotelPreference:
            typeof profile.hotelPreference === "string" ? profile.hotelPreference : undefined,
        };

        console.log("[craft-worker] researching", row.id);
        const research = await researchPersonalizedRoadmap(brief);

        console.log(
          "[craft-worker] crafting",
          row.id,
          "citations:",
          research.reduce((n, b) => n + b.citations.length, 0),
        );
        const crafted: CraftedRoadmap = await craftPersonalizedRoadmap(
          {
            nationality: row.nationality,
            destination: row.destination,
            purpose: row.purpose,
            ...(profile as object),
          } as Parameters<typeof craftPersonalizedRoadmap>[0],
          research,
        );

        console.log("[craft-worker] rendering", row.id);
        const renderInput = {
          nationality: row.nationality,
          destination: row.destination,
          purpose: row.purpose,
          roadmap: crafted,
        };
        const [pdfBytes, docxBytes] = await Promise.all([
          generateRoadmapPdf(renderInput),
          generateRoadmapDocx(renderInput),
        ]);

        const folder = row.user_id;
        const base = `personalized-${row.id}`;
        const pdfPath = `${folder}/${base}.pdf`;
        const docxPath = `${folder}/${base}.docx`;

        const [pdfUp, docxUp] = await Promise.all([
          storage
            .put({
              bucket: "personalized-roadmaps",
              path: pdfPath,
              body: pdfBytes,
              contentType: "application/pdf",
            })
            .then(() => ({ error: null as null | { message: string } }))
            .catch((e: Error) => ({ error: { message: e.message } })),
          storage
            .put({
              bucket: "personalized-roadmaps",
              path: docxPath,
              body: docxBytes,
              contentType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            })
            .then(() => ({ error: null as null | { message: string } }))
            .catch((e: Error) => ({ error: { message: e.message } })),
        ]);
        if (pdfUp.error) throw new Error(`PDF upload: ${pdfUp.error.message}`);
        if (docxUp.error) throw new Error(`DOCX upload: ${docxUp.error.message}`);

        await supabaseAdmin
          .from("personalized_roadmap_requests")
          .update({
            status: "ready",
            ready_at: new Date().toISOString(),
            notified_at: new Date().toISOString(),
            pdf_path: pdfPath,
            docx_path: docxPath,
            result: crafted as never,
          })
          .eq("id", row.id);

        console.log("[craft-worker] ready", row.id);
      } catch (err) {
        const message = (err as Error).message?.slice(0, 500) ?? "Unknown error";
        const finalAttempt = row.attempts + 1 >= MAX_ATTEMPTS;
        console.error("[craft-worker] failed", row.id, message);
        await supabaseAdmin
          .from("personalized_roadmap_requests")
          .update({
            status: finalAttempt ? "failed" : "queued",
            error_message: message,
          })
          .eq("id", row.id);
      }
    }),
  );
}

export const Route = createFileRoute("/api/public/hooks/craft-personalized-roadmap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Minimal auth: require Supabase anon key in `apikey` header (canonical cron pattern)
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
        const got = request.headers.get("apikey");
        if (!expected || got !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { data: rows, error } = await supabaseAdmin
          .from("personalized_roadmap_requests")
          .select(
            "id, user_id, nationality, destination, purpose, notify_email, profile, status, attempts",
          )
          .eq("status", "queued")
          .lt("attempts", MAX_ATTEMPTS)
          .order("created_at", { ascending: true })
          .limit(MAX_PER_TICK);

        if (error) {
          console.error("[craft-worker] fetch failed", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        const list = (rows ?? []) as RequestRow[];
        if (!list.length) {
          return new Response(JSON.stringify({ processed: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Process in parallel with batched queries to improve performance
        await processRows(list);

        return new Response(JSON.stringify({ processed: list.length }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () =>
        new Response(JSON.stringify({ ok: true, hint: "POST with apikey header" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
});
