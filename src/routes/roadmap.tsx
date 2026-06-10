import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { generateRoadmap, QUOTA_ERROR_PREFIX } from "@/lib/roadmap/roadmap.functions";
import { supabase } from "@/integrations/supabase/client";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { useAuth } from "@/hooks/useAuth";
import { RoadmapView, MobileTOC } from "@/components/roadmap/RoadmapSections";
import { RoadmapActions } from "@/components/roadmap/RoadmapActions";
import { ThemeToggle } from "@/components/common/ThemeToggle";

import { SITE_URL } from "@/lib/core/platform";

const SearchSchema = z.object({
  nationality: z.string().optional(),
  destination: z.string().optional(),
  purpose: z.string().optional(),
  email: z.string().email().optional(),
  fp: z.string().optional(),
});

export const Route = createFileRoute("/roadmap")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Your Personalized Visa Roadmap | VisaClarity" },
      {
        name: "description",
        content:
          "Live-generated visa roadmap with documents, costs, processing time, embassy contacts and official links.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/roadmap" }],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { nationality, destination, purpose, email, fp } = useSearch({ from: "/roadmap" });
  const navigate = useNavigate();
  const generate = useServerFn(generateRoadmap);
  const { user, loading: authLoading } = useAuth();

  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!email || !nationality || !destination || !purpose) return;
    supabase
      .from("leads")
      .insert({ email, nationality, destination, purpose })
      .then(({ error }) => {
        if (error) console.warn("[roadmap] lead insert failed:", error.message);
      });
  }, [email, nationality, destination, purpose]);

  const hasRoute = Boolean(nationality && destination && purpose);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["roadmap", nationality, destination, purpose, refreshKey],
    queryFn: () =>
      generate({
        data: {
          nationality: nationality!,
          destination: destination!,
          purpose: purpose!,
          fingerprint: fp,
          email,
          refresh: refreshKey > 0,
        },
      }),
    enabled: hasRoute,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const destLower = (destination ?? "").toLowerCase();
  const relatedPosts = BLOG_POSTS.filter(
    (p) =>
      p.title.toLowerCase().includes(destLower) || p.keywords.toLowerCase().includes(destLower),
  ).slice(0, 3);

  const unlocked = Boolean(user) || emailUnlocked;

  async function handleEmailUnlock() {
    if (!email) return;
    setEmailSending(true);
    await new Promise((r) => setTimeout(r, 250));
    setEmailSending(false);
    setEmailUnlocked(true);
  }

  function handleSignupRedirect() {
    if (!nationality || !destination || !purpose) {
      navigate({ to: "/auth", search: { next: "/" } });
      return;
    }
    const next = `/roadmap?nationality=${encodeURIComponent(nationality)}&destination=${encodeURIComponent(destination)}&purpose=${encodeURIComponent(purpose)}${email ? `&email=${encodeURIComponent(email)}` : ""}`;
    navigate({ to: "/auth", search: { next } });
  }

  if (!hasRoute) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="fixed top-3 right-3 md:top-4 md:right-4 z-50 no-print">
          <ThemeToggle />
        </div>
        <div className="max-w-md text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream mb-3">
            No route selected
          </p>
          <h1 className="font-display text-[28px] text-cream mb-4">Generate your roadmap</h1>
          <p className="text-[14px] text-muted-foreground mb-6">
            Pick your nationality, destination, and purpose on the home page to get a personalized
            roadmap.
          </p>
          <Link
            to="/"
            className="inline-flex items-center h-11 px-6 bg-cream text-cream-foreground text-[13px] font-medium hover:bg-cream/90"
          >
            Start now
          </Link>
        </div>
      </main>
    );
  }

  const errorMessage = error ? (error as Error).message : "";
  const isQuotaError = errorMessage.startsWith(QUOTA_ERROR_PREFIX);
  const displayedError = isQuotaError
    ? errorMessage.replace(QUOTA_ERROR_PREFIX, "").trim()
    : errorMessage;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="fixed top-3 right-3 md:top-4 md:right-4 z-50 no-print">
        <ThemeToggle />
      </div>
      {/* Printed running header */}
      <div className="print-only fixed top-0 left-0 right-0 px-6 py-2 border-b border-border-strong text-[10px] uppercase tracking-[0.18em] font-mono">
        VisaClarity · {nationality} → {destination} · {purpose}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between no-print">
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Back home
          </Link>
          {!authLoading && (
            <div className="font-mono text-[10px] uppercase tracking-[0.18em]">
              {user ? (
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              ) : (
                <button onClick={handleSignupRedirect} className="text-cream hover:underline">
                  Sign in
                </button>
              )}
            </div>
          )}
        </div>

        <header className="mt-6 pb-8 border-b border-border-strong">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream mb-3">
            Your visa roadmap
          </p>
          <h1 className="font-display text-[36px] md:text-[48px] leading-[1.05] text-cream">
            {nationality} → {destination}
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Purpose: <span className="text-foreground">{purpose}</span>
          </p>
        </header>

        {isLoading && <LoadingState />}

        {error && (
          <div className="mt-10 border border-destructive/40 bg-destructive/5 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-destructive mb-2">
              {isQuotaError ? "Free limit reached" : "Generation failed"}
            </p>
            <p className="text-[14px] text-foreground mb-4">{displayedError}</p>
            <div className="flex flex-wrap gap-3">
              {isQuotaError ? (
                <>
                  {!user && (
                    <button
                      onClick={handleSignupRedirect}
                      className="h-11 px-5 bg-cream text-cream-foreground text-[13px] font-medium hover:bg-cream/90"
                    >
                      Create free account
                    </button>
                  )}
                  <Link
                    to="/"
                    className="h-11 px-5 inline-flex items-center border border-border-strong text-[13px] hover:border-cream/40"
                  >
                    Back home
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="h-11 px-5 bg-cream text-cream-foreground text-[13px] font-medium hover:bg-cream/90 disabled:opacity-60"
                >
                  {isFetching ? "Retrying..." : "Try again"}
                </button>
              )}
            </div>
          </div>
        )}

        {data?.roadmap && (
          <div className="relative animate-in fade-in duration-1000 slide-in-from-bottom-4">
            <div className={unlocked ? "" : "pointer-events-none select-none"}>
              <TrustBanner
                verifiedAt={data.roadmap.verifiedAt}
                cached={data.roadmap.cached}
                shareSlug={data.roadmap.shareSlug}
                onRefresh={handleRefresh}
                refreshing={isFetching}
              />
              {unlocked && (
                <RoadmapActions
                  roadmap={data.roadmap}
                  nationality={nationality!}
                  destination={destination!}
                  purpose={purpose!}
                />
              )}
              <RoadmapView roadmap={data.roadmap} relatedPosts={relatedPosts} blurred={!unlocked} />
            </div>

            {!unlocked && (
              <UnlockOverlay
                email={email}
                emailSending={emailSending}
                onEmailUnlock={handleEmailUnlock}
                onSignup={handleSignupRedirect}
              />
            )}
          </div>
        )}
      </div>

      {data?.roadmap && unlocked && <MobileTOC />}
    </main>
  );
}

function UnlockOverlay({
  email,
  emailSending,
  onEmailUnlock,
  onSignup,
}: {
  email?: string;
  emailSending: boolean;
  onEmailUnlock: () => void;
  onSignup: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-start justify-center pt-[240px] pointer-events-none no-print">
      <div className="pointer-events-auto sticky top-24 w-full max-w-[520px] border border-border-strong bg-card p-7 shadow-2xl mx-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream mb-3">
          Unlock your full roadmap
        </p>
        <h2 className="font-display text-[24px] leading-tight text-cream mb-2">
          Your roadmap is ready.
        </h2>
        <p className="text-[14px] leading-[1.6] text-muted-foreground mb-6">
          Documents, financial requirements, embassy contacts, official links, and rejection
          patterns — choose how you'd like to receive it.
        </p>

        <div className="space-y-3">
          {email && (
            <button
              onClick={onEmailUnlock}
              disabled={emailSending}
              className="w-full h-12 bg-cream text-cream-foreground text-[14px] font-medium hover:bg-cream/90 disabled:opacity-60 transition-colors"
            >
              {emailSending
                ? "Sending..."
                : `Send to ${email.length > 28 ? email.slice(0, 25) + "…" : email}`}
            </button>
          )}

          <button
            onClick={onSignup}
            className="w-full h-12 bg-transparent border border-cream/40 text-cream text-[14px] font-medium hover:bg-cream/5 transition-colors"
          >
            Create free account to view &amp; save
          </button>

          <p className="text-center text-[12px] text-muted-foreground pt-2">
            Already have an account?{" "}
            <button onClick={onSignup} className="text-cream hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Animated "thinking" loader — rotates status lines + shows section skeletons
// so users feel progress instead of staring at a single spinner.
function LoadingState() {
  const stages = [
    "Reading consular rules for your route…",
    "Cross-checking 2026 financial requirements…",
    "Pulling embassy contacts and official portals…",
    "Listing the most common rejection reasons…",
    "Tailoring the step-by-step plan to your profile…",
    "Verifying official source links…",
    "Assembling your roadmap…",
  ];
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % stages.length), 2200);
    return () => clearInterval(id);
  }, [stages.length]);

  return (
    <div className="mt-10 animate-in fade-in duration-500">
      <div className="border border-border-strong bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="inline-block w-1.5 h-1.5 bg-cream rounded-full animate-pulse" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream">
            Generating live roadmap
          </p>
        </div>
        <p className="mt-4 text-[15px] text-foreground transition-opacity">{stages[stage]}</p>
        <div className="mt-5 h-[2px] bg-border-strong overflow-hidden">
          <div
            className="h-full bg-cream transition-all duration-[2200ms]"
            style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
          />
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">
          This usually takes 10–25 seconds. Don't close this tab.
        </p>
      </div>

      <RoadmapSkeleton />
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="mt-10">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border-strong bg-card p-4 animate-pulse">
            <div className="h-2.5 w-16 bg-muted/40 rounded mb-3"></div>
            <div className="h-5 w-24 bg-muted/40 rounded"></div>
          </div>
        ))}
      </div>

      {/* Summary Skeletons */}
      <div className="mt-8 space-y-2 animate-pulse">
        <div className="h-3 w-full bg-muted/40 rounded"></div>
        <div className="h-3 w-11/12 bg-muted/40 rounded"></div>
        <div className="h-3 w-4/5 bg-muted/40 rounded"></div>
      </div>

      <div className="mt-4 border-l-2 border-muted/40 pl-4 animate-pulse">
        <div className="h-3 w-64 bg-muted/40 rounded"></div>
      </div>

      {/* Sections Skeletons */}
      <div className="mt-12 space-y-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="flex items-baseline justify-between gap-4 mb-5">
              <div>
                <div className="h-2.5 w-8 bg-muted/40 rounded mb-3"></div>
                <div className="h-7 w-48 bg-muted/40 rounded"></div>
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="border border-border-strong bg-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-5 h-5 rounded-full border border-muted/40 bg-muted/20 shrink-0 mt-0.5"></div>
                    <div className="flex-1 space-y-3 mt-1">
                      <div className="h-4 w-1/3 bg-muted/40 rounded"></div>
                      <div className="h-3 w-full bg-muted/20 rounded"></div>
                      <div className="h-3 w-5/6 bg-muted/20 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustBanner({
  verifiedAt,
  cached,
  shareSlug,
  onRefresh,
  refreshing,
}: {
  verifiedAt: string;
  cached: boolean;
  shareSlug: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const dt = new Date(verifiedAt);
  const dateStr = isNaN(dt.getTime())
    ? "just now"
    : dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}/r/${shareSlug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border border-border-strong bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream">
          {cached ? "Cached" : "Freshly generated"}
        </span>
        <span>Verified {dateStr}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 no-print">
        <button
          onClick={handleCopy}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-cream"
        >
          {copied ? "Link copied" : "Copy share link"}
        </button>
        <button
          onClick={handlePrint}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-cream"
        >
          Print
        </button>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream hover:underline disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
