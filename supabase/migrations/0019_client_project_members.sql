create table if not exists client_members (
  client_id uuid not null references clients(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists client_members_user_idx on client_members(user_id);
create index if not exists project_members_user_idx on project_members(user_id);

alter table client_members enable row level security;
alter table project_members enable row level security;

drop policy if exists client_members_read on client_members;
drop policy if exists client_members_insert on client_members;
drop policy if exists client_members_delete on client_members;
drop policy if exists project_members_read on project_members;
drop policy if exists project_members_insert on project_members;
drop policy if exists project_members_delete on project_members;

create policy client_members_read on client_members for select using (auth.uid() is not null);
create policy client_members_insert on client_members for insert with check (
  is_admin()
  or exists(select 1 from clients c where c.id = client_id and (c.account_lead_id = auth.uid() or c.created_by = auth.uid()))
);
create policy client_members_delete on client_members for delete using (
  is_admin()
  or exists(select 1 from clients c where c.id = client_id and (c.account_lead_id = auth.uid() or c.created_by = auth.uid()))
);

create policy project_members_read on project_members for select using (auth.uid() is not null);
create policy project_members_insert on project_members for insert with check (
  is_admin()
  or exists(select 1 from projects p where p.id = project_id and (p.lead_id = auth.uid() or p.created_by = auth.uid()))
);
create policy project_members_delete on project_members for delete using (
  is_admin()
  or exists(select 1 from projects p where p.id = project_id and (p.lead_id = auth.uid() or p.created_by = auth.uid()))
);
