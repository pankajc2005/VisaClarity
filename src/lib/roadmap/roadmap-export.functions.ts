import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireTier } from "../subscription/entitlements.server";
import { generateRoadmapPdf, generateRoadmapDocx } from "./roadmap-export.server";

// We accept the roadmap JSON inline OR look it up by saved roadmap id.
const ExportInput = z.union([
  z.object({
    savedId: z.string().uuid(),
  }),
  z.object({
    roadmap: z.unknown(),
    nationality: z.string().min(1).max(100),
    destination: z.string().min(1).max(100),
    purpose: z.string().min(1).max(100),
  }),
]);

async function resolveRoadmap(
  supabase: import("@supabase/supabase-js").SupabaseClient<
    import("@/integrations/supabase/types").Database
  >,
  userId: string,
  input: z.infer<typeof ExportInput>,
) {
  if ("savedId" in input) {
    const { data, error } = await supabase
      .from("saved_roadmaps")
      .select("nationality, destination, purpose, roadmap")
      .eq("id", input.savedId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) {
      throw new Error("Roadmap not found.");
    }
    return {
      nationality: data.nationality,
      destination: data.destination,
      purpose: data.purpose,
      roadmap: data.roadmap,
    };
  }
  return {
    nationality: input.nationality,
    destination: input.destination,
    purpose: input.purpose,
    roadmap: input.roadmap,
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // btoa is available in workerd
  return btoa(binary);
}

export const exportRoadmapPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ExportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireTier(supabase, userId, "pro");

    const r = await resolveRoadmap(supabase, userId, data);
    const bytes = await generateRoadmapPdf(r);
    return {
      filename: `visa-roadmap-${r.nationality}-${r.destination}.pdf`
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, "-"),
      contentType: "application/pdf",
      base64: bytesToBase64(bytes),
    };
  });

export const exportRoadmapDocx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ExportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireTier(supabase, userId, "pro");

    const r = await resolveRoadmap(supabase, userId, data);
    const bytes = await generateRoadmapDocx(r);
    return {
      filename: `visa-roadmap-${r.nationality}-${r.destination}.docx`
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, "-"),
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      base64: bytesToBase64(bytes),
    };
  });
