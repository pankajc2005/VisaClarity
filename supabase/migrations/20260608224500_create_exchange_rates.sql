-- Create exchange_rates table for daily rate caching
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  base_currency text PRIMARY KEY,
  rates jsonb NOT NULL,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  fetching_since timestamptz
);

-- Grant appropriate permissions
GRANT SELECT ON public.exchange_rates TO anon, authenticated;
GRANT ALL ON public.exchange_rates TO service_role;

-- Enable Row Level Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow read-only access for anonymous and authenticated users
DROP POLICY IF EXISTS "Allow public read access to exchange rates" ON public.exchange_rates;
CREATE POLICY "Allow public read access to exchange rates"
  ON public.exchange_rates
  FOR SELECT
  TO anon, authenticated
  USING (true);
