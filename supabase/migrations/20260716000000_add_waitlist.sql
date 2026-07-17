-- Waitlist signups captured from the public marketplace/playground pages.
--
-- Anon (unauthenticated visitors) need INSERT so the join-waitlist form
-- works without login, but must not be able to SELECT — otherwise the
-- public anon key would let anyone dump every collected email.

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
