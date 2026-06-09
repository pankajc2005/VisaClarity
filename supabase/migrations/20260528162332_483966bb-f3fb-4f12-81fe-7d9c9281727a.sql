
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  nationality TEXT NOT NULL,
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.leads TO anon, authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(email) BETWEEN 3 AND 320
    AND email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    AND char_length(nationality) BETWEEN 1 AND 100
    AND char_length(destination) BETWEEN 1 AND 100
    AND char_length(purpose) BETWEEN 1 AND 100
  );

CREATE INDEX idx_leads_created_at ON public.leads (created_at DESC);
