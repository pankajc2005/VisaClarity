import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { setUserTierAdmin, listAdminUsers } from "./admin.server";

const TierInput = z.object({
  userId: z.string().uuid(),
  tier: z.enum(["free", "pro", "pro_max"]),
});

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  // Uses the existing has_role(uuid, app_role) function — RLS-safe.
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) {
    console.error("[admin] has_role check failed", error);
    throw new Error("Could not verify admin status.");
  }
  if (!data) {
    throw new Error("Forbidden: admin only.");
  }
}

export const setUserTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TierInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    return setUserTierAdmin(data.userId, data.tier);
  });

export const listUsersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    return listAdminUsers();
  });
