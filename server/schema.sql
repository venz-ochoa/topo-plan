-- this is for wiping the old tables and functions
-- WARNING: this deletes all projects, tasks and invites (your logins stay)
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists tasks, invites, members, roles, profiles, users, projects cascade;
drop function if exists is_member(uuid), is_admin(uuid), is_admin(), my_project(),
  my_projects(), my_admin_projects(), project_members(uuid), create_project(text),
  join_project(text), set_task_status(uuid, text), set_finished_at(), handle_new_user();

-- this is for the people (one row per login, it holds the display name)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 60)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

-- this is for each person's role in each project (one row per person per project)
create table roles (
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  primary key (user_id, project_id)
);

-- this is for invite codes: one use only, and they expire after 7 days
create table invites (
  code text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  project_id uuid not null references projects(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references auth.users(id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  who text not null default '',
  start_date date not null,
  end_date date not null,
  priority text not null default 'med' check (priority in ('high', 'med', 'low')),
  depends_on uuid[] not null default '{}',
  status text not null default 'not_done' check (status in ('not_done', 'progress', 'done')),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- this is for finding things faster
create index roles_project_idx on roles (project_id);
create index invites_project_idx on invites (project_id);
create index tasks_project_idx on tasks (project_id);

-- this is for asking "which projects am I in?" and "which ones am I admin of?"
create or replace function my_projects() returns setof uuid
language sql security definer set search_path = public stable as $$
  select project_id from roles where user_id = auth.uid()
$$;

create or replace function my_admin_projects() returns setof uuid
language sql security definer set search_path = public stable as $$
  select project_id from roles where user_id = auth.uid() and role = 'admin'
$$;

-- this is for turning on the lock (RLS) on every table
alter table users enable row level security;
alter table projects enable row level security;
alter table roles enable row level security;
alter table invites enable row level security;
alter table tasks enable row level security;

-- this is for the rules: you see your projects, only admins write
create policy "see my team" on users for select to authenticated
  using (id = auth.uid() or id in (select user_id from roles where project_id in (select my_projects())));
create policy "edit my name" on users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
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

-- this is for making a user row automatically when someone signs up
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)), 60)
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- this is for people who already signed up (name = what they typed, or the start of their email)
insert into users (id, name)
select id, left(coalesce(nullif(trim(raw_user_meta_data->>'name'), ''), split_part(email, '@', 1)), 60)
from auth.users
on conflict do nothing;

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

-- this is for saving the finish time when a task becomes done
create or replace function set_finished_at() returns trigger language plpgsql as $$
begin
  if new.status = 'done' and old.status <> 'done' then
    new.finished_at := now();
  elsif new.status <> 'done' then
    new.finished_at := null;
  end if;
  return new;
end $$;

create trigger tasks_finished before update on tasks
  for each row execute function set_finished_at();

-- this is for only letting logged in users call the functions
revoke execute on function my_projects(), my_admin_projects(), create_project(text),
  join_project(text), set_task_status(uuid, text) from public, anon;
grant execute on function my_projects(), my_admin_projects(), create_project(text),
  join_project(text), set_task_status(uuid, text) to authenticated;