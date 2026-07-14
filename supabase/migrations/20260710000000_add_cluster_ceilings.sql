-- Cluster (topic) exposure ceilings — the farthest a cluster's contents may
-- ever reach: private / team / public. Backs the ceiling picker in the
-- Knowledge Map and Canvas, previously mocked client-side in
-- MockPermissionsContext (localStorage, key "poysis-mock-ceilings").
--
-- No backfill needed: the prior "mock" state lived only in each browser's
-- localStorage and was never persisted anywhere server-reachable, so there
-- is no existing real data to migrate.
--
-- A missing row for a given (topic_id, owner_user_id) means "private" —
-- callers must treat "no row" as the safe default, not an error.
--
-- 'team' is included in the CHECK constraint so rows can exist once Teams
-- ships, even though every UI ceiling picker keeps "Team" locked/disabled
-- for now.

CREATE TABLE IF NOT EXISTS cluster_ceilings (
  topic_id       TEXT        NOT NULL,
  owner_user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ceiling        TEXT        NOT NULL DEFAULT 'private' CHECK (ceiling IN ('private', 'team', 'public')),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, owner_user_id)
);

-- Supports "fetch all of my ceilings" (client, on mount) and "fetch all of
-- this owner's public topics" (chat route, non-owner path) without a
-- sequential scan — the PK index leads with topic_id, which doesn't help
-- either of those lookups.
CREATE INDEX IF NOT EXISTS cluster_ceilings_owner_ceiling_idx
  ON cluster_ceilings (owner_user_id, ceiling);

ALTER TABLE cluster_ceilings ENABLE ROW LEVEL SECURITY;

-- Owner: full read/write on their own rows.
CREATE POLICY "Owners manage their own cluster ceilings"
  ON cluster_ceilings
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Non-owner (any authenticated requester, or anon for a future flow): may
-- only ever see rows explicitly marked public. Cannot see private/team rows
-- for any owner, and cannot write anything (no WITH CHECK on this policy).
CREATE POLICY "Anyone can see which topics are marked public"
  ON cluster_ceilings
  FOR SELECT
  TO anon, authenticated
  USING (ceiling = 'public');
