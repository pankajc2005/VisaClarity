import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // Hydrate Supabase session client-side and verify with the Auth server.
    // On SSR there's no session, but `_authenticated` routes are noindex so
    // we just bounce to /auth — the post-login redirect will bring them back.

    // TEMPORARILY DISABLED AUTH CHECK FOR TESTING
    return;

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { next: location.href } });
    }
  },
  component: () => <Outlet />,
});
