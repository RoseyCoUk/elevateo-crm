-- Announcements: admin posts seen by every active user.

alter type notification_type add value if not exists 'announcement';

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid references users(id) on delete set null,
  pinned boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists announcements_created_idx on announcements(created_at desc);

alter table announcements enable row level security;

create policy announcements_read on announcements for select
  using (auth.uid() is not null);

create policy announcements_insert on announcements for insert
  with check (is_admin());

create policy announcements_update on announcements for update
  using (is_admin())
  with check (is_admin());

create policy announcements_delete on announcements for delete
  using (is_admin());

-- Fanout helper: insert a notification row for every active user except the author.
create or replace function fanout_announcement(p_announcement_id uuid) returns void as $$
declare
  v_ann announcements%rowtype;
  v_actor uuid;
begin
  select * into v_ann from announcements where id = p_announcement_id;
  if not found then return; end if;
  v_actor := v_ann.author_id;

  insert into notifications (user_id, actor_id, type, title, body, link)
  select u.id,
         v_actor,
         'announcement'::notification_type,
         v_ann.title,
         v_ann.body,
         '/app'
  from public.users u
  where u.is_active = true
    and (v_actor is null or u.id <> v_actor);
end;
$$ language plpgsql security definer;

grant execute on function fanout_announcement(uuid) to authenticated;
