-- this is for notifications: new tasks, changes to your tasks, answers to your requests and invites (keeps all your data)
-- run this once in the Supabase SQL Editor

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

-- this is for letting people see, mark and delete only their own notifications
-- (nobody can add them from the app, only the triggers below can)
alter table notifications enable row level security;
create policy "see my notifications" on notifications for select to authenticated using (user_id = auth.uid());
create policy "mark my notifications" on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete my notifications" on notifications for delete to authenticated using (user_id = auth.uid());

-- this is for live updates
alter publication supabase_realtime add table notifications;

-- this is for telling someone when a task is given to them or its dates change (not when they did it themselves)
create or replace function notify_task() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.assigned_to is null or new.assigned_to = auth.uid() then return new; end if;
  if tg_op = 'INSERT' or new.assigned_to is distinct from old.assigned_to then
    insert into notifications (user_id, project_id, text)
    values (new.assigned_to, new.project_id, 'New task for you: ' || new.name);
  elsif new.start_date <> old.start_date or new.end_date <> old.end_date then
    insert into notifications (user_id, project_id, text)
    values (new.assigned_to, new.project_id,
      'Dates changed for ' || new.name || ': ' || new.start_date || ' to ' || new.end_date);
  end if;
  return new;
end $$;
create trigger tasks_notify after insert or update on tasks
  for each row execute function notify_task();

-- this is for telling someone when their request was approved or denied
create or replace function notify_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and new.status in ('approved', 'denied') then
    insert into notifications (user_id, project_id, text)
    select new.requested_by, new.project_id, 'Your request for ' || t.name || ' was ' || new.status
    from tasks t where t.id = new.task_id;
  end if;
  return new;
end $$;
create trigger requests_notify after update on requests
  for each row execute function notify_request();

-- this is for telling someone who already has an account that they were invited
create or replace function notify_invite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is null then return new; end if;
  insert into notifications (user_id, text)
  select u.id, 'You were invited to join ' || p.name || ' as ' || new.role || '. Open the Dashboard to accept or decline.'
  from auth.users u, projects p
  where lower(u.email) = lower(new.email) and p.id = new.project_id;
  return new;
end $$;
create trigger invites_notify after insert on invites
  for each row execute function notify_invite();
