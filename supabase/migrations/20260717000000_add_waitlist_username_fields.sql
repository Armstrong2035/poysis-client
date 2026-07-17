-- The marketplace's redesigned waitlist forms ask for a reserved username and
-- an optional "who should we add next" request, alongside the email already
-- captured. Both are free text, not identifiers anything else joins against,
-- so no uniqueness/index is added.

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS requested_creator TEXT;
