
-- Enums
DO $$ BEGIN
  CREATE TYPE public.blog_post_status AS ENUM ('draft','in_review','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blog_queue_status AS ENUM ('queued','processing','done','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blog_gen_step AS ENUM ('plan','research','draft','fact_check','style','image','finalize');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authors
CREATE TABLE IF NOT EXISTS public.blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  locale_hint text,
  expertise text[] NOT NULL DEFAULT '{}',
  voice_style text NOT NULL DEFAULT 'explainer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_authors TO anon, authenticated;
GRANT ALL ON public.blog_authors TO service_role;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authors are public-read" ON public.blog_authors FOR SELECT USING (true);
CREATE POLICY "Admins manage authors" ON public.blog_authors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_blog_authors_updated_at BEFORE UPDATE ON public.blog_authors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Guide',
  hero_image_url text,
  hero_image_alt text,
  hero_prompt text,
  author_id uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL,
  reading_minutes integer NOT NULL DEFAULT 6,
  body_mdx text NOT NULL DEFAULT '',
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.blog_post_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  generation_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON public.blog_posts(author_id);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are public" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins see all posts" ON public.blog_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Topic queue
CREATE TABLE IF NOT EXISTS public.blog_topic_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  primary_keyword text NOT NULL,
  secondary_keywords text[] NOT NULL DEFAULT '{}',
  audience text,
  angle text,
  priority integer NOT NULL DEFAULT 5,
  status public.blog_queue_status NOT NULL DEFAULT 'queued',
  error text,
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  created_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_queue_status ON public.blog_topic_queue(status, priority DESC, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_topic_queue TO authenticated;
GRANT ALL ON public.blog_topic_queue TO service_role;
ALTER TABLE public.blog_topic_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage queue" ON public.blog_topic_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_blog_queue_updated_at BEFORE UPDATE ON public.blog_topic_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generation logs
CREATE TABLE IF NOT EXISTS public.blog_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.blog_topic_queue(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  step public.blog_gen_step NOT NULL,
  tool text,
  request jsonb,
  response_summary text,
  ok boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_gen_logs_queue ON public.blog_generation_logs(queue_id, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_gen_logs_post ON public.blog_generation_logs(post_id, created_at);
GRANT SELECT ON public.blog_generation_logs TO authenticated;
GRANT ALL ON public.blog_generation_logs TO service_role;
ALTER TABLE public.blog_generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read logs" ON public.blog_generation_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
