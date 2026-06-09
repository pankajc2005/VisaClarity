CREATE TABLE public.roadmap_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text NOT NULL UNIQUE,
  nationality text NOT NULL,
  destination text NOT NULL,
  purpose text NOT NULL,
  roadmap jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE INDEX idx_roadmap_cache_key ON public.roadmap_cache(cache_key);
CREATE INDEX idx_roadmap_cache_expires ON public.roadmap_cache(expires_at);

GRANT SELECT ON public.roadmap_cache TO anon, authenticated;
GRANT ALL ON public.roadmap_cache TO service_role;

ALTER TABLE public.roadmap_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cached roadmaps are public-read"
ON public.roadmap_cache
FOR SELECT
USING (expires_at > now());