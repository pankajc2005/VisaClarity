CREATE TABLE public.error_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  user_note TEXT,
  user_email TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.error_reports TO anon;
GRANT INSERT ON public.error_reports TO authenticated;
GRANT ALL ON public.error_reports TO service_role;

ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an error report"
ON public.error_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX idx_error_reports_created_at ON public.error_reports (created_at DESC);