-- this is for letting one person be in many projects (keeps all your data)
-- run this once in the Supabase SQL Editor

-- this is for removing the rules and functions that assumed one project per person
drop policy "see my team" on users;
drop policy "see my project" on projects;
drop policy "see my team roles" on roles;
drop policy "admins see invites" on invites;
drop policy "admins make invites" on invites;
drop policy "see my tasks" on tasks;
drop policy "admins add tasks" on tasks;
drop policy "admins edit tasks" on tasks;
drop function my_project(), is_admin();
drop function create_project(text), join_project(text);

-- this is for making the key "person + project", so one person can have many roles
alter table roles drop constraint roles_pkey;
alter table roles add primary key (user_id, project_id);

-- this is for asking "which projects am I in?" and "which ones am I admin of?"
create or replace function my_projects() returns setof uuid
language sql security definer set search_path = public stable as $$
  select project_id from roles where user_id = auth.uid()
$$;

create or replace function my_admin_projects() returns setof uuid
language sql security definer set search_path = public stable as $$
  select project_id from roles where user_id = auth.uid() and role = 'admin'
$$;

-- this is for the new rules
create policy "see my team" on users for select to authenticated
  using (id = auth.uid() or id in (select user_id from roles where project_id in (select my_projects())));
create policy "see my projects" on projects for select to authenticated
  using (id in (select my_projects()));
create policy "see my team roles" on roles for select to authenticated
  using (project_id in (select my_projects()));
create policy "admins see invites" on invites for select to authenticated
  using (project_id in (select my_admin_projects()));
create policy "admins make invites" on invites for insert to authenticated
  with check (project_id in (select my_admin_projects()) and created_by = auth.uid());
create policy "see my tasks" on tasks for select to authenticated
  using (project_id in (select my_projects()));
create policy "admins add tasks" on tasks for insert to authenticated
  with check (project_id in (select my_admin_projects()));
create policy "admins edit tasks" on tasks for update to authenticated
  using (project_id in (select my_admin_projects()))
  with check (project_id in (select my_admin_projects()));

-- this is for making a project (the creator becomes its admin), it gives back the project id
create or replace function create_project(project_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  insert into projects (name) values (trim(project_name)) returning id into pid;
  insert into roles (user_id, project_id, role) values (auth.uid(), pid, 'admin');
  return pid;
end $$;

-- this is for joining a project with an invite code (you get the role the invite was made for)
create or replace function join_project(invite_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  select * into inv from invites
    where code = invite_code and used_by is null and expires_at > now() for update;
  if not found then raise exception 'This invite code is not valid or has expired'; end if;
  if exists (select 1 from roles where user_id = auth.uid() and project_id = inv.project_id) then
    raise exception 'You are already in this project';
  end if;
  insert into roles (user_id, project_id, role) values (auth.uid(), inv.project_id, inv.role);
  update invites set used_by = auth.uid() where code = inv.code;
  return inv.project_id;
end $$;

-- this is for changing ONLY the status of a task in one of your projects
create or replace function set_task_status(task_id uuid, new_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update tasks set status = new_status
    where id = task_id and project_id in (select my_projects());
  if not found then raise exception 'Not allowed'; end if;
end $$;

revoke execute on function my_projects(), my_admin_projects(), create_project(text),
  join_project(text), set_task_status(uuid, text) from public, anon;
grant execute on function my_projects(), my_admin_projects(), create_project(text),
  join_project(text), set_task_status(uuid, text) to authenticated;
