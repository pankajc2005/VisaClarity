ALTER TABLE public.personalized_roadmap_requests
  DROP CONSTRAINT IF EXISTS personalized_status_check;

ALTER TABLE public.personalized_roadmap_requests
  ADD CONSTRAINT personalized_status_check
  CHECK (status IN ('queued', 'in_progress', 'crafting', 'ready', 'failed', 'cancelled'));
