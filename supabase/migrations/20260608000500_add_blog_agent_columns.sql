-- 1. Add QA and LLM tracking columns to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS qa_score integer,
  ADD COLUMN IF NOT EXISTS qa_passed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS llm_provider text;

-- 2. Add keyword expansion and batch columns to blog_topic_queue
ALTER TABLE public.blog_topic_queue
  ADD COLUMN IF NOT EXISTS raw_keyword text,
  ADD COLUMN IF NOT EXISTS expanded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS batch_id text;

-- 3. Create indexes for performance (specifically for the cron job)
CREATE INDEX IF NOT EXISTS idx_blog_topic_queue_status_priority
  ON public.blog_topic_queue (status, priority DESC)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at
  ON public.blog_posts (created_at DESC);

-- 4. Re-apply grants to ensure permissions are correct
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_topic_queue TO authenticated;
GRANT ALL ON public.blog_topic_queue TO service_role;
