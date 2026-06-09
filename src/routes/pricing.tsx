import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Minus, Sparkles, Zap, Crown } from "lucide-react";
import { useState } from "react";
import { ComingSoonModal } from "@/components/common/ComingSoonModal";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useSubscription } from "@/hooks/useSubscription";
import type { Tier as PlanTier } from "@/lib/subscription/subscription.functions";

import { SITE_URL } from "@/lib/core/platform";
const PAGE_TITLE = "Pricing — VisaClarity Free, Pro & Pro Max";
const PAGE_DESCRIPTION =
  "Choose the VisaClarity plan that fits your journey. Free roadmap to start, Pro for 30 roadmaps a month, Pro Max for unlimited with priority support.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: SITE_URL + "/pricing" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/pricing" }],
  }),
  component: PricingPage,
});

type Billing = "monthly" | "annual";

type Tier = {
  id: "free" | "pro" | "pro_max";
  name: string;
  tagline: string;
  icon: React.ReactNode;
  priceMonthly: number;
  priceAnnual: number;
  ctaLabel: string;
  highlight?: boolean;
  features: { label: string; included: boolean | string }[];
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try a roadmap, no commitment.",
    icon: <Sparkles className="size-4" />,
    priceMonthly: 0,
    priceAnnual: 0,
    ctaLabel: "Get started free",
    features: [
      { label: "1 roadmap per month", included: true },
      { label: "High-level steps only", included: true },
      { label: "Generic document checklist", included: true },
      { label: "3 official source links", included: true },
      { label: "Saved roadmaps", included: false },
      { label: "PDF & DOCX export", included: false },
      { label: "AI Q&A assistant", included: false },
      { label: "Policy-change alerts", included: false },
      { label: "Multi-applicant", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For serious applicants.",
    icon: <Zap className="size-4" />,
    priceMonthly: 19,
    priceAnnual: 149,
    ctaLabel: "Start Pro",
    highlight: true,
    features: [
      { label: "30 roadmaps per month", included: true },
      { label: "Full step-by-step depth", included: true },
      { label: "Personalized checklist + templates", included: true },
      { label: "All sources, validated", included: true },
      { label: "Unlimited saved roadmaps", included: true },
      { label: "PDF & DOCX export", included: true },
      { label: "AI Q&A — 50 questions/month", included: "50/mo" },
      { label: "Email policy-change alerts", included: true },
      { label: "Multi-applicant — up to 2 people", included: "2 people" },
      { label: "Email support (48h)", included: true },
    ],
  },
  {
    id: "pro_max",
    name: "Pro Max",
    tagline: "Everything in Pro, with no limits.",
    icon: <Crown className="size-4" />,
    priceMonthly: 49,
    priceAnnual: 399,
    ctaLabel: "Go Pro Max",
    features: [
      { label: "Unlimited roadmaps", included: true },
      { label: "Full + advanced scenarios", included: true },
      { label: "Personalized + custom edits", included: true },
      { label: "All sources + auto re-check", included: true },
      { label: "Unlimited saved roadmaps", included: true },
      { label: "PDF, DOCX + branded share links", included: true },
      { label: "Unlimited AI Q&A", included: "Unlimited" },
      { label: "Real-time SMS + email alerts", included: true },
      { label: "Unlimited multi-applicant", included: "Unlimited" },
      { label: "Priority support (24h) + early access", included: true },
    ],
  },
];

function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const sub = useSubscription();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ComingSoonModal />
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto h-full px-6 md:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block size-1.5 bg-cream rounded-full" />
            <span className="text-[15px] font-medium">VisaClarity</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link to="/pricing" className="text-[13px] text-foreground transition-colors">
              Pricing
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="pt-[140px] pb-32 px-6 md:px-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
              Pricing
            </p>
            <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-5">
              Simple plans for every applicant.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you need depth, exports, or unlimited generation.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-14">
            <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 text-[13px] rounded-full transition-colors ${
                  billing === "monthly"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`px-5 py-2 text-[13px] rounded-full transition-colors flex items-center gap-2 ${
                  billing === "annual"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                  Save 35%
                </span>
              </button>
            </div>
          </div>

          {/* Tier cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const price = billing === "monthly" ? tier.priceMonthly : tier.priceAnnual;
              const suffix = tier.priceMonthly === 0 ? "" : billing === "monthly" ? "/mo" : "/yr";
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border p-8 flex flex-col transition-all ${
                    tier.highlight ? "bg-card md:scale-[1.02]" : "border-border bg-card/40"
                  }`}
                  style={
                    tier.highlight
                      ? {
                          borderColor: "color-mix(in oklab, var(--gold) 55%, transparent)",
                          boxShadow: "var(--shadow-gold)",
                        }
                      : undefined
                  }
                >
                  {tier.highlight && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] rounded-full bg-background"
                      style={{
                        color: "var(--gold-deep)",
                        border: "1px solid color-mix(in oklab, var(--gold) 55%, transparent)",
                      }}
                    >
                      Most chosen
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    {tier.icon}
                    <span className="text-[13px] font-medium uppercase tracking-wider">
                      {tier.name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{tier.tagline}</p>
                  <div className="mb-8">
                    <span
                      className={`text-5xl tracking-tight ${
                        tier.highlight ? "font-display font-normal" : "font-medium"
                      }`}
                      style={tier.highlight ? { color: "var(--gold-deep)" } : undefined}
                    >
                      ${price}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">{suffix}</span>
                    {billing === "annual" && tier.priceMonthly > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ~${(tier.priceAnnual / 12).toFixed(2)}/mo billed yearly
                      </p>
                    )}
                  </div>
                  {(() => {
                    const planId = tier.id as PlanTier;
                    const isCurrent = sub.isAuthenticated && sub.tier === planId;
                    const label = isCurrent
                      ? "Your current plan"
                      : !sub.isAuthenticated && planId === "free"
                        ? tier.ctaLabel
                        : planId === "free"
                          ? "Switch to Free"
                          : tier.ctaLabel;
                    return (
                      <button
                        disabled={isCurrent}
                        className={`w-full h-11 rounded-full text-[13px] font-medium transition-colors mb-8 ${
                          tier.highlight
                            ? "gold-shimmer bg-foreground text-background hover:opacity-95"
                            : "border border-border hover:border-foreground"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                        style={
                          tier.highlight
                            ? {
                                boxShadow:
                                  "inset 0 0 0 1px color-mix(in oklab, var(--gold) 60%, transparent)",
                              }
                            : undefined
                        }
                        onClick={() => {
                          if (isCurrent) return;
                          if (planId === "free") {
                            navigate({ to: "/" });
                            return;
                          }
                          if (!sub.isAuthenticated) {
                            navigate({ to: "/auth", search: { next: "/pricing" } });
                            return;
                          }
                          alert(
                            "Checkout is coming soon. Until then, an admin can grant you " +
                              (planId === "pro_max" ? "Pro Max" : "Pro") +
                              " access from the dashboard.",
                          );
                        }}
                      >
                        {label}
                      </button>
                    );
                  })()}

                  <ul className="space-y-3 text-sm">
                    {tier.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-3">
                        {f.included ? (
                          <Check className="size-4 mt-0.5 shrink-0 text-foreground" />
                        ) : (
                          <Minus className="size-4 mt-0.5 shrink-0 text-muted-foreground/50" />
                        )}
                        <span
                          className={
                            f.included ? "text-foreground" : "text-muted-foreground/60 line-through"
                          }
                        >
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* One-time option */}
          <div className="mt-16 max-w-2xl mx-auto text-center rounded-2xl border border-border bg-card/40 p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              No subscription? No problem.
            </p>
            <h2 className="text-2xl font-medium mb-3">One-time roadmap — $9</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Need a single full Pro-depth roadmap without subscribing? Pay once, get the full
              report.
            </p>
            <button
              onClick={() => alert("Coming soon with Stripe checkout in the next phase.")}
              className="h-10 px-6 rounded-full text-[13px] font-medium border border-border hover:border-foreground transition-colors"
            >
              Buy one-time roadmap
            </button>
          </div>

          {/* FAQ teaser */}
          <div className="mt-20 text-center">
            <p className="text-sm text-muted-foreground">
              Questions about which plan fits?{" "}
              <Link to="/" className="text-foreground underline">
                Try the free roadmap first
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
