-- Subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'pro_max');

-- =========================================================
-- user_subscriptions: source of truth for entitlement
-- =========================================================
CREATE TABLE public.user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policies: server-only via service_role.

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION public.create_free_subscription_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_subscription_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_free_subscription_on_signup();

-- Backfill existing users
INSERT INTO public.user_subscriptions (user_id, tier)
SELECT id, 'free' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Tier lookup helper (used by server fns + admin gating)
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id UUID)
RETURNS public.subscription_tier
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.user_subscriptions WHERE user_id = _user_id),
    'free'::public.subscription_tier
  );
$$;

-- =========================================================
-- saved_roadmaps: Pro+ feature
-- =========================================================
CREATE TABLE public.saved_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  nationality TEXT NOT NULL,
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  roadmap JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_roadmaps_user_id ON public.saved_roadmaps(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_roadmaps TO authenticated;
GRANT ALL ON public.saved_roadmaps TO service_role;

ALTER TABLE public.saved_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved roadmaps"
ON public.saved_roadmaps FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved roadmaps"
ON public.saved_roadmaps FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved roadmaps"
ON public.saved_roadmaps FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved roadmaps"
ON public.saved_roadmaps FOR DELETE TO authenticated
USING (auth.uid() = user_id);