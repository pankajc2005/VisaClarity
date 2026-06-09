import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Crown, Sparkles } from "lucide-react";

const STORAGE_KEY = "vc_pricing_coming_soon_seen";

export function ComingSoonModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Show once per session so the user can still browse the page after dismissing.
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setOpen(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }, []);

  if (!open) return null;

  function handleUseFree() {
    setOpen(false);
    navigate({ to: "/" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/85 backdrop-blur-sm">
      <div
        className="w-full max-w-[460px] bg-card border border-border-strong p-8 text-center relative"
        style={{
          boxShadow: "var(--shadow-gold)",
          borderColor: "color-mix(in oklab, var(--gold) 55%, transparent)",
        }}
      >
        <div
          className="mx-auto mb-5 size-14 rounded-full flex items-center justify-center"
          style={{
            background: "color-mix(in oklab, var(--gold) 18%, transparent)",
            color: "var(--gold-deep)",
          }}
        >
          <Crown className="size-7" />
        </div>

        <p
          className="font-mono text-[10px] uppercase tracking-[0.22em] mb-3"
          style={{ color: "var(--gold-deep)" }}
        >
          Coming soon
        </p>
        <h2 className="font-display text-[26px] text-cream leading-tight mb-3">
          Pro &amp; Pro Max are on the way
        </h2>
        <p className="text-[14px] text-muted-foreground mb-7">
          We&apos;re polishing the Pro and Pro Max experience. Until then, enjoy our{" "}
          <span className="text-foreground font-medium">Free plan</span> — generate a full
          personalized visa roadmap, no card required.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleUseFree}
            className="gold-shimmer w-full h-12 bg-cream text-cream-foreground text-[14px] font-medium hover:bg-cream/90 transition-colors flex items-center justify-center gap-2"
            style={{
              boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--gold) 60%, transparent)",
            }}
          >
            <Sparkles className="size-4" />
            Use Free plan now
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full h-11 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Just browsing the plans
          </button>
        </div>
      </div>
    </div>
  );
}
