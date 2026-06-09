import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/core/platform";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const SearchSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in or Sign up | VisaClarity" },
      {
        name: "description",
        content:
          "Sign in or create your free VisaClarity account to generate personalized visa roadmaps, save your progress, and access your shared links.",
      },
      { property: "og:title", content: "Sign in or Sign up | VisaClarity" },
      {
        property: "og:description",
        content:
          "Access your VisaClarity account to generate personalized visa roadmaps and save your progress.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect once authenticated. Validate `next` to prevent open-redirect
  // attacks: must start with a single "/" and contain no scheme or "//".
  useEffect(() => {
    if (session) {
      const safeNext = next && /^\/(?!\/)/.test(next) ? next : "/";
      navigate({ to: safeNext, replace: true } as never);
    }
  }, [session, next, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const fn =
      mode === "signup"
        ? supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : supabase.auth.signInWithPassword({ email, password });
    const { error: err } = await fn;
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    // onAuthStateChange listener will trigger redirect via useEffect above
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="fixed top-3 right-3 md:top-4 md:right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[440px]">
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          ← Back home
        </Link>

        <div className="mt-6 border border-border-strong bg-card p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream mb-3">
            VisaClarity
          </p>
          <h1 className="font-display text-[28px] leading-tight text-cream mb-2">
            {mode === "signup" ? "Create your free account" : "Welcome back"}
          </h1>
          <p className="text-[14px] text-muted-foreground mb-6">
            {mode === "signup"
              ? "Save your visa roadmaps, get updates on processing times, and access all guides."
              : "Sign in to access your saved roadmaps."}
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full h-12 px-4 bg-card text-foreground border border-border-strong focus:outline-none focus:border-cream/40 text-[14px]"
                required
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="w-full h-12 px-4 bg-card text-foreground border border-border-strong focus:outline-none focus:border-cream/40 text-[14px]"
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-2 bg-cream text-cream-foreground text-[14px] font-medium hover:bg-cream/90 disabled:opacity-60 transition-colors"
            >
              {submitting
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account & view roadmap"
                  : "Sign in"}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-strong" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-border-strong" />
          </div>

          <button
            type="button"
            onClick={async () => {
              setError(null);
              const result = await signInWithGoogle(window.location.origin);
              if (result.error) setError(result.error.message || "Google sign-in failed.");
            }}
            className="w-full h-12 mt-4 border border-border-strong bg-transparent text-cream text-[14px] font-medium hover:bg-cream/5 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 43.5c5 0 9.5-1.7 13-4.6l-6-5c-2 1.4-4.4 2.1-7 2.1-5.3 0-9.7-3.1-11.3-7.5l-6.6 5C9.6 39 16.3 43.5 24 43.5z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6 5c4-3.7 6.7-9 6.7-14.8 0-1.2-.1-2.3-.4-3z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-5 pt-5 border-t border-border-strong text-center">
            <button
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError(null);
              }}
              className="text-[13px] text-muted-foreground hover:text-cream"
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
