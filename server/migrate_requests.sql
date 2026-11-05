-- this is for assigned people, extension requests and the new status rule (keeps all your data)
-- run this once in the Supabase SQL Editor, only if your database was made before these features

-- this is for who a task is assigned to (a person, not a typed name)
alter table tasks add column assigned_to uuid references users(id) on delete set null;

-- this is for keeping the old assignments: match the typed name to a person in the same project
update tasks t set assigned_to = (
  select u.id from users u join roles r on r.user_id = u.id
  where r.project_id = t.project_id and lower(u.name) = lower(t.who)
  limit 1
) where t.who <> '';

alter table tasks drop column who;
create index tasks_assigned_idx on tasks (assigned_to);

-- this is for task rules that also check the assigned person is in the project
drop policy "admins add tasks" on tasks;
drop policy "admins edit tasks" on tasks;
create policy "admins add tasks" on tasks for insert to authenticated
  with check (
    project_id in (select my_admin_projects())
    and (assigned_to is null or exists (
      select 1 from roles r where r.user_id = tasks.assigned_to and r.project_id = tasks.project_id))
  );
create policy "admins edit tasks" on tasks for update to authenticated
  using (project_id in (select my_admin_projects()))
  with check (
    project_id in (select my_admin_projects())
    and (assigned_to is null or exists (
      select 1 from roles r where r.user_id = tasks.assigned_to and r.project_id = tasks.project_id))
  );

-- this is for extension requests (ask to move a task one day earlier or later)
create table requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  requested_by uuid not null references users(id) on delete cascade,
  days int not null check (days in (-1, 1)),
  reason text not null default '' check (char_length(reason) <= 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index requests_project_idx on requests (project_id);
-- this is for allowing only one waiting request per person per task
create unique index requests_one_pending_idx on requests (task_id, requested_by) where status = 'pending';

alter table requests enable row level security;

-- this is for requests: admins see all of them, everyone else sees only their own
create policy "see requests" on requests for select to authenticated
  using (requested_by = auth.uid() or project_id in (select my_admin_projects()));
-- this is for only letting the assigned person ask, and only as themselves
create policy "make requests" on requests for insert to authenticated
  with check (
    requested_by = auth.uid() and status = 'pending'
    and exists (
      select 1 from tasks t
      where t.id = requests.task_id and t.project_id = requests.project_id and t.assigned_to = auth.uid())
  );

-- this is for changing ONLY the status of a task, and only if it is assigned to you
create or replace function set_task_status(task_id uuid, new_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update tasks set status = new_status
    where id = task_id and assigned_to = auth.uid() and project_id in (select my_projects());
  if not found then raise exception 'Only the person assigned to this task can change its status'; end if;
end $$;

-- this is for the checks on every task change (guards the status, saves the finish time)
create or replace function on_task_update() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status
     and auth.uid() is not null
     and new.assigned_to is distinct from auth.uid() then
    raise exception 'Only the person assigned to this task can change its status';
  end if;
  if new.status = 'done' and old.status <> 'done' then
    new.finished_at := now();
  elsif new.status <> 'done' then
    new.finished_at := null;
  end if;
  return new;
end $$;

drop trigger tasks_finished on tasks;
create trigger tasks_finished before update on tasks
  for each row execute function on_task_update();
drop function set_finished_at();

-- this is for admins to approve or deny a request (it can only be decided once)
create or replace function decide_request(request_id uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update requests
    set status = case when approve then 'approved' else 'denied' end, decided_at = now()
    where id = request_id and status = 'pending' and project_id in (select my_admin_projects());
  if not found then raise exception 'Request not found or already decided'; end if;
end $$;

-- this is for only letting logged in users call the functions
revoke execute on function set_task_status(uuid, text), decide_request(uuid, boolean) from public, anon;
grant execute on function set_task_status(uuid, text), decide_request(uuid, boolean) to authenticated;
