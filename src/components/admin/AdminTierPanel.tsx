import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsersAdmin, setUserTier } from "@/lib/admin/admin.functions";
import type { Tier } from "@/lib/subscription/subscription.functions";

const TIERS: Tier[] = ["free", "pro", "pro_max"];

export function AdminTierPanel() {
  const listUsers = useServerFn(listUsersAdmin);
  const setTier = useServerFn(setUserTier);
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { userId: string; tier: Tier }) => setTier({ data: vars }),
    onSettled: () => {
      setPendingId(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users…</div>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-medium">Set user tier</h2>
        <p className="text-[12px] text-muted-foreground mt-1">
          Manually grant Pro / Pro Max access for testing. This will be driven by Stripe webhooks
          once checkout is wired up.
        </p>
      </div>
      <div className="divide-y divide-border">
        {(data?.users ?? []).map((u: any) => (
          <div key={u.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm truncate">{u.email || "(no email)"}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{u.id.slice(0, 8)}…</p>
            </div>
            <div className="flex items-center gap-1">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setPendingId(u.id + t);
                    mutation.mutate({ userId: u.id, tier: t });
                  }}
                  disabled={mutation.isPending}
                  className={`text-[11px] uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border transition-colors ${
                    u.tier === t
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  } disabled:opacity-50`}
                >
                  {pendingId === u.id + t && mutation.isPending ? "…" : t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
