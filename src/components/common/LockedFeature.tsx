import { Link } from "@tanstack/react-router";
import { Lock, Crown, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { tierAtLeast, type Tier } from "@/lib/subscription/subscription.functions";

type Requires = Exclude<Tier, "free">;

export function LockedFeature({
  requires,
  feature,
  description,
  children,
}: {
  requires: Requires;
  feature: string;
  description?: string;
  children: ReactNode;
}) {
  const { tier, loading, isAuthenticated } = useSubscription();

  if (loading) {
    return <div className="opacity-60">{children}</div>;
  }

  const allowed = isAuthenticated && tierAtLeast(tier, requires);
  if (allowed) return <>{children}</>;

  const planLabel = requires === "pro_max" ? "Pro Max" : "Pro";
  const Icon = requires === "pro_max" ? Crown : Zap;

  return (
    <div className="relative">
      <div className="blur-md pointer-events-none select-none transition-all" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4 no-print">
        <div
          className="max-w-md w-full rounded-2xl border bg-card p-6 text-center shadow-xl"
          style={{
            borderColor: "color-mix(in oklab, var(--gold) 45%, transparent)",
            boxShadow: "var(--shadow-gold)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
            style={{
              backgroundColor: "color-mix(in oklab, var(--gold) 12%, transparent)",
              color: "var(--gold-deep)",
            }}
          >
            <Icon className="size-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
              {planLabel} feature
            </span>
          </div>
          <h3 className="font-display text-xl mb-2 flex items-center justify-center gap-2">
            <Lock className="size-4 text-muted-foreground" />
            {feature}
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            {description ?? `Available on the ${planLabel} plan.`}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center h-11 rounded-full bg-foreground text-background text-[13px] font-medium hover:opacity-95"
            >
              Upgrade to {planLabel}
            </Link>
            {!isAuthenticated && (
              <Link
                to="/auth"
                search={{ next: "/pricing" }}
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                Already have an account? Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
