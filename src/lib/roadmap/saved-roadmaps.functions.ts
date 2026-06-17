import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireTier } from "../subscription/entitlements.server";

const SaveInput = z.object({
  title: z.string().min(1).max(200),
  nationality: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
  purpose: z.string().min(1).max(100),
  // roadmap shape is broad — store as opaque JSON
  roadmap: z.unknown(),
});

export const saveRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SaveInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireTier(supabase, userId, "pro");

    const { data: row, error } = await supabase
      .from("saved_roadmaps")
      .insert({
        user_id: userId,
        title: data.title,
        nationality: data.nationality,
        destination: data.destination,
        purpose: data.purpose,
        roadmap: data.roadmap as Json,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[saveRoadmap] insert failed", error);
      throw new Error("Could not save roadmap. Please try again.");
    }
    return { id: row.id, createdAt: row.created_at };
  });

export const listSavedRoadmaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireTier(supabase, userId, "pro");

    const { data, error } = await supabase
      .from("saved_roadmaps")
      .select("id, title, nationality, destination, purpose, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[listSavedRoadmaps] read failed", error);
      throw new Error("Could not load saved roadmaps.");
    }
    return { roadmaps: data ?? [] };
  });

export const deleteSavedRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireTier(supabase, userId, "pro");

    const { error } = await supabase
      .from("saved_roadmaps")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) {
      console.error("[deleteSavedRoadmap] delete failed", error);
      throw new Error("Could not delete roadmap.");
    }
    return { ok: true };
  });
