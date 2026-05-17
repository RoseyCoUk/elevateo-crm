-- Soarx CRM: full schema, RLS, helper functions, seed.
-- Apply this once in the Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type division_code as enum ('sales', 'marketing', 'technology', 'ecommerce', 'admin');
create type user_role as enum ('owner', 'executive', 'lead', 'member', 'reservist');
create type client_status as enum ('prospect', 'active', 'paused', 'archived');
create type project_status as enum ('planning', 'active', 'review', 'on_hold', 'completed', 'cancelled');
create type task_priority as enum ('low', 'normal', 'high', 'urgent');
create type task_status as enum ('todo', 'in_progress', 'blocked', 'review_pending', 'approved', 'rejected', 'done');
create type approval_status as enum ('pending', 'approved', 'rejected');
create type notification_type as enum (
  'task_assigned', 'task_mentioned', 'task_review_requested',
  'task_approved', 'task_rejected', 'comment_reply',
  'project_assigned', 'approval_pending'
);

-- ============================================================
-- DIVISIONS
-- ============================================================

create table divisions (
  id uuid primary key default gen_random_uuid(),
  code division_code unique not null,
  name text not null,
  description text,
  owner_id uuid,
  created_at timestamptz not null default now()
);

-- ============================================================
-- USERS (mirrors auth.users, adds hierarchy)
-- ============================================================

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  avatar_url text,
  division_id uuid references divisions(id) on delete set null,
  manager_id uuid references users(id) on delete set null,
  role user_role not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_division_idx on users(division_id);
create index users_manager_idx on users(manager_id);

-- Add owner_id FK now that users exists.
alter table divisions
  add constraint divisions_owner_fk
  foreign key (owner_id) references users(id) on delete set null;

-- ============================================================
-- CLIENTS
-- ============================================================

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  status client_status not null default 'prospect',
  primary_division_id uuid references divisions(id) on delete set null,
  account_lead_id uuid references users(id) on delete set null,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_status_idx on clients(status);
create index clients_lead_idx on clients(account_lead_id);

-- ============================================================
-- PROJECTS
-- ============================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  division_id uuid references divisions(id) on delete set null,
  lead_id uuid references users(id) on delete set null,
  title text not null,
  description text,
  status project_status not null default 'planning',
  start_date date,
  due_date date,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_idx on projects(client_id);
create index projects_division_idx on projects(division_id);
create index projects_lead_idx on projects(lead_id);
create index projects_status_idx on projects(status);

-- ============================================================
-- TASKS
-- ============================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  parent_task_id uuid references tasks(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references users(id) on delete set null,
  reviewer_id uuid references users(id) on delete set null,
  status task_status not null default 'todo',
  priority task_priority not null default 'normal',
  deadline timestamptz,
  blocked_by uuid references tasks(id) on delete set null,
  position integer not null default 0,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_project_idx on tasks(project_id);
create index tasks_assigned_idx on tasks(assigned_to);
create index tasks_reviewer_idx on tasks(reviewer_id);
create index tasks_status_idx on tasks(status);
create index tasks_deadline_idx on tasks(deadline);

-- ============================================================
-- TASK COMMENTS
-- ============================================================

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  body text not null,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index task_comments_task_idx on task_comments(task_id);

-- ============================================================
-- APPROVALS
-- ============================================================

create table approvals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  requested_by uuid references users(id) on delete set null,
  reviewer_id uuid not null references users(id) on delete cascade,
  status approval_status not null default 'pending',
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);

create index approvals_task_idx on approvals(task_id);
create index approvals_reviewer_idx on approvals(reviewer_id, status);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  task_id uuid references tasks(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on notifications(user_id, read_at);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  actor_id uuid references users(id) on delete set null,
  action text not null,
  diff jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_entity_idx on activity_log(entity_type, entity_id);

-- ============================================================
-- FILES
-- ============================================================

create table files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated before update on users
  for each row execute function set_updated_at();
create trigger clients_updated before update on clients
  for each row execute function set_updated_at();
create trigger projects_updated before update on projects
  for each row execute function set_updated_at();
create trigger tasks_updated before update on tasks
  for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER: auto-create users row on auth.users insert
-- ============================================================

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- HIERARCHY HELPER FUNCTIONS
-- ============================================================

-- Is the current user an admin (admin division OR owner role)?
create or replace function is_admin() returns boolean as $$
  select exists(
    select 1 from users u
    left join divisions d on d.id = u.division_id
    where u.id = auth.uid()
      and (u.role = 'owner' or d.code = 'admin')
  );
$$ language sql stable security definer;

-- Is the current user in the same division?
create or replace function in_division(div_id uuid) returns boolean as $$
  select exists(
    select 1 from users where id = auth.uid() and division_id = div_id
  );
$$ language sql stable security definer;

-- Returns true if target_user reports (directly or transitively) to current user.
create or replace function manages_user(target_user uuid) returns boolean as $$
  with recursive chain as (
    select id, manager_id from users where id = target_user
    union all
    select u.id, u.manager_id from users u
    join chain c on u.id = c.manager_id
  )
  select exists(select 1 from chain where manager_id = auth.uid());
$$ language sql stable security definer;

-- Current user's role.
create or replace function my_role() returns user_role as $$
  select role from users where id = auth.uid();
$$ language sql stable security definer;

-- ============================================================
-- RLS
-- ============================================================

alter table users enable row level security;
alter table divisions enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table approvals enable row level security;
alter table notifications enable row level security;
alter table activity_log enable row level security;
alter table files enable row level security;

-- DIVISIONS: everyone reads, only admin writes.
create policy divisions_read on divisions for select using (auth.uid() is not null);
create policy divisions_write on divisions for all using (is_admin()) with check (is_admin());

-- USERS: every authed user sees roster. Self or admin can update.
create policy users_read on users for select using (auth.uid() is not null);
create policy users_self_update on users for update
  using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());
create policy users_admin_insert on users for insert with check (is_admin());
create policy users_admin_delete on users for delete using (is_admin());

-- CLIENTS: any authed user reads. Members create, lead or admin updates.
create policy clients_read on clients for select using (auth.uid() is not null);
create policy clients_insert on clients for insert with check (auth.uid() is not null);
create policy clients_update on clients for update
  using (is_admin() or account_lead_id = auth.uid() or created_by = auth.uid())
  with check (is_admin() or account_lead_id = auth.uid() or created_by = auth.uid());
create policy clients_delete on clients for delete using (is_admin());

-- PROJECTS: any authed user reads. Lead/admin updates.
create policy projects_read on projects for select using (auth.uid() is not null);
create policy projects_insert on projects for insert with check (auth.uid() is not null);
create policy projects_update on projects for update
  using (is_admin() or lead_id = auth.uid() or created_by = auth.uid())
  with check (is_admin() or lead_id = auth.uid() or created_by = auth.uid());
create policy projects_delete on projects for delete using (is_admin());

-- TASKS: any authed reads. Assignee, reviewer, project lead, or admin can write.
create policy tasks_read on tasks for select using (auth.uid() is not null);
create policy tasks_insert on tasks for insert with check (auth.uid() is not null);
create policy tasks_update on tasks for update
  using (
    is_admin()
    or assigned_to = auth.uid()
    or reviewer_id = auth.uid()
    or created_by = auth.uid()
    or exists(select 1 from projects p where p.id = project_id and p.lead_id = auth.uid())
  )
  with check (
    is_admin()
    or assigned_to = auth.uid()
    or reviewer_id = auth.uid()
    or created_by = auth.uid()
    or exists(select 1 from projects p where p.id = project_id and p.lead_id = auth.uid())
  );
create policy tasks_delete on tasks for delete
  using (
    is_admin()
    or created_by = auth.uid()
    or exists(select 1 from projects p where p.id = project_id and p.lead_id = auth.uid())
  );

-- COMMENTS: read all, write own, delete own or admin.
create policy comments_read on task_comments for select using (auth.uid() is not null);
create policy comments_insert on task_comments for insert with check (auth.uid() = user_id);
create policy comments_update on task_comments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy comments_delete on task_comments for delete
  using (auth.uid() = user_id or is_admin());

-- APPROVALS: reviewer or task participant reads. Reviewer decides; requester creates.
create policy approvals_read on approvals for select using (auth.uid() is not null);
create policy approvals_insert on approvals for insert
  with check (requested_by = auth.uid() or is_admin());
create policy approvals_update on approvals for update
  using (reviewer_id = auth.uid() or is_admin())
  with check (reviewer_id = auth.uid() or is_admin());
create policy approvals_delete on approvals for delete using (is_admin());

-- NOTIFICATIONS: only owner reads / marks read.
create policy notifications_read on notifications for select using (user_id = auth.uid());
create policy notifications_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_insert on notifications for insert with check (auth.uid() is not null);
create policy notifications_delete on notifications for delete using (user_id = auth.uid() or is_admin());

-- ACTIVITY LOG: any authed user reads. Inserts allowed (server actions write).
create policy activity_read on activity_log for select using (auth.uid() is not null);
create policy activity_insert on activity_log for insert with check (auth.uid() is not null);

-- FILES: any authed user reads. Uploader or admin manages.
create policy files_read on files for select using (auth.uid() is not null);
create policy files_insert on files for insert with check (auth.uid() = uploaded_by);
create policy files_delete on files for delete using (uploaded_by = auth.uid() or is_admin());

-- ============================================================
-- TASK APPROVAL FLOW: enforce that "done" requires an approved approval row
-- ============================================================

create or replace function enforce_task_done_requires_approval() returns trigger as $$
declare
  has_approval boolean;
begin
  if new.status = 'done' and (old.status is distinct from 'done') then
    if new.reviewer_id is null then
      return new;
    end if;
    select exists(
      select 1 from approvals
      where task_id = new.id and status = 'approved'
    ) into has_approval;
    if not has_approval then
      raise exception 'Task cannot be marked done without an approved review.';
    end if;
    new.completed_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tasks_enforce_done before update on tasks
  for each row execute function enforce_task_done_requires_approval();

-- ============================================================
-- SEED: divisions
-- ============================================================

insert into divisions (code, name, description) values
  ('sales', 'Sales', 'Outbound, inbound, qualification, closing.'),
  ('marketing', 'Marketing', 'Creative, content, paid, brand.'),
  ('technology', 'Technology', 'Engineering, integrations, internal tooling.'),
  ('ecommerce', 'E-commerce', 'Stores, fulfilment, product ops.'),
  ('admin', 'Admin', 'Operations, people, finance, coordination.')
on conflict (code) do nothing;
