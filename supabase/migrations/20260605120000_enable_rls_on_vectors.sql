-- Enable Row Level Security on public.vectors
--
-- Why: public.vectors holds the embedding chunks of every user's indexed
-- documents (~27k rows) and was exposed to PostgREST with RLS disabled,
-- meaning anyone with the public anon key could read/modify every row.
--
-- No policies are added on purpose. The Next.js client never queries this
-- table (verified: no .from("vectors") / .rpc() in the app). The only writer
-- is the Python worker, which connects with the service-role (sb_secret_)
-- key. service_role has rolbypassrls = true (verified against pg_roles), so
-- RLS is invisible to it and ingestion/search are unaffected. RLS-on with
-- zero policies = deny-all for anon/authenticated, which is exactly the goal.
--
-- Reversible at any time with:
--   ALTER TABLE public.vectors DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.vectors ENABLE ROW LEVEL SECURITY;
