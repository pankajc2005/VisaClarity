-- Tighten error_reports INSERT policy: drop "always true" and add length validation
DROP POLICY IF EXISTS "Anyone can submit an error report" ON public.error_reports;

CREATE POLICY "Anyone can submit a validated error report"
ON public.error_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (message IS NULL OR char_length(message) <= 2000)
  AND (stack IS NULL OR char_length(stack) <= 8000)
  AND (user_note IS NULL OR char_length(user_note) <= 2000)
  AND (user_email IS NULL OR (char_length(user_email) <= 320 AND user_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'))
  AND (url IS NULL OR char_length(url) <= 2048)
  AND (user_agent IS NULL OR char_length(user_agent) <= 1000)
);