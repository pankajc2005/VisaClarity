import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared auth/tier indicator for the top navigation.
 * - Logged out  → "Sign in" + "Sign up" links
 * - Logged in   → tier badge (Free / Pro / Pro Max) + account menu
 */
export function UserNav() {
  const { user, loading } = useAuth();
  const { tier, isPro, isProMax, isPaid } = useSubscription();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (loading) {
    return <div className="h-7 w-20 bg-muted/40 animate-pulse rounded-full" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/auth"
          search={{ next: "/" }}
          className="hidden sm:inline text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
        <Link
          to="/auth"
          search={{ next: "/" }}
          className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[13px] bg-cream text-cream-foreground hover:bg-cream/90 transition-colors"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const tierLabel = isProMax ? "Pro Max" : isPro ? "Pro" : "Free";
  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/" });
  }

  return (
    <div ref={menuRef} className="relative flex items-center gap-2">
      {/* Tier badge */}
      <span
        title={
          isProMax
            ? "Pro Max — full access unlocked"
            : isPro
              ? "Pro — premium features unlocked"
              : "Free plan"
        }
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.18em]"
        style={
          isPaid
            ? {
                color: "var(--gold, #d4a84c)",
                border: "1px solid color-mix(in oklab, var(--gold, #d4a84c) 60%, transparent)",
                boxShadow: "var(--shadow-gold, 0 0 0 1px rgba(212,168,76,0.15))",
                background:
                  "linear-gradient(180deg, color-mix(in oklab, var(--gold, #d4a84c) 10%, transparent), transparent)",
              }
            : {
                color: "var(--muted-foreground)",
                border: "1px solid var(--border-strong, var(--border))",
              }
        }
      >
        {isPaid && <span aria-hidden>★</span>}
        {tierLabel}
      </span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center size-8 rounded-full bg-card border border-border-strong text-[12px] font-medium text-foreground hover:bg-cream/5 transition-colors"
        title={user.email ?? "Account"}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 bg-card border border-border-strong shadow-lg z-50"
        >
          <div className="px-4 py-3 border-b border-border-strong">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Signed in as
            </p>
            <p className="text-[13px] text-foreground truncate">{user.email}</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Plan: <span className={isPaid ? "text-cream font-medium" : ""}>{tierLabel}</span>
            </p>
          </div>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] text-foreground hover:bg-cream/5"
          >
            Dashboard
          </Link>
          <Link
            to="/pricing"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] text-foreground hover:bg-cream/5"
          >
            {isProMax ? "Manage plan" : "Upgrade plan"}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-left block px-4 py-2.5 text-[13px] text-muted-foreground hover:bg-cream/5 border-t border-border-strong"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
