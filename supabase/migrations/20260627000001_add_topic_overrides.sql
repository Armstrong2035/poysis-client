-- Topic overrides: tracks user-modified topics so recluster won't overwrite them.
-- A row here means the owner has explicitly edited this topic (rename, doc adds/removes).
-- locked = true  → recluster skips this topic but can still suggest doc additions.
-- locked = false → owner has explicitly unlocked (recluster can overwrite again).

CREATE TABLE IF NOT EXISTS topic_overrides (
  topic_id      TEXT        NOT NULL,
  workspace_id  TEXT        NOT NULL,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked        BOOLEAN     NOT NULL DEFAULT TRUE,
  custom_label  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, workspace_id)
);

ALTER TABLE topic_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own topic overrides"
  ON topic_overrides
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
