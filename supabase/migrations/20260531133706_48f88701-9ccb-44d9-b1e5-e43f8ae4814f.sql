
-- 1. Generic idempotency keys table (any server fn / webhook can dedupe)
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key text PRIMARY KEY,
  scope text NOT NULL,
  user_id uuid,
  request_hash text,
  response jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

GRANT ALL ON public.idempotency_keys TO service_role;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
-- No client policies: server-only via service role.

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires
  ON public.idempotency_keys (expires_at);

-- 2. Idempotency on personalized roadmap requests
ALTER TABLE public.personalized_roadmap_requests
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_personalized_roadmap_idem
  ON public.personalized_roadmap_requests (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 3. Saga step log (distributed transaction tracking for craft worker)
CREATE TABLE IF NOT EXISTS public.saga_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_id text NOT NULL,
  step_name text NOT NULL,
  status text NOT NULL,
  payload jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (saga_id, step_name)
);

GRANT ALL ON public.saga_steps TO service_role;
ALTER TABLE public.saga_steps ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_saga_steps_saga ON public.saga_steps (saga_id);
