-- TopoPlan database setup, for a NEW, EMPTY Supabase project only
-- paste the whole file into the SQL Editor and run it once (if any part fails, nothing changes)
-- do not run it on a project that already has the tables

begin;

set check_function_bodies = off;

create table public.activity_log (
id uuid default gen_random_uuid() not null,
project_id uuid not null,
user_id uuid,
action text not null,
task_id uuid,
details jsonb default '{}'::jsonb not null,
created_at timestamp with time zone default now() not null
);

create table public.audit_log (
id bigint generated always as identity not null,
project_id uuid,
actor uuid,
target uuid,
action text not null,
detail text default ''::text not null,
created_at timestamp with time zone default now() not null
);

create table public.invites (
code text default replace((gen_random_uuid())::text, '-'::text, ''::text) not null,
project_id uuid not null,
role text default 'member'::text not null,
created_by uuid not null,
expires_at timestamp with time zone default (now() + '7 days'::interval) not null,
used_by uuid,
email text,
emailed_at timestamp with time zone,
created_at timestamp with time zone default now() not null
);

create table public.notification_settings (
user_id uuid not null,
project_id uuid,
muted text[] default '{}'::text[] not null
);

create table public.notifications (
id uuid default gen_random_uuid() not null,
user_id uuid not null,
project_id uuid,
kind text default 'tasks'::text not null,
text text not null,
read boolean default false not null,
created_at timestamp with time zone default now() not null
);

create table public.project_holidays (
project_id uuid not null,
day date not null,
label text default ''::text not null
);

create table public.project_messages (
id uuid default gen_random_uuid() not null,
project_id uuid not null,
user_id uuid not null,
body text not null,
created_at timestamp with time zone default now() not null
);

create table public.projects (
id uuid default gen_random_uuid() not null,
name text not null,
deadline date,
skip_weekends boolean default false not null,
baseline_set_at timestamp with time zone,
archived_at timestamp with time zone,
created_at timestamp with time zone default now() not null,
description text default ''::text not null
);

create table public.requests (
id uuid default gen_random_uuid() not null,
project_id uuid not null,
task_id uuid not null,
requested_by uuid not null,
kind text default 'extension'::text not null,
days integer,
new_status text,
new_priority text,
new_depends_on uuid[],
reason text default ''::text not null,
status text default 'pending'::text not null,
decided_by uuid,
decision_note text default ''::text not null,
created_at timestamp with time zone default now() not null,
decided_at timestamp with time zone
);

create table public.roles (
user_id uuid not null,
project_id uuid not null,
role text not null,
is_owner boolean default false not null
);

create table public.task_assignees (
task_id uuid not null,
user_id uuid not null
);
create table public.task_checklist (
id uuid default gen_random_uuid() not null,
task_id uuid not null,
text text not null,
done boolean default false not null,
"position" integer default 0 not null
);

create table public.task_comments (
id uuid default gen_random_uuid() not null,
task_id uuid not null,
user_id uuid not null,
body text not null,
created_at timestamp with time zone default now() not null
);

create table public.task_links (
id uuid default gen_random_uuid() not null,
task_id uuid not null,
label text not null,
url text,
file_path text,
created_by uuid not null,
created_at timestamp with time zone default now() not null
);
create table public.task_templates (
id uuid default gen_random_uuid() not null,
project_id uuid not null,
name text not null,
data jsonb default '{}'::jsonb not null,
created_at timestamp with time zone default now() not null
);

create table public.tasks (
id uuid default gen_random_uuid() not null,
project_id uuid not null,
name text not null,
assigned_to uuid,
start_date date not null,
end_date date not null,
priority text default 'med'::text not null,
depends_on uuid[] default '{}'::uuid[] not null,
dep_type text default 'fs'::text not null,
lag_days integer default 0 not null,
status text default 'not_done'::text not null,
finished_at timestamp with time zone,
is_milestone boolean default false not null,
percent_complete integer default 0 not null,
estimate_hours numeric,
actual_hours numeric,
labels text[] default '{}'::text[] not null,
recurrence text default 'none'::text not null,
recurrence_until date,
baseline_start date,
baseline_end date,
created_at timestamp with time zone default now() not null,
description text default ''::text not null
);

create table public.time_off (
id uuid default gen_random_uuid() not null,
project_id uuid not null,
user_id uuid not null,
start_date date not null,
end_date date not null,
note text default ''::text not null
);

create table public.users (
id uuid not null,
name text default ''::text not null
);

alter table public.activity_log add constraint activity_log_pkey PRIMARY KEY (id);
alter table public.audit_log add constraint audit_log_action_check CHECK ((char_length(action) <= 40));

alter table public.audit_log add constraint audit_log_detail_check CHECK ((char_length(detail) <= 200));

alter table public.audit_log add constraint audit_log_pkey PRIMARY KEY (id);

alter table public.invites add constraint invites_pkey PRIMARY KEY (code);

alter table public.invites add constraint invites_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])));

alter table public.notification_settings add constraint notification_settings_user_id_project_id_key UNIQUE NULLS NOT DISTINCT (user_id, project_id);

alter table public.notifications add constraint notifications_kind_check CHECK ((kind = ANY (ARRAY['tasks'::text, 'schedule'::text, 'requests'::text, 'team'::text])));

alter table public.notifications add constraint notifications_pkey PRIMARY KEY (id);

alter table public.project_holidays add constraint project_holidays_pkey PRIMARY KEY (project_id, day);

alter table public.project_messages add constraint project_messages_body_check CHECK (((char_length(body) >= 1) AND (char_length(body) <= 1000)));
alter table public.project_messages add constraint project_messages_pkey PRIMARY KEY (id);

alter table public.projects add constraint projects_description_check CHECK ((char_length(description) <= 500));

alter table public.projects add constraint projects_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80)));

alter table public.projects add constraint projects_pkey PRIMARY KEY (id);

alter table public.requests add constraint requests_days_check CHECK (((days IS NULL) OR (days = ANY (ARRAY['-1'::integer, 1]))));

alter table public.requests add constraint requests_decision_note_check CHECK ((char_length(decision_note) <= 200));

alter table public.requests add constraint requests_kind_check CHECK ((kind = ANY (ARRAY['status'::text, 'extension'::text, 'priority'::text, 'dependency'::text])));

alter table public.requests add constraint requests_new_priority_check CHECK (((new_priority IS NULL) OR (new_priority = ANY (ARRAY['high'::text, 'med'::text, 'low'::text]))));

alter table public.requests add constraint requests_new_status_check CHECK (((new_status IS NULL) OR (new_status = ANY (ARRAY['not_done'::text, 'progress'::text, 'done'::text]))));

alter table public.requests add constraint requests_pkey PRIMARY KEY (id);
alter table public.requests add constraint requests_reason_check CHECK ((char_length(reason) <= 200));

alter table public.requests add constraint requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])));

alter table public.roles add constraint roles_owner_is_admin CHECK (((NOT is_owner) OR (role = 'admin'::text)));

alter table public.roles add constraint roles_pkey PRIMARY KEY (user_id, project_id);

alter table public.roles add constraint roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])));

alter table public.task_assignees add constraint task_assignees_pkey PRIMARY KEY (task_id, user_id);

alter table public.task_checklist add constraint task_checklist_pkey PRIMARY KEY (id);

alter table public.task_checklist add constraint task_checklist_text_check CHECK (((char_length(text) >= 1) AND (char_length(text) <= 200)));

alter table public.task_comments add constraint task_comments_body_check CHECK (((char_length(body) >= 1) AND (char_length(body) <= 1000)));

alter table public.task_comments add constraint task_comments_pkey PRIMARY KEY (id);
alter table public.task_links add constraint task_links_check CHECK (((url IS NOT NULL) OR (file_path IS NOT NULL)));

alter table public.task_links add constraint task_links_label_check CHECK (((char_length(label) >= 1) AND (char_length(label) <= 120)));

alter table public.task_links add constraint task_links_pkey PRIMARY KEY (id);

alter table public.task_links add constraint task_links_url_check CHECK (((url IS NULL) OR (url ~* '^https?://'::text)));

alter table public.task_templates add constraint task_templates_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80)));

alter table public.task_templates add constraint task_templates_pkey PRIMARY KEY (id);

alter table public.tasks add constraint tasks_actual_hours_check CHECK (((actual_hours IS NULL) OR (actual_hours >= (0)::numeric)));

alter table public.tasks add constraint tasks_check CHECK ((end_date >= start_date));

alter table public.tasks add constraint tasks_dep_type_check CHECK ((dep_type = ANY (ARRAY['fs'::text, 'ss'::text])));

alter table public.tasks add constraint tasks_description_check CHECK ((char_length(description) <= 300));
alter table public.tasks add constraint tasks_estimate_hours_check CHECK (((estimate_hours IS NULL) OR (estimate_hours >= (0)::numeric)));

alter table public.tasks add constraint tasks_lag_days_check CHECK (((lag_days >= '-30'::integer) AND (lag_days <= 90)));

alter table public.tasks add constraint tasks_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 200)));

alter table public.tasks add constraint tasks_percent_complete_check CHECK (((percent_complete >= 0) AND (percent_complete <= 100)));

alter table public.tasks add constraint tasks_pkey PRIMARY KEY (id);

alter table public.tasks add constraint tasks_priority_check CHECK ((priority = ANY (ARRAY['high'::text, 'med'::text, 'low'::text])));

alter table public.tasks add constraint tasks_recurrence_check CHECK ((recurrence = ANY (ARRAY['none'::text, 'daily'::text, 'weekly'::text, 'monthly'::text])));

alter table public.tasks add constraint tasks_status_check CHECK ((status = ANY (ARRAY['not_done'::text, 'progress'::text, 'done'::text])));

alter table public.time_off add constraint time_off_check CHECK ((end_date >= start_date));

alter table public.time_off add constraint time_off_note_check CHECK ((char_length(note) <= 120));
alter table public.time_off add constraint time_off_pkey PRIMARY KEY (id);

alter table public.users add constraint users_name_check CHECK ((char_length(name) <= 60));

alter table public.users add constraint users_pkey PRIMARY KEY (id);

alter table public.activity_log add constraint activity_log_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.activity_log add constraint activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

alter table public.invites add constraint invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.invites add constraint invites_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.invites add constraint invites_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.notification_settings add constraint notification_settings_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.notification_settings add constraint notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.project_holidays add constraint project_holidays_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.project_messages add constraint project_messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.project_messages add constraint project_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.requests add constraint requests_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.requests add constraint requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.requests add constraint requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE;

alter table public.requests add constraint requests_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

alter table public.roles add constraint roles_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
alter table public.roles add constraint roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.task_assignees add constraint task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

alter table public.task_assignees add constraint task_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.task_checklist add constraint task_checklist_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

alter table public.task_comments add constraint task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

alter table public.task_comments add constraint task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.task_links add constraint task_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

alter table public.task_links add constraint task_links_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

alter table public.task_templates add constraint task_templates_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
alter table public.tasks add constraint tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

alter table public.tasks add constraint tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.time_off add constraint time_off_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

alter table public.time_off add constraint time_off_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.users add constraint users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX activity_log_project_id_created_at_idx ON public.activity_log USING btree (project_id, created_at DESC);

CREATE INDEX audit_log_project_idx ON public.audit_log USING btree (project_id, created_at DESC);

CREATE INDEX invites_project_id_idx ON public.invites USING btree (project_id);

CREATE INDEX notifications_user_id_created_at_idx ON public.notifications USING btree (user_id, created_at DESC);

CREATE INDEX project_messages_project_id_created_at_idx ON public.project_messages USING btree (project_id, created_at);
CREATE UNIQUE INDEX requests_one_pending_idx ON public.requests USING btree (task_id, requested_by, kind) WHERE (status = 'pending'::text);

CREATE INDEX requests_project_id_idx ON public.requests USING btree (project_id);

CREATE UNIQUE INDEX roles_one_owner_idx ON public.roles USING btree (project_id) WHERE is_owner;

CREATE INDEX roles_project_id_idx ON public.roles USING btree (project_id);

CREATE INDEX task_checklist_task_id_idx ON public.task_checklist USING btree (task_id);

CREATE INDEX task_comments_task_id_idx ON public.task_comments USING btree (task_id);

CREATE INDEX task_links_task_id_idx ON public.task_links USING btree (task_id);

CREATE INDEX tasks_assigned_to_idx ON public.tasks USING btree (assigned_to);

CREATE INDEX tasks_project_id_idx ON public.tasks USING btree (project_id);

CREATE OR REPLACE FUNCTION public.after_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare t tasks%rowtype; a record; who text;
begin
select * into t from tasks where id = new.task_id;
select name into who from users where id = new.user_id;
for a in select distinct u from (
select t.assigned_to as u union select user_id from task_assignees where task_id = t.id) x where u is not null loop
perform send_note(t.project_id, a.u, 'tasks', coalesce(who, 'Someone') || ' commented on "' || t.name || '"');
end loop;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.after_request_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare a record; who text; tname text;
begin
select name into tname from tasks where id = new.task_id;
if tg_op = 'INSERT' then
select name into who from users where id = new.requested_by;
perform log_activity(new.project_id, 'request_sent', new.task_id, jsonb_build_object('kind', new.kind));
for a in select user_id from roles where project_id = new.project_id and role = 'admin' loop
perform send_note(new.project_id, a.user_id, 'requests', coalesce(who, 'Someone') || ' sent a ' || new.kind || ' request for "' || coalesce(tname, 'a task') || '"');
end loop;
elsif new.status <> old.status then
perform log_activity(new.project_id, 'request_' || new.status, new.task_id, jsonb_build_object('kind', new.kind));
perform send_note(new.project_id, new.requested_by, 'requests',
'Your ' || new.kind || ' request for "' || coalesce(tname, 'a task') || '" was ' || new.status ||
case when new.decision_note <> '' then ': ' || new.decision_note else '' end);
end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.after_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare a record; who text;
begin
if tg_op = 'INSERT' then
select name into who from users where id = new.user_id;
perform log_activity(new.project_id, 'joined', null, jsonb_build_object('user', new.user_id));
for a in select user_id from roles where project_id = new.project_id and role = 'admin' loop
perform send_note(new.project_id, a.user_id, 'team', coalesce(who, 'Someone') || ' joined the project');
end loop;
end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.after_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare a record; nstart date; nend date; span int;
begin
if tg_op = 'INSERT' then
perform log_activity(new.project_id, 'task_added', new.id, jsonb_build_object('name', new.name));
for a in select user_id from roles where project_id = new.project_id and role = 'admin'
and user_id is distinct from new.assigned_to loop
perform send_note(new.project_id, a.user_id, 'tasks', 'New task added: "' || new.name || '"');
end loop;
perform send_note(new.project_id, new.assigned_to, 'tasks', 'You were assigned "' || new.name || '"');
return new;
end if;

if new.assigned_to is distinct from old.assigned_to then
perform log_activity(new.project_id, 'assigned', new.id, jsonb_build_object('name', new.name, 'to', new.assigned_to));
perform send_note(new.project_id, new.assigned_to, 'tasks', 'You were assigned "' || new.name || '"');
end if;
if new.start_date is distinct from old.start_date or new.end_date is distinct from old.end_date then
perform log_activity(new.project_id, 'dates_changed', new.id,
jsonb_build_object('name', new.name, 'start', new.start_date, 'end', new.end_date));
perform send_note(new.project_id, new.assigned_to, 'schedule',
'"' || new.name || '" moved to ' || new.start_date || ' - ' || new.end_date);
end if;
if new.status is distinct from old.status then
perform log_activity(new.project_id, 'status_changed', new.id,
jsonb_build_object('name', new.name, 'status', new.status));
for a in select user_id from roles where project_id = new.project_id and role = 'admin' loop
perform send_note(new.project_id, a.user_id, 'tasks', '"' || new.name || '" is now ' ||
case new.status when 'done' then 'done' when 'progress' then 'in progress' else 'to do' end);
end loop;
-- a recurring task makes its next copy when it is done
if new.status = 'done' and new.recurrence <> 'none' then
span := new.end_date - new.start_date;
nstart := case new.recurrence when 'daily' then new.start_date + 1
when 'weekly' then new.start_date + 7
else (new.start_date + interval '1 month')::date end;
nend := nstart + span;
if new.recurrence_until is null or nstart <= new.recurrence_until then
insert into tasks (project_id, name, assigned_to, start_date, end_date, priority, dep_type, lag_days,
is_milestone, estimate_hours, labels, recurrence, recurrence_until)
values (new.project_id, new.name, new.assigned_to, nstart, nend, new.priority, new.dep_type, new.lag_days,
new.is_milestone, new.estimate_hours, new.labels, new.recurrence, new.recurrence_until);
end if;
end if;
end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.check_assignee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
if new.assigned_to is not null
and not exists (select 1 from roles
where user_id = new.assigned_to and project_id = new.project_id)
and not exists (select 1 from tasks
where id = new.id and project_id = new.project_id and assigned_to = new.assigned_to) then
raise exception 'You can only assign people who are in this project';
end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.create_project(project_name text, project_description text DEFAULT ''::text, invite_emails text[] DEFAULT '{}'::text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.decide_request(request_id uuid, approve boolean, note text DEFAULT ''::text, new_dates jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
r requests%rowtype;
moved int;
begin
select * into r from requests where id = request_id and status = 'pending' for update;
if not found or r.project_id not in (select my_admin_projects()) then
raise exception 'Request not found or already decided'; end if;

if approve then
perform set_config('app.bypass', '1', true);
if r.kind = 'status' then update tasks set status = r.new_status where id = r.task_id;
elsif r.kind = 'priority' then update tasks set priority = r.new_priority where id = r.task_id;
elsif r.kind = 'dependency' then
update tasks set depends_on = coalesce(r.new_depends_on, '{}') where id = r.task_id;
elsif r.kind = 'extension' then
-- an empty list is fine: a dependency can keep a task from moving earlier
if new_dates is null or jsonb_typeof(new_dates) <> 'array' then
raise exception 'The new dates are missing. Refresh the page and try again.';
end if;
-- only unfinished tasks of this project can move
update tasks t set start_date = d.start_date, end_date = d.end_date
from jsonb_to_recordset(new_dates) as d(id uuid, start_date date, end_date date)
where t.id = d.id and t.project_id = r.project_id and t.status <> 'done';
get diagnostics moved = row_count;
if moved <> jsonb_array_length(new_dates) then
raise exception 'Some tasks have changed. Refresh the page and try again.';
end if;
end if;
end if;
update requests set status = case when approve then 'approved' else 'denied' end,
decided_at = now(), decided_by = auth.uid(), decision_note = left(coalesce(note, ''), 200)
where id = request_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.decline_invite(invite_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
delete from invites
where code = invite_code and used_by is null
and email is not null and email = lower(coalesce(auth.jwt() ->> 'email', ''));
if not found then raise exception 'Invite not found'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
me uuid := auth.uid();
mine record;
other record;
heir uuid;
pname text;
begin
if me is null then raise exception 'Not logged in'; end if;

-- this is for two people of one project deleting at the same time: the second one waits
perform 1 from projects where id in (select project_id from roles where user_id = me)
order by id for update;

-- this is for stopping before anything is deleted: the only admin of a project with other people
select p.name into pname from roles r join projects p on p.id = r.project_id
where r.user_id = me and r.role = 'admin'
and exists (select 1 from roles o where o.project_id = r.project_id and o.user_id <> me)
and not exists (select 1 from roles o
where o.project_id = r.project_id and o.user_id <> me and o.role = 'admin')
limit 1;
if found then
raise exception 'You are the only admin of "%". Make another person an admin first.', pname;
end if;
for mine in
select r.project_id, r.is_owner, p.name from roles r join projects p on p.id = r.project_id
where r.user_id = me
loop
if not exists (select 1 from roles where project_id = mine.project_id and user_id <> me) then
delete from projects where id = mine.project_id;
continue;
end if;

delete from roles where project_id = mine.project_id and user_id = me;
heir := null;
if mine.is_owner then
select user_id into heir from roles
where project_id = mine.project_id and role = 'admin' order by user_id limit 1;
update roles set is_owner = true where project_id = mine.project_id and user_id = heir;
end if;

-- the messages leave out the name, because the account's name is being deleted
for other in select user_id from roles where project_id = mine.project_id loop
perform send_note(mine.project_id, other.user_id, 'team',
case
when other.user_id = heir then 'You are now the owner of "' || mine.name || '". The previous owner deleted their account.'
when mine.is_owner then 'The owner of "' || mine.name || '" deleted their account. Another admin now owns it.'
else 'A teammate in "' || mine.name || '" deleted their account.'
end);
end loop;
end loop;

delete from auth.users where id = me;
end $function$
;

CREATE OR REPLACE FUNCTION public.delete_project(pid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare pname text;
begin
if not exists (select 1 from roles where project_id = pid and user_id = auth.uid() and is_owner) then
raise exception 'Only the owner can delete the project';
end if;
select name into pname from projects where id = pid;
insert into notifications (user_id, text)
select user_id, 'The project "' || pname || '" was deleted'
from roles where project_id = pid and user_id <> auth.uid();
delete from projects where id = pid;
end $function$
;

CREATE OR REPLACE FUNCTION public.drop_deleted_dependency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
-- when the whole project is being deleted, its tasks are all going anyway
if exists (select 1 from projects where id = old.project_id) then
update tasks set depends_on = existing_deps(depends_on) where old.id = any(depends_on);
end if;
return null;
end $function$
;

CREATE OR REPLACE FUNCTION public.enforce_task_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if old.status = 'done' and new.status is distinct from old.status then
raise exception 'This task is complete, so it is locked.';
end if;
if new.status is distinct from old.status and new.status in ('progress', 'done') then
if exists (
select 1 from tasks d
where d.id = any(new.depends_on) and d.status <> 'done'
) then
raise exception 'Finish the tasks this one depends on first.';
end if;
end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.existing_deps(ids uuid[])
RETURNS uuid[]
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
select coalesce(array_agg(d.id order by d.n), '{}')
from unnest(ids) with ordinality as d(id, n)
where exists (select 1 from tasks t where t.id = d.id)
$function$
;

CREATE OR REPLACE FUNCTION public.first_admin_is_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.role = 'admin' and not new.is_owner
and not exists (select 1 from roles where project_id = new.project_id and is_owner) then
new.is_owner := true;
end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
insert into users (id, name)
values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)), 60));
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.is_assignee(tid uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
select exists (
select 1 from tasks t join roles r on r.project_id = t.project_id and r.user_id = uid
where t.id = tid
and (t.assigned_to = uid
or exists (select 1 from task_assignees a where a.task_id = tid and a.user_id = uid)))
$function$
;

CREATE OR REPLACE FUNCTION public.join_project(invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare inv invites%rowtype;
begin
if auth.uid() is null then raise exception 'Not logged in'; end if;
select * into inv from invites
where code = invite_code and used_by is null and expires_at > now() for update;
if not found then raise exception 'This invite code is not valid or has expired'; end if;
if inv.email is not null and lower(inv.email) is distinct from lower(auth.jwt() ->> 'email') then
raise exception 'This invite was sent to a different email address';
end if;
if exists (select 1 from roles where user_id = auth.uid() and project_id = inv.project_id) then
raise exception 'You are already in this project';
end if;
insert into roles (user_id, project_id, role) values (auth.uid(), inv.project_id, inv.role);
update invites set used_by = auth.uid() where code = inv.code;
return inv.project_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.keep_an_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
if old.is_owner and not exists (select 1 from public.roles where project_id = old.project_id and is_owner) then
update public.roles set is_owner = true
where ctid = (select ctid from public.roles where project_id = old.project_id and role = 'admin' order by ctid limit 1);
end if;
return null;
end $function$
;
CREATE OR REPLACE FUNCTION public.limit_email_invites()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
-- the log keeps a fingerprint of the address, not the address
fingerprint text := md5(lower(new.email));
shown text := case when char_length(new.email) > 80 then left(new.email, 77) || '...' else new.email end;
begin
-- one invite at a time per admin, so requests sent together cannot all slip under the limit
perform pg_advisory_xact_lock(hashtext(new.created_by::text));

-- shortcut: this reads the whole log, add an index on (actor, created_at) when the log gets large
if (select count(*) from audit_log
where actor = new.created_by and action = 'email_invite' and detail = fingerprint
and created_at > now() - interval '24 hours') >= 3 then
raise exception '% reached 3 invites in 24 hours. Nothing was saved. Remove it or try again later.', shown;
end if;
if (select count(*) from audit_log
where actor = new.created_by and action = 'email_invite'
and created_at > now() - interval '1 hour') >= 30 then
raise exception 'Email invite limit reached: 30 per hour. Nothing was saved. Remove some addresses or try again later.';
end if;

-- the log is separate from the invites, so replacing an invite or deleting a project does not reset the count
insert into audit_log (project_id, actor, action, detail)
values (new.project_id, new.created_by, 'email_invite', fingerprint);
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.log_activity(pid uuid, act text, tid uuid, det jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
insert into activity_log (project_id, user_id, action, task_id, details)
values (pid, (select id from users where id = auth.uid()), act, tid, det)
$function$
;

CREATE OR REPLACE FUNCTION public.log_event(pid uuid, act text, tgt uuid DEFAULT NULL::uuid, info text DEFAULT ''::text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
insert into audit_log (project_id, actor, target, action, detail)
values (pid, auth.uid(), tgt, act, left(coalesce(info, ''), 200))
$function$
;

CREATE OR REPLACE FUNCTION public.make_email_invite(pid uuid, invite_role text, invite_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare e text := lower(trim(coalesce(invite_email, ''))); c text;
begin
if pid not in (select my_admin_projects()) then raise exception 'Only admins can invite people'; end if;
if invite_role not in ('admin', 'member') then raise exception 'Role must be admin or member'; end if;
if e !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(e) > 254 then
raise exception '% is not a valid email address', e;
end if;
if exists (select 1 from auth.users u join roles r on r.user_id = u.id
where lower(u.email) = e and r.project_id = pid) then
raise exception 'That person is already in this project';
end if;
delete from invites where project_id = pid and email = e and used_by is null;
insert into invites (project_id, role, created_by, email) values (pid, invite_role, auth.uid(), e)
returning code into c;
return c;
end $function$
;

CREATE OR REPLACE FUNCTION public.make_invite(pid uuid, invite_role text DEFAULT 'member'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare new_code text;
begin
if auth.uid() is null then raise exception 'Not logged in'; end if;
if pid not in (select my_admin_projects()) then raise exception 'Only admins can make invites'; end if;
if invite_role is null or invite_role not in ('member', 'admin') then
raise exception 'Pick member or admin';
end if;
if (select count(*) from invites where created_by = auth.uid() and created_at > now() - interval '1 hour') >= 60 then
raise exception 'You made a lot of invites in the last hour. Please try again later.';
end if;
if (select count(*) from invites where project_id = pid and used_by is null and expires_at > now()) >= 100 then
raise exception 'This project already has too many waiting invites.';
end if;

insert into invites (project_id, role, created_by)
values (pid, invite_role, auth.uid())
returning code into new_code;
perform log_event(pid, 'invite_made', null, invite_role);
return new_code;
end $function$
;

CREATE OR REPLACE FUNCTION public.mark_invites_emailed(invite_codes text[])
RETURNS TABLE(code text, email text, project_name text, invited_by_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.my_admin_projects()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
select project_id from roles where user_id = auth.uid() and role = 'admin'
$function$
;

CREATE OR REPLACE FUNCTION public.my_pending_invites()
RETURNS TABLE(code text, project_id uuid, project_name text, project_description text, role text, invited_by_name text, expires_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
select i.code, i.project_id, p.name, p.description, i.role, u.name, i.expires_at
from invites i
join projects p on p.id = i.project_id
left join users u on u.id = i.created_by
where i.used_by is null and i.expires_at > now()
and i.email is not null and i.email = lower(coalesce(auth.jwt() ->> 'email', ''))
and not exists (select 1 from roles r where r.user_id = auth.uid() and r.project_id = i.project_id)
order by i.expires_at desc
$function$
;

CREATE OR REPLACE FUNCTION public.my_projects()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
select project_id from roles where user_id = auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public.notify_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
if new.email is null then return new; end if;
insert into notifications (user_id, text)
select u.id, 'You were invited to join ' || p.name || ' as ' || new.role || '. Open the Dashboard to accept or decline.'
from auth.users u, projects p
where lower(u.email) = lower(new.email) and p.id = new.project_id;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.on_task_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.status = 'done' then new.finished_at := now(); end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.on_task_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
declare deps_changed boolean;
begin
deps_changed := new.depends_on is distinct from old.depends_on
and new.depends_on is distinct from existing_deps(old.depends_on);

-- a done task is locked
if old.status = 'done' and (new.status is distinct from old.status or new.priority is distinct from old.priority
or deps_changed
or (new.assigned_to is distinct from old.assigned_to
and not (new.assigned_to is null and not exists (select 1 from users where id = old.assigned_to)))
or new.start_date is distinct from old.start_date or new.end_date is distinct from old.end_date) then
raise exception 'This task is done, so it is locked';
end if;

if new.status is distinct from old.status then
-- only an assignee changes the status (or an approved request, which sets app.bypass)
if auth.uid() is not null and coalesce(current_setting('app.bypass', true), '') <> '1'
and not is_assignee(new.id, auth.uid()) then
raise exception 'Only a person assigned to this task can change its status';
end if;
-- it cannot start or finish before the tasks it waits for are done
if new.status in ('progress', 'done') and exists (
select 1 from tasks d where d.id = any(new.depends_on) and d.status <> 'done') then
raise exception 'Finish the tasks this one depends on first';
end if;
end if;

-- a task nobody has cannot change status, priority or dependencies (assigning someone is allowed)
if old.assigned_to is null and new.assigned_to is null
and not exists (select 1 from task_assignees where task_id = new.id)
and (new.status is distinct from old.status or new.priority is distinct from old.priority
or deps_changed) then
raise exception 'Assign this task to someone first';
end if;

if new.status = 'done' and old.status <> 'done' then
new.finished_at := now();
new.percent_complete := 100;
elsif new.status <> 'done' then
new.finished_at := null;
end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.remove_from_project(pid uuid, uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare r roles%rowtype;
begin
select * into r from roles where user_id = uid and project_id = pid;
if not found then raise exception 'That person is not in this project'; end if;

-- "is distinct from" so a missing login counts as someone else, and fails the admin check
if uid is distinct from auth.uid() then
if pid not in (select my_admin_projects()) then raise exception 'Only admins can remove other people'; end if;
if r.is_owner then raise exception 'The owner cannot be removed'; end if;
if r.role = 'admin' and not exists (
select 1 from roles where project_id = pid and user_id = auth.uid() and is_owner) then
raise exception 'Only the owner can remove another admin';
end if;
elsif r.role = 'admin' then
if exists (select 1 from tasks where project_id = pid and assigned_to = uid and status <> 'done') then
raise exception 'Finish your tasks before leaving';
end if;
end if;

if r.role = 'admin' and not exists (
select 1 from roles where project_id = pid and role = 'admin' and user_id <> uid) then
raise exception 'A project needs at least one admin. Invite another admin first.';
end if;

update tasks set assigned_to = null where project_id = pid and assigned_to = uid and status <> 'done';
delete from requests where project_id = pid and requested_by = uid and status = 'pending';
delete from roles where user_id = uid and project_id = pid;

-- this is for passing ownership to another admin when the owner leaves
if r.is_owner then
update roles set is_owner = true
where project_id = pid and user_id = (
select user_id from roles where project_id = pid and role = 'admin' limit 1);
end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
cmd record;
tbl name;
BEGIN
FOR cmd IN
SELECT *
FROM pg_event_trigger_ddl_commands()
WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
AND object_type IN ('table','partitioned table')
LOOP
IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
BEGIN
SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
END;
ELSE
RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
END IF;
END LOOP;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.send_note(pid uuid, uid uuid, k text, txt text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
if uid is null or uid = auth.uid() then return; end if;
if exists (select 1 from notification_settings s
where s.user_id = uid and (s.project_id is null or s.project_id = pid) and k = any(s.muted)) then
return;
end if;
insert into notifications (user_id, project_id, kind, text) values (uid, pid, k, txt);
end $function$
;

CREATE OR REPLACE FUNCTION public.set_baseline(pid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
if pid not in (select my_admin_projects()) then raise exception 'Only admins can set the baseline'; end if;
update tasks set baseline_start = start_date, baseline_end = end_date where project_id = pid;
update projects set baseline_set_at = now() where id = pid;
perform log_activity(pid, 'baseline_set', null, '{}');
end $function$
;

CREATE OR REPLACE FUNCTION public.set_first_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
if new.role = 'admin' and not exists (select 1 from roles where project_id = new.project_id and is_owner) then
new.is_owner := true;
end if;
return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.set_member_role(pid uuid, uid uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare t roles%rowtype;
begin
if new_role not in ('admin', 'member') then raise exception 'Role must be admin or member'; end if;
if pid not in (select my_admin_projects()) then raise exception 'Only admins can change roles'; end if;
select * into t from roles where project_id = pid and user_id = uid;
if not found then raise exception 'That person is not in this project'; end if;
if t.is_owner then raise exception 'The owner stays an admin. Hand over ownership first.'; end if;
if t.role = 'admin' and new_role = 'member'
and not exists (select 1 from roles where project_id = pid and user_id = auth.uid() and is_owner) then
raise exception 'Only the owner can make an admin a member';
end if;
update roles set role = new_role where project_id = pid and user_id = uid;
end $function$
;

CREATE OR REPLACE FUNCTION public.set_task_status(task_id uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
perform set_config('app.bypass', '1', true);
update tasks set status = new_status
where id = task_id and is_assignee(id, auth.uid()) and project_id in (select my_admin_projects());
if not found then raise exception 'Only an admin assigned to this task can change its status'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.transfer_ownership(pid uuid, uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
if not exists (select 1 from roles where project_id = pid and user_id = auth.uid() and is_owner) then
raise exception 'Only the owner can hand over the project';
end if;
if not exists (select 1 from roles where project_id = pid and user_id = uid and role = 'admin') then
raise exception 'The new owner has to be an admin of this project';
end if;
update roles set is_owner = false where project_id = pid and is_owner;
update roles set is_owner = true where project_id = pid and user_id = uid;
end $function$
;
CREATE TRIGGER comments_after AFTER INSERT ON public.task_comments FOR EACH ROW EXECUTE FUNCTION after_comment();

CREATE TRIGGER invites_limit BEFORE INSERT ON public.invites FOR EACH ROW WHEN ((new.email IS NOT NULL)) EXECUTE FUNCTION limit_email_invites();

CREATE TRIGGER invites_notify AFTER INSERT ON public.invites FOR EACH ROW EXECUTE FUNCTION notify_invite();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER requests_after AFTER INSERT OR UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION after_request_change();

CREATE TRIGGER roles_after AFTER INSERT ON public.roles FOR EACH ROW EXECUTE FUNCTION after_role_change();

CREATE TRIGGER roles_first_owner BEFORE INSERT ON public.roles FOR EACH ROW EXECUTE FUNCTION set_first_owner();

CREATE TRIGGER tasks_after AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION after_task_change();

CREATE TRIGGER tasks_check_assignee BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION check_assignee();
CREATE TRIGGER tasks_drop_dependency AFTER DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION drop_deleted_dependency();

CREATE TRIGGER tasks_guard BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION on_task_update();

CREATE TRIGGER tasks_insert_done BEFORE INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION on_task_insert();

-- a new Supabase project may already have this trigger
do $$
begin
  if not exists (select 1 from pg_event_trigger where evtname = 'ensure_rls') then
    create event trigger ensure_rls on ddl_command_end when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') execute function rls_auto_enable();
  end if;
end $$;

alter table public.activity_log enable row level security;

alter table public.audit_log enable row level security;

alter table public.invites enable row level security;

alter table public.notification_settings enable row level security;

alter table public.notifications enable row level security;

alter table public.project_holidays enable row level security;

alter table public.project_messages enable row level security;

alter table public.projects enable row level security;
alter table public.requests enable row level security;

alter table public.roles enable row level security;

alter table public.task_assignees enable row level security;

alter table public.task_checklist enable row level security;

alter table public.task_comments enable row level security;

alter table public.task_links enable row level security;

alter table public.task_templates enable row level security;

alter table public.tasks enable row level security;

alter table public.time_off enable row level security;

alter table public.users enable row level security;

create policy "see activity" on public.activity_log as PERMISSIVE for SELECT to authenticated using ((project_id IN ( SELECT my_projects() AS my_projects)));

create policy "admins see invites" on public.invites as PERMISSIVE for SELECT to authenticated using ((project_id IN ( SELECT my_admin_projects() AS my_admin_projects)));
create policy "my settings" on public.notification_settings as PERMISSIVE for ALL to authenticated using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

create policy "delete my notifications" on public.notifications as PERMISSIVE for DELETE to authenticated using ((user_id = auth.uid()));

create policy "see my notifications" on public.notifications as PERMISSIVE for SELECT to authenticated using ((user_id = auth.uid()));

create policy "update my notifications" on public.notifications as PERMISSIVE for UPDATE to authenticated using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

create policy "admins manage holidays" on public.project_holidays as PERMISSIVE for ALL to authenticated using ((project_id IN ( SELECT my_admin_projects() AS my_admin_projects))) with check ((project_id IN ( SELECT my_admin_projects() AS my_admin_projects)));

create policy "see holidays" on public.project_holidays as PERMISSIVE for SELECT to authenticated using ((project_id IN ( SELECT my_projects() AS my_projects)));

create policy "delete messages" on public.project_messages as PERMISSIVE for DELETE to authenticated using (((user_id = auth.uid()) OR (project_id IN ( SELECT my_admin_projects() AS my_admin_projects))));

create policy "see messages" on public.project_messages as PERMISSIVE for SELECT to authenticated using ((project_id IN ( SELECT my_projects() AS my_projects)));
create policy "send messages" on public.project_messages as PERMISSIVE for INSERT to authenticated with check (((user_id = auth.uid()) AND (project_id IN ( SELECT my_projects() AS my_projects))));

create policy "admins edit project" on public.projects as PERMISSIVE for UPDATE to authenticated using ((id IN ( SELECT my_admin_projects() AS my_admin_projects))) with check ((id IN ( SELECT my_admin_projects() AS my_admin_projects)));

create policy "see my projects" on public.projects as PERMISSIVE for SELECT to authenticated using ((id IN ( SELECT my_projects() AS my_projects)));

create policy "make requests" on public.requests as PERMISSIVE for INSERT to authenticated with check (((requested_by = auth.uid()) AND (status = 'pending'::text) AND (EXISTS ( SELECT 1
FROM tasks t
WHERE ((t.id = requests.task_id) AND (t.project_id = requests.project_id)))) AND is_assignee(task_id, auth.uid())));

create policy "see requests" on public.requests as PERMISSIVE for SELECT to authenticated using (((project_id IN ( SELECT my_projects() AS my_projects)) AND ((requested_by = auth.uid()) OR (project_id IN ( SELECT my_admin_projects() AS my_admin_projects)))));

create policy "see my team roles" on public.roles as PERMISSIVE for SELECT to authenticated using ((project_id IN ( SELECT my_projects() AS my_projects)));

create policy "admins add assignees" on public.task_assignees as PERMISSIVE for INSERT to authenticated with check (((task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_admin_projects() AS my_admin_projects)))) AND (EXISTS ( SELECT 1
FROM (tasks t
JOIN roles r ON (((r.project_id = t.project_id) AND (r.user_id = task_assignees.user_id))))
WHERE (t.id = task_assignees.task_id)))));

create policy "admins remove assignees" on public.task_assignees as PERMISSIVE for DELETE to authenticated using ((task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_admin_projects() AS my_admin_projects)))));

create policy "see assignees" on public.task_assignees as PERMISSIVE for SELECT to authenticated using ((task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_projects() AS my_projects)))));

create policy "edit checklist" on public.task_checklist as PERMISSIVE for ALL to authenticated using (((task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_admin_projects() AS my_admin_projects)))) OR is_assignee(task_id, auth.uid()))) with check (((task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_admin_projects() AS my_admin_projects)))) OR is_assignee(task_id, auth.uid())));

create policy "see checklist" on public.task_checklist as PERMISSIVE for SELECT to authenticated using ((task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_projects() AS my_projects)))));

create policy "add comments" on public.task_comments as PERMISSIVE for INSERT to authenticated with check (((user_id = auth.uid()) AND (task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_projects() AS my_projects))))));

create policy "delete comments" on public.task_comments as PERMISSIVE for DELETE to authenticated using (((user_id = auth.uid()) OR (task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_admin_projects() AS my_admin_projects))))));

create policy "see comments" on public.task_comments as PERMISSIVE for SELECT to authenticated using ((task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_projects() AS my_projects)))));

create policy "add links" on public.task_links as PERMISSIVE for INSERT to authenticated with check (((created_by = auth.uid()) AND (task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_projects() AS my_projects))))));

create policy "delete links" on public.task_links as PERMISSIVE for DELETE to authenticated using (((created_by = auth.uid()) OR (task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_admin_projects() AS my_admin_projects))))));
create policy "see links" on public.task_links as PERMISSIVE for SELECT to authenticated using ((task_id IN ( SELECT tasks.id
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_projects() AS my_projects)))));

create policy "admins manage templates" on public.task_templates as PERMISSIVE for ALL to authenticated using ((project_id IN ( SELECT my_admin_projects() AS my_admin_projects))) with check ((project_id IN ( SELECT my_admin_projects() AS my_admin_projects)));

create policy "see templates" on public.task_templates as PERMISSIVE for SELECT to authenticated using ((project_id IN ( SELECT my_projects() AS my_projects)));

create policy "admins add tasks" on public.tasks as PERMISSIVE for INSERT to authenticated with check (((project_id IN ( SELECT my_admin_projects() AS my_admin_projects)) AND ((assigned_to IS NULL) OR (status = 'done'::text) OR (EXISTS ( SELECT 1
FROM roles r
WHERE ((r.user_id = tasks.assigned_to) AND (r.project_id = tasks.project_id)))))));

create policy "admins delete tasks" on public.tasks as PERMISSIVE for DELETE to authenticated using ((project_id IN ( SELECT my_admin_projects() AS my_admin_projects)));

create policy "admins edit tasks" on public.tasks as PERMISSIVE for UPDATE to authenticated using ((project_id IN ( SELECT my_admin_projects() AS my_admin_projects))) with check (((project_id IN ( SELECT my_admin_projects() AS my_admin_projects)) AND ((assigned_to IS NULL) OR (status = 'done'::text) OR (EXISTS ( SELECT 1
FROM roles r
WHERE ((r.user_id = tasks.assigned_to) AND (r.project_id = tasks.project_id)))))));

create policy "see my tasks" on public.tasks as PERMISSIVE for SELECT to authenticated using ((project_id IN ( SELECT my_projects() AS my_projects)));

create policy "add own time off" on public.time_off as PERMISSIVE for INSERT to authenticated with check (((user_id = auth.uid()) AND (project_id IN ( SELECT my_projects() AS my_projects))));

create policy "delete time off" on public.time_off as PERMISSIVE for DELETE to authenticated using (((user_id = auth.uid()) OR (project_id IN ( SELECT my_admin_projects() AS my_admin_projects))));

create policy "see time off" on public.time_off as PERMISSIVE for SELECT to authenticated using ((project_id IN ( SELECT my_projects() AS my_projects)));

create policy "edit my name" on public.users as PERMISSIVE for UPDATE to authenticated using ((id = auth.uid())) with check ((id = auth.uid()));

create policy "see my team" on public.users as PERMISSIVE for SELECT to authenticated using (((id = auth.uid()) OR (id IN ( SELECT roles.user_id
FROM roles
WHERE (roles.project_id IN ( SELECT my_projects() AS my_projects))))));

create policy "see task people" on public.users as PERMISSIVE for SELECT to authenticated using ((id IN ( SELECT tasks.assigned_to
FROM tasks
WHERE (tasks.project_id IN ( SELECT my_projects() AS my_projects)))));
revoke all on function after_comment() from public, anon, authenticated, service_role;
grant execute on function after_comment() to authenticated;
grant execute on function after_comment() to service_role;

revoke all on function after_request_change() from public, anon, authenticated, service_role;
grant execute on function after_request_change() to authenticated;
grant execute on function after_request_change() to service_role;

revoke all on function after_role_change() from public, anon, authenticated, service_role;
grant execute on function after_role_change() to authenticated;
grant execute on function after_role_change() to service_role;

revoke all on function after_task_change() from public, anon, authenticated, service_role;
grant execute on function after_task_change() to authenticated;
grant execute on function after_task_change() to service_role;

revoke all on function check_assignee() from public, anon, authenticated, service_role;
grant execute on function check_assignee() to public;
grant execute on function check_assignee() to anon;
grant execute on function check_assignee() to authenticated;
grant execute on function check_assignee() to service_role;

revoke all on function create_project(text,text,text[]) from public, anon, authenticated, service_role;
grant execute on function create_project(text,text,text[]) to authenticated;
grant execute on function create_project(text,text,text[]) to service_role;
revoke all on function decide_request(uuid,boolean,text,jsonb) from public, anon, authenticated, service_role;
grant execute on function decide_request(uuid,boolean,text,jsonb) to authenticated;
grant execute on function decide_request(uuid,boolean,text,jsonb) to service_role;

revoke all on function decline_invite(text) from public, anon, authenticated, service_role;
grant execute on function decline_invite(text) to authenticated;
grant execute on function decline_invite(text) to service_role;

revoke all on function delete_my_account() from public, anon, authenticated, service_role;
grant execute on function delete_my_account() to authenticated;
grant execute on function delete_my_account() to service_role;

revoke all on function delete_project(uuid) from public, anon, authenticated, service_role;
grant execute on function delete_project(uuid) to authenticated;
grant execute on function delete_project(uuid) to service_role;

revoke all on function drop_deleted_dependency() from public, anon, authenticated, service_role;
grant execute on function drop_deleted_dependency() to public;
grant execute on function drop_deleted_dependency() to anon;
grant execute on function drop_deleted_dependency() to authenticated;
grant execute on function drop_deleted_dependency() to service_role;

revoke all on function enforce_task_rules() from public, anon, authenticated, service_role;
grant execute on function enforce_task_rules() to authenticated;
grant execute on function enforce_task_rules() to service_role;

revoke all on function existing_deps(uuid[]) from public, anon, authenticated, service_role;
grant execute on function existing_deps(uuid[]) to public;
grant execute on function existing_deps(uuid[]) to anon;
grant execute on function existing_deps(uuid[]) to authenticated;
grant execute on function existing_deps(uuid[]) to service_role;

revoke all on function first_admin_is_owner() from public, anon, authenticated, service_role;
grant execute on function first_admin_is_owner() to authenticated;
grant execute on function first_admin_is_owner() to service_role;

revoke all on function handle_new_user() from public, anon, authenticated, service_role;
grant execute on function handle_new_user() to authenticated;
grant execute on function handle_new_user() to service_role;

revoke all on function is_assignee(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function is_assignee(uuid,uuid) to authenticated;
grant execute on function is_assignee(uuid,uuid) to service_role;

revoke all on function join_project(text) from public, anon, authenticated, service_role;
grant execute on function join_project(text) to authenticated;
grant execute on function join_project(text) to service_role;

revoke all on function keep_an_owner() from public, anon, authenticated, service_role;
grant execute on function keep_an_owner() to authenticated;
grant execute on function keep_an_owner() to service_role;

revoke all on function limit_email_invites() from public, anon, authenticated, service_role;
grant execute on function limit_email_invites() to public;
grant execute on function limit_email_invites() to anon;
grant execute on function limit_email_invites() to authenticated;
grant execute on function limit_email_invites() to service_role;

revoke all on function log_activity(uuid,text,uuid,jsonb) from public, anon, authenticated, service_role;
grant execute on function log_activity(uuid,text,uuid,jsonb) to service_role;

revoke all on function log_event(uuid,text,uuid,text) from public, anon, authenticated, service_role;
grant execute on function log_event(uuid,text,uuid,text) to service_role;

revoke all on function make_email_invite(uuid,text,text) from public, anon, authenticated, service_role;
grant execute on function make_email_invite(uuid,text,text) to authenticated;
grant execute on function make_email_invite(uuid,text,text) to service_role;

revoke all on function make_invite(uuid,text) from public, anon, authenticated, service_role;
grant execute on function make_invite(uuid,text) to authenticated;
grant execute on function make_invite(uuid,text) to service_role;
revoke all on function mark_invites_emailed(text[]) from public, anon, authenticated, service_role;
grant execute on function mark_invites_emailed(text[]) to authenticated;
grant execute on function mark_invites_emailed(text[]) to service_role;

revoke all on function my_admin_projects() from public, anon, authenticated, service_role;
grant execute on function my_admin_projects() to authenticated;
grant execute on function my_admin_projects() to service_role;

revoke all on function my_pending_invites() from public, anon, authenticated, service_role;
grant execute on function my_pending_invites() to authenticated;
grant execute on function my_pending_invites() to service_role;

revoke all on function my_projects() from public, anon, authenticated, service_role;
grant execute on function my_projects() to authenticated;
grant execute on function my_projects() to service_role;

revoke all on function notify_invite() from public, anon, authenticated, service_role;
grant execute on function notify_invite() to authenticated;
grant execute on function notify_invite() to service_role;

revoke all on function on_task_insert() from public, anon, authenticated, service_role;
grant execute on function on_task_insert() to public;
grant execute on function on_task_insert() to anon;
grant execute on function on_task_insert() to authenticated;
grant execute on function on_task_insert() to service_role;
revoke all on function on_task_update() from public, anon, authenticated, service_role;
grant execute on function on_task_update() to authenticated;
grant execute on function on_task_update() to service_role;

revoke all on function remove_from_project(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function remove_from_project(uuid,uuid) to authenticated;
grant execute on function remove_from_project(uuid,uuid) to service_role;

revoke all on function rls_auto_enable() from public, anon, authenticated, service_role;
grant execute on function rls_auto_enable() to authenticated;
grant execute on function rls_auto_enable() to service_role;

revoke all on function send_note(uuid,uuid,text,text) from public, anon, authenticated, service_role;
grant execute on function send_note(uuid,uuid,text,text) to service_role;

revoke all on function set_baseline(uuid) from public, anon, authenticated, service_role;
grant execute on function set_baseline(uuid) to authenticated;
grant execute on function set_baseline(uuid) to service_role;

revoke all on function set_first_owner() from public, anon, authenticated, service_role;
grant execute on function set_first_owner() to public;
grant execute on function set_first_owner() to anon;
grant execute on function set_first_owner() to authenticated;
grant execute on function set_first_owner() to service_role;
revoke all on function set_member_role(uuid,uuid,text) from public, anon, authenticated, service_role;
grant execute on function set_member_role(uuid,uuid,text) to authenticated;
grant execute on function set_member_role(uuid,uuid,text) to service_role;

revoke all on function set_task_status(uuid,text) from public, anon, authenticated, service_role;
grant execute on function set_task_status(uuid,text) to authenticated;
grant execute on function set_task_status(uuid,text) to service_role;

revoke all on function transfer_ownership(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function transfer_ownership(uuid,uuid) to authenticated;
grant execute on function transfer_ownership(uuid,uuid) to service_role;

revoke all on table public.activity_log from anon, authenticated, service_role;
grant INSERT on table public.activity_log to anon;
grant SELECT on table public.activity_log to anon;
grant UPDATE on table public.activity_log to anon;
grant DELETE on table public.activity_log to anon;
grant TRUNCATE on table public.activity_log to anon;
grant REFERENCES on table public.activity_log to anon;
grant TRIGGER on table public.activity_log to anon;
grant MAINTAIN on table public.activity_log to anon;
grant INSERT on table public.activity_log to authenticated;
grant SELECT on table public.activity_log to authenticated;
grant UPDATE on table public.activity_log to authenticated;
grant DELETE on table public.activity_log to authenticated;
grant TRUNCATE on table public.activity_log to authenticated;
grant REFERENCES on table public.activity_log to authenticated;
grant TRIGGER on table public.activity_log to authenticated;
grant MAINTAIN on table public.activity_log to authenticated;
grant INSERT on table public.activity_log to service_role;
grant SELECT on table public.activity_log to service_role;
grant UPDATE on table public.activity_log to service_role;
grant DELETE on table public.activity_log to service_role;
grant TRUNCATE on table public.activity_log to service_role;
grant REFERENCES on table public.activity_log to service_role;
grant TRIGGER on table public.activity_log to service_role;
grant MAINTAIN on table public.activity_log to service_role;

revoke all on table public.audit_log from anon, authenticated, service_role;
grant INSERT on table public.audit_log to anon;
grant SELECT on table public.audit_log to anon;
grant UPDATE on table public.audit_log to anon;
grant DELETE on table public.audit_log to anon;
grant TRUNCATE on table public.audit_log to anon;
grant REFERENCES on table public.audit_log to anon;
grant TRIGGER on table public.audit_log to anon;
grant MAINTAIN on table public.audit_log to anon;
grant INSERT on table public.audit_log to authenticated;
grant SELECT on table public.audit_log to authenticated;
grant UPDATE on table public.audit_log to authenticated;
grant DELETE on table public.audit_log to authenticated;
grant TRUNCATE on table public.audit_log to authenticated;
grant REFERENCES on table public.audit_log to authenticated;
grant TRIGGER on table public.audit_log to authenticated;
grant MAINTAIN on table public.audit_log to authenticated;
grant INSERT on table public.audit_log to service_role;
grant SELECT on table public.audit_log to service_role;
grant UPDATE on table public.audit_log to service_role;
grant DELETE on table public.audit_log to service_role;
grant TRUNCATE on table public.audit_log to service_role;
grant REFERENCES on table public.audit_log to service_role;
grant TRIGGER on table public.audit_log to service_role;
grant MAINTAIN on table public.audit_log to service_role;

revoke all on table public.invites from anon, authenticated, service_role;
grant INSERT on table public.invites to anon;
grant SELECT on table public.invites to anon;
grant UPDATE on table public.invites to anon;
grant DELETE on table public.invites to anon;
grant TRUNCATE on table public.invites to anon;
grant REFERENCES on table public.invites to anon;
grant TRIGGER on table public.invites to anon;
grant MAINTAIN on table public.invites to anon;
grant INSERT on table public.invites to authenticated;
grant SELECT on table public.invites to authenticated;
grant UPDATE on table public.invites to authenticated;
grant DELETE on table public.invites to authenticated;
grant TRUNCATE on table public.invites to authenticated;
grant REFERENCES on table public.invites to authenticated;
grant TRIGGER on table public.invites to authenticated;
grant MAINTAIN on table public.invites to authenticated;
grant INSERT on table public.invites to service_role;
grant SELECT on table public.invites to service_role;
grant UPDATE on table public.invites to service_role;
grant DELETE on table public.invites to service_role;
grant TRUNCATE on table public.invites to service_role;
grant REFERENCES on table public.invites to service_role;
grant TRIGGER on table public.invites to service_role;
grant MAINTAIN on table public.invites to service_role;

revoke all on table public.notification_settings from anon, authenticated, service_role;
grant INSERT on table public.notification_settings to anon;
grant SELECT on table public.notification_settings to anon;
grant UPDATE on table public.notification_settings to anon;
grant DELETE on table public.notification_settings to anon;
grant TRUNCATE on table public.notification_settings to anon;
grant REFERENCES on table public.notification_settings to anon;
grant TRIGGER on table public.notification_settings to anon;
grant MAINTAIN on table public.notification_settings to anon;
grant INSERT on table public.notification_settings to authenticated;
grant SELECT on table public.notification_settings to authenticated;
grant UPDATE on table public.notification_settings to authenticated;
grant DELETE on table public.notification_settings to authenticated;
grant TRUNCATE on table public.notification_settings to authenticated;
grant REFERENCES on table public.notification_settings to authenticated;
grant TRIGGER on table public.notification_settings to authenticated;
grant MAINTAIN on table public.notification_settings to authenticated;
grant INSERT on table public.notification_settings to service_role;
grant SELECT on table public.notification_settings to service_role;
grant UPDATE on table public.notification_settings to service_role;
grant DELETE on table public.notification_settings to service_role;
grant TRUNCATE on table public.notification_settings to service_role;
grant REFERENCES on table public.notification_settings to service_role;
grant TRIGGER on table public.notification_settings to service_role;
grant MAINTAIN on table public.notification_settings to service_role;

revoke all on table public.notifications from anon, authenticated, service_role;
grant INSERT on table public.notifications to anon;
grant SELECT on table public.notifications to anon;
grant UPDATE on table public.notifications to anon;
grant DELETE on table public.notifications to anon;
grant TRUNCATE on table public.notifications to anon;
grant REFERENCES on table public.notifications to anon;
grant TRIGGER on table public.notifications to anon;
grant MAINTAIN on table public.notifications to anon;
grant INSERT on table public.notifications to authenticated;
grant SELECT on table public.notifications to authenticated;
grant UPDATE on table public.notifications to authenticated;
grant DELETE on table public.notifications to authenticated;
grant TRUNCATE on table public.notifications to authenticated;
grant REFERENCES on table public.notifications to authenticated;
grant TRIGGER on table public.notifications to authenticated;
grant MAINTAIN on table public.notifications to authenticated;
grant INSERT on table public.notifications to service_role;
grant SELECT on table public.notifications to service_role;
grant UPDATE on table public.notifications to service_role;
grant DELETE on table public.notifications to service_role;
grant TRUNCATE on table public.notifications to service_role;
grant REFERENCES on table public.notifications to service_role;
grant TRIGGER on table public.notifications to service_role;
grant MAINTAIN on table public.notifications to service_role;

revoke all on table public.project_holidays from anon, authenticated, service_role;
grant INSERT on table public.project_holidays to anon;
grant SELECT on table public.project_holidays to anon;
grant UPDATE on table public.project_holidays to anon;
grant DELETE on table public.project_holidays to anon;
grant TRUNCATE on table public.project_holidays to anon;
grant REFERENCES on table public.project_holidays to anon;
grant TRIGGER on table public.project_holidays to anon;
grant MAINTAIN on table public.project_holidays to anon;
grant INSERT on table public.project_holidays to authenticated;
grant SELECT on table public.project_holidays to authenticated;
grant UPDATE on table public.project_holidays to authenticated;
grant DELETE on table public.project_holidays to authenticated;
grant TRUNCATE on table public.project_holidays to authenticated;
grant REFERENCES on table public.project_holidays to authenticated;
grant TRIGGER on table public.project_holidays to authenticated;
grant MAINTAIN on table public.project_holidays to authenticated;
grant INSERT on table public.project_holidays to service_role;
grant SELECT on table public.project_holidays to service_role;
grant UPDATE on table public.project_holidays to service_role;
grant DELETE on table public.project_holidays to service_role;
grant TRUNCATE on table public.project_holidays to service_role;
grant REFERENCES on table public.project_holidays to service_role;
grant TRIGGER on table public.project_holidays to service_role;
grant MAINTAIN on table public.project_holidays to service_role;

revoke all on table public.project_messages from anon, authenticated, service_role;
grant INSERT on table public.project_messages to anon;
grant SELECT on table public.project_messages to anon;
grant UPDATE on table public.project_messages to anon;
grant DELETE on table public.project_messages to anon;
grant TRUNCATE on table public.project_messages to anon;
grant REFERENCES on table public.project_messages to anon;
grant TRIGGER on table public.project_messages to anon;
grant MAINTAIN on table public.project_messages to anon;
grant INSERT on table public.project_messages to authenticated;
grant SELECT on table public.project_messages to authenticated;
grant UPDATE on table public.project_messages to authenticated;
grant DELETE on table public.project_messages to authenticated;
grant TRUNCATE on table public.project_messages to authenticated;
grant REFERENCES on table public.project_messages to authenticated;
grant TRIGGER on table public.project_messages to authenticated;
grant MAINTAIN on table public.project_messages to authenticated;
grant INSERT on table public.project_messages to service_role;
grant SELECT on table public.project_messages to service_role;
grant UPDATE on table public.project_messages to service_role;
grant DELETE on table public.project_messages to service_role;
grant TRUNCATE on table public.project_messages to service_role;
grant REFERENCES on table public.project_messages to service_role;
grant TRIGGER on table public.project_messages to service_role;
grant MAINTAIN on table public.project_messages to service_role;

revoke all on table public.projects from anon, authenticated, service_role;
grant INSERT on table public.projects to anon;
grant SELECT on table public.projects to anon;
grant UPDATE on table public.projects to anon;
grant DELETE on table public.projects to anon;
grant TRUNCATE on table public.projects to anon;
grant REFERENCES on table public.projects to anon;
grant TRIGGER on table public.projects to anon;
grant MAINTAIN on table public.projects to anon;
grant INSERT on table public.projects to authenticated;
grant SELECT on table public.projects to authenticated;
grant UPDATE on table public.projects to authenticated;
grant DELETE on table public.projects to authenticated;
grant TRUNCATE on table public.projects to authenticated;
grant REFERENCES on table public.projects to authenticated;
grant TRIGGER on table public.projects to authenticated;
grant MAINTAIN on table public.projects to authenticated;
grant INSERT on table public.projects to service_role;
grant SELECT on table public.projects to service_role;
grant UPDATE on table public.projects to service_role;
grant DELETE on table public.projects to service_role;
grant TRUNCATE on table public.projects to service_role;
grant REFERENCES on table public.projects to service_role;
grant TRIGGER on table public.projects to service_role;
grant MAINTAIN on table public.projects to service_role;

revoke all on table public.requests from anon, authenticated, service_role;
grant INSERT on table public.requests to anon;
grant SELECT on table public.requests to anon;
grant UPDATE on table public.requests to anon;
grant DELETE on table public.requests to anon;
grant TRUNCATE on table public.requests to anon;
grant REFERENCES on table public.requests to anon;
grant TRIGGER on table public.requests to anon;
grant MAINTAIN on table public.requests to anon;
grant INSERT on table public.requests to authenticated;
grant SELECT on table public.requests to authenticated;
grant UPDATE on table public.requests to authenticated;
grant DELETE on table public.requests to authenticated;
grant TRUNCATE on table public.requests to authenticated;
grant REFERENCES on table public.requests to authenticated;
grant TRIGGER on table public.requests to authenticated;
grant MAINTAIN on table public.requests to authenticated;
grant INSERT on table public.requests to service_role;
grant SELECT on table public.requests to service_role;
grant UPDATE on table public.requests to service_role;
grant DELETE on table public.requests to service_role;
grant TRUNCATE on table public.requests to service_role;
grant REFERENCES on table public.requests to service_role;
grant TRIGGER on table public.requests to service_role;
grant MAINTAIN on table public.requests to service_role;

revoke all on table public.roles from anon, authenticated, service_role;
grant INSERT on table public.roles to anon;
grant SELECT on table public.roles to anon;
grant UPDATE on table public.roles to anon;
grant DELETE on table public.roles to anon;
grant TRUNCATE on table public.roles to anon;
grant REFERENCES on table public.roles to anon;
grant TRIGGER on table public.roles to anon;
grant MAINTAIN on table public.roles to anon;
grant INSERT on table public.roles to authenticated;
grant SELECT on table public.roles to authenticated;
grant UPDATE on table public.roles to authenticated;
grant DELETE on table public.roles to authenticated;
grant TRUNCATE on table public.roles to authenticated;
grant REFERENCES on table public.roles to authenticated;
grant TRIGGER on table public.roles to authenticated;
grant MAINTAIN on table public.roles to authenticated;
grant INSERT on table public.roles to service_role;
grant SELECT on table public.roles to service_role;
grant UPDATE on table public.roles to service_role;
grant DELETE on table public.roles to service_role;
grant TRUNCATE on table public.roles to service_role;
grant REFERENCES on table public.roles to service_role;
grant TRIGGER on table public.roles to service_role;
grant MAINTAIN on table public.roles to service_role;

revoke all on table public.task_assignees from anon, authenticated, service_role;
grant INSERT on table public.task_assignees to anon;
grant SELECT on table public.task_assignees to anon;
grant UPDATE on table public.task_assignees to anon;
grant DELETE on table public.task_assignees to anon;
grant TRUNCATE on table public.task_assignees to anon;
grant REFERENCES on table public.task_assignees to anon;
grant TRIGGER on table public.task_assignees to anon;
grant MAINTAIN on table public.task_assignees to anon;
grant INSERT on table public.task_assignees to authenticated;
grant SELECT on table public.task_assignees to authenticated;
grant UPDATE on table public.task_assignees to authenticated;
grant DELETE on table public.task_assignees to authenticated;
grant TRUNCATE on table public.task_assignees to authenticated;
grant REFERENCES on table public.task_assignees to authenticated;
grant TRIGGER on table public.task_assignees to authenticated;
grant MAINTAIN on table public.task_assignees to authenticated;
grant INSERT on table public.task_assignees to service_role;
grant SELECT on table public.task_assignees to service_role;
grant UPDATE on table public.task_assignees to service_role;
grant DELETE on table public.task_assignees to service_role;
grant TRUNCATE on table public.task_assignees to service_role;
grant REFERENCES on table public.task_assignees to service_role;
grant TRIGGER on table public.task_assignees to service_role;
grant MAINTAIN on table public.task_assignees to service_role;

revoke all on table public.task_checklist from anon, authenticated, service_role;
grant INSERT on table public.task_checklist to anon;
grant SELECT on table public.task_checklist to anon;
grant UPDATE on table public.task_checklist to anon;
grant DELETE on table public.task_checklist to anon;
grant TRUNCATE on table public.task_checklist to anon;
grant REFERENCES on table public.task_checklist to anon;
grant TRIGGER on table public.task_checklist to anon;
grant MAINTAIN on table public.task_checklist to anon;
grant INSERT on table public.task_checklist to authenticated;
grant SELECT on table public.task_checklist to authenticated;
grant UPDATE on table public.task_checklist to authenticated;
grant DELETE on table public.task_checklist to authenticated;
grant TRUNCATE on table public.task_checklist to authenticated;
grant REFERENCES on table public.task_checklist to authenticated;
grant TRIGGER on table public.task_checklist to authenticated;
grant MAINTAIN on table public.task_checklist to authenticated;
grant INSERT on table public.task_checklist to service_role;
grant SELECT on table public.task_checklist to service_role;
grant UPDATE on table public.task_checklist to service_role;
grant DELETE on table public.task_checklist to service_role;
grant TRUNCATE on table public.task_checklist to service_role;
grant REFERENCES on table public.task_checklist to service_role;
grant TRIGGER on table public.task_checklist to service_role;
grant MAINTAIN on table public.task_checklist to service_role;

revoke all on table public.task_comments from anon, authenticated, service_role;
grant INSERT on table public.task_comments to anon;
grant SELECT on table public.task_comments to anon;
grant UPDATE on table public.task_comments to anon;
grant DELETE on table public.task_comments to anon;
grant TRUNCATE on table public.task_comments to anon;
grant REFERENCES on table public.task_comments to anon;
grant TRIGGER on table public.task_comments to anon;
grant MAINTAIN on table public.task_comments to anon;
grant INSERT on table public.task_comments to authenticated;
grant SELECT on table public.task_comments to authenticated;
grant UPDATE on table public.task_comments to authenticated;
grant DELETE on table public.task_comments to authenticated;
grant TRUNCATE on table public.task_comments to authenticated;
grant REFERENCES on table public.task_comments to authenticated;
grant TRIGGER on table public.task_comments to authenticated;
grant MAINTAIN on table public.task_comments to authenticated;
grant INSERT on table public.task_comments to service_role;
grant SELECT on table public.task_comments to service_role;
grant UPDATE on table public.task_comments to service_role;
grant DELETE on table public.task_comments to service_role;
grant TRUNCATE on table public.task_comments to service_role;
grant REFERENCES on table public.task_comments to service_role;
grant TRIGGER on table public.task_comments to service_role;
grant MAINTAIN on table public.task_comments to service_role;

revoke all on table public.task_links from anon, authenticated, service_role;
grant INSERT on table public.task_links to anon;
grant SELECT on table public.task_links to anon;
grant UPDATE on table public.task_links to anon;
grant DELETE on table public.task_links to anon;
grant TRUNCATE on table public.task_links to anon;
grant REFERENCES on table public.task_links to anon;
grant TRIGGER on table public.task_links to anon;
grant MAINTAIN on table public.task_links to anon;
grant INSERT on table public.task_links to authenticated;
grant SELECT on table public.task_links to authenticated;
grant UPDATE on table public.task_links to authenticated;
grant DELETE on table public.task_links to authenticated;
grant TRUNCATE on table public.task_links to authenticated;
grant REFERENCES on table public.task_links to authenticated;
grant TRIGGER on table public.task_links to authenticated;
grant MAINTAIN on table public.task_links to authenticated;
grant INSERT on table public.task_links to service_role;
grant SELECT on table public.task_links to service_role;
grant UPDATE on table public.task_links to service_role;
grant DELETE on table public.task_links to service_role;
grant TRUNCATE on table public.task_links to service_role;
grant REFERENCES on table public.task_links to service_role;
grant TRIGGER on table public.task_links to service_role;
grant MAINTAIN on table public.task_links to service_role;

revoke all on table public.task_templates from anon, authenticated, service_role;
grant INSERT on table public.task_templates to anon;
grant SELECT on table public.task_templates to anon;
grant UPDATE on table public.task_templates to anon;
grant DELETE on table public.task_templates to anon;
grant TRUNCATE on table public.task_templates to anon;
grant REFERENCES on table public.task_templates to anon;
grant TRIGGER on table public.task_templates to anon;
grant MAINTAIN on table public.task_templates to anon;
grant INSERT on table public.task_templates to authenticated;
grant SELECT on table public.task_templates to authenticated;
grant UPDATE on table public.task_templates to authenticated;
grant DELETE on table public.task_templates to authenticated;
grant TRUNCATE on table public.task_templates to authenticated;
grant REFERENCES on table public.task_templates to authenticated;
grant TRIGGER on table public.task_templates to authenticated;
grant MAINTAIN on table public.task_templates to authenticated;
grant INSERT on table public.task_templates to service_role;
grant SELECT on table public.task_templates to service_role;
grant UPDATE on table public.task_templates to service_role;
grant DELETE on table public.task_templates to service_role;
grant TRUNCATE on table public.task_templates to service_role;
grant REFERENCES on table public.task_templates to service_role;
grant TRIGGER on table public.task_templates to service_role;
grant MAINTAIN on table public.task_templates to service_role;

revoke all on table public.tasks from anon, authenticated, service_role;
grant INSERT on table public.tasks to anon;
grant SELECT on table public.tasks to anon;
grant UPDATE on table public.tasks to anon;
grant DELETE on table public.tasks to anon;
grant TRUNCATE on table public.tasks to anon;
grant REFERENCES on table public.tasks to anon;
grant TRIGGER on table public.tasks to anon;
grant MAINTAIN on table public.tasks to anon;
grant INSERT on table public.tasks to authenticated;
grant SELECT on table public.tasks to authenticated;
grant UPDATE on table public.tasks to authenticated;
grant DELETE on table public.tasks to authenticated;
grant TRUNCATE on table public.tasks to authenticated;
grant REFERENCES on table public.tasks to authenticated;
grant TRIGGER on table public.tasks to authenticated;
grant MAINTAIN on table public.tasks to authenticated;
grant INSERT on table public.tasks to service_role;
grant SELECT on table public.tasks to service_role;
grant UPDATE on table public.tasks to service_role;
grant DELETE on table public.tasks to service_role;
grant TRUNCATE on table public.tasks to service_role;
grant REFERENCES on table public.tasks to service_role;
grant TRIGGER on table public.tasks to service_role;
grant MAINTAIN on table public.tasks to service_role;

revoke all on table public.time_off from anon, authenticated, service_role;
grant INSERT on table public.time_off to anon;
grant SELECT on table public.time_off to anon;
grant UPDATE on table public.time_off to anon;
grant DELETE on table public.time_off to anon;
grant TRUNCATE on table public.time_off to anon;
grant REFERENCES on table public.time_off to anon;
grant TRIGGER on table public.time_off to anon;
grant MAINTAIN on table public.time_off to anon;
grant INSERT on table public.time_off to authenticated;
grant SELECT on table public.time_off to authenticated;
grant UPDATE on table public.time_off to authenticated;
grant DELETE on table public.time_off to authenticated;
grant TRUNCATE on table public.time_off to authenticated;
grant REFERENCES on table public.time_off to authenticated;
grant TRIGGER on table public.time_off to authenticated;
grant MAINTAIN on table public.time_off to authenticated;
grant INSERT on table public.time_off to service_role;
grant SELECT on table public.time_off to service_role;
grant UPDATE on table public.time_off to service_role;
grant DELETE on table public.time_off to service_role;
grant TRUNCATE on table public.time_off to service_role;
grant REFERENCES on table public.time_off to service_role;
grant TRIGGER on table public.time_off to service_role;
grant MAINTAIN on table public.time_off to service_role;

revoke all on table public.users from anon, authenticated, service_role;
grant INSERT on table public.users to anon;
grant SELECT on table public.users to anon;
grant UPDATE on table public.users to anon;
grant DELETE on table public.users to anon;
grant TRUNCATE on table public.users to anon;
grant REFERENCES on table public.users to anon;
grant TRIGGER on table public.users to anon;
grant MAINTAIN on table public.users to anon;
grant INSERT on table public.users to authenticated;
grant SELECT on table public.users to authenticated;
grant UPDATE on table public.users to authenticated;
grant DELETE on table public.users to authenticated;
grant TRUNCATE on table public.users to authenticated;
grant REFERENCES on table public.users to authenticated;
grant TRIGGER on table public.users to authenticated;
grant MAINTAIN on table public.users to authenticated;
grant INSERT on table public.users to service_role;
grant SELECT on table public.users to service_role;
grant UPDATE on table public.users to service_role;
grant DELETE on table public.users to service_role;
grant TRUNCATE on table public.users to service_role;
grant REFERENCES on table public.users to service_role;
grant TRIGGER on table public.users to service_role;
grant MAINTAIN on table public.users to service_role;

alter publication supabase_realtime add table public.activity_log;

alter publication supabase_realtime add table public.notifications;

alter publication supabase_realtime add table public.project_messages;

alter publication supabase_realtime add table public.projects;

alter publication supabase_realtime add table public.requests;

alter publication supabase_realtime add table public.roles;
alter publication supabase_realtime add table public.task_assignees;

alter publication supabase_realtime add table public.task_checklist;

alter publication supabase_realtime add table public.task_comments;

alter publication supabase_realtime add table public.tasks;

-- security fixes added after the export (same as migrate_security_9.sql)

-- 1: members can only send the two kinds of request the app has, with only the fields each one needs
alter policy "make requests" on public.requests with check (
  requested_by = auth.uid() and status = 'pending'
  and ((kind = 'status' and new_status is not null and days is null)
    or (kind = 'extension' and days is not null and new_status is null))
  and new_priority is null and new_depends_on is null
  and decided_by is null and decided_at is null and decision_note = ''
  and exists (select 1 from tasks t where t.id = requests.task_id and t.project_id = requests.project_id)
  and is_assignee(task_id, auth.uid()));

-- and approving refuses any other kind, including ones already saved (denying still works)
create or replace function public.decide_request(
  request_id uuid, approve boolean, note text default '', new_dates jsonb default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  r requests%rowtype;
  moved int;
begin
  select * into r from requests where id = request_id and status = 'pending' for update;
  if not found or r.project_id not in (select my_admin_projects()) then
    raise exception 'Request not found or already decided'; end if;

  if approve then
    perform set_config('app.bypass', '1', true);
    if r.kind not in ('status', 'extension') then
      raise exception 'This kind of request is not supported. Deny it instead.';
    end if;
    if r.kind = 'status' then update tasks set status = r.new_status where id = r.task_id;
    elsif r.kind = 'extension' then
      -- an empty list is fine: a dependency can keep a task from moving earlier
      if new_dates is null or jsonb_typeof(new_dates) <> 'array' then
        raise exception 'The new dates are missing. Refresh the page and try again.';
      end if;
      -- only unfinished tasks of this project can move
      update tasks t set start_date = d.start_date, end_date = d.end_date
        from jsonb_to_recordset(new_dates) as d(id uuid, start_date date, end_date date)
        where t.id = d.id and t.project_id = r.project_id and t.status <> 'done';
      get diagnostics moved = row_count;
      if moved <> jsonb_array_length(new_dates) then
        raise exception 'Some tasks have changed. Refresh the page and try again.';
      end if;
    end if;
  end if;

  update requests set status = case when approve then 'approved' else 'denied' end,
    decided_at = now(), decided_by = auth.uid(), decision_note = left(coalesce(note, ''), 200)
    where id = request_id;
end $$;

-- 2: a person can send at most 5 requests for one task in 24 hours
create or replace function public.limit_requests() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- one at a time per person, so requests sent together cannot all slip under the limit
  perform pg_advisory_xact_lock(hashtext(new.requested_by::text));
  -- the time is set here, so nobody can send an old date to get around the limit
  new.created_at := now();
  if (select count(*) from requests where task_id = new.task_id and requested_by = new.requested_by
      and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'You sent 5 requests for this task in 24 hours. Try again later.';
  end if;
  return new;
end $$;

drop trigger if exists requests_limit on public.requests;
create trigger requests_limit before insert on public.requests
  for each row execute function public.limit_requests();

-- 3: deleting an account needs a password typed just now, checked by the database too
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  mine record;
  other record;
  heir uuid;
  pname text;
begin
  if me is null then raise exception 'Not logged in'; end if;
  -- the login must show a password typed in the last 5 minutes (the Profile page asks for it again)
  if not exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) a
    where a ->> 'method' = 'password'
      and (a ->> 'timestamp')::numeric > extract(epoch from now()) - 300) then
    raise exception 'Enter your password again, then delete your account.';
  end if;

  -- this is for two people of one project deleting at the same time: the second one waits
  perform 1 from projects where id in (select project_id from roles where user_id = me)
    order by id for update;

  -- this is for stopping before anything is deleted: the only admin of a project with other people
  select p.name into pname from roles r join projects p on p.id = r.project_id
    where r.user_id = me and r.role = 'admin'
      and exists (select 1 from roles o where o.project_id = r.project_id and o.user_id <> me)
      and not exists (select 1 from roles o
        where o.project_id = r.project_id and o.user_id <> me and o.role = 'admin')
    limit 1;
  if found then
    raise exception 'You are the only admin of "%". Make another person an admin first.', pname;
  end if;

  for mine in
    select r.project_id, r.is_owner, p.name from roles r join projects p on p.id = r.project_id
    where r.user_id = me
  loop
    if not exists (select 1 from roles where project_id = mine.project_id and user_id <> me) then
      delete from projects where id = mine.project_id;
      continue;
    end if;

    delete from roles where project_id = mine.project_id and user_id = me;
    heir := null;
    if mine.is_owner then
      select user_id into heir from roles
        where project_id = mine.project_id and role = 'admin' order by user_id limit 1;
      update roles set is_owner = true where project_id = mine.project_id and user_id = heir;
    end if;

    -- the messages leave out the name, because the account's name is being deleted
    for other in select user_id from roles where project_id = mine.project_id loop
      perform send_note(mine.project_id, other.user_id, 'team',
        case
          when other.user_id = heir then 'You are now the owner of "' || mine.name || '". The previous owner deleted their account.'
          when mine.is_owner then 'The owner of "' || mine.name || '" deleted their account. Another admin now owns it.'
          else 'A teammate in "' || mine.name || '" deleted their account.'
        end);
    end loop;
  end loop;

  delete from auth.users where id = me;
end $$;

-- 4: complete tasks are fully locked
create or replace function public.on_task_update() returns trigger
language plpgsql set search_path = public as $$
declare deps_changed boolean;
begin
  deps_changed := new.depends_on is distinct from old.depends_on
    and new.depends_on is distinct from existing_deps(old.depends_on);

  -- the app never moves a task to another project
  if new.project_id is distinct from old.project_id then
    raise exception 'A task cannot move to another project';
  end if;

  -- a done task is locked: every column, except the two cases below
  if old.status = 'done' and (
      to_jsonb(new) - 'assigned_to' - 'depends_on' is distinct from to_jsonb(old) - 'assigned_to' - 'depends_on'
      -- 1: dependencies only lose tasks that were deleted
      or deps_changed
      -- 2: the person is only cleared when their account is deleted
      or (new.assigned_to is distinct from old.assigned_to
          and not (new.assigned_to is null and not exists (select 1 from users where id = old.assigned_to)))) then
    raise exception 'This task is done, so it is locked';
  end if;

  if new.status is distinct from old.status then
    -- only an assignee changes the status (or an approved request, which sets app.bypass)
    if auth.uid() is not null and coalesce(current_setting('app.bypass', true), '') <> '1'
       and not is_assignee(new.id, auth.uid()) then
      raise exception 'Only a person assigned to this task can change its status';
    end if;
    -- it cannot start or finish before the tasks it waits for are done
    if new.status in ('progress', 'done') and exists (
      select 1 from tasks d where d.id = any(new.depends_on) and d.status <> 'done') then
      raise exception 'Finish the tasks this one depends on first';
    end if;
  end if;

  -- a task nobody has cannot change status, priority or dependencies (assigning someone is allowed)
  if old.assigned_to is null and new.assigned_to is null
     and not exists (select 1 from task_assignees where task_id = new.id)
     and (new.status is distinct from old.status or new.priority is distinct from old.priority
       or deps_changed) then
    raise exception 'Assign this task to someone first';
  end if;

  if new.status = 'done' and old.status <> 'done' then
    new.finished_at := now();
    new.percent_complete := 100;
  elsif new.status <> 'done' then
    new.finished_at := null;
  end if;
  return new;
end $$;

-- and a new task only has a finish time if it is complete
create or replace function public.on_task_insert() returns trigger
language plpgsql as $$
begin
  new.finished_at := case when new.status = 'done' then now() end;
  return new;
end $$;

-- 5: the app only gets the table permissions it uses (this also turns off writing to unused features)
revoke all on all tables in schema public from public, anon, authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert on public.requests to authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read) on public.notifications to authenticated;
grant select on public.users, public.projects, public.roles to authenticated;
grant update (name) on public.users to authenticated;
-- the task rules read this table while saving a task
grant select on public.task_assignees to authenticated;

-- unused functions, and helpers that logged out people never need
revoke execute on function public.set_baseline(uuid), public.mark_invites_emailed(text[])
  from public, anon, authenticated;
revoke execute on function public.existing_deps(uuid[]), public.on_task_insert(), public.set_first_owner(),
  public.check_assignee(), public.limit_email_invites(), public.drop_deleted_dependency(),
  public.limit_requests()
  from public, anon;
grant execute on function public.existing_deps(uuid[]) to authenticated;

commit;
