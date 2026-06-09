
-- Extend personalized_roadmap_requests with crafting + file fields
ALTER TABLE public.personalized_roadmap_requests
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS docx_path text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS eta_minutes integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS title text;

-- Helpful index for the worker to pick the next queued row
CREATE INDEX IF NOT EXISTS idx_pers_roadmap_status_created
  ON public.personalized_roadmap_requests (status, created_at);

-- Service-role needs full access for the worker
GRANT ALL ON public.personalized_roadmap_requests TO service_role;

-- Private storage bucket for the generated files
INSERT INTO storage.buckets (id, name, public)
VALUES ('personalized-roadmaps', 'personalized-roadmaps', false)
ON CONFLICT (id) DO NOTHING;

-- Users can read only their own files. We namespace by user_id (first path segment).
DROP POLICY IF EXISTS "Users read own personalized roadmap files"
  ON storage.objects;
CREATE POLICY "Users read own personalized roadmap files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'personalized-roadmaps'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable pg_cron + pg_net for the scheduled worker call
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
