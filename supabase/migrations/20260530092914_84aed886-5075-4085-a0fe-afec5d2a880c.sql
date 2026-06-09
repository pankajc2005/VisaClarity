
-- Type of personalized deliverable
CREATE TYPE public.personalized_request_kind AS ENUM ('roadmap', 'checklist_template');
CREATE TYPE public.personalized_request_status AS ENUM ('queued', 'in_progress', 'ready', 'failed', 'cancelled');

CREATE TABLE public.personalized_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.personalized_request_kind NOT NULL,
  status public.personalized_request_status NOT NULL DEFAULT 'queued',
  nationality text NOT NULL,
  destination text NOT NULL,
  purpose text NOT NULL,
  notes text,
  notify_email text NOT NULL,
  deliverable jsonb,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_personalized_requests_user ON public.personalized_requests(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personalized_requests TO authenticated;
GRANT ALL ON public.personalized_requests TO service_role;

ALTER TABLE public.personalized_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own personalized requests"
ON public.personalized_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create their own personalized requests"
ON public.personalized_requests FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND char_length(nationality) BETWEEN 1 AND 100
  AND char_length(destination) BETWEEN 1 AND 100
  AND char_length(purpose) BETWEEN 1 AND 100
  AND (notes IS NULL OR char_length(notes) <= 2000)
  AND char_length(notify_email) BETWEEN 3 AND 320
);

CREATE POLICY "Users can cancel their own queued requests"
ON public.personalized_requests FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status IN ('queued', 'cancelled', 'failed'));

CREATE POLICY "Users can update notes on their queued requests"
ON public.personalized_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'queued')
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_personalized_requests_updated_at
BEFORE UPDATE ON public.personalized_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
