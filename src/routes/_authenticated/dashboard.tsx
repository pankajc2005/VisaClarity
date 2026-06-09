import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Crown, Zap, Sparkles, Trash2, ExternalLink } from "lucide-react";
import { listSavedRoadmaps, deleteSavedRoadmap } from "@/lib/roadmap/saved-roadmaps.functions";
import { useSubscription } from "@/hooks/useSubscription";
import { LockedFeature } from "@/components/common/LockedFeature";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AdminTierPanel } from "@/components/admin/AdminTierPanel";
import { PersonalizedRequestsList } from "@/components/personalized/PersonalizedRequestsList";
import { PersonalizedRoadmapList } from "@/components/personalized/PersonalizedRoadmapList";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Your dashboard | VisaClarity" }, { name: "robots", content: "noindex" }],
  }),
  component: DashboardPage,
});

function TierBadge({ tier }: { tier: "free" | "pro" | "pro_max" }) {
  const cfg =
    tier === "pro_max"
      ? { label: "Pro Max", Icon: Crown }
      : tier === "pro"
        ? { label: "Pro", Icon: Zap }
        : { label: "Free", Icon: Sparkles };
  const { label, Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.18em] border"
      style={{
        borderColor:
          tier === "free" ? "var(--border)" : "color-mix(in oklab, var(--gold) 50%, transparent)",
        color: tier === "free" ? "var(--muted-foreground)" : "var(--gold-deep)",
      }}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function DashboardPage() {
  const sub = useSubscription();
  const isAdmin = useIsAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 inset-x-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto h-full px-6 md:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block size-1.5 bg-cream rounded-full" />
            <span className="text-[15px] font-medium">VisaClarity</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="text-[13px] text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-[13px] text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="pt-[120px] pb-24 px-6 md:px-10">
        <div className="max-w-[1100px] mx-auto">
          <header className="mb-10 flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
                Dashboard
              </p>
              <h1 className="text-3xl md:text-5xl font-medium tracking-tight">
                Your saved roadmaps
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <TierBadge tier={sub.tier} />
              {!sub.isPaid && (
                <Link
                  to="/pricing"
                  className="inline-flex items-center h-9 px-4 rounded-full text-[12px] font-medium bg-foreground text-background hover:opacity-95"
                >
                  Upgrade
                </Link>
              )}
            </div>
          </header>

          <LockedFeature
            requires="pro"
            feature="Saved roadmaps"
            description="Save unlimited roadmaps and revisit them anytime — available on Pro and Pro Max."
          >
            <SavedRoadmapsList />
          </LockedFeature>

          <LockedFeature
            requires="pro"
            feature="Personalized roadmaps"
            description="AI-crafted personalized roadmaps with verified web research — ready in 10–15 minutes."
          >
            <PersonalizedRoadmapList />
          </LockedFeature>

          <LockedFeature
            requires="pro"
            feature="Personalized requests"
            description="Hand-crafted roadmaps and checklists from our team (24–48 hours)."
          >
            <PersonalizedRequestsList />
          </LockedFeature>

          {isAdmin && (
            <section className="mt-16">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                Admin
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <Link
                  to="/admin/blog"
                  className="inline-flex items-center h-9 px-4 rounded-full bg-cream text-cream-foreground text-[13px] font-medium hover:bg-cream/90 transition-colors"
                >
                  Blog admin →
                </Link>
              </div>
              <AdminTierPanel />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function useIsAdmin() {
  // TEMPORARILY ALWAYS TRUE FOR TESTING
  return true;

  const { data } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    staleTime: 60_000,
  });
  return !!data;
}

function SavedRoadmapsList() {
  const list = useServerFn(listSavedRoadmaps);
  const del = useServerFn(deleteSavedRoadmap);
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-roadmaps"],
    queryFn: () => list(),
  });

  const mutation = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-roadmaps"] }),
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-card/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
        <p className="text-sm text-foreground">
          Couldn't load your saved roadmaps: {(error as Error).message}
        </p>
      </div>
    );
  }

  const items = data?.roadmaps ?? [];

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-10 text-center">
        <p className="text-sm text-muted-foreground mb-4">You haven't saved any roadmaps yet.</p>
        <Link
          to="/"
          className="inline-flex items-center h-10 px-5 rounded-full text-[13px] font-medium bg-foreground text-background hover:opacity-95"
        >
          Generate a roadmap
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card/40 p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-medium truncate">{r.title}</h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                {r.nationality} → {r.destination} · {r.purpose}
              </p>
            </div>
            {confirmId === r.id ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => mutation.mutate(r.id)}
                  className="text-[11px] text-destructive hover:underline"
                  disabled={mutation.isPending}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(r.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4">
            Saved {new Date(r.created_at).toLocaleDateString()}
          </p>
          <div className="mt-4">
            <Link
              to="/roadmap"
              search={{
                nationality: r.nationality,
                destination: r.destination,
                purpose: r.purpose,
              }}
              className="inline-flex items-center gap-1.5 text-[12px] text-foreground hover:underline"
            >
              Open <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
