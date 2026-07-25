-- Add a `verified` gate to notebooks.
--
-- A notebook can be published (slugged) and public without appearing in the
-- marketplace directory. `verified` is the admin-controlled boundary between
-- "what a creator makes and shares on their own" and "what we surface in the
-- marketplace feed". It defaults to false, so publishing a notebook never
-- auto-lists it. Direct slug access (/[slug]) is intentionally unaffected — only
-- the directory (home + search) filters on this column. The admin flow that
-- flips this to true is built separately.
ALTER TABLE notebooks ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;

-- Partial index for the directory query, which only ever reads verified rows.
CREATE INDEX IF NOT EXISTS notebooks_verified_idx
  ON notebooks (verified)
  WHERE verified = true;

-- Seed the current directory: Emmanuel Iren is the one notebook we surface for
-- now. Everything else (including josh-leadership-ltd-notebook) stays unverified
-- and simply drops off the marketplace — nothing is deleted.
UPDATE notebooks SET verified = true WHERE slug = 'emmanuel-iren-live-notebook';
