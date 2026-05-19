alter type chat_room_kind add value if not exists 'group';

alter table chat_rooms
  add column if not exists name text;

alter table chat_rooms
  drop constraint if exists chat_rooms_division_shape,
  drop constraint if exists chat_rooms_dm_shape,
  drop constraint if exists chat_rooms_group_shape;

alter table chat_rooms
  add constraint chat_rooms_division_shape check (
    (kind <> 'division') or
    (division_id is not null and user_a_id is null and user_b_id is null and name is null)
  ),
  add constraint chat_rooms_dm_shape check (
    (kind <> 'dm') or
    (division_id is null and user_a_id is not null and user_b_id is not null and user_a_id < user_b_id and name is null)
  ),
  add constraint chat_rooms_group_shape check (
    (kind <> 'group') or
    (division_id is null and user_a_id is null and user_b_id is null and name is not null)
  );

create unique index if not exists chat_rooms_group_name_unique
  on chat_rooms (lower(name))
  where kind = 'group';

create table if not exists chat_room_members (
  room_id uuid not null references chat_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists chat_room_members_user_idx on chat_room_members(user_id);

alter table chat_room_members enable row level security;

drop policy if exists chat_rooms_read on chat_rooms;
drop policy if exists chat_rooms_insert on chat_rooms;
drop policy if exists chat_rooms_delete on chat_rooms;
drop policy if exists chat_messages_read on chat_messages;
drop policy if exists chat_messages_insert on chat_messages;
drop policy if exists chat_messages_update on chat_messages;
drop policy if exists chat_messages_delete on chat_messages;
drop policy if exists chat_room_members_read on chat_room_members;
drop policy if exists chat_room_members_insert on chat_room_members;
drop policy if exists chat_room_members_delete on chat_room_members;

create or replace function can_access_room(p_room_id uuid) returns boolean as $$
  select exists(
    select 1
    from chat_rooms r
    left join users u on u.id = auth.uid()
    left join divisions d on d.id = r.division_id
    where r.id = p_room_id
      and (
        (r.kind = 'dm' and (r.user_a_id = auth.uid() or r.user_b_id = auth.uid()))
        or (r.kind = 'division' and (
              is_admin()
              or u.division_id = r.division_id
              or d.code = any(u.divisions)
            ))
        or (r.kind = 'group' and exists(
              select 1
              from chat_room_members m
              where m.room_id = r.id and m.user_id = auth.uid()
            ))
      )
  );
$$ language sql stable security definer;

create policy chat_rooms_read on chat_rooms for select using (
  can_access_room(id)
);

create policy chat_rooms_insert on chat_rooms for insert with check (
  is_admin()
  or (kind = 'dm' and (user_a_id = auth.uid() or user_b_id = auth.uid()))
);

create policy chat_rooms_delete on chat_rooms for delete using (
  is_admin()
  or (kind = 'dm' and (user_a_id = auth.uid() or user_b_id = auth.uid()))
);

create policy chat_room_members_read on chat_room_members for select using (
  can_access_room(room_id)
);

create policy chat_room_members_insert on chat_room_members for insert with check (
  is_admin()
);

create policy chat_room_members_delete on chat_room_members for delete using (
  is_admin()
);

create policy chat_messages_read on chat_messages for select
  using (can_access_room(room_id));
create policy chat_messages_insert on chat_messages for insert
  with check (auth.uid() = author_id and can_access_room(room_id));
create policy chat_messages_update on chat_messages for update
  using (can_access_room(room_id))
  with check (can_access_room(room_id));
create policy chat_messages_delete on chat_messages for delete
  using (author_id = auth.uid() or is_admin());

grant execute on function can_access_room(uuid) to authenticated;

insert into chat_rooms (kind, name)
select 'group', 'Elevateo'
where not exists (
  select 1 from chat_rooms where kind = 'group' and lower(name) = 'elevateo'
);

insert into chat_room_members (room_id, user_id)
select r.id, u.id
from chat_rooms r
join users u on u.is_active = true
where r.kind = 'group'
  and lower(r.name) = 'elevateo'
  and u.role in ('owner', 'executive', 'lead', 'member')
on conflict do nothing;
