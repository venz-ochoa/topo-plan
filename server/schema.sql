-- this is for the tables (run this whole file once in the Supabase SQL Editor)

create table projects (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 80),
    created_at timestamptz not null default now()
);

-- this is for who is in which project, and if they are an admin or a member
create table members (
    project_id uuid not null references projects(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('admin', 'member')),
    primary key (project_id, user_id)
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

-- this is for checking who the logged in user is in a project
create or replace function is_member(pid uuid) returns boolean
language sql security definer set search_path = public stable as $$
    select exists (select 1 from members where project_id = pid and user_id = auth.uid())
$$;

create or replace function is_admin(pid uuid) returns boolean
language sql security definer set search_path = public stable as $$
    select exists (select 1 from members where project_id = pid and user_id = auth.uid() and role = 'admin')
$$;

-- this is for turning on the lock (RLS) on every table
alter table projects enable row level security;
alter table members enable row level security;
alter table invites enable row level security;
alter table tasks enable row level security;

-- this is for the rules: members can read, only admins can write
create policy "members read projects" on projects for select to authenticated using (is_member(id));
create policy "members read members" on members for select to authenticated using (is_member(project_id));
create policy "admins read invites" on invites for select to authenticated using (is_admin(project_id));
create policy "admins make invites" on invites for insert to authenticated with check (is_admin(project_id) and created_by = auth.uid());
create policy "members read tasks" on tasks for select to authenticated using (is_member(project_id));
create policy "admins add tasks" on tasks for insert to authenticated with check (is_admin(project_id));
create policy "admins edit tasks" on tasks for update to authenticated using (is_admin(project_id)) with check (is_admin(project_id));

-- this is for making a project and making the creator its admin
create or replace function create_project(project_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
    if auth.uid() is null then raise exception 'Not logged in'; end if;
    insert into projects (name) values (trim(project_name)) returning id into pid;
    insert into members (project_id, user_id, role) values (pid, auth.uid(), 'admin');
    return pid;
end $$;

-- this is for joining a project with an invite code
create or replace function join_project(invite_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv invites%rowtype;
begin
    if auth.uid() is null then raise exception 'Not logged in'; end if;
  select * into inv from invites
    where code = invite_code and used_by is null and expires_at > now() for update;
    if not found then raise exception 'This invite code is not valid or has expired'; end if;
    insert into members (project_id, user_id, role) values (inv.project_id, auth.uid(), inv.role)
    on conflict (project_id, user_id) do nothing;
    update invites set used_by = auth.uid() where code = inv.code;
    return inv.project_id;
end $$;

-- this is for members to change ONLY the status of a task
create or replace function set_task_status(task_id uuid, new_status text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
    select project_id into pid from tasks where id = task_id;
    if pid is null or not is_member(pid) then raise exception 'Not allowed'; end if;
    update tasks set status = new_status where id = task_id;
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
revoke execute on function is_member(uuid), is_admin(uuid),
    create_project(text), join_project(text), set_task_status(uuid, text) from public, anon;
grant execute on function is_member(uuid), is_admin(uuid),
    create_project(text), join_project(text), set_task_status(uuid, text) to authenticated;