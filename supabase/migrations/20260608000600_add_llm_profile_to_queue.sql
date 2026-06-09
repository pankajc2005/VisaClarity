-- Migration: add_llm_profile_to_queue

ALTER TABLE public.blog_topic_queue
  ADD COLUMN IF NOT EXISTS llm_profile text DEFAULT 'balanced';
