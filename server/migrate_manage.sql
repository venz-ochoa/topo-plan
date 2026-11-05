-- this is for live updates, deleting tasks, leaving a project and removing members (keeps all your data)
-- run this once in the Supabase SQL Editor

-- this is for telling Supabase to announce changes in these tables (the app listens and reloads)
alter publication supabase_realtime add table tasks, requests, roles;

-- this is for letting admins delete tasks of their projects (their requests go with them)
create policy "admins delete tasks" on tasks for delete to authenticated
  using (project_id in (select my_admin_projects()));

-- this is for leaving a project (uid is you) or removing someone else (admins only)
-- a project always keeps at least one admin, and the person's tasks become unassigned
create or replace function remove_from_project(pid uuid, uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if uid <> auth.uid() and pid not in (select my_admin_projects()) then
    raise exception 'Only admins can remove other people';
  end if;
  if exists (select 1 from roles where user_id = uid and project_id = pid and role = 'admin')
     and (select count(*) from roles where project_id = pid and role = 'admin') = 1 then
    raise exception 'A project needs at least one admin. Invite another admin first.';
  end if;
  update tasks set assigned_to = null where project_id = pid and assigned_to = uid;
  delete from requests where project_id = pid and requested_by = uid;
  delete from roles where user_id = uid and project_id = pid;
  if not found then raise exception 'That person is not in this project'; end if;
end $$;

revoke execute on function remove_from_project(uuid, uuid) from public, anon;
grant execute on function remove_from_project(uuid, uuid) to authenticated;
