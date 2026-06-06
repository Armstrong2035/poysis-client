-- Make user deletion cascade through all user-owned tables
--
-- Problem: deleting a row from auth.users failed because four tables
-- referenced it with ON DELETE NO ACTION, leaving orphan-blocking rows:
--   notebooks, documents, consolidation_stories, workspace_members
-- (All other user-owned tables — workspaces, drive_connections, the other
-- consolidation_* tables — were already ON DELETE CASCADE.)
--
-- This switches the four laggards to ON DELETE CASCADE so removing a user
-- (e.g. from the Supabase dashboard) cleans up their data automatically and
-- frees the email for reuse, instead of erroring on a foreign-key violation.

alter table public.notebooks
  drop constraint notebooks_user_id_fkey,
  add  constraint notebooks_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.documents
  drop constraint documents_user_id_fkey,
  add  constraint documents_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.consolidation_stories
  drop constraint consolidation_stories_user_id_fkey,
  add  constraint consolidation_stories_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.workspace_members
  drop constraint workspace_members_user_id_fkey,
  add  constraint workspace_members_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
