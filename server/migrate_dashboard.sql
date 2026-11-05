-- this is for project descriptions, invites sent to an email address, and the multi project dashboard (keeps all your data)
-- run this once in the Supabase SQL Editor, BEFORE you deploy the new client

-- this is for a short description on every project
alter table projects add column if not exists description text not null default ''
  check (char_length(description) <= 500);

-- this is for invites made for one email address (email stays empty for plain invite links)
-- emailed_at remembers when the invite email was last sent, so nobody can be spammed
alter table invites add column if not exists email text;
alter table invites add column if not exists emailed_at timestamptz;
alter table invites drop constraint if exists invites_email_check;
alter table invites add constraint invites_email_check
  check (email is null or (email = lower(email) and char_length(email) <= 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'));

-- this is for one waiting invite per email per project, and for finding "my invites" fast
create unique index if not exists invites_one_per_email_idx on invites (project_id, email)
  where email is not null and used_by is null;
create index if not exists invites_email_idx on invites (email) where email is not null and used_by is null;

-- this is for making a project (the creator becomes admin) and inviting people by email in one step
-- it gives back {id, invites: [{email, code}]}
drop function if exists create_project(text);
create or replace function create_project(
  project_name text,
  project_description text default '',
  invite_emails text[] default '{}'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
  my_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  raw text;
  norm text;
  clean text[] := '{}';
  made jsonb := '[]'::jsonb;
  new_code text;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if char_length(trim(coalesce(project_name, ''))) = 0 then raise exception 'Give the project a title'; end if;
  if char_length(trim(project_name)) > 80 then raise exception 'The title can be at most 80 characters'; end if;
  if char_length(trim(coalesce(project_description, ''))) > 500 then
    raise exception 'The description can be at most 500 characters';
  end if;

  -- this is for cleaning the emails first: lower case, no empty ones, no repeats, not your own
  foreach raw in array coalesce(invite_emails, '{}') loop
    norm := lower(trim(raw));
    continue when norm is null or norm = '' or norm = my_email or norm = any(clean);
    if norm !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(norm) > 254 then
      raise exception '% is not a valid email address', norm;
    end if;
    clean := clean || norm;
  end loop;
  if cardinality(clean) > 20 then raise exception 'You can invite up to 20 people at once'; end if;

  insert into projects (name, description)
    values (trim(project_name), trim(coalesce(project_description, '')))
    returning id into pid;
  insert into roles (user_id, project_id, role) values (auth.uid(), pid, 'admin');

  -- this is for one single-use member invite per email (valid 7 days, only that email can use it)
  foreach norm in array clean loop
    insert into invites (project_id, role, created_by, email)
      values (pid, 'member', auth.uid(), norm)
      returning code into new_code;
    made := made || jsonb_build_object('email', norm, 'code', new_code);
  end loop;

  return jsonb_build_object('id', pid, 'invites', made);
end $$;

-- this is for joining with an invite code (an invite made for an email only works for that email)
create or replace function join_project(invite_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  select * into inv from invites
    where code = invite_code and used_by is null and expires_at > now() for update;
  if not found then raise exception 'This invite code is not valid or has expired'; end if;
  if inv.email is not null and inv.email <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'This invite was sent to a different email address';
  end if;
  if exists (select 1 from roles where user_id = auth.uid() and project_id = inv.project_id) then
    raise exception 'You are already in this project';
  end if;
  insert into roles (user_id, project_id, role) values (auth.uid(), inv.project_id, inv.role);
  update invites set used_by = auth.uid() where code = inv.code;
  return inv.project_id;
end $$;

-- this is for the invites waiting for my email address (the dashboard shows them)
create or replace function my_pending_invites()
returns table (
  code text, project_id uuid, project_name text, project_description text,
  role text, invited_by_name text, expires_at timestamptz
)
language sql security definer set search_path = public stable as $$
  select i.code, i.project_id, p.name, p.description, i.role, u.name, i.expires_at
  from invites i
  join projects p on p.id = i.project_id
  left join users u on u.id = i.created_by
  where i.used_by is null and i.expires_at > now()
    and i.email is not null and i.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and not exists (select 1 from roles r where r.user_id = auth.uid() and r.project_id = i.project_id)
  order by i.expires_at desc
$$;

-- this is for saying no to an invite that was sent to my email
create or replace function decline_invite(invite_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from invites
    where code = invite_code and used_by is null
      and email is not null and email = lower(coalesce(auth.jwt() ->> 'email', ''));
  if not found then raise exception 'Invite not found'; end if;
end $$;

-- this is for the "send invite email" function: it hands back only the invites this admin may email now,
-- and marks them as sent (the same invite can be emailed again only after 10 minutes)
create or replace function mark_invites_emailed(invite_codes text[])
returns table (code text, email text, project_name text, invited_by_name text)
language sql security definer set search_path = public as $$
  with sendable as (
    update invites i set emailed_at = now()
    where i.code = any(invite_codes)
      and i.created_by = auth.uid()
      and i.project_id in (select my_admin_projects())
      and i.email is not null and i.used_by is null and i.expires_at > now()
      and (i.emailed_at is null or i.emailed_at < now() - interval '10 minutes')
    returning i.code, i.email, i.project_id, i.created_by
  )
  select s.code, s.email, p.name, u.name
  from sendable s
  join projects p on p.id = s.project_id
  left join users u on u.id = s.created_by
$$;

-- this is for only letting logged in users call the functions
revoke execute on function create_project(text, text, text[]), join_project(text), my_pending_invites(),
  decline_invite(text), mark_invites_emailed(text[]) from public, anon;
grant execute on function create_project(text, text, text[]), join_project(text), my_pending_invites(),
  decline_invite(text), mark_invites_emailed(text[]) to authenticated;
