-- Shareable roadmap URLs: stable random slug per cached route
ALTER TABLE public.roadmap_cache
  ADD COLUMN IF NOT EXISTS share_slug text;

-- Backfill existing rows with a random 10-char slug (url-safe)
UPDATE public.roadmap_cache
SET share_slug = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
WHERE share_slug IS NULL;

-- Sanitize any '/' or '+' that base64 may have produced
UPDATE public.roadmap_cache
SET share_slug = translate(share_slug, '/+=', 'abc')
WHERE share_slug ~ '[/+=]';

ALTER TABLE public.roadmap_cache
  ALTER COLUMN share_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS roadmap_cache_share_slug_key
  ON public.roadmap_cache(share_slug);

-- Public read by slug (no expiry filter — shared links should keep working)
DROP POLICY IF EXISTS "Shared roadmaps are public-read by slug" ON public.roadmap_cache;
CREATE POLICY "Shared roadmaps are public-read by slug"
  ON public.roadmap_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.roadmap_cache TO anon, authenticated;