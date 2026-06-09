import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Tier } from "../subscription/subscription.functions";

export async function setUserTierAdmin(targetUserId: string, tier: Tier) {
  const { error } = await supabaseAdmin.from("user_subscriptions").upsert(
    {
      user_id: targetUserId,
      tier,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[setUserTierAdmin] upsert failed", error);
    throw new Error("Could not update tier.");
  }
  return { ok: true };
}

export async function listAdminUsers() {
  // Pull recent users via auth admin API; cap at 50 for the simple admin form.
  const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 50,
  });
  if (usersErr) {
    console.error("[listAdminUsers] listUsers failed", usersErr);
    throw new Error("Could not list users.");
  }
  const ids = usersData.users.map((u: any) => u.id);

  const { data: subs, error: subsErr } = await supabaseAdmin
    .from("user_subscriptions")
    .select("user_id, tier, status")
    .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  if (subsErr) {
    console.error("[listAdminUsers] subs read failed", subsErr);
    throw new Error("Could not load subscriptions.");
  }
  const byId = new Map<string, any>((subs ?? []).map((s: any) => [s.user_id, s]));

  return {
    users: usersData.users.map((u: any) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      tier: (byId.get(u.id)?.tier ?? "free") as Tier,
      status: byId.get(u.id)?.status ?? "active",
    })),
  };
}
