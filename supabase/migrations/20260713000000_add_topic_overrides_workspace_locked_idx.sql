-- Supports "fetch this workspace's locked topics" (recluster route, and the
-- new /api/workspace/topic-locks GET) without a sequential scan — the PK
-- index leads with topic_id, which doesn't help a workspace_id lookup.
CREATE INDEX IF NOT EXISTS topic_overrides_workspace_locked_idx
  ON topic_overrides (workspace_id, locked);
