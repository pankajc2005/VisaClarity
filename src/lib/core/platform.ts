/**
 * Platform abstraction layer.
 *
 * This file isolates everything that is currently bound to Lovable
 * (or any other host/provider). When migrating off Lovable, the only
 * file you should need to edit for runtime behavior is this one.
 *
 * See MIGRATION.md at the repo root for the full exit playbook.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Public canonical site URL — used in <link rel="canonical">, og:url,
 * sitemap entries, and JSON-LD. Override with VITE_SITE_URL when you
 * move to a custom domain or different host.
 */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://visaclarity.lovable.app";

/**
 * Google Analytics 4 measurement ID. Empty string disables tracking.
 */
export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ?? "G-XZR7Z51E28";

/**
 * Google sign-in.
 *
 * Today: routed through Lovable's managed OAuth broker.
 * After migration: replace the body with the standard Supabase call:
 *
 *   import { supabase } from "@/integrations/supabase/client";
 *   return supabase.auth.signInWithOAuth({
 *     provider: "google",
 *     options: { redirectTo: window.location.origin },
 *   });
 *
 * Keeping the call behind this wrapper means call sites never change.
 */
export async function signInWithGoogle(redirectUri?: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUri ?? window.location.origin },
  });
  return { error, redirected: true };
}
