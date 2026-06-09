import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireTier } from "../subscription/entitlements.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ProfileSchema = z.object({
  // Core
  nationality: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
  purpose: z.string().min(1).max(100),
  travelDatesFrom: z.string().max(40).optional().nullable(),
  travelDatesTo: z.string().max(40).optional().nullable(),
  budgetAmount: z.number().nonnegative().max(10_000_000).optional().nullable(),
  budgetCurrency: z.string().max(8).optional().nullable(),
  // Money & background
  incomeMonthly: z.number().nonnegative().max(10_000_000).optional().nullable(),
  incomeCurrency: z.string().max(8).optional().nullable(),
  sponsor: z
    .object({
      hasSponsor: z.boolean().optional(),
      relation: z.string().max(80).optional(),
      notes: z.string().max(500).optional(),
    })
    .optional()
    .nullable(),
  blockedAccountNeeded: z.boolean().optional().nullable(),
  employmentStatus: z.string().max(80).optional().nullable(),
  familyTies: z.string().max(500).optional().nullable(),
  priorRefusals: z.string().max(500).optional().nullable(),
  // Travel & extras
  insuranceNeeded: z.boolean().optional().nullable(),
  flightsNeeded: z.boolean().optional().nullable(),
  hotelPreference: z.string().max(200).optional().nullable(),
  additionalContext: z.string().max(2000).optional().nullable(),
  notifyEmail: z.string().email().max(320),
});

export const createPersonalizedRoadmapRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireTier(supabase, userId, "pro");

    // Rate limit: max 3 in-flight per user
    const { count } = await supabase
      .from("personalized_roadmap_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["queued", "in_progress"]);
    if ((count ?? 0) >= 3) {
      throw new Error(
        "You already have 3 personalized roadmaps in progress. Please wait for one to finish.",
      );
    }

    const { nationality, destination, purpose, notifyEmail, ...rest } = data;
    const title = `${nationality} → ${destination} · ${purpose}`;

    const { data: row, error } = await supabase
      .from("personalized_roadmap_requests")
      .insert({
        user_id: userId,
        nationality,
        destination,
        purpose,
        notify_email: notifyEmail,
        profile: { nationality, destination, purpose, ...rest } as never,
        status: "queued",
        title,
        eta_minutes: 12,
      })
      .select("id, created_at, status, eta_minutes")
      .single();

    if (error || !row) {
      console.error("[createPersonalizedRoadmapRequest] insert failed", error);
      throw new Error("Could not submit your personalized roadmap request. Please try again.");
    }
    return {
      id: row.id,
      createdAt: row.created_at,
      status: row.status,
      etaMinutes: row.eta_minutes,
      message:
        "We've started crafting your personalized roadmap. It usually takes 10–15 minutes — you'll be notified by email and on this dashboard the moment it's ready.",
    };
  });

export const listPersonalizedRoadmapRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("personalized_roadmap_requests")
      .select(
        "id, title, nationality, destination, purpose, status, notify_email, created_at, started_at, ready_at, eta_minutes, error_message, pdf_path, docx_path",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[listPersonalizedRoadmapRequests] read failed", error);
      throw new Error("Could not load your personalized roadmaps.");
    }
    return { requests: data ?? [] };
  });

export const cancelPersonalizedRoadmapRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("personalized_roadmap_requests")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId)
      .in("status", ["queued", "failed", "cancelled"]);
    if (error) {
      console.error("[cancelPersonalizedRoadmapRequest] delete failed", error);
      throw new Error("Could not cancel this request.");
    }
    return { ok: true };
  });

/**
 * Returns short-lived signed download URLs for a ready row.
 * Uses service role because the bucket is private and signed URLs are user-scoped.
 */
export const getPersonalizedRoadmapDownloads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("personalized_roadmap_requests")
      .select("id, pdf_path, docx_path, status, user_id")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !row) throw new Error("Roadmap not found.");
    if (row.status !== "ready") throw new Error("Your roadmap isn't ready yet.");

    const expiresIn = 60 * 60; // 1h
    const [pdf, docx] = await Promise.all([
      row.pdf_path
        ? supabaseAdmin.storage
            .from("personalized-roadmaps")
            .createSignedUrl(row.pdf_path, expiresIn)
        : Promise.resolve({ data: null, error: null }),
      row.docx_path
        ? supabaseAdmin.storage
            .from("personalized-roadmaps")
            .createSignedUrl(row.docx_path, expiresIn)
        : Promise.resolve({ data: null, error: null }),
    ]);

    return {
      pdfUrl: pdf.data?.signedUrl ?? null,
      docxUrl: docx.data?.signedUrl ?? null,
    };
  });
