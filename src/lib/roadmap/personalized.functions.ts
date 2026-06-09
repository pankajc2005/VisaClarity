import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireTier } from "../subscription/entitlements.server";

const KindEnum = z.enum(["roadmap", "checklist_template"]);

const CreateInput = z.object({
  kind: KindEnum,
  nationality: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
  purpose: z.string().min(1).max(100),
  notes: z.string().max(2000).optional().nullable(),
  notifyEmail: z.string().email().max(320),
});

export const createPersonalizedRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Pro or Pro Max only.
    await requireTier(supabase, userId, "pro");

    const { data: row, error } = await supabase
      .from("personalized_requests")
      .insert({
        user_id: userId,
        kind: data.kind,
        nationality: data.nationality,
        destination: data.destination,
        purpose: data.purpose,
        notes: data.notes ?? null,
        notify_email: data.notifyEmail,
        status: "queued",
      })
      .select("id, created_at, status")
      .single();

    if (error || !row) {
      console.error("[createPersonalizedRequest] insert failed", error);
      throw new Error("Could not submit your personalized request. Please try again.");
    }
    return {
      id: row.id,
      createdAt: row.created_at,
      status: row.status,
      message:
        "We've received your request. Our team will craft it within 24–48 hours and notify you by email and in your dashboard the moment it's ready.",
    };
  });

export const listPersonalizedRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireTier(supabase, userId, "pro");

    const { data, error } = await supabase
      .from("personalized_requests")
      .select(
        "id, kind, status, nationality, destination, purpose, notes, notify_email, created_at, updated_at, notified_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[listPersonalizedRequests] read failed", error);
      throw new Error("Could not load your requests.");
    }
    return { requests: data ?? [] };
  });

export const cancelPersonalizedRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireTier(supabase, userId, "pro");

    const { error } = await supabase
      .from("personalized_requests")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) {
      console.error("[cancelPersonalizedRequest] delete failed", error);
      throw new Error("Could not cancel this request.");
    }
    return { ok: true };
  });
