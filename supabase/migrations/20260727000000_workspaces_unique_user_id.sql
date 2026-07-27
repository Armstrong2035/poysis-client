-- Enforce one workspace per user.
--
-- ensureWorkspace() previously used getWorkspaceId()'s .single(), which errors
-- when a user already has multiple workspace rows and returns null — so every
-- login/callback thought "no workspace" and inserted another blank one. One
-- account snowballed to 300+ empty duplicates before it was caught.
--
-- The application fix (getWorkspaceId now orders + limit(1)) stops new
-- duplicates, and ensureWorkspace treats a unique collision as "already
-- exists". This constraint is the database-level guarantee that it can never
-- recur. Idempotent so it's safe whether or not it was already applied by hand.
--
-- Prerequisite: existing duplicates must be deduped first, or this fails.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspaces_user_id_unique'
  ) then
    alter table public.workspaces
      add constraint workspaces_user_id_unique unique (user_id);
  end if;
end $$;
