import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { tierAtLeast, type Tier } from "./subscription.functions";

/**
 * Server-only helper. Throws if the authenticated user's tier is below `min`.
 * Use inside `createServerFn` handlers AFTER `requireSupabaseAuth`.
 */
export async function requireTier(
  supabase: SupabaseClient<Database>,
  userId: string,
  min: Exclude<Tier, "free">,
): Promise<Tier> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[requireTier] read failed", error);
    throw new Error("Could not verify your subscription. Please try again.");
  }

  const tier = (data?.tier ?? "free") as Tier;
  if (!tierAtLeast(tier, min)) {
    const label = min === "pro_max" ? "Pro Max" : "Pro";
    const err = new Error(`UPGRADE_REQUIRED:${min}:${label} plan required.`);
    throw err;
  }
  return tier;
}

export const UPGRADE_ERROR_PREFIX = "UPGRADE_REQUIRED:";
