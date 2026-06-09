CREATE TABLE public.roadmap_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  fingerprint text NOT NULL,
  month text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  last_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (ip_hash, fingerprint, month)
);

CREATE INDEX idx_roadmap_usage_lookup ON public.roadmap_usage (ip_hash, month);
CREATE INDEX idx_roadmap_usage_fp ON public.roadmap_usage (fingerprint, month);

GRANT ALL ON public.roadmap_usage TO service_role;

ALTER TABLE public.roadmap_usage ENABLE ROW LEVEL SECURITY;

-- No public policies — only the server (service role) reads/writes this table.