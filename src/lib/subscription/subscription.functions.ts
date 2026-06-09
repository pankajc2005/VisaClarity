import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Tier = "free" | "pro" | "pro_max";

const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, pro_max: 2 };

export function tierAtLeast(current: Tier, min: Tier): boolean {
  return TIER_RANK[current] >= TIER_RANK[min];
}

export type SubscriptionInfo = {
  tier: Tier;
  status: string;
  currentPeriodEnd: string | null;
  isPro: boolean;
  isProMax: boolean;
  isPaid: boolean;
};

/**
 * Returns the signed-in user's subscription info.
 * Single source of truth that the UI reads via useSubscription().
 */
export const getMyTier = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionInfo> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("tier, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getMyTier] read failed", error);
    }

    const tier = (data?.tier ?? "free") as Tier;
    const status = data?.status ?? "active";
    return {
      tier,
      status,
      currentPeriodEnd: data?.current_period_end ?? null,
      isPro: tierAtLeast(tier, "pro"),
      isProMax: tier === "pro_max",
      isPaid: tier !== "free",
    };
  });
