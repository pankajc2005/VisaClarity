import { useState, type FormEvent } from "react";
import { MessageSquarePlus, X, Gift, Bug, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FeedbackType = "bug" | "feature";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feature");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setError("Please describe it in at least 10 characters.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email or leave it blank.");
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from("error_reports").insert({
      message: `[${type === "bug" ? "BUG REPORT" : "FEATURE REQUEST"}] ${trimmed.slice(0, 1900)}`,
      user_note: trimmed.slice(0, 2000),
      user_email: email.trim() || null,
      url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 1000) : null,
      context: { kind: "user_feedback", type },
    });
    setSubmitting(false);
    if (insertError) {
      setError("Could not submit right now. Please try again.");
      return;
    }
    setDone(true);
    setMessage("");
    setEmail("");
    setTimeout(() => {
      setDone(false);
      setOpen(false);
    }, 2500);
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Suggest a feature or report a bug"
        className="fixed bottom-6 right-6 z-40 h-12 px-5 rounded-full bg-cream text-cream-foreground text-[13px] font-medium shadow-lg hover:opacity-95 transition-opacity flex items-center gap-2"
        style={{
          boxShadow:
            "inset 0 0 0 1px color-mix(in oklab, var(--gold) 60%, transparent), 0 10px 30px -10px rgba(0,0,0,0.4)",
        }}
      >
        <MessageSquarePlus className="size-4" />
        Feedback
        <span
          className="ml-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{
            background: "color-mix(in oklab, var(--gold) 25%, transparent)",
            color: "var(--gold-deep)",
          }}
        >
          + Reward
        </span>
      </button>

      {/* Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-[480px] bg-card border border-border-strong p-7 relative"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "var(--shadow-gold)" }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            {done ? (
              <div className="py-8 text-center">
                <div
                  className="mx-auto mb-4 size-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "color-mix(in oklab, var(--gold) 20%, transparent)",
                    color: "var(--gold-deep)",
                  }}
                >
                  <Gift className="size-6" />
                </div>
                <h3 className="font-display text-[22px] text-cream mb-2">Thank you!</h3>
                <p className="text-[14px] text-muted-foreground">
                  We&apos;ll review it and reach out about your reward if your email is included.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2" style={{ color: "var(--gold-deep)" }}>
                  <Gift className="size-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                    Earn a reward
                  </span>
                </div>
                <h3 className="font-display text-[24px] text-cream mb-2">
                  Help us improve VisaClarity
                </h3>
                <p className="text-[13px] text-muted-foreground mb-5">
                  Report a bug or suggest a feature. Accepted ideas earn a free Pro month, gift
                  card, or your name on our credits page.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Type selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("feature")}
                      className={`h-11 flex items-center justify-center gap-2 text-[13px] border transition-colors ${
                        type === "feature"
                          ? "bg-cream text-cream-foreground border-cream"
                          : "border-border-strong text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Lightbulb className="size-4" /> Feature
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("bug")}
                      className={`h-11 flex items-center justify-center gap-2 text-[13px] border transition-colors ${
                        type === "bug"
                          ? "bg-cream text-cream-foreground border-cream"
                          : "border-border-strong text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Bug className="size-4" /> Bug
                    </button>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                      {type === "bug" ? "What went wrong?" : "Your idea"}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder={
                        type === "bug"
                          ? "Tell us what happened, on which page, and what you expected..."
                          : "Describe the feature and how it would help you..."
                      }
                      className="w-full px-4 py-3 bg-background text-foreground border border-border-strong focus:outline-none focus:border-cream/40 text-[14px] resize-none placeholder:text-muted-foreground/60"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                      Email <span className="text-muted-foreground/60">(optional, for reward)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      maxLength={320}
                      className="w-full h-12 px-4 bg-background text-foreground border border-border-strong focus:outline-none focus:border-cream/40 text-[14px] placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {error && <p className="text-[13px] text-destructive">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-cream text-cream-foreground text-[14px] font-medium hover:bg-cream/90 transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Submit feedback"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
