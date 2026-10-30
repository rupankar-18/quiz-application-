-- ==============================================================================
-- QuizPulse Supabase Database Schema
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> Your Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create the `users` table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar TEXT DEFAULT '',
  stats JSONB DEFAULT '{"gamesPlayed": 0, "highScore": 0, "totalScore": 0, "totalQuestions": 0, "correctAnswers": 0, "accuracy": 0, "streak": 0, "lastPlayedAt": null}'::jsonb,
  quiz_history JSONB DEFAULT '[]'::jsonb,
  last_login_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes for fast lookup by username and email
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (LOWER(email));

-- 3. Configure Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow all operations (our Express server handles auth logic)
DROP POLICY IF EXISTS "Allow full access to users" ON public.users;
CREATE POLICY "Allow full access to users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Automatically update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
